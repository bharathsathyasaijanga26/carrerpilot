/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// @ts-ignore
const isCommonJS = typeof require !== "undefined";
// @ts-ignore
const customRequire = isCommonJS ? require : createRequire(import.meta.url);

let PDFParseClass: any;
let pdfParse: any;
try {
  // @ts-ignore
  const pdfParseModule = customRequire("pdf-parse");
  if (pdfParseModule) {
    if (typeof pdfParseModule.PDFParse === "function") {
      PDFParseClass = pdfParseModule.PDFParse;
    } else if (pdfParseModule.default && typeof pdfParseModule.default.PDFParse === "function") {
      PDFParseClass = pdfParseModule.default.PDFParse;
    } else if (typeof pdfParseModule === "function") {
      pdfParse = pdfParseModule;
    } else if (pdfParseModule.default && typeof pdfParseModule.default === "function") {
      pdfParse = pdfParseModule.default;
    }
  }
} catch (e: any) {
  console.error("Error requiring pdf-parse:", e);
}

// @ts-ignore
const mammothModule = customRequire("mammoth");
const mammoth = mammothModule.default || mammothModule;

// Load environment variables
dotenv.config();

// @ts-ignore
const currentFilename = isCommonJS ? __filename : fileURLToPath(import.meta.url);
// @ts-ignore
const currentDirname = isCommonJS ? __dirname : path.dirname(currentFilename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY is not defined in environment or is default. Some AI features will use rich fallback simulations.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// REST database simulations in memory (persisted for the session)
let resumes: any[] = [];
let linkedinProfiles: any[] = [];
let candidateProfiles: any[] = [];
let candidateProfileMerges: any[] = [];
let recruiterContacts: any[] = [];
let followupTrackings: any[] = [];
let applications: any[] = [
  {
    id: "app-seed-1",
    jobId: "job-2",
    jobTitle: "Frontend Developer (React)",
    company: "CRED",
    location: "Bengaluru, Karnataka (Onsite)",
    salary: "₹18,00,000 - ₹28,00,000 LPA",
    status: "Applied",
    dateCreated: "2026-06-15",
    dateApplied: "2026-06-15",
    deadline: "2026-07-05",
    coverLetter: "Dear Hiring Team at CRED,\n\nI am thrilled to apply for the Frontend Developer position...",
    outreachEmail: "Hi CRED team,\n\nI just applied for the Frontend Developer role! Let's connect.",
    recipientEmail: "talent@cred.club",
    recipientName: "CRED Recruiting Lead",
    followUpDays: 5,
    followUpReminderDate: "2026-06-20", // Scheduled for 5 days after June 15, which is already in the past compared to June 22! So it will show a nice active nudge!
    followUpCompleted: false,
    historyLogs: [
      { id: "log-seed-1-1", timestamp: "10:30:00 AM", agentName: "Resume Analysis Agent", message: "Parsed resume alignment details." },
      { id: "log-seed-1-2", timestamp: "10:31:00 AM", agentName: "Application Drafter Agent", message: "Successfully drafted outreach and cover letters." }
    ]
  },
  {
    id: "app-seed-2",
    jobId: "job-1",
    jobTitle: "Senior Full Stack Engineer",
    company: "Razorpay",
    location: "Bengaluru, Karnataka (Hybrid)",
    salary: "₹24,00,000 - ₹35,00,000 LPA",
    status: "Saved",
    dateCreated: "2026-06-21",
    deadline: "2026-07-10",
    coverLetter: "Dear hiring team at Razorpay, representing my full stack alignment for your Senior Full Stack Engineer opening...",
    outreachEmail: "Hi Razorpay team, looking forward to contributing to your payment products.",
    recipientEmail: "hiring@razorpay.com",
    recipientName: "Razorpay HR Admin",
    historyLogs: []
  },
  {
    id: "app-seed-3",
    jobId: "job-4",
    jobTitle: "Software Engineer (Platforms)",
    company: "Zoho Corporation",
    location: "Chennai, Tamil Nadu (Onsite)",
    salary: "₹12,00,000 - ₹18,00,000 LPA",
    status: "Interview",
    dateCreated: "2026-06-10",
    dateApplied: "2026-06-12",
    deadline: "2026-06-30",
    coverLetter: "Dear Zoho hiring recruiters, presenting my skills in platforms and frameworks alignment...",
    outreachEmail: "Hi Zoho team, excited for my scheduled platforms engineer technical interview session.",
    recipientEmail: "recruitment@zoho.com",
    recipientName: "Zoho Careers Platform",
    historyLogs: [
      { id: "log-seed-3-1", timestamp: "02:15:00 PM", agentName: "System", message: "Status changed to Interview." }
    ]
  }
];
// Rich seed jobs
let SEED_JOBS = [
  {
    id: "job-1",
    title: "Senior Full Stack Engineer",
    company: "Razorpay",
    salary: "₹24,00,000 - ₹35,00,000 LPA",
    location: "Bengaluru, Karnataka (Hybrid)",
    description: "Build premium merchant dashboard experiences and robust APIs for high-volume transactions. Require 5+ years of experience with React, Node.js, and TypeScript. Experience with payment plumbing and SQL databases is a plus.",
    matchScore: 94,
    type: "hybrid" as const,
    experienceLevel: "Senior",
    companySize: "1,000 - 5,000 employees",
    industry: "Fintech",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&h=120&q=80",
    jobUrl: "https://razorpay.com/jobs",
    openDate: "2026-06-10",
    closingDate: "2026-07-15",
    applyLink: "https://razorpay.com/jobs/senior-fullstack",
    contactInfo: "talent@razorpay.com",
    matchAnalysis: {
      strengths: ["Excellent alignment with React & TypeScript", "Strong payment gateway orchestration skills", "Enterprise dashboard design expertise in India"],
      gapAnalysis: ["Tailwind CSS v4 specific hooks are new to candidate", "No experience with Razorpay's custom API patterns"],
      recommendations: ["Highlight past merchant-facing projects in Bengaluru based firms", "Emphasize transaction scaling & low-latency API experience"]
    }
  },
  {
    id: "job-2",
    title: "Frontend Developer (React)",
    company: "CRED",
    salary: "₹18,00,000 - ₹28,00,000 LPA",
    location: "Bengaluru, Karnataka (Onsite)",
    description: "Work on credit-line products, user interfaces, and fintech widgets. Looking for a React enthusiast with pristine design aesthetic, knowledge of Tailwind CSS, micro-interactions, and high performance canvas frameworks.",
    matchScore: 89,
    type: "onsite" as const,
    experienceLevel: "Mid-Senior",
    companySize: "500 - 1000 employees",
    industry: "Fintech & Consumer",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80",
    jobUrl: "https://cred.club/careers",
    openDate: "2026-06-12",
    closingDate: "2026-07-20",
    applyLink: "https://cred.club/careers/frontend-dev",
    contactInfo: "careers@cred.club",
    matchAnalysis: {
      strengths: ["Deep React knowledge", "Framer Motion layout and visual experience alignment", "Tailwind CSS styling speed"],
      gapAnalysis: ["Lottie-animation based design optimization is missing key focus in current profile"],
      recommendations: ["Focus resume bullets on lightweight UI interactions", "Add a link to portfolio with interactive credit cards simulation"]
    }
  },
  {
    id: "job-3",
    title: "AI Integrations Engineer",
    company: "Tata Consultancy Services (TCS)",
    salary: "₹15,00,000 - ₹22,00,000 LPA",
    location: "Hyderabad, Telangana (Hybrid)",
    description: "Develop enterprise AI conversational agents and orchestration pipelines. Spearhead multi-agent workflows, prompt design modules, and vector search. Requires React, Python, FastAPI and LLM integration engineering.",
    matchScore: 78,
    type: "hybrid" as const,
    experienceLevel: "Senior",
    companySize: "10,005+ employees",
    industry: "IT Services",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80",
    jobUrl: "https://tcs.com/careers",
    openDate: "2026-06-14",
    closingDate: "2026-07-25",
    applyLink: "https://tcs.com/careers/ai-integrations",
    contactInfo: "recruitment@tcs.com",
    matchAnalysis: {
      strengths: ["Strong experience calling modern APIs (e.g., @google/genai)", "Full stack TypeScript framework foundations"],
      gapAnalysis: ["Relational PostgreSQL databases schemas scaling not detailed", "CrewAI or LangChain orchestration is basic standard on current profile"],
      recommendations: ["Stress prompt testing paradigms in your portfolio", "Present autonomous agent loops you have built"]
    }
  },
  {
    id: "job-4",
    title: "Software Engineer (Platforms)",
    company: "Zoho Corporation",
    salary: "₹12,00,000 - ₹18,00,000 LPA",
    location: "Chennai, Tamil Nadu (Onsite)",
    description: "Build ultra-responsive web modules and core collaboration systems. Requires standard expertise with React, Node.js, WebSockets, real-time message sync, and elegant pixel-perfect design practices.",
    matchScore: 85,
    type: "onsite" as const,
    experienceLevel: "Mid-Senior",
    companySize: "10,000+ employees",
    industry: "SaaS",
    logo: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=120&h=120&q=80",
    jobUrl: "https://zoho.com/careers",
    openDate: "2026-06-08",
    closingDate: "2026-07-10",
    applyLink: "https://zoho.com/careers/software-engineer",
    contactInfo: "hiring@zoho.com",
    matchAnalysis: {
      strengths: ["Highly modular coding standards align nicely", "Passionate about low-latency data sync and user interaction patterns"],
      gapAnalysis: ["Java or C++ backend optimizations are not in resume"],
      recommendations: ["Focus resume summary on offline-first persistence architectures", "Emphasize responsive desktop-first aesthetic precision"]
    }
  },
  {
    id: "job-5",
    title: "Full Stack Engineer",
    company: "Jio Platforms",
    salary: "₹20,00,000 - ₹30,00,000 LPA",
    location: "Mumbai, Maharashtra (Hybrid)",
    description: "Develop scalable micro-frontends and robust Node.js GraphQL schemas. Collaborate closely with product and platform infrastructure teams to build highly responsive, highly loaded consumer-facing layouts.",
    matchScore: 92,
    type: "hybrid" as const,
    experienceLevel: "Senior",
    companySize: "10,000+ employees",
    industry: "Telecom & Internet",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80",
    jobUrl: "https://jio.com/careers",
    openDate: "2026-06-16",
    closingDate: "2026-07-28",
    applyLink: "https://jio.com/careers/fullstack-eng",
    contactInfo: "talent.acquisition@jio.com",
    matchAnalysis: {
      strengths: ["Strong backend and microservices orchestration", "Good styling proficiency with Tailwind utility grids"],
      gapAnalysis: ["No specific telecom integration architecture background"],
      recommendations: ["Highlight scalable high-traffic web apps", "Showcase performance bottlenecks solved in previous structures"]
    }
  },
  {
    id: "job-6",
    title: "Application Developer",
    company: "Druva Software",
    salary: "₹10,00,000 - ₹15,00,000 LPA",
    location: "Pune, Maharashtra (Onsite)",
    description: "Low-preference listing for entry-to-mid software practitioners. Maintain cloud server endpoints, React web-apps, static pages, and simple full-stack pipelines.",
    matchScore: 72,
    type: "onsite" as const,
    experienceLevel: "Mid-Senior",
    companySize: "1,050 - 5,000 employees",
    industry: "Cybersecurity & Cloud",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80",
    jobUrl: "https://druva.com/careers",
    openDate: "2026-06-18",
    closingDate: "2026-07-30",
    applyLink: "https://druva.com/careers/app-developer",
    contactInfo: "hr@druva.com",
    matchAnalysis: {
      strengths: ["Proficiency with basic web stack (React/Typescript)"],
      gapAnalysis: ["Lower match score due to specific cloud architecture gaps"],
      recommendations: ["Focus on cloud system engineering foundations"]
    }
  }
];

const DB_FILE = path.join(currentDirname, "db.json");

function saveDb() {
  try {
    const data = { resumes, applications, SEED_JOBS };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log(`[DB] Saved database to ${DB_FILE}. ${resumes.length} resumes, ${applications.length} applications, ${SEED_JOBS.length} jobs.`);
  } catch (error) {
    console.error("[DB] Error saving database:", error);
  }
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      if (data.resumes) resumes = data.resumes;
      if (data.applications) applications = data.applications;
      if (data.SEED_JOBS) {
        SEED_JOBS.length = 0;
        SEED_JOBS.push(...data.SEED_JOBS);
      }
      console.log(`[DB] Loaded database from ${DB_FILE}. ${resumes.length} resumes, ${applications.length} applications, ${SEED_JOBS.length} jobs.`);
    } else {
      saveDb();
      console.log(`[DB] Database file not found. Seeded database written at ${DB_FILE}.`);
    }
  } catch (error) {
    console.error("[DB] Error loading database:", error);
  }
}

