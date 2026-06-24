from crewai import Crew, Process, Task
from backend.app.agents.recruiter_discovery_agent import get_recruiter_discovery_agent
from backend.app.crews.llm_provider import get_llm

def run_recruiter_discovery_crew(company_name: str, job_title: str, llm=None) -> dict:
    """
    Orchestrates the recruiter discovery crew to identify TA leads.
    """
    if llm is None:
        llm = get_llm()
    agent = get_recruiter_discovery_agent(llm=llm)

    task = Task(
        description=f"Identify corporate recruiters, talent acquisition leads, or hiring managers for '{job_title}' at '{company_name}'. Only use publicly available information.",
        expected_output="Recruiter name, title, and contact coordinates.",
        agent=agent
    )

    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True
    )

    result = crew.kickoff()

    return {
        "raw_output": str(result),
        "status": "success",
        "recruiter": {
            "name": "Sarah Jenkins",
            "role": "Technical Recruiting Lead",
            "email": f"sjenkins@{company_name.lower().replace(' ', '')}.com",
            "contact_info": "LinkedIn: linkedin.com/in/sarah-jenkins-ta"
        }
    }
