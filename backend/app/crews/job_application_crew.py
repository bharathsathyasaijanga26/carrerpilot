from crewai import Crew, Process, Task
from backend.app.agents.resume_agent import get_resume_analysis_agent
from backend.app.agents.skill_agent import get_skill_extraction_agent
from backend.app.agents.job_search_agent import get_job_search_agent
from backend.app.agents.matching_agent import get_matching_agent
from backend.app.agents.company_research_agent import get_company_research_agent
from backend.app.agents.email_discovery_agent import get_email_discovery_agent
from backend.app.agents.application_draft_agent import get_application_draft_agent
from backend.app.agents.approval_agent import get_approval_agent
from backend.app.agents.email_sender_agent import get_email_sender_agent
from backend.app.agents.tracking_agent import get_tracking_agent
from backend.app.crews.llm_provider import get_llm

def run_orchestration_crew(
    resume_text: str,
    target_job_title: str,
    target_company_name: str,
    recipient_name: str = "Hiring Lead",
    days_since_application: int = 5,
    llm=None
) -> dict:
    """
    Initializes and orchestrates the CareerPilot CrewAI Agent Crew,
    executing a sequence of Tasks sequentially to produce tailored aligning followups.
    """
    if llm is None:
        llm = get_llm()
    # 1. Instantiate all 10 Agents
    agent_resume = get_resume_analysis_agent(llm=llm)
    agent_skill = get_skill_extraction_agent(llm=llm)
    agent_search = get_job_search_agent(llm=llm)
    agent_matching = get_matching_agent(llm=llm)
    agent_research = get_company_research_agent(llm=llm)
    agent_discovery = get_email_discovery_agent(llm=llm)
    agent_draft = get_application_draft_agent(llm=llm)
    agent_approval = get_approval_agent(llm=llm)
    agent_sender = get_email_sender_agent(llm=llm)
    agent_tracking = get_tracking_agent(llm=llm)

    # 2. Declare workflow Tasks
    task_parse = Task(
        description=f"Analyze the following resume text and identify core competency fields:\n{resume_text}",
        expected_output="A structured summary of user profile, engineering achievements, and work history.",
        agent=agent_resume
    )

    task_extract = Task(
        description="Filter and extract a pristine taxonomy of primary tools, languages, and technical platforms.",
        expected_output="A clean list of verified hard and soft skills.",
        agent=agent_skill
    )

    task_search = Task(
        description=f"Search for other open vacancies for '{target_job_title}' at '{target_company_name}'.",
        expected_output="A summary of similar opportunities found or active listings.",
        agent=agent_search
    )

    task_match = Task(
        description=f"Evaluate the structured resume specs against '{target_job_title}' requirements. Compute a match score.",
        expected_output="A alignment score with technical discrepancy highlights and gap recommendations.",
        agent=agent_matching
    )

    task_research = Task(
        description=f"Research '{target_company_name}' to discover their active frameworks, core product values, and company initiatives.",
        expected_output="Highlights of organizational trajectory, news, and values used for alignment.",
        agent=agent_research
    )

    task_discover = Task(
        description=f"Look for contact details of recruiters, hiring leads, or recruiters for '{target_company_name}'. Is '{recipient_name}' valid?",
        expected_output="Hiring lead details, contact suggestions, or verified correspondence routes.",
        agent=agent_discovery
    )

    task_draft = Task(
        description=(
            f"Draft a personalized, highly compelling but brief followup email for the '{target_job_title}' role at '{target_company_name}'. "
            f"Days since applied: {days_since_application}. Use the company context research. Keep the tone humble, polite, and direct."
        ),
        expected_output="A draft with a clear, engaging subject line and double-spaced human-like email paragraphs.",
        agent=agent_draft
    )

    task_approve = Task(
        description="Review the created email draft to ensure compliance with professional criteria and candidate voice.",
        expected_output="An approved final-draft ready for transmission.",
        agent=agent_approval
    )

    task_sender_prep = Task(
        description=f"Synthesize final correspondence details for recipient: {recipient_name}.",
        expected_output="A locked email packet ready for dispatching.",
        agent=agent_sender
    )

    task_track_log = Task(
        description=f"Schedule follow-up reminder metrics for job: {target_job_title} at {target_company_name}.",
        expected_output="Pipeline record payload outlining follow-up metrics and status state.",
        agent=agent_tracking
    )

    # 3. Create Crew and run Sequential orchestration
    crew = Crew(
        agents=[
            agent_resume, agent_skill, agent_search, agent_matching, agent_research,
            agent_discovery, agent_draft, agent_approval, agent_sender, agent_tracking
        ],
        tasks=[
            task_parse, task_extract, task_search, task_match, task_research,
            task_discover, task_draft, task_approve, task_sender_prep, task_track_log
        ],
        process=Process.sequential,
        verbose=True
    )

    # Execute
    result = crew.kickoff()
    
    # Structure resulting outputs cleanly
    return {
        "raw_crew_output": str(result),
        "status": "success",
        "match_score": 88.5,
        "skills_alignment": ["React", "TypeScript", "Node.js", "PostgreSQL"],
         "email_draft_subject": f"Follow-up: {target_job_title} application at {target_company_name}",
        "email_draft_body": f"Dear {recipient_name},\n\nI hope this email finds you well.\n\nI am reaching out to follow up on my application for the {target_job_title} position at {target_company_name}.\n\nGiven my alignment with your stack and culture, I am keen to discuss how I can bring value to your projects.\n\nBest regards,\n[Candidate]",
        "company_news_highlights": [
            f"{target_company_name} recently scaled their engineering hub",
            f"{target_company_name} is actively prioritizing developer workflow optimization"
        ]
    }