loadDb();

// Helper: safe JSON extraction from Gemini text
function extractSchemaJSON(text: string): any {
  try {
    const raw = text.trim();
    // Locate json block if wrapped in markdown formatting ```json ... ```
    const matchJson = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (matchJson && matchJson[1]) {
      return JSON.parse(matchJson[1].trim());
    }
    // Try stripping first/last markdown markers
    let processed = raw;
    if (processed.startsWith("```")) {
      processed = processed.replace(/^```[a-zA-Z]*/, "").replace(/```$/, "");
    }
    return JSON.parse(processed.trim());
  } catch (e) {
    console.error("JSON parsing failed, returning raw string structure:", e);
    return null;
  }
}

// API: Extract Text from Document (PDF, DOCX)
app.post("/api/resume/parse-file", async (req, res) => {
  const { base64Data, filename, fileType } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "No file data provided." });
  }

  try {
    const rawBase64 = base64Data.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(rawBase64, "base64");
    let extractedText = "";

    const lowerFilename = (filename || "").toLowerCase();
    const isPdf = lowerFilename.endsWith(".pdf") || fileType === "application/pdf";
    const isDocx = lowerFilename.endsWith(".docx") || lowerFilename.endsWith(".doc") || fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (isPdf) {
      if (PDFParseClass) {
        // @ts-ignore
        const parser = new PDFParseClass({ data: buffer });
        const result = await parser.getText();
        extractedText = result.text || "";
        await parser.destroy();
      } else if (pdfParse) {
        // @ts-ignore
        const data = await pdfParse(buffer);
        extractedText = data.text || "";
      } else {
        throw new Error("PDF parser is not loaded on the backend.");
      }
    } else if (isDocx) {
      // @ts-ignore
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      // Plain text fallback
      extractedText = buffer.toString("utf8");
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ error: "Could not extract sufficient text from the document. Please copy-paste the text manually." });
    }

    return res.json({
      success: true,
      text: extractedText.trim(),
      filename: filename || "uploaded_resume.txt"
    });
  } catch (err: any) {
    console.error("Document parser error:", err);
    return res.status(500).json({ error: "Failed to extract text from file: " + err.message });
  }
});

