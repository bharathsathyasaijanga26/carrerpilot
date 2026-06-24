/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, 
  Sparkles, 
  Globe, 
  FileText, 
  Search, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  BookmarkPlus,
  BookmarkCheck,
  Briefcase,
  Terminal,
  Upload,
  Activity,
  Send,
  Mail,
  Check,
  Building,
  Clock
} from "lucide-react";
import { Resume, Job, Application } from "../types";

interface SkillsMatchAgentPageProps {
  resumes: Resume[];
  jobs: Job[];
  onParseResumeText: (text: string, filename?: string) => Promise<void>;
  activeResumeId: string;
  setActiveResumeId: (id: string) => void;
  onSaveApplication: (job: Job) => Promise<void>;
  applications: Application[];
  onUpdateStatus?: (
    id: string, 
    status: 'Saved' | 'Applied' | 'Under Review' | 'Interview' | 'Offer' | 'Rejected',
    outreachEmail?: string,
    coverLetter?: string,
    deadline?: string
  ) => Promise<void>;
}

interface AgentLogItem {
  id: string;
  timestamp: string;
  agent: "Extraction" | "Search" | "Matching";
  message: string;
  type: "info" | "success" | "warning";
}

export default function SkillsMatchAgentPage({
  resumes,
  jobs,
  onParseResumeText,
  activeResumeId,
  setActiveResumeId,
  onSaveApplication,
  applications,
  onUpdateStatus,
}: SkillsMatchAgentPageProps) {
  // Active Resume Context
  const activeResume = resumes.find(r => r.id === activeResumeId);

  // Flow State
  const [isUploading, setIsUploading] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("pasted_resume.txt");
  const [uploadError, setUploadError] = useState("");

  // Agent Statuses
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "running" | "completed">("idle");
  const [searchStatus, setSearchStatus] = useState<"idle" | "running" | "completed">("idle");
  const [matchingStatus, setMatchingStatus] = useState<"idle" | "running" | "completed">("idle");

  // Dynamic extracted skills state (editable)
  const [extractedSkills, setExtractedSkills] = useState<{
    technicalSkills: string[];
    tools: string[];
    certifications: string[];
    jobRelevantKeywords: string[];
  }>({
    technicalSkills: [],
    tools: [],
    certifications: [],
    jobRelevantKeywords: []
  });

  // Dynamic tags addition helpers
  const [newTag, setNewTag] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<"technicalSkills" | "tools" | "certifications" | "jobRelevantKeywords">("technicalSkills");

  // Job search parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("Bengaluru, India");
  const [foundJobs, setFoundJobs] = useState<Job[]>([]);

  // Console Logs simulation state
  const [agentLogs, setAgentLogs] = useState<AgentLogItem[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- START OF OUTREACH DISPATCH WORKSPACE STATES ---
  const [selectedMatchJobId, setSelectedMatchJobId] = useState<string>("");
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [customRecipientName, setCustomRecipientName] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customOutreachEmail, setCustomOutreachEmail] = useState("");
  const [customCoverLetter, setCustomCoverLetter] = useState("");
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // Single outreach simulated state
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendingProgressMessage, setSendingProgressMessage] = useState("");

  // Batch states
  const [batchSending, setBatchSending] = useState(false);
  const [batchCompletedCompanies, setBatchCompletedCompanies] = useState<string[]>([]);
  const [batchCurrentCompanyIndex, setBatchCurrentCompanyIndex] = useState(0);
  const [batchTotalCompaniesCount, setBatchTotalCompaniesCount] = useState(0);
  const [batchCurrentStage, setBatchCurrentStage] = useState("");

  // Local simulated dispatches log list
  const [simulatedDispatches, setSimulatedDispatches] = useState<Array<{
    id: string;
    company: string;
    jobTitle: string;
    date: string;
    to: string;
    subject: string;
    body: string;
    type: 'single' | 'batch';
  }>>([]);

  // Auto-select first job
  useEffect(() => {
    if (foundJobs.length > 0 && !selectedMatchJobId) {
      setSelectedMatchJobId(foundJobs[0].id);
    }
  }, [foundJobs]);

  // Sync outreach fields
  useEffect(() => {
    if (selectedMatchJobId) {
      const relatedApp = applications.find(app => app.jobId === selectedMatchJobId);
      const matchedJob = foundJobs.find(j => j.id === selectedMatchJobId);
      
      if (relatedApp) {
        setCustomRecipientEmail(relatedApp.recipientEmail || "recruitment@" + relatedApp.company.toLowerCase().replace(/\s/g, '') + ".com");
        setCustomRecipientName(relatedApp.recipientName || "Hiring Lead");
        setCustomSubject(`Application Proposal: ${relatedApp.jobTitle} position`);
        setCustomOutreachEmail(relatedApp.outreachEmail || "");
        setCustomCoverLetter(relatedApp.coverLetter || "");
      } else if (matchedJob) {
        setCustomRecipientEmail("recruitment@" + matchedJob.company.toLowerCase().replace(/\s/g, '') + ".com");
        setCustomRecipientName("Talent Acquisition Lead");
        setCustomSubject(`Direct Referral Proposal: ${matchedJob.title} role`);
        const skillList = extractedSkills.technicalSkills.slice(0, 3).join(", ") || "core software engineering";
        setCustomOutreachEmail(`Hi Hiring Team at ${matchedJob.company},\n\nI discovered your open position for a ${matchedJob.title} and noticed my background in ${skillList} aligns strongly with your department goals.\n\nI would love to share how I can support your active pipeline. My parsed qualifications and resume metrics are attached inside this envelope.\n\nLooking forward to speaking soon!\n\nBest regards,\nCandidate Profile`);
        setCustomCoverLetter(`Dear Hiring Team at ${matchedJob.company},\n\nI am writing to express my enthusiastic interest in the ${matchedJob.title} opening. With hands-on experience in ${extractedSkills.technicalSkills.join(", ") || "technical systems"}, I am confident in my capacity to drive software reliability and deliver product excellence.\n\nThank you for your valuable time and consideration.\n\nSincerely,\nCandidate Profile`);
      }
    }
  }, [selectedMatchJobId, applications, foundJobs, extractedSkills]);
  // --- END OF OUTREACH DISPATCH WORKSPACE STATES ---

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [agentLogs]);

  // Sync extracted skills if the active resume changes or is loaded
  useEffect(() => {
    if (activeResume) {
      if (activeResume.skills) {
        setExtractedSkills({
          technicalSkills: [...(activeResume.skills.technicalSkills || [])],
          tools: [...(activeResume.skills.tools || [])],
          certifications: [...(activeResume.skills.certifications || [])],
          jobRelevantKeywords: [...(activeResume.skills.jobRelevantKeywords || [])],
        });
        
        // Formulate a smart default query
        const primaryKeyword = activeResume.skills.jobRelevantKeywords[0] || activeResume.parsedData?.experience[0]?.role || activeResume.parsedData?.summary?.split(" ")[0] || "Frontend Developer";
        setSearchQuery(primaryKeyword);
      } else if (activeResume.parsedData) {
        setExtractedSkills({
          technicalSkills: [...(activeResume.parsedData.technicalSkills || [])],
          tools: [],
          certifications: [...(activeResume.parsedData.certifications || [])],
          jobRelevantKeywords: [],
        });
        const primaryKeyword = activeResume.parsedData.technicalSkills[0] || "Frontend Developer";
        setSearchQuery(primaryKeyword);
      }
    }
  }, [activeResumeId, resumes]);

  // Append logs helper
  const addLog = (agent: "Extraction" | "Search" | "Matching", message: string, type: "info" | "success" | "warning" = "info") => {
    const freshLog: AgentLogItem = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      message,
      type
    };
    setAgentLogs(prev => [...prev, freshLog]);
  };

  // Helper trigger: Sequential Fleet Orchestration
  const triggerAutoCascade = async (resumeToUse: Resume) => {
    setAgentLogs([]);
    addLog("Extraction", "🤖 Skill Extraction Agent woke up. Accessing document ID: " + resumeToUse.id, "info");
    setExtractionStatus("running");
    setSearchStatus("idle");
    setMatchingStatus("idle");

    // Phase 1: Skill Extraction Agent Action
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      addLog("Extraction", "🔍 Scanning semantic patterns, academic certifications, and tooling frameworks...", "info");
      const extractResponse = await fetch("/api/resume/extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resumeToUse.id })
      });
      const extractResult = await extractResponse.json();
      
      if (extractResult.success && extractResult.skills) {
        setExtractedSkills(extractResult.skills);
        addLog("Extraction", `🎉 Splicing complete! Identified ${extractResult.skills.technicalSkills.length} Technical Skills and ${extractResult.skills.jobRelevantKeywords.length} Job-Relevant Keywords`, "success");
        
        // Define smart query
        const defaultQuery = extractResult.skills.jobRelevantKeywords[0] || extractResult.skills.technicalSkills[0] || "Frontend Engineer";
        setSearchQuery(defaultQuery);
        setExtractionStatus("completed");

        // Phase 2: Job Search Agent Action
        setSearchStatus("running");
        addLog("Search", `🕵️‍♂️ Job Search Agent summoned. Portals scanning initiated for query: "${defaultQuery}"`, "info");
        await new Promise(resolve => setTimeout(resolve, 2000));
        addLog("Search", "🌐 Interrogating global tech vaults (LinkedIn API, Swiggy Dev Portal, Stripe Careers)...", "info");

        const searchResponse = await fetch("/api/jobs/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: defaultQuery, 
            location: searchLocation, 
            resumeId: resumeToUse.id 
          })
        });
        const searchResult = await searchResponse.json();

        if (searchResult.success && searchResult.jobs) {
          addLog("Search", `✅ Harvesting complete! Discovered ${searchResult.jobs.length} open positions with active career pipelines.`, "success");
          setFoundJobs(searchResult.jobs);
          setSearchStatus("completed");

          // Phase 3: Job Matching Agent Action
          setMatchingStatus("running");
          addLog("Matching", "🧠 Job Matching Agent initialized. Syncing candidate credentials vector data...", "info");
          await new Promise(resolve => setTimeout(resolve, 1800));
          
          addLog("Matching", "📊 Executing skill overlap matrices and quantifying gap diagnostics for each opening...", "info");
          await new Promise(resolve => setTimeout(resolve, 1200));

          addLog("Matching", "⭐ Rankings model complete. Direct match suggestions locked successfully!", "success");
          setMatchingStatus("completed");
        } else {
          addLog("Search", "⚠️ Job Search Agent returned empty index. Transitioning to fallback vacancies...", "warning");
          setSearchStatus("completed");
        }
      } else {
        throw new Error(extractResult.error || "Skill extraction failed.");
      }
    } catch (err: any) {
      addLog("Extraction", "🤯 Crew process halted: " + err.message, "warning");
      setExtractionStatus("idle");
    }
  };

  // manual trigger when selecting a resume or clicking recalculate
  const handleTriggerAutonomousCascade = () => {
    if (!activeResume) {
      addLog("Extraction", "❌ Error: Cannot coordinate. Choose or upload a Resume first.", "warning");
      return;
    }
    triggerAutoCascade(activeResume);
  };

  // Handle uploading of new resume
  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim() || pasteText.trim().length < 50) {
      setUploadError("Please paste a comprehensive resume profile (minimum 50 characters).");
      return;
    }
    setUploadError("");
    setIsUploading(true);

    try {
      // 1. Parse resume
      await onParseResumeText(pasteText, uploadedFileName);
      setPasteText("");
      
      // Note: Parse resume automatically sets activeResumeId, but setResumes state update in App is async,
      // so let's retrieve the newly added resume item.
      addLog("Extraction", "📝 New candidate credentials parsed and buffered. Autotriggering multi-agent loop...", "success");
    } catch (err: any) {
      setUploadError(err.message || "Failed to process profile. Re-check text structure.");
    } finally {
      setIsUploading(false);
    }
  };

  // We should also listen for the case where a new resume gets parsed, to auto-start the cascade when resumes list increases
  const prevResumesLength = useRef(resumes.length);
  useEffect(() => {
    if (resumes.length > prevResumesLength.current && resumes.length > 0) {
      const addedResume = resumes[resumes.length - 1];
      setActiveResumeId(addedResume.id);
      triggerAutoCascade(addedResume);
    }
    prevResumesLength.current = resumes.length;
  }, [resumes]);

  // Tags editing helpers
  const handleAddTag = (category: typeof newTagCategory) => {
    if (!newTag.trim()) return;
    setExtractedSkills(prev => {
      const existing = prev[category] || [];
      if (existing.includes(newTag.trim())) return prev;
      return {
        ...prev,
        [category]: [...existing, newTag.trim()]
      };
    });
    addLog("Extraction", `➕ Added custom skill keyword to ${category}: "${newTag.trim()}"`, "info");
    setNewTag("");
  };

  const handleRemoveTag = (category: typeof newTagCategory, tagToRemove: string) => {
    setExtractedSkills(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(t => t !== tagToRemove)
    }));
    addLog("Extraction", `➖ Deleted keyword from ${category}: "${tagToRemove}"`, "info");
  };

  // Re-run search agent manually with the modified query
  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchStatus("running");
    setMatchingStatus("idle");
    addLog("Search", `🕵️‍♂️ Search Query tweaked: "${searchQuery}" in "${searchLocation}". Re-indexing...`, "info");

    try {
      const searchResponse = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: searchQuery, 
          location: searchLocation, 
          resumeId: activeResumeId 
        })
      });
      const searchResult = await searchResponse.json();

      if (searchResult.success && searchResult.jobs) {
        addLog("Search", `✅ Re-crawling finished. Discovered ${searchResult.jobs.length} tweaked positions.`, "success");
        setFoundJobs(searchResult.jobs);
        setSearchStatus("completed");

        // Automatic re-match
        setMatchingStatus("running");
        addLog("Matching", "🧠 Recalculating overlay scores using customized candidate configurations...", "info");
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog("Matching", "📊 Alignments mapped successfully.", "success");
        setMatchingStatus("completed");
      }
    } catch (err: any) {
      addLog("Search", "❌ Custom search parameters failed: " + err.message, "warning");
      setSearchStatus("completed");
    }
  };

  // --- START OF OUTREACH DISPATCH LOGIC ---
  const handleSendSingleEmail = async () => {
    if (!selectedMatchJobId) return;
    const matchedJob = foundJobs.find(j => j.id === selectedMatchJobId);
    if (!matchedJob) return;

    setSendingState('sending');
    setSendingProgressMessage("Connecting to Approval Queue...");
    
    await new Promise(r => setTimeout(r, 600));
    setSendingProgressMessage("Formatting email pitch template...");
    await new Promise(r => setTimeout(r, 650));
    setSendingProgressMessage("Saving outreach details to queue...");
    await new Promise(r => setTimeout(r, 700));

    try {
      let targetApp = applications.find(app => app.jobId === selectedMatchJobId);
      if (!targetApp) {
        await onSaveApplication(matchedJob);
        // Sleep to let parent sync
        await new Promise(r => setTimeout(r, 1500));
        targetApp = applications.find(app => app.jobId === selectedMatchJobId);
      }

      if (targetApp && onUpdateStatus) {
        await onUpdateStatus(targetApp.id, "Saved", customOutreachEmail, customCoverLetter);
      }

      // Record local history dispatch log
      const dispatchItem = {
        id: "dispatch--" + Date.now(),
        company: matchedJob.company,
        jobTitle: matchedJob.title,
        date: new Date().toLocaleString(),
        to: customRecipientEmail,
        subject: customSubject,
        body: customOutreachEmail,
        type: 'single' as const
      };
      setSimulatedDispatches(prev => [dispatchItem, ...prev]);

      setSendingState('success');
      setSendingProgressMessage(`Outreach draft successfully saved to the Approval Queue!`);
      
      addLog("Matching", `📥 Draft Saved: Outreach letter for ${matchedJob.company} added to Approval Queue`, "success");
      
      setTimeout(() => {
        setSendingState('idle');
        setSendingProgressMessage("");
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setSendingState('error');
      setSendingProgressMessage("Failed to save draft to Approval Queue.");
    }
  };

  const handleSendAllEmails = async () => {
    if (foundJobs.length === 0) return;
    
    setBatchSending(true);
    setBatchCompletedCompanies([]);
    setBatchTotalCompaniesCount(foundJobs.length);
    setBatchCurrentCompanyIndex(0);
    
    addLog("Matching", `🚀 Initiating Draft Queue generation for all ${foundJobs.length} matching companies...`, "info");
    
    for (let i = 0; i < foundJobs.length; i++) {
        const job = foundJobs[i];
        setBatchCurrentCompanyIndex(i + 1);
        setBatchCurrentStage(`Drafting referral template for ${job.company}...`);
        await new Promise(r => setTimeout(r, 800));
        
        let targetApp = applications.find(app => app.jobId === job.id);
        let currentOutreach = customOutreachEmail;
        let currentCover = customCoverLetter;
        let currentRecipientMail = "careers@" + job.company.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9]/g, '') + ".com";
        let currentRecipientName = "Talent Acquisition lead";

        if (targetApp) {
          currentOutreach = targetApp.outreachEmail || currentOutreach;
          currentCover = targetApp.coverLetter || currentCover;
          currentRecipientMail = targetApp.recipientEmail || currentRecipientMail;
          currentRecipientName = targetApp.recipientName || currentRecipientName;
        } else {
          const skillList = extractedSkills.technicalSkills.slice(0, 3).join(", ") || "software design";
          currentOutreach = `Hi Hiring Team at ${job.company},\n\nI discovered your open position for a ${job.title} and noticed my qualifications in ${skillList} align perfectly.\n\nI have attached my details and would love to connect. Thank you!\n\nBest regards,\nCandidate Profile`;
          currentCover = `Dear Hiring Team at ${job.company},\n\nI am writing to apply for the ${job.title} position...`;
        }
        
        setBatchCurrentStage(`Saving draft record for ${job.company} to queue...`);
        await new Promise(r => setTimeout(r, 600));
        
        try {
          if (targetApp && onUpdateStatus) {
            await onUpdateStatus(targetApp.id, "Saved", currentOutreach, currentCover);
          } else {
            await onSaveApplication(job);
            await new Promise(r => setTimeout(r, 1200));
            const newApp = applications.find(app => app.jobId === job.id);
            if (newApp && onUpdateStatus) {
              await onUpdateStatus(newApp.id, "Saved", currentOutreach, currentCover);
            }
          }
          
          const dispatchItem = {
            id: "dispatch-batch-" + Date.now() + "-" + i,
            company: job.company,
            jobTitle: job.title,
            date: new Date().toLocaleString(),
            to: currentRecipientMail,
            subject: `Direct Referral Proposal: ${job.title} role`,
            body: currentOutreach,
            type: 'batch' as const
          };
          
          setSimulatedDispatches(prev => [dispatchItem, ...prev]);
          setBatchCompletedCompanies(prev => [...prev, job.company]);
          addLog("Matching", `✅ Draft Created: Saved ${job.company} outreach at ${currentRecipientMail}`, "success");
        } catch (err) {
          console.error("Batch save error", err);
        }
    }
    
    setBatchCurrentStage("Bulk drafts successfully completed!");
    await new Promise(r => setTimeout(r, 1000));
    setBatchSending(false);
    addLog("Matching", `🎉 Cascade Finished! Successfully added ${foundJobs.length} drafts to the Approval Queue.`, "success");
  };
  // --- END OF OUTREACH DISPATCH LOGIC ---

  return (
    <div id="skills-match-agent-workspace" className="space-y-8 text-left max-w-7xl mx-auto">
      
      {/* Visual Header Grid banner info */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 z-10">
          <span className="text-[10px] bg-purple-600/30 text-purple-300 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/30">
            Autonomous Multi-Agent Cascade
          </span>
          <h1 className="text-3xl font-black tracking-tight font-sans">
            Skill Discovery & Direct Match Desk
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-light leading-relaxed">
            Upload your professional profile to summon the <strong>Skill Extraction Agent</strong>, pass coordinates to the <strong>Job Search Agent</strong>, and evaluate matches via the <strong>Job Matching Agent</strong>—all in one automated workflow loop.
          </p>
        </div>

        {activeResume && (
          <button
            type="button"
            onClick={handleTriggerAutonomousCascade}
            className="bg-white hover:bg-slate-50 text-slate-900 font-black tracking-wider uppercase text-[11px] h-12 px-6 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
          >
            <Activity className="h-4 w-4 text-purple-600 animate-pulse" />
            <span>Summon AI Agents Loop</span>
          </button>
        )}
      </div>

      {/* Grid: 1. Resume Control Zone & Agent Console | 2. Skills Taxonomy Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Span 5): Profile Context & Console Terminal */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          
          {/* Section: Select or Upload Profile */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <span>Select Active Document Target</span>
            </h3>

            {resumes.length > 0 ? (
              <div className="space-y-3">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Currently targeted profile</label>
                <div className="grid grid-cols-1 gap-2">
                  {resumes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveResumeId(r.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        r.id === activeResumeId 
                          ? "bg-purple-50/50 border-purple-500 ring-1 ring-purple-500/10 text-slate-900" 
                          : "bg-slate-50/40 border-slate-200 hover:border-slate-350 hover:bg-white text-slate-700"
                      }`}
                    >
                      <div className="space-y-1 select-none pr-3 truncate flex-1">
                        <p className="font-extrabold text-xs truncate leading-normal text-slate-900">{r.filename}</p>
                        <p className="text-[9px] text-slate-450 font-mono">ID: {r.id.slice(0, 10)}... • {r.uploadDate || "Loaded"}</p>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase transition-colors shrink-0 ${
                        r.id === activeResumeId ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {r.id === activeResumeId ? "Targeted" : "Analyze"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 rounded-2xl p-4 text-center">
                No resume files uploaded. Paste or drag a copy below to construct your index.
              </p>
            )}

            {/* Seamless Paste uploader panel */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Analyze New credentials profile</span>
              <form onSubmit={handlePasteSubmit} className="space-y-3">
                <input
                  type="text"
                  value={uploadedFileName}
                  onChange={(e) => setUploadedFileName(e.target.value)}
                  placeholder="Filename e.g. siddharth_resume_2026.txt"
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none p-2.5 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/10"
                />
                
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={4}
                  placeholder="Paste complete copy-paste of raw resume text here... (Experience, tech skills, etc)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none p-3 rounded-2xl text-slate-800 leading-relaxed font-sans resize-none focus:ring-2 focus:ring-purple-500/10"
                />

                {uploadError && (
                  <p className="text-[10px] text-rose-600 font-medium flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{uploadError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full h-10 bg-purple-650 hover:bg-purple-750 text-white font-bold tracking-wider uppercase text-[10px] rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Parsing profile via LLM...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>Parse Profile &amp; Auto-dispatch Fleet</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Section: Logging Console Log Terminal */}
          <div className="bg-slate-950 border border-slate-850 rounded-3xl p-5 text-white/90 font-mono text-xs flex flex-col h-[280px] shadow-sm relative overflow-hidden">
            {/* Console Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-850 text-[10px] text-slate-450 uppercase tracking-widest leading-none shrink-0">
              <div className="flex items-center space-x-1.5">
                <Terminal className="h-4 w-4 text-purple-400" />
                <span className="font-bold">Fleet Telemetry Console</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </div>
            </div>

            {/* Scrollable outputs */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 custom-scrollbar scroll-smooth">
              {agentLogs.length === 0 ? (
                <div className="text-slate-500 italic py-10 text-center text-[10.5px]">
                  &gt; [System Alert] Fleet is idle.<br />
                  &gt; Select target profile, or click &quot;Summon AI Agents Loop&quot; to coordinate pipeline.
                </div>
              ) : (
                agentLogs.map((log) => {
                  let badgeColor = "text-purple-400";
                  if (log.agent === "Search") badgeColor = "text-teal-400";
                  if (log.agent === "Matching") badgeColor = "text-amber-400";

                  let msgColor = "text-slate-300";
                  if (log.type === "success") msgColor = "text-emerald-400 font-bold";
                  if (log.type === "warning") msgColor = "text-amber-500";

                  return (
                    <div key={log.id} className="text-[10.5px] leading-relaxed text-left flex items-start space-x-1.5">
                      <span className="text-slate-500 shrink-0 select-none text-[9px]">{log.timestamp}</span>
                      <div className="flex-1">
                        <span className={`font-bold ${badgeColor} select-none mr-1.5`}>[{log.agent}]:</span>
                        <span className={msgColor}>{log.message}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef}></div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 7): Workshop Taxonomy Workbench */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          
          {/* Agent Sequence Progress Visuals */}
          <div className="bg-slate-50/60 border border-slate-200/80 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
            
            {/* Card 1: Extraction Status */}
            <div className={`p-4 rounded-2xl border transition-all ${
              extractionStatus === "completed" 
                ? "bg-purple-500 text-white border-purple-600" 
                : extractionStatus === "running"
                ? "bg-purple-100 text-purple-900 border-purple-300 animate-pulse"
                : "bg-white text-slate-800 border-slate-200"
            }`}>
              <div className="flex justify-between items-start">
                <div className="bg-white/10 p-1.5 rounded-lg border border-white/5 shadow-xs">
                  <Cpu className="h-4 w-4" />
                </div>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider bg-white/20 select-none">
                  {extractionStatus === "completed" ? "Synchronized" : extractionStatus === "running" ? "Extracting..." : "Ready"}
                </span>
              </div>
              <div className="mt-3 text-left">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wider">Skill Extractor</h5>
                <p className="text-[9.5px] mt-0.5 opacity-80 leading-normal">Scorers metadata analysis.</p>
              </div>
            </div>

            {/* Card 2: Search Status */}
            <div className={`p-4 rounded-2xl border transition-all ${
              searchStatus === "completed" 
                ? "bg-teal-600 text-white border-teal-700" 
                : searchStatus === "running"
                ? "bg-teal-100 text-teal-900 border-teal-300 animate-pulse"
                : "bg-white text-slate-800 border-slate-200"
            }`}>
              <div className="flex justify-between items-start">
                <div className="bg-white/10 p-1.5 rounded-lg border border-white/5 shadow-xs">
                  <Globe className="h-4 w-4 animate-spin" style={{ animationDuration: "10s" }} />
                </div>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider bg-white/20 select-none">
                  {searchStatus === "completed" ? "Indexed" : searchStatus === "running" ? "Crawling..." : "Ready"}
                </span>
              </div>
              <div className="mt-3 text-left">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wider">Job portals Search</h5>
                <p className="text-[9.5px] mt-0.5 opacity-80 leading-normal">Scrapes latest postings.</p>
              </div>
            </div>

            {/* Card 3: Matching Status */}
            <div className={`p-4 rounded-2xl border transition-all ${
              matchingStatus === "completed" 
                ? "bg-amber-500 text-white border-amber-600" 
                : matchingStatus === "running"
                ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                : "bg-white text-slate-800 border-slate-200"
            }`}>
              <div className="flex justify-between items-start">
                <div className="bg-white/10 p-1.5 rounded-lg border border-white/5 shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider bg-white/20 select-none">
                  {matchingStatus === "completed" ? "Ranked" : matchingStatus === "running" ? "Matching..." : "Ready"}
                </span>
              </div>
              <div className="mt-3 text-left">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wider">Gap alignment matcher</h5>
                <p className="text-[9.5px] mt-0.5 opacity-80 leading-normal">Overlaps alignment index.</p>
              </div>
            </div>
          </div>

          {/* Combined workbench card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* Tab Header for editing and refining live coordinates */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Extracted Skills Workbench</h3>
                <p className="text-[10.5px] text-slate-500">Live coordinates discovered by the Extraction Agent. Click &quot;x&quot; to delete or input below to append custom search hooks.</p>
              </div>
            </div>

            {/* Layout categorized outputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* Technical skills */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Technical Skills</span>
                <div className="flex flex-wrap gap-1">
                  {(extractedSkills.technicalSkills || []).length === 0 ? (
                    <span className="text-[10.5px] text-slate-400 italic">None registered. Use extractor above.</span>
                  ) : (
                    extractedSkills.technicalSkills.map((sk) => (
                      <span key={sk} className="bg-purple-50 text-purple-700 border border-purple-100/50 text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono flex items-center space-x-1 shrink-0">
                        <span>{sk}</span>
                        <button type="button" onClick={() => handleRemoveTag("technicalSkills", sk)} className="hover:text-rose-600 ml-1 cursor-pointer font-bold">&times;</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Tools & Frameworks */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Tools &amp; Libraries</span>
                <div className="flex flex-wrap gap-1">
                  {(extractedSkills.tools || []).length === 0 ? (
                    <span className="text-[10.5px] text-slate-400 italic">None registered. Fill custom tags!</span>
                  ) : (
                    extractedSkills.tools.map((sk) => (
                      <span key={sk} className="bg-slate-100 text-slate-700 border border-slate-200/50 text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono flex items-center space-x-1 shrink-0">
                        <span>{sk}</span>
                        <button type="button" onClick={() => handleRemoveTag("tools", sk)} className="hover:text-rose-600 ml-1 cursor-pointer font-bold">&times;</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Certifications &amp; Degrees</span>
                <div className="flex flex-wrap gap-1">
                  {(extractedSkills.certifications || []).length === 0 ? (
                    <span className="text-[10.5px] text-slate-400 italic">No credentials found.</span>
                  ) : (
                    extractedSkills.certifications.map((sk) => (
                      <span key={sk} className="bg-blue-50 text-blue-755 border border-blue-105 text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono flex items-center space-x-1 shrink-0">
                        <span>{sk}</span>
                        <button type="button" onClick={() => handleRemoveTag("certifications", sk)} className="hover:text-rose-600 ml-1 cursor-pointer font-bold">&times;</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Job Relevant Keywords</span>
                <div className="flex flex-wrap gap-1">
                  {(extractedSkills.jobRelevantKeywords || []).length === 0 ? (
                    <span className="text-[10.5px] text-slate-400 italic">None extracted.</span>
                  ) : (
                    extractedSkills.jobRelevantKeywords.map((sk) => (
                      <span key={sk} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono flex items-center space-x-1 shrink-0">
                        <span>{sk}</span>
                        <button type="button" onClick={() => handleRemoveTag("jobRelevantKeywords", sk)} className="hover:text-rose-600 ml-1 cursor-pointer font-bold">&times;</button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Custom interactive adder row */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-1/3">
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-sans focus:outline-none"
                >
                  <option value="technicalSkills">Technical Skill</option>
                  <option value="tools">Tool / Library</option>
                  <option value="certifications">Certification</option>
                  <option value="jobRelevantKeywords">Job Keyword</option>
                </select>
              </div>
              <div className="w-full sm:flex-1 flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g. Docker, GraphQL, Kubernetes..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(newTagCategory)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 shrink-0 cursor-pointer transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Append Coordinates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filter Zone: Search Coordination panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Globe className="h-4.5 w-4.5 text-teal-600" />
          <span>Configure Job Search Coordinates</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-1">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Index target role lookup query</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full text-xs border border-slate-220 rounded-xl p-3 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Target Geography</label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="e.g. Remote, India"
              className="w-full text-xs border border-slate-220 rounded-xl p-3 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-4 flex items-end">
            <button
              type="button"
              disabled={searchStatus === "running"}
              onClick={handleManualSearch}
              className="w-full h-[46px] bg-teal-600 hover:bg-teal-700 text-white font-bold tracking-wider uppercase text-[11px] rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {searchStatus === "running" ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Crawling job websites...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Coordinates Match Finder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* START OF DIRECT OUTREACH & EMAIL DISPATCH STUDIO */}
      <div id="ai-direct-outreach-studio" className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Studio Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800 relative z-10">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-ping shrink-0" />
              <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest font-mono">
                OUTBOX DISPATCH STATION
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              AI Referral Pitch &amp; Outbox Staging Queue
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Edit outreach letters, approve personalized drafts, and send them to the Approval Drafts Queue!
            </p>
          </div>

          {foundJobs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Batch Action */}
              <button
                type="button"
                disabled={batchSending || sendingState === 'sending'}
                onClick={handleSendAllEmails}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-extrabold tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
              >
                {batchSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Adding to Queue ({batchCurrentCompanyIndex}/{batchTotalCompaniesCount})...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Send All {foundJobs.length} to Approval Queue 📥</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* If no matching companies are present yet */}
        {foundJobs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3 relative z-10">
            <div className="bg-slate-800/60 p-3 rounded-full inline-block border border-slate-700/50">
              <Mail className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">
              Mailer Studio locked. Please initiate the <strong>Autonomous Match Finder</strong> query above first to automatically find vacancies and compile corporate email references.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
            {/* LEFT COLUMN: Draft Editor (Span 7) */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="bg-slate-950/85 border border-slate-850 rounded-2xl p-4.5 space-y-4">
                
                {/* Select Company Dropdown & Edit Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    1. Select Target Company to review &amp; send:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedMatchJobId}
                      onChange={(e) => setSelectedMatchJobId(e.target.value)}
                      disabled={batchSending || sendingState === 'sending'}
                      className="flex-1 text-xs bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 font-sans focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {foundJobs.map((j) => {
                        const hasApp = applications.some((app) => app.jobId === j.id);
                        const isSent = applications.some((app) => app.jobId === j.id && app.status === "Applied");
                        return (
                          <option key={j.id} value={j.id}>
                            {j.company} — {j.title} {isSent ? " [✓ SENT]" : hasApp ? " [Draft Ready]" : " [Quick Gen Ready]"}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsEditingDraft(!isEditingDraft)}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        isEditingDraft 
                          ? "bg-purple-600/30 border-purple-500/80 text-purple-300 animate-pulse"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{isEditingDraft ? "👁 View Draft" : "✍ Edit Draft"}</span>
                    </button>
                  </div>
                </div>

                {/* Recipient Coordinates details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-850">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Recipient Name</span>
                    <input
                      type="text"
                      disabled={!isEditingDraft || batchSending || sendingState === 'sending'}
                      value={customRecipientName}
                      onChange={(e) => setCustomRecipientName(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-850 rounded-lg p-2 font-sans focus:outline-none text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Company Mailbox</span>
                    <input
                      type="text"
                      disabled={!isEditingDraft || batchSending || sendingState === 'sending'}
                      value={customRecipientEmail}
                      onChange={(e) => setCustomRecipientEmail(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-850 rounded-lg p-2 font-mono focus:outline-none text-slate-200"
                    />
                  </div>
                </div>

                {/* Outreach Subject */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Subject Line</span>
                  <input
                    type="text"
                    disabled={!isEditingDraft || batchSending || sendingState === 'sending'}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-850 rounded-lg p-2 font-sans focus:outline-none text-slate-200 font-bold"
                  />
                </div>

                {/* Live Outreach Draft Core Text Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Outreacher Referral Body</span>
                    <span className="text-[9.5px] font-mono text-slate-500">MIME Attachments: resume.pdf</span>
                  </div>
                  {isEditingDraft ? (
                    <textarea
                      rows={9}
                      value={customOutreachEmail}
                      onChange={(e) => setCustomOutreachEmail(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-850 rounded-xl p-3 font-mono focus:outline-none text-slate-200 leading-relaxed resize-none"
                    />
                  ) : (
                    <div className="w-full h-[184px] p-3 text-xs bg-slate-900/60 border border-slate-900 text-slate-300 rounded-xl font-mono leading-relaxed overflow-y-auto whitespace-pre-wrap text-left relative scrollbar-thin scrollbar-thumb-slate-850">
                      {customOutreachEmail}
                    </div>
                  )}
                </div>

                {/* Single dispatch operational block */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 italic">
                    {/* Display state indicator */}
                    {sendingState === 'sending' && (
                      <span className="text-amber-400 font-mono text-[10.5px] flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="h-3 w-3 animate-spin"/>
                        <span>{sendingProgressMessage}</span>
                      </span>
                    )}
                    {sendingState === 'success' && (
                      <span className="text-emerald-400 font-mono text-[10.5px] flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        <span>Draft Saved! Added to Approval Queue.</span>
                      </span>
                    )}
                    {sendingState === 'error' && (
                      <span className="text-rose-500 font-mono text-[10.5px]">
                        Failed to save draft to Approval Queue.
                      </span>
                    )}
                    {sendingState === 'idle' && (
                      <span className="opacity-70 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-purple-400" />
                        <span>Queue status: Ready to buffer</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={batchSending || sendingState === 'sending'}
                    onClick={handleSendSingleEmail}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Approval Queue 📥</span>
                  </button>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: Queued Cascade Progress or Dispatch Archives (Span 5) */}
            <div className="lg:col-span-5 flex flex-col justify-stretch text-left">
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4.5 flex-1 flex flex-col min-h-[350px]">
                
                {batchSending ? (
                  /* Cascading bulk status ticker */
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">BULK PIPELINE DISPATCH CASCADE</span>
                        <h4 className="text-sm font-extrabold text-white">Transmitting Automated Referrals</h4>
                      </div>

                      {/* Percentage gauge bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">SMTP Outgoing payload</span>
                          <span className="text-amber-400 font-bold">
                            {Math.round((batchCurrentCompanyIndex / batchTotalCompaniesCount) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full transition-all duration-300 animate-pulse"
                            style={{ width: `${(batchCurrentCompanyIndex / batchTotalCompaniesCount) * 150}%` }}
                          />
                        </div>
                      </div>

                      {/* Active line item step */}
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1 text-xs">
                        <span className="text-[9.5px] font-mono text-amber-300 uppercase font-black block">Active Process Ticker:</span>
                        <div className="font-mono text-slate-350">{batchCurrentStage}</div>
                      </div>
                    </div>

                    {/* Sequential completion list */}
                    <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto scrollbar-thin">
                      <span className="text-[9px] font-mono font-bold text-slate-500 block tracking-wide">COMPLETED IN BATCH:</span>
                      {batchCompletedCompanies.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">No emails dispatched yet...</p>
                      ) : (
                        <div className="space-y-1">
                          {batchCompletedCompanies.map((name, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-[10.5px] text-emerald-450 font-mono">
                              <span className="text-emerald-400">✓</span>
                              <span className="text-slate-300">To {name} Acquisition Team</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard display: Dispatch Archive History log */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                          <Building className="h-3.5 w-3.5 text-teal-500" />
                          <span>Simulated Despatched Mailroom</span>
                        </span>
                        <span className="text-[9px] bg-slate-900 text-slate-500 font-mono px-2 py-0.5 rounded border border-slate-800">
                          {simulatedDispatches.length} Outbox Logs
                        </span>
                      </div>

                      {simulatedDispatches.length === 0 ? (
                        <div className="py-12 text-center text-slate-550 space-y-2 text-xs">
                          <p className="italic text-slate-400">Standard SMTP queue successfully primed.</p>
                          <p className="opacity-80 text-[10.5px] text-slate-500">Sent outbox transcripts will populate in this panel instantly after you accept proposals.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                          {simulatedDispatches.map((disp, i) => (
                            <div key={disp.id || i} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 text-xs text-left relative group hover:border-slate-800 transition-all">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-white truncate font-sans">{disp.company}</span>
                                <span className="text-[8.5px] font-mono text-teal-400 bg-teal-950/50 px-1 py-0.2 rounded border border-teal-900/30 uppercase tracking-wider font-bold">
                                  {disp.type === 'batch' ? "bulk check" : "single OK"}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                <span className="text-slate-500">To:</span> {disp.to}
                              </div>
                              <p className="text-[10.5px] text-slate-300 leading-relaxed truncate font-mono">
                                {disp.body.replace(/\n/g, ' ')}
                              </p>
                              <div className="text-[8px] font-mono text-slate-500 pr-1 text-right mt-1">
                                Deliv: {disp.date}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Decorative branding line */}
                    <div className="pt-4 border-t border-slate-900 mt-6 flex justify-between items-center text-[9px] font-mono text-slate-500 select-none">
                      <span>TLS 1.3 Encryption Standard</span>
                      <span>Relay status: ACTIVE</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
      {/* END OF DIRECT OUTREACH & EMAIL DISPATCH STUDIO */}

      {/* Suggested Matching Jobs output block */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-left">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider font-mono">Matched Direct Suggestions List</h3>
            <p className="text-xs text-slate-500">Autonomous rankings calculated using semantic technical overlap metrics.</p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {foundJobs.length} matches discovered
          </span>
        </div>

        {foundJobs.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-16 text-center text-sm space-y-4 shadow-inner">
            <div className="bg-slate-100 p-3 rounded-full inline-block">
              <Briefcase className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              No matching suggestions extracted yet. Choose an active targeted profile above, verify the extracted taxonomy coordinates, and click on <strong>Summon AI Agents Loop</strong> to populate vacancies instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            {foundJobs.map((item) => {
              const alreadyApplied = applications.some((app) => app.jobId === item.id);

              return (
                <div key={item.id} className="bg-white border border-slate-205 rounded-3xl p-6.5 hover:shadow-md transition-all border border-slate-202 bg-white flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  
                  {/* Job metadata structure */}
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start space-x-3.5">
                      <img src={item.logo} alt={item.company} className="w-13 h-13 rounded-xl border object-cover shadow-xs shrink-0 bg-slate-50" referrerPolicy="no-referrer" />
                      <div>
                        <span className="text-[10px] bg-slate-100 text-slate-650 font-bold px-2 py-0.5 rounded-md font-mono select-none border">
                          {item.id.startsWith("searched-") ? "DIRECT AGENT MATCHED" : "SEEDED VACANCY"}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1">{item.title}</h4>
                        <p className="text-xs text-purple-700 font-bold">{item.company} • <span className="text-slate-410 font-light font-sans text-slate-450">{item.location} ({item.type})</span></p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-light">{item.description}</p>

                    {/* Real-time Timeline and Recruiter Coordinates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-450 font-bold">Timeline:</span>
                        <span className="text-slate-700 font-semibold text-[11px]">
                          Posted: {item.openDate || "2026-06-18"} | Closes: <span className="text-rose-600 bg-rose-50 px-1 rounded font-bold">{item.closingDate || "2026-07-18"}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-450 font-bold">Direct Access:</span>
                        <span className="flex items-center space-x-2 text-[11px]">
                          <a href={`mailto:${item.contactInfo || "recruitment@company.com"}`} className="text-purple-700 hover:underline font-bold truncate max-w-[140px]" title="Direct contact">
                            {item.contactInfo || "hiring@company.com"}
                          </a>
                          <span>•</span>
                          <a href={item.applyLink || item.jobUrl || "#"} target="_blank" rel="noreferrer" className="text-indigo-650 hover:underline font-bold flex items-center space-x-0.5">
                            <span>Apply</span>
                            <ExternalLink className="h-3 w-3 inline shrink-0" />
                          </a>
                        </span>
                      </div>
                    </div>

                    {/* Taxonomy overlap analysis widgets block */}
                    {item.matchAnalysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 border-t border-slate-100 text-xs">
                        
                        {/* Strengths / Overlap */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono font-bold text-emerald-600 tracking-wider uppercase block">Technical Strengths / Overlap</span>
                          <div className="space-y-1">
                            {item.matchAnalysis.strengths.map((str, idx) => (
                              <div key={idx} className="flex items-start space-x-1.5 text-slate-700">
                                <span className="text-emerald-500 font-black mt-0.5">✓</span>
                                <span className="leading-snug text-[10.5px] font-light">{str}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Gap analysis */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono font-bold text-amber-600 tracking-wider uppercase block">Identified Target Skill Gaps</span>
                          <div className="space-y-1">
                            {item.matchAnalysis.gapAnalysis.map((gap, idx) => (
                              <div key={idx} className="flex items-start space-x-1.5 text-slate-700">
                                <span className="text-amber-500 font-black mt-0.5">⚠</span>
                                <span className="leading-snug text-[10.5px] font-light">{gap}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational indicators, match score & saving button */}
                  <div className="lg:w-48 flex flex-col items-center lg:items-end justify-between self-stretch shrink-0 gap-4">
                    {/* Circle match rate */}
                    <div className="text-center lg:text-right space-y-1">
                      <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Match Rentability</span>
                      <div className="flex items-baseline justify-center lg:justify-end space-x-1">
                        <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                          {item.matchScore}%
                        </span>
                        <span className="text-slate-400 text-xs">Score</span>
                      </div>
                    </div>

                    <div className="text-center lg:text-right space-y-1">
                      <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase block leading-none">Estimate Rent</span>
                      <span className="text-xs text-slate-800 font-semibold font-mono">{item.salary || "Competitive"}</span>
                    </div>

                    {/* Operational Quick Saving trigger */}
                    {alreadyApplied ? (
                      <span className="w-full py-2 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5">
                        <BookmarkCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Saved to Outbox</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSaveApplication(item)}
                        className="w-full py-2 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5 text-amber-300" />
                        <span>Save to Outbox</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
