'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderOptions {
  onChunk: (blob: Blob) => void;    // called every ~5s with ALL audio so far
  onComplete: (blob: Blob) => void; // called with full audio on stop
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  elapsedSeconds: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

const LIVE_INTERVAL_MS = 5000; // transcribe every 5 seconds

export function useAudioRecorder({ onChunk, onComplete }: UseAudioRecorderOptions): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');

  const onChunkRef = useRef(onChunk);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onChunkRef.current = onChunk; }, [onChunk]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const start = useCallback(async () => {
    setError(null);
    setElapsedSeconds(0);
    allChunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // auto-boosts your voice volume
        },
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        const msg =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Microphone access was denied. Please allow microphone permission in your browser settings.'
            : 'Could not access microphone. Please check your device settings.';
        setError(msg);
        return;
      }
    }

    streamRef.current = stream;

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      .find((t) => MediaRecorder.isTypeSupported(t));
    mimeTypeRef.current = mimeType ?? 'audio/webm';

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      recorder = new MediaRecorder(stream);
      mimeTypeRef.current = 'audio/webm';
    }
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        allChunksRef.current.push(e.data);
      }
    };

    recorder.onerror = () => {
      setError('Recording error. Please try again.');
      setIsRecording(false);
    };

    recorder.onstop = () => {
      if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsRecording(false);

      const fullBlob = new Blob(allChunksRef.current, { type: mimeTypeRef.current });
      allChunksRef.current = [];
      if (fullBlob.size > 0) onCompleteRef.current(fullBlob);
    };

    recorder.start(500); // collect data every 500ms for smoother accumulation
    setIsRecording(true);

    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);

    // Send ALL accumulated audio every 5s for live transcription
    chunkTimerRef.current = setInterval(() => {
      if (allChunksRef.current.length === 0) return;
      const blob = new Blob(allChunksRef.current, { type: mimeTypeRef.current });
      if (blob.size > 0) onChunkRef.current(blob);
    }, LIVE_INTERVAL_MS);
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { isRecording, elapsedSeconds, error, start, stop };
}