function parseResumeTextLocally(text: string, filename: string): any {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Extract Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  let email = "";
  for (const line of lines) {
    const match = line.match(emailRegex);
    if (match) {
      email = match[0];
      break;
    }
  }
  
  // Extract Phone
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  let phone = "";
  for (const line of lines) {
    const match = line.match(phoneRegex);
    if (match) {
      phone = match[0];
      break;
    }
  }

  // Extract Name: The first line that is not an email/phone/link/header and is less than 50 chars.
  let name = "";
  for (const line of lines) {
    if (line.length < 50 && 
        !line.match(emailRegex) && 
        !line.match(phoneRegex) && 
        !line.toLowerCase().includes("http") && 
        !line.toLowerCase().includes("resume") &&
        !line.toLowerCase().includes("curriculum")) {
      name = line;
      break;
    }
  }
  if (!name) {
    name = filename ? filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "Candidate Name";
  }

  // Extract Skills: Look for common skill keywords in the text.
  const commonSkills = [
    "React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind", "Node.js", "Express",
    "MongoDB", "SQL", "PostgreSQL", "Python", "FastAPI", "Django", "Java", "Spring Boot",
    "Docker", "AWS", "Git", "C++", "Next.js", "Vite", "Vue", "Angular", "GraphQL", "REST APIs",
    "Framer Motion", "D3.js", "Figma", "Redux", "Bootstrap", "Linux", "Kubernetes", "CI/CD"
  ];
  const detectedSkills = commonSkills.filter(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+.-])${escapedSkill}(?![a-zA-Z0-9_#+.-])`, "i");
    return regex.test(text);
  });
  
  const technicalSkills = detectedSkills.length > 0 ? detectedSkills : ["React", "TypeScript", "Node.js", "Tailwind CSS"];
  
  let education: any[] = [];
  let experience: any[] = [];
  
  let currentSection = "";
  let currentExperienceItem: any = null;
  let currentEducationItem: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes("education") || lowerLine.includes("academic")) {
      currentSection = "education";
      continue;
    } else if (lowerLine.includes("experience") || lowerLine.includes("employment") || lowerLine.includes("work history")) {
      currentSection = "experience";
      continue;
    } else if (lowerLine.includes("skills") || lowerLine.includes("certifications") || lowerLine.includes("projects")) {
      currentSection = "other";
      continue;
    }
    
    if (currentSection === "experience") {
      const dateMatch = line.match(/\b(19|20)\d{2}\b/);
      if (dateMatch && line.length < 100) {
        if (currentExperienceItem) {
          experience.push(currentExperienceItem);
        }
        const parts = line.split(/[-,|]/).map(p => p.trim());
        currentExperienceItem = {
          company: parts[0] || "Company",
          role: parts[1] || "Software Engineer",
          period: line.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|20\d{2})\b/gi)?.join(" - ") || "2021 - Present",
          description: ""
        };
      } else if (currentExperienceItem) {
        currentExperienceItem.description += (currentExperienceItem.description ? " " : "") + line;
      }
    } else if (currentSection === "education") {
      const dateMatch = line.match(/\b(19|20)\d{2}\b/);
      if (dateMatch && line.length < 100) {
        if (currentEducationItem) {
          education.push(currentEducationItem);
        }
        const parts = line.split(/[-,|]/).map(p => p.trim());
        currentEducationItem = {
          institution: parts[0] || "University",
          degree: parts[1] || "Bachelor's Degree",
          year: dateMatch[0]
        };
      } else if (currentEducationItem) {
        currentEducationItem.institution += " " + line;
      }
    }
  }
  
  if (currentExperienceItem) experience.push(currentExperienceItem);
  if (currentEducationItem) education.push(currentEducationItem);
  
  if (experience.length === 0) {
    experience = [
      {
        company: "Recent Employer",
        role: "Software Professional",
        period: "2022 - Present",
        description: lines.find(l => l.length > 50 && l.length < 200) || "Contributed to core product features and frontend optimization."
      }
    ];
  }
  if (education.length === 0) {
    education = [
      {
        institution: "Graduated University",
        degree: "Professional Degree",
        year: "2021"
      }
    ];
  }
  
  const softSkills = ["Problem Solving", "Teamwork", "Agile Methodology", "Communication"];
  
  let summary = "";
  for (const line of lines) {
    if (line.length > 60 && line.length < 300 && !line.includes(":") && !line.toLowerCase().includes("experience")) {
      summary = line;
      break;
    }
  }
  if (!summary) {
    summary = `Experienced professional specializing in ${technicalSkills.slice(0, 3).join(", ")}. Proven track record of delivery.`;
  }
  
  const highValueKeywords = ["React", "TypeScript", "Node.js", "AWS", "Docker", "Git", "GraphQL", "CI/CD", "Tailwind"];
  const matchedKeywords = highValueKeywords.filter(k => new RegExp(`\\b${k}\\b`, "i").test(text));
  const keywordScore = Math.min(100, 50 + (matchedKeywords.length * 7));
  const wordingScore = Math.min(100, 60 + Math.floor(Math.random() * 20));
  const formattingScore = Math.min(100, 70 + Math.floor(Math.random() * 25));
  const atsScore = Math.round((keywordScore + wordingScore + formattingScore) / 3);

  return {
    parsedData: {
      name,
      email,
      phone,
      education,
      experience,
      summary,
      technicalSkills,
      softSkills,
      certifications: ["Professional Certification"]
    },
    score: atsScore,
    improvementSuggestions: [
      "Add more metrics and quantifiable outcomes to your bullet points.",
      `Consider incorporating more modern tools like ${highValueKeywords.filter(k => !matchedKeywords.includes(k)).slice(0, 3).join(", ") || "Docker/CI-CD"}.`,
      "Format dates and section headers for standard ATS readability."
    ],
    tags: name ? [name.split(" ")[0], ...technicalSkills.slice(0, 2)] : ["Candidate", "Tech"],
    scoringBreakdown: {
      keywordScore,
      wordingScore,
      formattingScore,
      atsScore,
      keywordAnalysis: {
        detectedKeywords: matchedKeywords,
        missingKeywords: highValueKeywords.filter(k => !matchedKeywords.includes(k)),
        recommendations: ["Add more keywords aligning with your target roles."]
      },
      wordingAnalysis: {
        weakPhrases: [
          { phrase: "assisted with", fix: "Collaborated on / Drove", reason: "Passive language minimizes direct impact." }
        ],
        strongActionVerbs: ["Led", "Optimized", "Architected", "Engineered"],
        recommendations: ["Start bullets with strong action verbs."]
      },
      formattingAnalysis: {
        layoutIssues: ["Ensure standard section delimiters are used."],
        complianceChecklist: [
          { item: "Contact Information Presence", passed: !!(email || phone), tip: "Include professional email and phone number." },
          { item: "Standard Delineated Sections", passed: true, tip: "Check sections." },
          { item: "Reverse Chronological Alignment", passed: true, tip: "Latest experience first." },
          { item: "ATS Readable Structure", passed: true, tip: "Use plain columns." }
        ],
        recommendations: ["Ensure layout is standard and readable by parsing engines."]
      }
    }
  };
}

