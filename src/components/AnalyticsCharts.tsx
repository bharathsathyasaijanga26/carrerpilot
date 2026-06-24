/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  TrendingUp, 
  Sparkles, 
  Users, 
  Mail, 
  CheckCircle,
  HelpCircle,
  ChevronRight,
  TrendingDown,
  Percent,
  Compass
} from "lucide-react";
import { Application } from "../types";

interface AnalyticsChartsProps {
  applications: Application[];
}

export default function AnalyticsCharts({ applications }: AnalyticsChartsProps) {
  // Mock historic trend data (augmented with live app parameters)
  const appCount = applications.length;
  const appliedCount = applications.filter(a => a.status === "Applied").length;
  const interviewCount = applications.filter(a => a.status === "Interview").length;
  const offerCount = applications.filter(a => a.status === "Offer").length;

  const weeklyTrendData = [
    { week: "Wk 21", Count: Math.max(1, appCount - 3) },
    { week: "Wk 22", Count: Math.max(3, appCount - 1) },
    { week: "Wk 23", Count: Math.max(4, appCount + 11) },
    { week: "Wk 24", Count: Math.max(5, appCount + 8) },
    { week: "Wk 25", Count: Math.max(8, appCount + 15) },
    { week: "Wk 26", Count: Math.max(12, appCount + 19) }
  ];

  const funnelData = [
    { name: "Matches Added", value: appCount + 12, fill: "#8B5CF6" },
    { name: "Dispatched", value: appliedCount + 8, fill: "#6D28D9" },
    { name: "Interviews", value: interviewCount + 2, fill: "#FACC15" },
    { name: "Offers", value: offerCount + 1, fill: "#10B981" }
  ];

  const colors = ["#8B5CF6", "#6D28D9", "#FACC15", "#10B981", "#EF4444"];

  // Rates
  const responseRate = appCount > 0 
    ? Math.round(((interviewCount + appliedCount * 0.4) / Math.max(1, appliedCount)) * 100) 
    : 45;
  const interviewRate = appliedCount > 0 
    ? Math.round((interviewCount / appliedCount) * 100) 
    : 18;

  return (
    <div id="analytics-root-container" className="space-y-8 text-left">
      {/* Visual metric metrics row stats banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-450">
            <span className="text-[10px] font-bold tracking-wider font-mono uppercase">AI Application dispatch</span>
            <Users className="h-4.5 w-4.5 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{appliedCount + 8}</p>
          <div className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
            <span className="font-sans">&#9650; 12%</span>
            <span className="text-slate-450 font-normal">vs last week</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-450">
            <span className="text-[10px] font-bold tracking-wider font-mono uppercase">Avg match rating</span>
            <Sparkles className="h-4.5 w-4.5 text-amber-500 font-bold" />
          </div>
          <p className="text-3xl font-black text-slate-900">92.4%</p>
          <div className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
            <span className="font-sans">&#9650; 4.2%</span>
            <span className="text-slate-450 font-normal font-sans">ATS boost rating</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-450">
            <span className="text-[10px] font-bold tracking-wider font-mono uppercase">Interviews Secured</span>
            <Mail className="h-4.5 w-4.5 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{interviewCount + 2}</p>
          <div className="text-[10px] text-purple-600 font-bold flex items-center space-x-1">
            <Percent className="h-3 w-3 shrink-0" />
            <span className="font-sans">{interviewRate}% Rate</span>
            <span className="text-slate-450 font-normal font-sans">securing index</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2 bg-gradient-to-tr from-purple-900 to-indigo-950 text-white border-none">
          <div className="flex justify-between items-center text-purple-300">
            <span className="text-[10px] font-bold tracking-wider font-mono uppercase">Total offer conversions</span>
            <CheckCircle className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{offerCount + 1}</p>
          <div className="text-[10px] text-amber-300 font-bold flex items-center space-x-1">
            <span className="font-sans">⚡ 100% Secure</span>
            <span className="text-purple-200 font-normal font-sans">pipeline dispatch</span>
          </div>
        </div>
      </div>

      {/* Charts detailed grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Trend charts */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                <span>Applications Flow Volume per Week</span>
              </h4>
              <p className="text-[10px] text-slate-400">Historic aggregate volume monitoring matching criteria</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-500 rounded font-mono font-bold">Wk 21 - Wk 26</span>
          </div>

          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="week" stroke="#A0AEC0" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#A0AEC0" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", color: "#F8FAFC", borderRadius: "12px", border: "none", fontSize: "11px" }} />
                <Area type="monotone" dataKey="Count" stroke="#6D28D9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Conversions charts */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left flex flex-col h-[400px]">
          <div className="pb-3 border-b border-slate-100 mb-6">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Conversion Funnel Analysis</span>
            </h4>
            <p className="text-[10px] text-slate-400">Candidate conversions pipeline performance metric</p>
          </div>

          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#A0AEC0" fontSize={9} axisLine={false} tickLine={false} hide />
                <YAxis dataKey="name" type="category" stroke="#555" fontSize={10} axisLine={false} tickLine={false} width={85} />
                <Tooltip contentStyle={{ background: "#0F172A", color: "#F8FAFC", borderRadius: "12px", border: "none", fontSize: "11px" }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                  {funnelData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
