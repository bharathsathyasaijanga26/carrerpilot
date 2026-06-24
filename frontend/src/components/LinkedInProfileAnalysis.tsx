import React, { useState, useEffect } from "react";
import { 
  Linkedin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Briefcase, 
  BookOpen, 
  Award, 
  Cpu, 
  UserCheck, 
  FileText,
  HelpCircle,
  GitCompare,
  TrendingUp,
  Percent,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { Resume, LinkedInProfile, ProfileMergeReport } from "../types";

interface LinkedInProfileAnalysisProps {
  resumes: Resume[];
  activeResumeId: string;
}

export default function LinkedInProfileAnalysis({ resumes, activeResumeId }: LinkedInProfileAnalysisProps) {
  const [profileUrl, setProfileUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentStep, setAgentStep] = useState<"idle" | "parsing" | "sourcing" | "skills" | "indexing">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState<LinkedInProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Merge states
  const [mergeReport, setMergeReport] = useState<ProfileMergeReport | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  
  // Tab within the LinkedIn profile preview
  const [subTab, setSubTab] = useState<"overview" | "skills" | "experience" | "education" | "certifications">("overview");

  useEffect(() => {
    // Check if session is already active
    fetch("/api/linkedin/session")
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setIsConnected(true);
          setLinkedinProfile(data.profile);
          setAnalytics(data.analytics);
          setProfileUrl(data.profile.profileUrl);
        }
      });
  }, []);

  const handleConnectLinkedIn = () => {
    setIsAnalyzing(true);
    setErrorMsg("");
    setAgentStep("parsing");
    
    // Open OAuth Login Popup
    const width = 600;
    const height = 650;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    
    const popup = window.open(
      `/api/linkedin/oauth/login?redirect_origin=${encodeURIComponent(window.location.origin)}&timestamp=${Date.now()}`,
      "linkedin_oauth",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );
    
    // Listen to success message from popup
    const messageListener = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "LINKEDIN_OAUTH_SUCCESS") {
        window.removeEventListener("message", messageListener);
        setAgentStep("sourcing");
        await new Promise(r => setTimeout(r, 800));
        setAgentStep("skills");
        await new Promise(r => setTimeout(r, 800));
        setAgentStep("indexing");
        await new Promise(r => setTimeout(r, 600));
        
        // Fetch session data
        const res = await fetch("/api/linkedin/session");
        const data = await res.json();
        if (data.connected) {
          setIsConnected(true);
          setLinkedinProfile(data.profile);
          setAnalytics(data.analytics);
          setProfileUrl(data.profile.profileUrl);
        } else {
          setErrorMsg("Failed to synchronize session details.");
        }
        setIsAnalyzing(false);
        setAgentStep("idle");
      }
    };
    
    window.addEventListener("message", messageListener);
    
    // Popup closed watcher fallback
    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        setIsAnalyzing(false);
        setAgentStep("idle");
      }
    }, 1000);
  };

  const activeResume = resumes.find(r => r.id === activeResumeId) || resumes[0];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUrl.trim()) return;

    setIsAnalyzing(true);
    setErrorMsg("");
    setLinkedinProfile(null);
    setMergeReport(null);

    // Simulated agent stages
    setAgentStep("parsing");
    
    try {
      // Step 1: Parsing
      await new Promise(resolve => setTimeout(resolve, 800));
      setAgentStep("sourcing");
      
      // Step 2: Sourcing
      await new Promise(resolve => setTimeout(resolve, 800));
      setAgentStep("skills");

      // Step 3: Skills
      await new Promise(resolve => setTimeout(resolve, 700));
      setAgentStep("indexing");

      const response = await fetch("/api/linkedin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url: profileUrl })
      });

      if (!response.ok) {
        throw new Error("API responded with an error");
      }

      const result = await response.json();
      if (result.success) {
        setLinkedinProfile({
          id: result.profile_id,
          profileUrl,
          fullName: result.parsed_profile.full_name,
          headline: result.parsed_profile.headline,
          about: result.parsed_profile.about,
          languages: result.parsed_profile.languages,
          projects: result.parsed_profile.projects,
          awards: result.parsed_profile.awards,
          volunteerExperience: result.parsed_profile.volunteer_experience,
          recommendations: result.parsed_profile.recommendations,
          endorsements: result.parsed_profile.endorsements,
          skills: result.skills,
          experience: result.experience,
          education: result.education,
          certifications: result.certifications,
          created_at: new Date().toISOString()
        });
      } else {
        setErrorMsg("Unable to analyze profile");
      }
    } catch (e: any) {
      setErrorMsg("Unable to analyze profile");
    } finally {
      setIsAnalyzing(false);
      setAgentStep("idle");
    }
  };

  const handleMergeProfiles = async () => {
    if (!linkedinProfile || !activeResume) return;

    setIsMerging(true);
    try {
      const response = await fetch("/api/linkedin/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: activeResume.id,
          linkedinProfileId: linkedinProfile.id
        })
      });
      const result = await response.json();
      if (result.success) {
        setMergeReport(result);
      } else {
        setErrorMsg(result.error || "Profile merging agent failed.");
      }
    } catch (e: any) {
      setErrorMsg("Merge failed: " + e.message);
    } finally {
      setIsMerging(false);
    }
  };

  const getProgressPercentage = (step: typeof agentStep) => {
    switch (step) {
      case "parsing": return 25;
      case "sourcing": return 50;
      case "skills": return 75;
      case "indexing": return 95;
      default: return 0;
    }
  };

  const getProgressLabel = (step: typeof agentStep) => {
    switch (step) {
      case "parsing": return "Ingesting LinkedIn profile URL & verifying endpoint access...";
      case "sourcing": return "Running CrewAI LinkedIn Intelligence Sourcing Agent...";
      case "skills": return "Extracting skill taxonomy & mapping professional timeline...";
      case "indexing": return "Resolving unified profiles & storing PostgreSQL records...";
      default: return "Ready";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-[#00205B] tracking-tight flex items-center gap-2">
            <Linkedin className="h-8 w-8 text-blue-600 fill-blue-50" />
            <span>LinkedIn Profile Intelligence</span>
          </h1>
          <p className="text-sm text-slate-500 font-light mt-1">
            Analyze professional LinkedIn profiles to extract data pipelines or merge with resumes to form a unified candidate index.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: URL Submission & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#00205B] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500 fill-amber-50" />
                <span>Connect LinkedIn Profile</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your account via secure OAuth to retrieve your professional profile and build your unified candidate index.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleConnectLinkedIn}
                disabled={isAnalyzing}
                className="w-full py-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-extrabold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synchronizing Profile...</span>
                  </>
                ) : (
                  <>
                    <Linkedin className="h-4 w-4 fill-white text-white" />
                    <span>Connect LinkedIn Account</span>
                  </>
                )}
              </button>
            </div>

            {isConnected && analytics && (
              <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-155">
                  <span className="font-extrabold text-[#00205B]">LinkedIn Session Analytics</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[9px] border border-emerald-200">
                    CONNECTED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Completeness</p>
                    <p className="text-sm font-black text-[#00205B] mt-0.5">{analytics.profileCompleteness}%</p>
                  </div>
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Skills Extracted</p>
                    <p className="text-sm font-black text-[#00205B] mt-0.5">{analytics.skillsExtracted}</p>
                  </div>
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Match Score</p>
                    <p className="text-sm font-black text-amber-500 mt-0.5">{analytics.jobMatchPercentage}%</p>
                  </div>
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Recruiter Resp.</p>
                    <p className="text-sm font-black text-blue-600 mt-0.5">{analytics.recruiterResponseRate}%</p>
                  </div>
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl col-span-2 flex justify-around items-center">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">Interview Invitation</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{analytics.interviewInvitationRate}%</p>
                    </div>
                    <div className="border-r border-slate-200 h-6"></div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">Offer Conversion</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{analytics.offerConversionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start gap-2.5 text-xs">
                <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-light">{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Real-Time Processing Status */}
          {isAnalyzing && (
            <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 border border-white/5 space-y-4 shadow-xl font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-amber-400 font-bold">AGENT TELEMETRY LOG</span>
                <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded-full text-purple-300 font-bold border border-purple-800">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Task Pipeline progress</span>
                  <span>{getProgressPercentage(agentStep)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-[#FFB800] h-full rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(agentStep)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-300 italic">{getProgressLabel(agentStep)}</p>
              </div>

              <div className="space-y-2 pt-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className={agentStep !== "parsing" ? "text-emerald-400" : "text-amber-400"}>●</span>
                  <span>[Task 1] Parsing HTML profile DOM context</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={agentStep === "sourcing" || agentStep === "skills" || agentStep === "indexing" ? "text-emerald-400" : "text-slate-600"}>●</span>
                  <span>[Task 2] Sourcing raw text timelines</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={agentStep === "skills" || agentStep === "indexing" ? "text-emerald-400" : "text-slate-600"}>●</span>
                  <span>[Task 3] Processing Skill Taxonomy classification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={agentStep === "indexing" ? "text-emerald-400" : "text-slate-600"}>●</span>
                  <span>[Task 4] Compiling final candidate JSON outputs</span>
                </div>
              </div>
            </div>
          )}

          {/* Merge Profile Panel if both are present */}
          {linkedinProfile && activeResume && (
            <div className="bg-[#00205B] text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-purple-300 tracking-wider font-extrabold uppercase block">
                  Profile Merging Hub
                </span>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-[#FFB800]" />
                  <span>Resume VS LinkedIn Merge</span>
                </h4>
                <p className="text-xs text-blue-100 font-light leading-relaxed">
                  Both resume and LinkedIn datasets are loaded. Launch the Profile Merge Agent to compile a single, unified workspace profile.
                </p>
              </div>

              <button
                onClick={handleMergeProfiles}
                disabled={isMerging}
                className="w-full py-3 bg-[#FFB800] hover:bg-[#E29B00] text-[#00205B] font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Resolving Datasets...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4.5 w-4.5" />
                    <span>Generate Unified Candidate Profile</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Information Preview & Results */}
        <div className="lg:col-span-2 space-y-6">
          {!linkedinProfile ? (
            <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 border border-slate-100 rounded-2.5xl flex items-center justify-center">
                <Linkedin className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-slate-800">No profile analyzed yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provide a LinkedIn URL on the left panel to launch the autonomous parsing crew and view results here.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{linkedinProfile.fullName}</h2>
                    <span className="text-[9px] bg-blue-100 border border-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full font-mono">
                      LINKEDIN SOURCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{linkedinProfile.headline}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Profile URL: {linkedinProfile.profileUrl}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg select-none">
                  {linkedinProfile.fullName.slice(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex border-b border-slate-100 text-xs font-bold text-slate-400 overflow-x-auto gap-2">
                {[
                  { id: "overview", label: "Overview", icon: UserCheck },
                  { id: "skills", label: "Skills Taxonomy", icon: Cpu },
                  { id: "experience", label: "Work History", icon: Briefcase },
                  { id: "education", label: "Academic", icon: BookOpen },
                  { id: "certifications", label: "Certifications", icon: Award }
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSubTab(t.id as any)}
                      className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        subTab === t.id 
                          ? "border-[#00205B] text-[#00205B] font-black" 
                          : "border-transparent hover:text-slate-650"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="min-h-[200px]">
                {subTab === "overview" && (
                  <div className="space-y-6 animate-fade-in text-xs">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800">About Section / Professional Summary</h4>
                      <p className="text-slate-600 leading-relaxed font-light bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {linkedinProfile.about}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-800">Languages</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {linkedinProfile.languages?.map((lang, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-slate-600">
                              {lang}
                            </span>
                          )) || <span className="text-slate-400 italic font-light">None extracted</span>}
                        </div>
                      </div>

                      <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-800">Projects</h4>
                        <div className="space-y-2">
                          {linkedinProfile.projects?.map((proj, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl space-y-1">
                              <p className="font-bold text-slate-800">{proj.name}</p>
                              <p className="text-slate-500 leading-relaxed font-light">{proj.description}</p>
                            </div>
                          )) || <span className="text-slate-400 italic font-light">None extracted</span>}
                        </div>
                      </div>
                    </div>

                    {linkedinProfile.recommendations && linkedinProfile.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-800">Recommendations Summary</h4>
                        <div className="space-y-2">
                          {linkedinProfile.recommendations.map((rec, idx) => (
                            <div key={idx} className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-slate-650 italic font-light leading-relaxed">
                              &ldquo;{rec}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {subTab === "skills" && (
                  <div className="space-y-4 animate-fade-in text-xs">
                    <h4 className="font-bold text-slate-800">Extracted Skills Matrix</h4>
                    <div className="flex flex-wrap gap-2">
                      {linkedinProfile.skills?.map((skill, idx) => (
                        <span key={idx} className="px-3.5 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 font-mono font-bold rounded-xl">
                          {skill}
                        </span>
                      )) || <p className="text-slate-400 italic">No skills extracted.</p>}
                    </div>
                  </div>
                )}

                {subTab === "experience" && (
                  <div className="space-y-4 animate-fade-in text-xs">
                    <h4 className="font-bold text-slate-800">Work History Timeline</h4>
                    <div className="relative border-l border-slate-150 pl-6 ml-3 space-y-6">
                      {linkedinProfile.experience?.map((exp, idx) => (
                        <div key={idx} className="relative space-y-1.5">
                          {/* Dot marker */}
                          <div className="absolute -left-[30px] top-1 w-4 h-4 bg-[#00205B] border-4 border-white rounded-full"></div>
                          
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-normal">{exp.role}</p>
                              <p className="text-xs text-purple-700 font-bold mt-0.5">{exp.company}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-medium">{exp.period}</span>
                          </div>
                          <p className="text-slate-650 leading-relaxed font-light text-xs pt-1">{exp.description}</p>
                        </div>
                      )) || <p className="text-slate-400 italic">No experience history.</p>}
                    </div>
                  </div>
                )}

                {subTab === "education" && (
                  <div className="space-y-4 animate-fade-in text-xs">
                    <h4 className="font-bold text-slate-800">Academic Records</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {linkedinProfile.education?.map((edu, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                          <p className="font-bold text-slate-850 text-sm leading-snug">{edu.institution}</p>
                          <p className="text-slate-650 leading-relaxed font-light">{edu.degree}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Graduation Year: {edu.year}</p>
                        </div>
                      )) || <p className="text-slate-400 italic">No academic logs.</p>}
                    </div>
                  </div>
                )}

                {subTab === "certifications" && (
                  <div className="space-y-4 animate-fade-in text-xs">
                    <h4 className="font-bold text-slate-800">Professional Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {linkedinProfile.certifications?.map((cert, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                          <Award className="h-5 w-5 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-750">{cert.name}</span>
                        </div>
                      )) || <p className="text-slate-400 italic">No certifications found.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Merge Report Preview */}
          {mergeReport && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs text-left animate-fade-in">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-[#00205B] flex items-center gap-2">
                    <GitCompare className="h-5 w-5 text-purple-600" />
                    <span>Unified Profile Generated</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-light mt-0.5">
                    Profile Merge Agent completed consolidated candidate record successfully.
                  </p>
                </div>
                
                <div className="bg-[#00205B] text-white p-3 rounded-2xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-[8px] font-mono font-bold text-blue-200 uppercase tracking-widest leading-none">
                    Confidence
                  </span>
                  <span className="text-xl font-black mt-1 leading-none text-amber-400">
                    {Math.round(mergeReport.confidenceScore * 100)}%
                  </span>
                </div>
              </div>

              {/* Summary of unification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unified profile overview */}
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900">Unified Metadata</h4>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {mergeReport.unifiedProfile.fullName}</p>
                    <p><strong>Summary:</strong> <span className="font-light text-slate-600">{mergeReport.unifiedProfile.summary}</span></p>
                    <p><strong>Skills Count:</strong> {mergeReport.unifiedProfile.skills.length}</p>
                    <p><strong>Certifications:</strong> {mergeReport.unifiedProfile.certifications.length}</p>
                  </div>
                </div>

                {/* Mismatches and gaps report */}
                <div className="space-y-4 bg-amber-50/30 border border-amber-100 p-5 rounded-2xl">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                    <span>Missing Information Report</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">Missing from Resume</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-650 font-light mt-1 pl-1">
                        {mergeReport.missingInformationReport.missing_from_resume.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">Missing from LinkedIn</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-650 font-light mt-1 pl-1">
                        {mergeReport.missingInformationReport.missing_from_linkedin.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
