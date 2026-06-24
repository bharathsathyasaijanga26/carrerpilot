import requests
import re

def extract_username(linkedin_url: str) -> str:
    """
    Helper to extract username from a LinkedIn URL.
    e.g. https://www.linkedin.com/in/bharathai26/ -> bharathai26
    """
    clean_url = linkedin_url.strip().rstrip('/')
    match = re.search(r'/in/([^/?#]+)', clean_url)
    if match:
        return match.group(1)
    return clean_url

def fetch_linkedin_profile_data(provider: str, api_key: str, linkedin_url: str) -> dict:
    """
    Fetches real-time LinkedIn profile data from a configured provider.
    Supported providers: proxycurl, peopledatalabs, brightdata, scrapingdog.
    """
    if not provider or not api_key:
        raise ValueError("LinkedIn scraping provider or API key is not configured.")

    prov = provider.lower().strip()
    url = linkedin_url.strip()
    
    print(f"[INFO] Fetching profile from provider: '{prov}' for URL: '{url}'")

    if prov == "proxycurl":
        endpoint = "https://nubela.co/proxycurl/api/v2/linkedin"
        headers = {"Authorization": f"Bearer {api_key}"}
        params = {"url": url}
        
        response = requests.get(endpoint, headers=headers, params=params, timeout=30)
        
    elif prov in ["peopledatalabs", "pdl"]:
        endpoint = "https://api.peopledatalabs.com/v5/person/enrich"
        params = {"api_key": api_key, "profile": url}
        
        response = requests.get(endpoint, params=params, timeout=30)
        
    elif prov == "brightdata":
        endpoint = "https://api.brightdata.com/enrichment/linkedin"
        headers = {"Authorization": f"Bearer {api_key}"}
        params = {"url": url}
        
        response = requests.get(endpoint, headers=headers, params=params, timeout=30)
        
    elif prov == "scrapingdog":
        endpoint = "https://api.scrapingdog.com/linkedin"
        # Scrapingdog requires linkId which can be username or URL
        params = {
            "api_key": api_key,
            "type": "profile",
            "linkId": url
        }
        
        response = requests.get(endpoint, params=params, timeout=30)
        
    else:
        raise ValueError(f"Unsupported LinkedIn data provider: '{provider}'")

    if response.status_code != 200:
        print(f"[ERROR] Provider '{prov}' API request failed with status code {response.status_code}: {response.text}")
        raise RuntimeError(f"Data provider API call failed with status code {response.status_code}")

    try:
        data = response.json()
        return data
    except Exception as e:
        print(f"[ERROR] Failed to parse JSON from provider '{prov}' response: {str(e)}")
        raise ValueError("Provider API returned invalid JSON content.")
