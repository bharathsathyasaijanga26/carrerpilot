from crewai import Agent

def get_followup_agent(llm=None) -> Agent:
    """
    Returns a CrewAI Agent specifically crafted for scheduling and drafting structured follow-up sequences.
    """
    return Agent(
        role="Follow-Up Agent",
        goal="Generate personalized, highly effective follow-up correspondence sequences for 3-day, 7-day, and 14-day milestones.",
        backstory=(
            "You are a professional outreach strategist and relationship manager. You design precise, non-spammy follow-up "
            "sequences that remain polite, helpful, and value-additive, maintaining active momentum on job applications "
            "while respecting recruiter bandwidth."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
