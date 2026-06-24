/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Search, 
  Settings, 
  UserCheck, 
  Mail, 
  Play, 
  Database,
  Terminal,
  ChevronRight,
  Code,
  Lock,
  Cpu,
  Monitor
} from "lucide-react";
import BrandLogo from "./BrandLogo";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const workflowSteps = [
    {
      title: "Resume Parser Agent",
      role: "Candidate Analysis",
      desc: "Deconstructs education, tech stacks, and soft competencies into a vector index.",
      icon: FileText,
      color: "from-[#00205B] to-[#0A3D91]",
      output: "Structured Profile: Senior dev (React, Node) • 5 Yrs Exp • BS CS"
    },
    {
      title: "Query Agent",
      role: "Job Acquisition Searcher",
      desc: "Searches LinkedIn, Wellfound, Indeed, and glassdoor for relevant vacancies.",
      icon: Search,
      color: "from-[#00205B] to-[#FFB800]",
      output: "Discovered 42 compatible positions matching preferred salaries"
    },
    {
      title: "Outreach & Researcher Agent",
      role: "Company Intelligence",
      desc: "Crawls directory logs to locate direct recruiter emails and profiles.",
      icon: Database,
      color: "from-[#FFB800] to-[#E29B00]",
      output: "Located Recruiter: sjenkins@stripe.com • Target HQ: SF"
    },
    {
      title: "Application Drafter Agent",
      role: "Tailored Content Studio",
      desc: "Synthesizes hyper-personalized outreach emails & targeted cover letters.",
      icon: Mail,
      color: "from-[#00205B] to-[#FFB800]",
      output: "Draft generated: 94% compatibility index cover letter"
    },
    {
      title: "Human Approval Gate",
      role: "Final Decision",
      desc: "Keeps you in full command. Approve, tweak, or edit drafts with one click.",
      icon: UserCheck,
      color: "from-emerald-450 to-[#00205B]",
      output: "Candidate approved cover letter & outreach. Trigger dispatch."
    }
  ];

  return (
    <div id="landing-container" className="min-h-screen bg-white text-slate-800 font-sans">
      {/* Sticky Premium White Navbar */}
      <nav id="landing-navbar" className="sticky top-0 z-50 bg-white/95 text-slate-800 backdrop-blur-md border-b border-slate-100 px-6 py-4 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <BrandLogo className="h-10 w-auto" showText={true} />
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#features-section" className="hover:text-[#00205B] transition-colors">Features</a>
            <a href="#workflow-section" className="hover:text-[#00205B] transition-colors">How It Works</a>
            <a href="#pricing-section" className="hover:text-[#00205B] transition-colors">Pricing</a>
            <a href="#about-section" className="hover:text-[#00205B] transition-colors">Enterprise</a>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              id="btn-nav-login"
              onClick={onLogin}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#00205B] transition-all cursor-pointer"
            >
              Log In
            </button>
            <button 
              id="btn-nav-signup"
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-[#FFB800] text-[#00205B] text-sm font-bold rounded-xl shadow-md hover:bg-[#E29B00] hover:scale-102 transition-all cursor-pointer"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Beautiful Crisp White Background and Subtle Shapes */}
      <header className="relative bg-white text-slate-800 overflow-hidden py-24 px-6 border-b border-slate-105">
        {/* Subtle Brand Color Accent Blobs */}
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#FFB800]/5 rounded-full filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00205B]/5 rounded-full filter blur-3xl opacity-60"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-xs font-semibold text-[#00205B] tracking-wider uppercase">
              <Sparkles className="h-4 w-4 text-[#FFB800]" />
              <span>Multi-Agent Autonomous Career Search</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#00205B]">
              Apply to Hundreds of Jobs with <span className="bg-gradient-to-r from-[#00205B] to-[#FFB800] bg-clip-text text-transparent">AI Agents</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 font-light leading-relaxed max-w-xl">
              Upload your resume once. Let AI analyze, match, personalize, and apply for jobs automatically. Get targeted outreach drafted natively in mins.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <button
                id="btn-hero-get-started"
                onClick={onGetStarted}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-[#00205B] hover:bg-[#00153D] text-white font-bold rounded-2xl shadow-lg transform hover:-translate-y-0.5 transition-all text-base cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                id="btn-hero-demo"
                onClick={onGetStarted}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-slate-50 hover:bg-slate-100 text-[#00205B] font-semibold rounded-2xl border border-slate-200 transition-all text-base cursor-pointer"
              >
                <Play className="h-4 w-4 fill-[#00205B] text-[#00205B] pr-0.5" />
                <span>Watch Real Agent Demo</span>
              </button>
            </div>

            <div className="flex items-center space-x-8 pt-6 border-t border-slate-100 text-xs text-slate-500 uppercase tracking-widest font-semibold font-mono">
              <div>⚡ Auto Resume Parsing</div>
              <div>•</div>
              <div>🔍 Live Email Discovery</div>
              <div>•</div>
              <div>💼 Approval Queue Gate</div>
            </div>
          </div>

          {/* Premium UI Mockup Float Drawer */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-yellow-500/20 rounded-3xl blur-2xl transform rotate-2"></div>
            
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl animate-fade-in text-slate-100 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-[10px] text-purple-300 font-semibold bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800">
                  CREW_AI_AGENT_BUSY
                </div>
              </div>

              {/* Console log simulate UI */}
              <div className="space-y-3.5 font-sans">
                <div className="flex items-start space-x-3 text-slate-300">
                  <div className="bg-purple-900 p-1.5 rounded text-white mt-0.5 shrink-0 font-mono">[01]</div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Skill Extraction Agent</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Scanned file: &quot;resume_v2.pdf&quot;. Detected React 19, TypeScript, node, PostgreSQL APIs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-slate-300">
                  <div className="bg-indigo-900 p-1.5 rounded text-white mt-0.5 shrink-0 font-mono">[02]</div>
                  <div>
                    <h4 className="font-bold text-sm text-yellow-300">Job Matcher Agent</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Compared credentials against Stripe Senior Full Stack Engineer. Match Rating calculated: <span className="text-emerald-400 font-bold">94% Overlap</span></p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-slate-300">
                  <div className="bg-blue-900 p-1.5 rounded text-white mt-0.5 shrink-0 font-mono">[03]</div>
                  <div>
                    <h4 className="font-bold text-sm text-purple-300">Email Discovery Agent</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Found direct hiring contact: <span className="text-white underline">sarah.jenkins@stripe.com</span>. Status output: Verified.</p>
                  </div>
                </div>

                {/* Floating Widget: Target matching */}
                <div className="mt-4 bg-gradient-to-r from-purple-900/90 to-indigo-950/90 border border-purple-500/30 p-4 rounded-2xl relative shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider font-mono">DRAFT GENERATOR ACTIVE</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono font-bold">READY</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2 italic font-serif leading-relaxed">
                    &quot;Dear Sarah, as a Full Stack Developer with heavy React 19 and custom schema optimization experience, I watched Stripe&apos;s API trajectory...&quot;
                  </p>
                  <div className="mt-3 flex justify-end space-x-2">
                    <span className="text-[10px] text-purple-300 bg-purple-950 px-2.5 py-1 rounded">Reject</span>
                    <span className="text-[10px] text-slate-900 bg-amber-400 px-2.5 py-1 rounded font-bold">Approve Dispatch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* floating absolute cards */}
            <div className="absolute -bottom-8 -left-8 bg-white text-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center space-x-3 animate-bounce">
              <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase font-mono">Matched score info</div>
                <div className="text-lg font-bold text-slate-900">Stripe: 94%</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Visual Agent Workflow section */}
      <section id="workflow-section" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="bg-blue-50 text-[#00205B] font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider inline-block">
            Autonomous Pipeline
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#00205B]">
            Meet the AgentOps CrewAI Agent Fleet
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            We deploy multiple hyper-specialized agents to handle the tedious aspects of the job hunt so you can focus entirely on rocking the interviews.
          </p>

          {/* Fully Interactive Steps Showcase - dark navy representing command console */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-12 bg-[#001D50] p-8 rounded-3xl relative">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveWorkflowStep(idx)}
                  className={`p-6 rounded-2xl text-left border cursor-pointer transition-all ${
                    activeWorkflowStep === idx 
                      ? "bg-gradient-to-b from-[#00205B] to-[#001035] border-[#FFB800] shadow-2xl scale-[1.02]" 
                      : "bg-[#001D50]/60 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-white font-bold text-base">{step.title}</h3>
                  <p className="text-[#FFB800] text-xs font-semibold font-mono mt-0.5">{step.role}</p>
                  <p className="text-blue-100/70 text-xs mt-2 line-clamp-3 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Active step display card details */}
          <div id="active-step-details" className="mt-8 bg-white border border-slate-200/80 rounded-3xl p-8 text-left max-w-3xl mx-auto transition-all shadow-sm">
            <h3 className="text-xl font-bold text-[#00205B] flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800] animate-ping"></span>
              <span>Active Agent Insights: {workflowSteps[activeWorkflowStep].title}</span>
            </h3>
            <p className="text-slate-600 text-sm mt-2">{workflowSteps[activeWorkflowStep].desc}</p>
            
            <div className="mt-5 bg-[#00205B] text-slate-100 p-4 rounded-xl font-mono text-xs border border-transparent flex items-center justify-between">
              <div>
                <span className="text-[#FFB800] font-bold">&#10148; agent_output_payload:</span>
                <span className="text-slate-250 ml-2">{workflowSteps[activeWorkflowStep].output}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Highlights / Features bento gird Section - White background */}
      <section id="features-section" className="py-24 bg-white px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#00205B]">
              Complete Autonomy. Zero Setup Pain.
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm">
              We leverage safe API endpoints, advanced Gemini LLM reasoning, and native inbox automation to lock direct interviews effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-200/60 text-left space-y-4">
              <div className="w-12 h-12 rounded-2.5xl bg-blue-50 text-[#00205B] flex items-center justify-center font-bold">
                <Terminal className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[#00205B]">AI Resume Optimizer</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Receive concrete improvement indexes customized precisely to target job criteria. Never send a loose resume again.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-200/60 text-left space-y-4">
              <div className="w-12 h-12 rounded-2.5xl bg-amber-50 text-[#FFB800] flex items-center justify-center font-bold">
                <Code className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[#00205B]">Integrated Job Search</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect directly to live search modules across top-tier databases. We scan locations, budgets, tech demands, and hybrid requirements.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-200/60 text-left space-y-4">
              <div className="w-12 h-12 rounded-2.5xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[#00205B]">Secure Privacy Gates</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your data stays private. We compile all generated drafts inside our approval queue before outgoing mail dispatches leave.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - White background */}
      <section id="pricing-section" className="py-24 bg-white px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#00205B]">Transparent Pricing Plan</h2>
            <p className="text-slate-600 text-sm">Start applying with your AI autonomous crew today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
            {/* Free */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 relative space-y-6 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-[#00205B]">Free Pilot</h3>
                <p className="text-slate-500 text-xs">Test basic agent cycles on your resumes</p>
              </div>
              <div className="text-4xl font-black text-[#00205B]">$0<span className="text-xs text-slate-500 font-medium">/month</span></div>
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#00205B] shrink-0" />
                  <span>Parse 1 Resume</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#00205B] shrink-0" />
                  <span>Scan compatible test roles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#00205B] shrink-0" />
                  <span>Interactive Kanban tracker</span>
                </li>
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-white hover:bg-slate-50 text-[#00205B] border border-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Access Free Tier
              </button>
            </div>

            {/* Pro */}
            <div className="bg-[#00205B] text-white rounded-3xl p-8 relative space-y-6 ring-4 ring-[#00205B]/10">
              <div className="absolute top-4 right-4 bg-[#FFB800] text-[#00205B] font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Full-Stack Enterprise Pilot</h3>
                <p className="text-blue-200 text-xs">Unlock absolute agent automation</p>
              </div>
              <div className="text-4xl font-black text-white">$49<span className="text-xs text-blue-200 font-medium">/month</span></div>
              <ul className="space-y-3 text-xs text-blue-150">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#FFB800] shrink-0" />
                  <span>Multiple active resumes & parsing metrics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#FFB800] shrink-0" />
                  <span>10 CrewAI Agents fully automated</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#FFB800] shrink-0" />
                  <span>Generative cover letters & emails</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#FFB800] shrink-0" />
                  <span>24/7 AI Mock Interview Prep Chat</span>
                </li>
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-[#FFB800] hover:bg-[#E29B00] text-[#00205B] font-extrabold rounded-2xl text-xs shadow-md cursor-pointer"
              >
                Launch Professional Crew
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer info */}
      <footer id="about-section" className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-white/5 text-xs text-center font-mono">
        <div className="max-w-7xl mx-auto space-y-4">
          <p className="text-slate-300 font-semibold text-sm">CareerPilot AI • Made for Tomorrow&apos;s Workforce</p>
          <p>Powered by autonomous Node Express, React, and Gemini-3.5-Flash Core Models.</p>
          <p>&copy; 2026 CareerPilot AI. Autonomous enterprise-grade pipeline software.</p>
        </div>
      </footer>
    </div>
  );
}
