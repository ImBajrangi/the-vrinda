import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, BookOpen, Feather, ChevronRight } from 'lucide-react';

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

/**
 * Native Mobile Bottom Sheet Drawer.
 *
 * Uses React Portal to mount directly into document.body.
 *
 * Features:
 * - 0% background blur (crisp darkened overlay, zero GPU blur lag)
 * - Fluid 1:1 gesture tracking with native-grade swipe-down dismissal
 * - Works anywhere in the header/search/tabs AND overscroll pull-down from top of list
 * - Dynamic backdrop fade synchronized with drag distance
 * - Safe area padding for iOS home indicator and Android navigation bars
 * - Concentric nested border radii
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

      // Reset transforms when opened
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

  // Keyboard navigation (Escape to dismiss)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
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
  const filteredItems = searchQuery.trim()
    ? items.filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.section && item.section.toLowerCase().includes(q))
        );
      })
    : items;

  // Swipe-down touch handlers with full-surface drag support
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
        // Tapping in grab handle, header, tabs, search row starts drag immediately
        // Exception: allow typing in the search input
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

    // Check if user is pulling down from top of scroll list
    if (isListTouch.current && !isDragging.current) {
      const scrollEl = scrollContainerRef.current;
      const isAtTop = !scrollEl || scrollEl.scrollTop <= 0;
      if (isAtTop && deltaY > 8) {
        // Switch into drawer drag mode
        isDragging.current = true;
        startY.current = touch.clientY; // Anchor smooth drag from 0
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
      // Gentle rubber-band resistance when pulling up
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

    // Dismiss if pulled down > 55px OR flicked downward (> 0.22 px/ms)
    const shouldDismiss = deltaY > 55 || (deltaY > 15 && velocity > 0.22);

    if (shouldDismiss) {
      handleDismiss();
    } else {
      // Snap back smoothly with iOS spring curve
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
      onSelect(id);
      handleDismiss();
    },
    [onSelect, handleDismiss]
  );

  if (!isMounted || !isRendered) return null;

  const content = (
    <div className="fixed inset-0 z-[100] pointer-events-auto flex flex-col justify-end">
      {/* 
        Crisp Native Tint Backdrop:
        NO backdrop-blur (zero blur, zero GPU lag, 100% sharp scripture behind).
      */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/40 transition-opacity duration-200"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* 
        Native Bottom Sheet Canvas:
        Stuck strictly to bottom-0 of the real viewport.
        Concentric Radius: outer rounded-t-[28px], inner items rounded-[12px].
      */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full max-h-[85dvh] sm:max-h-[80dvh] bg-white rounded-t-[28px] shadow-[0_-12px_48px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden will-change-transform animate-[nativeSheetUp_240ms_cubic-bezier(0.32,0.72,0,1)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Dedicated Grab Handle & Header Zone */}
        <div className="select-none shrink-0 bg-white border-b border-neutral-100 touch-none">
          {/* iOS Grab Capsule Handle (Generous touch target) */}
          <div className="w-full flex items-center justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 rounded-full bg-neutral-300" />
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between px-5 pt-1 pb-3">
            <div className="min-w-0 flex-1 pr-3">
              <h3 className="font-serif font-bold text-base text-neutral-900 leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-neutral-500 font-serif font-medium mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-neutral-100 active:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Spotlight Search Box */}
        <div className="px-5 pt-3 pb-2 shrink-0 bg-white">
          <div className="relative flex items-center w-full h-10 px-3.5 rounded-[12px] bg-[#F4F4F5] border border-neutral-200/60 focus-within:bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all duration-150">
            <Search className="w-4 h-4 text-neutral-400 shrink-0 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="खोजें... (Search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2.5 pr-6 bg-transparent text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-none border-none focus:outline-none focus:ring-0 select-text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Filter Strip (if available) */}
        {categories && categories.length > 0 && (
          <div className="px-5 pb-2.5 shrink-0 bg-white border-b border-neutral-100">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange?.(cat.id)}
                    className={`h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none shrink-0 ${
                      isActive
                        ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 active:bg-neutral-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Items List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 space-y-1 drawer-scrollable pb-[max(1.75rem,env(safe-area-inset-bottom,1.75rem))]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center select-none">
              <p className="text-sm font-serif font-bold text-neutral-500">कोई परिणाम नहीं मिला</p>
              <p className="text-xs text-neutral-400 mt-1">कृपया अन्य शब्द से खोजें</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-left min-h-[46px] px-3.5 py-2.5 rounded-[12px] flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#FEF9C3] border border-amber-300/80 text-neutral-900 shadow-2xs'
                      : 'hover:bg-neutral-50 active:bg-neutral-100 border border-transparent text-neutral-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.type === 'grantha' ? (
                        <BookOpen
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-amber-700' : 'text-neutral-400'
                          }`}
                        />
                      ) : (
                        <Feather
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-amber-700' : 'text-neutral-400'
                          }`}
                        />
                      )}
                      <span
                        className={`font-serif text-xs sm:text-sm truncate ${
                          isSelected ? 'font-bold text-neutral-900' : 'font-medium'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    {item.section && (
                      <span className="text-[10px] text-neutral-400 font-serif font-medium mt-0.5 pl-5.5 block truncate">
                        {item.section}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.count !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-200/60 text-amber-900'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-amber-700' : 'text-neutral-300'
                      }`}
                    />
                  </div>
                </button>
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
