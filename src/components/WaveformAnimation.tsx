'use client';

export function WaveformAnimation({ isActive }: { isActive: boolean }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 1, 0.6, 0.8];

  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-300"
          style={{
            height: isActive ? `${height * 32}px` : '6px',
            background: isActive
              ? `rgba(124, 107, 255, ${0.4 + height * 0.6})`
              : 'rgba(107, 107, 128, 0.3)',
            animationDelay: isActive ? `${i * 0.08}s` : '0s',
            animation: isActive ? `wave 1.2s ease-in-out infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
}
