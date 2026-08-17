'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderOptions {
  onChunk: (blob: Blob) => void;   // called every ~5s during recording
  onComplete: (blob: Blob) => void; // called with full audio on stop
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  elapsedSeconds: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

const CHUNK_INTERVAL_MS = 5000; // send a chunk every 5 seconds

export function useAudioRecorder({ onChunk, onComplete }: UseAudioRecorderOptions): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allChunksRef = useRef<Blob[]>([]);
  const windowChunksRef = useRef<Blob[]>([]);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  const flushWindow = useCallback(() => {
    if (windowChunksRef.current.length === 0) return;
    const blob = new Blob(windowChunksRef.current, { type: mimeTypeRef.current });
    windowChunksRef.current = [];
    if (blob.size > 0) onChunk(blob);
  }, [onChunk]);

  const start = useCallback(async () => {
    setError(null);
    setElapsedSeconds(0);
    allChunksRef.current = [];
    windowChunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,        // mono is better for speech
          sampleRate: 16000,      // 16kHz is ideal for speech recognition
        },
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone permission in your browser settings.'
          : 'Could not access microphone. Please check your device settings.';
      setError(msg);
      return;
    }

    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : undefined;

    mimeTypeRef.current = mimeType ?? 'audio/webm';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        allChunksRef.current.push(e.data);
        windowChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      // Clear the live chunk timer
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      // Send full audio for final save
      const fullBlob = new Blob(allChunksRef.current, { type: mimeTypeRef.current });
      allChunksRef.current = [];
      windowChunksRef.current = [];
      if (fullBlob.size > 0) onComplete(fullBlob);
    };

    recorder.start(1000); // collect data every 1s
    setIsRecording(true);

    // Timer for elapsed display
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    // Send live chunk every 5 seconds
    chunkTimerRef.current = setInterval(() => {
      flushWindow();
    }, CHUNK_INTERVAL_MS);
  }, [onChunk, onComplete, flushWindow]);

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
