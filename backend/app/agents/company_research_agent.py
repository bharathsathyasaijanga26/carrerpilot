from crewai import Agent

def get_company_research_agent(llm=None, tools=None) -> Agent:
    """
    Returns a CrewAI Agent that gathers intelligence on hiring organization structures and initiatives.
    """
    return Agent(
        role="Corporate Intelligence Agent",
        goal="Gather, synthesize, and compile business profiles, tech stacks, press highlights, and work cultures.",
        backstory=(
            "You are an investigative business reporter and venture capitalist researcher. "
            "You know how to discover exactly what products companies are prioritizing to optimize user pitches."
        ),
        verbose=True,
        llm=llm,
        tools=tools or [],
        memory=False
    )
