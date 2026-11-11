import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

interface UseScrollDirectionOptions {
  /** Minimum scroll distance (px) before direction flips. Prevents jitter on slow scrolls. Default: 8 */
  threshold?: number;
  /** If true, auto-hide returns 'down' when scrolling down (chrome should hide). Default: true */
  enabled?: boolean;
}

interface ScrollDirectionState {
  direction: ScrollDirection;
  /** true when chrome should be visible (idle, scrolling up, or near top) */
  showChrome: boolean;
  /** Current scroll Y position */
  scrollY: number;
  /** true if user is within the top 80px of the page */
  isNearTop: boolean;
}

/**
 * Lightweight scroll direction hook for auto-hiding mobile chrome.
 * Uses passive event listeners and requestAnimationFrame for 60fps perf.
 * Avoids layout thrashing — reads scrollY only, never triggers reflows.
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}): ScrollDirectionState {
  const { threshold = 8, enabled = true } = options;

  const [state, setState] = useState<ScrollDirectionState>({
    direction: 'idle',
    showChrome: true,
    scrollY: 0,
    isNearTop: true,
  });

  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const lastDirection = useRef<ScrollDirection>('idle');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback(() => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY.current;
    const isNearTop = currentY < 80;

    // Check if user has reached the bottom of the page
    const windowHeight = window.innerHeight;
    const documentHeight = typeof document !== 'undefined' ? document.documentElement.scrollHeight : 0;
    const isNearBottom = documentHeight > 0 && windowHeight + currentY >= documentHeight - 90;

    let direction: ScrollDirection = lastDirection.current;

    if (Math.abs(delta) >= threshold) {
      direction = delta > 0 ? 'down' : 'up';
      lastScrollY.current = currentY;
      lastDirection.current = direction;
    }

    // Always show chrome near top of page, near bottom of page, or when scrolling up
    const showChrome = !enabled || isNearTop || isNearBottom || direction === 'up' || direction === 'idle';

    setState({ direction, showChrome, scrollY: currentY, isNearTop });
    ticking.current = false;

    // Reset to idle / visible chrome after 2.5s of reading inactivity
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!showChrome) {
      idleTimer.current = setTimeout(() => {
        lastDirection.current = 'idle';
        setState((prev) => ({ ...prev, direction: 'idle', showChrome: true }));
      }, 2500);
    }
  }, [threshold, enabled]);

  useEffect(() => {
    if (!enabled) {
      setState({ direction: 'idle', showChrome: true, scrollY: 0, isNearTop: true });
      return;
    }

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    // Passive listener: zero performance overhead on scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [update, enabled]);

  return state;
}

/**
 * Hook to detect single tap on the reading canvas to toggle chrome visibility.
 * Distinguishes taps from scroll gestures.
 */
export function useTapToToggle(onToggle: () => void) {
  const startY = useRef(0);
  const startTime = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const elapsed = Date.now() - startTime.current;
    const distance = Math.abs(endY - startY.current);

    // Only trigger if it was a tap (< 200ms, < 10px movement)
    if (elapsed < 200 && distance < 10) {
      onToggle();
    }
  }, [onToggle]);

  return { onTouchStart, onTouchEnd };
}

