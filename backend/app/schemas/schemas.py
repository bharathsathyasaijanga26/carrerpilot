from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ResumeResponse(BaseModel):
    id: int
    filename: str
    skills: Optional[List[str]] = []
    parsed_profile: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationBase(BaseModel):
    job_title: str
    company: str
    status: Optional[str] = "Saved"
    source_url: Optional[str] = None
    salary_range: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    follow_up_reminder_date: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    follow_up_reminder_date: Optional[str] = None
    auto_generated_draft_body: Optional[str] = None

class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    ai_summary_profile: Optional[str] = None
    auto_generated_draft_body: Optional[str] = None
    is_notified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CrewRunRequest(BaseModel):
    resume_id: int
    job_title: str
    company_name: str
    recipient_name: Optional[str] = None
    days_since_application: Optional[int] = 5

class CrewRunResponse(BaseModel):
    success: bool
    match_score: float
    skills_alignment: List[str]
    email_draft_subject: str
    email_draft_body: str
    company_news_highlights: List[str]
    warnings_or_blockers: Optional[str] = None
