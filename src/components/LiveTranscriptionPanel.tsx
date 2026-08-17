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
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Live Transcription
        {isRecording && (
          <span className="ml-2 text-xs text-blue-500 animate-pulse">● Recording…</span>
        )}
        {isTranscribing && (
          <span className="ml-2 text-xs text-green-500 animate-pulse">● Transcribing…</span>
        )}
      </h2>
      <div
        role="log"
        aria-live="polite"
        aria-label="Live transcription output"
        className="min-h-[120px] max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-base leading-relaxed text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        {text || (
          <span className="text-gray-400 dark:text-gray-600">
            Transcription will appear here as you speak…
          </span>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
