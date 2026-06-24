/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ChevronRight, 
  AlertCircle,
  FileText,
  Search,
  Check,
  Building
} from "lucide-react";
import { Application } from "../types";

interface CRMBoardProps {
  applications: Application[];
  onUpdateStatus: (
    id: string, 
    status: any, 
    outreachEmail?: string, 
    coverLetter?: string, 
    deadline?: string,
    followUpDays?: number,
    followUpReminderDate?: string,
    followUpCompleted?: boolean,
    followUpNotes?: string
  ) => Promise<void>;
  onNavigateToApp?: (app: Application) => void;
}

export default function CRMBoard({
  applications,
  onUpdateStatus,
  onNavigateToApp
}: CRMBoardProps) {
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState("");

  // Filter items that actually have follow-up reminder configurations
  const followUpApps = applications.filter(a => a.followUpReminderDate);

  // Filter based on completion status
  const filteredApps = followUpApps.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
                          
    if (!matchesSearch) return false;

    if (filterType === 'pending') {
      return !app.followUpCompleted;
    } else if (filterType === 'completed') {
      return !!app.followUpCompleted;
    }
    return true;
  });

  const handleToggleComplete = async (app: Application) => {
    const isCompleted = !app.followUpCompleted;
    try {
      await onUpdateStatus(
        app.id, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        isCompleted
      );
    } catch (e) {
      console.error("Failed to toggle follow-up status", e);
    }
  };

  const isOverdue = (dateStr: string | undefined, isCompleted: boolean | undefined) => {
    if (!dateStr || isCompleted) return false;
    const reminderDate = new Date(dateStr);
    const today = new Date();
    // Compare dates ignoring time
    reminderDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return reminderDate < today;
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#00205B] text-white rounded-3xl p-8 relative overflow-hidden shadow-md">
        <div className="space-y-2 z-10 relative">
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30">
            Relationship Management
          </span>
          <h1 className="text-3xl font-black tracking-tight">
            Follow-up CRM Board
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-light">
            Stay on top of recruiter conversations. Manage scheduled reminders, view notes, and mark communications as complete.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pb-2">
          {/* Tab Filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setFilterType('pending')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                filterType === 'pending' 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Pending ({followUpApps.filter(a => !a.followUpCompleted).length})</span>
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                filterType === 'completed' 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed ({followUpApps.filter(a => a.followUpCompleted).length})</span>
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                filterType === 'all' 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>All ({followUpApps.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Search by company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-slate-200 focus:border-[#00205B] rounded-xl pl-9 pr-4 py-2.5 outline-none bg-slate-50/50"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Table View */}
        <div className="border border-slate-150 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider">
                <th className="py-4 px-6">Company</th>
                <th className="py-4 px-6">Role / Position</th>
                <th className="py-4 px-6">Follow-up Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Mark Complete</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                    {followUpApps.length === 0 ? (
                      <div className="space-y-3">
                        <Calendar className="h-8 w-8 text-slate-350 mx-auto" />
                        <p>No follow-up dates configured yet.</p>
                        <p className="text-[10px] text-slate-400 not-italic max-w-md mx-auto">
                          Configure a follow-up date and note inside the <strong>Approval Drafts Queue</strong> view after drafting outreach letters to track scheduled outreach here.
                        </p>
                      </div>
                    ) : (
                      <p>No matching applications found.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const overdue = isOverdue(app.followUpReminderDate, app.followUpCompleted);
                  return (
                    <tr key={app.id} className="border-b border-slate-150 hover:bg-slate-50/50 text-xs transition-colors">
                      {/* Company Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <Building className="h-4 w-4 text-blue-800" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">{app.company}</span>
                            <span className="text-[10px] text-slate-450">{app.location}</span>
                          </div>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {app.jobTitle}
                      </td>

                      {/* Reminder Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className={`h-4 w-4 ${overdue ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
                          <span className={`font-mono font-medium ${
                            app.followUpCompleted 
                              ? "text-slate-400 line-through" 
                              : overdue 
                              ? "text-rose-600 font-bold" 
                              : "text-slate-700"
                          }`}>
                            {app.followUpReminderDate ? new Date(app.followUpReminderDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : "Not set"}
                          </span>
                          {overdue && (
                            <span className="text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded uppercase shrink-0">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Application Status */}
                      <td className="py-4 px-6">
                        <span className={`text-[9.5px] px-2 py-0.5 rounded-lg border font-mono font-bold uppercase ${
                          app.status === 'Applied' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : app.status === 'Interview'
                            ? 'bg-amber-50 text-amber-805 border-amber-100'
                            : app.status === 'Offer'
                            ? 'bg-emerald-50 text-emerald-808 border-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {app.status}
                        </span>
                      </td>

                      {/* Complete Checkbox Toggle */}
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(app)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-all cursor-pointer ${
                            app.followUpCompleted
                              ? "bg-emerald-500 border-emerald-600 text-white"
                              : "border-slate-300 hover:border-slate-400 bg-white"
                          }`}
                        >
                          {app.followUpCompleted && <Check className="h-3.5 w-3.5 font-black" />}
                        </button>
                      </td>

                      {/* Quick Navigate Link */}
                      <td className="py-4 px-6 text-right">
                        {onNavigateToApp && (
                          <button
                            type="button"
                            onClick={() => onNavigateToApp(app)}
                            className="text-purple-650 hover:text-purple-800 hover:underline flex items-center space-x-1 font-bold ml-auto cursor-pointer"
                          >
                            <span>Details</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Notes Preview Section for the Selected item */}
        {filteredApps.some(a => a.followUpNotes) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Selected Follow-up Notes Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.filter(a => a.followUpNotes).slice(0, 2).map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-slate-800">{app.company}</span>
                    <span className="font-mono text-slate-450">{app.followUpReminderDate}</span>
                  </div>
                  <p className="text-slate-600 italic text-[11px] leading-relaxed line-clamp-3">
                    &quot;{app.followUpNotes}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
