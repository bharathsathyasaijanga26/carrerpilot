from crewai import Agent

def get_candidate_profile_builder_agent(llm=None) -> Agent:
    return Agent(
        role="Candidate Profile Synthesizer",
        goal="Consolidate all parsed sections of the profile (about, experience, education, skills, certifications) into a unified JSON format matching database structures.",
        backstory=(
            "You are a schema architect. You excel at taking descriptive analysis blocks "
            "and formatting them into structured, database-compatible schemas."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
