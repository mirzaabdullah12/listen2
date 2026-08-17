import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ListenAI — Multilingual Transcription',
  description: 'Live transcription in English, Spanish, French, and Urdu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
