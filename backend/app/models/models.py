import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="owner", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="owner", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    raw_text = Column(String, nullable=False)
    skills = Column(JSON, nullable=True)  # List of primary extracted skills
    parsed_profile = Column(JSON, nullable=True)  # Structured profile from Resume Analysis Agent
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="resumes")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    extracted_skills_needed = Column(JSON, nullable=True)  # List of skills
    base_salary = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    status = Column(String, default="Saved")  # Saved, Applied, Under Review, Interview, Offer, Rejected
    source_url = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    recipient_name = Column(String, nullable=True)
    recipient_email = Column(String, nullable=True)
    follow_up_reminder_date = Column(String, nullable=True)
    ai_summary_profile = Column(Text, nullable=True)
    auto_generated_draft_body = Column(Text, nullable=True)
    is_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="applications")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(String, nullable=False)  # e.g., "SKILL_EXTRACTED", "CREW_MATCHED", "EMAIL_DRAFTED"
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="analytics")


class LinkedInProfile(Base):
    __tablename__ = "linkedin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profile_url = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    headline = Column(String, nullable=True)
    about = Column(Text, nullable=True)
    languages = Column(JSON, nullable=True)
    projects = Column(JSON, nullable=True)
    awards = Column(JSON, nullable=True)
    volunteer_experience = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    endorsements = Column(JSON, nullable=True)
    oauth_access_token = Column(String, nullable=True)
    oauth_token_expiry = Column(DateTime, nullable=True)
    oauth_refresh_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    skills = relationship("LinkedInSkill", back_populates="profile", cascade="all, delete-orphan")
    experience = relationship("LinkedInExperience", back_populates="profile", cascade="all, delete-orphan")
    education = relationship("LinkedInEducation", back_populates="profile", cascade="all, delete-orphan")
    certifications = relationship("LinkedInCertification", back_populates="profile", cascade="all, delete-orphan")


class LinkedInSkill(Base):
    __tablename__ = "linkedin_skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("linkedin_profiles.id"), nullable=False)
    skill_name = Column(String, nullable=False)

    profile = relationship("LinkedInProfile", back_populates="skills")


class LinkedInExperience(Base):
    __tablename__ = "linkedin_experience"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("linkedin_profiles.id"), nullable=False)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    period = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    profile = relationship("LinkedInProfile", back_populates="experience")


class LinkedInEducation(Base):
    __tablename__ = "linkedin_education"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("linkedin_profiles.id"), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=True)
    year = Column(String, nullable=True)

    profile = relationship("LinkedInProfile", back_populates="education")


class LinkedInCertification(Base):
    __tablename__ = "linkedin_certifications"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("linkedin_profiles.id"), nullable=False)
    name = Column(String, nullable=False)

    profile = relationship("LinkedInProfile", back_populates="certifications")


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)
    experience = Column(JSON, nullable=True)
    education = Column(JSON, nullable=True)
    certifications = Column(JSON, nullable=True)
    linkedin_user_id = Column(String, nullable=True)
    projects = Column(JSON, nullable=True)
    languages = Column(JSON, nullable=True)
    industry = Column(String, nullable=True)
    career_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CandidateProfileMerge(Base):
    __tablename__ = "candidate_profile_merges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    linkedin_profile_id = Column(Integer, ForeignKey("linkedin_profiles.id"), nullable=True)
    unified_profile_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=True)
    missing_information_report = Column(JSON, nullable=True)
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RecruiterContact(Base):
    __tablename__ = "recruiter_contacts"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    email = Column(String, nullable=True)
    contact_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class FollowUpTracking(Base):
    __tablename__ = "followup_tracking"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    follow_up_type = Column(String, nullable=False)  # "3-day", "7-day", "14-day"
    scheduled_date = Column(String, nullable=False)
    email_body = Column(Text, nullable=True)
    status = Column(String, default="Scheduled")  # "Scheduled", "Approved", "Sent"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

