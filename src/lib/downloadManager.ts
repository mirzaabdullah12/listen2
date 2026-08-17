import type { TranscriptionRecord } from '@/types';
import { LANGUAGE_LABELS } from '@/types';

export function downloadTranscription(record: TranscriptionRecord): void {
  const blob = new Blob([record.text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date(record.createdAt)
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d{3}Z$/, '');

  const filename = `transcription-${record.language}-${timestamp}.txt`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export function getLanguageLabel(record: TranscriptionRecord): string {
  return LANGUAGE_LABELS[record.language];
}
