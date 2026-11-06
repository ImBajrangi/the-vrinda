import React, { useState } from 'react';
import { BookOpen, Feather, Landmark, ExternalLink, Sparkles, Compass } from 'lucide-react';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';
import { SacredDatabase } from '../../services/sacredDatabase';

export type ContentBarTab = 'books' | 'authors' | 'relations';

interface CategoriesRowProps {
  onSelectBook: (granthaId: string) => void;
  onSelectAuthor: (authorName: string) => void;
  onSelectRelation: (relationId: string) => void;
  onOpenSaintsDirectory: () => void;
}

export const CategoriesRow: React.FC<CategoriesRowProps> = ({
  onSelectBook,
  onSelectAuthor,
  onSelectRelation,
  onOpenSaintsDirectory,
}) => {
  const [activeTab, setActiveTab] = useState<ContentBarTab>('books');
  const books = SacredDatabase.getDisplayBooks();
  const authors = SacredDatabase.getDisplayAuthors();
  const relations = SacredDatabase.getSacredTopics();

  return (
    <section className="w-full bg-white rounded-[32px] p-6 sm:p-7 border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-6 space-y-4">
      {/* 1. Header with Royal Purple Dot & Crisp Obsidian Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0" />
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              पावन ग्रंथ, रसिक संत एवं धाम लीला संग्रह
            </h3>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-mono">
              {activeTab === 'books' ? `ग्रंथ संग्रह (${books.length})` : activeTab === 'authors' ? `रसिक संत (${authors.length})` : `धाम लीला (${relations.length})`}
            </span>
          </div>
          <p className="text-xs text-[#71717A] font-normal mt-1">
            श्री वृन्दावन धाम के परम पावन ग्रंथ, रसिक आचार्य एवं नित्य निकुंज लीला स्थली।
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSaintsDirectory}
          className="text-xs sm:text-sm font-semibold text-purple-700 hover:underline self-start sm:self-auto cursor-pointer flex items-center gap-1"
        >
          <span>१३१ रसिक संत नामावली</span>
          <span>→</span>
        </button>
      </div>

      {/* 2. Clean Segmented Category Switcher */}
      <div className="w-full flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[#F4F4F5]/70 rounded-[22px] border border-neutral-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('books')}
          className={`flex-1 py-2.5 px-3 rounded-[16px] text-xs font-bold transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 ${
            activeTab === 'books'
              ? 'bg-white text-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80'
              : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span>पावन ग्रंथ ({books.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('authors')}
          className={`flex-1 py-2.5 px-3 rounded-[16px] text-xs font-bold transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 ${
            activeTab === 'authors'
              ? 'bg-white text-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80'
              : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
          }`}
        >
          <Feather className="w-3.5 h-3.5 text-purple-600" />
          <span>रसिक आचार्य ({authors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('relations')}
          className={`flex-1 py-2.5 px-3 rounded-[16px] text-xs font-bold transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 ${
            activeTab === 'relations'
              ? 'bg-white text-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80'
              : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>लीला एवं धाम ({relations.length})</span>
        </button>
      </div>

      {/* 3. SECTION A: Canonical Books - Graphics Friendly Layout */}
      {activeTab === 'books' && (
        <div className="space-y-3 pt-1">
          {books.map((book) => (
            <div
              key={book.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectBook(book.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectBook(book.id)}
              className="w-full bg-white rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-neutral-200/80 hover:border-neutral-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* Book Cover Graphics Slot: Empty & ready for artwork */}
                <div className="w-14 h-18 sm:w-16 sm:h-22 shrink-0">
                  <ArtworkGraphicSlot
                    src={book.imageUrl || null}
                    aspectRatio="portrait"
                    theme="amber"
                    placeholderLabel="आवरण चित्र"
                    placeholderCategory="book"
                    roundedClassName="rounded-[14px]"
                  />
                </div>

                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate ${book.tagColor}`}>
                      {book.tradition} • {book.count} {book.countUnit}
                    </span>
                    <div className="sm:hidden">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-800 bg-amber-50">
                        Grantha
                      </span>
                    </div>
                  </div>

                  <h4 className="font-serif font-bold text-base sm:text-lg text-[#18181B] leading-tight truncate">
                    {book.title} ({book.devanagari})
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#71717A] mt-1 overflow-hidden whitespace-nowrap font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">
                      By {book.author} • {book.essence}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-2">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-800 bg-amber-50">
                    Canonical Grantha
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                </div>

                <div className="sm:hidden">
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </div>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#18181B] mt-auto font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Read Grantha →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. SECTION B: Master Authors & Rasik Saints - Graphics Friendly Layout */}
      {activeTab === 'authors' && (
        <div className="space-y-3 pt-1">
          {authors.map((author) => (
            <div
              key={author.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectAuthor(author.name)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectAuthor(author.name)}
              className="w-full bg-white rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-neutral-200/80 hover:border-neutral-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* Saint Portrait Graphics Slot: Empty & ready for artwork */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                  <ArtworkGraphicSlot
                    src={author.imageUrl || null}
                    aspectRatio="square"
                    theme="purple"
                    placeholderLabel="संत स्वरूप"
                    placeholderCategory="saint"
                    roundedClassName="rounded-[16px]"
                  />
                </div>

                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate ${author.tagColor}`}>
                      {author.tradition} • {author.totalCompositions} Vanis
                    </span>
                    <div className="sm:hidden">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-purple-700 bg-purple-50">
                        Rasik Saint
                      </span>
                    </div>
                  </div>

                  <h4 className="font-serif font-bold text-base sm:text-lg text-[#18181B] leading-tight truncate">
                    {author.name} ({author.devanagari})
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#71717A] mt-1 overflow-hidden whitespace-nowrap font-medium">
                    <Feather className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">
                      {author.significance}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-2">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-purple-700 bg-purple-50">
                    Rasik Acharya
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                </div>

                <div className="sm:hidden">
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </div>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#18181B] mt-auto font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Explore Vanis →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. SECTION C: Sacred Leelas & Dham Relations - Graphics Friendly Layout */}
      {activeTab === 'relations' && (
        <div className="space-y-3 pt-1">
          {relations.map((rel) => (
            <div
              key={rel.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectRelation(rel.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectRelation(rel.id)}
              className="w-full bg-white rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-neutral-200/80 hover:border-neutral-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* Dham Leela Landscape Graphics Slot: Empty & ready for artwork */}
                <div className="w-18 h-14 sm:w-22 sm:h-16 shrink-0">
                  <ArtworkGraphicSlot
                    src={rel.imageUrl || null}
                    aspectRatio="card"
                    theme="sky"
                    placeholderLabel="धाम लीला"
                    placeholderCategory="dham"
                    roundedClassName="rounded-[14px]"
                  />
                </div>

                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate ${rel.tagColor}`}>
                      {rel.typeLabel} • {rel.location}
                    </span>
                    <div className="sm:hidden">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-sky-800 bg-sky-50">
                        Dham Seva
                      </span>
                    </div>
                  </div>

                  <h4 className="font-serif font-bold text-base sm:text-lg text-[#18181B] leading-tight truncate">
                    {rel.title} ({rel.devanagari})
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#71717A] mt-1 overflow-hidden whitespace-nowrap font-medium">
                    <Compass className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                    <span className="truncate">
                      {rel.tradition} • {rel.essence}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-2">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-sky-800 bg-sky-50">
                    Dham Relation
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                </div>

                <div className="sm:hidden">
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </div>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#18181B] mt-auto font-mono">
                  <Compass className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Discover Lila →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
