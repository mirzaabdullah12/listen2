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
  const [historyOpen, setHistoryOpen] = useState(false);

  const sessionIdRef = useRef<string>(uuidv4());
  const sessionStartRef = useRef<number>(0);
  const finalTextRef = useRef('');

  useEffect(() => {
    getAllRecords()
      .then(setHistory)
      .catch(() => setError('Failed to load history.'));
  }, [setHistory, setError]);

  const handleInterim = useCallback((text: string) => setInterimText(text), []);

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
    setSelectedRecord(null);
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
        setSelectedRecord(record); // auto-select the new recording
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
      <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold text-base" style={{ color: 'var(--text)' }}>ListenAI</span>
        </div>
        <LanguageSelector value={selectedLanguage} onChange={setLanguage} disabled={isRecording || isSaving} />
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-4 py-6 max-w-lg mx-auto w-full">

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {!isSupported && (
            <div className="rounded-2xl px-4 py-3 text-sm text-center"
              style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', color: '#ffc107' }}>
              Use Chrome or Edge for speech recognition
            </div>
          )}

          {/* Recorder */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <RecordingControls
              isRecording={isRecording}
              elapsedSeconds={elapsedSeconds}
              onStart={handleStart}
              onStop={handleStop}
              disabled={isSaving || !isSupported}
            />
          </div>

          {/* Live transcript */}
          <LiveTranscriptionPanel text={displayText} isRecording={isRecording} isTranscribing={isSaving} />

          {/* Latest recording detail (auto shown after stop) */}
          {selectedRecord && !isRecording && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Latest Recording
              </p>
              <TranscriptionDetail record={selectedRecord} />
            </div>
          )}

          {/* History section */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              style={{ background: 'var(--surface)' }}
            >
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                History
                {history.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    {history.length}
                  </span>
                )}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{historyOpen ? '▲' : '▼'}</span>
            </button>

            {historyOpen && (
              <div className="px-4 pb-4 pt-2" style={{ background: 'var(--surface)' }}>
                <HistoryList
                  records={history}
                  selectedId={selectedRecord?.id ?? null}
                  onSelect={setSelectedRecord}
                  onDelete={handleDelete}
                />
                {selectedRecord && history.some(r => r.id === selectedRecord.id) && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <TranscriptionDetail record={selectedRecord} />
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
