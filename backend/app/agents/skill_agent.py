from crewai import Agent

def get_skill_extraction_agent(llm=None) -> Agent:
    """
    Returns a CrewAI Agent specifically crafted for Technical Skill Extraction and Taxonomy mapping.
    """
    return Agent(
        role="Skill Taxonomy Mapper",
        goal="Extract granular tech skills, software libraries, methodologies, and map them to standard industry roles.",
        backstory=(
            "You are a specialized ontology engineer in technical human resource domains. "
            "You know how to map raw phrases to standard industry skill classifications and technical standards."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
