'use client';

import type { TranscriptionRecord } from '@/types';
import { LANGUAGE_LABELS } from '@/types';
import { downloadTranscription } from '@/lib/downloadManager';

export function TranscriptionDetail({ record }: { record: TranscriptionRecord | null }) {
  if (!record) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
        Select a recording to view
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date(record.createdAt).toLocaleString()} · {LANGUAGE_LABELS[record.language]} · {record.durationSeconds}s
        </span>
        <button
          onClick={() => downloadTranscription(record)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: 'rgba(77,255,176,0.1)',
            border: '1px solid rgba(77,255,176,0.3)',
            color: 'var(--green)',
          }}
        >
          ↓ Download
        </button>
      </div>
      <div
        className="max-h-64 overflow-y-auto rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        {record.text || <span style={{ color: 'var(--text-muted)' }}>(no speech)</span>}
      </div>
    </div>
  );
}
