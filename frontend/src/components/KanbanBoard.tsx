/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ClipboardList,
  Clock,
  AlertCircle,
  Bookmark,
  Send,
  Eye,
  MessageSquare,
  Award,
  XCircle
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Application, ApplicationStatus } from "../types";

interface KanbanBoardProps {
  applications: Application[];
  onUpdateStatus: (
    id: string, 
    status: ApplicationStatus, 
    deadline?: string,
    followUpDays?: number,
    followUpReminderDate?: string,
    followUpCompleted?: boolean,
    followUpNotes?: string
  ) => Promise<void>;
}

const COLUMNS: Array<{ label: ApplicationStatus; color: string; bg: string; dot: string }> = [
  { label: "Saved", color: "text-slate-700 bg-slate-100", bg: "bg-slate-50/50", dot: "bg-slate-400" },
  { label: "Applied", color: "text-purple-700 bg-purple-50", bg: "bg-purple-50/15", dot: "bg-purple-600" },
  { label: "Under Review", color: "text-blue-700 bg-blue-50", bg: "bg-blue-50/15", dot: "bg-blue-500" },
  { label: "Interview", color: "text-amber-700 bg-amber-50", bg: "bg-amber-50/15", dot: "bg-amber-400" },
  { label: "Offer", color: "text-emerald-700 bg-emerald-50", bg: "bg-emerald-50/15", dot: "bg-emerald-500" },
  { label: "Rejected", color: "text-rose-700 bg-rose-50", bg: "bg-rose-50/15", dot: "bg-rose-500" }
];

const getStatusIconAndStyles = (status: ApplicationStatus) => {
  switch (status) {
    case "Saved":
      return {
        icon: Bookmark,
        bg: "bg-slate-100 text-slate-600 border-slate-200/60",
        label: "Saved"
      };
    case "Applied":
      return {
        icon: Send,
        bg: "bg-purple-100/70 text-purple-700 border-purple-200/60",
        label: "Applied"
      };
    case "Under Review":
      return {
        icon: Eye,
        bg: "bg-blue-100/70 text-blue-700 border-blue-200/60",
        label: "Under Review"
      };
    case "Interview":
      return {
        icon: MessageSquare,
        bg: "bg-amber-100/75 text-amber-700 border-amber-300/65",
        label: "Interview"
      };
    case "Offer":
      return {
        icon: Award,
        bg: "bg-emerald-100/70 text-emerald-800 border-emerald-200/60",
        label: "Offer"
      };
    case "Rejected":
      return {
        icon: XCircle,
        bg: "bg-rose-100/70 text-rose-700 border-rose-200/60",
        label: "Rejected"
      };
    default:
      return {
        icon: Briefcase,
        bg: "bg-slate-100 text-slate-600 border-slate-200",
        label: status
      };
  }
};

