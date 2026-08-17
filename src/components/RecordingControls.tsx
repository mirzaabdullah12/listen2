'use client';

interface RecordingControlsProps {
  isRecording: boolean;
  elapsedSeconds: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function RecordingControls({ isRecording, elapsedSeconds, onStart, onStop, disabled }: RecordingControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {isRecording ? (
        <>
          <span className="flex items-center gap-2 text-red-600 dark:text-red-400" aria-label="Recording in progress">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            <span className="font-mono text-sm">{formatTime(elapsedSeconds)}</span>
          </span>
          <button
            onClick={onStop}
            className="min-h-[44px] min-w-[100px] rounded-lg bg-red-600 px-5 py-2 text-base font-semibold text-white shadow transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Stop recording"
          >
            Stop
          </button>
        </>
      ) : (
        <button
          onClick={onStart}
          disabled={disabled}
          className="min-h-[44px] min-w-[100px] rounded-lg bg-blue-600 px-5 py-2 text-base font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Start recording"
        >
          Record
        </button>
      )}
    </div>
  );
}
