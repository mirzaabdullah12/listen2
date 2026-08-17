'use client';

import type { Language } from '@/types';
import { LANGUAGE_LABELS } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
  disabled?: boolean;
}

export function LanguageSelector({ value, onChange, disabled }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          disabled={disabled}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: value === lang ? 'var(--accent)' : 'var(--surface-2)',
            color: value === lang ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${value === lang ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: value === lang ? '0 0 12px var(--accent-glow)' : 'none',
          }}
        >
          {LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
