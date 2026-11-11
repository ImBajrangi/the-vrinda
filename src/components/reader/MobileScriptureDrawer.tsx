import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, BookOpen, Feather, ChevronRight, Check } from 'lucide-react';

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
 * - 1:1 true physics drag with momentum swipe-down to dismiss
 * - Full-surface drag detection (grab handle, title bar, search header, category strip)
 * - Intelligent overscroll pull-down to dismiss when at top of list
 * - Synchronized live backdrop opacity fading
 * - Section header grouping (e.g. बालकाण्ड, अयोध्याकाण्ड, स्कन्ध) for structured reading
 * - Real-time search query matching with instant results counter
 * - Micro-haptic tactile feedback on tap
 * - Strict concentric border radius geometry (Outer 32px -> Inner 14px -> Inner 10px)
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
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isMounted, setIsMounted] = useState(false);

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

  // Programmatic dismiss with spring glide animation
  const handleDismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';
      sheetRef.current.style.transform = 'translate3d(0, 100%, 0)';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 180ms ease-out';
      backdropRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      onClose();
      setIsRendered(false);
      isDismissing.current = false;
      document.body.style.overflow = '';
    }, 200);
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

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.section && item.section.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery]);

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
          isDragging.current = true;
          if (sheetRef.current) sheetRef.current.style.transition = 'none';
          if (backdropRef.current) backdropRef.current.style.transition = 'none';
        }
      } else {
        isDragging.current = false;
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
      sheetRef.current.style.transition = 'transform 220ms cubic-bezier(0.25, 1, 0.5, 1)';
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
    <div className="fixed inset-0 z-[100] pointer-events-auto flex flex-col justify-end">
      {/* 
        Crisp Dark Scrim Backdrop (0% GPU blur, 100% sharp background text)
      */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/40 transition-opacity duration-200"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* 
        Native Bottom Sheet Canvas
        Concentric Geometry: Outer rounded-t-[32px] -> Inner items rounded-[14px]
      */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full max-h-[85dvh] sm:max-h-[80dvh] bg-white rounded-t-[32px] shadow-[0_-12px_48px_rgba(0,0,0,0.18)] border-t border-stone-200/50 flex flex-col overflow-hidden will-change-transform animate-[nativeSheetUp_240ms_cubic-bezier(0.32,0.72,0,1)]"
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

        {/* Search Box & Query Status */}
        <div className="px-5 pt-3 pb-2 shrink-0 bg-white">
          <div className="relative flex items-center w-full h-10 px-3.5 rounded-[14px] bg-[#F4F4F5] border border-stone-200/70 focus-within:bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all duration-150">
            <Search className="w-4 h-4 text-stone-400 shrink-0 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="खोजें... (Search sarga, adhyaya, saint)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2.5 pr-6 bg-transparent text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none border-none focus:outline-none focus:ring-0 select-text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
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

        {/* Scrollable Items List with Intelligent Section Grouping */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 space-y-1 drawer-scrollable pb-[max(1.75rem,env(safe-area-inset-bottom,1.75rem))]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center select-none">
              <p className="text-sm font-serif font-bold text-stone-500">कोई परिणाम नहीं मिला</p>
              <p className="text-xs text-stone-400 mt-1">कृपया अन्य शब्द से खोजें</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = selectedId === item.id;
              // Check if we should render a section header banner
              const prevItem = idx > 0 ? filteredItems[idx - 1] : null;
              const isNewSection = item.section && (!prevItem || prevItem.section !== item.section);

              return (
                <React.Fragment key={item.id}>
                  {isNewSection && (
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
                    className={`w-full text-left min-h-[48px] px-3.5 py-2.5 rounded-[14px] flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#FEF9C3] border border-amber-300/80 text-stone-900 shadow-2xs'
                        : 'hover:bg-stone-50 active:bg-stone-100 border border-transparent text-stone-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 transition-colors ${
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
                            isSelected ? 'font-bold text-[#78350F]' : 'font-medium text-stone-900'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.section && !isNewSection && (
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
