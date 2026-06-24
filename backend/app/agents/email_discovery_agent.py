from crewai import Agent

def get_email_discovery_agent(llm=None, tools=None) -> Agent:
    """
    Returns a CrewAI Agent that discovers key contact endpoints and email formats.
    """
    return Agent(
        role="Contact Researcher",
        goal="Discover, guess, and verify professional email contacts, active recruiters, and lead contacts.",
        backstory=(
            "You are a sales operations specialist and outbound developer. "
            "You are extremely effective at finding professional contact routes securely."
        ),
        verbose=True,
        llm=llm,
        tools=tools or [],
        memory=False
    )