// API: Parse Resume Endpoint
app.post("/api/resume/parse", async (req, res) => {
  const { resumeText, filename } = req.body;
  if (!resumeText || resumeText.trim().length < 10) {
    return res.status(400).json({ error: "Resume text must be provided and contain at least 10 characters." });
  }

  const ai = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  const mockScoringBreakdown = {
    keywordScore: 84,
    wordingScore: 78,
    formattingScore: 92,
    atsScore: 88,
    keywordAnalysis: {
      detectedKeywords: ["React", "TypeScript", "Tailwind CSS", "Node.js", "Express", "PostgreSQL", "D3.js", "Vite", "Framer Motion"],
      missingKeywords: ["Docker", "GraphQL", "CI/CD", "AWS", "Redis", "Jest"],
      recommendations: [
        "Incorporate highly desirable API integration frameworks like GraphQL into your skills matrix directly.",
        "Consider outlining cloud hosting workflows such as AWS or Google Cloud to match premium enterprise needs.",
        "Include reference to unit testing setups like Jest or Cypress for modern developer roles."
      ]
    },
    wordingAnalysis: {
      weakPhrases: [
        { phrase: "worked on", fix: "Engineered / Spearheaded", reason: "Passive expression that underrepresents your active engineering contribution." },
        { phrase: "responsible for", fix: "Orchestrated / Architected", reason: "Focuses on static responsibilities rather than active results-oriented execution." },
        { phrase: "helped with", fix: "Accelerated / Catalyzed", reason: "Diminishes personal direct impact and contribution to the project." }
      ],
      strongActionVerbs: ["Led", "Optimized", "Architected", "Accelerated", "Integrated", "Improved", "Spearheaded"],
      recommendations: [
        "Begin every accomplishment bullet point with a high-impact action verb (e.g., 'Architected modern SPA...').",
        "Introduce more quantifiable outcomes (e.g., 'Reduced layout shifts by 34%') to highlight business-oriented success."
      ]
    },
    formattingAnalysis: {
      layoutIssues: [
        "Header contact information lacks distinct delimiters (e.g., pipe separators) which makes text scanning slow.",
        "Lack of cohesive bold styling on date indicators throughout the history stack."
      ],
      complianceChecklist: [
        { item: "Contact Information Presence", passed: true, tip: "Successfully includes essential email, phone, and optional location indicators." },
        { item: "Standard Delineated Sections", passed: true, tip: "Utilizes clear, standard tags like 'Education' and 'Skills' recognizable by standard ATS machines." },
        { item: "Reverse Chronological Alignment", passed: true, tip: "Delineates work history from most recent to oldest." },
        { item: "ATS Readable Structure", passed: true, tip: "Maintains a clean, linear textual stream without complex multi-column grid errors." }
      ],
      recommendations: [
        "Enhance readable inline separation of contact metadata by utilizing clean pipe symbols ('|').",
        "Maintain perfect styling hierarchy by formatting main headers in capital bold structures."
      ]
    }
  };

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Call the local parser helper
    const localParsed = parseResumeTextLocally(resumeText, filename || "uploaded_resume.txt");
    const parsedResumeObj = {
      id: "res-" + Date.now(),
      filename: filename || "parsed_resume.txt",
      content: resumeText,
      parsedData: localParsed.parsedData,
      score: localParsed.score,
      version: "v1.0.0",
      uploadDate: new Date().toLocaleDateString(),
      improvementSuggestions: localParsed.improvementSuggestions,
      scoringBreakdown: localParsed.scoringBreakdown,
      tags: localParsed.tags
    };

    resumes.push(parsedResumeObj);
    saveDb();
    return res.json({
      success: true,
      resume: parsedResumeObj,
      simulationNotice: "No valid GEMINI_API_KEY discovered. Generated a dynamic local parsed report instead."
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are an expert Resume Parsing and Advanced Scoring Agent. Parse the following plain text resume and transform it into extreme precision JSON formatting.
You must return a raw JSON object matching this TypeScript format exactly:
{
  "parsedData": {
    "name": "Full Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "education": [{"institution": "School Name", "degree": "Degree earned", "year": "Graduation Year"}],
    "experience": [{"company": "Company", "role": "Role", "period": "Start - End Date", "description": "Bullet points & description of experience"}],
    "summary": "Short professional summary",
    "technicalSkills": ["skill1", "skill2"],
    "softSkills": ["skill1", "skill2"],
    "certifications": ["cert1"]
  },
  "score": 85,
  "improvementSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "tags": ["Senior", "Fullstack", "React"],
  "scoringBreakdown": {
    "keywordScore": 82,
    "wordingScore": 75,
    "formattingScore": 90,
    "atsScore": 85,
    "keywordAnalysis": {
      "detectedKeywords": ["detected keyword 1", "detected keyword 2"],
      "missingKeywords": ["critical missing industry skill 1", "critical missing industry skill 2"],
      "recommendations": ["keyword-focused advice list item 1", "keyword-focused advice list item 2"]
    },
    "wordingAnalysis": {
      "weakPhrases": [
        {"phrase": "original weak bullet phrase from resume, e.g. 'responsible for'", "fix": "stronger proactive action verb alternative, e.g. 'Orchestrated'", "reason": "reason why it fails standard metrics alignment"}
      ],
      "strongActionVerbs": ["list of powerful action verbs found in their text or recommended, e.g., Spearheaded, Optimized"],
      "recommendations": ["wording-focused advice list item 1", "wording-focused advice list item 2"]
    },
    "formattingAnalysis": {
      "layoutIssues": ["layout spacing consistency issue 1", "layout capitalization issue 2"],
      "complianceChecklist": [
        {"item": "Contact Information Presence", "passed": true, "tip": "Verify phone, email, and location options exist."},
        {"item": "Standard Delineated Sections", "passed": true, "tip": "Check for cleanly labeled Section Headings."},
        {"item": "Reverse Chronological Alignment", "passed": true, "tip": "Checks that the latest jobs appear first."},
        {"item": "ATS Readable Structure", "passed": true, "tip": "Check that the textual structure is stream-friendly."}
      ],
      "recommendations": ["formatting/spacing list recommendation 1", "formatting/spacing list recommendation 2"]
    }
  }
}

Carefully evaluate the user's resume text and calculate highly realistic scores out of 100 on Keyword Optimization, Experience Wording, Formatting Consistency, and ATS Compliance. Find specific weak phrases used in their experience records and recommend strong replacements. Also, suggest 2 to 4 stylish, precise professional categorization tags ('tags' attribute array at the root of JSON) that represent seniority level, key specialties, or primary tech stack (e.g., 'Senior', 'Frontend', 'Backend', 'Fullstack', 'Management', 'Entry-Level', 'DevOps', 'Data Science', 'React', 'TypeScript', 'Node.js', etc.) based on their profile.

Resume Text:
${resumeText}
`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const output = extractSchemaJSON(response.text || "{}");
    if (!output || !output.parsedData) {
      throw new Error("Could not parse AI output as structured resume JSON.");
    }

    const parsedResumeObj = {
      id: "res-" + Date.now(),
      filename: filename || `parsed_resume_${Date.now().toString().slice(-4)}.txt`,
      content: resumeText,
      parsedData: output.parsedData,
      score: output.score || 75,
      version: "v1.0." + resumes.length,
      uploadDate: new Date().toLocaleDateString(),
      improvementSuggestions: output.improvementSuggestions || [
        "Consider quantifying your past achievements with dynamic conversion and scalability rates.",
        "Add distinct sections mapping technical proficiency versus cloud integration experience.",
        "Mention multi-agent automation toolsets or custom prompts."
      ],
      scoringBreakdown: output.scoringBreakdown || mockScoringBreakdown,
      tags: output.tags || ["Senior", "Fullstack", "React"]
    };

    resumes.push(parsedResumeObj);
    saveDb();
    res.json({ success: true, resume: parsedResumeObj });

  } catch (error: any) {
    console.error("Gemini Parse Resume Error:", error);
    res.status(500).json({ error: "Failed to parse resume via Gemini AI: " + error.message });
  }
});

// API: Skill Extraction Agent Endpoint
app.post("/api/resume/extract-skills", async (req, res) => {
  const { resumeId, resumeText } = req.body;
  
  // Find resume if Id is provided, otherwise extract from passed text
  let targetText = resumeText || "";
  let resumeObj = resumes.find(r => r.id === resumeId);
  if (resumeObj && !targetText) {
    targetText = resumeObj.content || "";
  }

  if (!targetText || targetText.trim().length < 10) {
    return res.status(400).json({ error: "No valid resume text found for skill extraction." });
  }

  const ai = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback / simulation if no API Key
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    let technicalSkills = ["React", "TypeScript", "Tailwind CSS", "Node.js", "Express", "PostgreSQL", "JavaScript (ES6+)", "REST APIs", "Git & GitHub"];
    let certifications = ["AWS Certified Developer - Associate", "Meta Front-End Developer Certificate", "Scrum Alliance CSM"];
    
    if (resumeObj && resumeObj.parsedData) {
      if (resumeObj.parsedData.technicalSkills && resumeObj.parsedData.technicalSkills.length > 0) {
        technicalSkills = resumeObj.parsedData.technicalSkills;
      }
      if (resumeObj.parsedData.certifications && resumeObj.parsedData.certifications.length > 0) {
        certifications = resumeObj.parsedData.certifications;
      }
    } else if (targetText) {
      const tempParsed = parseResumeTextLocally(targetText, "resume.txt");
      technicalSkills = tempParsed.parsedData.technicalSkills;
      certifications = tempParsed.parsedData.certifications;
    }

    const commonTools = ["VS Code", "Git", "Vite", "Docker", "Postman", "Webpack", "npm", "Yarn", "pnpm", "Framer Motion", "D3.js", "Figma"];
    const detectedTools = commonTools.filter(tool => {
      const escapedTool = tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+.-])${escapedTool}(?![a-zA-Z0-9_#+.-])`, "i");
      return regex.test(targetText);
    });
    const tools = detectedTools.length > 0 ? detectedTools : ["VS Code", "Git", "Vite"];

    const jobRelevantKeywords = technicalSkills.map((s: string) => `${s} Development`);

    const fallbackSkills = {
      technicalSkills,
      tools,
      certifications,
      jobRelevantKeywords
    };

    if (resumeObj) {
      resumeObj.skills = fallbackSkills;
    }

    return res.json({
      success: true,
      skills: fallbackSkills,
      simulationNotice: "No valid GEMINI_API_KEY discovered. Generated a dynamic local skill profile."
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are the **Skill Extraction Agent** in our 10-Agent AI Career Fleet.
Analyze the following resume text and extract all relevant technical skills, key development tools/software, certifications/credential titles, and high-value job-relevant industry keywords.

Resume Text:
${targetText}

You must return a raw JSON object matching this schema exactly:
{
  "technicalSkills": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "certifications": ["cert1", "cert2"],
  "jobRelevantKeywords": ["keyword1", "keyword2"]
}
`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const output = extractSchemaJSON(response.text || "{}");
    const skills = {
      technicalSkills: output?.technicalSkills || ["React", "TypeScript", "Tailwind CSS"],
      tools: output?.tools || ["Git", "VS Code", "Vite"],
      certifications: output?.certifications || ["AWS Certified"],
      jobRelevantKeywords: output?.jobRelevantKeywords || ["Software Development"]
    };

    if (resumeObj) {
      resumeObj.skills = skills;
    }

    return res.json({ success: true, skills });

  } catch (error: any) {
    console.error("Gemini Extract Skills Error:", error);
    const fallback = {
      technicalSkills: ["React", "TypeScript", "Node.js"],
      tools: ["VS Code", "Git"],
      certifications: [],
      jobRelevantKeywords: ["Software Engineer"]
    };
    if (resumeObj) {
      resumeObj.skills = fallback;
    }
    return res.json({ success: true, skills: fallback, error: error.message });
  }
});

// API: Job Search Agent Endpoint
app.post("/api/jobs/search", async (req, res) => {
  const { query, location, resumeId } = req.body;
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "Search query must be provided." });
  }

  const ai = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  let resumeObj = resumes.find(r => r.id === resumeId);
  const candidateContext = resumeObj
    ? `\nCandidate Resume context to match against for personalized scores:\n${JSON.stringify(resumeObj.parsedData)}\nSummary:\n${resumeObj.content?.slice(0, 5000)}`
    : "";

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Simulated active web-search indexing fallback
    const mockSearched = [
      {
        id: "searched-job-" + Date.now() + "-1",
        title: query + " Engineer",
        company: "Stripe India",
        salary: "₹28,00,000 - ₹40,00,000 LPA",
        location: location || "Bengaluru, India (Hybrid)",
        description: `Stripe is looking for a ${query} to join our developer platform group. You will help scale payment APIs, engineer microservice grids, build fluid user dashboards, and work closely with global SaaS teams. Requires expertise in TypeScript, React, and NodeJS.`,
        matchScore: resumeObj ? Math.min(100, Math.floor(Math.random() * 20) + 75) : 88,
        type: "hybrid" as const,
        experienceLevel: "Senior",
        companySize: "5,000 - 10,000 employees",
        industry: "Payments & Fintech",
        logo: "https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=120&h=120&q=80",
        jobUrl: "https://stripe.com/jobs",
        openDate: "2026-06-20",
        closingDate: "2026-07-20",
        applyLink: "https://stripe.com/jobs/apply",
        contactInfo: "talent@stripe.com",
        matchAnalysis: {
          strengths: ["Strong backend API credentials", "React and typescript proficiency aligns beautifully"],
          gapAnalysis: ["PCI-DSS compliance experience not emphasized on profile"],
          recommendations: ["Stress high-volume merchant dashboard scaling in outreach letters."]
        }
      },
      {
        id: "searched-job-" + Date.now() + "-2",
        title: "Staff " + query,
        company: "Atlassian",
        salary: "₹35,00,000 - ₹50,00,000 LPA",
        location: location || "Remote, India",
        description: `Develop future collaborative widgets and workspace boards. Help build low-latency interfaces, handle multi-user socket synchronization, and spearhead state management architecture. React & Node expertise required.`,
        matchScore: resumeObj ? Math.min(100, Math.floor(Math.random() * 20) + 70) : 84,
        type: "remote" as const,
        experienceLevel: "Senior",
        companySize: "10,000+ employees",
        industry: "Enterprise SaaS",
        logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&h=120&q=80",
        jobUrl: "https://atlassian.com/careers",
        openDate: "2026-06-18",
        closingDate: "2026-07-18",
        applyLink: "https://atlassian.com/careers/apply",
        contactInfo: "careers@atlassian.com",
        matchAnalysis: {
          strengths: ["Highly collaborative state experience", "Clean interface craft details"],
          gapAnalysis: ["Micro-frontend modular architecture details missing"],
          recommendations: ["Showcase canvas-based dragging widgets or drawing boards in portfolio."]
        }
      },
      {
        id: "searched-job-" + Date.now() + "-3",
        title: "Frontend Developer / " + query,
        company: "Swiggy",
        salary: "₹18,00,000 - ₹24,00,000 LPA",
        location: location || "Bengaluru, India (Onsite)",
        description: `Create blistering-fast customer checkout workflows and interactive logistics views. Requires strong CSS grid styling knowledge, lightweight React templates, and standard unit testing pipelines.`,
        matchScore: resumeObj ? Math.min(100, Math.floor(Math.random() * 20) + 80) : 90,
        type: "onsite" as const,
        experienceLevel: "Mid-Senior",
        companySize: "5,000+ employees",
        industry: "Food Delivery & Logistics",
        logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&h=120&q=80",
        jobUrl: "https://swiggy.com/careers",
        openDate: "2026-06-22",
        closingDate: "2026-07-22",
        applyLink: "https://swiggy.com/careers/apply",
        contactInfo: "recruitment@swiggy.in",
        matchAnalysis: {
          strengths: ["Speedy responsive CSS layout proficiency", "Excellent checkout logic understanding"],
          gapAnalysis: ["No specific maps or checkout localization components highlighted"],
          recommendations: ["Emphasize bundle-size reduction metrics prominently in technical sections."]
        }
      }
    ];

    return res.json({
      success: true,
      jobs: mockSearched,
      simulationNotice: "No valid GEMINI_API_KEY discovered. Generated simulated real-time job portals scan results instead."
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are the **Job Search Agent**, an elite autonomous agent in our 10-Agent AI Career Fleet.
Your job is to search recent, active job openings from multiple top job portals (LinkedIn, Indeed, Glassdoor, Naukri, ZipRecruiter, and tech corporate career sites) based on the user's search query and location.

Search Query: ${query}
Target Location: ${location || "Anywhere / Remote"}
${candidateContext}

Return raw JSON of 4 to 6 real or highly realistic active roles currently open. Check all fields:
You must return a raw JSON object matching this schema exactly:
{
  "jobs": [
    {
      "id": "searched-job-id-number",
      "title": "Role Title",
      "company": "Company Name",
      "salary": "Salary range or 'Market Rate / Competitive'",
      "location": "City, Country (and indicate Remote/Hybrid/Onsite details)",
      "description": "Summary of active responsibilities, requirements, and tech stack details.",
      "matchScore": 85,
      "type": "remote" | "hybrid" | "onsite",
      "experienceLevel": "Senior" | "Mid-Senior" | "Lead" | "Entry-Level",
      "companySize": "Approx size, e.g. 500 - 1000 employees",
      "industry": "Company Sector, e.g. Fintech, SaaS",
      "logo": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&h=120&q=80",
      "jobUrl": "link to portal, company page or typical application link",
      "openDate": "Posting date of the job, e.g. June 18, 2026",
      "closingDate": "Estimated application closing date/deadline, e.g. July 18, 2026",
      "applyLink": "Direct URL link to apply on company site",
      "contactInfo": "Recruiter or HR contact email, e.g. hr@company.com",
      "matchAnalysis": {
        "strengths": ["matching quality 1", "matching quality 2"],
        "gapAnalysis": ["possible gap 1", "possible gap 2"],
        "recommendations": ["advice item 1", "advice item 2"]
      }
    }
  ]
}
`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = extractSchemaJSON(response.text || "{}");
    const jobsList = parsed?.jobs || [];
    return res.json({ success: true, jobs: jobsList });

  } catch (error: any) {
    console.error("Gemini Job Search Agent Error:", error);
    res.status(500).json({ error: "Job Search Agent failed to parse results: " + error.message });
  }
});

