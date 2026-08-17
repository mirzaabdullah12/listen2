'use client';

import type { TranscriptionRecord } from '@/types';
import { LANGUAGE_LABELS } from '@/types';
import { downloadTranscription } from '@/lib/downloadManager';

interface TranscriptionDetailProps {
  record: TranscriptionRecord | null;
}

export function TranscriptionDetail({ record }: TranscriptionDetailProps) {
  if (!record) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-600 py-4 text-center">
        Select a transcription to view it.
      </p>
    );
  }

  const date = new Date(record.createdAt).toLocaleString();
  const duration = `${record.durationSeconds}s`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">{date} · {LANGUAGE_LABELS[record.language]} · {duration}</span>
        </div>
        <button
          onClick={() => downloadTranscription(record)}
          className="min-h-[44px] rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Download transcription as text file"
        >
          Download .txt
        </button>
      </div>
      <div
        className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-base leading-relaxed whitespace-pre-wrap text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        aria-label="Full transcription text"
      >
        {record.text || <span className="text-gray-400">(no text)</span>}
      </div>
    </div>
  );
}
