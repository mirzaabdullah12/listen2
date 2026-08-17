'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAppStore } from '@/store/appStore';
import { streamTranscription } from '@/lib/transcriberClient';
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

  const sessionIdRef = useRef<string>(uuidv4());
  const sessionStartRef = useRef<number>(0);
  const languageRef = useRef(selectedLanguage);
  const isTranscribingChunkRef = useRef(false); // prevent overlapping chunk requests
  useEffect(() => { languageRef.current = selectedLanguage; }, [selectedLanguage]);

  useEffect(() => {
    getAllRecords()
      .then(setHistory)
      .catch(() => setError('Failed to load transcription history.'));
  }, [setHistory, setError]);

  // Called every 5s during recording — appends partial transcription live
  const handleChunk = useCallback(async (blob: Blob) => {
    if (isTranscribingChunkRef.current) return; // skip if previous chunk still processing
    isTranscribingChunkRef.current = true;
    const lang = languageRef.current;
    const sid = sessionIdRef.current;
    try {
      for await (const text of streamTranscription(blob, lang, sid)) {
        appendLiveText(text);
      }
    } catch {
      // silently ignore live chunk errors — don't interrupt recording
    } finally {
      isTranscribingChunkRef.current = false;
    }
  }, [appendLiveText]);

  // Called once with full audio when recording stops — saves to history
  const handleComplete = useCallback(async (blob: Blob) => {
    const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const id = sessionIdRef.current;
    const lang = languageRef.current;

    setIsSaving(true);

    // Get whatever text we have (from live chunks)
    let finalText = useAppStore.getState().liveText;

    // Only do a final transcription pass if zero live text came through
    if (!finalText.trim()) {
      try {
        for await (const text of streamTranscription(blob, lang, id)) {
          appendLiveText(text);
        }
        finalText = useAppStore.getState().liveText;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transcription error.';
        setError(msg);
      }
    }

    const record: TranscriptionRecord = {
      id,
      sessionId: id,
      language: lang,
      text: finalText,
      durationSeconds: duration,
      createdAt: Date.now(),
    };

    sessionIdRef.current = uuidv4(); // fresh id for next session

    try {
      await saveRecord(record);
      const updated = await getAllRecords();
      setHistory(updated);
    } catch {
      setError('Failed to save transcription. Your browser storage may be full.');
    }

    setIsSaving(false);
  }, [appendLiveText, setError, setHistory]);

  const { isRecording, elapsedSeconds, error: recorderError, start, stop } = useAudioRecorder({
    onChunk: handleChunk,
    onComplete: handleComplete,
  });

  useEffect(() => {
    if (recorderError) setError(recorderError);
  }, [recorderError, setError]);

  const handleStart = useCallback(async () => {
    sessionStartRef.current = Date.now();
    clearLiveText();
    await start();
  }, [clearLiveText, start]);

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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Multilingual Transcription
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Record audio and get live transcription in English, Spanish, French, or Urdu.
          </p>
        </div>

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
            onStop={stop}
            disabled={isSaving}
          />
          {isSaving && (
            <span className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
              Saving…
            </span>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <LiveTranscriptionPanel
            text={liveText}
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
