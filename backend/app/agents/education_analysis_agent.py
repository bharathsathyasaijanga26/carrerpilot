from crewai import Agent

def get_education_analysis_agent(llm=None) -> Agent:
    return Agent(
        role="Education Background Analyst",
        goal="Parse and structure all academic history, degrees earned, major fields of study, graduation dates, and institutions attended.",
        backstory=(
            "You are an academic credentials evaluator. You verify educational profiles, classifying "
            "academic degrees and matching institutions to standard taxonomies."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
