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
  AlertCircle
} from "lucide-react";
import { Application, ApplicationStatus } from "../types";

interface KanbanBoardProps {
  applications: Application[];
  onUpdateStatus: (id: string, status: ApplicationStatus, deadline?: string) => Promise<void>;
}

const COLUMNS: Array<{ label: ApplicationStatus; color: string; bg: string; dot: string }> = [
  { label: "Saved", color: "text-slate-700 bg-slate-100", bg: "bg-slate-50/50", dot: "bg-slate-400" },
  { label: "Applied", color: "text-purple-700 bg-purple-50", bg: "bg-purple-50/15", dot: "bg-purple-600" },
  { label: "Under Review", color: "text-blue-700 bg-blue-50", bg: "bg-blue-50/15", dot: "bg-blue-500" },
  { label: "Interview", color: "text-amber-700 bg-amber-50", bg: "bg-amber-50/15", dot: "bg-amber-400" },
  { label: "Offer", color: "text-emerald-700 bg-emerald-50", bg: "bg-emerald-50/15", dot: "bg-emerald-500" },
  { label: "Rejected", color: "text-rose-700 bg-rose-50", bg: "bg-rose-50/15", dot: "bg-rose-500" }
];

export default function KanbanBoard({
  applications,
  onUpdateStatus,
}: KanbanBoardProps) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
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

      {/* Grid columns */}
      <div id="kanban-grid-cols" className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {COLUMNS.map((col, idx) => {
          const columnApps = applications.filter(a => a.status === col.label);
          return (
            <div 
              key={idx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.label)}
              className={`rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col space-y-4 min-h-[500px] transition-all bg-white`}
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
                {columnApps.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-205 shadow-xs text-left cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all relative group"
                  >
                    <h5 className="font-bold text-slate-850 text-xs line-clamp-1 leading-snug">{app.jobTitle}</h5>
                    <p className="text-[11px] text-purple-700 font-bold truncate mt-0.5">{app.company}</p>

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
                  </div>
                ))}

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
    </div>
  );
}
