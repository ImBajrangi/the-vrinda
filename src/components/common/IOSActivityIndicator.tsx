import React, { useEffect, useState } from 'react';

// ============================================================================
// 1. Apple Safari / iOS Navigation Progress Controller
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
 * Razor-thin Apple Safari / iOS Top Loading Bar (2.5px)
 * Appears instantly (0ms) upon any click, advances rapidly,
 * and seamlessly completes when content is ready.
 */
export const IOSTopProgressBar: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let trickleTimer: any = null;
    let finishTimer: any = null;

    const handler: ProgressListener = (isLoading) => {
      if (isLoading) {
        if (finishTimer) clearTimeout(finishTimer);
        setVisible(true);
        setProgress(25);

        // Natural Apple Safari progressive trickle
        trickleTimer = setTimeout(() => {
          setProgress(70);
          trickleTimer = setTimeout(() => {
            setProgress(88);
          }, 240);
        }, 120);
      } else {
        if (trickleTimer) clearTimeout(trickleTimer);
        setProgress(100);
        finishTimer = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 220);
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
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] pointer-events-none overflow-hidden"
      style={{
        opacity: progress === 100 ? 0 : 1,
        transition: 'opacity 220ms ease-out',
      }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] shadow-[0_0_10px_rgba(245,158,11,0.7)]"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? 'width 140ms ease-out'
              : 'width 280ms cubic-bezier(0.1, 0.9, 0.2, 1)',
        }}
      />
    </div>
  );
};

// ============================================================================
// 2. Iconic Apple iOS 12-Spoke Radial Activity Indicator
// High-precision SVG implementation replicating UIKit UIActivityIndicatorView
// ============================================================================

export interface IOSSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'amber' | 'neutral' | 'white';
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
  amber: 'fill-[#B45309]', // Warm Pitambari Gold
  neutral: 'fill-[#52525B]', // Apple Slate Zinc
  white: 'fill-white',
};

// 12 spokes rotated by 30° each with authentic iOS alpha fade
const SPOKES = [
  { rotate: 0, opacity: 0.15 },
  { rotate: 30, opacity: 0.22 },
  { rotate: 60, opacity: 0.3 },
  { rotate: 90, opacity: 0.38 },
  { rotate: 120, opacity: 0.46 },
  { rotate: 150, opacity: 0.54 },
  { rotate: 180, opacity: 0.62 },
  { rotate: 210, opacity: 0.7 },
  { rotate: 240, opacity: 0.78 },
  { rotate: 270, opacity: 0.86 },
  { rotate: 300, opacity: 0.93 },
  { rotate: 330, opacity: 1.0 },
];

export const IOSSpinner: React.FC<IOSSpinnerProps> = ({
  size = 'md',
  theme = 'amber',
  label,
  className = '',
}) => {
  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
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
            x="11"
            y="1.5"
            width="2"
            height="5"
            rx="1"
            className={SPOKE_COLORS[theme]}
            opacity={s.opacity}
            transform={`rotate(${s.rotate} 12 12)`}
          />
        ))}
      </svg>
      {label && (
        <span className="text-xs font-serif font-medium text-neutral-600 animate-pulse tracking-wide select-none">
          {label}
        </span>
      )}
    </div>
  );
};

