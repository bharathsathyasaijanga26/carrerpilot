import os
from crewai import LLM
from backend.app.config.settings import settings

def get_llm():
    """
    Initializes and returns the CrewAI LLM based on available environment variables.
    We prioritize OPENROUTER_API_KEY first to make sure that the configured OpenRouter API key 
    takes priority over any invalid default system environment keys (such as an invalid OpenAI key).
    """
    # Priority 1: OPENROUTER_API_KEY
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if openrouter_key and openrouter_key.strip() != "":
        print("[INFO] Using OpenRouter LLM (openai/gpt-4o-mini)")
        return LLM(model="openrouter/openai/gpt-4o-mini", api_key=openrouter_key)
        
    # Priority 2: GEMINI_API_KEY
    gemini_key = os.environ.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    if gemini_key and gemini_key != "MY_GEMINI_API_KEY" and gemini_key.strip() != "":
        os.environ["GEMINI_API_KEY"] = gemini_key
        print("[INFO] Using Gemini LLM (gemini-1.5-flash)")
        return LLM(model="gemini/gemini-1.5-flash", api_key=gemini_key)
    
    # Priority 3: OPENAI_API_KEY
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key and openai_key.strip() != "":
        print("[INFO] Using OpenAI LLM (gpt-4o-mini)")
        return LLM(model="gpt-4o-mini", api_key=openai_key)
        
    raise ValueError("No LLM API keys configured. Please set OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY.")
