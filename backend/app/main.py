import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config.settings import settings
from backend.app.api import auth, linkedin, migrated_endpoints
from backend.app.database.session import engine, Base, SessionLocal
from backend.app.models import models

# Create tables on startup (if not using Alembic for production)
Base.metadata.create_all(bind=engine)

# Seed default user on startup if not present
db = SessionLocal()
try:
    default_user = db.query(models.User).filter(models.User.id == 1).first()
    if not default_user:
        user = models.User(
            id=1,
            email="default@careerpilot.ai",
            hashed_password="dummy_password_hash",
            full_name="Default User",
            is_active=True
        )
        db.add(user)
        db.commit()
except Exception as e:
    print(f"Error seeding default user: {e}")
finally:
    db.close()

# Seed default jobs and applications if not present in the DB
db = SessionLocal()
try:
    # Check if we have jobs seeded
    jobs_count = db.query(models.Job).count()
    if jobs_count == 0:
        print("[INFO] Seeding database with default jobs...")
        seed_jobs = [
            models.Job(
                id=1,
                title="Senior Full Stack Engineer",
                company="Razorpay",
                base_salary="₹24,00,000 - ₹35,00,000 LPA",
                location="Bengaluru, Karnataka (Hybrid)",
                description="Build premium merchant dashboard experiences and robust APIs for high-volume transactions. Require 5+ years of experience with React, Node.js, and TypeScript. Experience with payment plumbing and SQL databases is a plus.",
                url="https://razorpay.com/jobs",
                extracted_skills_needed=["React", "TypeScript", "Node.js", "SQL"]
            ),
            models.Job(
                id=2,
                title="Frontend Developer (React)",
                company="CRED",
                base_salary="₹18,00,000 - ₹28,00,000 LPA",
                location="Bengaluru, Karnataka (Onsite)",
                description="Work on credit-line products, user interfaces, and fintech widgets. Looking for a React enthusiast with pristine design aesthetic, knowledge of Tailwind CSS, micro-interactions, and high performance canvas frameworks.",
                url="https://cred.club/careers",
                extracted_skills_needed=["React", "TypeScript", "Tailwind CSS", "Framer Motion"]
            ),
            models.Job(
                id=3,
                title="AI Integrations Engineer",
                company="Tata Consultancy Services (TCS)",
                base_salary="₹15,00,000 - ₹22,00,000 LPA",
                location="Hyderabad, Telangana (Hybrid)",
                description="Develop enterprise AI conversational agents and orchestration pipelines. Spearhead multi-agent workflows, prompt design modules, and vector search. Requires React, Python, FastAPI and LLM integration engineering.",
                url="https://tcs.com/careers",
                extracted_skills_needed=["React", "Python", "FastAPI", "LLM"]
            ),
            models.Job(
                id=4,
                title="Software Engineer (Platforms)",
                company="Zoho Corporation",
                base_salary="₹12,00,000 - ₹18,00,000 LPA",
                location="Chennai, Tamil Nadu (Onsite)",
                description="Build ultra-responsive web modules and core collaboration systems. Requires standard expertise with React, Node.js, WebSockets, real-time message sync, and elegant pixel-perfect design practices.",
                url="https://zoho.com/careers",
                extracted_skills_needed=["React", "Node.js", "WebSockets"]
            ),
            models.Job(
                id=5,
                title="Full Stack Engineer",
                company="Jio Platforms",
                base_salary="₹20,00,000 - ₹30,00,000 LPA",
                location="Mumbai, Maharashtra (Hybrid)",
                description="Develop scalable micro-frontends and robust Node.js GraphQL schemas. Collaborate closely with product and platform infrastructure teams to build highly responsive, highly loaded consumer-facing layouts.",
                url="https://jio.com/careers",
                extracted_skills_needed=["React", "Node.js", "GraphQL"]
            )
        ]
        # Attach additional fields using setattr since models might not declare them
        for j in seed_jobs:
            setattr(j, "openDate", "2026-06-10")
            setattr(j, "closingDate", "2026-07-25")
            setattr(j, "applyLink", j.url)
            setattr(j, "contactInfo", "talent@recruitment.com")
            db.add(j)
        db.commit()

    # Check if we have applications seeded
    apps_count = db.query(models.Application).count()
    if apps_count == 0:
        print("[INFO] Seeding database with default applications...")
        seed_apps = [
            models.Application(
                id=1,
                user_id=1,
                job_title="Frontend Developer (React)",
                company="CRED",
                status="Applied",
                salary_range="Bengaluru, Karnataka (Onsite)",
                recipient_name="CRED Recruiting Lead",
                recipient_email="talent@cred.club",
                follow_up_reminder_date="2026-06-20",
                auto_generated_draft_body="Dear Hiring Team at CRED,\n\nI am thrilled to apply for the Frontend Developer position..."
            ),
            models.Application(
                id=2,
                user_id=1,
                job_title="Senior Full Stack Engineer",
                company="Razorpay",
                status="Saved",
                salary_range="Bengaluru, Karnataka (Hybrid)",
                recipient_name="Razorpay HR Admin",
                recipient_email="hiring@razorpay.com",
                auto_generated_draft_body="Dear hiring team at Razorpay, representing my full stack alignment for your Senior Full Stack Engineer opening..."
            ),
            models.Application(
                id=3,
                user_id=1,
                job_title="Software Engineer (Platforms)",
                company="Zoho Corporation",
                status="Interview",
                salary_range="Chennai, Tamil Nadu (Onsite)",
                recipient_name="Zoho Careers Platform",
                recipient_email="recruitment@zoho.com",
                auto_generated_draft_body="Dear Zoho hiring recruiters, presenting my skills in platforms and frameworks alignment..."
            )
        ]
        for a in seed_apps:
            setattr(a, "outreachEmail", "Hi, I just applied for the role! Let's connect.")
            setattr(a, "followUpDays", 5)
            setattr(a, "followUpCompleted", False)
            setattr(a, "followUpNotes", "")
            db.add(a)
        db.commit()
except Exception as e:
    print(f"Error seeding jobs/applications: {e}")
finally:
    db.close()

app = FastAPI(
    title="CareerPilot AI - CrewAI Backend",
    description="Product-grade FastAPI & CrewAI career orchestration agent backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(linkedin.router, prefix="/api/linkedin", tags=["LinkedIn Intelligence"])
app.include_router(migrated_endpoints.router, prefix="/api", tags=["Migrated Endpoints"])

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "CareerPilot CrewAI Orchestration Engine",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=3000, reload=True)
