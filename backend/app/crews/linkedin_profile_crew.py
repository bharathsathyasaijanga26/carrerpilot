from crewai import Crew, Process, Task, Agent, LLM
from backend.app.agents.linkedin_profile_agent import get_linkedin_profile_agent
from backend.app.agents.skill_agent import get_skill_extraction_agent
from backend.app.config.settings import settings
from backend.app.crews.llm_provider import get_llm
import os
import json
import re


def parse_crew_json(output_str: str) -> dict:
    """
    Helper to extract and parse JSON block from the LLM text output.
    """
    cleaned = output_str.strip()
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
        
    # Regex match for markdown json blocks
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
            
    # Brute force search for brackets
    start = cleaned.find('{')
    end = cleaned.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(cleaned[start:end+1])
        except json.JSONDecodeError:
            pass
            
    raise ValueError(f"Unable to parse structured JSON from output: {output_str}")

def run_linkedin_crew(profile_data: dict, llm=None) -> dict:
    """
    Initializes and runs the real multi-agent CrewAI pipeline:
    LinkedIn Profile Data -> LinkedIn Profile Agent -> Skill Extraction Agent -> Profile Builder Agent -> Return Real Results
    """
    if llm is None:
        llm = get_llm()

    # 1. Instantiate the three agents
    profile_agent = get_linkedin_profile_agent(llm=llm)
    skill_agent = get_skill_extraction_agent(llm=llm)
    
    # Define Profile Builder Agent
    builder_agent = Agent(
        role="Candidate Profile Synthesizer",
        goal="Format, structure, and organize extracted candidate profiles, skills, and timelines into conforming schemas.",
        backstory=(
            "You are a master data engineer and schema validation parser. You excel at taking raw analytical text "
            "and formatting it into exact valid JSON objects conforming to database models."
        ),
        verbose=True,
        llm=llm,
        memory=False
    )

    # 2. Declare sequential tasks
    task_extract_profile = Task(
        description=(
            f"Analyze the following structured raw LinkedIn profile JSON data returned from the data provider API:\n{json.dumps(profile_data, indent=2)}\n\n"
            "Extract, clean, and organize the following details: Full Name, Headline, About Section, experience timeline, "
            "education list, certifications, projects, spoken languages, volunteer experience, recommendations, and endorsements.\n\n"
            "Do not simulate or generate details. Only extract and clean the real details provided in the JSON data."
        ),
        expected_output="Detailed raw text outlining name, headline, summary, experiences, education, and credentials.",
        agent=profile_agent
    )

    task_extract_skills = Task(
        description=(
            "Review the raw profile details from the previous step and identify all core technical skills, "
            "soft skills, frameworks, libraries, and tools."
        ),
        expected_output="List of primary and secondary skills extracted from the profile.",
        agent=skill_agent
    )

    task_build_profile = Task(
        description=(
            "Consolidate all extracted details, skills, experiences, education, and certifications into a single "
            "valid JSON response.\n\n"
            "The output MUST be a valid JSON object matching the following structure:\n"
            "{\n"
            "  \"parsed_profile\": {\n"
            "    \"full_name\": \"...\",\n"
            "    \"headline\": \"...\",\n"
            "    \"about\": \"...\",\n"
            "    \"languages\": [\"...\"],\n"
            "    \"projects\": [{\"name\": \"...\", \"description\": \"...\"}],\n"
            "    \"awards\": [\"...\"],\n"
            "    \"volunteer_experience\": [{\"role\": \"...\", \"organization\": \"...\"}],\n"
            "    \"recommendations\": [\"...\"],\n"
            "    \"endorsements\": [\"...\"]\n"
            "  },\n"
            "  \"skills\": [\"...\"],\n"
            "  \"experience\": [\n"
            "    {\"company\": \"...\", \"role\": \"...\", \"period\": \"...\", \"description\": \"...\"}\n"
            "  ],\n"
            "  \"education\": [\n"
            "    {\"institution\": \"...\", \"degree\": \"...\", \"year\": \"...\"}\n"
            "  ],\n"
            "  \"certifications\": [\n"
            "    {\"name\": \"...\"}\n"
            "  ]\n"
            "}\n\n"
            "Return ONLY the raw JSON block without markdown formatting or code block wraps."
        ),
        expected_output="Conforming JSON object containing parsed_profile, skills, experience, education, and certifications.",
        agent=builder_agent
    )

    # 3. Create Crew and run sequentially
    crew = Crew(
        agents=[profile_agent, skill_agent, builder_agent],
        tasks=[task_extract_profile, task_extract_skills, task_build_profile],
        process=Process.sequential,
        verbose=True
    )

    result = crew.kickoff()
    
    # 4. Parse output JSON
    parsed_json = parse_crew_json(str(result))
    
    return {
        "raw_output": str(result),
        "status": "success",
        "parsed_profile": parsed_json.get("parsed_profile", {}),
        "skills": parsed_json.get("skills", []),
        "experience": parsed_json.get("experience", []),
        "education": parsed_json.get("education", []),
        "certifications": parsed_json.get("certifications", [])
    }
