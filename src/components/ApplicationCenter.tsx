/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Mail, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  ChevronRight, 
  Heart,
  Send,
  Edit3,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight
} from "lucide-react";
import { Application } from "../types";
import EmailDraftPreview from "./EmailDraftPreview";

interface ApplicationCenterProps {
  applications: Application[];
  onUpdateStatus: (
    id: string, 
    status: 'Saved' | 'Applied' | 'Under Review' | 'Interview' | 'Offer' | 'Rejected',
    outreachEmail?: string,
    coverLetter?: string,
    deadline?: string
  ) => Promise<void>;
  onTweakDraft: (appId: string, customInstruction: string) => Promise<void>;
  onDeleteApplication?: (id: string) => void;
}

export default function ApplicationCenter({
  applications,
  onUpdateStatus,
  onTweakDraft,
}: ApplicationCenterProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'sent'>('queue');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Edit / Tweak states
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isTweaking, setIsTweaking] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Filter queues
  const approvalItems = applications.filter(a => a.status === "Saved");
  const sentItems = applications.filter(a => a.status === "Applied" || a.status === "Under Review" || a.status === "Interview" || a.status === "Offer" || a.status === "Rejected");

  const handleSelectApp = (app: Application) => {
    setSelectedApp(app);
    setEditedEmail(app.outreachEmail || "");
    setEditedCoverLetter(app.coverLetter || "");
    setIsEditing(false);
    setCustomPrompt("");
  };

  // Sync selectedApp when applications data changes (e.g. from tweaks or stage updates)
  React.useEffect(() => {
    if (selectedApp) {
      const refreshed = applications.find(a => a.id === selectedApp.id);
      if (refreshed) {
        if (refreshed.outreachEmail !== selectedApp.outreachEmail || refreshed.coverLetter !== selectedApp.coverLetter) {
          setEditedEmail(refreshed.outreachEmail || "");
          setEditedCoverLetter(refreshed.coverLetter || "");
        }
        setSelectedApp(refreshed);
      }
    }
  }, [applications]);

  // Submit approved application
  const handleApproveAndDispatch = async (appId: string) => {
    setIsSending(true);
    try {
      // Simulate dispatch
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await onUpdateStatus(appId, "Applied", editedEmail, editedCoverLetter);
      
      // Update local selection
      const updated = applications.find(a => a.id === appId);
      if (updated) {
        setSelectedApp({ ...updated, status: "Applied" });
      } else {
        setSelectedApp(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  // Run AI cover letter prompt tweaks
  const handleTweakAI = async () => {
    if (!selectedApp || !customPrompt.trim()) return;
    setIsTweaking(true);
    try {
      await onTweakDraft(selectedApp.id, customPrompt);
      // Retrieve refreshed selection values
      const updated = applications.find(a => a.id === selectedApp.id);
      if (updated) {
        setEditedEmail(updated.outreachEmail || "");
        setEditedCoverLetter(updated.coverLetter || "");
      }
      setCustomPrompt("");
    } catch (e: any) {
      alert("Tweak draft failed: " + e.message);
    } finally {
      setIsTweaking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 10-Agent Pipeline Operational Node Indicators */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-55 bg-slate-50 p-4 rounded-3xl border border-slate-205/60 text-left">
        <div className="flex items-center space-x-2 mr-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Operational Agent Fleet:</span>
        </div>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-xl border border-amber-100">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span>Company Research Agent [ACTIVE]</span>
        </span>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 text-teal-805 text-[11px] font-bold rounded-xl border border-teal-150">
          <Mail className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
          <span>Email Discovery Agent [ACTIVE]</span>
        </span>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-855 text-[11px] font-bold rounded-xl border border-purple-150">
          <FileText className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
          <span>Application Draft Agent [ACTIVE]</span>
        </span>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 text-rose-855 text-[11px] font-bold rounded-xl border border-rose-150">
          <CheckCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
          <span>User Approval Agent [ACTIVE]</span>
        </span>
      </div>

      <div id="app-center-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Queues List */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          {/* Section Selector tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('queue'); setSelectedApp(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'queue' 
                  ? "bg-white text-purple-950 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Approval Queue ({approvalItems.length})
            </button>
            <button
              onClick={() => { setActiveTab('sent'); setSelectedApp(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'sent' 
                  ? "bg-white text-purple-950 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sent Outbox ({sentItems.length})
            </button>
          </div>

          {/* Render Queue list items */}
          <div className="space-y-3 max-h-[450px] overflow-y-auto">
            {activeTab === 'queue' ? (
              approvalItems.map((app) => (
                <div 
                  key={app.id}
                  onClick={() => handleSelectApp(app)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedApp?.id === app.id 
                      ? "border-purple-600 bg-purple-50/10 shadow-sm" 
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-[10px] text-purple-600 font-mono font-bold tracking-wider">AWAITING APPROVAL</p>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{app.jobTitle}</h4>
                  <p className="text-xs text-slate-500">{app.company}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-3 pt-2.5 border-t border-slate-100">
                    <span className="flex items-center space-x-1.5">
                      <Mail className="h-3 w-3 text-slate-350" />
                      <span className="truncate max-w-[140px]">{app.recipientEmail || "Hiring Lead"}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-purple-600">
                      <span>Review draft</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              sentItems.map((app) => (
                <div 
                  key={app.id}
                  onClick={() => handleSelectApp(app)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedApp?.id === app.id 
                      ? "border-purple-400 bg-purple-50/5" 
                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-150 rounded font-bold font-mono">
                      SENT: {app.status.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{app.dateApplied || app.dateCreated}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-2 truncate">{app.jobTitle}</h4>
                  <p className="text-[11px] text-slate-500">{app.company}</p>
                </div>
              ))
            )}

            {activeTab === 'queue' && approvalItems.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs italic space-y-2">
                <p>No applications awaiting approval.</p>
                <p className="text-[10px] text-slate-400 font-sans not-italic">
                  Find jobs in &quot;Job Search&quot; or match your resume to launch real agent drafts.
                </p>
              </div>
            )}

            {activeTab === 'sent' && sentItems.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs italic">
                No dispatch confirmations inside sent outbox folder yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Draft review Pane */}
      <div className="lg:col-span-8">
        {!selectedApp ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center h-full min-h-[400px] shadow-sm flex flex-col items-center justify-center">
            <Mail className="h-12 w-12 text-slate-350 mb-4 animate-pulse" />
            <span className="font-bold text-slate-800">Detail Inspector Pane</span>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Choose one of the active jobs in the queue to preview outbound communication email templates, verify recruiter coordinates, and dispatch.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Context details banner */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <p className="text-[10px] text-purple-600 font-mono font-bold tracking-widest flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                  <span>PREPARING CONTEXT OUTLINE</span>
                </p>
                <h3 className="text-xl font-bold text-slate-900">{selectedApp.jobTitle}</h3>
                <p className="text-xs text-slate-500">{selectedApp.company} • {selectedApp.location}</p>
                <div className="flex items-center space-x-2 pt-1.5 font-mono text-[11px] text-slate-500">
                  <span className="font-bold text-slate-400">Deadline Target:</span>
                  <input
                    type="date"
                    value={selectedApp.deadline || ""}
                    onChange={async (e) => {
                      await onUpdateStatus(selectedApp.id, selectedApp.status, undefined, undefined, e.target.value);
                    }}
                    className="border border-slate-200 focus:border-purple-500 rounded-lg bg-slate-50 hover:bg-slate-100 font-mono text-slate-750 px-2 py-0.5 text-[10.5px] outline-none cursor-pointer transition-all"
                  />
                </div>
              </div>

              {selectedApp.status === "Saved" ? (
                <button
                  id="btn-dispatch-mail"
                  disabled={isSending}
                  onClick={() => handleApproveAndDispatch(selectedApp.id)}
                  className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:brightness-110 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer shrink-0"
                >
                  {isSending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Dispatching Mail...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Approve & Dispatch via connected Gmail</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center space-x-2 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-150 rounded-2xl px-5 py-3">
                  <CheckCircle className="h-4.5 w-4.5" />
                  <span>Officially Dispatched on {selectedApp.dateApplied || selectedApp.dateCreated}</span>
                </div>
              )}
            </div>

            {/* Editing and Tweaking Panel */}
            <EmailDraftPreview
              email={editedEmail}
              coverLetter={editedCoverLetter}
              onEmailChange={setEditedEmail}
              onCoverLetterChange={setEditedCoverLetter}
              isReadOnly={selectedApp.status !== "Saved"}
              recipientName={selectedApp.recipientName || ""}
              recipientEmail={selectedApp.recipientEmail || ""}
              jobTitle={selectedApp.jobTitle}
            />

            {/* AI Customization Prompt Box (Only active for queue items) */}
            {selectedApp.status === "Saved" && (
              <div className="bg-purple-950 text-purple-100 rounded-3xl p-6 text-left space-y-3 shadow-md">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 text-amber-300">
                  <Sparkles className="h-4 bg-transparent w-4" />
                  <span>Customize Draft with targeted instructions</span>
                </h4>
                <p className="text-[11px] text-purple-200/90 font-light">
                  Instruct Gemini to modify the layout, emphasize specific achievements, or rewrite in a more casual, bold or highly technical enterprise focus.
                </p>

                <div className="flex space-x-3 pt-1">
                  <input
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. 'Make it shorter and place massive focus on my payment flow metrics...'"
                    className="flex-1 text-xs px-4 py-3 rounded-xl bg-purple-900 border border-purple-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/30 font-sans"
                  />
                  <button
                    onClick={handleTweakAI}
                    disabled={isTweaking || !customPrompt.trim()}
                    className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTweaking ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 bg-transparent w-4" />
                    )}
                    <span>Tweak drafts</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
