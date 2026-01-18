
export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface User {
  name: string;
  email: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  focusArea: string;
  culturalContext: string;
  suggestedVocabulary: string[];
  isCompleted: boolean;
  difficulty: ProficiencyLevel;
  specificRoleplayPrompt?: string; // New: To guide the AI during practice
}

export interface RootWord {
  id: string;
  word: string;
  phonetic?: string;
  meaning: string;
  culturalSignificance: string;
  languageCode: string;
}

export interface IdentityProfile {
  heritageTitle: string;
  primaryDialect: string;
  culturalGoal: string;
  userOrigin: string;
  parentsOrigin: string;
  motivation: string;
  accentStyle: string;
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
  translation?: string;
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

export interface SessionRecord {
  id: string;
  date: number;
  languageCode: string;
  languageName: string;
  overallScore: number;
  feedbackPreview: string;
}

export enum AppState {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  SURVEY = 'SURVEY',
  DASHBOARD = 'DASHBOARD',
  ONBOARDING = 'ONBOARDING',
  CONVERSATION = 'CONVERSATION',
  EVALUATION = 'EVALUATION',
  HERITAGE_ALBUM = 'HERITAGE_ALBUM',
  LESSON_PLANS = 'LESSON_PLANS'
}
