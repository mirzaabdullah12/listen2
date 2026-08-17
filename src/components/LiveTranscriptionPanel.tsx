'use client';

import { useEffect, useRef } from 'react';

interface LiveTranscriptionPanelProps {
  text: string;
  isRecording: boolean;
  isTranscribing?: boolean;
}

export function LiveTranscriptionPanel({ text, isRecording, isTranscribing }: LiveTranscriptionPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [text]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Transcript
        </span>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--red)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Live
          </span>
        )}
        {isTranscribing && (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Saving
          </span>
        )}
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Live transcription"
        className="min-h-[140px] max-h-72 overflow-y-auto rounded-2xl p-4 text-base leading-relaxed"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: text ? 'var(--text)' : 'var(--text-muted)',
        }}
      >
        {text || 'Your transcription will appear here…'}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
