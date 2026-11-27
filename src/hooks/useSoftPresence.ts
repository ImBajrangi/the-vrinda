import { useEffect, useRef, useState } from 'react';

/**
 * Keeps an overlay, popover, or modal mounted long enough to play its exit animation
 * before unmounting, without cancelling prematurely if reopened mid-exit.
 */
export function useSoftPresence(isOpen: boolean, exitDurationMs = 260) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, exitDurationMs);
    }
  }, [isOpen, exitDurationMs, isRendered]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return { isRendered, isClosing };
}
