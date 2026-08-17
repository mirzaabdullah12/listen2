/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';

// Mock MediaRecorder
class MockMediaRecorder {
  state: string = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public stream: MediaStream, public options?: MediaRecorderOptions) {}

  start(_timeslice?: number) {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }

  static isTypeSupported(type: string): boolean {
    return type === 'audio/webm';
  }
}

Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: MockMediaRecorder,
});

const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
} as unknown as MediaStream);

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia },
});

if (!('indexedDB' in global)) {
  Object.defineProperty(global, 'indexedDB', { writable: true, value: {} });
}

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
