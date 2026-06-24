from crewai import Task
from backend.app.agents.linkedin_profile_agent import get_linkedin_profile_agent

def get_linkedin_profile_task(linkedin_data: str, agent=None, llm=None) -> Task:
    """
    Returns a CrewAI Task designed to parse raw LinkedIn profile text/data
    into structured outputs.
    """
    if not agent:
        agent = get_linkedin_profile_agent(llm=llm)
        
    return Task(
        description=(
            f"Analyze the following raw LinkedIn profile data and structure it into a candidate profile:\n{linkedin_data}\n\n"
            "Extract: Full Name, Headline, About Section, Experience list, Education list, Certifications, "
            "Skills, Languages, Projects, Volunteer experiences, Recommendations, and Endorsements."
        ),
        expected_output=(
            "A structured JSON object with candidateProfile, skillsList, experienceList, "
            "educationList, and certificationsList."
        ),
        agent=agent
    )
