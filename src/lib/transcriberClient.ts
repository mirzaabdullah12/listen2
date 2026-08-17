import type { Language } from '@/types';

export class TranscriptionError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export async function* streamTranscription(
  chunk: Blob,
  language: Language,
  sessionId: string
): AsyncGenerator<string, void, unknown> {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('language', language);
  formData.append('sessionId', sessionId);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new TranscriptionError(response.status, body || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) yield text;
  }
}
