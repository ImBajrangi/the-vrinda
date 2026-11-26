import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, BookOpen, Feather, ChevronRight, Check, LayoutGrid, List } from 'lucide-react';

export interface ScriptureItem {
  id: string;
  name: string;
  count?: number;
  section?: string;
  type: 'grantha' | 'chapter' | 'pada';
}

interface MobileScriptureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: ScriptureItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  categories?: { id: string; label: string }[];
  activeCategory?: string;
  onCategoryChange?: (catId: string) => void;
}

/** Micro-haptic tactile feedback for iOS & Android */
const triggerHaptic = (ms: number = 8) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {}
  }
};

/**
 * World-Class Mobile Bottom Sheet Drawer (Sacred Scripture Index).
 *
 * Implements Apple Human Interface & Material 3 Design:
 * - 0% background blur (ultra-fast, zero GPU load, perfectly sharp background scripture)
 * - Dynamic visualViewport height & keyboard collision avoidance
 * - Auto-tuck keyboard on list scroll or tap outside
 * - One-tap tactile "Done" (पूर्ण) keyboard dismiss button
 * - 16px minimum search input size to eliminate iOS Safari forced auto-zoom
 * - 1:1 true physics drag with momentum swipe-down to dismiss
 * - Full-surface drag detection (grab handle, title bar, search header, category strip)
 * - Intelligent overscroll pull-down to dismiss when at top of list
 * - Synchronized live backdrop opacity fading
 * - Section header grouping (e.g. बालकाण्ड, अयोध्याकाण्ड, स्कन्ध) for structured reading
 * - Real-time search query matching with instant results counter
 * - Micro-haptic tactile feedback on tap
 * - Strict concentric border radius geometry (Outer 32px -> Inner 16px -> Inner 6px)
 * - Zero unnecessary AI hover translateY animations
 * - Safe area padding for notchless iPhone home indicators & Android gesture bars
 */
