'use client';

import { useState, useEffect } from 'react';
import type { TranscriptionRecord } from '@/types';
import type { Language } from '@/types';
import { LANGUAGE_LABELS, LANGUAGE_LABELS as LL } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import { downloadTranscription, downloadReport } from '@/lib/downloadManager';

export function TranscriptionDetail({ record }: { record: TranscriptionRecord | null }) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translatingTo, setTranslatingTo] = useState<Language | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Reset translation when switching records
  useEffect(() => {
    setTranslatedText(null);
    setTranslatingTo(null);
    setTranslateError(null);
  }, [record?.id]);

  if (!record) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
        Select a recording to view
      </p>
    );
  }

  const displayText = translatedText ?? record.text;
  const displayLang = translatingTo ?? record.language;

  async function handleTranslate(lang: Language) {
    if (!record) return;
    // If tapping original language, revert to original
    if (lang === record.language) {
      setTranslatedText(null);
      setTranslatingTo(null);
      return;
    }

    setIsTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: record.text, targetLanguage: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Translation failed');
      if (!data.translated) throw new Error('Empty translation returned');
      setTranslatedText(data.translated);
      setTranslatingTo(lang);
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }

  const reportRecord = translatedText
    ? { ...record, text: translatedText, language: translatingTo ?? record.language }
    : record;

  return (
    <div className="flex flex-col gap-4">
      {/* Meta */}
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {new Date(record.createdAt).toLocaleString()} · {LANGUAGE_LABELS[record.language]} · {record.durationSeconds}s
        · {record.text.trim().split(/\s+/).filter(Boolean).length} words
      </div>

      {/* Transcript */}
      <div
        className="max-h-48 overflow-y-auto rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        dir={displayLang === 'ur' ? 'rtl' : 'ltr'}
      >
        {isTranslating ? (
          <span style={{ color: 'var(--text-muted)' }} className="animate-pulse">Translating…</span>
        ) : (
          displayText || <span style={{ color: 'var(--text-muted)' }}>(no speech)</span>
        )}
      </div>

      {translateError && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>{translateError}</p>
      )}

      {/* Translate to */}
      <div className="flex flex-col gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Translate to:</span>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleTranslate(lang)}
              disabled={isTranslating}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all disabled:opacity-40"
              style={{
                background: displayLang === lang ? 'var(--accent)' : 'var(--surface-2)',
                color: displayLang === lang ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${displayLang === lang ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {LL[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadTranscription(reportRecord)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(124,107,255,0.1)', border: '1px solid rgba(124,107,255,0.3)', color: 'var(--accent)' }}
        >
          ↓ Download
        </button>
        <button
          onClick={() => downloadReport(reportRecord)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(77,255,176,0.1)', border: '1px solid rgba(77,255,176,0.3)', color: 'var(--green)' }}
        >
          📄 Report
        </button>
      </div>
    </div>
  );
}
