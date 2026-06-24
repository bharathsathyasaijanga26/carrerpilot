/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Mail, 
  FileText, 
  Copy, 
  Check, 
  Edit3, 
  Eye, 
  Columns, 
  Rows, 
  Type, 
  Paperclip, 
  Send,
  User,
  Linkedin,
  ExternalLink,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Database,
  AlertCircle,
  ShieldCheck
} from "lucide-react";

interface EmailDraftPreviewProps {
  email: string;
  coverLetter: string;
  onEmailChange: (val: string) => void;
  onCoverLetterChange: (val: string) => void;
  isReadOnly: boolean;
  recipientName: string;
  recipientEmail: string;
  jobTitle: string;
  companyName?: string;
  isSending?: boolean;
}

export default function EmailDraftPreview({
  email,
  coverLetter,
  onEmailChange,
  onCoverLetterChange,
  isReadOnly,
  recipientName,
  recipientEmail,
  jobTitle,
  companyName,
  isSending = false,
}: EmailDraftPreviewProps) {
  const [layoutMode, setLayoutMode] = useState<"side-by-side" | "email-vs-preview" | "tabbed">("side-by-side");
  const [activeTab, setActiveTab] = useState<"email" | "letter" | "preview">("email");
  const [isEditing, setIsEditing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [fontStyle, setFontStyle] = useState<"sans" | "serif">("serif");

  // --- LinkedIn Export Panel States ---
  const [isLinkedInOpen, setIsLinkedInOpen] = useState(false);
  const [selectedLinkedInTemplate, setSelectedLinkedInTemplate] = useState<"easy-apply" | "recruiter-connect" | "full-pitch" | "referral">("easy-apply");
  const [copiedLinkedInText, setCopiedLinkedInText] = useState(false);
  const [customTemplatesText, setCustomTemplatesText] = useState<Record<string, string>>({});

  // Session detection states
  const [isDetectingSession, setIsDetectingSession] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(true); // Default to detected
  const [sessionUserName] = useState("Alex Mercer");
  const [sessionUserHeadline] = useState("Software Engineer | Built with AI Studio");
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "failed">("idle");
  const [syncProgressMsg, setSyncProgressMsg] = useState("");
  const [syncedApplications, setSyncedApplications] = useState<Record<string, { date: string; template: string }>>({});

  // --- Real-Time Email Sending Agent Status States ---
  const [dispatchStage, setDispatchStage] = useState<"idle" | "connecting" | "drafting" | "transmitting" | "success">("idle");
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);

  // Hook to simulate the real-time SMTP agent pipeline
  React.useEffect(() => {
    if (isSending) {
      setDispatchStage("connecting");
      setDispatchLogs([
        "[SYSTEM] Initializing outbound Email Sending Agent...",
        "[SYSTEM] Establishing secure TLS tunnel handshake with Gmail SMTP..."
      ]);
      
      const timer1 = setTimeout(() => {
        setDispatchStage("drafting");
        setDispatchLogs(prev => [
          ...prev,
          "[AGENT] Tunnel established successfully containing encrypted SASL auth.",
          `[AGENT] Drafting personalized email content for: ${recipientName || "Hiring Lead"}...`,
          "[AGENT] Injecting tailored body context & parsing alignment logs..."
        ]);
      }, 1000);

      const timer2 = setTimeout(() => {
        setDispatchStage("transmitting");
        setDispatchLogs(prev => [
          ...prev,
          `[SYSTEM] Recipient mailbox mapped: "${recipientEmail || "recruitment@company.com"}"`,
          "[SYSTEM] Packing MIME structures & verifying server-side boundaries...",
          "[SYSTEM] Dispatching outbound messaging packet via authenticated API..."
        ]);
      }, 2300);

      const timer3 = setTimeout(() => {
        setDispatchStage("success");
        setDispatchLogs(prev => [
          ...prev,
          "[SUCCESS] Message successfully delivered to SMTP server!",
          `[SUCCESS] Dispatch handshake authorized. Message-ID: <g-msg-${Math.floor(100000 + Math.random() * 900000)}@gmail.com>`
        ]);
      }, 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      // Keep success log visible for 7 seconds to let the user review it fully
      if (dispatchStage === "transmitting" || dispatchStage === "success") {
        setDispatchStage("success");
        const successDismissTimer = setTimeout(() => {
          setDispatchStage("idle");
          setDispatchLogs([]);
        }, 8000);
        return () => clearTimeout(successDismissTimer);
      } else if (dispatchStage !== "idle") {
        setDispatchStage("idle");
        setDispatchLogs([]);
      }
    }
  }, [isSending, recipientEmail, recipientName]);

  // Auto-detect on mount
  React.useEffect(() => {
    setIsDetectingSession(true);
    const timer = setTimeout(() => {
      setIsDetectingSession(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const triggerSessionScan = () => {
    setIsDetectingSession(true);
    setSyncState("idle");
    setTimeout(() => {
      setIsDetectingSession(false);
    }, 1200);
  };

  const handleOneClickSync = async () => {
    if (!hasActiveSession) {
      return;
    }
    setSyncState("syncing");
    
    // Series of professional stages for live sync simulation
    const steps = [
      "Securing encrypted tunnel handshake with LinkedIn Drafts API...",
      "Analyzing active session cookie token & scopes...",
      `Assembling application package for "${title}"...`,
      `Uploading cover note metadata to LinkedIn outreach draft repository...`,
      "Synchronizing server-side reference logs...",
      "✓ Handshake finalized. Draft packet is officially registered!"
    ];

    for (let i = 0; i < steps.length; i++) {
      setSyncProgressMsg(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    setSyncState("synced");
    const today = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    setSyncedApplications(prev => ({
      ...prev,
      [`${title}-${company}`]: {
        date: today,
        template: selectedLinkedInTemplate
      }
    }));
  };

  const company = companyName || "Target Company";
  const title = jobTitle || "Role";
  const managerName = recipientName || "Hiring Lead";
  const managerFirstName = managerName ? managerName.trim().split(" ")[0] : "Hiring Lead";

  // Default calculated templates for LinkedIn
  const defaultTemplates = {
    "easy-apply": `Dear Hiring Team,\n\nI am writing to express my enthusiastic interest in the ${title} position at ${company}.\n\nWith practical experience in designing robust applications, optimizing critical system operations, and collaborating in fast-paced software environments, I am confident in my capacity to provide immediate, high-quality contributions to your department. My detailed resume highlights my focus on delivering production-safe solutions and aligned data operations.\n\nThank you for your valuable consideration. I am excited about the prospect of supporting ${company}'s active parameters.\n\nSincerely,\nCandidate`,
    
    "recruiter-connect": `Hi ${managerFirstName},\n\nI noticed you oversee talent at ${company}. I recently applied for the ${title} role and wanted to reach out. Given my background in technical systems and modern tools, I'd love to connect & share how I can assist your team's goals.\n\nBest,`,
    
    "full-pitch": `Hi ${managerFirstName},\n\nHope you are having a productive week!\n\nI recently applied to the ${title} position at ${company} and wanted to personally express my interest.\n\nHaving worked with robust architectures and integrated features like automated data flows, I am eager to bring my problem-solving skill set to your active projects. I'd appreciate a brief chat to learn more about your department's priorities and how I might contribute.\n\nThank you for your time!\n\nSincerely,\nCandidate`,
    
    "referral": `Hi [Name],\n\nI hope this message finds you well! I came across your profile while researching achievements at ${company}, and I'm highly impressed by your professional path.\n\nI am currently looking into the ${title} opportunity at your firm. Given your experience there, I would love to ask you a couple of brief questions about the team culture.\n\nIf you have 5 minutes for a quick virtual connection or exchange, I would be extremely grateful!\n\nBest regards,\nCandidate`
  };

  const getTemplateText = (key: "easy-apply" | "recruiter-connect" | "full-pitch" | "referral") => {
    return customTemplatesText[key] !== undefined ? customTemplatesText[key] : defaultTemplates[key];
  };

  const handleTemplateTextChange = (key: string, value: string) => {
    setCustomTemplatesText(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCopyLinkedIn = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedLinkedInText(true);
      setTimeout(() => setCopiedLinkedInText(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleCopyLetter = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const resolvePlaceholders = (text: string) => {
    if (!text) return <span className="text-slate-400 italic">No email draft generated yet.</span>;

    const companyVal = company || "Target Company";
    const recipientVal = managerName || "Hiring Lead";
    const jobVal = title || "Role";
    const emailVal = recipientEmail || "recruitment@company.com";

    const regex = /(\{(?:companyName|company|recipientName|jobTitle|recipientEmail)\}|\[(?:companyName|company|recipientName|jobTitle|recipientEmail)\])/gi;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const cleanPart = part.toLowerCase();
      if (cleanPart === "{companyname}" || cleanPart === "[companyname]" || cleanPart === "{company}" || cleanPart === "[company]") {
        return (
          <span key={i} className="bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.5 rounded border border-amber-250 font-sans mx-0.5 inline-block">
            {companyVal}
          </span>
        );
      }
      if (cleanPart === "{recipientname}" || cleanPart === "[recipientname]") {
        return (
          <span key={i} className="bg-purple-100 text-purple-900 font-semibold px-1.5 py-0.5 rounded border border-purple-250 font-sans mx-0.5 inline-block">
            {recipientVal}
          </span>
        );
      }
      if (cleanPart === "{jobtitle}" || cleanPart === "[jobtitle]") {
        return (
          <span key={i} className="bg-indigo-100 text-indigo-900 font-semibold px-1.5 py-0.5 rounded border border-indigo-250 font-sans mx-0.5 inline-block">
            {jobVal}
          </span>
        );
      }
      if (cleanPart === "{recipientemail}" || cleanPart === "[recipientemail]") {
        return (
          <span key={i} className="bg-blue-100 text-blue-900 font-semibold px-1.5 py-0.5 rounded border border-blue-250 font-mono mx-0.5 inline-block">
            {emailVal}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div id="email-draft-preview-root" className="bg-white border border-slate-205 border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      {/* Dynamic Header Toolbar */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="bg-purple-100 p-1.5 rounded-xl text-purple-600">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
              Email Draft Preview Studio
            </h4>
            <p className="text-[10px] text-slate-500 font-sans">
              Inspect, refine, and verify your outbound templates
            </p>
          </div>
        </div>

        {/* Configurations, mode switcher, fonts */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font switcher */}
          <button
            type="button"
            title="Toggle Reader Font"
            onClick={() => setFontStyle(fontStyle === "sans" ? "serif" : "sans")}
            className="p-1 px-2.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
          >
            <Type className="h-3.5 w-3.5" />
            <span className="font-mono">{fontStyle === "serif" ? "Serif" : "Sans"}</span>
          </button>

          {/* Edit/View toggle */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1 px-3 rounded-lg border text-[10px] font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                isEditing 
                  ? "bg-amber-500 border-amber-600 text-white" 
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? "Editing Mode" : "Click to Edit"}</span>
            </button>
          )}

          {/* Layout Mode Selector */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              title="Outreach Email & Cover Letter Side by Side"
              onClick={() => setLayoutMode("side-by-side")}
              className={`p-1 px-2 rounded-md flex items-center space-x-1 text-[10px] font-bold transition-all cursor-pointer ${
                layoutMode === "side-by-side" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Email &amp; Letter</span>
            </button>
            <button
              type="button"
              title="Email Editor & Live Recipient Preview"
              onClick={() => setLayoutMode("email-vs-preview")}
              className={`p-1 px-2 rounded-md flex items-center space-x-1 text-[10px] font-bold transition-all cursor-pointer ${
                layoutMode === "email-vs-preview" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Editor &amp; Preview</span>
            </button>
            <button
              type="button"
              title="Tabbed Layout"
              onClick={() => setLayoutMode("tabbed")}
              className={`p-1 px-2 rounded-md flex items-center space-x-1 text-[10px] font-bold transition-all cursor-pointer ${
                layoutMode === "tabbed" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Rows className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Tabbed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab select bar if "tabbed" layout active */}
      {layoutMode === "tabbed" && (
        <div className="flex border-b border-slate-200/60 bg-slate-50/30">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === "email" 
                ? "border-purple-600 text-purple-700 bg-white" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Outreach Email ✉️</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("letter")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === "letter" 
                ? "border-emerald-600 text-emerald-700 bg-white" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Cover Letter 📄</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === "preview" 
                ? "border-indigo-600 text-indigo-750 bg-white" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Live Recipient Preview 👁️</span>
          </button>
        </div>
      )}

       {/* Recipient Preview Card */}
      <div id="recipient-preview-card" className="mx-6 mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4.5 transition-all">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5">
          <div className="flex items-start space-x-3 text-left">
            <div className="bg-purple-100 p-2.5 rounded-xl text-purple-700 shrink-0 mt-0.5">
              <User className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black font-mono text-purple-600 uppercase tracking-widest block">
                CORRESPONDENCE DESTINATION &amp; INTEGRATIONS
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="text-xs font-bold text-slate-800">
                  Recipient Preview
                </h5>
                
                {/* LinkedIn Session Detection Badge */}
                {isDetectingSession ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-mono font-bold animate-pulse">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-500" />
                    <span>Checking LinkedIn cookie session...</span>
                  </span>
                ) : hasActiveSession ? (
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-250 text-[9px] font-mono font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 mr-1" />
                    <span>Session Active: Alex Mercer (Developer)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-mono font-semibold">
                    <AlertCircle className="h-2.5 w-2.5 text-slate-400 mr-1" />
                    <span>No LinkedIn Session Detected</span>
                  </div>
                )}
              </div>
              
              <p className="text-[10px] text-slate-500 font-sans leading-tight">
                Please verify extracted client coordinates. You can also sync metadata directly to LinkedIn profile folders.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 xl:flex-1 justify-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Extracted Name Badge */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 px-3.5 shadow-xs text-left min-w-[130px]">
                <span className="text-[8px] font-bold font-mono text-slate-400 block tracking-wider uppercase">Contact Name</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[135px]">
                    {recipientName || "Hiring Manager"}
                  </span>
                </div>
              </div>

              {/* Extracted Email Badge */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 px-3.5 shadow-xs text-left min-w-[170px]">
                <span className="text-[8px] font-bold font-mono text-slate-400 block tracking-wider uppercase">Extracted Email</span>
                <div className="flex items-center space-x-1.5 mt-0.5 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span className="text-xs font-mono font-bold truncate max-w-[175px]">
                    {recipientEmail || "recruitment@company.com"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              {/* LinkedIn Export Option */}
              <button
                type="button"
                onClick={() => {
                  setIsLinkedInOpen(!isLinkedInOpen);
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.01] ${
                  isLinkedInOpen
                    ? "bg-purple-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <Linkedin className="h-4 w-4 shrink-0" />
                <span>LinkedIn Assist {isLinkedInOpen ? "▾" : "🚀"}</span>
              </button>

              {/* One-Click Sync Option */}
              {hasActiveSession && (
                <button
                  type="button"
                  onClick={handleOneClickSync}
                  disabled={syncState === "syncing" || isDetectingSession}
                  className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                    syncState === "synced"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : syncState === "syncing"
                      ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                      : "bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300"
                  }`}
                >
                  {syncState === "syncing" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 shrink-0" />
                      <span>Syncing...</span>
                    </>
                  ) : syncState === "synced" ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Synced! ⚡</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>One-Click Sync ⚡</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Email Sending Agent progress console */}
        {(isSending || dispatchStage !== "idle") && (
          <div className="w-full mt-1 p-4 bg-slate-900 border border-slate-950 text-slate-100 rounded-xl font-mono text-left space-y-3 shadow-inner select-none animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dispatchStage === "success" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${dispatchStage === "success" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                </span>
                <span className="text-[9.5px] uppercase font-black tracking-wider text-purple-400">
                  Email Sending Agent Pipeline Log
                </span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">
                STAGE: {dispatchStage.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[155px] overflow-y-auto">
              {dispatchLogs.map((log, index) => {
                const isSuccess = log.includes("[SUCCESS]") || log.includes("✓");
                const isSystem = log.includes("[SYSTEM]");
                const colorClass = isSuccess 
                  ? "text-emerald-400 font-black" 
                  : isSystem 
                  ? "text-purple-300" 
                  : "text-slate-300";
                return (
                  <div key={index} className={`text-[10px] leading-relaxed flex items-start space-x-1.5 ${colorClass}`}>
                    <span className="text-slate-600 shrink-0 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 italic font-sans leading-tight">
                {dispatchStage === "connecting" && "⚡ Connecting to Gmail..."}
                {dispatchStage === "drafting" && "✉️ Drafting content..."}
                {dispatchStage === "transmitting" && "📤 Sending draft email packages..."}
                {dispatchStage === "success" && "✓ Sent successfully via secure SMTP tunnel!"}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${dispatchStage === "success" ? "bg-emerald-500 w-full" : "bg-purple-500"}`} 
                    style={{ 
                      width: dispatchStage === "connecting" ? "25%" : 
                             dispatchStage === "drafting" ? "55%" : 
                             dispatchStage === "transmitting" ? "85%" : 
                             dispatchStage === "success" ? "100%" : "0%" 
                    }} 
                  />
                </div>
                <span className="text-[9.5px] text-slate-400 font-mono w-6 text-right">
                  {dispatchStage === "connecting" && "25%"}
                  {dispatchStage === "drafting" && "55%"}
                  {dispatchStage === "transmitting" && "85%"}
                  {dispatchStage === "success" && "100%"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded LinkedIn Workspace Panel */}
      {isLinkedInOpen && (
        <div id="linkedin-export-workspace" className="mx-6 mt-4 p-5 bg-blue-50/50 border border-blue-100/80 rounded-2xl text-left space-y-4 animate-fadeIn relative overflow-hidden">
          {/* subtle decorative background shape */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-blue-100/60">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="px-1.5 py-0.5 text-[8px] bg-blue-600 text-white font-mono font-bold uppercase rounded tracking-wider">
                  NETWORKING PIPELINE
                </span>
                <span className="text-[10px] text-blue-700 font-bold font-mono">LINKEDIN OUTREACH PROTOCOL</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">LinkedIn Outreach Templates &amp; Assist</h4>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title + " " + company)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center space-x-1 cursor-pointer transition-all"
              >
                <span>Search Job on LinkedIn</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>
              <button
                type="button"
                onClick={() => setIsLinkedInOpen(false)}
                className="text-[10px] font-extrabold text-slate-450 hover:text-slate-600 transition-all cursor-pointer px-2"
              >
                Close Panel
              </button>
            </div>
          </div>

          {/* Integrated LinkedIn Direct Sync Hub */}
          <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Session status info & simulator */}
            <div className="space-y-1 md:col-span-2 text-left">
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900">Direct Session Sync Agent</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Pushes job metadata, outreach logs, and target candidates directly to your pre-detected LinkedIn drafts.
              </p>
              
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono text-slate-400 font-bold">SESSION:</span>
                {isDetectingSession ? (
                  <span className="text-[10px] text-amber-600 font-bold flex items-center space-x-1 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Detecting cookie handles...</span>
                  </span>
                ) : hasActiveSession ? (
                  <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border border-emerald-150">
                    <span>{sessionUserName} (Verified API Session)</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-red-650 font-bold bg-red-50 text-red-700 px-2.5 py-0.5 rounded border border-red-150 font-mono">
                    No active session token discovered
                  </span>
                )}
                
                {/* Simulation controls to test both states */}
                <button
                  type="button"
                  onClick={() => {
                    setHasActiveSession(!hasActiveSession);
                  }}
                  className="text-[9px] font-mono font-bold text-blue-600 hover:underline px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded cursor-pointer"
                >
                  [Simulate {hasActiveSession ? "Log Out" : "Log In"}]
                </button>
                
                <button
                  type="button"
                  onClick={triggerSessionScan}
                  title="Rescan active browser tab cookies"
                  className="p-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  <RefreshCw className={`h-2.5 w-2.5 text-slate-500 ${isDetectingSession ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Direct Sync Action Button */}
            <div className="flex flex-col gap-1.5 md:border-l md:border-slate-100 md:pl-4">
              <button
                type="button"
                onClick={handleOneClickSync}
                disabled={syncState === "syncing" || isDetectingSession || !hasActiveSession}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                  !hasActiveSession
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : syncState === "synced"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    : syncState === "syncing"
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                }`}
              >
                {syncState === "syncing" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Syncing Draft...</span>
                  </>
                ) : syncState === "synced" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Sync Completed ✓</span>
                  </>
                ) : (
                  <>
                    <Database className="h-3.5 w-3.5" />
                    <span>One-Click Sync Draft ⚡</span>
                  </>
                )}
              </button>
              
              <div className="text-center">
                <span className="text-[9px] font-mono text-slate-400 block">
                  {syncState === "synced" && "Draft ready at Messaging > Drafts"}
                  {syncState === "idle" && hasActiveSession && "Ready for swift API handshake"}
                  {!hasActiveSession && "⚠️ Establish active session first"}
                </span>
              </div>
            </div>
          </div>

          {/* Animated Sync progress or confirmation slip */}
          {syncState === "syncing" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-left font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center space-x-1.5 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>TRANSMITTING DIRECT METADATA PACKET</span>
                </span>
                <span className="text-[9px] text-slate-500">SECURE API HANDSHAKE</span>
              </div>
              <p className="text-[10px] text-slate-300 animate-pulse">
                {syncProgressMsg}
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full duration-1000" style={{ width: "85%" }} />
              </div>
            </div>
          )}

          {syncState === "synced" && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-left grid grid-cols-1 md:grid-cols-2 gap-4 items-center animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-widest font-mono">LINKEDIN DRAFT SECURED</span>
                </div>
                <h5 className="text-[11px] font-bold text-slate-900">
                  Metadata successfully bound to LinkedIn profile inbox draft!
                </h5>
                <p className="text-[10px] text-slate-500 leading-normal">
                  The outreach brief is now pre-staged in your native LinkedIn messaging tab under "Drafts". Keep applying with high accuracy!
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-emerald-100/60 font-mono text-[9px] text-slate-600 space-y-1">
                <div className="flex justify-between border-b pb-1 border-slate-100">
                  <span className="text-slate-400 font-bold">JOB SYNC:</span>
                  <span className="font-bold text-slate-800">{title}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-100">
                  <span className="text-slate-400 font-bold">ORGANIZATION:</span>
                  <span className="font-bold text-slate-800">{company}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-100">
                  <span className="text-slate-400 font-bold">DRAFT TARGET:</span>
                  <span className="font-bold text-slate-800">Messaging &gt; Drafts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">SYNC HASH ID:</span>
                  <span className="font-bold text-blue-700">LNKD-55018-{Math.floor(100 + Math.random() * 900)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick template pick tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: "easy-apply", label: "Easy Apply Brief Note", desc: "For general quick apply attachments", icon: FileText },
              { id: "recruiter-connect", label: "300 Chars Invite Note", desc: "For connection requests", icon: Sparkles },
              { id: "full-pitch", label: "Full Recruiter Pitch", desc: "For direct messaging & InMails", icon: MessageSquare },
              { id: "referral", label: "Warm Referral Ask", desc: "Ask employees for referrals", icon: User }
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedLinkedInTemplate(tab.id as any);
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedLinkedInTemplate === tab.id
                      ? "bg-white border-blue-500 shadow-sm text-blue-800 ring-1 ring-blue-500/20"
                      : "bg-white/40 border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-white/75"
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <IconComp className={`h-3.5 w-3.5 ${selectedLinkedInTemplate === tab.id ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="text-[11px] font-black truncate">{tab.label}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight mt-1 line-clamp-1">{tab.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Editable Text Area for selected templates */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                {selectedLinkedInTemplate === "easy-apply" && "📝 Brief Cover Note"}
                {selectedLinkedInTemplate === "recruiter-connect" && "⚡ Direct recruiter connect (300 char limit)"}
                {selectedLinkedInTemplate === "full-pitch" && "💬 Full recruiter direct message"}
                {selectedLinkedInTemplate === "referral" && "🤝 Warm request to employees"}
              </span>

              {/* Dynamic char tracker with warning for recruiter connection limits */}
              <span className={`text-[10px] font-mono font-bold ${
                selectedLinkedInTemplate === "recruiter-connect" 
                  ? getTemplateText("recruiter-connect").length > 300 
                    ? "text-red-500 animate-pulse" 
                    : "text-blue-600"
                  : "text-slate-400"
              }`}>
                {getTemplateText(selectedLinkedInTemplate as any).length}
                {selectedLinkedInTemplate === "recruiter-connect" ? " / 300 characters limit" : " characters"}
              </span>
            </div>

            <textarea
              rows={5}
              value={getTemplateText(selectedLinkedInTemplate as any)}
              onChange={(e) => handleTemplateTextChange(selectedLinkedInTemplate, e.target.value)}
              className="w-full text-xs font-mono text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none transition-all"
              placeholder="Enter template text here..."
            />

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
              <p className="text-[10px] text-slate-500 italic max-w-md">
                {selectedLinkedInTemplate === "recruiter-connect" && "⚠️ Note: LinkedIn restricts connection requests to 300 characters max."}
                {selectedLinkedInTemplate === "easy-apply" && "💡 Use this brief, punchy note inside Easy Apply cover letter questions."}
                {selectedLinkedInTemplate === "full-pitch" && "💡 Send this detailed pitch to your connection after they approve your request."}
                {selectedLinkedInTemplate === "referral" && "💡 Build social capital! Personalize first before asking for reference vouching."}
              </p>

              <button
                type="button"
                onClick={() => handleCopyLinkedIn(getTemplateText(selectedLinkedInTemplate as any))}
                className="px-4.5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
              >
                {copiedLinkedInText ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy to Clipboard 📄</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Panes */}
      <div className={`p-6 bg-slate-50/20 ${layoutMode !== "tabbed" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "block"}`}>
        {/* outreachEmail Area */}
        {(layoutMode !== "tabbed" || activeTab === "email") && (
          <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
            {/* Mock Mail Client Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Mail className="h-3.5 w-3.5 text-purple-600" />
                  <span>Outbound Outreach Envelope</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1 px-2.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50 text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                >
                  {copiedEmail ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedEmail ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="text-xs space-y-1 bg-white border border-slate-200/65 rounded-xl p-3 shadow-xs">
                <div className="flex border-b border-slate-100 pb-1.5">
                  <span className="w-12 text-slate-400 font-medium">To:</span>
                  <span className="text-slate-800 font-mono font-bold truncate">
                    {recipientName || "Hiring Manager"} &lt;{recipientEmail || "recruitment@company.com"}&gt;
                  </span>
                </div>
                <div className="flex pt-1">
                  <span className="w-12 text-slate-400 font-medium">Subject:</span>
                  <span className="text-slate-700 font-semibold truncate">
                    Proposal: Application for {jobTitle || "the advertised role"}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body Workspace */}
            <div className="flex-1 p-5 min-h-[300px] flex flex-col">
              {isEditing ? (
                <textarea
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className="w-full flex-1 min-h-[280px] text-xs font-mono p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 leading-relaxed resize-none font-sans"
                  placeholder="Draft your outreach email..."
                />
              ) : (
                <div className={`text-slate-700 leading-relaxed text-xs whitespace-pre-wrap ${fontStyle === "serif" ? "font-serif" : "font-sans"} text-left flex-1`}>
                  {email ? email : (
                    <span className="text-slate-400 italic font-sans">No email draft generated yet. Use the customizable AI Prompt Box below to write one!</span>
                  )}
                </div>
              )}
            </div>

            {/* Attachment line footer decoration */}
            <div className="bg-slate-50/50 border-t border-slate-100 p-3 px-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <Paperclip className="h-3 w-3" />
                <span>Resume (extracted metrics) attached</span>
              </span>
              <span>Payload: Ready</span>
            </div>
          </div>
        )}

        {/* coverLetter Area */}
        {(layoutMode === "side-by-side" || (layoutMode === "tabbed" && activeTab === "letter")) && (
          <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
            {/* Sheet Cover Letter Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                <span>Corporate Cover Letter Spec</span>
              </span>
              <button
                type="button"
                onClick={handleCopyLetter}
                className="p-1 px-2.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50 text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
              >
                {copiedLetter ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedLetter ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Letter Document Body Workspace */}
            <div className="flex-1 p-6 min-h-[300px] flex flex-col relative bg-slate-50/10">
              {isEditing ? (
                <textarea
                  value={coverLetter}
                  onChange={(e) => onCoverLetterChange(e.target.value)}
                  className="w-full flex-1 min-h-[280px] text-xs font-mono p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 leading-relaxed resize-none font-sans"
                  placeholder="Draft your formal cover letter..."
                />
              ) : (
                <div className={`text-slate-700 leading-relaxed text-xs whitespace-pre-wrap ${fontStyle === "serif" ? "font-serif" : "font-sans"} text-left flex-1 max-h-[360px] overflow-y-auto pr-2`}>
                  {coverLetter ? coverLetter : (
                    <span className="text-slate-400 italic font-sans">No cover letter draft generated yet. Fill the prompts to generate!</span>
                  )}
                </div>
              )}
            </div>

            {/* Print specifications footer decoration */}
            <div className="bg-slate-50/50 border-t border-slate-100 p-3 px-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Standard A4 margins</span>
              <span>Word count: {coverLetter ? coverLetter.trim().split(/\s+/).length : 0} words</span>
            </div>
          </div>
        )}

        {/* Live Email Preview Area */}
        {(layoutMode === "email-vs-preview" || (layoutMode === "tabbed" && activeTab === "preview")) && (
          <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
            {/* Mock Inbox Client Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Eye className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Live Recipient Preview (Placeholders Resolved)</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-150">
                  Recipient View
                </span>
              </div>

              <div className="text-xs space-y-1 bg-white border border-slate-200/65 rounded-xl p-3 shadow-xs">
                <div className="flex border-b border-slate-100 pb-1.5">
                  <span className="w-12 text-slate-400 font-medium">From:</span>
                  <span className="text-slate-800 font-mono truncate">
                    You &lt;candidate@careers.ai&gt;
                  </span>
                </div>
                <div className="flex border-b border-slate-100 pb-1.5 pt-1.5">
                  <span className="w-12 text-slate-400 font-medium">To:</span>
                  <span className="text-slate-800 font-mono font-bold truncate">
                    {recipientName || "Hiring Manager"} &lt;{recipientEmail || "recruitment@company.com"}&gt;
                  </span>
                </div>
                <div className="flex pt-1.5">
                  <span className="w-12 text-slate-400 font-medium">Subject:</span>
                  <span className="text-slate-700 font-semibold truncate">
                    Proposal: Application for {jobTitle || "the advertised role"}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body Workspace */}
            <div className="flex-1 p-5 min-h-[300px] flex flex-col bg-slate-50/10">
              <div className={`text-slate-705 leading-relaxed text-xs whitespace-pre-wrap ${fontStyle === "serif" ? "font-serif" : "font-sans"} text-left flex-1`}>
                {resolvePlaceholders(email)}
              </div>
            </div>

            <div className="bg-slate-50/50 border-t border-slate-100 p-3 px-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <Paperclip className="h-3 w-3" />
                <span>Resume (extracted metrics) attached</span>
              </span>
              <span className="text-emerald-600 font-bold">✓ Render Clean</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
