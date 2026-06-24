/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  UserCheck, 
  RefreshCw, 
  HelpCircle, 
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Bot,
  Brain,
  X,
  Volume2
} from "lucide-react";
import { ChatMessage, Resume, Job } from "../types";

interface AIChatCoachProps {
  resumes: Resume[];
  jobs: Job[];
  activeResumeId: string;
  onSendMessage: (messages: ChatMessage[]) => Promise<string>;
}

export default function AIChatCoach({
  resumes,
  jobs,
  activeResumeId,
  onSendMessage,
}: AIChatCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-msg",
      role: "assistant",
      content: "Hello! I am CareerPilot AI Coach. I am fully integrated into our autonomous agent fleet. Select one of the coaches below or type a custom command and let's get you hired:",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'interview' | 'resume' | 'outreach'>('interview');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const starterPrompts = {
    interview: [
      "Let's do a mock interview mock question for a Senior Product Developer role.",
      "Explain how to communicate past production downtime during a developer interview.",
      "Give me a coding quiz regarding React 19 performance optimizations.",
    ],
    resume: [
      "Improve my resume professional summary paragraph for enterprise-level jobs.",
      "Rewrite my current project achievements to highlight quantitative business performance metrics.",
      "Suggest 3 certifications to bypass filters for cloud automation roles.",
    ],
    outreach: [
      "Craft a short follow-up email template to send 3 days after a tech interview.",
      "Draft a concise LinkedIn connection note to send directly to a technical hiring manager.",
      "Generate an introductory email seeking informational chat regarding enterprise hiring tracks."
    ]
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || userInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setUserInput("");
    setIsLoading(true);

    try {
      const historyToSend = [...messages, userMsg];
      const reply = await onSendMessage(historyToSend);
      
      const assistantMsg: ChatMessage = {
        id: "msg-as-" + Date.now(),
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "msg-err-" + Date.now(),
          role: "assistant",
          content: "I ran into a server communication speed bump: " + e.message,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "init-msg",
        role: "assistant",
        content: "Draft optimized! Chat history reset. How can I assist with your application optimization tasks now?",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div id="chat-coach-root" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[550px] text-left">
      {/* Sidebar - Coach selects */}
      <div className="md:col-span-4 bg-slate-50 border-r border-slate-200 p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Bot className="h-4 w-4 text-purple-600" />
              <span>Coaching Core Modules</span>
            </h4>
            <p className="text-[10px] text-slate-500 font-light mt-0.5 leading-tight">Switch agent persona focuses easily</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setActiveMode('interview')}
              className={`w-full p-3 rounded-2xl border text-xs font-bold text-left flex items-start space-x-3 transition-all cursor-pointer ${
                activeMode === 'interview' 
                  ? "bg-purple-600 text-white border-purple-600 shadow-md scale-[1.01]" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-purple-300"
              }`}
            >
              <Brain className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p>Mock Interview Coach</p>
                <p className={`text-[9px] mt-0.5 font-normal leading-tight ${activeMode === 'interview' ? "text-purple-200" : "text-slate-450"}`}>
                  Rehearse live questions and get metrics-focused critique feedback.
                </p>
              </div>
            </button>

            <button
              onClick={() => setActiveMode('resume')}
              className={`w-full p-3 rounded-2xl border text-xs font-bold text-left flex items-start space-x-3 transition-all cursor-pointer ${
                activeMode === 'resume' 
                  ? "bg-purple-600 text-white border-purple-600 shadow-md scale-[1.01]" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-purple-300"
              }`}
            >
              <Award className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p>Resume Proofing Agent</p>
                <p className={`text-[9px] mt-0.5 font-normal leading-tight ${activeMode === 'resume' ? "text-purple-200" : "text-slate-450"}`}>
                  Highlight technical achievements & fix formatting index.
                </p>
              </div>
            </button>

            <button
              onClick={() => setActiveMode('outreach')}
              className={`w-full p-3 rounded-2xl border text-xs font-bold text-left flex items-start space-x-3 transition-all cursor-pointer ${
                activeMode === 'outreach' 
                  ? "bg-purple-600 text-white border-purple-600 shadow-md scale-[1.01]" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-purple-300"
              }`}
            >
              <Layers className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p>Follow-Up & Outbox Studio</p>
                <p className={`text-[9px] mt-0.5 font-normal leading-tight ${activeMode === 'outreach' ? "text-purple-200" : "text-slate-450"}`}>
                  Draft post-interview letters & high-conversion reminders.
                </p>
              </div>
            </button>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="w-full py-2.5 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-[10px] uppercase font-mono border border-slate-250 cursor-pointer text-center"
        >
          Clear Current Conversation
        </button>
      </div>

      {/* Main chat viewport */}
      <div className="md:col-span-8 flex flex-col justify-between h-full bg-white relative">
        {/* Messages list container */}
        <div id="messages-list" className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px]">
          {messages.map((m) => (
            <div 
              key={m.id}
              className={`flex items-start space-x-3 max-w-[85%] ${
                m.role === 'user' ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user' ? "bg-purple-600 text-white font-bold text-xs" : "bg-purple-100 text-purple-700"
              }`}>
                {m.role === 'user' ? "ME" : <Bot className="h-4.5 w-4.5" />}
              </div>
              <div className={`p-4 rounded-3xl text-xs leading-loose ${
                m.role === 'user' 
                  ? "bg-purple-600 text-white rounded-tr-none font-medium" 
                  : "bg-slate-50 border border-slate-200 rounded-tl-none text-slate-800"
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <span className={`text-[9px] font-mono block mt-2 text-right ${m.role === 'user' ? "text-purple-200" : "text-slate-400"}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-3 pl-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Sparkles className="h-4.5 w-4.5 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl rounded-tl-none">
                <span className="text-xs text-slate-400 italic font-mono">Agent analyzing parameters, thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starter prompts list drawers */}
        <div className="px-5 pb-2 bg-white flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {starterPrompts[activeMode].map((p, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-xl text-[10px] text-left max-w-[280px] truncate border border-slate-200 cursor-pointer font-medium"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Action input panel */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center space-x-3">
          <input
            id="chat-user-textbox"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder={`Ask our ${activeMode === 'interview' ? 'Interview Specialist' : activeMode === 'resume' ? 'Resume Proofreader' : 'Outbox Studio'} anything...`}
            className="flex-1 text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20"
          />
          <button
            id="btn-send-chat"
            onClick={() => handleSend()}
            disabled={!userInput.trim() || isLoading}
            className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