export default function KanbanBoard({
  applications,
  onUpdateStatus,
}: KanbanBoardProps) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  
  // Follow-up simulation and draft states
  const TODAY_DATE_STR = "2026-06-22";
  const [draftDialogApp, setDraftDialogApp] = useState<Application | null>(null);
  const [generatedDraftText, setGeneratedDraftText] = useState<string>("");
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  const getDaysRemainingForFollowUp = (reminderDateStr?: string) => {
    if (!reminderDateStr) return 0;
    const today = new Date(TODAY_DATE_STR);
    const reminder = new Date(reminderDateStr);
    today.setHours(0, 0, 0, 0);
    reminder.setHours(0, 0, 0, 0);
    const diffTime = reminder.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const generateFollowUpMockText = (company: string, title: string) => {
    return `Subject: Follow-up: Application for ${title} at ${company}

Hi Hiring Team,

I hope you are having a wonderful week!

I wanted to briefly follow up on the ${title} application I submitted a few days ago. I remain highly enthusiastic about ${company}'s current trajectory and would love to explore how my skills could contribute to your engineering objectives.

Please let me know if you would like me to provide any additional materials or details.

Warm regards,
[Your Name]`;
  };

  const handleGenerateDraft = async (app: Application) => {
    setDraftDialogApp(app);
    setIsDraftLoading(true);
    setGeneratedDraftText("Formulating personalized follow-up email tailored by CareerPilot AI outreach coach agent using Gemini...");
    try {
      const daysLeft = getDaysRemainingForFollowUp(app.followUpReminderDate);
      const daysOverdue = daysLeft <= 0 ? Math.abs(daysLeft) : 5;
      const res = await fetch("/api/follow-up/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: app.company,
          jobTitle: app.jobTitle,
          recipientName: app.recipientName || "",
          daysOverdue: daysOverdue,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setGeneratedDraftText(data.text);
      } else {
        setGeneratedDraftText(generateFollowUpMockText(app.company, app.jobTitle));
      }
    } catch (err) {
      console.error("Failed to generate follow up draft", err);
      setGeneratedDraftText(generateFollowUpMockText(app.company, app.jobTitle));
    } finally {
      setIsDraftLoading(false);
    }
  };

  const getDeadlineStatus = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    
    // Clear times to compare dates
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        text: `Overdue ${Math.abs(diffDays)}d ago`,
        urgency: 'overdue',
        bg: 'bg-rose-50 border-rose-200 text-rose-700 font-bold',
        indicatorColor: 'bg-rose-600',
        label: 'Overdue'
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due Today',
        urgency: 'critical',
        bg: 'bg-rose-100 border-rose-300 text-rose-800 font-extrabold animate-pulse',
        indicatorColor: 'bg-rose-700',
        label: 'Critical'
      };
    } else if (diffDays === 1) {
      return {
        text: 'Due Tomorrow',
        urgency: 'critical',
        bg: 'bg-red-50 border-red-200 text-red-700 font-extrabold',
        indicatorColor: 'bg-red-650',
        label: 'Critical'
      };
    } else if (diffDays <= 3) {
      return {
        text: `${diffDays} days left`,
        urgency: 'high',
        bg: 'bg-amber-50 border-amber-200 text-amber-700 font-bold',
        indicatorColor: 'bg-amber-500',
        label: 'Urgent'
      };
    } else if (diffDays <= 7) {
      return {
        text: `${diffDays} days left`,
        urgency: 'medium',
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium',
        indicatorColor: 'bg-indigo-500',
        label: 'Approaching'
      };
    } else {
      return {
        text: `${diffDays} days left`,
        urgency: 'low',
        bg: 'bg-slate-50 border-slate-200 text-slate-605 font-normal',
        indicatorColor: 'bg-slate-400',
        label: 'Comfortable'
      };
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (id) {
      await onUpdateStatus(id, status);
    }
    setDraggedAppId(null);
  };

  // Move via standard actions
  const shiftStatus = async (id: string, current: ApplicationStatus, direction: "next" | "prev") => {
    const currentIndex = COLUMNS.findIndex(c => c.label === current);
    let newIndex = currentIndex;
    
    if (direction === "next" && currentIndex < COLUMNS.length - 1) {
      newIndex += 1;
    } else if (direction === "prev" && currentIndex > 0) {
      newIndex -= 1;
    }

    if (newIndex !== currentIndex) {
      await onUpdateStatus(id, COLUMNS[newIndex].label);
    }
  };

  return (
    <div id="kanban-container-root" className="space-y-6 text-left">
      {/* 10-Agent Pipeline Operational Node Indicators */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-205/60 text-left">
        <div className="flex items-center space-x-2 mr-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Operational Agent Fleet:</span>
        </div>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 text-[11px] font-bold rounded-xl border border-indigo-100">
          <Calendar className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
          <span>Email Sending Agent [ACTIVE]</span>
        </span>
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-150">
          <Layers className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span>Tracking Agent [ACTIVE]</span>
        </span>
      </div>

      {/* Board Summary Metric Details Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <p className="text-[10px] text-purple-600 font-mono font-bold tracking-widest flex items-center space-x-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>PIPELINE VELOCITY REPORT</span>
          </p>
          <h3 className="text-xl font-bold text-slate-905">Job Application Pipeline Tracking</h3>
          <p className="text-xs text-slate-500 font-light">Drag items vertically or click navigation arrows inside cards to move them across candidate stages.</p>
        </div>

        {/* Aggregate pipeline stats */}
        <div className="flex items-center space-x-4 shrink-0 font-mono">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block leading-none">TOTAL</span>
            <span className="text-lg font-black text-slate-800">{applications.length}</span>
          </div>
          <div className="bg-purple-50 border border-purple-150 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-purple-600 font-bold block leading-none">ACTIVE</span>
            <span className="text-lg font-black text-purple-950">
              {applications.filter(a => a.status !== "Rejected" && a.status !== "Saved").length}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-150 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-emerald-600 font-bold block leading-none">OFFERS</span>
            <span className="text-lg font-black text-emerald-950">
              {applications.filter(a => a.status === "Offer").length}
            </span>
          </div>
        </div>
      </div>

      {/* Follow-up Scheduler Alarm Central bar */}
      {(() => {
        const appliedAppsWithFollowUps = applications.filter(a => a.status === "Applied" && a.followUpReminderDate);
        const overdueCount = appliedAppsWithFollowUps.filter(a => !a.followUpCompleted && getDaysRemainingForFollowUp(a.followUpReminderDate) <= 0).length;
        
        if (appliedAppsWithFollowUps.length === 0) return null;

        return (
          <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3 text-left">
              <div className="bg-purple-100 p-2.5 rounded-xl text-purple-700 mt-0.5 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black font-mono text-purple-600 uppercase tracking-widest block">
                  Follow-up Scheduler Coordinator Node
                </span>
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  Outbound Communication Reminders Hub
                  {overdueCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] bg-red-100 text-red-800 border border-red-250 animate-bounce">
                      🚨 {overdueCount} Nudges Ready
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 font-sans max-w-xl leading-relaxed">
                  Shows candidates' outbound stage status. High-frequency loops assist you to nudge hiring gates 3-7 days after your stage is marked as applied.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <div className="bg-white border border-slate-150 rounded-xl px-4 py-2 text-left min-w-[120px] shadow-2xs w-full sm:w-auto">
                <span className="text-[8.5px] font-bold text-slate-400 block tracking-wider uppercase">Active Reminders</span>
                <span className="text-xs font-black text-slate-850">
                  {appliedAppsWithFollowUps.filter(a => !a.followUpCompleted).length} Scheduled
                </span>
              </div>
              
              <div className={`border rounded-xl px-4 py-2 text-left min-w-[120px] shadow-2xs w-full sm:w-auto ${overdueCount > 0 ? "bg-amber-50 border-amber-200 text-amber-950" : "bg-white border-slate-150"}`}>
                <span className="text-[8.5px] font-bold text-slate-400 block tracking-wider uppercase">Nudges Ready</span>
                <span className="text-xs font-black text-amber-950">{overdueCount} Overdue</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-150 text-emerald-850 rounded-xl px-4 py-2 text-left min-w-[120px] w-full sm:w-auto">
                <span className="text-[8.5px] font-bold text-emerald-600 block tracking-wider uppercase">Snoozed/Completed</span>
                <span className="text-xs font-black text-emerald-800">
                  {appliedAppsWithFollowUps.filter(a => a.followUpCompleted).length} Completed ✓
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Grid columns */}
      <div id="kanban-grid-cols" className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {COLUMNS.map((col, idx) => {
          const columnApps = applications.filter(a => a.status === col.label);
          const isDraggingOver = dragOverColumn === col.label;
          return (
            <div 
              key={idx}
              onDragOver={(e) => handleDragOver(e, col.label)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.label)}
              className={`rounded-3xl p-4 border shadow-xs flex flex-col space-y-4 min-h-[500px] transition-all duration-300 ${
                isDraggingOver 
                  ? "bg-purple-50/45 border-purple-300 scale-[1.015] shadow-md ring-4 ring-purple-50" 
                  : "bg-white border-slate-200"
              }`}
            >
              {/* Column label */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
                  <span className="font-extrabold text-slate-800">{col.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                  {columnApps.length}
                </span>
              </div>

              {/* Cards List container */}
              <div className="flex-1 flex flex-col space-y-3">
                <AnimatePresence mode="popLayout">
                  {columnApps.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                        layout: { duration: 0.25, ease: "easeInOut" }
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-205 shadow-xs text-left cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all relative group"
                    >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-850 text-xs line-clamp-1 leading-snug">{app.jobTitle}</h5>
                        <p className="text-[11px] text-purple-700 font-bold truncate mt-0.5">{app.company}</p>
                      </div>
                      
                      {(() => {
                        const { icon: StatusIcon, bg, label } = getStatusIconAndStyles(app.status);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black font-mono border uppercase tracking-wider ${bg} transition-all shrink-0 shadow-3xs`}>
                            <StatusIcon className="h-2.5 w-2.5 shrink-0" />
                            <span>{label}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="mt-3 space-y-1 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-slate-350 shrink-0" />
                        <span className="truncate">{app.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-slate-350 shrink-0" />
                        <span>{app.salary}</span>
                      </div>
                    </div>

                    {/* Visual Countdown & Urgency Indicator */}
                    {(() => {
                      const status = getDeadlineStatus(app.deadline);
                      return (
                        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200/60 space-y-1.5 pb-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span className="flex items-center space-x-1 font-bold text-slate-400">
                              <Calendar className="h-3 w-3 text-slate-350 shrink-0" />
                              <span>Deadline:</span>
                            </span>
                            <div className="flex items-center space-x-1">
                              <input 
                                type="date" 
                                value={app.deadline || ""} 
                                onChange={(e) => onUpdateStatus(app.id, app.status, e.target.value)} 
                                className="text-[9.5px] font-mono border-0 p-0 text-right text-slate-600 hover:text-purple-600 focus:text-purple-600 cursor-pointer focus:ring-0 bg-transparent w-[95px] outline-none"
                                title="Change Deadline"
                              />
                            </div>
                          </div>
                          
                          {status ? (
                            <div className="space-y-1 pt-0.5">
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ${status.bg} border shrink-0`}>
                                  <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                                  <span>{status.label}</span>
                                </span>
                                <span className="text-[9.5px] font-mono font-extrabold text-slate-600">
                                  {status.text}
                                </span>
                              </div>
                              
                              {/* Urgency Progress Spark line */}
                              <div className="w-full bg-slate-250 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    status.urgency === 'critical' || status.urgency === 'overdue'
                                      ? 'bg-rose-500 w-full animate-pulse' 
                                      : status.urgency === 'high'
                                      ? 'bg-amber-500 w-3/4'
                                      : status.urgency === 'medium'
                                      ? 'bg-indigo-500 w-1/2'
                                      : 'bg-slate-400 w-1/4'
                                  }`}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-[9.5px] italic text-slate-400/80">No target date set</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Follow-up Scheduler (Only for Applied stage) */}
                    {app.status === "Applied" && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 bg-white/75 p-2.5 rounded-xl border border-slate-200/50 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 font-mono">
                          <span className="flex items-center space-x-1 text-purple-700">
                            <Clock className="h-3 w-3 text-purple-500 shrink-0" />
                            <span>Follow-Up Reminders</span>
                          </span>
                          {app.followUpReminderDate ? (
                            app.followUpCompleted ? (
                              <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-black border border-emerald-200">
                                Completed ✓
                              </span>
                            ) : (
                              (() => {
                                const daysLeft = getDaysRemainingForFollowUp(app.followUpReminderDate);
                                if (daysLeft <= 0) {
                                  return (
                                    <span className="text-[8.5px] uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-black border border-amber-300 animate-pulse">
                                      Nudge Alert! 🚨
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-black border border-blue-200">
                                    In {daysLeft}d
                                  </span>
                                );
                              })()
                            )
                          ) : (
                            <span className="text-[8px] font-normal italic text-slate-400">
                              Unscheduled
                            </span>
                          )}
                        </div>

                        {!app.followUpReminderDate ? (
                          <div className="space-y-1.5 text-[9.5px]">
                            <p className="text-[9px] text-slate-500 leading-tight">
                              Schedule an automatic follow-up reminder 3-7 days post application:
                            </p>
                            <div className="grid grid-cols-3 gap-1 pt-0.5">
                              {[3, 5, 7].map((days) => {
                                return (
                                  <button
                                    key={days}
                                    type="button"
                                    onClick={() => {
                                      const baseDateStr = app.dateApplied || TODAY_DATE_STR;
                                      const baseDate = new Date(baseDateStr);
                                      baseDate.setDate(baseDate.getDate() + days);
                                      const reminderDateStr = baseDate.toISOString().split("T")[0];
                                      onUpdateStatus(
                                        app.id, 
                                        app.status, 
                                        app.deadline, 
                                        days, 
                                        reminderDateStr, 
                                        false, 
                                        ""
                                      );
                                    }}
                                    className="px-1.5 py-1 text-center font-mono text-[9px] font-bold bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg border border-slate-200 hover:border-purple-300 transition-all cursor-pointer"
                                  >
                                    +{days} Days
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center space-x-1 pt-1 justify-between">
                              <span className="text-[8px] text-slate-400 font-mono">Custom Wait:</span>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  min={3}
                                  max={14}
                                  defaultValue={4}
                                  id={`custom-days-${app.id}`}
                                  className="w-10 text-center text-[9px] border border-slate-200 rounded font-mono p-0.5 focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = parseInt((document.getElementById(`custom-days-${app.id}`) as HTMLInputElement)?.value || "4");
                                    const baseDateStr = app.dateApplied || TODAY_DATE_STR;
                                    const baseDate = new Date(baseDateStr);
                                    baseDate.setDate(baseDate.getDate() + val);
                                    const reminderDateStr = baseDate.toISOString().split("T")[0];
                                    onUpdateStatus(
                                      app.id, 
                                      app.status, 
                                      app.deadline, 
                                      val, 
                                      reminderDateStr, 
                                      false, 
                                      ""
                                    );
                                  }}
                                  className="px-1.5 py-0.5 font-bold font-mono text-[8px] bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer"
                                >
                                  Go
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-[10px] text-slate-600 font-sans">
                            <div className="flex items-center justify-between text-[9px] text-slate-500">
                              <span>Reminder: {app.followUpReminderDate}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateStatus(
                                    app.id,
                                    app.status,
                                    app.deadline,
                                    undefined,
                                    undefined,
                                    undefined,
                                    undefined
                                  );
                                }}
                                className="text-[8px] text-red-500 hover:underline cursor-pointer"
                                title="Reset reminder timer"
                              >
                                [Reset]
                              </button>
                            </div>

                            {app.followUpCompleted ? (
                              <div className="flex items-center space-x-1.5 text-emerald-800 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 text-[9px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="leading-tight font-medium">✓ Checked: Follow-up complete! Logs bound safely.</span>
                              </div>
                            ) : (
                              (() => {
                                const daysLeft = getDaysRemainingForFollowUp(app.followUpReminderDate);
                                const isOverdue = daysLeft <= 0;
                                return (
                                  <div className="space-y-2">
                                    {isOverdue ? (
                                      <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-[9px]">
                                        <div className="flex items-start space-x-1 text-amber-900 font-bold leading-normal">
                                          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                                          <span>Nudge: It's been {Math.abs(daysLeft)}d overdue since your reminder! Nudge recruiter email now.</span>
                                        </div>
                                        
                                        <div className="mt-2 flex items-center justify-between gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleGenerateDraft(app)}
                                            className="flex-1 py-1 px-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[8.5px] rounded border border-purple-750 transition-all cursor-pointer flex items-center justify-center space-x-1"
                                          >
                                            <span>✉ Draft via AI</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              onUpdateStatus(
                                                app.id,
                                                app.status,
                                                app.deadline,
                                                app.followUpDays,
                                                app.followUpReminderDate,
                                                true,
                                                "Follow-up email dispatched to contact"
                                              );
                                            }}
                                            className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[8.5px] rounded border border-emerald-750 transition-all cursor-pointer"
                                          >
                                            Mark Sent ✓
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                                        <span className="italic leading-normal text-slate-450">⏰ Reminding you in {daysLeft} days.</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onUpdateStatus(
                                              app.id,
                                              app.status,
                                              app.deadline,
                                              app.followUpDays,
                                              app.followUpReminderDate,
                                              true,
                                              "Follow-up email sent early"
                                            );
                                          }}
                                          className="text-[8px] font-bold text-emerald-600 hover:underline cursor-pointer"
                                        >
                                          Mark Sent early
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Move controls arrows */}
                    <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                      <button
                        onClick={() => shiftStatus(app.id, col.label, "prev")}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 border border-slate-200 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                        title="Move to previous stage"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>

                      <span className="text-[9px] text-slate-400 font-medium font-mono">Drag card</span>

                      <button
                        onClick={() => shiftStatus(app.id, col.label, "next")}
                        disabled={idx === COLUMNS.length - 1}
                        className="p-1 rounded bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 border border-slate-200 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                        title="Move to next stage"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

                {columnApps.length === 0 && (
                  <div className="flex-1 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center py-10 px-2 text-center text-slate-300">
                    <ClipboardList className="h-8 w-8 text-slate-200 mb-2" />
                    <p className="text-[10px] italic">Empty zone</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Highlighted Email Draft modal */}
      {draftDialogApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl max-w-lg w-full flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-slate-800">
                    AI Follow-up Draft Generator
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    TAILORED FOR: {draftDialogApp.company.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftDialogApp(null);
                  setCopiedDraft(false);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-left">
              <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Target Recipient</span>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-700 truncate mr-2">
                  <span className="font-bold text-slate-900">{draftDialogApp.recipientName || "Hiring Manager"}</span>
                  <span className="font-mono text-slate-400 ml-1.5">&lt;{draftDialogApp.recipientEmail || "hiring@company.com"}&gt;</span>
                </div>
                <span className="text-[8px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold font-mono shrink-0">
                  OUTBOX GMAIL
                </span>
              </div>
            </div>
             <div className="space-y-1 text-left">
              <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Generated Draft Content</span>
              <textarea
                value={generatedDraftText}
                onChange={(e) => setGeneratedDraftText(e.target.value)}
                disabled={isDraftLoading}
                rows={11}
                className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 border border-slate-950 rounded-xl focus:ring-1 focus:ring-purple-500 focus:outline-none disabled:opacity-75"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={isDraftLoading}
                onClick={() => {
                  onUpdateStatus(
                    draftDialogApp.id,
                    draftDialogApp.status,
                    draftDialogApp.deadline,
                    draftDialogApp.followUpDays,
                    draftDialogApp.followUpReminderDate,
                    true,
                    "Follow-up email drafted and copied to clipboard."
                  );
                  navigator.clipboard.writeText(generatedDraftText);
                  setCopiedDraft(true);
                  setTimeout(() => {
                    setDraftDialogApp(null);
                    setCopiedDraft(false);
                  }, 1000);
                }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs rounded-xl border border-purple-700 shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isDraftLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Analyzing target role &amp; framing draft...</span>
                  </span>
                ) : copiedDraft ? (
                  <span>Copied ✓ Marked complete!</span>
                ) : (
                  <span>Copy to Clipboard &amp; Mark Complete ⚡</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
