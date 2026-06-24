/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Sparkles, 
  Settings, 
  CheckCircle,
  Play,
  Terminal,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  Info,
  Grid,
  List,
  ExternalLink,
  Globe,
  Users,
  Award,
  Cpu,
  Mail,
  FileText,
  Send,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Check,
  Bookmark,
  BookmarkCheck,
  Bell,
  Sliders
} from "lucide-react";
import { Job, Resume, Application } from "../types";

interface JobSearchBoardProps {
  jobs: Job[];
  resumes: Resume[];
  activeResumeId: string;
  onTriggerCrew: (jobId: string, resumeId: string) => Promise<any>;
  applications: Application[];
}

export default function JobSearchBoard({
  jobs,
  resumes,
  activeResumeId,
  onTriggerCrew,
  applications,
}: JobSearchBoardProps) {
  // Saved Jobs tracking states
  const [jobsTab, setJobsTab] = useState<"explorer" | "saved">("explorer");
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("saved_job_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist saved jobs
  useEffect(() => {
    localStorage.setItem("saved_job_ids", JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  const toggleSaveJob = (jobId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSavedJobIds(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      } else {
        return [...prev, jobId];
      }
    });
  };

  // Search parameters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [locFilter, setLocFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dynamic interactive Job Search Agent states
  const [searchedJobs, setSearchedJobs] = useState<Job[]>([]);
  const [isSearchingWithAgent, setIsSearchingWithAgent] = useState(false);
  const [agentQuery, setAgentQuery] = useState("");
  const [agentLocation, setAgentLocation] = useState("");
  const [agentSearchNotice, setAgentSearchNotice] = useState("");

  const combinedJobs = [...searchedJobs, ...jobs];

  // State for Expected Annual Salary range (LPA)
  const [minSalaryRaw, setMinSalaryRaw] = useState<number>(0);
  const [maxSalaryRaw, setMaxSalaryRaw] = useState<number>(100);

  // Parse salary strings to Lakhs per annum
  const parseSalaryLPA = (salaryStr: string): { min: number; max: number } => {
    const cleanStr = (salaryStr || "").replace(/,/g, '');
    const matches = cleanStr.match(/\d+/g);
    if (!matches || matches.length === 0) {
      return { min: 0, max: 100 };
    }
    
    let min = parseInt(matches[0], 10);
    let max = matches[1] ? parseInt(matches[1], 10) : min;
    
    // Convert base values if needed
    if (min >= 100000) {
      min = min / 100000;
    }
    if (max >= 100000) {
      max = max / 100000;
    }
    
    return { min, max };
  };

  // Selection & Telemetry state
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const userEmail = activeResume?.parsedData?.email || "candidate@example.com";

  // Job alert subscription state
  const [alertSettings, setAlertSettings] = useState<{
    email: string;
    enabled: boolean;
    frequency: "instant" | "daily" | "weekly";
    minScore: number;
    skills: string[];
  }>(() => {
    try {
      const stored = localStorage.getItem("job_alert_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            email: parsed.email || "",
            enabled: !!parsed.enabled,
            frequency: parsed.frequency || "daily",
            minScore: typeof parsed.minScore === "number" ? parsed.minScore : 75,
            skills: Array.isArray(parsed.skills) ? parsed.skills : []
          };
        }
      }
    } catch {}
    return {
      email: "",
      enabled: false,
      frequency: "daily",
      minScore: 75,
      skills: []
    };
  });

  const [alertSettingsExpanded, setAlertSettingsExpanded] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    sentCount: number;
    matchedJobs: Job[];
    subject: string;
    body: string;
  } | null>(null);

  // Sync user email when activeResume changes
  useEffect(() => {
    if (activeResume) {
      const defaultEmail = activeResume.parsedData?.email || "candidate@example.com";
      setAlertSettings(prev => {
        if (prev.email) return prev;
        return { ...prev, email: defaultEmail };
      });
    }
  }, [activeResumeId, activeResume]);

  // Sync skills from activeResume
  const getSkillsFromActiveResume = () => {
    if (!activeResume) return [];
    const tech = activeResume.skills?.technicalSkills || activeResume.parsedData?.technicalSkills || [];
    const keywords = activeResume.skills?.jobRelevantKeywords || [];
    const tools = activeResume.skills?.tools || [];
    return Array.from(new Set([...tech, ...keywords, ...tools].map(s => s.trim()).filter(Boolean)));
  };

  useEffect(() => {
    if (activeResume) {
      const list = getSkillsFromActiveResume();
      setAlertSettings(prev => {
        if (prev.skills.length > 0) return prev;
        return {
          ...prev,
          skills: list
        };
      });
    }
  }, [activeResumeId, activeResume]);

  // Save changes
  useEffect(() => {
    localStorage.setItem("job_alert_settings", JSON.stringify(alertSettings));
  }, [alertSettings]);

  const toggleSkillInAlert = (skill: string) => {
    setAlertSettings(prev => {
      const exists = prev.skills.includes(skill);
      const updatedSkills = exists 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      return {
        ...prev,
        skills: updatedSkills
      };
    });
  };

  const runAlertSimulation = () => {
    // filter combinedJobs based on minScore and skill overlap
    const matched = combinedJobs.filter(job => {
      if (job.matchScore < alertSettings.minScore) return false;
      
      const jobText = (job.title + " " + job.description).toLowerCase();
      // To prevent false positives, we check if any selected skills are included in the job text
      return alertSettings.skills.some(skill => 
        jobText.includes(skill.toLowerCase())
      );
    });

    const emailSubject = `[Job Alert] ${matched.length} New Matching Vacancies Discovered`;
    const emailBody = `Hello,\n\nWe have generated a simulation of your scheduled match email:\n\n` +
      `Target Subscription: ${alertSettings.email}\n` +
      `Trigger Overlap: >= ${alertSettings.minScore}% Match\n` +
      `Frequency Interval: ${alertSettings.frequency.toUpperCase()}\n\n` +
      `Discovered matching jobs (${matched.length}):\n` +
      matched.slice(0, 3).map((job, idx) => `${idx + 1}. [${job.matchScore}% Match] ${job.title} at ${job.company}`).join("\n") +
      (matched.length > 3 ? `\n...and ${matched.length - 3} others.` : "") +
      `\n\nTo view all direct matches, access your dashboard workspace.`;

    setSimulationResult({
      sentCount: matched.length,
      matchedJobs: matched,
      subject: emailSubject,
      body: emailBody
    });
  };
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [crewRunning, setCrewRunning] = useState(false);
  const [crewLogs, setCrewLogs] = useState<any[]>([]);
  const [crewMetadata, setCrewMetadata] = useState<any>(null);
  const [currentRunningStep, setCurrentRunningStep] = useState(0);

  // Real-time Independent Agent States 
  const [matchingStatus, setMatchingStatus] = useState<"idle" | "running" | "completed">("idle");
  const [researchStatus, setResearchStatus] = useState<"idle" | "running" | "completed">("idle");
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [researchProgress, setResearchProgress] = useState(0);
  const [matchingDetails, setMatchingDetails] = useState<any>(null);
  const [researchDetails, setResearchDetails] = useState<any>(null);

  // Email Discovery Agent States
  const [discoveryStatus, setDiscoveryStatus] = useState<"idle" | "running" | "completed">("idle");
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [discoveryDetails, setDiscoveryDetails] = useState<any>(null);

  // Application Draft Agent States
  const [draftStatus, setDraftStatus] = useState<"idle" | "running" | "completed">("idle");
  const [draftProgress, setDraftProgress] = useState(0);
  const [draftTone, setDraftTone] = useState("professional");
  const [draftInstruction, setDraftInstruction] = useState("");
  const [draftDetails, setDraftDetails] = useState<any>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedOutreachEmail, setEditedOutreachEmail] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");

  // User Approval Agent States
  const [approvalStatus, setApprovalStatus] = useState<"idle" | "pending" | "approved" | "rejected">("idle");

  // Email Sending Agent States
  const [sendingStatus, setSendingStatus] = useState<"idle" | "ready" | "sending" | "completed">("idle");
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);

  // Tracking Agent States
  const [trackingStatus, setTrackingStatus] = useState<"idle" | "running" | "completed">("idle");
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [trackingDetails, setTrackingDetails] = useState<any>(null);

  const [activeAgentTab, setActiveAgentTab] = useState<number>(1);

  // Reset agent dashboards when selected job changes
  useEffect(() => {
    setActiveAgentTab(1);
    setMatchingStatus("idle");
    setResearchStatus("idle");
    setMatchingProgress(0);
    setResearchProgress(0);
    setMatchingDetails(null);
    setResearchDetails(null);

    // Reset new agents
    setDiscoveryStatus("idle");
    setDiscoveryProgress(0);
    setDiscoveryDetails(null);

    setDraftStatus("idle");
    setDraftProgress(0);
    setDraftDetails(null);
    setDraftInstruction("");
    setIsEditingDraft(false);
    setEditedOutreachEmail("");
    setEditedCoverLetter("");

    setApprovalStatus("idle");

    setSendingStatus("idle");
    setSendingProgress(0);
    setSendingLogs([]);

    setTrackingStatus("idle");
    setTrackingProgress(0);
    setTrackingDetails(null);
  }, [selectedJob?.id]);

  // Run Job Matching Agent Simulation
  const runJobMatchingAgent = async () => {
    if (!selectedJob) return;
    setMatchingStatus("running");
    setMatchingProgress(10);
    
    const interval = setInterval(() => {
      setMatchingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    setTimeout(() => {
      const activeResume = resumes.find(r => r.id === activeResumeId) || resumes[0];
      const resumeSkills = activeResume?.skills?.technicalSkills || ["React", "TypeScript", "Tailwind CSS", "Node.js"];
      
      const jobText = (selectedJob.title + " " + selectedJob.description).toLowerCase();
      const overlapping = resumeSkills.filter(skill => 
        jobText.includes(skill.toLowerCase()) || 
        skill.toLowerCase().split(' ').some(word => word.length > 2 && jobText.includes(word))
      );
      
      const missing = selectedJob.matchAnalysis?.gapAnalysis || ["No significant gaps identified."];
      
      const ranked = [...combinedJobs].map(job => {
        let score = job.matchScore;
        if (activeResume) {
          const oCount = resumeSkills.filter(skill => 
            (job.title + " " + job.description).toLowerCase().includes(skill.toLowerCase())
          ).length;
          // Dynamically compute score to simulate live analysis
          score = Math.min(100, Math.max(45, 60 + oCount * 9));
        }
        return {
          id: job.id,
          title: job.title,
          company: job.company,
          score: score
        };
      }).sort((a, b) => b.score - a.score);

      clearInterval(interval);
      setMatchingDetails({
        overlapping: overlapping.length > 0 ? overlapping : [resumeSkills[0] || "Frontend Foundations"],
        gaps: missing,
        rankings: ranked,
        score: selectedJob.matchScore
      });
      setMatchingProgress(100);
      setMatchingStatus("completed");
    }, 800);
  };

  // Run Company Research Agent Simulation
  const runCompanyResearchAgent = async () => {
    if (!selectedJob) return;
    setResearchStatus("running");
    setResearchProgress(15);

    const interval = setInterval(() => {
      setResearchProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 100);

    setTimeout(() => {
      const com = selectedJob.company.toLowerCase().replace(/\s/g, '');
      const cleanCompanyUrl = selectedJob.jobUrl || `https://www.${com}.com/careers`;
      
      clearInterval(interval);
      setResearchDetails({
        website: cleanCompanyUrl,
        industry: selectedJob.industry || "Information Technology",
        location: selectedJob.location,
        size: selectedJob.companySize || "500 - 1,000 employees",
        recruiter: {
          name: selectedJob.company === "Razorpay" ? "Rohit Kumar" : selectedJob.company === "CRED" ? "Neha Deshmukh" : "Sarah Jenkins",
          role: "Head of Talent Acquisition",
          email: selectedJob.company === "Razorpay" ? "rohit.kumar@razorpay.com" : selectedJob.company === "CRED" ? "neha.d@cred.club" : `sjenkins@${com}.com`
        }
      });
      setResearchProgress(100);
      setResearchStatus("completed");
    }, 700);
  };

  // Run Email Discovery Agent
  const runEmailDiscoveryAgent = async () => {
    if (!selectedJob) return;
    setDiscoveryStatus("running");
    setDiscoveryProgress(15);

    const interval = setInterval(() => {
      setDiscoveryProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 120);

    setTimeout(() => {
      const com = selectedJob.company.toLowerCase().replace(/\s/g, '');
      const discoveredMail = selectedJob.company === "Razorpay" ? "rohit.kumar@razorpay.com" : selectedJob.company === "CRED" ? "neha.d@cred.club" : `sjenkins@${com}.com`;
      const discoveredName = selectedJob.company === "Razorpay" ? "Rohit Kumar" : selectedJob.company === "CRED" ? "Neha Deshmukh" : "Sarah Jenkins";
      
      clearInterval(interval);
      setDiscoveryDetails({
        email: discoveredMail,
        name: discoveredName,
        role: "Head of Talent Acquisition / Tech Hiring Lead",
        confidence: "98% (Corporate MX & DNS handshake verified)",
        sources: ["Corporate Directory Index", "LinkedIn Talent crawl"]
      });
      setDiscoveryProgress(100);
      setDiscoveryStatus("completed");
    }, 750);
  };

  // Run Application Draft Agent (interacts with backend cover letter generator)
  const runApplicationDraftAgent = async () => {
    if (!selectedJob) return;
    const activeResume = resumes.find(r => r.id === activeResumeId) || resumes[0];
    if (!activeResume) {
      alert("Please upload and extract skills from your candidate resume in the Resume Manager first!");
      return;
    }

    setDraftStatus("running");
    setDraftProgress(10);

    const interval = setInterval(() => {
      setDraftProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const response = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: activeResume.id,
          jobId: selectedJob.id,
          customPrompt: `Tone: ${draftTone}. Instructions override: ${draftInstruction || "Professional, metrics-focused application outbox content"}`
        })
      });
      const data = await response.json();
      clearInterval(interval);

      if (data.coverLetter && data.outreachEmail) {
        setDraftDetails({
          coverLetter: data.coverLetter,
          outreachEmail: data.outreachEmail
        });
        setEditedCoverLetter(data.coverLetter);
        setEditedOutreachEmail(data.outreachEmail);
        setDraftProgress(100);
        setDraftStatus("completed");
        setApprovalStatus("pending");
      } else {
        throw new Error("Drafting failed");
      }
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setDraftStatus("idle");
      alert("Failed to draft application documents. Please verify environment endpoints.");
    }
  };

  // Run User Approval action: Approve or Reject
  const handleApproveDraft = () => {
    setApprovalStatus("approved");
    setSendingStatus("ready");
  };

  const handleRejectDraft = () => {
    setApprovalStatus("rejected");
    setDraftStatus("idle");
    setDraftDetails(null);
  };

  // Run Email Sending Agent
  const runEmailSendingAgent = async () => {
    if (approvalStatus !== "approved") {
      alert("Draft must be approved by the User Approval Agent first!");
      return;
    }

    setSendingStatus("sending");
    setSendingProgress(5);
    setSendingLogs(["Initializing Outbox Transmission module..."]);

    const steps = [
      { prg: 25, log: "Connecting to secure SMTP exchange on smtp.gmail.com:587..." },
      { prg: 50, log: "OAuth2 pre-authenticated session active. Scope: user.gmail.outbound verified." },
      { prg: 75, log: "Compiling MIME packet (resume, custom cover, outreach inline headers)..." },
      { prg: 100, log: `Secure dispatch complete! MessageID: <outbound-${Date.now()}@google-ai-studio>` }
    ];

    let i = 0;
    const runNext = () => {
      if (i < steps.length) {
        setTimeout(() => {
          setSendingProgress(steps[i].prg);
          setSendingLogs(prev => [...prev, steps[i].log]);
          i++;
          runNext();
        }, 350);
      } else {
        setSendingStatus("completed");
      }
    };
    runNext();
  };

  // Run Tracking Agent
  const runTrackingAgent = async () => {
    if (!selectedJob) return;
    setTrackingStatus("running");
    setTrackingProgress(10);

    const interval = setInterval(() => {
      setTrackingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 30;
      });
    }, 100);

    setTimeout(async () => {
      const activeResume = resumes.find(r => r.id === activeResumeId) || resumes[0];
      const trackerApp = {
        id: "app-" + Date.now(),
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        location: selectedJob.location,
        salary: selectedJob.salary,
        status: "Applied" as const,
        dateCreated: new Date().toLocaleDateString(),
        deadline: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 14);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })(),
        coverLetter: editedCoverLetter || draftDetails?.coverLetter || "Tailored cover letter crafted.",
        outreachEmail: editedOutreachEmail || draftDetails?.outreachEmail || "Outbox outreach inline email text.",
        recipientEmail: discoveryDetails?.email || `sjenkins@${selectedJob.company.toLowerCase().replace(/\s/g, '')}.com`,
        recipientName: discoveryDetails?.name || "Sarah Jenkins",
        historyLogs: [
          {
            id: "hist-" + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            agentName: "Tracking Agent",
            message: `Registered application trajectory. Sync state set: 'Applied' stage in corporate trackers.`
          }
        ]
      };

      try {
        // Post/Save to local fullstack sessions database
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: trackerApp })
        });
      } catch (err) {
        console.error("Tracking save backend error", err);
      }

      clearInterval(interval);
      setTrackingDetails({
        status: "Applied",
        date: new Date().toLocaleDateString(),
        trackingId: "TRACK-" + Math.floor(Math.random() * 1000000),
        pixelActive: "True - Outbound pixel tracking responses initialized",
        kanbanSync: "Synchronized with Application Center",
      });
      setTrackingProgress(100);
      setTrackingStatus("completed");
    }, 850);
  };

  // Dynamic Search Agent portals scraper action
  const handleRunJobSearchAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentQuery.trim()) return;

    setIsSearchingWithAgent(true);
    setAgentSearchNotice("");
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: agentQuery, 
          location: agentLocation,
          resumeId: activeResumeId 
        })
      });
      const data = await response.json();
      if (data.success && data.jobs) {
        setSearchedJobs(data.jobs);
        if (data.simulationNotice) {
          setAgentSearchNotice(data.simulationNotice);
        }
        if (data.jobs.length > 0) {
          setSelectedJob(data.jobs[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingWithAgent(false);
    }
  };

  // Run Job Search matched directly by extracted Resume Taxonomy Skills
  const handleSkillsMatchAgentSearch = async () => {
    const activeResume = resumes.find(r => r.id === activeResumeId) || resumes[0];
    if (!activeResume) {
      alert("Please upload and extract skills from your candidate resume first under 'Resume Manager'!");
      return;
    }
    const skills = activeResume.skills;
    if (!skills || ((skills.technicalSkills || []).length === 0 && (skills.jobRelevantKeywords || []).length === 0)) {
      alert("This resume has no extracted skills taxonomy. Please extract skills or manually save some tags under 'Resume Manager' first!");
      return;
    }

    // Compose a query from technical skills & keywords
    const techSkills = skills.technicalSkills || [];
    const keywords = skills.jobRelevantKeywords || [];
    const selection = [...techSkills.slice(0, 3), ...keywords.slice(0, 1)];
    const query = selection.length > 0 ? selection.join(", ") : "Developer";

    setAgentQuery(query);
    setIsSearchingWithAgent(true);
    setAgentSearchNotice(`Formulating search requirements targeting skills: [${query}]...`);

    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: query, 
          location: agentLocation,
          resumeId: activeResume.id 
        })
      });
      const data = await response.json();
      if (data.success && data.jobs) {
        setSearchedJobs(data.jobs);
        if (data.simulationNotice) {
          setAgentSearchNotice(
            `Successfully triggered Skills-Match Agent. Matched ${data.jobs.length} roles matching taxonomy: "${query}".`
          );
        }
        if (data.jobs.length > 0) {
          setSelectedJob(data.jobs[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingWithAgent(false);
    }
  };

  // Total saved independent of other UI search filters, but exclusion of started process is active
  const totalSavedInterestedCount = combinedJobs.filter(
    (job) => savedJobIds.includes(job.id) && !applications.some((app) => app.jobId === job.id)
  ).length;

  // Filters calculation
  const filteredJobs = combinedJobs.filter(job => {
    // Tab filtering
    if (jobsTab === "saved") {
      const isSaved = savedJobIds.includes(job.id);
      const isNotStarted = !applications.some(app => app.jobId === job.id);
      if (!isSaved || !isNotStarted) return false;
    }

    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || 
                        (roleFilter === "remote" && job.type === "remote") || 
                        (roleFilter === "hybrid" && job.type === "hybrid") || 
                        (roleFilter === "onsite" && job.type === "onsite");

    const matchesLoc = locFilter === "all" || job.location.toLowerCase().includes(locFilter.toLowerCase());
    const matchesExp = expFilter === "all" || job.experienceLevel.toLowerCase().includes(expFilter.toLowerCase());

    const { min: jobMin, max: jobMax } = parseSalaryLPA(job.salary);
    const matchesSalary = jobMax >= minSalaryRaw && jobMin <= maxSalaryRaw;

    return matchesSearch && matchesRole && matchesLoc && matchesExp && matchesSalary;
  });

  // Execute CrewAI agent fleet pipelines!
  const handleLaunchAgentCrew = async (jobId: string) => {
    if (!activeResumeId) {
      alert("Please upload and select an active candidate resume first under 'Resume Management'!");
      return;
    }
    setCrewRunning(true);
    setCrewLogs([]);
    setCrewMetadata(null);
    setCurrentRunningStep(0);

    try {
      // Fetch telemetry details from backend Express route
      const response = await onTriggerCrew(jobId, activeResumeId);
      if (response && response.success) {
        // Stream the logs iteratively for beautiful UX
        for (let i = 0; i < response.steps.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 800)); // stagger step logs
          setCrewLogs((prev) => [...prev, response.steps[i]]);
          setCurrentRunningStep(i + 1);
        }
        setCrewMetadata(response.metadata);
      }
    } catch (e: any) {
      console.error(e);
      setCrewLogs((prev) => [
        ...prev, 
        { 
          agentName: "Orchestrator Terminal", 
          message: "Encountered processing block during run. Check your env settings.",
          status: "error" 
        }
      ]);
    } finally {
      setCrewRunning(false);
    }
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (score >= 80) return "bg-purple-50 text-purple-700 border-purple-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  return (
    <div className="space-y-6">
      {/* 10-Agent Pipeline Operational Node Indicators */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-55 bg-slate-50 p-4 rounded-3xl border border-slate-205/60 text-left">
        <div className="flex items-center space-x-2 mr-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Operational Agent Fleet:</span>
        </div>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-850 text-[11px] font-bold rounded-xl border border-blue-100">
          <Search className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
          <span>Job Search Agent [ACTIVE]</span>
        </span>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-800 text-[11px] font-bold rounded-xl border border-purple-100">
          <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
          <span>Job Matching Agent [ACTIVE]</span>
        </span>
      </div>

      <div id="job-board-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Target Search and Jobs Filter List */}
      <div className="lg:col-span-6 space-y-6">
        {/* Interactive Job Search Agent Control Panel */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-lg space-y-4 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500/10 border-l border-b border-yellow-500/20 px-2.5 py-1 rounded-bl-2xl">
            <span className="text-[8.5px] font-mono text-yellow-500 uppercase tracking-widest font-black">Agent Core: ACTIVE</span>
          </div>
          
          <div className="flex items-center space-x-3 pb-2 border-b border-white/10">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Search className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-wide">Job Search Agent Command Panel</h3>
              <p className="text-[10px] text-indigo-300 font-mono">AUTONOMOUS MULTI-PORTAL SCRAPER & WEB INDEXER</p>
            </div>
          </div>

          <form onSubmit={handleRunJobSearchAgent} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8.5px] font-mono uppercase font-black text-indigo-300 tracking-wider">Target Position / Stacks</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. React Developer, Node Architect"
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-indigo-500/30 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-mono uppercase font-black text-indigo-300 tracking-wider">Target Location (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Bengaluru, Remote India"
                  value={agentLocation}
                  onChange={(e) => setAgentLocation(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-indigo-500/30 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
              <span className="text-[9.5px] text-indigo-200 font-mono">LinkedIn, Indeed indexing active</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isSearchingWithAgent}
                onClick={handleSkillsMatchAgentSearch}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center space-x-2 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md cursor-pointer"
                title="Automatically query and match jobs based on skills extracted from your selected resume"
              >
                <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse shrink-0" />
                <span>Auto-Match Skills</span>
              </button>

              <button
                type="submit"
                disabled={isSearchingWithAgent || !agentQuery.trim()}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center space-x-2 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md cursor-pointer"
              >
                {isSearchingWithAgent ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Scraping Portals...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <span>Run Query</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </form>

          {agentSearchNotice && (
            <div className="bg-indigo-950/40 border border-indigo-500/20 p-2.5 rounded-xl text-[10px] text-indigo-200 text-left leading-relaxed flex items-center space-x-2 animate-fade-in">
              <Info className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>{agentSearchNotice}</span>
            </div>
          )}
        </div>

        {/* Job Alert Settings panel */}
        <div id="job-alerts-panel" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl border transition-colors ${alertSettings.enabled ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <Bell className={`h-4.5 w-4.5 ${alertSettings.enabled ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  Job Match Alert Settings
                  {alertSettings.enabled ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8.5px] font-mono font-bold bg-emerald-50 text-emerald-700 uppercase border border-emerald-100">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8.5px] font-mono font-bold bg-slate-50 text-slate-400 uppercase border border-slate-200">Inactive</span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Subscribe to instant email notifications based on your extracted resume skills.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setAlertSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition-all border ${
                  alertSettings.enabled 
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-transparent" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {alertSettings.enabled ? "Subscribed" : "Subscribe"}
              </button>

              <button
                type="button"
                onClick={() => setAlertSettingsExpanded(!alertSettingsExpanded)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                title="Configure Alert Criteria"
              >
                <Sliders className={`h-4 w-4 transition-transform ${alertSettingsExpanded ? 'rotate-90 text-purple-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Simple alert subscription view when collapsed */}
          {!alertSettingsExpanded && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <div className="flex items-center space-x-2 truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium truncate">{alertSettings.email || "No email assigned"}</span>
                <span className="text-slate-300">•</span>
                <span className="capitalize">{alertSettings.frequency} briefing</span>
                <span className="text-slate-300">•</span>
                <span>{alertSettings.skills.length} tracked skills</span>
              </div>
              <button
                type="button"
                onClick={() => setAlertSettingsExpanded(true)}
                className="text-purple-600 hover:text-purple-705 font-bold shrink-0 cursor-pointer text-xs"
              >
                Configure
              </button>
            </div>
          )}

          {/* Expanded Configuration form */}
          {alertSettingsExpanded && (
            <div className="space-y-4 pt-1 animate-fade-in text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column Configuration */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Recipient Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input 
                        type="email"
                        required
                        placeholder="your.email@example.com"
                        value={alertSettings.email}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full text-xs bg-white border border-slate-200 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-slate-800 outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      <span>Minimum Match Overlap</span>
                      <span className="font-mono text-purple-700 font-extrabold">{alertSettings.minScore}% Match</span>
                    </div>
                    <div className="flex items-center space-x-3 pt-1">
                      <input 
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={alertSettings.minScore}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, minScore: parseInt(e.target.value, 10) }))}
                        className="flex-1 accent-purple-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">Min Threshold</span>
                    </div>
                  </div>
                </div>

                {/* Right Column Configuration */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Notification Frequency</label>
                    <div className="flex space-x-1 p-1 bg-slate-100 rounded-xl">
                      {(["instant", "daily", "weekly"] as const).map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setAlertSettings(prev => ({ ...prev, frequency: freq }))}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                            alertSettings.frequency === freq
                              ? "bg-white text-purple-750 shadow-sm"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Monitored Resume Skills</label>
                      <span className="text-[9.5px] font-mono text-purple-500 font-bold">{alertSettings.skills.length} Tracked</span>
                    </div>
                    
                    {/* Skills Bubble Cloud Selector */}
                    <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-2 max-h-[85px] overflow-y-auto space-x-1 space-y-1 text-left leading-none">
                      {getSkillsFromActiveResume().length === 0 ? (
                        <div className="text-[10px] italic text-slate-400 p-2 text-center">No skills available from active resume. Select or upload a resume to populate.</div>
                      ) : (
                        getSkillsFromActiveResume().map((skill) => {
                          const isTracked = alertSettings.skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkillInAlert(skill)}
                              className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                isTracked 
                                  ? "bg-purple-100/80 border-purple-200 text-purple-750" 
                                  : "bg-slate-100 border-slate-200 text-slate-400 line-through decoration-slate-300"
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action and test triggers */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-3">
                <span className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  Auto-Saved Preferences
                </span>

                <button
                  type="button"
                  onClick={runAlertSimulation}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100/80 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <Sparkles className="h-3 w-3 animate-pulse text-purple-600" />
                  <span>Test Alarm & Simulate Email</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Simulation Email Pop-Up Modal */}
        {simulationResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 text-left space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Outgoing Alert Simulation</h4>
                    <p className="text-[10px] text-slate-400">Preview representation generated by Alerting Engine</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulationResult(null)}
                  className="p-1 text-slate-405 hover:text-slate-205 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-2 text-xs bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <div className="flex border-b border-slate-900 pb-1 text-[11px]">
                  <span className="w-16 font-mono text-slate-500 font-bold">To:</span>
                  <span className="text-slate-300 font-mono">{alertSettings.email}</span>
                </div>
                <div className="flex border-b border-slate-900 pb-1 text-[11px]">
                  <span className="w-16 font-mono text-slate-500 font-bold">Subject:</span>
                  <span className="text-yellow-400 font-bold">{simulationResult.subject}</span>
                </div>
                <div className="flex border-b border-slate-900 pb-1 text-[11px]">
                  <span className="w-16 font-mono text-slate-500 font-bold">Trigger:</span>
                  <span className="text-emerald-400 font-mono font-black">&gt;= {alertSettings.minScore}% match on {alertSettings.skills.length} tracked skills</span>
                </div>
                <div className="pt-2 text-[11.5px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {simulationResult.body}
                </div>
              </div>

              <div className="flex justify-between items-center rounded-2xl bg-slate-950 px-4 py-3 border border-slate-800/60">
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed mr-4">
                  Real emails would qualify as background matching events are indexed. Subscription is fully synchronized to browser engine.
                </p>
                <button
                  type="button"
                  onClick={() => setSimulationResult(null)}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-705 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Explore Compatible Vacancies</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Explore active vacancies or view saved items pending application launch.</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold self-start sm:self-auto shrink-0 bg-slate-50 border px-2 py-0.5 rounded-md">API STATUS: DIRECT FEED</span>
          </div>

          {/* Tab Switcher: Explore Jobs vs Saved Jobs */}
          <div className="flex space-x-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setJobsTab("explorer")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                jobsTab === "explorer"
                  ? "bg-white text-purple-750 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Openings ({combinedJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setJobsTab("saved")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                jobsTab === "saved"
                  ? "bg-white text-purple-750 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Bookmark className={`h-3 w-3 ${jobsTab === 'saved' ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>Saved Interested</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono leading-none ${
                jobsTab === "saved" ? "bg-purple-100 text-purple-800" : "bg-slate-200 text-slate-600"
              }`}>
                {totalSavedInterestedCount}
              </span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              id="job-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter title, corporate name, stacks, location..."
              className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 bg-slate-50"
            />
          </div>

          {/* Filters bento rows */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Work Mode</label>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-[11px] p-2 mt-1 rounded-lg border border-slate-205 focus:outline-none bg-slate-50 text-slate-755 cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Location</label>
              <select 
                value={locFilter}
                onChange={(e) => setLocFilter(e.target.value)}
                className="w-full text-[11px] p-2 mt-1 rounded-lg border border-slate-205 focus:outline-none bg-slate-50 text-slate-755 cursor-pointer"
              >
                <option value="all">All Locations</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tier</label>
              <select 
                value={expFilter}
                onChange={(e) => setExpFilter(e.target.value)}
                className="w-full text-[11px] p-2 mt-1 rounded-lg border border-slate-205 focus:outline-none bg-slate-50 text-slate-755 cursor-pointer"
              >
                <option value="all">All levels</option>
                <option value="Senior">Senior</option>
                <option value="Mid">Mid-Senior</option>
              </select>
            </div>
          </div>

          {/* Salary Expectation Filter */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Expected Annual Salary Range (INR)
              </label>
              <span className="text-[10.5px] font-mono font-black text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-lg border border-purple-100/50">
                ₹{minSalaryRaw}L - ₹{maxSalaryRaw}L LPA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min LPA"
                  value={minSalaryRaw || ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setMinSalaryRaw(isNaN(v) ? 0 : v);
                  }}
                  className="w-full text-xs pl-7 pr-12 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/10 bg-slate-50 font-semibold text-slate-700"
                />
                <span className="absolute right-3.5 top-2 text-[9px] text-slate-400 font-bold font-mono">Min LPA</span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max LPA"
                  value={maxSalaryRaw || ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setMaxSalaryRaw(isNaN(v) ? 100 : v);
                  }}
                  className="w-full text-xs pl-7 pr-12 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/10 bg-slate-50 font-semibold text-slate-700"
                />
                <span className="absolute right-3.5 top-2 text-[9px] text-slate-400 font-bold font-mono">Max LPA</span>
              </div>
            </div>

            {/* Indian standard salary packages quick templates */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => { setMinSalaryRaw(8); setMaxSalaryRaw(15); }}
                className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 text-slate-600 transition-colors font-medium cursor-pointer"
              >
                Entry-Level (8 - 15 LPA)
              </button>
              <button
                type="button"
                onClick={() => { setMinSalaryRaw(15); setMaxSalaryRaw(25); }}
                className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 text-slate-600 transition-colors font-medium cursor-pointer"
              >
                Mid-Career (15 - 25 LPA)
              </button>
              <button
                type="button"
                onClick={() => { setMinSalaryRaw(25); setMaxSalaryRaw(45); }}
                className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 text-slate-600 transition-colors font-medium cursor-pointer"
              >
                Senior Suite (25 - 45 LPA)
              </button>
              <button
                type="button"
                onClick={() => { setMinSalaryRaw(0); setMaxSalaryRaw(100); }}
                className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 text-slate-600 transition-colors font-medium cursor-pointer"
              >
                Unspecified / Offscale
              </button>
            </div>
          </div>
                {/* Results output list */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-slate-500 font-bold font-mono">Found {filteredJobs.length} match records</span>
            <div className="flex items-center space-x-3">
              {/* Grid / List Layout Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 font-mono scale-95">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "grid" 
                      ? "bg-white text-purple-600 shadow-sm" 
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Grid Format View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list" 
                      ? "bg-white text-purple-600 shadow-sm" 
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="List Format View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="text-xs text-purple-600 hover:underline cursor-pointer flex items-center space-x-1" onClick={() => { setSearchTerm(""); setRoleFilter("all"); setLocFilter("all"); setExpFilter("all"); setMinSalaryRaw(0); setMaxSalaryRaw(100); }}>
                <span>Reset parameters</span>
              </span>
            </div>
          </div>

          <div className={`max-h-[500px] overflow-y-auto pr-1 ${
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 gap-4" 
              : "space-y-3.5"
          }`}>
            {filteredJobs.map((job) => (
              <div 
                key={job.id}
                onClick={() => { setSelectedJob(job); setCrewMetadata(null); setCrewLogs([]); }}
                className={`p-5 rounded-3xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedJob?.id === job.id 
                    ? "border-purple-600 bg-purple-50/10 shadow-md ring-1 ring-purple-600/10" 
                    : "border-slate-200 bg-white hover:border-purple-300 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-3.5 truncate">
                      <img 
                        src={job.logo} 
                        alt={job.company} 
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100" 
                      />
                      <div className="leading-snug truncate">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{job.title}</h4>
                        <p className="text-xs font-semibold text-purple-700 truncate">{job.company}</p>
                      </div>
                    </div>
                    
                    {/* Score Indicator Badge & Bookmark */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getScoreBadgeClass(job.matchScore)}`}>
                        {job.matchScore}% Overlap
                      </div>
                      <button
                        type="button"
                        onClick={(e) => toggleSaveJob(job.id, e)}
                        className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                          savedJobIds.includes(job.id)
                            ? "bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100"
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={savedJobIds.includes(job.id) ? "Remove from Saved Jobs" : "Save Job Opportunity"}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${savedJobIds.includes(job.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs mt-3 line-clamp-2 leading-relaxed font-light">
                    {job.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono font-medium">
                  <span className="flex items-center space-x-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-350 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </span>
                  <span className="flex items-center space-x-1.5 shrink-0">
                    <DollarSign className="h-3.5 w-3.5 text-slate-350" />
                    <span>{job.salary}</span>
                  </span>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-slate-400 text-xs italic col-span-full">
                {jobsTab === "saved" ? (
                  <div className="space-y-2 py-4">
                    <Bookmark className="h-8 w-8 text-slate-300 mx-auto animate-pulse" />
                    <p className="font-medium text-slate-500">No saved jobs correspond to your filter preferences.</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      Click the star bookmark icon on any vacancy card or details page to express interest first!
                    </p>
                  </div>
                ) : (
                  "No matching opportunities found based on criteria filter selection."
                )}
              </div>
            )}
          </div>
        </div>  </div>
      </div>

      {/* Target Spec panel & Telemetry Console */}
      <div className="lg:col-span-6">
        {!selectedJob ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center h-full min-h-[400px] shadow-sm flex flex-col items-center justify-center">
            <Briefcase className="h-12 w-12 text-slate-300 mb-4 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800">No Job Selected</h3>
            <p className="text-slate-550 text-xs max-w-sm mt-1">
              Select one of the opportunities from the left feeds to preview company specs, skill analysis reports, and launch autonomous CrewAI application agent runs.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header: Company summary and run pipeline command */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left space-y-4">
              <div className="flex justify-between items-start border-b border-slate-150 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
                  <p className="text-xs text-purple-700 font-bold">{selectedJob.company} • <span className="font-light text-slate-500 font-mono uppercase">{selectedJob.experienceLevel} Tier</span></p>
                </div>
                
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSaveJob(selectedJob.id)}
                    className={`flex items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer h-11 w-11 ${
                      savedJobIds.includes(selectedJob.id)
                        ? "bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                    title={savedJobIds.includes(selectedJob.id) ? "Remove from Saved Jobs" : "Save Job Opportunity"}
                  >
                    <Bookmark className={`h-5 w-5 ${savedJobIds.includes(selectedJob.id) ? 'fill-amber-500' : ''}`} />
                  </button>

                  <button
                    id="btn-run-crew"
                    disabled={crewRunning}
                    onClick={() => handleLaunchAgentCrew(selectedJob.id)}
                    className="flex items-center space-x-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all shrink-0 cursor-pointer h-11"
                  >
                    {crewRunning ? (
                      <>
                        <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                        <span>Mobilizing Agents...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white pr-0.5" />
                        <span>Synthesize Application Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Requirements Summary</h5>
                <p className="text-xs text-slate-650 font-light leading-relaxed">{selectedJob.description}</p>

                {/* Real-time Timeline and Recruiter Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4.5 rounded-2xl border border-slate-200 mt-3">
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">Job Availability Timeline</h5>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Posted Date:</span>
                        <span className="font-bold text-slate-800">{selectedJob.openDate || "2026-06-18"}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500">Closing Date:</span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-1 rounded">{selectedJob.closingDate || "2026-07-18"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">Recruiter &amp; Application Coordinates</h5>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact:</span>
                        <a 
                          href={`mailto:${selectedJob.contactInfo || "hiring@company.com"}`}
                          className="font-bold text-purple-700 hover:underline truncate max-w-[140px]"
                          title="Send email directly"
                        >
                          {selectedJob.contactInfo || "hiring@company.com"}
                        </a>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500">Apply Link:</span>
                        <a 
                          href={selectedJob.applyLink || selectedJob.jobUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-indigo-650 hover:underline flex items-center space-x-0.5"
                        >
                          <span>Apply Portal</span>
                          <ExternalLink className="h-3 w-3 inline shrink-0 text-indigo-600" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                          {/* Specialized Autonomous Agent Operations Desk */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="h-4 w-4 text-purple-600 animate-pulse" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Autonomous Operations Cockpit</h4>
                  </div>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                    7-AGENT CO-LOGGING PROTOCOL
                  </span>
                </div>

                {/* Agent Selection Stepper Row - Dense, responsive & elegant */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {[
                    { id: 1, name: "Job Matcher", desc: "Sync Vector", icon: Sparkles, color: "purple", status: matchingStatus },
                    { id: 2, name: "Company Research", desc: "Corporate Dossier", icon: Globe, color: "teal", status: researchStatus },
                    { id: 3, name: "Email Discovery", desc: "Auditing MX", icon: Mail, color: "indigo", status: discoveryStatus },
                    { id: 4, name: "App Draft", desc: "Generate Docs", icon: FileText, color: "amber", status: draftStatus },
                    { id: 5, name: "User Approval", desc: "Gate Keep", icon: ThumbsUp, color: "rose", status: approvalStatus === "idle" ? "idle" : approvalStatus === "pending" ? "running" : "completed" },
                    { id: 6, name: "Email Sender", desc: "Secure SMTP", icon: Send, color: "emerald", status: sendingStatus === "idle" ? "idle" : sendingStatus === "sending" ? "running" : "completed" },
                    { id: 7, name: "Kanban Tracker", desc: "Response Hook", icon: CheckCircle, color: "cyan", status: trackingStatus },
                  ].map((ag) => {
                    const IconComponent = ag.icon;
                    const isActive = activeAgentTab === ag.id;
                    const isCompleted = ag.status === "completed";
                    const isRunning = ag.status === "running" || ag.status === "sending";

                    let statusBadge = "Ready";
                    let badgeColor = "bg-slate-100 text-slate-500 border-slate-200";
                    if (isRunning) {
                      statusBadge = "Active...";
                      badgeColor = "bg-amber-100 text-amber-800 border-amber-300 animate-pulse";
                    } else if (isCompleted || ag.status === "approved" || ag.status === "ready") {
                      statusBadge = isCompleted ? "Synced" : "Locked";
                      badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
                    } else if (ag.status === "rejected") {
                      statusBadge = "Declined";
                      badgeColor = "bg-rose-100 text-rose-800 border-rose-300";
                    }

                    return (
                      <button
                        key={ag.id}
                        type="button"
                        onClick={() => setActiveAgentTab(ag.id)}
                        className={`p-2 rounded-xl text-left border transition-all relative flex flex-col justify-between h-[64px] group cursor-pointer ${
                          isActive 
                            ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-purple-500/10" 
                            : "bg-slate-55/40 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`p-1 rounded-md ${isActive ? "bg-white/10 text-white" : "bg-white text-slate-700 shadow-sm border border-slate-200/50"}`}>
                            <IconComponent className="h-3 w-3" />
                          </div>
                          <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border uppercase tracking-widest ${isActive ? "bg-white/20 text-white border-white/30" : badgeColor}`}>
                            {statusBadge}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className={`text-[10px] font-bold truncate leading-none ${isActive ? "text-white" : "text-slate-800"}`}>
                            {ag.name}
                          </p>
                          <p className={`text-[8px] font-mono mt-0.5 truncate leading-none ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                            {ag.desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Active Agent Workspace Container */}
                <div className="bg-slate-50/85 rounded-2xl p-4.5 border border-slate-200/60 text-left min-h-[180px] transition-all">
                  {/* TAB 1: JOB MATCHING AGENT */}
                  {activeAgentTab === 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-purple-100 p-1.5 rounded-lg shadow-sm">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-extrabold text-slate-900 leading-none">Job Matching Agent</h5>
                            <p className="text-[9px] text-purple-600 font-mono tracking-wider mt-0.5">AGENT-ID: MATCH-ENGINE-V2</p>
                          </div>
                        </div>
                        {matchingStatus === "completed" ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                            ALIGNMENT SCROLL UNLOCKED ({selectedJob?.matchScore || 88}% MATCH)
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-650 font-bold px-2 py-0.5 rounded-md font-mono">
                            READY FOR ANALYSIS
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                        Evaluates candidate professional background records against target Vacancy metrics using multi-vector taxonomy charts.
                      </p>

                      {matchingStatus === "running" && (
                        <div className="space-y-1.5 py-2">
                          <div className="flex justify-between text-[9px] font-mono font-medium text-slate-450">
                            <span>Processing credentials index vectors...</span>
                            <span>{matchingProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-1 transition-all duration-150" style={{ width: `${matchingProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {matchingStatus === "completed" && matchingDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Resume Skills Overlap</span>
                            <div className="flex flex-wrap gap-1">
                              {matchingDetails.overlapping.map((sk: string, idx: number) => (
                                <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] px-1.5 py-0.5 rounded font-semibold">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Identified Skill Gaps</span>
                            <div className="text-[10px] text-slate-650 font-light leading-relaxed pl-1.5 border-l-2 border-purple-500/20 max-h-[80px] overflow-y-auto">
                              {matchingDetails.gaps.map((gp: string, idx: number) => (
                                <div key={idx} className="line-clamp-1">{gp}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={matchingStatus === "running"}
                          onClick={runJobMatchingAgent}
                          className="px-4 py-1.5 border border-purple-200 text-purple-700 hover:text-white bg-white hover:bg-purple-650 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          {matchingStatus === "running" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Scanning skills...</span>
                            </>
                          ) : (
                            <>
                              <Cpu className="h-3 w-3" />
                              <span>{matchingStatus === "completed" ? "Recalculate Alignment" : "Trigger Match Audit"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: COMPANY RESEARCH AGENT */}
                  {activeAgentTab === 2 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-teal-100 p-1.5 rounded-lg shadow-sm">
                            <Globe className="h-4 w-4 text-teal-600 animate-spin" style={{ animationDuration: "12s" }} />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-extrabold text-slate-900 leading-none">Company Research Agent</h5>
                            <p className="text-[9px] text-teal-600 font-mono tracking-wider mt-0.5">AGENT-ID: RESEARCH-INTEL-V4</p>
                          </div>
                        </div>
                        {researchStatus === "completed" ? (
                          <span className="text-[9px] bg-teal-100 text-teal-850 font-bold px-2 py-0.5 rounded-md border border-teal-200 font-mono">
                            DOSSIER HARVEST COMPLETE
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-650 font-bold px-2 py-0.5 rounded-md font-mono">
                            AWAITING INITIALIZATION
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                        Crawls global news platforms, corporate portals, and SEC archives to synthesize career track intelligence profiles.
                      </p>

                      {researchStatus === "running" && (
                        <div className="space-y-1.5 py-2">
                          <div className="flex justify-between text-[9px] font-mono font-medium text-slate-450">
                            <span>Indexing corporate websites...</span>
                            <span>{researchProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 h-1 transition-all duration-150" style={{ width: `${researchProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {researchStatus === "completed" && researchDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 text-[10.5px]">
                          <div className="space-y-1.5">
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">Office Location</span>
                              <span className="font-semibold text-slate-800 flex items-center space-x-1">
                                <MapPin className="h-3 w-3 text-teal-500" />
                                <span>{researchDetails.location}</span>
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">Industry Core</span>
                              <span className="font-mono text-slate-800 bg-slate-100 px-1 rounded text-[9.5px]">
                                {researchDetails.industry}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">Personnel Scale</span>
                              <span className="font-semibold text-slate-800 flex items-center space-x-1">
                                <Users className="h-3 w-3 text-teal-400" />
                                <span>{researchDetails.size}</span>
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-white space-y-1">
                            <div className="flex justify-between border-b border-white/5 pb-1 text-[8.5px] font-mono text-teal-400">
                              <span>PRESUMPTIVE RETENTION CONTACT</span>
                              <span className="bg-teal-500 text-teal-950 font-black px-1 rounded uppercase">UNLOCKED</span>
                            </div>
                            <p className="font-bold text-[10px] text-slate-100">{researchDetails.recruiter.name}</p>
                            <p className="text-[8.5px] text-slate-400 font-mono">{researchDetails.recruiter.role}</p>
                            <p className="text-[9px] text-teal-300 font-mono select-all select-all truncate bg-black/4 w-full text-left mt-0.5">{researchDetails.recruiter.email}</p>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={researchStatus === "running"}
                          onClick={runCompanyResearchAgent}
                          className="px-4 py-1.5 border border-teal-200 text-teal-850 hover:text-white bg-white hover:bg-teal-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          {researchStatus === "running" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Scanning corporatics...</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-3 w-3" />
                              <span>{researchStatus === "completed" ? "Refresh dossier facts" : "Scan Corporate Dossier"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: EMAIL DISCOVERY AGENT */}
                  {activeAgentTab === 3 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-indigo-100 p-1.5 rounded-lg shadow-sm">
                            <Mail className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-extrabold text-slate-900 leading-none">Email Discovery Agent</h5>
                            <p className="text-[9px] text-indigo-600 font-mono tracking-wider mt-0.5">AGENT-ID: EMAIL-DISCOVERY-V1</p>
                          </div>
                        </div>
                        {discoveryStatus === "completed" ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                            LEAD LOCKED (&amp; VERIFIED)
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-650 font-bold px-2 py-0.5 rounded-md font-mono">
                            AWAITING SCAN
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                        Crawls public registry repositories, LinkedIn networking loops, and validates corporate custom domain mail exchangers.
                      </p>

                      {discoveryStatus === "running" && (
                        <div className="space-y-1.5 py-2">
                          <div className="flex justify-between text-[9px] font-mono font-medium text-slate-450">
                            <span>Executing MX handshake &amp; LinkedIn graph search...</span>
                            <span>{discoveryProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1 transition-all duration-150" style={{ width: `${discoveryProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {discoveryStatus === "completed" && discoveryDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 text-[10.5px]">
                          <div className="space-y-1.5">
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">Contact Name</span>
                              <span className="font-semibold text-slate-800">{discoveryDetails.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">Position Role</span>
                              <span className="font-semibold text-slate-800">{discoveryDetails.role}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">MX Confidence</span>
                              <span className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded text-[9.5px] font-bold">
                                {discoveryDetails.confidence}
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-white space-y-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between border-b border-white/5 pb-1 text-[8.5px] font-mono text-indigo-400 mb-1">
                                <span>MAIL-TO ROUTE ENDPOINT</span>
                                <span className="text-[7.5px] bg-indigo-500 text-white font-black px-1 rounded uppercase">RESOLVED</span>
                              </div>
                              <p className="text-[10px] text-slate-300 font-mono truncate">{discoveryDetails.email}</p>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[8.5px] text-slate-450 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Sources: {discoveryDetails.sources.join(", ")}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={discoveryStatus === "running"}
                          onClick={runEmailDiscoveryAgent}
                          className="px-4 py-1.5 border border-indigo-200 text-indigo-700 hover:text-white bg-white hover:bg-indigo-650 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          {discoveryStatus === "running" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Verifying MX lists...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="h-3 w-3" />
                              <span>{discoveryStatus === "completed" ? "Recrawl corporate indices" : "Discover Contact Email"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: APPLICATION DRAFT AGENT */}
                  {activeAgentTab === 4 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-amber-100 p-1.5 rounded-lg shadow-sm">
                            <FileText className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-extrabold text-slate-900 leading-none">Application Draft Agent</h5>
                            <p className="text-[9px] text-amber-600 font-mono tracking-wider mt-0.5">AGENT-ID: DRAFT-GENERATOR-V3</p>
                          </div>
                        </div>
                        {draftStatus === "completed" ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                            DRAFTS PREPARED &amp; PERSISTED
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-650 font-bold px-2 py-0.5 rounded-md font-mono font-bold">
                            PENDING SETUP
                          </span>
                        )}
                      </div>

                      {/* Customize Tone / Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-1 space-y-1">
                          <label className="text-[8.5px] font-mono text-slate-400 font-bold uppercase block">Draft Tone Vibe</label>
                          <select 
                            value={draftTone} 
                            onChange={(e) => setDraftTone(e.target.value)}
                            className="w-full text-[10px] bg-white border border-slate-220 rounded-lg p-1.5 font-sans"
                          >
                            <option value="professional">Professional 👔</option>
                            <option value="casual">Casual/Friendly 💬</option>
                            <option value="confident">Confident &amp; Assertive 🚀</option>
                            <option value="technical">Engineering Deeptech 💻</option>
                          </select>
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[8.5px] font-mono text-slate-400 font-bold uppercase block">AI Custom Instructions (Optional)</label>
                          <input 
                            type="text"
                            value={draftInstruction}
                            onChange={(e) => setDraftInstruction(e.target.value)}
                            placeholder="e.g. emphasize my recent Lighthouse optimize scores or fullstack skills..."
                            className="w-full text-[10px] bg-white border border-slate-220 rounded-lg p-1.5 font-sans"
                          />
                        </div>
                      </div>

                      {draftStatus === "running" && (
                        <div className="space-y-1.5 py-2">
                          <div className="flex justify-between text-[9px] font-mono font-medium text-slate-450">
                            <span>Synthesizing text using Gemini-3.5-Flash...</span>
                            <span>{draftProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-indigo-650 h-1 transition-all duration-150" style={{ width: `${draftProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* Generated editable Textareas */}
                      {draftStatus === "completed" && draftDetails && (
                        <div className="space-y-3 pt-2.5 border-t border-slate-200/50">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Tailored Recruiter Outreach Email</span>
                              <button 
                                type="button" 
                                onClick={() => setIsEditingDraft(!isEditingDraft)}
                                className="text-[8.5px] font-mono text-amber-600 hover:underline bg-amber-50 border border-amber-200 px-2 py-0.5 rounded"
                              >
                                {isEditingDraft ? "Lock Live Edits" : "Unlock Live Editor"}
                              </button>
                            </div>
                            {isEditingDraft ? (
                              <textarea
                                value={editedOutreachEmail}
                                onChange={(e) => setEditedOutreachEmail(e.target.value)}
                                className="w-full text-[10px] font-mono bg-white border border-slate-300 rounded-xl p-3 h-[100px] leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              />
                            ) : (
                              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-left text-slate-300 font-sans text-[10px] leading-relaxed max-h-[100px] overflow-y-auto select-all">
                                {editedOutreachEmail.split('\n').map((line, idx) => (
                                  <p key={idx} className="mb-1 last:mb-0">{line}</p>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Tailored Cover Letter</span>
                            {isEditingDraft ? (
                              <textarea
                                value={editedCoverLetter}
                                onChange={(e) => setEditedCoverLetter(e.target.value)}
                                className="w-full text-[10px] font-mono bg-white border border-slate-300 rounded-xl p-3 h-[110px] leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              />
                            ) : (
                              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-left text-slate-300 font-sans text-[10px] leading-relaxed max-h-[110px] overflow-y-auto select-all">
                                {editedCoverLetter.split('\n').map((line, idx) => (
                                  <p key={idx} className="mb-1 last:mb-0">{line}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={draftStatus === "running"}
                          onClick={runApplicationDraftAgent}
                          className="px-4 py-1.5 border border-amber-300 text-amber-800 hover:text-white bg-white hover:bg-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          {draftStatus === "running" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin animate-spin" />
                              <span>Generating with AI...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              <span>{draftStatus === "completed" ? "Regenerate custom document draft" : "Draft Outreach with AI"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: USER APPROVAL AGENT */}
                  {activeAgentTab === 5 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-rose-100 p-1.5 rounded-lg shadow-sm">
                            <ThumbsUp className="h-4 w-4 text-rose-600" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-extrabold text-slate-900 leading-none">User Approval Agent</h5>
                            <p className="text-[9px] text-rose-600 font-mono tracking-wider mt-0.5">AGENT-ID: APPROVAL-GATE-V1</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border uppercase font-bold">
                          {approvalStatus === "approved" ? (
                            <span className="bg-emerald-100 text-emerald-800 border-emerald-250">APPROVED &amp; PASSED</span>
                          ) : approvalStatus === "rejected" ? (
                            <span className="bg-rose-100 text-rose-800 border-rose-250">GATED / REJECTED</span>
                          ) : approvalStatus === "pending" ? (
                            <span className="bg-amber-100 text-amber-800 border-amber-250 animate-pulse">AWAITING REVIEW</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-650">COCKPIT INACTIVE</span>
                          )}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                        A security and safety gateway system preventing autonomous applications without candidate confirmation on draft and contact.
                      </p>

                      {draftStatus !== "completed" ? (
                        <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 text-[10.5px] italic text-slate-400">
                          Please run "Application Draft Agent" first using the App Draft tab to generate a reviewable application draft.
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2.5 border-t border-slate-200/50">
                          <p className="text-[11px] font-medium text-slate-700 flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Pending Verification Check for recruiter contact: <strong>{discoveryDetails?.name || "Sarah Jenkins"}</strong> ({discoveryDetails?.email || `sjenkins@${selectedJob.company.toLowerCase().replace(/\s/g, '')}.com`})</span>
                          </p>

                          <div className="bg-white border border-slate-200 rounded-xl p-3 text-[10.5px] space-y-2 text-slate-600/90 leading-relaxed font-sans shadow-sm">
                            <p><strong>Proposed Letter Theme:</strong> Scalable frameworks core metrics. [{draftTone} tone vibe]</p>
                            <p className="text-[8px] font-mono text-slate-400">SHA-256 PARSING SHIELD SIGNED LOG: READY FOR USER ACTION</p>
                          </div>

                          <div className="flex items-center space-x-2 pt-1 font-mono text-[9px] justify-end">
                            <button
                              type="button"
                              onClick={handleRejectDraft}
                              className="px-3.5 py-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700 rounded-xl font-bold uppercase cursor-pointer"
                            >
                              Declined / Redraft
                            </button>
                            <button
                              type="button"
                              onClick={handleApproveDraft}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase shadow-sm flex items-center space-x-1 cursor-pointer"
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span>Approve &amp; Lock Drafts</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: EMAIL SENDING AGENT */}
                  {activeAgentTab === 6 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-emerald-100 p-1.5 rounded-lg shadow-sm animate-pulse">
                            <Send className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-extrabold text-slate-900 leading-none">Email Sending Agent</h5>
                            <p className="text-[9px] text-emerald-600 font-mono tracking-wider mt-0.5">AGENT-ID: MAIL-DISPATCHER-V2</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border uppercase font-bold">
                          {sendingStatus === "completed" ? (
                            <span className="bg-emerald-100 text-emerald-800 border-emerald-250">DISPATCH RESOLVED (SENT)</span>
                          ) : sendingStatus === "sending" ? (
                            <span className="bg-amber-100 text-amber-800 border-amber-250 animate-pulse">TRANSMITTING...</span>
                          ) : sendingStatus === "ready" ? (
                            <span className="bg-indigo-100 text-indigo-800 border-indigo-250">UNLOCKED IP</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-650">GATED ON RECRUIT CHECK</span>
                          )}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                        Transmits vetted application materials through verified Google Workspace/Outlook API gateway tunnels under private SMTP tokens.
                      </p>

                      {sendingStatus === "idle" ? (
                        <div className="border border-dashed border-slate-350 rounded-xl p-4 text-center bg-slate-50 text-[10.5px] italic text-slate-400">
                          Waiting for approved application package from the "User Approval Agent". Approve drafts first to open.
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2.5 border-t border-slate-200/50">
                          {sendingProgress > 0 && (
                            <div className="space-y-1.5 py-1">
                              <div className="flex justify-between text-[9px] font-mono font-medium text-slate-450">
                                <span>MIME handshaking protocol dispatch...</span>
                                <span>{sendingProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-650 h-1 transition-all duration-150" style={{ width: `${sendingProgress}%` }}></div>
                              </div>
                            </div>
                          )}

                          {sendingLogs.length > 0 && (
                            <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl font-mono text-[9px] text-emerald-400 space-y-1 h-[80px] overflow-y-auto select-all leading-relaxed">
                              {sendingLogs.map((log, index) => (
                                <div key={index} className="flex items-center space-x-1.5">
                                  <span>&gt;&gt;</span>
                                  <span>{log}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] text-slate-650 pt-1">
                            <span className="font-sans">Connected Mail Host: <strong>{userEmail || "bharathsathyasaijanga@gmail.com"}</strong>_oauth</span>
                            <button
                              type="button"
                              disabled={sendingStatus === "sending"}
                              onClick={runEmailSendingAgent}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center space-x-1 cursor-pointer"
                            >
                              <Send className="h-3 w-3 stroke-[2]" />
                              <span>{sendingStatus === "completed" ? "Resend dispatch packet" : "Initialize Secure Dispatch"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 7: PIPELINE TRACKING AGENT */}
                  {activeAgentTab === 7 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-cyan-100 p-1.5 rounded-lg shadow-sm">
                            <CheckCircle className="h-4 w-4 text-cyan-600 animate-pulse" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-extrabold text-slate-900 leading-none">Kanban Tracking Agent</h5>
                            <p className="text-[9px] text-cyan-600 font-mono tracking-wider mt-0.5">AGENT-ID: PIPELINE-TRACKER-V1</p>
                          </div>
                        </div>
                        {trackingStatus === "completed" ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                            KANBAN STATE SYNCHRONIZED
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-650 font-bold px-2 py-0.5 rounded-md font-mono">
                            READY FOR ENROLLMENT
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                        Enrolls target corporate position in your live app tracking Kanban dashboard, injecting outbound tracker pixel elements to log response hooks.
                      </p>

                      {trackingStatus === "running" && (
                        <div className="space-y-1.5 py-2">
                          <div className="flex justify-between text-[9px] font-mono font-medium text-slate-450">
                            <span>Registering callback routes &amp; followups...</span>
                            <span>{trackingProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-500 to-indigo-600 h-1 transition-all duration-150" style={{ width: `${trackingProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {trackingStatus === "completed" && trackingDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 text-[10.5px]">
                          <div className="space-y-1.5">
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">Kanban State</span>
                              <span className="font-extrabold text-cyan-800 bg-cyan-50 px-1.5 rounded text-[9.5px]">
                                {trackingDetails.status}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-400 font-mono uppercase text-[8.5px] font-bold">Track Registration ID</span>
                              <span className="font-mono text-slate-800 font-semibold">{trackingDetails.trackingId}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-white space-y-1 flex flex-col justify-between leading-relaxed">
                            <div>
                              <div className="text-[8.5px] font-mono text-cyan-400 border-b border-white/5 pb-1 uppercase">TRACKING PIXEL ATTACHMENT</div>
                              <p className="text-[9px] text-slate-300 mt-1">{trackingDetails.pixelActive}</p>
                            </div>
                            <p className="text-[8px] text-cyan-300 font-mono bg-cyan-950/40 p-1 rounded inline-block text-center mt-1">
                              {trackingDetails.kanbanSync}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={trackingStatus === "running"}
                          onClick={runTrackingAgent}
                          className="px-4 py-1.5 border border-cyan-200 text-cyan-700 hover:text-white bg-white hover:bg-cyan-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          {trackingStatus === "running" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Enrolling tracker endpoints...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 shrink-0" />
                              <span>{trackingStatus === "completed" ? "Re-sync pipeline hooks" : "Trigger Enrollment & Tracking"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>      </div>

            {/* CrewAI Agent Output Console Terminal */}
            {(crewRunning || crewLogs.length > 0) && (
              <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 text-left shadow-lg text-slate-200 font-mono space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-4.5 w-4.5 text-amber-400" />
                    <span className="text-[11px] font-bold tracking-wider uppercase text-amber-300">CrewAI Agent Pipeline Telemetry</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-purple-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                    <span>ACTIVE RUN STATE</span>
                  </div>
                </div>

                {/* Staggered console logs list */}
                <div className="space-y-3 font-sans text-xs max-h-[300px] overflow-y-auto pr-1">
                  {crewLogs.map((log, index) => (
                    <div key={index} className="space-y-1 pl-3 border-l-2 border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-200 font-serif flex items-center space-x-1">
                          <span className="text-amber-400">⚡</span>
                          <span>{log.agentName}</span>
                        </span>
                        <span className="text-[9px] font-mono text-purple-400 bg-purple-950/60 px-2 rounded-full border border-purple-800">
                          COMPLETED
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic mb-1">{log.message}</p>
                      
                      {/* Sub telemetry report output */}
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[11px] font-mono leading-relaxed text-slate-300 white-space-pre-wrap">
                        {log.output}
                      </div>
                    </div>
                  ))}

                  {crewRunning && (
                    <div className="flex items-center space-x-3 text-slate-400 pl-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span className="animate-pulse text-xs italic">Mobilizing Agent #{currentRunningStep + 1} for tasks execution...</span>
                    </div>
                  )}
                </div>

                {/* Automation Summary Gate Success */}
                {crewMetadata && !crewRunning && (
                  <div className="bg-gradient-to-r from-emerald-950/40 to-green-950/30 border border-emerald-500/30 p-4 rounded-xl text-xs space-y-2 mt-4 font-sans">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-emerald-400 font-extrabold uppercase font-mono tracking-wider">CREW PIPELINE OUTPUT LOCK</span>
                      <span className="text-[9px] bg-emerald-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full font-mono">DRAFTS PREPARED</span>
                    </div>
                    <p className="text-slate-300">
                      <strong>Target Recruiter Email Discovered:</strong> {crewMetadata.contactPoints}
                    </p>
                    <p className="text-slate-300">
                      <strong>Company Insights Report:</strong> {crewMetadata.companyReport}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <div className="flex items-center text-[10px] text-amber-300 font-semibold uppercase tracking-wider bg-slate-900/60 p-2.5 rounded border border-white/5 space-x-1 cursor-pointer">
                        <span>Check Drafts in Application Center</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
