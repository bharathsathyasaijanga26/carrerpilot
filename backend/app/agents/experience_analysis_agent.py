from crewai import Agent

def get_experience_analysis_agent(llm=None) -> Agent:
    return Agent(
        role="Experience History Analyst",
        goal="Analyze the candidate's professional work experience timeline, extract role details, periods, key achievements, and identify companies worked.",
        backstory=(
            "You are a seasoned technical recruiter. You evaluate professional progression, map role transitions, "
            "and extract precise responsibilities and key metric accomplishments from work histories."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
