from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas import schemas
from backend.app.models import models
from backend.app.crews.job_application_crew import run_orchestration_crew

router = APIRouter()

@router.post("/upload", response_model=schemas.ResumeResponse)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Read text content
    try:
        bytes_content = await file.read()
        raw_text = bytes_content.decode("utf-8", errors="ignore")
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse upload stream: {str(err)}"
        )
    
    # Store record
    new_resume = models.Resume(
        user_id=1,  # Default User
        filename=file.filename,
        raw_text=raw_text,
        skills=["React", "TypeScript", "Python", "FastAPI"],
        parsed_profile={
            "summary": "Full stack engineer proficient in robust web orchestration.",
            "education": "BS in Computer Science",
            "experience_years": 5
        }
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    return new_resume

@router.post("/kickoff-crew", response_model=schemas.CrewRunResponse)
def kickoff_ai_agent_crew(req: schemas.CrewRunRequest, db: Session = Depends(get_db)):
    # Check if resume exists
    resume = db.query(models.Resume).filter(models.Resume.id == req.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Selected profile resume is not found.")

    try:
        # Running the Sequential CrewAI Agent structure
        crew_result = run_orchestration_crew(
            resume_text=resume.raw_text,
            target_job_title=req.job_title,
            target_company_name=req.company_name,
            recipient_name=req.recipient_name or "Hiring Lead",
            days_since_application=req.days_since_application or 5
        )
        return schemas.CrewRunResponse(
            success=True,
            match_score=crew_result["match_score"],
            skills_alignment=crew_result["skills_alignment"],
            email_draft_subject=crew_result["email_draft_subject"],
            email_draft_body=crew_result["email_draft_body"],
            company_news_highlights=crew_result["company_news_highlights"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CrewAI orchestration execution encountered an error: {str(e)}"
        )
