/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Layers, 
  FileText, 
  Search, 
  Mail, 
  Trophy, 
  BarChart3, 
  Brain, 
  Settings, 
  LogOut, 
  UserCheck, 
  Bell, 
  Info, 
  Moon, 
  Sun,
  ShieldAlert,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Cpu,
  MailCheck,
  Zap
} from "lucide-react";

import { Resume, Job, Application, ChatMessage } from "./types";
import LandingPage from "./components/LandingPage";
import ResumeManager from "./components/ResumeManager";
import JobSearchBoard from "./components/JobSearchBoard";
import ApplicationCenter from "./components/ApplicationCenter";
import KanbanBoard from "./components/KanbanBoard";
import AnalyticsCharts from "./components/AnalyticsCharts";
import AIChatCoach from "./components/AIChatCoach";
import BrandLogo from "./components/BrandLogo";
import SkillsMatchAgentPage from "./components/SkillsMatchAgentPage";

const getDefaultDeadlineStr = (daysAhead: number = 14) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  // Session states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resumes' | 'skills-match' | 'search' | 'applications' | 'tracking' | 'analytics' | 'coach'>('dashboard');
  
  // Theme Toggle State 
  const [darkMode, setDarkMode] = useState(false);

  // Business entities lists
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string>("");

  // Gmail / LinkedIn OAuth Connection status mock toggle controls
  const [gmailConnected, setGmailConnected] = useState(true);
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  // Notification lists state
  const [notifications, setNotifications] = useState<Array<{ id: string; msg: string; type: 'success' | 'alert' | 'info' }>>([
    { id: "notif-1", msg: "CareerPilot Agent Node Online - Ready for dispatch", type: "success" },
    { id: "notif-2", msg: "Mock Gmail channels configured successfully", type: "info" }
  ]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Fetch initial repositories on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchResumes();
      fetchJobs();
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/resumes");
      const data = await response.json();
      setResumes(data || []);
      if (data && data.length > 0 && !activeResumeId) {
        setActiveResumeId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load resumes", e);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      setJobs(data || []);
    } catch (e) {
      console.error("Failed to load seed vacancies", e);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications");
      const data = await response.json();
      setApplications(data || []);
    } catch (e) {
      console.error("Failed to load application history logs", e);
    }
  };

  // API Call: Parse pasted resume
  const handleParseResumeText = async (text: string, filename?: string) => {
    const response = await fetch("/api/resume/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText: text, filename })
    });
    const result = await response.json();
    if (!result.success || !result.resume) {
      throw new Error(result.error || "Failed to parse text via LLM parser.");
    }

    let finalResume = result.resume;

    // Post-processing skill extraction via dedicated Skill Extraction Agent
    try {
      const skillsResponse = await fetch("/api/resume/extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: finalResume.id, resumeText: text })
      });
      const skillsResult = await skillsResponse.json();
      if (skillsResult.success && skillsResult.skills) {
        finalResume = {
          ...finalResume,
          skills: skillsResult.skills
        };
      }
    } catch (e) {
      console.error("Skill Extraction Agent execution failed, fallback applied:", e);
    }

    setResumes((prev) => [...prev, finalResume]);
    setActiveResumeId(finalResume.id);
    addNotification(`Resume parsed, analyzed & optimized! Skills extracted dynamically.`, "success");
  };

  // API Call: Delete resume
  const handleDeleteResume = async (id: string) => {
    try {
      await fetch("/api/resumes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setResumes((prev) => prev.filter(r => r.id !== id));
      if (activeResumeId === id) {
        setActiveResumeId("");
      }
      addNotification("Resume version removed from index.", "info");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateResume = (updated: Resume) => {
    setResumes((prev) => prev.map(r => r.id === updated.id ? updated : r));
  };

  // Convert matched direct job from the SkillsMatchAgentPage to an application in Saved/Drafting stage
  const handleSaveMatchToApplications = async (job: Job) => {
    // Append to local jobs state if missing
    if (!jobs.some(j => j.id === job.id)) {
      setJobs(prev => [...prev, job]);
      try {
        await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job })
        });
      } catch (e) {
        console.error("Failed to persist matched job on backend", e);
      }
    }

    addNotification(`Invoking CrewAI Agents to draft outreach for ${job.company}...`, "info");
    
    try {
      const response = await fetch("/api/crew/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, resumeId: activeResumeId })
      });
      const result = await response.json();
      
      if (result.success && result.metadata) {
        let recEmail = "recruiting@company.com";
        let recName = "Hiring Lead";
        try {
          const parsedContacts = typeof result.metadata.contactPoints === "string" 
            ? JSON.parse(result.metadata.contactPoints.replace(/'/g, '"'))
            : result.metadata.contactPoints;
          if (Array.isArray(parsedContacts) && parsedContacts.length > 0) {
            recEmail = parsedContacts[0]?.email || recEmail;
            recName = parsedContacts[0]?.name || recName;
          } else if (parsedContacts && parsedContacts.email) {
            recEmail = parsedContacts.email;
            recName = parsedContacts.name;
          }
        } catch (e) {
          console.error("Failed parsing contact points:", e);
        }

        const newApp: Application = {
          id: "app-" + Date.now(),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || "Competitive",
          status: "Saved",
          dateCreated: new Date().toLocaleDateString(),
          deadline: getDefaultDeadlineStr(14),
          coverLetter: result.metadata.coverLetter,
          outreachEmail: result.metadata.customizedOutreach,
          recipientEmail: recEmail,
          recipientName: recName,
          historyLogs: (result.steps || []).map((s: any) => ({
            id: "log-" + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            agentName: s.agentName || "Agent Tasks",
            message: s.message || s.log
          }))
        };

        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: newApp })
        });

        setApplications(prev => [...prev, newApp]);
        addNotification(`Draft documents created! ${job.title} added to Approval Queue.`, "success");
      }
    } catch (e) {
      console.error(e);
      const newApp: Application = {
        id: "app-" + Date.now(),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary || "Competitive",
        status: "Saved",
        dateCreated: new Date().toLocaleDateString(),
        deadline: getDefaultDeadlineStr(14),
        coverLetter: `Dear Hiring Team at ${job.company},\n\nI am thrilled to apply for the ${job.title} position...`,
        outreachEmail: `Hi there,\n\nI just applied for the ${job.title} role! Let's connect.`,
        recipientEmail: "hiring@company.com",
        recipientName: "Hiring Executive",
        historyLogs: []
      };

      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: newApp })
      });

      setApplications(prev => [...prev, newApp]);
      addNotification(`Draft documents created (Fallback)! Saved to Approval Queue.`, "success");
    }
  };

  // API Call: Execute step-by-step pipeline
  const handleTriggerCrewAI = async (jobId: string, resumeId: string) => {
    const response = await fetch("/api/crew/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, resumeId })
    });
    const result = await response.json();
    if (result.success && result.metadata) {
      // Create new application in saved/approval queue state automatically
      const newApp: Application = {
        id: "app-" + Date.now(),
        jobId,
        jobTitle: jobs.find(j => j.id === jobId)?.title || "Software Opportunity",
        company: jobs.find(j => j.id === jobId)?.company || "Global Inc",
        location: jobs.find(j => j.id === jobId)?.location || "Remote",
        salary: jobs.find(j => j.id === jobId)?.salary || "N/A",
        status: "Saved",
        dateCreated: new Date().toLocaleDateString(),
        deadline: getDefaultDeadlineStr(14),
        coverLetter: result.metadata.coverLetter,
        outreachEmail: result.metadata.customizedOutreach,
        recipientEmail: JSON.parse(result.metadata.contactPoints.replace(/'/g, '"'))[0]?.email || "sarah.jenkins@stripe.com",
        recipientName: JSON.parse(result.metadata.contactPoints.replace(/'/g, '"'))[0]?.name || "Sarah Jenkins",
        historyLogs: result.steps.map((s: any) => ({
          id: "log-" + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          agentName: s.agentName,
          message: s.message
        }))
      };

      // Persist application on backend session database
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: newApp })
      });
      
      setApplications((prev) => [...prev, newApp]);
      addNotification(`Agent Crew finished crafting drafts for ${newApp.company}!`, "success");
    }
    return result;
  };

  // API Call: Tweak resume drafts
  const handleTweakDraft = async (appId: string, customInstruction: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const response = await fetch("/api/cover-letter/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        resumeId: activeResumeId, 
        jobId: app.jobId,
        customPrompt: customInstruction 
      })
    });
    const result = await response.json();
    if (result.coverLetter) {
      setApplications((prev) => prev.map(a => {
        if (a.id === appId) {
          return {
            ...a,
            coverLetter: result.coverLetter,
            outreachEmail: result.outreachEmail
          };
        }
        return a;
      }));
      addNotification("Applied custom instructions to cover letter and outbox templates.", "success");
    }
  };

  // API Call: Update application stage
  const handleUpdateAppStatus = async (appId: string, status: any, outreachEmail?: string, coverLetter?: string, deadline?: string) => {
    try {
      const response = await fetch("/api/applications/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, status, outreachEmail, coverLetter, deadline })
      });
      const result = await response.json();
      if (result.success) {
        setApplications((prev) => prev.map(a => {
          if (a.id === appId) {
            return {
              ...a,
              status: status !== undefined ? status : a.status,
              outreachEmail: outreachEmail !== undefined ? outreachEmail : a.outreachEmail,
              coverLetter: coverLetter !== undefined ? coverLetter : a.coverLetter,
              deadline: deadline !== undefined ? deadline : a.deadline,
              dateApplied: status === "Applied" ? new Date().toLocaleDateString() : a.dateApplied
            };
          }
          return a;
         }));
         addNotification(`Application saved successfully!`, "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API Call: Conversational assistant
  const handleChatCoach = async (messages: ChatMessage[]) => {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages, 
        contextResumeId: activeResumeId,
        contextJobId: jobs[0]?.id 
      })
    });
    const result = await response.json();
    return result.reply || "I couldn't generate a conversational response right now.";
  };

  // Helper notification builder
  const addNotification = (msg: string, type: 'success' | 'alert' | 'info') => {
    const newNotif = { id: "notif-" + Date.now(), msg, type };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-amber-100 ${darkMode ? 'dark bg-white text-slate-800' : 'bg-white text-slate-800'}`}>
      
      {/* Landing phase if unauthenticated */}
      {!isAuthenticated ? (
        <LandingPage 
          onGetStarted={() => setIsAuthenticated(true)}
          onLogin={() => setIsAuthenticated(true)}
        />
      ) : (
        <div id="dashboard-app-frame" className="flex flex-col md:flex-row min-h-screen">
          
          {/* Main Sidebar controls layout with Brand Blue background */}
          <aside className="w-full md:w-64 bg-[#00205B] text-white flex flex-col justify-between p-6 shrink-0 relative shadow-xl">
            <div className="space-y-8 text-left">
              
              {/* Brand Header */}
              <div 
                className="bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-md border border-white/10 hover:bg-white transition-all cursor-pointer flex items-center justify-center w-full" 
                onClick={() => setActiveTab('dashboard')}
              >
                <BrandLogo className="h-8 w-auto" showText={true} />
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                <button
                  id="tab-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'dashboard' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Layers className="h-4.5 w-4.5 text-blue-200" />
                  <span>Control Dashboard</span>
                </button>

                <button
                  id="tab-resumes"
                  onClick={() => setActiveTab('resumes')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'resumes' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <FileText className="h-4.5 w-4.5 text-blue-200" />
                  <span>Resume Builder</span>
                </button>

                <button
                  id="tab-skills-match"
                  onClick={() => setActiveTab('skills-match')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'skills-match' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Cpu className="h-4.5 w-4.5 text-blue-200" />
                  <span>Direct Skill Match Agents</span>
                </button>

                <button
                  id="tab-search"
                  onClick={() => setActiveTab('search')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'search' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Search className="h-4.5 w-4.5 text-blue-200" />
                  <span>Match & Search vacancies</span>
                </button>

                <button
                  id="tab-applications"
                  onClick={() => setActiveTab('applications')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'applications' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Mail className="h-4.5 w-4.5 text-blue-200" />
                  <span>Approval Drafts Queue</span>
                </button>

                <button
                  id="tab-tracking"
                  onClick={() => setActiveTab('tracking')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'tracking' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <ClipboardList className="h-4.5 w-4.5 text-blue-200" />
                  <span>Kanban Pipeline tracker</span>
                </button>

                <button
                  id="tab-analytics"
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'analytics' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <BarChart3 className="h-4.5 w-4.5 text-blue-200" />
                  <span>Conversion Analytics</span>
                </button>

                <button
                  id="tab-coach"
                  onClick={() => setActiveTab('coach')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'coach' 
                      ? "bg-white/12 text-white shadow-inner font-bold border-l-4 border-[#FFB800]" 
                      : "text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Brain className="h-4.5 w-4.5 text-blue-200" />
                  <span>AI Mock Interview Coach</span>
                </button>
              </nav>
            </div>

            {/* Down footer actions */}
            <div className="space-y-4 pt-6 border-t border-white/10 text-left">
              {/* OAuth switch display connector */}
              <div className="bg-white/5 p-3 rounded-2xl space-y-2 text-[10px]">
                <div className="flex justify-between items-center text-blue-200">
                  <span>Gmail Integrations:</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                    gmailConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/20 text-rose-450"
                  }`}>
                    {gmailConnected ? "CONNECTED" : "STOP"}
                  </span>
                </div>
                <button 
                  onClick={() => { setGmailConnected(!gmailConnected); addNotification(gmailConnected ? "Gmail channel toggled off." : "Gmail outbox pipeline connected.", "info"); }}
                  className="w-full py-1 bg-white/10 hover:bg-white/20 text-white rounded font-bold transition-all text-[9.5px] cursor-pointer"
                >
                  {gmailConnected ? "Disconnect Inbox" : "Activate Gmail API Auth"}
                </button>
              </div>

              {/* Log out option */}
              <button
                id="btn-sidebar-logout"
                onClick={() => setIsAuthenticated(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-blue-200 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out Session</span>
              </button>
            </div>
          </aside>

          {/* Core Body Frame */}
          <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
            
            {/* Top Workspace Navbar */}
            <header className="h-16 border-b border-slate-205 dark:border-slate-850 px-8 bg-white dark:bg-slate-900 flex justify-between items-center z-10">
              <div className="flex items-center space-x-2 text-slate-450 dark:text-slate-400 text-xs">
                <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">Workspace Room</span>
                <span className="text-slate-250 font-sans">/</span>
                <span className="capitalize">{activeTab}</span>
              </div>

              {/* Navigation Widgets on top right */}
              <div className="flex items-center space-x-4">
                
                {/* Dark Mode toggle icon buttons */}
                <button
                  id="btn-theme-toggle"
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Toggle Display Theme"
                >
                  {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-purple-700" />}
                </button>

                {/* Notifications bell button */}
                <div className="relative">
                  <button
                    id="btn-notif-drawer"
                    onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 relative transition-colors cursor-pointer"
                  >
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                    )}
                  </button>

                  {/* Dropdown notifications list */}
                  {showNotifDrawer && (
                    <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-3 z-50 text-left text-xs animate-fade-in text-slate-900">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-850 text-xs">Notifications Log</span>
                        <span className="text-[10px] text-purple-600 hover:underline cursor-pointer" onClick={() => setNotifications([])}>Clear</span>
                      </div>
                      
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-slate-400 italic text-center py-4">No recent notification reports.</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-2 bg-slate-50 rounded-xl flex justify-between items-start space-x-2">
                              <p className="font-light leading-snug">{n.msg}</p>
                              <button onClick={() => removeNotification(n.id)} className="text-slate-350 hover:text-rose-600">&times;</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connected User Badge */}
                <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                  <div className="w-8.5 h-8.5 bg-gradient-to-tr from-[#00205B] to-[#FFB800] text-white rounded-xl flex items-center justify-center font-bold text-xs ring-2 ring-blue-50">
                    SS
                  </div>
                  <div className="hidden md:block leading-none text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Siddharth Sharma</p>
                    <span className="text-[10px] text-slate-450 dark:text-slate-400 font-mono font-medium">Enterprise Candidate</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Primary content area panel - all background white */}
            <div className="flex-1 p-8 bg-white font-sans text-slate-800">
              
              {/* Active panel router switches */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Dashboard stats layout banner */}
                  <div className="text-left space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                      <span>Welcome back, Siddharth!</span>
                      <Sparkles className="h-5 w-5 text-amber-500 animate-bounce" />
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Monitor application velocity, configure resume index criteria, and approve outbox agent pipelines.</p>
                  </div>

                  {/* Summary Metric Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 text-left">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Vacancies Found</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{jobs.length}</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Active Resumes</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{resumes.length}</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Approval Drafts</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
                        {applications.filter(a => a.status === "Saved").length}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Applications sent</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
                        {applications.filter(a => a.status === "Applied").length}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Interviews</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
                        {applications.filter(a => a.status === "Interview").length}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Offer secure</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
                        {applications.filter(a => a.status === "Offer").length}
                      </span>
                    </div>
                  </div>

                  {/* Flow flowchart list agent loops */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-left space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Cpu className="h-5 w-5 text-purple-600 animate-spin" />
                      <span>CareerPilot CrewAI Multi-Agent Architecture Hub</span>
                    </h3>
                    
                    {/* Visual workflow loops row */}
                    <div className="grid grid-cols-2 md:grid-cols-6 xl:grid-cols-11 gap-2.5 pt-3">
                      {[
                        { title: "Resume Upload", agent: "ATS Document" },
                        { title: "Resume Parser", agent: "Resume Agent" },
                        { title: "Skill Taxonomer", agent: "Extraction Agent" },
                        { title: "Job Scrawler", agent: "Search Agent" },
                        { title: "Overlap Matcher", agent: "Matching Agent" },
                        { title: "Target Researcher", agent: "Company Agent" },
                        { title: "Decision Contact Finder", agent: "Email Agent" },
                        { title: "Document Studio", agent: "Drafter Agent" },
                        { title: "Approval Gate", agent: "User Gate" },
                        { title: "Outbox Dispatcher", agent: "Sending Agent" },
                        { title: "Metrics Tracker", agent: "Tracking Agent" }
                      ].map((step, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-150 dark:border-slate-750 text-center flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-purple-600 block leading-tight font-mono">{idx + 1}</span>
                          <span className="text-[10.5px] font-bold text-slate-850 dark:text-slate-100 block truncate mt-1 leading-tight">{step.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-2">{step.agent}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bento actions panel Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                    
                    {/* Setup state connector info card */}
                    <div className="bg-gradient-to-tr from-purple-900 to-indigo-950 text-white rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-md">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono tracking-widest text-purple-300 font-extrabold uppercase">Setup Complete</span>
                        <h4 className="text-xl font-bold">Configure Google & LinkedIn API channels</h4>
                        <p className="text-xs text-purple-100 font-light leading-relaxed">
                          To initiate automatic final dispatches via outer corporate interfaces, establish connection authentication parameters in your sidebar deck or test with simulated mail outbox paths instantly.
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 pt-3 text-xs">
                        <span className="flex items-center space-x-1.5 font-bold">
                          <CheckCircle className="h-4.5 w-4.5 text-amber-400" />
                          <span>Google Channel Secure</span>
                        </span>
                        <button 
                          onClick={() => { setLinkedinConnected(!linkedinConnected); addNotification("LinkedIn pipeline activated", "success"); }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          {linkedinConnected ? "LinkedIn Secure" : "Connect mock LinkedIn API"}
                        </button>
                      </div>
                    </div>

                    {/* Quick navigation card controls */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-sm">
                      <div className="space-y-1.5">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <Zap className="h-4.5 w-4.5 text-amber-500 fill-amber-50" />
                          <span>Quickstart Action List</span>
                        </h4>
                        <p className="text-xs text-slate-500">Fast tracking targets</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button 
                          onClick={() => setActiveTab('resumes')}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-205 dark:bg-slate-800 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                        >
                          Upload Resume v1.0
                        </button>
                        
                        <button 
                          onClick={() => setActiveTab('search')}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-205 dark:bg-slate-800 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                        >
                          Run Target Matches
                        </button>

                        <button 
                          onClick={() => setActiveTab('coach')}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-205 dark:bg-slate-800 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                        >
                          Rehearse Mock Interview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Saved tracker list */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-left space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">Active Queue Item Tracking</h3>
                    
                    {applications.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-6 text-center">No active applicants queued yet. Please navigate to &quot;Match & Search&quot; to build matches.</p>
                    ) : (
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {applications.map((app) => (
                          <div key={app.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white leading-normal">{app.jobTitle}</p>
                              <p className="text-[10px] text-purple-700 font-bold">{app.company} • <span className="font-light text-slate-405">{app.location}</span></p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-[10.5px] px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 font-mono font-bold rounded-lg uppercase">
                                {app.status}
                              </span>
                              <button 
                                onClick={() => setActiveTab('tracking')}
                                className="text-purple-600 hover:underline cursor-pointer"
                              >
                                View Pipeline details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'resumes' && (
                <div className="animate-fade-in">
                  <ResumeManager 
                    resumes={resumes}
                    onParseResume={handleParseResumeText}
                    onDeleteResume={handleDeleteResume}
                    activeResumeId={activeResumeId}
                    setActiveResumeId={setActiveResumeId}
                    onUpdateResume={handleUpdateResume}
                  />
                </div>
              )}

              {activeTab === 'skills-match' && (
                <div className="animate-fade-in">
                  <SkillsMatchAgentPage 
                    resumes={resumes}
                    jobs={jobs}
                    onParseResumeText={handleParseResumeText}
                    activeResumeId={activeResumeId}
                    setActiveResumeId={setActiveResumeId}
                    onSaveApplication={handleSaveMatchToApplications}
                    applications={applications}
                    onUpdateStatus={handleUpdateAppStatus}
                  />
                </div>
              )}

              {activeTab === 'search' && (
                <div className="animate-fade-in">
                  <JobSearchBoard 
                    jobs={jobs}
                    resumes={resumes}
                    activeResumeId={activeResumeId}
                    onTriggerCrew={handleTriggerCrewAI}
                    applications={applications}
                  />
                </div>
              )}

              {activeTab === 'applications' && (
                <div className="animate-fade-in">
                  <ApplicationCenter 
                    applications={applications}
                    onUpdateStatus={handleUpdateAppStatus}
                    onTweakDraft={handleTweakDraft}
                  />
                </div>
              )}

              {activeTab === 'tracking' && (
                <div className="animate-fade-in">
                  <KanbanBoard 
                    applications={applications}
                    onUpdateStatus={async (id, status, deadline) => {
                      await handleUpdateAppStatus(id, status, undefined, undefined, deadline);
                    }}
                  />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="animate-fade-in">
                  <AnalyticsCharts 
                    applications={applications}
                  />
                </div>
              )}

              {activeTab === 'coach' && (
                <div className="animate-fade-in">
                  <AIChatCoach 
                    resumes={resumes}
                    jobs={jobs}
                    activeResumeId={activeResumeId}
                    onSendMessage={handleChatCoach}
                  />
                </div>
              )}
            </div>

            {/* Global Bottom Credit lines info */}
            <footer className="py-6 border-t border-slate-205 dark:border-slate-850 px-8 text-center text-[11px] text-slate-400 font-mono">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>CareerPilot AI Autonomous SaaS Dashboard</span>
                <span>Ready with 10 CrewAI Agents • Powered by Google Gemini-3.5-flash model</span>
              </div>
            </footer>
          </main>
        </div>
      )}
    </div>
  );
}
