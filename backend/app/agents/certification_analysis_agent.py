from crewai import Agent

def get_certification_analysis_agent(llm=None) -> Agent:
    return Agent(
        role="Certification & Credentials Analyst",
        goal="Identify, clean, and map professional credentials, industry certifications, licenses, and badges to standard certifications.",
        backstory=(
            "You are a professional credentialing analyst. You specialize in identifying official "
            "industry certifications (e.g. AWS, GCP, Azure, PMP) and tracking their technical fields."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
