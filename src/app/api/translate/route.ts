import { NextRequest, NextResponse } from 'next/server';
import type { Language } from '@/types';
import { LANGUAGE_LABELS } from '@/types';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

  const { text, targetLanguage } = await req.json() as { text: string; targetLanguage: Language };
  if (!text || !targetLanguage) return NextResponse.json({ error: 'Missing text or targetLanguage' }, { status: 400 });

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Translate the following text to ${LANGUAGE_LABELS[targetLanguage]}. Output ONLY the translated text, nothing else:\n\n${text}`
        }]
      }]
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err?.error?.message ?? 'Translation failed' }, { status: res.status });
  }

  const data = await res.json();
  const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return NextResponse.json({ translated });
}
