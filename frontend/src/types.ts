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
  openDate?: string;
  closingDate?: string;
  applyLink?: string;
  contactInfo?: string;
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
  followUpDays?: number;
  followUpReminderDate?: string;
  followUpCompleted?: boolean;
  followUpNotes?: string;
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

export interface LinkedInExperience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface LinkedInEducation {
  institution: string;
  degree: string;
  year: string;
}

export interface LinkedInCertification {
  name: string;
}

export interface LinkedInProfile {
  id: string;
  profileUrl: string;
  fullName: string;
  headline: string;
  about: string;
  languages?: string[];
  projects?: Array<{ name: string; description: string }>;
  awards?: string[];
  volunteerExperience?: Array<{ role: string; organization: string }>;
  recommendations?: string[];
  endorsements?: string[];
  skills?: string[];
  experience?: LinkedInExperience[];
  education?: LinkedInEducation[];
  certifications?: LinkedInCertification[];
  created_at: string;
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  summary: string;
  skills: string[];
  experience: any[];
  education: any[];
  certifications: any[];
}

export interface ProfileMergeReport {
  success: boolean;
  unifiedProfileId: string;
  unifiedProfile: CandidateProfile;
  missingInformationReport: {
    missing_from_resume: string[];
    missing_from_linkedin: string[];
  };
  confidenceScore: number;
}

export interface RecruiterContact {
  id: string;
  company: string;
  name: string;
  role: string;
  email: string;
  contactInfo: string;
}

export interface FollowUpTracking {
  id: string;
  applicationId: string;
  followUpType: '3-day' | '7-day' | '14-day';
  scheduledDate: string;
  emailBody: string;
  status: 'Scheduled' | 'Approved' | 'Sent';
}

