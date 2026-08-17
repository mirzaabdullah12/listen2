import { NextRequest, NextResponse } from 'next/server';
import type { Language } from '@/types';
import { LANGUAGE_LABELS } from '@/types';

const LANGUAGE_NAMES: Record<Language, string> = LANGUAGE_LABELS;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPrompt(language: Language): string {
  return `You are a highly sensitive professional speech transcription assistant.

Transcribe ALL spoken words from this audio to ${LANGUAGE_NAMES[language]}.

RULES:
- Transcribe EVERY word spoken, even if the voice is soft, quiet, or low volume
- Be sensitive to all voice levels — do not skip quiet speech
- IGNORE background noise (fans, machines, appliances) but capture ALL human speech
- If multiple speakers, prefix with "Speaker 1:", "Speaker 2:", etc.
- If there is truly NO human speech at all, respond with exactly: (no speech detected)
- Output ONLY the transcribed words — nothing else
- No descriptions, no summaries, no explanations — just the words spoken`;
}

async function callGemini(audioBase64: string, language: Language, apiKey: string): Promise<Response> {
  return fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
            { text: buildPrompt(language) },
          ],
        },
      ],
    }),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const chunkBlob = formData.get('chunk') as Blob | null;
  const language = (formData.get('language') as Language) || 'en';

  if (!chunkBlob) {
    return NextResponse.json({ error: 'Missing audio chunk' }, { status: 400 });
  }

  const arrayBuffer = await chunkBlob.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

  let geminiRes = await callGemini(audioBase64, language, apiKey);

  if (geminiRes.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    geminiRes = await callGemini(audioBase64, language, apiKey);
  }

  if (!geminiRes.ok) {
    const status = geminiRes.status;
    const body = await geminiRes.text().catch(() => '{}');
    let errorMsg = `Transcription failed (${status}).`;
    if (status === 429) errorMsg = 'Transcription quota exceeded. Please wait a moment and try again.';
    else if (status >= 500) errorMsg = 'Gemini API is unavailable. Please try again later.';
    return NextResponse.json({ error: errorMsg, detail: body }, { status });
  }

  const data = await geminiRes.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = rawText.trim();

  // Suppress non-speech responses silently
  if (!cleaned || cleaned.toLowerCase().includes('no speech detected')) {
    return new NextResponse('', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  return new NextResponse(cleaned, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
