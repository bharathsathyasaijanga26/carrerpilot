from crewai import Agent

def get_tracking_agent(llm=None) -> Agent:
    """
    Returns a CrewAI Agent that reviews, logs, and schedules upcoming reminders for tracked applications.
    """
    return Agent(
        role="Pipeline Tracker",
        goal="Log active application timelines, flag past-due reminders, and suggest status updates.",
        backstory=(
            "You are a database and project manager. You maintain clean application logs, "
            "review feedback response times, and keep the user's career dashboard synchronized."
         ),
        verbose=True,
        llm=llm,
        memory=False
    )
