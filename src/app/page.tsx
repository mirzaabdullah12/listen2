'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAppStore } from '@/store/appStore';
import { saveRecord, getAllRecords, deleteRecord } from '@/lib/historyStore';
import { LanguageSelector } from '@/components/LanguageSelector';
import { RecordingControls } from '@/components/RecordingControls';
import { LiveTranscriptionPanel } from '@/components/LiveTranscriptionPanel';
import { ErrorBanner } from '@/components/ErrorBanner';
import { HistoryList } from '@/components/HistoryList';
import { TranscriptionDetail } from '@/components/TranscriptionDetail';
import type { TranscriptionRecord } from '@/types';

export default function Home() {
  const {
    selectedLanguage, liveText, error, history,
    setLanguage, appendLiveText, clearLiveText,
    setError, setHistory,
  } = useAppStore();

  const [selectedRecord, setSelectedRecord] = useState<TranscriptionRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [interimText, setInterimText] = useState('');

  const sessionIdRef = useRef<string>(uuidv4());
  const sessionStartRef = useRef<number>(0);
  const finalTextRef = useRef('');

  useEffect(() => {
    getAllRecords()
      .then(setHistory)
      .catch(() => setError('Failed to load transcription history.'));
  }, [setHistory, setError]);

  const handleInterim = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  const handleFinal = useCallback((text: string) => {
    finalTextRef.current = text;
    clearLiveText();
    appendLiveText(text);
    setInterimText('');
  }, [clearLiveText, appendLiveText]);

  const { isRecording, isSupported, elapsedSeconds, start, stop } = useSpeechRecognition({
    language: selectedLanguage,
    onInterim: handleInterim,
    onFinal: handleFinal,
    onError: setError,
  });

  const handleStart = useCallback(() => {
    sessionIdRef.current = uuidv4();
    sessionStartRef.current = Date.now();
    finalTextRef.current = '';
    clearLiveText();
    setInterimText('');
    start();
  }, [clearLiveText, start]);

  const handleStop = useCallback(async () => {
    stop();
    setIsSaving(true);

    const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const finalText = finalTextRef.current || useAppStore.getState().liveText;

    if (finalText.trim()) {
      const record: TranscriptionRecord = {
        id: sessionIdRef.current,
        sessionId: sessionIdRef.current,
        language: selectedLanguage,
        text: finalText.trim(),
        durationSeconds: duration,
        createdAt: Date.now(),
      };

      try {
        await saveRecord(record);
        const updated = await getAllRecords();
        setHistory(updated);
      } catch {
        setError('Failed to save transcription. Your browser storage may be full.');
      }
    }

    setIsSaving(false);
  }, [stop, selectedLanguage, setHistory, setError]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteRecord(id);
      const updated = await getAllRecords();
      setHistory(updated);
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch {
      setError('Failed to delete transcription. Please try again.');
    }
  }, [setHistory, setError, selectedRecord]);

  // Combined display: final confirmed + current interim
  const displayText = liveText + (interimText && interimText !== liveText
    ? (liveText ? ' ' : '') + interimText
    : '');

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Multilingual Transcription
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Live transcription in English, Spanish, French, or Urdu — no API limits.
          </p>
        </div>

        {!isSupported && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Your browser does not support speech recognition. Please use Chrome or Edge.
          </div>
        )}

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <LanguageSelector
            value={selectedLanguage}
            onChange={setLanguage}
            disabled={isRecording || isSaving}
          />
          <RecordingControls
            isRecording={isRecording}
            elapsedSeconds={elapsedSeconds}
            onStart={handleStart}
            onStop={handleStop}
            disabled={isSaving || !isSupported}
          />
          {isSaving && (
            <span className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">Saving…</span>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <LiveTranscriptionPanel
            text={displayText}
            isRecording={isRecording}
            isTranscribing={isSaving}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">History</h2>
            <HistoryList
              records={history}
              selectedId={selectedRecord?.id ?? null}
              onSelect={setSelectedRecord}
              onDelete={handleDelete}
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Detail</h2>
            <TranscriptionDetail record={selectedRecord} />
          </div>
        </div>

      </div>
    </main>
  );
}
