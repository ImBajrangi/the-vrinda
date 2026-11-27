import { useState, useEffect, useCallback } from 'react';

interface SidebarState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
  setLeftCollapsed: (collapsed: boolean) => void;
  setRightCollapsed: (collapsed: boolean) => void;
}

/**
 * SSR-safe hook to persist expandable/shrinkable sidebar preferences per workspace.
 * Initializes deterministically (expanded) during SSR/hydration and syncs from
 * localStorage on mount so React hydration never mismatches.
 */
export function useSidebarState(storageKey: string): SidebarState {
  const [leftCollapsed, setLeftState] = useState(false);
  const [rightCollapsed, setRightState] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`vrind_sidebar_${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { l?: boolean; r?: boolean };
        if (typeof parsed.l === 'boolean') setLeftState(parsed.l);
        if (typeof parsed.r === 'boolean') setRightState(parsed.r);
      }
    } catch {}
  }, [storageKey]);

  const persist = useCallback(
    (l: boolean, r: boolean) => {
      try {
        localStorage.setItem(`vrind_sidebar_${storageKey}`, JSON.stringify({ l, r }));
      } catch {}
    },
    [storageKey]
  );

  const setLeftCollapsed = useCallback(
    (collapsed: boolean) => {
      setLeftState(collapsed);
      setRightState((curR) => {
        persist(collapsed, curR);
        return curR;
      });
    },
    [persist]
  );

  const setRightCollapsed = useCallback(
    (collapsed: boolean) => {
      setRightState(collapsed);
      setLeftState((curL) => {
        persist(curL, collapsed);
        return curL;
      });
    },
    [persist]
  );

  const toggleLeft = useCallback(() => {
    setLeftState((prevL) => {
      const nextL = !prevL;
      setRightState((curR) => {
        persist(nextL, curR);
        return curR;
      });
      return nextL;
    });
  }, [persist]);

  const toggleRight = useCallback(() => {
    setRightState((prevR) => {
      const nextR = !prevR;
      setLeftState((curL) => {
        persist(curL, nextR);
        return curL;
      });
      return nextR;
    });
  }, [persist]);

  return {
    leftCollapsed,
    rightCollapsed,
    toggleLeft,
    toggleRight,
    setLeftCollapsed,
    setRightCollapsed,
  };
}