export const MobileScriptureDrawer: React.FC<MobileScriptureDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  items,
  selectedId,
  onSelect,
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isMounted, setIsMounted] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Dynamic visual viewport & on-screen keyboard metrics
  const [viewportMetrics, setViewportMetrics] = useState<{
    height: number;
    offsetTop: number;
    keyboardHeight: number;
    isKeyboardOpen: boolean;
  }>({
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
    offsetTop: 0,
    keyboardHeight: 0,
    isKeyboardOpen: false,
  });

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Gesture tracking refs
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const isListTouch = useRef<boolean>(false);
  const isDismissing = useRef<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track dynamic visual viewport & soft keyboard geometry
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const updateMetrics = () => {
      const vv = window.visualViewport;
      if (vv) {
        const winH = window.innerHeight;
        const vh = Math.round(vv.height);
        const top = Math.max(0, Math.round(vv.offsetTop));
        const rawKb = Math.max(0, winH - vh);
        // Soft keyboard typically consumes > 100px on mobile screens
        const isKb = rawKb > 100 || (typeof screen !== 'undefined' && screen.height - vh > 180 && isInputFocused);
        const kb = isKb ? rawKb : 0;

        setViewportMetrics({
          height: vh,
          offsetTop: top,
          keyboardHeight: kb,
          isKeyboardOpen: isKb,
        });
      } else {
        setViewportMetrics({
          height: window.innerHeight,
          offsetTop: 0,
          keyboardHeight: 0,
          isKeyboardOpen: false,
        });
      }
    };

    updateMetrics();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateMetrics);
      vv.addEventListener('scroll', updateMetrics);
    }
    window.addEventListener('resize', updateMetrics);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateMetrics);
        vv.removeEventListener('scroll', updateMetrics);
      }
      window.removeEventListener('resize', updateMetrics);
    };
  }, [isOpen, isInputFocused]);

  // Programmatic dismiss with spring glide animation
  const handleDismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    // Blur search input immediately so virtual keyboard dismisses synchronously
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    setIsInputFocused(false);

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 160ms cubic-bezier(0.5, 0, 0.9, 0.3)';
      sheetRef.current.style.transform = 'translate3d(0, 100%, 0)';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 150ms ease-out';
      backdropRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      onClose();
      setIsRendered(false);
      isDismissing.current = false;
      document.body.style.overflow = '';
    }, 160);
  }, [onClose]);

  // Sync open/close states
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      isDismissing.current = false;
      setSearchQuery('');
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transform = '';
          sheetRef.current.style.transition = '';
        }
        if (backdropRef.current) {
          backdropRef.current.style.opacity = '1';
          backdropRef.current.style.transition = '';
        }
      });
    } else if (isRendered && !isDismissing.current) {
      handleDismiss();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isRendered, handleDismiss]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss]);

  // Auto-scroll to selected item when drawer is opened
  useEffect(() => {
    if (isOpen && selectedId && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        const selectedEl = scrollContainerRef.current?.querySelector(`[data-selected="true"]`);
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedId, activeCategory]);

  // Available unique sections (e.g. बालकाण्ड, अयोध्याकाण्ड)
  const availableSections = useMemo(() => {
    const sects: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (item.section && !seen.has(item.section)) {
        seen.add(item.section);
        sects.push(item.section);
      }
    }
    return sects;
  }, [items]);

  // Only activate section filters if sections actually group multiple items
  // (e.g. Kandas in Ramayana with 70+ chapters, Skandhas in Bhagavatam with 18+ chapters).
  // If every section has only 1 item (1:1 chapter numbering) or there's only 1 total section (e.g. मूल पाठ),
  // section filtering is unnecessary.
  const hasMultipleMultiItemSections = useMemo(() => {
    if (availableSections.length <= 1) return false;
    return availableSections.some((sect) => {
      return items.filter((it) => it.section === sect).length > 1;
    });
  }, [availableSections, items]);

  // Sync selected section with active item when opened
  useEffect(() => {
    if (isOpen && selectedId && hasMultipleMultiItemSections) {
      const activeItem = items.find((it) => it.id === selectedId);
      // For epic chapters, section is the Kanda (e.g. बालकाण्ड, अयोध्याकाण्ड)
      // For padas, do not lock the drawer to a single author unless the user explicitly filters
      if (activeItem && activeItem.section && activeCategory !== 'padas') {
        setSelectedSection(activeItem.section);
      } else {
        setSelectedSection(null);
      }
    } else {
      setSelectedSection(null);
    }
  }, [isOpen, selectedId, items, activeCategory, hasMultipleMultiItemSections]);

  // Filter items by search query AND section
  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedSection) {
      result = result.filter((item) => item.section === selectedSection);
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.trim().toLowerCase();
    return result.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.section && item.section.toLowerCase().includes(q))
      );
    });
  }, [items, selectedSection, searchQuery]);

  // Swipe-down touch handlers with full-surface drag detection
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isDismissing.current) return;
      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      startTime.current = Date.now();

      const target = e.target as HTMLElement;
      const isInScrollList = Boolean(target.closest('.drawer-scrollable'));
      isListTouch.current = isInScrollList;

      if (!isInScrollList) {
        if (target.tagName.toLowerCase() === 'input') {
          isDragging.current = false;
        } else {
          // Touching anywhere on sheet chrome while keyboard is open dismisses keyboard cleanly
          if (document.activeElement === searchInputRef.current) {
            searchInputRef.current?.blur();
            setIsInputFocused(false);
          }
          isDragging.current = true;
          if (sheetRef.current) sheetRef.current.style.transition = 'none';
          if (backdropRef.current) backdropRef.current.style.transition = 'none';
        }
      } else {
        isDragging.current = false;
        // Touching the scroll list while keyboard is up immediately tucks keyboard away
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
          setIsInputFocused(false);
        }
      }
    },
    []
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDismissing.current || !sheetRef.current) return;
    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Pulling down from top of scroll list initiates drag-to-dismiss
    if (isListTouch.current && !isDragging.current) {
      const scrollEl = scrollContainerRef.current;
      const isAtTop = !scrollEl || scrollEl.scrollTop <= 0;
      if (isAtTop && deltaY > 8) {
        isDragging.current = true;
        startY.current = touch.clientY;
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
        if (backdropRef.current) backdropRef.current.style.transition = 'none';
      }
    }

    if (!isDragging.current) return;

    if (deltaY > 0) {
      sheetRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;
      if (backdropRef.current) {
        const sheetHeight = sheetRef.current.offsetHeight || 500;
        const progress = Math.min(1, deltaY / (sheetHeight * 0.7));
        backdropRef.current.style.opacity = String(Math.max(0, 1 - progress));
      }
    } else {
      const resistance = Math.max(-10, deltaY * 0.1);
      sheetRef.current.style.transform = `translate3d(0, ${resistance}px, 0)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isDismissing.current || !sheetRef.current) return;
    const wasDragging = isDragging.current;
    isDragging.current = false;
    isListTouch.current = false;

    if (!wasDragging) return;

    const deltaY = currentY.current - startY.current;
    const elapsed = Math.max(1, Date.now() - startTime.current);
    const velocity = deltaY / elapsed;

    const shouldDismiss = deltaY > 55 || (deltaY > 15 && velocity > 0.22);

    if (shouldDismiss) {
      triggerHaptic(12);
      handleDismiss();
    } else {
      sheetRef.current.style.transition = 'transform 220ms cubic-bezier(0.5, 0, 0.9, 0.3)';
      sheetRef.current.style.transform = 'translate3d(0, 0, 0)';

      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 200ms ease-out';
        backdropRef.current.style.opacity = '1';
      }

      setTimeout(() => {
        if (sheetRef.current && !isDismissing.current) {
          sheetRef.current.style.transition = '';
          sheetRef.current.style.transform = '';
        }
        if (backdropRef.current && !isDismissing.current) {
          backdropRef.current.style.transition = '';
          backdropRef.current.style.opacity = '';
        }
      }, 220);
    }
  }, [handleDismiss]);

  // List scroll listener: auto-dismiss keyboard on scrolling results
  const handleListScroll = useCallback(() => {
    if (document.activeElement === searchInputRef.current) {
      searchInputRef.current?.blur();
      setIsInputFocused(false);
    }
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      triggerHaptic(10);
      onSelect(id);
      handleDismiss();
    },
    [onSelect, handleDismiss]
  );

  if (!isMounted || !isRendered) return null;

  const content = (
    <div
      className="fixed inset-x-0 z-[100] pointer-events-auto flex flex-col justify-end"
      style={{
        top: `${viewportMetrics.offsetTop}px`,
        bottom: `${viewportMetrics.keyboardHeight}px`,
        height: viewportMetrics.isKeyboardOpen ? `${viewportMetrics.height}px` : undefined,
      }}
    >
      {/* 
        Crisp Dark Scrim Backdrop (0% GPU blur, 100% sharp background text)
      */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/40 transition-opacity duration-200 animate-[nativeBackdropFade_200ms_ease-out]"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* 
        Native Bottom Sheet Canvas
        Concentric Geometry: Outer rounded-t-[32px] -> Inner search rounded-[14px] -> Inner items rounded-[16px] -> Inner icon rounded-[6px]
      */}
      <div
        ref={sheetRef}
        className={`relative z-10 w-full bg-white rounded-t-[32px] shadow-[0_-12px_48px_rgba(0,0,0,0.18)] border-t border-stone-200/50 flex flex-col overflow-hidden will-change-transform animate-[nativeSheetUp_240ms_cubic-bezier(0.5,0,0.9,0.3)] ${
          viewportMetrics.isKeyboardOpen
            ? 'h-full max-h-full'
            : 'h-[82dvh] max-h-[82dvh] sm:h-[80dvh] sm:max-h-[80dvh]'
        }`}
        style={
          viewportMetrics.isKeyboardOpen
            ? { maxHeight: `${Math.max(280, viewportMetrics.height - 8)}px` }
            : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Top Drag Zone (Grab Capsule + Title Bar) */}
        <div className="select-none shrink-0 bg-white border-b border-stone-100 touch-none">
          {/* iOS Grab Capsule Handle */}
          <div className="w-full flex items-center justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-stone-300/80 transition-colors" />
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between px-5 pt-0.5 pb-3">
            <div className="min-w-0 flex-1 pr-3">
              <h3 className="font-serif font-bold text-[17px] text-stone-900 leading-snug truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11.5px] text-amber-800 font-serif font-medium mt-0.5 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{subtitle}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-stone-100 active:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Box & Query Status with Dynamic Keyboard Dismiss */}
        <div className="px-5 pt-3 pb-2 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center flex-1 h-10 px-3.5 rounded-[14px] bg-[#F4F4F5] border border-stone-200/70 focus-within:bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all duration-150">
              <Search className="w-4 h-4 text-stone-400 shrink-0 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="search"
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="खोजें... (Search sarga, adhyaya, saint)"
                value={searchQuery}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchInputRef.current?.blur();
                    setIsInputFocused(false);
                  }
                }}
                className="w-full pl-2.5 pr-6 bg-transparent text-[16px] sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none border-none focus:outline-none focus:ring-0 select-text"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 active:text-stone-900 rounded-full cursor-pointer touch-manipulation"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tactile Keyboard Dismiss / Done Button when keyboard is active */}
            {(isInputFocused || viewportMetrics.isKeyboardOpen) && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  searchInputRef.current?.blur();
                  setIsInputFocused(false);
                }}
                className="h-10 px-3.5 rounded-[14px] bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200/70 text-amber-900 text-xs font-serif font-bold whitespace-nowrap border border-amber-300/70 transition-colors cursor-pointer select-none shrink-0 flex items-center gap-1.5 touch-manipulation shadow-2xs"
                title="कीबोर्ड बन्द करें (Hide Keyboard)"
                aria-label="Done typing"
              >
                <span>पूर्ण</span>
                <Check className="w-3.5 h-3.5 text-amber-800 stroke-[2.5]" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-stone-500 font-serif">
              <span>{filteredItems.length} परिणाम मिले</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-amber-800 font-semibold cursor-pointer"
              >
                सभी दिखाएँ
              </button>
            </div>
          )}
        </div>

        {/* Category Horizontal Filter Strip */}
        {categories && categories.length > 0 && (
          <div className="px-5 pb-2.5 shrink-0 bg-white border-b border-stone-100">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      if (document.activeElement === searchInputRef.current) {
                        searchInputRef.current?.blur();
                        setIsInputFocused(false);
                      }
                      onCategoryChange?.(cat.id);
                    }}
                    className={`h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none shrink-0 ${
                      isActive
                        ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-xs border border-amber-300/60'
                        : 'bg-stone-100 text-stone-600 active:bg-stone-200 border border-stone-200/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section / Kanda Two-Step Direct Dial Strip & View Mode Toggle */}
        <div className="px-4 py-2 shrink-0 bg-[#FAF8F5] border-b border-stone-200/60 flex items-center justify-between gap-2 min-h-[44px]">
          {hasMultipleMultiItemSections ? (
            /* Horizontal Scrollable Kanda/Section Pills */
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  if (document.activeElement === searchInputRef.current) {
                    searchInputRef.current?.blur();
                    setIsInputFocused(false);
                  }
                  setSelectedSection(null);
                }}
                className={`h-7 px-3 rounded-full text-[11px] font-serif whitespace-nowrap transition-colors cursor-pointer select-none shrink-0 ${
                  selectedSection === null
                    ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs border border-amber-300/80'
                    : 'bg-white text-stone-600 border border-stone-200/60 hover:text-stone-900 active:bg-stone-100'
                }`}
              >
                सभी ({items.length})
              </button>
              {availableSections.map((sect) => {
                const isSelected = selectedSection === sect;
                const sectCount = items.filter((it) => it.section === sect).length;
                return (
                  <button
                    key={sect}
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      if (document.activeElement === searchInputRef.current) {
                        searchInputRef.current?.blur();
                        setIsInputFocused(false);
                      }
                      setSelectedSection(sect);
                    }}
                    className={`h-7 px-3 rounded-full text-[11px] font-serif whitespace-nowrap transition-colors cursor-pointer select-none shrink-0 ${
                      isSelected
                        ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs border border-amber-300/80'
                        : 'bg-white text-stone-600 border border-stone-200/60 hover:text-stone-900 active:bg-stone-100'
                    }`}
                  >
                    {sect} {sectCount > 0 && <span className="opacity-70 text-[9.5px]">({sectCount})</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Clean single-section counter when all items are displayed together */
            <div className="flex items-center gap-2 min-w-0 flex-1 py-0.5">
              <span className="text-[11px] font-serif font-semibold text-stone-600 truncate">
                कुल {items.length} {title.includes('पद') ? 'पद' : 'अध्याय / सर्ग'} उपलब्ध
              </span>
            </div>
          )}

          {/* View Mode Toggle: List vs Compact Grid */}
          <div className="flex items-center bg-stone-200/70 p-0.5 rounded-[10px] shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setViewMode('list');
              }}
              className={`w-6 h-6 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="विस्तृत सूची (List View)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setViewMode('grid');
              }}
              className={`w-6 h-6 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="त्वरित संख्या ग्रिड (Grid View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Items List with Intelligent Section Grouping & Grid View */}
        <div
          ref={scrollContainerRef}
          onScroll={handleListScroll}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 space-y-1 drawer-scrollable pb-[max(1.75rem,env(safe-area-inset-bottom,1.75rem))]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center select-none">
              <p className="text-sm font-serif font-bold text-stone-500">कोई परिणाम नहीं मिला</p>
              <p className="text-xs text-stone-400 mt-1">कृपया अन्य शब्द से खोजें</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Compact High-Density Touch Grid */
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 py-1">
              {filteredItems.map((item, idx) => {
                const isSelected = selectedId === item.id;
                const numMatch = item.name.match(/\d+/);
                const displayNum = numMatch ? numMatch[0] : `${idx + 1}`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelect(item.id)}
                    className={`h-12 rounded-[16px] flex flex-col items-center justify-center p-1 transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-xs border border-amber-400'
                        : 'bg-[#FAF8F5] hover:bg-stone-100 active:bg-amber-100 text-stone-800 border border-stone-200/60'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold leading-none">#{displayNum}</span>
                    <span className="text-[9.5px] text-stone-500 truncate max-w-[95%] font-serif leading-none mt-1">
                      {item.name.replace(/^[^a-zA-Z0-9\u0900-\u097F]+/, '').slice(0, 9)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = selectedId === item.id;
              // Check if we should render a section header banner
              const prevItem = idx > 0 ? filteredItems[idx - 1] : null;
              const isNewSection = item.section && (!prevItem || prevItem.section !== item.section);

              return (
                <React.Fragment key={item.id}>
                  {isNewSection && hasMultipleMultiItemSections && selectedSection === null && (
                    <div className="pt-3 pb-1 px-2 select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-[6px] border border-amber-300/40">
                          {item.section}
                        </span>
                        <div className="h-px flex-1 bg-stone-100" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full text-left min-h-[48px] px-3.5 py-2.5 rounded-[16px] flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#FEF9C3] border border-amber-300/80 text-stone-900 shadow-2xs'
                        : 'hover:bg-stone-50 active:bg-amber-100/60 border border-transparent text-stone-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#FEF08A] text-[#78350F]'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {item.type === 'grantha' ? (
                          <BookOpen className="w-3.5 h-3.5" />
                        ) : (
                          <Feather className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`font-serif text-[13.5px] leading-snug block truncate ${
                            isSelected ? 'font-semibold text-[#78350F]' : 'font-medium text-stone-900'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.section &&
                          hasMultipleMultiItemSections &&
                          !item.name.toLowerCase().includes(item.section.toLowerCase()) && (
                            <span className="text-[10.5px] text-stone-500 font-sans font-medium block truncate mt-0.5">
                              {item.section}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.count !== undefined && (
                        <span
                          className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-amber-200/80 text-amber-950'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#78350F] stroke-[2.5]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                      )}
                    </div>
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes nativeBackdropFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes nativeSheetUp {
          from {
            transform: translate3d(0, 100%, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
};
