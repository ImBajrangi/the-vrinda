import React, { useEffect, useState } from 'react';

// ============================================================================
// 1. Apple Safari / iOS 18 Navigation Progress Controller
// Lightweight event emitter providing 0ms tactile feedback across all clicks
// ============================================================================

type ProgressListener = (isLoading: boolean) => void;
const progressListeners = new Set<ProgressListener>();

export const navigationProgress = {
  start: () => {
    progressListeners.forEach((fn) => fn(true));
  },
  done: () => {
    progressListeners.forEach((fn) => fn(false));
  },
};

/**
 * Razor-thin Apple Safari / iOS 18 Top Loading Bar (2px)
 * Appears instantly (0ms) upon navigation/fetch, advances smoothly,
 * and seamlessly settles when content is ready.
 */
export const IOSTopProgressBar: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let trickleTimer: ReturnType<typeof setTimeout> | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;

    const handler: ProgressListener = (isLoading) => {
      if (isLoading) {
        if (finishTimer) clearTimeout(finishTimer);
        if (trickleTimer) clearTimeout(trickleTimer);
        setVisible(true);
        setProgress(28);

        trickleTimer = setTimeout(() => {
          setProgress(72);
          trickleTimer = setTimeout(() => {
            setProgress(90);
          }, 220);
        }, 110);
      } else {
        if (trickleTimer) clearTimeout(trickleTimer);
        setProgress(100);
        finishTimer = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
      }
    };

    progressListeners.add(handler);
    return () => {
      progressListeners.delete(handler);
      if (trickleTimer) clearTimeout(trickleTimer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none overflow-hidden"
      style={{
        opacity: progress === 100 ? 0 : 1,
        transition: 'opacity 200ms ease-out',
      }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#FBBF24] shadow-[0_0_8px_rgba(217,119,6,0.55)]"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? 'width 130ms ease-out'
              : 'width 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  );
};

// ============================================================================
// 2. Latest Apple iOS 18 UIActivityIndicatorView (12-Blade Tapered Spinner)
// Precision SVG + steps(12, end) discrete rotation with authentic opacity falloff
// ============================================================================

export interface IOSSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'amber' | 'neutral' | 'white' | 'dark' | 'current';
  label?: string;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

const SPOKE_COLORS = {
  amber: 'fill-[#B45309]',
  neutral: 'fill-[#71717A]',
  white: 'fill-white',
  dark: 'fill-[#1C140D]',
  current: 'fill-current',
};

// 12 iOS UIKit blades rotated every 30 deg with continuous trail falloff
const SPOKES = [
  { rotate: 0, opacity: 0.12 },
  { rotate: 30, opacity: 0.16 },
  { rotate: 60, opacity: 0.21 },
  { rotate: 90, opacity: 0.27 },
  { rotate: 120, opacity: 0.35 },
  { rotate: 150, opacity: 0.44 },
  { rotate: 180, opacity: 0.54 },
  { rotate: 210, opacity: 0.65 },
  { rotate: 240, opacity: 0.76 },
  { rotate: 270, opacity: 0.87 },
  { rotate: 300, opacity: 0.94 },
  { rotate: 330, opacity: 1.0 },
];

export const IOSSpinner: React.FC<IOSSpinnerProps> = ({
  size = 'md',
  theme = 'amber',
  label,
  className = '',
}) => {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-live={label ? 'polite' : undefined}
      className={`inline-flex ${label ? 'flex-col' : ''} items-center justify-center gap-2 ${className}`}
    >
      <svg
        className={`${SIZE_MAP[size]} animate-ios-spin shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {SPOKES.map((s, idx) => (
          <rect
            key={idx}
            x="10.95"
            y="1.6"
            width="2.1"
            height="5.4"
            rx="1.05"
            className={SPOKE_COLORS[theme]}
            opacity={s.opacity}
            transform={`rotate(${s.rotate} 12 12)`}
          />
        ))}
      </svg>
      {label && (
        <span className="text-xs font-laila font-medium text-neutral-600 tracking-wide select-none">
          {label}
        </span>
      )}
    </span>
  );
};

// ============================================================================
// 3. Apple iOS 18 Frosted Capsule Loader HUD (Inline & Section States)
// ============================================================================

export interface IOSPillLoaderProps {
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  theme?: 'amber' | 'neutral' | 'white' | 'dark' | 'current';
  className?: string;
}

export const IOSPillLoader: React.FC<IOSPillLoaderProps> = ({
  label = 'संकलित हो रहा है...',
  size = 'sm',
  theme = 'amber',
  className = '',
}) => (
  <div
    role="status"
    aria-busy="true"
    aria-live="polite"
    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-amber-200/70 shadow-[0_4px_18px_rgba(24,24,27,0.06)] text-xs font-laila font-semibold text-[#1C140D] select-none ${className}`}
  >
    <IOSSpinner size={size} theme={theme} />
    <span>{label}</span>
  </div>
);
