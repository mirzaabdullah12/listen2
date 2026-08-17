'use client';

import { WaveformAnimation } from './WaveformAnimation';

interface RecordingControlsProps {
  isRecording: boolean;
  elapsedSeconds: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function RecordingControls({ isRecording, elapsedSeconds, onStart, onStop, disabled }: RecordingControlsProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <WaveformAnimation isActive={isRecording} />

      {/* Timer */}
      <div className="font-mono text-2xl font-light tracking-widest"
        style={{ color: isRecording ? 'var(--red)' : 'var(--text-muted)' }}>
        {formatTime(elapsedSeconds)}
      </div>

      {/* Record button */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <div className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'var(--red-glow)', animationDuration: '1.5s' }} />
        )}
        <button
          onClick={isRecording ? onStop : onStart}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          style={{
            background: isRecording
              ? 'var(--red)'
              : 'linear-gradient(135deg, #7c6bff, #9c6bff)',
            boxShadow: isRecording
              ? '0 0 32px var(--red-glow), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 0 32px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {isRecording ? (
            /* Stop icon */
            <div className="w-6 h-6 rounded-sm bg-white" />
          ) : (
            /* Mic icon */
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {disabled ? 'Saving…' : isRecording ? 'Tap to stop' : 'Tap to record'}
      </p>
    </div>
  );
}
