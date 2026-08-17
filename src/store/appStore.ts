import { create } from 'zustand';
import type { Language, TranscriptionRecord } from '@/types';
import { DEFAULT_LANGUAGE } from '@/lib/constants';

interface AppStore {
  selectedLanguage: Language;
  isRecording: boolean;
  liveText: string;
  currentSessionId: string | null;
  error: string | null;
  history: TranscriptionRecord[];

  setLanguage: (lang: Language) => void;
  setIsRecording: (val: boolean) => void;
  appendLiveText: (text: string) => void;
  clearLiveText: () => void;
  setError: (msg: string | null) => void;
  setHistory: (records: TranscriptionRecord[]) => void;
  setCurrentSessionId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedLanguage: DEFAULT_LANGUAGE,
  isRecording: false,
  liveText: '',
  currentSessionId: null,
  error: null,
  history: [],

  setLanguage: (lang) => set({ selectedLanguage: lang }),
  setIsRecording: (val) => set({ isRecording: val }),
  appendLiveText: (text) => set((s) => ({ liveText: s.liveText + text })),
  clearLiveText: () => set({ liveText: '' }),
  setError: (msg) => set({ error: msg }),
  setHistory: (records) => set({ history: records }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
}));
