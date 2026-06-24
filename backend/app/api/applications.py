from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.database.session import get_db
from backend.app.schemas import schemas
from backend.app.models import models

router = APIRouter()

@router.get("/", response_model=List[schemas.ApplicationResponse])
def get_applications(db: Session = Depends(get_db)):
    # In production, we yield records associated with the logged-in user
    return db.query(models.Application).all()

@router.post("/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(app_in: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    new_app = models.Application(
        user_id=1,  # Default fallback user
        job_title=app_in.job_title,
        company=app_in.company,
        status=app_in.status or "Saved",
        source_url=app_in.source_url,
        salary_range=app_in.salary_range,
        recipient_name=app_in.recipient_name,
        recipient_email=app_in.recipient_email,
        follow_up_reminder_date=app_in.follow_up_reminder_date,
        is_notified=False
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.put("/{app_id}", response_model=schemas.ApplicationResponse)
def update_application(app_id: int, app_in: schemas.ApplicationUpdate, db: Session = Depends(get_db)):
    db_app = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = app_in.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(db_app, key, val)
        
    db.commit()
    db.refresh(db_app)
    return db_app

@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(app_id: int, db: Session = Depends(get_db)):
    db_app = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(db_app)
    db.commit()
    return None
