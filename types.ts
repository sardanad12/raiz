
export interface User {
  name: string;
  email: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
}

export interface TranscriptionItem {
  speaker: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface EvaluationReport {
  overallScore: number;
  fluency: number;
  pronunciation: number;
  vocabulary: number;
  culturalNuance: number;
  feedback: string;
  strengths: string[];
  areasToImprove: string[];
}

export enum AppState {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  ONBOARDING = 'ONBOARDING',
  CONVERSATION = 'CONVERSATION',
  EVALUATION = 'EVALUATION'
}
