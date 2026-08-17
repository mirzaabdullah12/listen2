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
      <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
        No recordings yet
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {records.map((r) => {
        const preview = r.text.trim().slice(0, 60) || '(no speech)';
        const date = new Date(r.createdAt).toLocaleString();
        const isSelected = r.id === selectedId;

        return (
          <li
            key={r.id}
            onClick={() => onSelect(r)}
            className="flex items-start justify-between gap-2 rounded-xl p-3 cursor-pointer transition-all duration-150"
            style={{
              background: isSelected ? 'rgba(124,107,255,0.12)' : 'var(--surface-2)',
              border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {date} · {LANGUAGE_LABELS[r.language]} · {r.durationSeconds}s
              </span>
              <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{preview}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
              aria-label="Delete"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors hover:bg-red-500/20"
              style={{ color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
