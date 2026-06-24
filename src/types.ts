/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    description: string;
  }>;
  summary: string;
  technicalSkills: string[];
  softSkills: string[];
  certifications: string[];
}

export interface ScoringBreakdown {
  keywordScore: number;
  wordingScore: number;
  formattingScore: number;
  atsScore: number;
  keywordAnalysis: {
    detectedKeywords: string[];
    missingKeywords: string[];
    recommendations: string[];
  };
  wordingAnalysis: {
    weakPhrases: Array<{
      phrase: string;
      fix: string;
      reason: string;
    }>;
    strongActionVerbs: string[];
    recommendations: string[];
  };
  formattingAnalysis: {
    layoutIssues: string[];
    complianceChecklist: Array<{
      item: string;
      passed: boolean;
      tip: string;
    }>;
    recommendations: string[];
  };
}

export interface Resume {
  id: string;
  filename: string;
  content: string;
  parsedData?: ParsedResume;
  score: number;
  version: string;
  uploadDate: string;
  improvementSuggestions?: string[];
  scoringBreakdown?: ScoringBreakdown;
  tags?: string[];
  skills?: {
    technicalSkills: string[];
    tools: string[];
    certifications: string[];
    jobRelevantKeywords: string[];
  };
}

export interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  description: string;
  matchScore: number;
  matchAnalysis?: {
    strengths: string[];
    gapAnalysis: string[];
    recommendations: string[];
  };
  jobUrl: string;
  logo: string;
  companySize?: string;
  industry?: string;
  type: 'remote' | 'hybrid' | 'onsite';
  experienceLevel: string;
}

export type ApplicationStatus = 'Saved' | 'Applied' | 'Under Review' | 'Interview' | 'Offer' | 'Rejected';

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  status: ApplicationStatus;
  dateCreated: string;
  dateApplied?: string;
  deadline?: string;
  coverLetter?: string;
  outreachEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  historyLogs: Array<{
    id: string;
    timestamp: string;
    agentName: string;
    message: string;
  }>;
}

export interface AgentLog {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
  additionalData?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
