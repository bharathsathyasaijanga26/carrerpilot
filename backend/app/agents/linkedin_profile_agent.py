from crewai import Agent

def get_linkedin_profile_agent(llm=None) -> Agent:
    return Agent(
        role="LinkedIn Profile Analyzer",
        goal="Extract, structure, and organize the candidate's core profile details (Full Name, Headline, About Summary, Projects, Languages, recommendations, Location, and Industry).",
        backstory=(
            "You are a meticulous technical data extraction specialist. You parse raw, authenticated "
            "LinkedIn profile structures and filter out noise, organizing details strictly based on the actual input data."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )
