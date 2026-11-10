import React, { useState, useRef, useEffect, useCallback } from 'react';
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
 * Native-style Mobile Bottom Sheet Drawer.
 *
 * Features:
 * - Crisp native backdrop overlay (ZERO background blur to eliminate lag/flicker)
 * - Fluid, 60fps swipe-down-to-close with spring physics & velocity detection
 * - Works from both the grab handle AND the top of the scrollable list
 * - Real-time backdrop opacity tracking during touch drag
 * - Concentric nested border radius architecture
 * - Flexible for all mobile phones (low-end to high-end)
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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Gesture tracking refs
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const touchStartedInHeader = useRef<boolean>(false);

  // Sync mount/unmount with animation
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimatingOut(false);
      setSearchQuery('');
    } else if (isRendered) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsAnimatingOut(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  // Programmatic dismiss with native spring slide-out
  const handleDismiss = useCallback(() => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 240ms ease-out';
      backdropRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsAnimatingOut(false);
      if (sheetRef.current) {
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
      }
      if (backdropRef.current) {
        backdropRef.current.style.opacity = '';
        backdropRef.current.style.transition = '';
      }
    }, 240);
  }, [onClose, isAnimatingOut]);

  // Touch gesture handlers for swipe-down-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimatingOut) return;
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    startTime.current = Date.now();

    const target = e.target as HTMLElement;
    touchStartedInHeader.current = Boolean(target.closest('.drawer-drag-zone'));

    // Check if scroll container is at top
    const scrollEl = scrollContainerRef.current;
    const isAtTop = !scrollEl || scrollEl.scrollTop <= 0;

    if (touchStartedInHeader.current || isAtTop) {
      isDragging.current = true;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
      if (backdropRef.current) backdropRef.current.style.transition = 'none';
    } else {
      isDragging.current = false;
    }
  }, [isAnimatingOut]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Check if user is scrolling up inside the list
    if (!touchStartedInHeader.current) {
      const scrollEl = scrollContainerRef.current;
      if (scrollEl && scrollEl.scrollTop > 0) {
        isDragging.current = false;
        sheetRef.current.style.transform = '';
        return;
      }
    }

    // Only allow downward drag
    if (deltaY > 0) {
      // Direct 1:1 finger tracking with zero lag
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;

      // Real-time backdrop fade proportional to drag
      if (backdropRef.current) {
        const sheetHeight = sheetRef.current.offsetHeight || 500;
        const progress = Math.min(1, deltaY / (sheetHeight * 0.7));
        backdropRef.current.style.opacity = String(Math.max(0.1, 1 - progress * 0.9));
      }
    } else {
      // Slight resistance if pulled upward
      const resistance = Math.max(-20, deltaY * 0.2);
      sheetRef.current.style.transform = `translateY(${resistance}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;

    const deltaY = currentY.current - startY.current;
    const elapsed = Math.max(1, Date.now() - startTime.current);
    const velocity = deltaY / elapsed; // px per ms

    // Dismiss if dragged down more than 70px OR flicked downward fast (> 0.35 px/ms)
    const shouldDismiss = deltaY > 70 || (deltaY > 20 && velocity > 0.35);

    if (shouldDismiss) {
      handleDismiss();
    } else {
      // Snap back to 0 with native iOS spring physics
      sheetRef.current.style.transition = 'transform 260ms cubic-bezier(0.34, 1.2, 0.64, 1)';
      sheetRef.current.style.transform = 'translateY(0)';

      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 220ms ease-out';
        backdropRef.current.style.opacity = '1';
      }

      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = '';
          sheetRef.current.style.transform = '';
        }
        if (backdropRef.current) {
          backdropRef.current.style.transition = '';
          backdropRef.current.style.opacity = '';
        }
      }, 260);
    }
  }, [handleDismiss]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      handleDismiss();
    },
    [onSelect, handleDismiss]
  );

  if (!isRendered) return null;

  return (
    <>
      {/* 
        Crisp Native Backdrop:
        NO backdrop-blur to eliminate mobile lag and keep scripture behind crisp.
        Uses pure opacity fade.
      */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 z-50 bg-black/40 pointer-events-auto transition-opacity duration-200 ${
          isAnimatingOut ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* 
        Native Bottom Sheet Canvas:
        Concentric Radius: outer rounded-t-[28px], padding 16px -> inner element radius 12px.
      */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] bg-white rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col will-change-transform ${
          isAnimatingOut
            ? 'translate-y-full transition-transform duration-240 ease-[cubic-bezier(0.32,0.72,0,1)]'
            : 'animate-[nativeSheetUp_280ms_cubic-bezier(0.32,0.72,0,1)]'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Dedicated Drag Zone (Handle + Header) */}
        <div className="drawer-drag-zone select-none shrink-0 cursor-grab active:cursor-grabbing">
          {/* iOS Grab Capsule Handle */}
          <div className="w-full flex items-center justify-center pt-2.5 pb-1.5">
            <div className="w-11 h-1.5 rounded-full bg-neutral-300 active:bg-neutral-400 transition-colors" />
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between px-5 pt-1 pb-2.5">
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

        {/* Native Spotlight Search Box */}
        <div className="px-5 pb-2.5 shrink-0">
          <div className="relative flex items-center w-full h-10 px-3.5 rounded-[12px] bg-[#F2F2F7] border border-neutral-200/60 focus-within:bg-white focus-within:border-amber-400/80 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all duration-150">
            <Search className="w-4 h-4 text-neutral-400 shrink-0 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="खोजें... (Search chapter, pada, saint)"
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

        {/* Horizontal Category Switcher (if available) */}
        {categories && categories.length > 0 && (
          <div className="px-5 pb-2.5 shrink-0">
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
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 space-y-1 drawer-scrollable"
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
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};
