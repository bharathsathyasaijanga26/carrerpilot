from crewai import Agent

def get_email_sender_agent(llm=None, tools=None) -> Agent:
    """
    Returns a CrewAI Agent that interfaces with local or cloud email delivery services.
    """
    return Agent(
        role="Digital Dispatcher",
        goal="Ensure polished drafts are formatted perfectly inside mail agents, validating recipient parameters.",
        backstory=(
            "You are a reliable message controller. You make sure communications are checked "
            "for structural integrity before sending through safe channels."
        ),
        verbose=True,
        llm=llm,
        tools=tools or [],
        memory=False
    )
