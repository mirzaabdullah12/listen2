'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Language } from '@/types';

// BCP-47 language codes for Web Speech API
const LANG_CODES: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  ur: 'ur-PK',
};

// Type shim for Web Speech API (not in all TS lib versions)
type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((event: any) => void) | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionType;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionOptions {
  language: Language;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (msg: string) => void;
}

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  isSupported: boolean;
  elapsedSeconds: number;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition({
  language,
  onInterim,
  onFinal,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTextRef = useRef('');
  const shouldRestartRef = useRef(false);

  const onInterimRef = useRef(onInterim);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  const createRecognition = useCallback((lang: Language): SpeechRecognitionType | null => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return null;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_CODES[lang];
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTextRef.current += transcript + ' ';
          onFinalRef.current(finalTextRef.current.trim());
        } else {
          interim = transcript;
        }
      }
      onInterimRef.current(finalTextRef.current + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      onErrorRef.current(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try { recognition.start(); } catch { /* already started */ }
      } else {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setIsRecording(false);
      }
    };

    return recognition;
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onErrorRef.current('Speech recognition is not supported. Please use Chrome or Edge.');
      return;
    }
    finalTextRef.current = '';
    shouldRestartRef.current = true;
    setElapsedSeconds(0);

    const recognition = createRecognition(language);
    if (!recognition) return;
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } catch {
      onErrorRef.current('Could not start speech recognition. Please allow microphone access.');
    }
  }, [isSupported, language, createRecognition]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { isRecording, isSupported, elapsedSeconds, start, stop };
}
