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
  User
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
}: EmailDraftPreviewProps) {
  const [layoutMode, setLayoutMode] = useState<"side-by-side" | "tabbed">("side-by-side");
  const [activeTab, setActiveTab] = useState<"email" | "letter">("email");
  const [isEditing, setIsEditing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [fontStyle, setFontStyle] = useState<"sans" | "serif">("serif");

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
              title="Side by Side Layout"
              onClick={() => setLayoutMode("side-by-side")}
              className={`p-1 px-2 rounded-md flex items-center space-x-1 text-[10px] font-bold transition-all cursor-pointer ${
                layoutMode === "side-by-side" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Side by Side</span>
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
        </div>
      )}

      {/* Recipient Preview Card */}
      <div id="recipient-preview-card" className="mx-6 mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-left">
          <div className="bg-purple-100 p-2.5 rounded-xl text-purple-700 shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-purple-600 uppercase tracking-widest block">
              CORRESPONDENCE DESTINATION
            </span>
            <h5 className="text-xs font-bold text-slate-800">
              Recipient Preview
            </h5>
            <p className="text-[10px] text-slate-500 font-sans leading-tight">
              Please verify extracted client coordinates before executing connection dispatch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Extracted Name Badge */}
          <div className="bg-white border border-slate-250 border-slate-200 rounded-xl p-2 px-3.5 shadow-xs text-left min-w-[130px]">
            <span className="text-[8px] font-bold font-mono text-slate-400 block tracking-wider uppercase">Contact Name</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 truncate max-w-[135px]">
                {recipientName || "Hiring Manager"}
              </span>
            </div>
          </div>

          {/* Extracted Email Badge */}
          <div className="bg-white border border-slate-250 border-slate-200 rounded-xl p-2 px-3.5 shadow-xs text-left min-w-[170px]">
            <span className="text-[8px] font-bold font-mono text-slate-400 block tracking-wider uppercase">Extracted Email</span>
            <div className="flex items-center space-x-1.5 mt-0.5 text-slate-700">
              <Mail className="h-3.5 w-3.5 text-purple-500 shrink-0" />
              <span className="text-xs font-mono font-bold truncate max-w-[175px]">
                {recipientEmail || "recruitment@company.com"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Panes */}
      <div className={`p-6 bg-slate-50/20 ${layoutMode === "side-by-side" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "block"}`}>
        {/* outreachEmail Area */}
        {(layoutMode === "side-by-side" || activeTab === "email") && (
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
                    <span className="text-slate-405 text-slate-400 italic">No email draft generated yet. Use the customizable AI Prompt Box below to write one!</span>
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
              <span>MIME payload: Ready</span>
            </div>
          </div>
        )}

        {/* coverLetter Area */}
        {(layoutMode === "side-by-side" || activeTab === "letter") && (
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
                    <span className="text-slate-405 text-slate-400 italic">No cover letter draft generated yet. Fill the prompts to generate!</span>
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
      </div>
    </div>
  );
}
