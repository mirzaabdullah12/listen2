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
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  const sessionIdRef = useRef<string>(uuidv4());
  const sessionStartRef = useRef<number>(0);
  const finalTextRef = useRef('');

  useEffect(() => {
    getAllRecords()
      .then(setHistory)
      .catch(() => setError('Failed to load history.'));
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
        setError('Failed to save. Storage may be full.');
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
      setError('Failed to delete.');
    }
  }, [setHistory, setError, selectedRecord]);

  const displayText = liveText + (interimText && interimText !== liveText
    ? (liveText ? ' ' : '') + interimText : '');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold text-base tracking-tight" style={{ color: 'var(--text)' }}>ListenAI</span>
        </div>
        <LanguageSelector value={selectedLanguage} onChange={setLanguage} disabled={isRecording || isSaving} />
      </header>

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {(['record', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 text-sm font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab}
            {tab === 'history' && history.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                {history.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'record' && (
          <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-lg mx-auto w-full">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />

            {!isSupported && (
              <div className="w-full rounded-2xl px-4 py-3 text-sm text-center"
                style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', color: '#ffc107' }}>
                Use Chrome or Edge for speech recognition
              </div>
            )}

            <RecordingControls
              isRecording={isRecording}
              elapsedSeconds={elapsedSeconds}
              onStart={handleStart}
              onStop={handleStop}
              disabled={isSaving || !isSupported}
            />

            <div className="w-full">
              <LiveTranscriptionPanel text={displayText} isRecording={isRecording} isTranscribing={isSaving} />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-4 px-4 py-6 max-w-lg mx-auto w-full lg:max-w-4xl lg:flex-row">
            <div className="flex-1 flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Recordings</h2>
              <HistoryList
                records={history}
                selectedId={selectedRecord?.id ?? null}
                onSelect={setSelectedRecord}
                onDelete={handleDelete}
              />
            </div>
            {selectedRecord && (
              <div className="flex-1 flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Detail</h2>
                <TranscriptionDetail record={selectedRecord} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
