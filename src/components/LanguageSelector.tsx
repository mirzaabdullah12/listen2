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
    <div className="flex flex-col gap-1">
      <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Language
      </label>
      <select
        id="language-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Language)}
        className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}
