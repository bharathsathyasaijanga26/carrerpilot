from crewai import Agent

def get_matching_agent(llm=None) -> Agent:
    """
    Returns a CrewAI Agent that computes quantitative alignment and skill gap assessments.
    """
    return Agent(
        role="Strategic Alignment Assessor",
        goal="Analyze match score, find missing pre-requisites, highlight synergies, and evaluate alignment.",
        backstory=(
            "You are an expert HR generalist and career strategist. You dissect resumes alongside "
            "rigid job descriptions to report realistic scores and bridge key discrepancies."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
