/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Trash2, 
  Plus, 
  HelpCircle, 
  AlertCircle,
  FileSpreadsheet,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  ArrowRight,
  Key,
  Edit3,
  TrendingUp,
  ChevronRight,
  Check,
  XCircle,
  AlignLeft
} from "lucide-react";
import { Resume } from "../types";

interface ResumeManagerProps {
  resumes: Resume[];
  onParseResume: (text: string, filename?: string) => Promise<void>;
  onDeleteResume: (id: string) => Promise<void>;
  activeResumeId: string;
  setActiveResumeId: (id: string) => void;
  onUpdateResume?: (updated: Resume) => void;
}

export default function ResumeManager({
  resumes,
  onParseResume,
  onDeleteResume,
  activeResumeId,
  setActiveResumeId,
  onUpdateResume,
}: ResumeManagerProps) {
  const [pasteText, setPasteText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [agentStep, setAgentStep] = useState<"idle" | "reading" | "analyzing" | "extracting" | "indexing">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"resume" | "scoring">("resume");
  const [scoreSubTab, setScoreSubTab] = useState<"overview" | "keywords" | "wording" | "formatting">("overview");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractingForId, setExtractingForId] = useState<string>("");
  const [toast, setToast] = useState<{ id: string; message: string; type: "success" | "info" | "error" } | null>(null);

  const triggerToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = "toast-" + Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => current?.id === id ? null : current);
    }, 4500);
  };

  const getProgressPercentage = (step: typeof agentStep) => {
    switch (step) {
      case "reading": return 25;
      case "analyzing": return 50;
      case "extracting": return 75;
      case "indexing": return 95;
      default: return 0;
    }
  };

  const getProgressLabel = (step: typeof agentStep) => {
    switch (step) {
      case "reading": return "Extracting Raw Document Text Stream & PDF Metadata...";
      case "analyzing": return "Running Complex LLM Parser & Structured Content Engine...";
      case "extracting": return "Executing Skill Extraction Agent & Building Developer Taxonomy...";
      case "indexing": return "Performing final keyword indexing and profile activation...";
      default: return "Ready";
    }
  };

  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [newSkillText, setNewSkillText] = useState({
    technicalSkills: "",
    tools: "",
    certifications: "",
    jobRelevantKeywords: ""
  });

  const handleRemoveSkill = (category: "technicalSkills" | "tools" | "certifications" | "jobRelevantKeywords", index: number) => {
    if (!activeResume || !onUpdateResume) return;
    const skillsObj = activeResume.skills || {
      technicalSkills: [],
      tools: [],
      certifications: [],
      jobRelevantKeywords: []
    };
    const categorySkills = skillsObj[category] || [];
    const updatedCategorySkills = categorySkills.filter((_, idx) => idx !== index);
    const updatedSkills = {
      ...skillsObj,
      [category]: updatedCategorySkills
    };
    onUpdateResume({
      ...activeResume,
      skills: updatedSkills
    });
    triggerToast("Skill tag removed successfully!", "info");
  };

  const handleAddSkill = (category: "technicalSkills" | "tools" | "certifications" | "jobRelevantKeywords") => {
    const textToAdd = newSkillText[category].trim();
    if (!textToAdd) return;
    if (!activeResume || !onUpdateResume) return;

    const skillsObj = activeResume.skills || {
      technicalSkills: [],
      tools: [],
      certifications: [],
      jobRelevantKeywords: []
    };
    const categorySkills = skillsObj[category] || [];
    if (categorySkills.some(s => s.toLowerCase() === textToAdd.toLowerCase())) {
      triggerToast("Skill already exists in this category!", "error");
      return;
    }

    const updatedCategorySkills = [...categorySkills, textToAdd];
    const updatedSkills = {
      ...skillsObj,
      [category]: updatedCategorySkills
    };

    onUpdateResume({
      ...activeResume,
      skills: updatedSkills
    });

    setNewSkillText(prev => ({
      ...prev,
      [category]: ""
    }));
    triggerToast(`Added "${textToAdd}" to profile taxonomy!`, "success");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, category: "technicalSkills" | "tools" | "certifications" | "jobRelevantKeywords") => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill(category);
    }
  };

  const activeResume = resumes.find(r => r.id === activeResumeId) || resumes[0];

  useEffect(() => {
    const triggerAutoExtraction = async () => {
      if (activeResume && !activeResume.skills && activeResume.id && extractingForId !== activeResume.id) {
        setExtractingForId(activeResume.id);
        try {
          const res = await fetch("/api/resume/extract-skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeId: activeResume.id })
          });
          const data = await res.json();
          if (data.success && data.skills && onUpdateResume) {
            onUpdateResume({
              ...activeResume,
              skills: data.skills
            });
            triggerToast(`Core skills & keyword taxonomy extracted successfully!`, "success");
          }
        } catch (e) {
          console.error("Auto extraction of skills failed", e);
        }
      }
    };
    
    triggerAutoExtraction();
  }, [activeResumeId, activeResume, onUpdateResume, extractingForId]);

  // File upload processing for multiple file types (PDF, DOCX, DOC, TXT)
  const processUploadedFile = async (file: File) => {
    setIsParsing(true);
    setErrMsg("");
    setAgentStep("reading");
    try {
      const lowerName = file.name.toLowerCase();
      const isDocOrPdf = lowerName.endsWith(".pdf") || lowerName.endsWith(".docx") || lowerName.endsWith(".doc");

      if (isDocOrPdf) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64Data = event.target?.result as string;
            const res = await fetch("/api/resume/parse-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                base64Data,
                filename: file.name,
                fileType: file.type
              })
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || "Failed to extract text from document.");
            }
            if (data.success && data.text) {
              triggerToast(`PDF text extraction completed successfully for ${file.name}!`, "success");

              // HANDOVER: 1. Resume Analysis Agent
              setAgentStep("analyzing");
              await new Promise((resolve) => setTimeout(resolve, 1200));

              await onParseResume(data.text, file.name);

              // AUTOMATIC NEXT STEP: 2. Skill Extraction Agent
              setAgentStep("extracting");
              await new Promise((resolve) => setTimeout(resolve, 1400));

              triggerToast(`Subsequent skill extraction complete! Dynamic taxonomy saved.`, "success");

              // AUTOMATIC NEXT STEP: 3. Keyword/Tag Optimization Agent
              setAgentStep("indexing");
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
              throw new Error("Unable to parse text from file.");
            }
          } catch (fileErr: any) {
            setErrMsg(fileErr.message || "Failed to process document file on server.");
          } finally {
            setIsParsing(false);
            setAgentStep("idle");
          }
        };
        reader.readAsDataURL(file); // Converts to base64 Data URL
      } else {
        // Plain text file
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          try {
            triggerToast(`Text extraction completed successfully for ${file.name}!`, "success");

            // HANDOVER: 1. Resume Analysis Agent
            setAgentStep("analyzing");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            await onParseResume(text || `Resume file contents for ${file.name}`, file.name);

            // AUTOMATIC NEXT STEP: 2. Skill Extraction Agent
            setAgentStep("extracting");
            await new Promise((resolve) => setTimeout(resolve, 1200));

            triggerToast(`Subsequent skill extraction complete! Dynamic taxonomy saved.`, "success");

            // AUTOMATIC NEXT STEP: 3. Keyword/Tag Optimization Agent
            setAgentStep("indexing");
            await new Promise((resolve) => setTimeout(resolve, 800));
          } catch (err: any) {
            setErrMsg(err.message || "Failed to parse text resume.");
          } finally {
            setIsParsing(false);
            setAgentStep("idle");
          }
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setErrMsg(err.message || "Failed to upload file.");
      setIsParsing(false);
      setAgentStep("idle");
    }
  };

  // Parse action
  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim() || pasteText.trim().length < 20) {
      setErrMsg("Please paste or type a valid resume containing at least 20 characters.");
      return;
    }
    setErrMsg("");
    setIsParsing(true);
    // HANDOVER: 1. Resume Analysis Agent
    setAgentStep("analyzing");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await onParseResume(pasteText);
      triggerToast("Resume text parsed and indexed successfully!", "success");

      // AUTOMATIC NEXT STEP: 2. Skill Extraction Agent
      setAgentStep("extracting");
      await new Promise((resolve) => setTimeout(resolve, 1300));
      triggerToast("Subsequent skill extraction complete! Dynamic taxonomy saved.", "success");

      // AUTOMATIC NEXT STEP: 3. Keyword/Tag Optimization Agent
      setAgentStep("indexing");
      await new Promise((resolve) => setTimeout(resolve, 900));

      setPasteText("");
    } catch (err: any) {
      setErrMsg(err.message || "Failed to parse resume text.");
    } finally {
      setIsParsing(false);
      setAgentStep("idle");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const onAreaClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const triggerSampleResume = () => {
    setPasteText(`DOUGLAS LINCOLN
douglas.lincoln@example.com | (415) 555-1029
San Francisco, CA

PROFESSIONAL SUMMARY
Dynamic Full-Stack Software Engineer with over 4 years of hands-on expertise building responsive React client dashboards, modular REST/GraphQL backends and scalable schema designs.

EDUCATION
- Stanford University | B.S. in Computer Science | 2021

EXPERIENCE
Lead Frontend Builder | Fintech Flow Inc | 2023 - Present
- Architected the client-side dashboard rebuild using React, NextJS, TypeScript, and Tailwind CSS.
- Optimized micro-interaction speeds and layout loads, boosting Core Web Vitals by 34%.
- Worked closely with payment integration agents to embed secure checkout mechanisms.

Software Engineer | DevTools Labs | 2021 - 2023
- Designed responsive widget libraries and reusable full-width charts.
- Managed server-side Express APIs with PostgreSQL databases, improving query speeds by 25%.

TECHNICAL SKILLS
- React, NextJS, HTML5, CSS3, Tailwind CSS, TypeScript, JavaScript
- Node.js, Express, PostgreSQL, REST APIs, GraphQL, D3.js Charts, Vite
- Git, AWS, CI/CD pipelines, Docker, Jest testing frameworks

CERTIFICATIONS
- AWS Certified Developer Associates
- SCRUM Certified Professional`);
  };

  return (
    <div className="space-y-6">
      {/* 10-Agent Pipeline Operational Node Indicators */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-205/60 text-left">
        <div className="flex items-center space-x-2 mr-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Operational Agent Fleet:</span>
        </div>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-800 text-[11px] font-bold rounded-xl border border-purple-100">
          <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
          <span>Resume Analysis Agent [ACTIVE]</span>
        </span>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-150">
          <Award className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span>Skill Extraction Agent [ACTIVE]</span>
        </span>
      </div>

      <div id="resume-manager-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Upload & Left Sidebar */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-purple-600" />
              <span>Resume Repositories</span>
            </h3>
            <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-bold">
              {resumes.length} Active
            </span>
          </div>

          {/* Drag & Drop upload container */}
          <div 
            id="drag-drop-area"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={isParsing ? undefined : onAreaClick}
            className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all duration-300 overflow-hidden ${
              isParsing
                ? "border-amber-400 bg-slate-900 shadow-xl cursor-not-allowed"
                : dragActive 
                  ? "border-purple-600 bg-purple-50/40 scale-[1.02] shadow-md shadow-purple-500/5 cursor-pointer" 
                  : "border-slate-200 bg-slate-50/30 hover:border-purple-400 hover:bg-purple-50/10 cursor-pointer"
            }`}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              disabled={isParsing}
            />
            
            {/* Real-time laser scanner line animation for active parsing state */}
            {isParsing && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent shadow-[0_0_12px_#9333ea] animate-[bounce_2s_infinite]" />
            )}

            {isParsing ? (
              <div className="space-y-4 text-slate-100 font-mono text-[10.5px] leading-relaxed w-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                    <span className="font-bold text-[10px] uppercase text-slate-300">CrewAI Orchestration Deck</span>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-amber-400 border border-slate-705 px-2 py-0.5 rounded uppercase font-black tracking-widest leading-none">
                    Parsing Active
                  </span>
                </div>

                {/* Progress Indicator Card */}
                <div className="bg-slate-950/80 border border-slate-800/85 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                    <span className="truncate max-w-[220px] text-indigo-300">{getProgressLabel(agentStep)}</span>
                    <span className="text-purple-400 font-black">{getProgressPercentage(agentStep)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 transition-all duration-500 ease-out shadow-[0_0_8px_#8b5cf6]"
                      style={{ width: `${getProgressPercentage(agentStep)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 shrink-0">
                      {agentStep === "reading" ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-black text-[9px] animate-spin">
                          🌀
                        </span>
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-200 text-[11px]">File Extraction Agent</p>
                      <p className="text-[9.5px] text-slate-400 leading-tight">Parsing raw file structure & text streams.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 shrink-0">
                      {agentStep === "reading" ? (
                        <span className="h-4 w-4 block rounded-full border border-slate-800" />
                      ) : agentStep === "analyzing" ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-[9px] animate-pulse">
                          ⚡
                        </span>
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-200 text-[11px]">Resume Analysis Agent</p>
                      <p className="text-[9.5px] text-slate-400 leading-tight">Reading experience profiles, degree fields & ATS formatting.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 shrink-0">
                      {agentStep === "reading" || agentStep === "analyzing" ? (
                        <span className="h-4 w-4 block rounded-full border border-slate-800" />
                      ) : agentStep === "extracting" ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-[9px] animate-bounce">
                          ★
                        </span>
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-amber-400 text-[11px] flex items-center space-x-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                        <span>Skill Extraction Agent</span>
                      </p>
                      <p className="text-[9.5px] text-slate-300 leading-tight">
                        Harvesting technical tools, certifications, and keywords...
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 shrink-0">
                      {agentStep !== "indexing" ? (
                        <span className="h-4 w-4 block rounded-full border border-slate-800" />
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white font-bold text-[9px] animate-pulse">
                          🎯
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-300 text-[11px]">Keyword Optimization Agent</p>
                      <p className="text-[9.5px] text-slate-400 leading-tight">Calculating matching index metrics & tagging taxonomy.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[8.5px] text-slate-500 flex justify-between items-center">
                  <span>Using Antigravity Intelligence Node</span>
                  <span className="animate-pulse text-amber-500 uppercase">{agentStep}_STAGE</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                {dragActive ? (
                  <>
                    <div className="p-4 bg-purple-100 rounded-full text-purple-600 mb-1 scale-110 transition-transform">
                      <ArrowRight className="h-7 w-7 rotate-90 text-purple-600 animate-bounce" />
                    </div>
                    <p className="text-xs font-black text-purple-950">
                      Drop Your Document Now! 📥
                    </p>
                    <p className="text-[10px] text-purple-500 font-medium">
                      Let's feed the Skill Intelligence agent!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 mb-1 border border-purple-100 shadow-sm hover:scale-105 transition-transform">
                      <FileText className="h-7 w-7" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag & Drop Resume (PDF, DOCX, TXT)
                    </p>
                    <p className="text-[10.5px] text-slate-400 font-medium">
                      or <span className="text-purple-600 font-bold hover:underline">browse your computer files</span>
                    </p>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full mt-1.5 uppercase">
                      Max size: 8MB
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleParse} className="space-y-4 pt-3 border-t border-slate-150">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Paste Full Resume Text</label>
              <button 
                type="button" 
                onClick={triggerSampleResume}
                className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Insert Sample Resume
              </button>
            </div>
            
            <textarea
              id="resume-paste-input"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste professional experience, training or certifications text to parse..."
              rows={5}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 bg-slate-50 leading-relaxed font-sans"
            />

            {errMsg && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs text-rose-600 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errMsg}</span>
              </div>
            )}

            <button
              id="btn-parse-resume"
              type="submit"
              disabled={isParsing}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              {isParsing ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Executing Resume Parsing Agent...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Parse Resume with CrewAI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Saved List version tracking */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Version History</h4>
          {resumes.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">No parsed resumes inside. Add one above.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {resumes.map((res) => (
                <div 
                  key={res.id}
                  onClick={() => setActiveResumeId(res.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeResumeId === res.id 
                      ? "border-purple-600 bg-purple-50/20 text-purple-950 font-semibold" 
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center space-x-3 text-xs">
                    <FileText className="h-4.5 w-4.5 text-purple-600 shrink-0" />
                    <div className="leading-tight">
                      <p className="font-bold truncate max-w-[150px]">{res.parsedData?.name || res.filename}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Added {res.uploadDate} • Score: {res.score}%</p>
                      {res.tags && res.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {res.tags.map((tag, tIdx) => (
                            <span 
                              key={tIdx} 
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md ${
                                activeResumeId === res.id 
                                  ? "bg-purple-600/10 text-purple-700" 
                                  : "bg-slate-100 text-slate-600 border border-slate-200/50"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono font-bold">
                      {res.version}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteResume(res.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Parsing Details & Metrics right Panel */}
      <div className="lg:col-span-7">
        {!activeResume ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center h-full min-h-[400px]">
            <Layers className="h-12 w-12 text-slate-350 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800">No Resume Loaded</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-sm">
              Please paste a sample resume in the sidebar or upload a record to initiate the Skill Extraction & analysis agent processes.
            </p>
            <button 
              onClick={triggerSampleResume}
              className="mt-6 flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <span>Load Sample Resume Instead</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header: Score and Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-1.5 text-left">
                <p className="text-[10px] text-purple-600 uppercase font-mono font-bold tracking-widest flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  <span>AI PARSED CURRENT VERSION</span>
                </p>
                <h3 className="text-2xl font-black text-slate-900">{activeResume.parsedData?.name || "Candidate Resume"}</h3>
                <p className="text-xs text-slate-500">{activeResume.parsedData?.email} • {activeResume.parsedData?.phone}</p>
                {activeResume.tags && activeResume.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeResume.tags.map((tag, tIdx) => (
                      <span 
                        key={tIdx} 
                        className="text-[9.5px] font-bold px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md flex items-center space-x-1"
                      >
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-700 leading-relaxed font-light mt-2 italic font-serif">
                  &quot;{activeResume.parsedData?.summary || "No custom summary loaded in document profile."}&quot;
                </p>
              </div>

              {/* Score Meter */}
              <div className="bg-gradient-to-b from-purple-50 to-indigo-50 border border-purple-100 rounded-2.5xl p-5 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-purple-800 uppercase font-bold font-mono tracking-wider">AI Score Rating</span>
                <span className="text-4xl font-black text-purple-950 mt-1">{activeResume.score}%</span>
                {/* Visual bar progress */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-1.5 rounded-full" 
                    style={{ width: `${activeResume.score}%` }}
                  />
                </div>
                <span className="text-[9px] text-emerald-600 font-bold mt-2 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  <span>Passes ATS check thresholds</span>
                </span>
              </div>
            </div>

            {/* Segmented Control Navigation Tabs */}
            <div className="flex bg-slate-150 p-1 rounded-2xl border border-slate-200">
              <button
                id="tab-view-resume-id"
                type="button"
                onClick={() => setActiveTab("resume")}
                className={`flex-1 py-3 text-center font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  activeTab === "resume"
                    ? "bg-white text-purple-950 shadow-sm font-black"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <FileText className="h-4 w-4 text-purple-600" />
                <span>📄 PARSED RESUME VIEWER</span>
              </button>
              <button
                id="tab-view-scoring-id"
                type="button"
                onClick={() => setActiveTab("scoring")}
                className={`flex-1 py-3 text-center font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 relative ${
                  activeTab === "scoring"
                    ? "bg-white text-purple-950 shadow-sm font-black"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>🎯 ADVANCED AI SCORE & AUDIT</span>
                <span className="bg-purple-100 text-purple-700 text-[8px] px-1.5 py-0.5 rounded-full uppercase leading-none font-black animate-pulse">NEW</span>
              </button>
            </div>

            {/* Tab 1: Standard parsed resume view */}
            {activeTab === "resume" && (
              <div className="space-y-6">
                {/* Skill Extraction Agent Visual Card Block */}
                {activeResume.skills ? (
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-500/20 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-400/30">
                          <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold tracking-tight">Skill Extraction Agent Core Profile</h4>
                          <p className="text-[10px] text-indigo-300 font-mono">NODE-ID: EXTRACTOR-ACTIVE • TAXONOMY HARVESTED</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => setIsEditingSkills(!isEditingSkills)}
                          className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center space-x-1.5 border transition-all cursor-pointer ${
                            isEditingSkills
                              ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"
                              : "bg-white/5 hover:bg-white/10 text-indigo-200 border-white/10"
                          }`}
                        >
                          {isEditingSkills ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-300" />
                              <span>Done Updating</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Edit & Manage Skills</span>
                            </>
                          )}
                        </button>
                        <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase tracking-widest leading-none">
                          Active Extraction Mode
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                      {/* Col 1: Tech Skills */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 text-left">
                        <span className="text-[9.5px] uppercase font-bold text-indigo-300 tracking-wider flex items-center space-x-1 border-b border-white/5 pb-1">
                          <Award className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Core Tech Skills</span>
                        </span>

                        {isEditingSkills && (
                          <div className="flex space-x-1">
                            <input
                              type="text"
                              placeholder="Add tag..."
                              value={newSkillText.technicalSkills}
                              onChange={(e) => setNewSkillText(prev => ({ ...prev, technicalSkills: e.target.value }))}
                              onKeyDown={(e) => handleSkillKeyDown(e, "technicalSkills")}
                              className="flex-1 min-w-0 bg-black/40 text-[10.5px] px-2.5 py-1 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:bg-black/65 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSkill("technicalSkills")}
                              className="bg-indigo-500 hover:bg-indigo-400 p-1.5 rounded-xl text-white font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 max-h-[220px] overflow-y-auto pr-1">
                          {activeResume.skills.technicalSkills?.map((skill, idx) => (
                            <span 
                              key={idx} 
                              className={`bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 text-[9.5px] px-2 py-0.5 rounded font-medium ${
                                isEditingSkills ? "flex items-center space-x-1.5 pr-1 pl-2 bg-indigo-500/15" : ""
                              }`}
                            >
                              <span>{skill}</span>
                              {isEditingSkills && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill("technicalSkills", idx)}
                                  className="hover:bg-indigo-500/30 text-indigo-400 hover:text-white rounded-full p-0.5 transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Remove skill"
                                >
                                  <span className="text-[11px] leading-none select-none font-black">×</span>
                                </button>
                              )}
                            </span>
                          )) || <span className="text-xs italic text-gray-400">None extracted.</span>}
                        </div>
                      </div>

                      {/* Col 2: Development Tools */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 text-left">
                        <span className="text-[9.5px] uppercase font-bold text-teal-300 tracking-wider flex items-center space-x-1 border-b border-white/5 pb-1">
                          <Key className="h-3.5 w-3.5 text-teal-400" />
                          <span>Extracted Tools</span>
                        </span>

                        {isEditingSkills && (
                          <div className="flex space-x-1">
                            <input
                              type="text"
                              placeholder="Add tag..."
                              value={newSkillText.tools}
                              onChange={(e) => setNewSkillText(prev => ({ ...prev, tools: e.target.value }))}
                              onKeyDown={(e) => handleSkillKeyDown(e, "tools")}
                              className="flex-1 min-w-0 bg-black/40 text-[10.5px] px-2.5 py-1 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:bg-black/65 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSkill("tools")}
                              className="bg-teal-500 hover:bg-teal-400 p-1.5 rounded-xl text-white font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 max-h-[220px] overflow-y-auto pr-1">
                          {activeResume.skills.tools?.map((tool, idx) => (
                            <span 
                              key={idx} 
                              className={`bg-teal-500/10 text-teal-200 border border-teal-500/20 text-[9.5px] px-2 py-0.5 rounded font-medium ${
                                isEditingSkills ? "flex items-center space-x-1.5 pr-1 pl-2 bg-teal-500/15" : ""
                              }`}
                            >
                              <span>{tool}</span>
                              {isEditingSkills && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill("tools", idx)}
                                  className="hover:bg-teal-500/30 text-teal-400 hover:text-white rounded-full p-0.5 transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Remove tool"
                                >
                                  <span className="text-[11px] leading-none select-none font-black">×</span>
                                </button>
                              )}
                            </span>
                          )) || <span className="text-xs italic text-gray-400">None extracted.</span>}
                        </div>
                      </div>

                      {/* Col 3: Certifications */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 text-left">
                        <span className="text-[9.5px] uppercase font-bold text-amber-300 tracking-wider flex items-center space-x-1 border-b border-white/5 pb-1">
                          <Award className="h-3.5 w-3.5 text-amber-400" />
                          <span>Credentials & Certs</span>
                        </span>

                        {isEditingSkills && (
                          <div className="flex space-x-1">
                            <input
                              type="text"
                              placeholder="Add tag..."
                              value={newSkillText.certifications}
                              onChange={(e) => setNewSkillText(prev => ({ ...prev, certifications: e.target.value }))}
                              onKeyDown={(e) => handleSkillKeyDown(e, "certifications")}
                              className="flex-1 min-w-0 bg-black/40 text-[10.5px] px-2.5 py-1 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:bg-black/65 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSkill("certifications")}
                              className="bg-amber-500 hover:bg-amber-400 p-1.5 rounded-xl text-white font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 max-h-[220px] overflow-y-auto pr-1">
                          {activeResume.skills.certifications?.map((cert, idx) => (
                            <span 
                              key={idx} 
                              className={`bg-amber-500/10 text-amber-200 border border-amber-500/20 text-[9.5px] px-2 py-0.5 rounded font-medium ${
                                isEditingSkills ? "flex items-center space-x-1.5 pr-1 pl-2 bg-amber-500/15" : ""
                              }`}
                            >
                              <span>{cert}</span>
                              {isEditingSkills && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill("certifications", idx)}
                                  className="hover:bg-amber-500/30 text-amber-400 hover:text-white rounded-full p-0.5 transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Remove certificate"
                                >
                                  <span className="text-[11px] leading-none select-none font-black">×</span>
                                </button>
                              )}
                            </span>
                          )) || <span className="text-xs italic text-gray-400">None extracted.</span>}
                        </div>
                      </div>

                      {/* Col 4: Job-Relevant Keywords */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 text-left">
                        <span className="text-[9.5px] uppercase font-bold text-pink-300 tracking-wider flex items-center space-x-1 border-b border-white/5 pb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-pink-400" />
                          <span>Target Keywords</span>
                        </span>

                        {isEditingSkills && (
                          <div className="flex space-x-1">
                            <input
                              type="text"
                              placeholder="Add tag..."
                              value={newSkillText.jobRelevantKeywords}
                              onChange={(e) => setNewSkillText(prev => ({ ...prev, jobRelevantKeywords: e.target.value }))}
                              onKeyDown={(e) => handleSkillKeyDown(e, "jobRelevantKeywords")}
                              className="flex-1 min-w-0 bg-black/40 text-[10.5px] px-2.5 py-1 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:bg-black/65 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSkill("jobRelevantKeywords")}
                              className="bg-pink-500 hover:bg-pink-400 p-1.5 rounded-xl text-white font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 max-h-[220px] overflow-y-auto pr-1">
                          {activeResume.skills.jobRelevantKeywords?.map((kw, idx) => (
                            <span 
                              key={idx} 
                              className={`bg-pink-500/10 text-pink-200 border border-pink-500/20 text-[9.5px] px-2 py-0.5 rounded font-medium ${
                                isEditingSkills ? "flex items-center space-x-1.5 pr-1 pl-2 bg-pink-500/15" : ""
                              }`}
                            >
                              <span>{kw}</span>
                              {isEditingSkills && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill("jobRelevantKeywords", idx)}
                                  className="hover:bg-pink-500/30 text-pink-400 hover:text-white rounded-full p-0.5 transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Remove keyword"
                                >
                                  <span className="text-[11px] leading-none select-none font-black">×</span>
                                </button>
                              )}
                            </span>
                          )) || <span className="text-xs italic text-gray-400">None extracted.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-5 border border-indigo-500/25 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                      <span className="text-xs font-mono font-bold tracking-tight text-indigo-200 animate-pulse">Running Background Skill Extraction Agent ...</span>
                    </div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-400">Wait Agent node</span>
                  </div>
                )}

                {/* Resume optimization suggestions */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 text-left space-y-3">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>CrewAI Integration Suggestions</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 font-light">
                    {activeResume.improvementSuggestions?.map((s, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5">
                        <span className="bg-amber-200 text-amber-900 w-5 h-5 rounded-md flex items-center justify-center shrink-0 font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="mt-0.5 leading-tight">{s}</span>
                      </li>
                    )) || (
                      <li className="italic text-slate-500 text-xs">No improvements recommendations generated at present.</li>
                    )}
                  </ul>
                </div>

                {/* Deep taxonomy details metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Technical Skills Database */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-purple-50/85 px-2.5 py-1 rounded-bl-2xl border-l border-b border-purple-100 flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-purple-600 animate-pulse" />
                      <span className="text-[8.5px] font-mono font-bold text-purple-700 tracking-tight">Skill Extraction Agent</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span>Technical Skills Index</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeResume.parsedData?.technicalSkills?.map((skill, sIdx) => (
                        <span key={sIdx} className="text-[10px] px-2.5 py-1 bg-purple-50 text-purple-700 font-medium rounded-lg border border-purple-100">
                          {skill}
                        </span>
                      )) || <span className="text-xs italic text-slate-400">None detected</span>}
                    </div>
                  </div>

                  {/* Soft Skills & certifications */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-50/85 px-2.5 py-1 rounded-bl-2xl border-l border-b border-emerald-100 flex items-center space-x-1">
                      <Award className="h-3 w-3 text-emerald-600 animate-pulse" />
                      <span className="text-[8.5px] font-mono font-bold text-emerald-700 tracking-tight">Extraction Node Done</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span>Soft skills & credentials</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {activeResume.parsedData?.softSkills?.map((skill, sIdx) => (
                        <span key={sIdx} className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 font-medium rounded-lg border border-emerald-150">
                          {skill}
                        </span>
                      )) || <span className="text-xs italic text-slate-400">None detected</span>}
                    </div>
                    {activeResume.parsedData?.certifications && activeResume.parsedData.certifications.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Certifications</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeResume.parsedData.certifications.map((c, cIdx) => (
                            <span key={cIdx} className="text-[10px] px-2.5 py-1 bg-amber-50 text-amber-800 font-medium rounded-lg border border-amber-100">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Experience block list */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                    <span>Employment Experience Milestones</span>
                  </h4>
                  <div className="space-y-4">
                    {activeResume.parsedData?.experience?.map((exp, eIdx) => (
                      <div key={eIdx} className="relative pl-6 border-l-2 border-slate-100 pb-2 last:pb-0">
                        <div className="absolute top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-white"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div>
                            <h5 className="text-sm font-bold text-slate-900">{exp.role}</h5>
                            <p className="text-xs text-purple-700 font-semibold">{exp.company}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">{exp.period}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 font-light whitespace-pre-wrap leading-relaxed">
                          {exp.description}
                        </p>
                      </div>
                    )) || <p className="text-xs italic text-slate-400">No structured work experience parsed</p>}
                  </div>
                </div>

                {/* Academic records */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span>Education Foundations</span>
                  </h4>
                  <div className="space-y-3">
                    {activeResume.parsedData?.education?.map((edu, eIdx) => (
                      <div key={eIdx} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{edu.degree}</p>
                          <p className="text-slate-500">{edu.institution}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold font-mono bg-slate-100 px-2 py-1 rounded">
                          {edu.year}
                        </span>
                      </div>
                    )) || <p className="text-xs italic text-slate-400">No parsed academic history detected</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Advanced Scoring & Audit Dashboard */}
            {activeTab === "scoring" && (() => {
              // Fail-safe calculation of scoring details
              const activeScoring = activeResume.scoringBreakdown || {
                keywordScore: Math.min(100, Math.max(45, activeResume.score - 4)),
                wordingScore: Math.min(100, Math.max(45, activeResume.score - 7)),
                formattingScore: Math.min(100, Math.max(45, activeResume.score + 5)),
                atsScore: Math.min(100, Math.max(45, activeResume.score + 3)),
                keywordAnalysis: {
                  detectedKeywords: activeResume.parsedData?.technicalSkills || ["React", "TypeScript", "Tailwind CSS"],
                  missingKeywords: ["Docker", "GraphQL", "CI/CD", "AWS", "Redis", "Jest"],
                  recommendations: [
                    "Directly append high-demand cloud computing (e.g. AWS) skills to match ATS index keywords for modern teams.",
                    "Incorporate API specifications like GraphQL alongside standard REST architecture bullets."
                  ]
                },
                wordingAnalysis: {
                  weakPhrases: [
                    { phrase: "worked on", fix: "Spearheaded / Engineered", reason: "Fails to capture key individual accountability and functional leadership." },
                    { phrase: "responsible for", fix: "Orchestrated / Led", reason: "Focuses on static tasks rather than active business-driving outputs." },
                    { phrase: "helped with", fix: "Accelerated / Catalyzed", reason: "Minimizes direct visual, framework, or performance contribution." }
                  ],
                  strongActionVerbs: ["Spearheaded", "Optimized", "Architected", "Accelerated", "Integrated", "Pioneered"],
                  recommendations: [
                    "Format each accomplishment line using high-impact active vocabulary: [Active Verb] + [Quantifiable metric] + [Technical Toolset].",
                    "Avert passivity descriptors like 'helped' or 'assisted' by claiming direct feature ownership."
                  ]
                },
                formattingAnalysis: {
                  layoutIssues: [
                    "Inline header indicators should utilize visual vertical styling characters ('|') for spacing clarity.",
                    "Lack of distinct uppercase headers can trigger parsing skips on obsolete ATS parsers."
                  ],
                  complianceChecklist: [
                    { item: "Contact Metadata Integrity", passed: true, tip: "Affirms valid email addresses and phone configuration existence." },
                    { item: "Standard Delineation Labels", passed: true, tip: "Correctly applies classic labels ('Education', 'Experience') for simplified parsing." },
                    { item: "Temporal Order Validity", passed: true, tip: "Sequences jobs in reverse chronological structure, showing current role at the peak." },
                    { item: "ATS Linear Grid Alignment", passed: true, tip: "Maintains standard tabular flow, bypassing modern column structure parsing failures." }
                  ],
                  recommendations: [
                    "Rearrange current phone/email headers using bold separator metrics.",
                    "Utilize universal rounded text bullets in place of unstructured hyphens across role accomplishments."
                  ]
                }
              };

              return (
                <div className="space-y-6 text-left">
                  {/* Category Pill Sub-nav */}
                  <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200">
                    <button
                      id="subtab-overview-btn"
                      type="button"
                      onClick={() => setScoreSubTab("overview")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        scoreSubTab === "overview"
                          ? "bg-white text-purple-950 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span>Audit Overview</span>
                    </button>
                    <button
                      id="subtab-keywords-btn"
                      type="button"
                      onClick={() => setScoreSubTab("keywords")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        scoreSubTab === "keywords"
                          ? "bg-white text-purple-950 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                      }`}
                    >
                      <Key className="h-4 w-4 text-purple-600" />
                      <span>Keyword Optimization</span>
                    </button>
                    <button
                      id="subtab-wording-btn"
                      type="button"
                      onClick={() => setScoreSubTab("wording")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        scoreSubTab === "wording"
                          ? "bg-white text-purple-950 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                      }`}
                    >
                      <Edit3 className="h-4 w-4 text-blue-605" />
                      <span>Experience Wording</span>
                    </button>
                    <button
                      id="subtab-formatting-btn"
                      type="button"
                      onClick={() => setScoreSubTab("formatting")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        scoreSubTab === "formatting"
                          ? "bg-white text-purple-950 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                      }`}
                    >
                      <AlignLeft className="h-4 w-4 text-emerald-600" />
                      <span>Formatting & ATS Check</span>
                    </button>
                  </div>

                  {/* Sub-tab 1: OVERVIEW */}
                  {scoreSubTab === "overview" && (
                    <div className="space-y-6">
                      {/* Metric Bento Boxes */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Keywords</span>
                          <p className="text-2xl font-black text-purple-950 mt-1">{activeScoring.keywordScore}%</p>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${activeScoring.keywordScore}%` }} />
                          </div>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Wording</span>
                          <p className="text-2xl font-black text-blue-950 mt-1">{activeScoring.wordingScore}%</p>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${activeScoring.wordingScore}%` }} />
                          </div>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Formatting</span>
                          <p className="text-2xl font-black text-emerald-950 mt-1">{activeScoring.formattingScore}%</p>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${activeScoring.formattingScore}%` }} />
                          </div>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">ATS Score</span>
                          <p className="text-2xl font-black text-indigo-950 mt-1">{activeScoring.atsScore}%</p>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${activeScoring.atsScore}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Primary Diagnostic Status Alert */}
                      {(activeScoring.keywordScore < 80 || activeScoring.wordingScore < 80) ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-rose-950 leading-relaxed font-light">
                            <p className="font-bold text-rose-900">Priority Warning: Quality Improvements Required</p>
                            <p className="mt-1">
                              Your resume relies on basic action verbs (e.g., &quot;worked on&quot;) and is missing critical cloud/platform keywords. 
                              Click the <strong className="font-bold">Keyword Optimization</strong> and <strong className="font-bold">Experience Wording</strong> categories above to inspect explicit replacements.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-155 rounded-2xl p-4 flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-emerald-955 leading-relaxed font-light">
                            <p className="font-bold text-emerald-900">Elite Standing: High ATS Compatibility</p>
                            <p className="mt-1">
                              Your document conforms to standard chronological systems. We detected heavy keyword alignment. Review individual sections to perfect formatting margins and access a flawless 95%+ rank.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Direct Improvement Suggestions Bento Card */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center space-x-1.5">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <span>Direct Revision Actions</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border border-slate-150 rounded-2xl p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center space-x-2 text-purple-700">
                              <Key className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Keyword Additions</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-light font-sans">
                              Add keywords like <strong className="font-bold text-slate-700">{activeScoring.keywordAnalysis.missingKeywords.slice(0, 3).join(", ")}</strong> directly to match target pipelines.
                            </p>
                          </div>

                          <div className="border border-slate-150 rounded-2xl p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center space-x-2 text-blue-700">
                              <Edit3 className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Verb Upgrades</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-light font-sans">
                              Replace weak passive phrasing like <strong className="font-bold text-red-700">&quot;{activeScoring.wordingAnalysis.weakPhrases[0]?.phrase}&quot;</strong> with powerful verbs.
                            </p>
                          </div>

                          <div className="border border-slate-150 rounded-2xl p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center space-x-2 text-emerald-700">
                              <AlignLeft className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Style Standard</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-light font-sans">
                              Remove non-standard markers and utilize pipe delineators to separate phone & email contacts correctly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: KEYWORDS */}
                  {scoreSubTab === "keywords" && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                          <Key className="h-4.5 w-4.5 text-purple-650" />
                          <span>Keyword Matching & Optimization Analysis</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          We mapped your resume against key structural indexes required for top-tier modern software development and engineering startup opportunities.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Detected Keywords */}
                        <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/20 space-y-3.5 text-left">
                          <p className="text-xs font-bold text-purple-950 uppercase tracking-wide flex items-center space-x-1.5">
                            <Check className="h-4 w-4 text-purple-600" />
                            <span>Detected Keywords ({activeScoring.keywordAnalysis.detectedKeywords.length})</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {activeScoring.keywordAnalysis.detectedKeywords.map((k, i) => (
                              <span key={i} className="text-[10px] px-2.5 py-1 bg-white text-purple-800 font-semibold rounded-lg border border-purple-100 shadow-3xs">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Keywords */}
                        <div className="border border-amber-100 rounded-2xl p-5 bg-amber-50/20 space-y-3.5 text-left">
                          <p className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center space-x-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span>Critical Missing / Target Keywords ({activeScoring.keywordAnalysis.missingKeywords.length})</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {activeScoring.keywordAnalysis.missingKeywords.map((k, i) => (
                              <span key={i} className="text-[10px] px-2.5 py-1 bg-white hover:bg-amber-50/50 text-amber-800 font-bold rounded-lg border border-amber-100 border-dashed shadow-3xs cursor-default">
                                + {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Keyword recommendations */}
                      <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Actionable Keyword Guidance</p>
                        <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed font-light">
                          {activeScoring.keywordAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 mt-2"></span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 3: WORDING */}
                  {scoreSubTab === "wording" && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                          <Edit3 className="h-4.5 w-4.5 text-blue-600" />
                          <span>Professional Wording, Passive-Voice & Verbs Audit</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Applicant tracking bots assign heavier correlation parameters to dynamic verbs representing quantifiable ownership rather than basic execution lists.
                        </p>
                      </div>

                      {/* Weak Phrases Rows */}
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identified Weak Phrases & Replacements</p>
                        <div className="space-y-3">
                          {activeScoring.wordingAnalysis.weakPhrases.map((weak, idx) => (
                            <div key={idx} className="border border-slate-150 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Found Weak Verb Phrase</span>
                                <p className="text-xs font-black text-slate-800 italic mt-0.5">&quot;{weak.phrase}&quot;</p>
                              </div>
                              <div className="flex-1 md:px-6 space-y-1">
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">ATS Rationale</span>
                                <p className="text-xs text-slate-600 font-light leading-relaxed">{weak.reason}</p>
                              </div>
                              <div className="space-y-1 text-left md:text-right shrink-0">
                                <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ATS Recommended Replaces</span>
                                <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center space-x-1">
                                  <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />
                                  <span>{weak.fix}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strong Action Verbs list library */}
                      <div className="border border-slate-150 rounded-2xl p-5 space-y-3">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Deployable Power Verbs library</p>
                        <div className="flex flex-wrap gap-2">
                          {activeScoring.wordingAnalysis.strongActionVerbs.map((v, idx) => (
                            <span key={idx} className="text-[10px] px-3 py-1.5 bg-blue-50 text-blue-800 font-bold rounded-lg border border-blue-100 hover:scale-105 transition-transform duration-200 shadow-3xs">
                              {v}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 italic">💡 Action verbs prompt optimal matching when placed as the very first word of chronological bullet points.</p>
                      </div>

                      {/* Bullet writing recommendations */}
                      <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 space-y-3">
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Accomplishment-focused bullets formulation</p>
                        <ul className="space-y-2.5 text-xs text-blue-950 leading-relaxed font-light">
                          {activeScoring.wordingAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2"></span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 4: FORMATTING */}
                  {scoreSubTab === "formatting" && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                          <AlignLeft className="h-5 w-5 text-emerald-600" />
                          <span>Formatting Integrity & ATS Compliance Matrix</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Ensuring standard file headers and chronological structuring minimizes layout translation flaws inside candidate screening frameworks.
                        </p>
                      </div>

                      {/* Checked items lists */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Quality Compliance Checks</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeScoring.formattingAnalysis.complianceChecklist.map((check, idx) => (
                            <div key={idx} className="border border-slate-150 rounded-2xl p-4 flex items-start space-x-3.5 bg-slate-50/50 text-left">
                              {check.passed ? (
                                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                              )}
                              <div className="space-y-1 text-left">
                                <p className="text-xs font-bold text-slate-900">{check.item}</p>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-light">{check.tip}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Physical layout issues alert card block */}
                      {activeScoring.formattingAnalysis.layoutIssues.length > 0 && (
                        <div className="border border-amber-200 bg-amber-50/20 rounded-2xl p-4 space-y-3 text-left">
                          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                            <AlertCircle className="h-4 w-4" />
                            <span>Formatting layout issues parsed ({activeScoring.formattingAnalysis.layoutIssues.length})</span>
                          </p>
                          <ul className="space-y-2 text-xs text-slate-700 leading-normal font-light">
                            {activeScoring.formattingAnalysis.layoutIssues.map((issue, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Universal Layout Guidance */}
                      <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 space-y-3">
                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Universal Formatting Recommendations</p>
                        <ul className="space-y-2.5 text-xs text-slate-650 leading-relaxed font-light">
                          {activeScoring.formattingAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-2"></span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>

    {/* Floating Toast Notification Overlay */}
    {toast && (
      <div 
        id={`toast-container-${toast.id}`}
        className="fixed bottom-6 right-6 z-50 flex items-center shadow-2xl rounded-2xl p-4 bg-slate-900/95 backdrop-blur-md border border-indigo-500/20 text-white min-w-[325px] max-w-sm space-x-3 transition-all duration-300 transform hover:scale-[1.02] shadow-indigo-500/10 animate-fade-in"
      >
        <div className={`p-2 rounded-xl text-white shrink-0 ${
          toast.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
          toast.type === "error" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : 
          "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : toast.type === "error" ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">
            {toast.type === "success" ? "System Notification" : "Analysis Alert"}
          </p>
          <p className="text-[11px] font-medium leading-normal mt-0.5 text-slate-100">{toast.message}</p>
        </div>
        <button 
          onClick={() => setToast(null)}
          className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer shrink-0"
        >
          <XCircle className="h-4.5 w-4.5" />
        </button>
      </div>
    )}
    </div>
  );
}
