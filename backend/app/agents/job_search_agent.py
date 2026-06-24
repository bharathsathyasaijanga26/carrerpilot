from crewai import Agent

def get_job_search_agent(llm=None, tools=None) -> Agent:
    """
    Returns a CrewAI Agent for real-time web and API job searches.
    """
    return Agent(
        role="Job Search Specialist",
        goal="Discover high-relevance tech, product, and leadership jobs from indexers and web channels.",
        backstory=(
            "You are an active scout who monitors job-boards, API syndicators, and community portals, "
            "tracking application criteria, hiring teams, and active job postings."
        ),
        verbose=True,
        llm=llm,
        tools=tools or [],
        memory=False
    )
