from crewai import Crew, Process, Task
from backend.app.agents.followup_agent import get_followup_agent
from backend.app.crews.llm_provider import get_llm

def run_followup_crew(company_name: str, job_title: str, candidate_name: str, stage: str, llm=None) -> dict:
    """
    Runs the follow-up agent crew to generate email bodies for 3-day, 7-day, and 14-day check-ins.
    """
    if llm is None:
        llm = get_llm()
    agent = get_followup_agent(llm=llm)

    task = Task(
        description=(
            f"Draft a series of follow-up outreach messages for candidate '{candidate_name}' who applied "
            f"for '{job_title}' at '{company_name}'. Stage: '{stage}'. Create 3-day, 7-day, and 14-day versions."
        ),
        expected_output="Three structured outreach templates for different timelines.",
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
        "templates": {
            "three_day": (
                f"Subject: Following up: {job_title} application - {candidate_name}\n\n"
                f"Hi Hiring Team,\n\n"
                f"I'm writing to briefly check in on my application for the {job_title} role at {company_name}.\n\n"
                f"Please let me know if there are any details I can provide. Thank you!\n\n"
                f"Best,\n{candidate_name}"
            ),
            "seven_day": (
                f"Subject: Application Check-in: {job_title} - {candidate_name}\n\n"
                f"Hi Sourcing Team,\n\n"
                f"I wanted to follow up on the {job_title} application. I remain very excited about "
                f"{company_name}'s products and culture.\n\n"
                f"Warm regards,\n{candidate_name}"
            ),
            "fourteen_day": (
                f"Subject: Application Follow-up: {job_title} - {candidate_name}\n\n"
                f"Hi Recruitment Lead,\n\n"
                f"Hope your week is going well. I'm reaching out once more regarding my interest in the "
                f"{job_title} position. Let me know if we can sync up.\n\n"
                f"Best,\n{candidate_name}"
            )
        }
    }
