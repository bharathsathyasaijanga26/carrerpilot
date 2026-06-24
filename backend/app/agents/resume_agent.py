from crewai import Agent

def get_resume_analysis_agent(llm=None) -> Agent:
    """
    Returns a CrewAI Agent specifically crafted for Deep Resume Parsing and Profiling.
    """
    return Agent(
        role="Resume Analyzer",
        goal="Extract, structure, and profile unstructured resume texts into highly categorized talent specs.",
        backstory=(
            "As an elite, corporate technical headhunter and professional talent assessor, "
            "you possess key expertise in finding latent talent markers, understanding rich career paths, "
            "and formalizing unstructured documents into machine-parsable professional specs."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
