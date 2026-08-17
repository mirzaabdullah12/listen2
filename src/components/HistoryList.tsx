'use client';

import type { TranscriptionRecord } from '@/types';
import { LANGUAGE_LABELS } from '@/types';

interface HistoryListProps {
  records: TranscriptionRecord[];
  selectedId: string | null;
  onSelect: (record: TranscriptionRecord) => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ records, selectedId, onSelect, onDelete }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        No transcription history yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" role="list" aria-label="Transcription history">
      {records.map((r) => {
        const preview = r.text.trim().slice(0, 80) || '(no text)';
        const date = new Date(r.createdAt).toLocaleString();
        const isSelected = r.id === selectedId;

        return (
          <li
            key={r.id}
            className={`flex items-start justify-between gap-2 rounded-lg border p-3 cursor-pointer transition
              ${isSelected
                ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950'
                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750'
              }`}
            onClick={() => onSelect(r)}
            aria-selected={isSelected}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">{date} · {LANGUAGE_LABELS[r.language]}</span>
              <span className="text-sm text-gray-800 dark:text-gray-100 truncate">{preview}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
              aria-label={`Delete transcription from ${date}`}
              className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
