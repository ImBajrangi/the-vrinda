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
 * Uses React Portal to mount directly into document.body,
 * avoiding any parent CSS transforms or layout constraints.
 *
 * Features:
 * - 0% background blur (clean crisp dimmed overlay, zero lag)
 * - True 1:1 touch tracking with instant swipe-down-to-dismiss
 * - Works from both the grab handle and when pulling down from the top of the list
 * - Real-time backdrop fade proportional to drag distance
 * - Safe area padding for iPhone home indicator and Android navigation bar
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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
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
  const touchStartedInHeader = useRef<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync open/close states
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimatingOut(false);
      setSearchQuery('');
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    } else if (isRendered) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsAnimatingOut(false);
        document.body.style.overflow = '';
      }, 240);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  // Programmatic dismiss with spring animation
  const handleDismiss = useCallback(() => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 200ms ease-out';
      backdropRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsAnimatingOut(false);
      document.body.style.overflow = '';
      if (sheetRef.current) {
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
      }
      if (backdropRef.current) {
        backdropRef.current.style.opacity = '';
        backdropRef.current.style.transition = '';
      }
    }, 220);
  }, [onClose, isAnimatingOut]);

  // Swipe-down touch handlers with guaranteed gesture safety
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isAnimatingOut) return;
      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      startTime.current = Date.now();

      const target = e.target as HTMLElement;
      // Restrict drag-to-dismiss strictly to the grab handle / top header zone
      // This guarantees fluid, unhindered momentum scrolling inside the items list
      const isInDragZone = Boolean(target.closest('.drawer-drag-zone'));
      touchStartedInHeader.current = isInDragZone;

      if (isInDragZone) {
        isDragging.current = true;
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
        if (backdropRef.current) backdropRef.current.style.transition = 'none';
      } else {
        isDragging.current = false;
      }
    },
    [isAnimatingOut]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward drag
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;

      if (backdropRef.current) {
        const sheetHeight = sheetRef.current.offsetHeight || 500;
        const progress = Math.min(1, deltaY / (sheetHeight * 0.65));
        backdropRef.current.style.opacity = String(Math.max(0, 1 - progress));
      }
    } else {
      // Gentle rubber-band resistance if pulled upwards
      const resistance = Math.max(-12, deltaY * 0.12);
      sheetRef.current.style.transform = `translate3d(0, ${resistance}px, 0)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!sheetRef.current) return;
    const wasDragging = isDragging.current;
    isDragging.current = false;

    const deltaY = currentY.current - startY.current;
    const elapsed = Math.max(1, Date.now() - startTime.current);
    const velocity = deltaY / elapsed;

    // Fluid dismissal if dragged down more than 40px OR flicked downward (> 0.2 px/ms)
    const shouldDismiss = wasDragging && (deltaY > 40 || (deltaY > 15 && velocity > 0.2));

    if (shouldDismiss) {
      handleDismiss();
    } else {
      // Always snap back cleanly to 0 if not dismissed
      sheetRef.current.style.transition = 'transform 200ms cubic-bezier(0.2, 0, 0, 1)';
      sheetRef.current.style.transform = 'translate3d(0, 0, 0)';

      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 180ms ease-out';
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
      }, 200);
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
        Crisp Native Backdrop:
        NO backdrop-blur (zero blur, zero lag, sharp scripture behind).
      */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 bg-black/45 transition-opacity duration-200 ${
          isAnimatingOut ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* 
        Native Bottom Sheet Canvas:
        Stuck strictly to bottom-0 of the real viewport via Portal.
        Concentric Radius: outer rounded-t-[28px], padding 16px -> inner item radius 12px.
      */}
      <div
        ref={sheetRef}
        className={`relative z-10 w-full max-h-[88vh] bg-white rounded-t-[28px] shadow-[0_-12px_48px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden will-change-transform ${
          isAnimatingOut
            ? 'translate-y-full transition-transform duration-240 ease-[cubic-bezier(0.32,0.72,0,1)]'
            : 'animate-[nativeSheetUp_280ms_cubic-bezier(0.32,0.72,0,1)]'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Dedicated Drag Zone (Handle + Header) - touch-none prevents browser page-drag collision */}
        <div className="drawer-drag-zone select-none shrink-0 cursor-grab active:cursor-grabbing bg-white border-b border-neutral-100 touch-none">
          {/* iOS Grab Capsule Handle */}
          <div className="w-full flex items-center justify-center pt-2.5 pb-1 pointer-events-none">
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

        {/* Native Spotlight Search Box */}
        <div className="px-5 pt-3 pb-2 shrink-0">
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
          className="flex-1 overflow-y-auto overscroll-contain px-4 space-y-1 drawer-scrollable pb-8"
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
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
};
