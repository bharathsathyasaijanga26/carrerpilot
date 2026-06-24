from crewai import Agent

def get_application_draft_agent(llm=None) -> Agent:
    """
    Returns a CrewAI Agent that drafts personalized outreach communications.
    """
    return Agent(
        role="Outreach Copywriter",
        goal="Draft professional, polite, compelling, and brief outreach letters and emails.",
        backstory=(
            "You are an elegant professional communicator with a deep rejection of cliché, corporate-speak, "
            "and generic robotic boilerplate. Your messaging remains punchy, tailored, and humble."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
