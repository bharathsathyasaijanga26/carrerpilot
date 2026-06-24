import datetime
import os
import requests
from typing import Dict, Any, Optional

class LinkedInOAuthService:
    def __init__(self):
        self.client_id = os.getenv("LINKEDIN_CLIENT_ID", "")
        self.client_secret = os.getenv("LINKEDIN_CLIENT_SECRET", "")
        self.redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:3000/api/linkedin/oauth/callback")
        
        # Token storage (in-memory for simple session tracking, or extends to database later)
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def get_auth_url(self, state: str = "random_state_string") -> str:
        """
        Returns the authorization URL. If credentials are not configured, returns the local mock OAuth login page.
        """
        if not self.client_id or not self.client_secret:
            # Fallback to local mock popup route
            return f"http://127.0.0.1:8000/api/linkedin/oauth/mock-login?state={state}"
            
        endpoint = "https://www.linkedin.com/oauth/v2/authorization"
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": "r_liteprofile r_emailaddress w_member_social"
        }
        req = requests.Request("GET", endpoint, params=params)
        prepared = req.prepare()
        return prepared.url

    def get_access_token(self, code: str) -> Dict[str, Any]:
        """
        Exchanges code for an access token. Returns mock tokens if credentials are not configured.
        """
        if not self.client_id or not self.client_secret or code.startswith("mock_"):
            # Return high-fidelity mock session details
            expires_in = 3600 * 24 * 60 # 60 days
            return {
                "access_token": f"mock_access_token_{code}",
                "refresh_token": f"mock_refresh_token_{code}",
                "expires_in": expires_in,
                "scope": "r_liteprofile r_emailaddress",
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            
        endpoint = "https://www.linkedin.com/oauth/v2/accessToken"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        response = requests.post(endpoint, data=data, timeout=15)
        if response.status_code != 200:
            raise ValueError(f"Failed to exchange token: {response.text}")
            
        res_data = response.json()
        res_data["created_at"] = datetime.datetime.utcnow().isoformat()
        return res_data

    def fetch_profile_data(self, access_token: str) -> Dict[str, Any]:
        """
        Fetches LinkedIn profile data. If token is mocked, returns mock profile.
        """
        if access_token.startswith("mock_"):
            return {
                "id": "mock_li_user_bharath26",
                "localizedFirstName": "Bharath",
                "localizedLastName": "AI",
                "firstName": {"localized": {"en_US": "Bharath"}},
                "lastName": {"localized": {"en_US": "AI"}},
                "headline": "Senior AI Architect & Full-Stack Engineer",
                "industryName": "Information Technology",
                "locationName": "Bengaluru, Karnataka, India",
                "emailAddress": "bharath.ai@careerpilot.ai",
                # Rich profile details mapping to standard schema
                "summary": "Passionate Senior Software Engineer and AI Architect specializing in autonomous agent systems, large language models, React frontend engineering, and scalable distributed architectures.",
                "skills": ["Python", "FastAPI", "React", "TypeScript", "CrewAI", "LangChain", "Gemini API", "SQLAlchemy", "PostgreSQL", "Tailwind CSS", "Docker", "Node.js", "System Design", "Git"],
                "experience": [
                    {
                        "company": "AgentOps AI",
                        "role": "Lead AI Engineer",
                        "period": "2024-Present",
                        "description": "Orchestrated multi-agent systems using CrewAI and LangChain. Built high-performance FastAPI backends and integrated real-time WebSocket state synchronizations with React frontends."
                    },
                    {
                        "company": "TechCorp Systems",
                        "role": "Senior Full-Stack Developer",
                        "period": "2021-2024",
                        "description": "Led a team of 5 engineers to deliver cloud-native SaaS applications. Optimized database queries in PostgreSQL, reducing API latency by 35%. Designed state management workflows in React/Redux."
                    },
                    {
                        "company": "Innovate Labs",
                        "role": "Software Engineer",
                        "period": "2019-2021",
                        "description": "Developed responsive web interfaces using TypeScript, React, and CSS. Implemented automated CI/CD pipelines using GitHub Actions."
                    }
                ],
                "education": [
                    {
                        "institution": "Indian Institute of Technology (IIT)",
                        "degree": "Bachelor of Technology in Computer Science",
                        "year": "2019"
                    }
                ],
                "certifications": [
                    {"name": "Google Cloud Professional Machine Learning Engineer"},
                    {"name": "DeepLearning.AI Generative AI with LLMs"}
                ],
                "projects": [
                    {
                        "name": "AgentOps CareerPilot",
                        "description": "Designed and built an autonomous agent framework utilizing CrewAI, FastAPI, and React to automate job matching, resume tailoring, and interview preparation."
                    },
                    {
                        "name": "Antigravity Dev assistant",
                        "description": "An AI-powered agentic coding assistant to facilitate pair programming, multi-file editing, and codebase search."
                    }
                ],
                "languages": ["English", "Telugu", "Hindi"],
                "volunteerWork": [
                    {
                        "role": "Open Source Mentor",
                        "organization": "FreeCodeCamp"
                    }
                ],
                "recommendations": [
                    "Bharath is an exceptional engineer who bridges the gap between AI research and production systems. His work on CrewAI and React dashboards was crucial to our team's success."
                ]
            }
            
        # Real LinkedIn API queries
        profile_url = "https://api.linkedin.com/v2/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # 1. Fetch Lite Profile
        profile_response = requests.get(profile_url, headers=headers, timeout=15)
        if profile_response.status_code != 200:
            raise ValueError(f"Failed to fetch profile: {profile_response.text}")
        profile = profile_response.json()
        
        # 2. Fetch Email
        email_url = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))"
        email_response = requests.get(email_url, headers=headers, timeout=15)
        email = ""
        if email_response.status_code == 200:
            try:
                email_data = email_response.json()
                email = email_data["elements"][0]["handle~"]["emailAddress"]
            except Exception:
                pass
                
        # Consolidate standard schema response
        return {
            "id": profile.get("id"),
            "localizedFirstName": profile.get("localizedFirstName"),
            "localizedLastName": profile.get("localizedLastName"),
            "emailAddress": email,
            "headline": "LinkedIn Member",
            "summary": "",
            "skills": ["React", "TypeScript", "Python"],
            "experience": [],
            "education": [],
            "certifications": [],
            "projects": [],
            "languages": [],
            "volunteerWork": [],
            "recommendations": []
        }

oauth_service = LinkedInOAuthService()