// API: Generate Custom Cover Letter and Custom Follow-up mails
app.post("/api/cover-letter/generate", async (req, res) => {
  const { resumeId, jobId, customPrompt } = req.body;
  const resume = resumes.find(r => r.id === resumeId) || resumes[0];
  const job = SEED_JOBS.find(j => j.id === jobId) || SEED_JOBS[0];

  const candidateProfile = resume 
    ? JSON.stringify(resume.parsedData || resume.content) 
    : "Siddharth Sharma, Senior software developer with robust proficiency in React, Node, Express, Vite, Tailwind CSS.";

  const ai = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Return sample tailored text
    const sampleCover = `Dear Hiring Team at ${job.company},

I am writing with high focus to express my interest in the ${job.title} position at ${job.company}. With my detailed expertise in React, TypeScript, and modern, low-latency API designs, I am eager to contribute to your enterprise software success.

In my recent roles, I have spearheaded the transition of core visual components to high-contrast modern interfaces, boosting Lighthouse Web Core Vitals by over 40%. The technical requirements for the ${job.title} role align seamlessly with my skills, particularly your focus on scalable frameworks.

Thank you for your time. I look forward to discussing how my experience can support the team.

Sincerely,
${resume?.parsedData?.name || "Siddharth Sharma"}`;

    const sampleEmail = `Subject: Application: ${job.title} - ${resume?.parsedData?.name || "Siddharth Sharma"}

Hi Hiring Team,

I've just submitted my application for the ${job.title} vacancy. Having followed ${job.company}'s growth, I'm incredibly excited about your product trajectory and would love to explore how my full-stack TypeScript foundations and clean design methods can accelerate your product roadmap.

Please find attached my resume and cover letter. Thank you so much for your time and consideration!

Best regards,
${resume?.parsedData?.name || "Siddharth Sharma"}
${resume?.parsedData?.email || "siddharth.sharma@gmail.com"} | ${resume?.parsedData?.phone || "+91-98765-43210"}`;

    return res.json({
      coverLetter: sampleCover,
      outreachEmail: sampleEmail
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are the Application Draft Agent. Write a highly tailored, exceptionally polished Cover Letter and an Outreach/Outbound recruiting email for the following candidate applying to an open role.

Candidate Profile:
${candidateProfile}

Job Details:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

Additional Custom Tone Prompt:
${customPrompt || "Professional, modern, energetic and metrics-focused"}

You must return a raw JSON structure containing:
{
  "coverLetter": "Tailored cover letter text",
  "outreachEmail": "Personalized short recruiting email to a potential contact person"
}
`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = extractSchemaJSON(response.text || "{}");
    res.json(parsed || { coverLetter: "Failed to generate tailored text", outreachEmail: "Failed to generate email" });
  } catch (error: any) {
    console.error("Cover Letter Generator Error:", error);
    res.status(500).json({ error: "Failed to generate tailored application documents: " + error.message });
  }
});

// API: AI Chat Assistant with interview prep, suggestions or follow-up letters
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, contextResumeId, contextJobId, type } = req.body;
  const resume = resumes.find(r => r.id === contextResumeId) || resumes[0];
  const job = SEED_JOBS.find(j => j.id === contextJobId) || SEED_JOBS[0];

  const systemInstructions = `
You are CareerPilot Assistant, a helpful AI Job Search and Interview Prep Coach.
If context is provided, rely heavily on it to customize your answers.
Context Candidate: ${resume ? JSON.stringify(resume.parsedData) : "No resume uploaded yet"}.
Context Target Job: ${job ? JSON.stringify(job) : "No targeted job selected yet"}.

If the user wants:
1. Interview prep: run structured mock interview questions customized to the target job position and candidate's experience. Provide critiques.
2. Follow-up Email: draft high conversion follow-up messages tailored to a recent recruiter outreach or interview.
3. Resume Improvement advice: offer direct bullet point updates aligning directly with the candidate's target field.

Be professional, concise, encouraging, and do not use unneeded technical developer jargon.
`;

  const ai = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Sim chat return
    const lastMsg = messages[messages.length - 1]?.content || "";
    let reply = `[SIMULATED COACH]: I would love to assist you with "${lastMsg.slice(0, 50)}...". I suggest focusing on highlighting key React and TypeScript performance metrics. Since you possess ${resume?.parsedData?.technicalSkills?.slice(0, 4).join(", ") || "development"} experience, you can frame answers focusing on scalability. Let's do a mock question: 'How do you optimize render performance in large-scale React platforms?'`;
    return res.json({ reply });
  }

  try {
    const formattedHistory = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    // Generate response using the latest message sequence
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory
      ],
      config: {
        systemInstruction: systemInstructions
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Chat agent error:", error);
    res.status(500).json({ reply: "I encountered an error handling your request: " + error.message });
  }
});

// API: CrewAI autonomous agent orchestration simulation
// Simulates the exact step-by-step telemetry of the 10 agents running on a target job vacancy
app.post("/api/crew/orchestrate", async (req, res) => {
  const { resumeId, jobId } = req.body;
  const resume = resumes.find(r => r.id === resumeId) || resumes[0];
  const job = SEED_JOBS.find(j => j.id === jobId) || SEED_JOBS[0];

  const ai = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  // Let's create beautiful logs dynamically using Gemini!
  // If no Gemini API is available we fallback to prebuilt highly detailed steps.
  let companyReport = "Stripe is an enterprise financial infrastructure provider. Headquartered in San Francisco with remote hubs. They process trillions of dollars yearly with high emphasis on developer API usability.";
  let contactPoints = "[{ name: 'Sarah Jenkins', role: 'Technical Recruiting Lead', email: 'sjenkins@stripe.com' }]";
  let customizedOutreach = "Outreach email tailored successfully.";
  let coverLetterText = "Cover letter crafted successfully.";
  let matchPercentage = job ? job.matchScore : 88;

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `
You are the CrewAI Orchestrator. Generate tailored telemetry outputs for a job application automatic dispatch.
Candidate Resume:
${resume ? JSON.stringify(resume.parsedData || resume.content) : "Siddharth Sharma, specialized in React, TypeScript, Tailwind."}

Target vacancy:
${JSON.stringify(job)}

Generate a raw JSON containing:
1. "companyReport": Detailed 2 sentence summary on ${job.company} industry, career tracks and size.
2. "contactPoints": List containing 1 realistic named contact for recruiting or engineering at this company, including name, role, and a real-looking corporate email.
3. "customizedOutreach": Tailored recruiting outreach note to that hiring contact.
4. "coverLetter": Formal, metrics-focused cover letter.
5. "matchScore": Adjusted score integer from 1-100.
`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsedRes = extractSchemaJSON(response.text || "{}");
      if (parsedRes) {
        if (parsedRes.companyReport) companyReport = parsedRes.companyReport;
        if (parsedRes.contactPoints) contactPoints = typeof parsedRes.contactPoints === 'string' ? parsedRes.contactPoints : JSON.stringify(parsedRes.contactPoints);
        if (parsedRes.customizedOutreach) customizedOutreach = parsedRes.customizedOutreach;
        if (parsedRes.coverLetter) coverLetterText = parsedRes.coverLetter;
        if (parsedRes.matchScore) matchPercentage = parsedRes.matchScore;
      }
    } catch (e) {
      console.error("Error generating agent details through Gemini, keeping fallbacks", e);
    }
  }

  // Generate 10 discrete agent steps telemetry
  const stepsLogs = [
    {
      step: 1,
      agentId: "resume-analyzer",
      agentName: "Resume Analysis Agent",
      message: "Initiated document indexing. Extracting past experience, degrees and timeline details.",
      output: `Parsed candidate Profile: ${resume ? resume.parsedData?.name || "Siddharth Sharma" : "Siddharth Sharma"}. Academic: ${resume?.parsedData?.education?.[0]?.degree || "B.Tech CSE"}. Duration: verified employment blocks.`,
      status: "success"
    },
    {
      step: 2,
      agentId: "skill-extractor",
      agentName: "Skill Extraction Agent",
      message: "Parsing code markers and soft proficiencies. Building unified skills taxonomy.",
      output: `Core Competencies Extracted: ${(resume?.parsedData?.technicalSkills || ["React", "TypeScript", "Tailwind CSS", "Node.js"]).join(", ")}. Added keywords to parsing payload.`,
      status: "success"
    },
    {
      step: 3,
      agentId: "job-search",
      agentName: "Job Search Agent",
      message: `Auditing active target vacancy parameters at ${job.company}. Correlating filters.`,
      output: `Validated position ${job.title} at ${job.company}. Matches user experience level preference (${job.experienceLevel || "Senior"}).`,
      status: "success"
    },
    {
      step: 4,
      agentId: "job-matcher",
      agentName: "Job Matching Agent",
      message: "Comparing candidate competence metrics against target requirement vectors.",
      output: `Sync Vector Completed. Calculated highly compatible Match Score: ${matchPercentage}%. Strengths: Heavy overlap in core frameworks.`,
      status: "success"
    },
    {
      step: 5,
      agentId: "company-researcher",
      agentName: "Company Research Agent",
      message: `Scanning news handles, Wikipedia blocks, and corporate landing feeds for ${job.company}.`,
      output: companyReport,
      status: "success"
    },
    {
      step: 6,
      agentId: "email-discovery",
      agentName: "Email Discovery Agent",
      message: `Crawling public indexes and corporate directory patterns for ${job.company} decision makers.`,
      output: `Target hiring decision contacts locked and indexed: ${contactPoints}`,
      status: "success"
    },
    {
      step: 7,
      agentId: "application-drafter",
      agentName: "Application Draft Agent",
      message: `Writing custom recruiting outreach scripts & formal documents tailoring context points.`,
      output: `Generated custom artifacts. outreachEmail length: ${customizedOutreach.length} characters. coverLetter length: ${coverLetterText.length} characters.`,
      status: "success"
    },
    {
      step: 8,
      agentId: "user-approval",
      agentName: "User Approval Agent",
      message: "Deploying cover letter and recruiter mail templates to User Approval queue.",
      output: "Application locked in queue awaiting manual submission approval or user edit override.",
      status: "success"
    },
    {
      step: 9,
      agentId: "email-sending",
      agentName: "Email Sending Agent",
      message: "Routing pre-authenticated outbox nodes to Gmail / Outlook dispatcher servers.",
      output: "Outbox transmission protocol initialized. Waiting for User Approval trigger in the Outbox deck.",
      status: "success"
    },
    {
      step: 10,
      agentId: "tracking-agent",
      agentName: "Tracking Agent",
      message: "Subscribing to response hooks, tracking pixels, and syncing Kanban pipeline tracker.",
      output: "Pipeline telemetry activated. Interview scheduler, follow-up timers, and state transitions synchronized.",
      status: "success"
    }
  ];

  res.json({
    success: true,
    steps: stepsLogs,
    metadata: {
      matchScore: matchPercentage,
      companyReport,
      contactPoints,
      customizedOutreach,
      coverLetter: coverLetterText
    }
  });
});

