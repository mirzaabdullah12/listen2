export type Language = 'en' | 'es' | 'fr' | 'ur';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ur: 'Urdu',
};

export interface TranscriptionRecord {
  id: string;
  sessionId: string;
  language: Language;
  text: string;
  durationSeconds: number;
  createdAt: number; // Unix ms timestamp
}

export interface AppState {
  selectedLanguage: Language;
  isRecording: boolean;
  liveText: string;
  currentSessionId: string | null;
  error: string | null;
  history: TranscriptionRecord[];
}
