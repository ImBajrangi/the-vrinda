import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, BookOpen, Feather, ChevronRight } from 'lucide-react';

interface ScriptureItem {
  id: string;
  name: string;
  count?: number;
  section?: string;
  /** Whether this is a pada or a chapter */
  type: 'grantha' | 'chapter' | 'pada';
}

interface MobileScriptureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Title to show at the top of the drawer */
  title: string;
  /** Subtitle / secondary info */
  subtitle?: string;
  /** Items to display in the list */
  items: ScriptureItem[];
  /** Currently selected item id */
  selectedId?: string;
  /** Callback when user selects an item */
  onSelect: (id: string) => void;
  /** Optional: show category tabs at the top */
  categories?: { id: string; label: string }[];
  /** Currently active category */
  activeCategory?: string;
  /** Category change handler */
  onCategoryChange?: (catId: string) => void;
}

/**
 * Mobile-optimized Bottom Sheet Drawer for switching between
 * Granthas, Chapters, Padas, and Authors.
 *
 * Architecture:
 * - Fullscreen backdrop with blur
 * - Bottom-anchored sheet with drag-to-dismiss
 * - Instant search filter
 * - Touch-friendly large hit targets (min 44px)
 * - Concentric border radius: outer 24px, padding 12px, inner items 12px
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dragStartY = useRef<number>(0);
  const currentTranslateY = useRef<number>(0);
  const isDragging = useRef(false);

  // Reset search when drawer opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      // Focus search after animation
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Filtered items
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

  // Drag-to-dismiss handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Only allow drag from the handle area or header
    if (target.closest('.drawer-scrollable')) return;
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    // Dismiss if dragged more than 120px
    if (currentTranslateY.current > 120) {
      sheetRef.current.style.transform = 'translateY(100%)';
      setTimeout(onClose, 200);
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    currentTranslateY.current = 0;
  }, [onClose]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-white rounded-t-[24px] shadow-[0_-16px_48px_rgba(0,0,0,0.12)] flex flex-col animate-[slideUp_280ms_cubic-bezier(0.32,0.72,0,1)]"
        style={{ transition: 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-base text-neutral-900 leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative flex items-center w-full px-3.5 py-2.5 rounded-[12px] bg-neutral-50 border border-neutral-200/80 focus-within:border-amber-400/60 focus-within:bg-white focus-within:shadow-[0_2px_8px_rgba(217,119,6,0.06)] transition-all duration-200">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="खोजें... (Search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2.5 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none border-none focus:outline-none focus:ring-0 focus:border-none ring-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs (optional) */}
        {categories && categories.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange?.(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none shrink-0 ${isActive
                      ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 drawer-scrollable">
          <div className="space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-neutral-400 font-serif">कोई परिणाम नहीं</p>
                <p className="text-xs text-neutral-300 mt-1">No results found</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full text-left min-h-[48px] px-4 py-3 rounded-[12px] flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${isSelected
                      ? 'bg-[#FEF9C3] border border-amber-200/80'
                      : 'hover:bg-neutral-50 border border-transparent'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'grantha' ? (
                          <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-700' : 'text-neutral-400'}`} />
                        ) : (
                          <Feather className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-700' : 'text-neutral-400'}`} />
                        )}
                        <span className={`font-serif text-sm truncate ${isSelected ? 'font-bold text-neutral-900' : 'text-neutral-700'}`}>
                          {item.name}
                        </span>
                      </div>
                      {item.section && (
                        <span className="text-[10px] text-neutral-400 font-medium mt-0.5 pl-5.5 block truncate">
                          {item.section}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.count !== undefined && (
                        <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-amber-700' : 'text-neutral-400'}`}>
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-neutral-300'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