// App Database lists actions
app.get("/api/resumes", (req, res) => {
  res.json(resumes);
});

app.get("/api/jobs", (req, res) => {
  res.json(SEED_JOBS);
});

app.post("/api/jobs", (req, res) => {
  const { job } = req.body;
  if (job && !SEED_JOBS.some(j => j.id === job.id)) {
    SEED_JOBS.push(job);
    saveDb();
  }
  res.json({ success: true });
});

app.post("/api/resumes/delete", (req, res) => {
  const { id } = req.body;
  resumes = resumes.filter(r => r.id !== id);
  saveDb();
  res.json({ success: true });
});

app.get("/api/applications", (req, res) => {
  res.json(applications);
});

app.post("/api/applications", (req, res) => {
  const { app: newApp } = req.body;
  applications.push(newApp);
  saveDb();
  res.json({ success: true, application: newApp });
});

app.post("/api/applications/status", (req, res) => {
  const { id, status, outreachEmail, coverLetter, deadline, followUpDays, followUpReminderDate, followUpCompleted, followUpNotes } = req.body;
  const appIndex = applications.findIndex(a => a.id === id);
  if (appIndex !== -1) {
    if (status !== undefined) {
      applications[appIndex].status = status;
    }
    if (outreachEmail !== undefined) {
      applications[appIndex].outreachEmail = outreachEmail;
    }
    if (coverLetter !== undefined) {
      applications[appIndex].coverLetter = coverLetter;
    }
    if (deadline !== undefined) {
      applications[appIndex].deadline = deadline;
    }
    if (followUpDays !== undefined) {
      applications[appIndex].followUpDays = followUpDays;
    }
    if (followUpReminderDate !== undefined) {
      applications[appIndex].followUpReminderDate = followUpReminderDate;
    }
    if (followUpCompleted !== undefined) {
      applications[appIndex].followUpCompleted = followUpCompleted;
    }
    if (followUpNotes !== undefined) {
      applications[appIndex].followUpNotes = followUpNotes;
    }
    if (status === "Applied" && !applications[appIndex].dateApplied) {
      applications[appIndex].dateApplied = new Date().toLocaleDateString();
    }
    saveDb();
    res.json({ success: true, application: applications[appIndex] });
  } else {
    res.status(404).json({ error: "Application not found" });
  }
});

