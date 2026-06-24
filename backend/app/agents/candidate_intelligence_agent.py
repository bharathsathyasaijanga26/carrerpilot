from crewai import Agent

def get_candidate_intelligence_agent(llm=None) -> Agent:
    return Agent(
        role="Candidate Profile Intelligence Specialist",
        goal="Generate a professional scoring summary, ATS summary assessment, profile completeness score, career timeline analysis, and skill matrices.",
        backstory=(
            "You are an expert HR analyst and candidate matching algorithm designer. You evaluate "
            "candidate data to assess profile strengths, gaps, ATS match compatibility, and job readiness."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