// API: Auto-Draft Follow-up using the Gemini SDK
app.post("/api/follow-up/generate", async (req, res) => {
  const { company, jobTitle, recipientName, daysOverdue } = req.body;
  if (!company || !jobTitle) {
    return res.status(400).json({ error: "Missing company or jobTitle" });
  }

  const ai = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  const systemInstructions = `
You are the CareerPilot AI Outreach Agent. Draft a professional, highly personalized follow-up email 
nudge for a candidate who applied to a specific job position at an organization, and some time has passed.
Make the tone polite, eager, brief, and incredibly professional. Suggest a clear, low-friction next step.
Avoid flowery or artificial AI clichés like 'I hope this email finds you well' or 'delve' or 'game-changer'. 
Use direct, crisp human phrasing.
`;

  const prompt = `
Draft a follow-up email for:
Job Title: ${jobTitle}
Company: ${company}
Hiring Lead Name: ${recipientName || "Hiring Lead"}
Days since application: ${daysOverdue !== undefined ? daysOverdue : 5} days

Format the response containing a clear, subject line at the top, and double spaced email body paragraphs.
`;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Dynamic fallbacks of gorgeous bespoke content
    const subject = `Subject: Following up: ${jobTitle} application at ${company}`;
    const salutation = `Hi ${recipientName || "Hiring Team"},`;
    const body = `I hope your week is off to a great start.

I'm writing to briefly follow up on my application for the ${jobTitle} position at ${company}. Having tracked your recent product expansions, I remain extremely interested in contributing my expertise to your engineering and product objectives.

From my review, my experience in building scalable modern features and optimizing frontend codebases aligns directly with ${company}'s standard of excellence. 

Please let me know if there are any additional details or resume supplements I can provide. I look forward to hearing from you regarding potential next steps.

Best regards,
[Your Name]`;

    return res.json({ text: `${subject}\n\n${salutation}\n\n${body}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstructions
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini follow-up generation failed:", error);
    // Fallback on error
    const subject = `Subject: Follow-up regarding ${jobTitle} application at ${company}`;
    const body = `Dear ${recipientName || "Hiring Lead"},\n\nI am following up on my application for the ${jobTitle} vacancy at ${company}.\n\nGiven my extensive engineering alignment, I am eager to discuss how I can bring immediate value to your current workflows.\n\nWarm regards,\n[Your Name]`;
    res.json({ text: `${subject}\n\n${body}` });
  }
});

// API: LinkedIn Profile Analysis & CrewAI Agents (Proxied to FastAPI on port 8000)
app.all("/api/linkedin/*", async (req, res) => {
  const targetUrl = `http://127.0.0.1:8000${req.originalUrl}`;
  try {
    const headers: Record<string, string> = {};
    if (req.headers["content-type"]) {
      headers["content-type"] = req.headers["content-type"] as string;
    }
    if (req.headers["authorization"]) {
      headers["authorization"] = req.headers["authorization"] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined
    };

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error(`[Express Proxy Error] Failed to proxy ${req.method} ${req.originalUrl}:`, error.message);
    res.status(500).json({ error: `Proxy to FastAPI failed: ${error.message}` });
  }
});

// Serve Frontend Vite / SPA
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerPilot AI Full-Stack Server running and bound on port ${PORT}`);
  });
}

startServer();
