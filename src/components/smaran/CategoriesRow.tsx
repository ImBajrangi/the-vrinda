import React, { useState } from 'react';
import {
  BookOpen,
  Feather,
  Landmark,
  Clock,
  Waves,
  Music,
  SunMedium,
  Footprints,
} from 'lucide-react';
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

  const tabsList: {
    id: ContentBarTab;
    label: string;
    mobileLabel: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }[] = [
    { id: 'books', label: 'पावन ग्रंथ', mobileLabel: 'ग्रंथ', count: books.length, icon: BookOpen, iconColor: 'text-amber-600' },
    { id: 'authors', label: 'रसिक आचार्य', mobileLabel: 'संत', count: authors.length, icon: Feather, iconColor: 'text-amber-700' },
    { id: 'relations', label: 'लीला एवं धाम', mobileLabel: 'लीला', count: relations.length, icon: Landmark, iconColor: 'text-[#0284C7]' },
  ];

  const activeIndex = Math.max(0, tabsList.findIndex((t) => t.id === activeTab));

  // Helper for Book Calligraphy Initials
  const getBookInitials = (id: string, devanagari: string): string => {
    if (id.includes('chaurasi')) return 'हित';
    if (id.includes('kelimal')) return 'केलि';
    if (id.includes('sudha')) return 'सुधा';
    if (id.includes('vyas')) return 'व्यास';
    if (id.includes('bayalees')) return 'लीला';
    if (id.includes('sur')) return 'सूर';
    if (id.includes('raskhan')) return 'रस';
    if (id.includes('bhakti')) return 'भक्ति';
    if (id.includes('binod')) return 'बिनोद';
    return devanagari.replace(/^श्री\s*/, '').slice(0, 2) || 'वाणी';
  };

  // Clean, Quiet Luxury Sacred Emblems (No Multi-Colored Gradients)
  const renderRelationEmblem = (relId: string) => {
    let Icon = Clock;
    let sealText = 'धाम लीला';

    if (relId === 'ashtayama') {
      Icon = SunMedium;
      sealText = '८ प्रहर';
    } else if (relId === 'parikrama') {
      Icon = Footprints;
      sealText = '८४ कोस';
    } else if (relId === 'yamuna') {
      Icon = Waves;
      sealText = 'कालिन्दी';
    } else if (relId === 'ragas') {
      Icon = Music;
      sealText = 'राग धारा';
    }

    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] bg-[#FAF8F5] border border-neutral-200/80 flex flex-col items-center justify-center p-1.5 shadow-2xs shrink-0 group-hover:border-amber-300 transition-colors">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100/60 flex items-center justify-center text-amber-800 shrink-0">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800" />
        </div>
        <span className="text-[9.5px] sm:text-[10px] font-serif font-bold text-neutral-700 tracking-wide mt-1 leading-none text-center">
          {sealText}
        </span>
      </div>
    );
  };

  return (
    <section className="w-full bg-white rounded-[40px] sm:rounded-[44px] p-4 sm:p-5 mb-6 space-y-4 sm:space-y-5 border border-neutral-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      {/* 1. Header with Obsidian Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              पावन ग्रंथ, रसिक संत एवं धाम लीला संग्रह
            </h3>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono">
              {activeTab === 'books'
                ? `ग्रंथ संग्रह (${books.length})`
                : activeTab === 'authors'
                ? `रसिक संत (${authors.length})`
                : `धाम लीला (${relations.length})`}
            </span>
          </div>
          <p className="text-xs text-[#71717A] font-normal mt-1 font-laila">
            श्री वृन्दावन धाम के परम पावन ग्रंथ, रसिक आचार्य एवं नित्य निकुंज लीला स्थली।
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSaintsDirectory}
          className="company-link text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-900 self-start sm:self-auto cursor-pointer font-laila"
        >
          <span>१३१ रसिक संत नामावली</span>
          <span className="text-base leading-none">→</span>
        </button>
      </div>

      {/* 2. Segmented Category Switcher with Sunlit-Gold Sliding Pill */}
      <div className="w-full flex justify-center">
        <div className="relative w-full max-w-xl grid grid-cols-3 p-1 bg-[#FAF6EE] rounded-full border border-amber-200/50">
          {/* Dynamic Sliding Indicator Bar */}
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-transform duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform shadow-xs"
            style={{
              width: 'calc((100% - 8px) / 3)',
              left: '4px',
              transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
            }}
          />

          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 py-2 px-2 sm:px-3 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                  isActive ? 'text-[#18181B] font-bold' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-[#B45309]' : tab.iconColor
                  }`}
                />
                <span className="truncate">
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full leading-none shrink-0 transition-colors ${
                    isActive ? 'bg-[#FACC15] text-[#78350F]' : 'bg-neutral-200/70 text-[#71717A]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION A: Canonical Books (Merged Rows, Soft Outer Area) */}
      {activeTab === 'books' && (
        <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white divide-y divide-neutral-100">
          {books.map((book) => {
            const initials = getBookInitials(book.id, book.devanagari);
            return (
              <div
                key={book.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectBook(book.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectBook(book.id)}
                className="group w-full p-4 sm:p-5 flex items-center justify-between gap-4 sm:gap-6 hover:bg-[#FAF8F5]/80 transition-colors duration-150 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                  {/* Book Pothi / Scripture Cover Emblems */}
                  <div className="w-12 h-16 sm:w-14 sm:h-18 shrink-0">
                    <ArtworkGraphicSlot
                      src={book.imageUrl || null}
                      aspectRatio="portrait"
                      theme="amber"
                      placeholderCategory="book"
                      roundedClassName="rounded-[12px]"
                      customFallback={
                        <div className="w-full h-full rounded-[12px] bg-[#FAF8F5] border border-amber-200/60 p-2 flex flex-col justify-between items-center relative overflow-hidden shadow-2xs group-hover:border-amber-400 transition-colors">
                          <span className="w-2 h-3.5 bg-amber-500 rounded-b-sm absolute top-0 right-2" />
                          <div className="w-full flex items-center justify-center mt-0.5">
                            <BookOpen className="w-3.5 h-3.5 text-amber-700/70" />
                          </div>
                          <span className="font-rozha text-base sm:text-lg text-amber-950 font-bold leading-none text-center">
                            {initials}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.2 rounded">
                            {book.count}
                          </span>
                        </div>
                      }
                    />
                  </div>

                  {/* Information Stack (Rozha & Laila Hindi Typography) */}
                  <div className="flex flex-col min-w-0 flex-1 justify-center">
                    <div className="text-xs font-laila font-semibold text-amber-800 tracking-wider mb-0.5 truncate">
                      {book.tradition} &nbsp; {book.author}
                    </div>

                    <h4 className="font-rozha text-xl sm:text-2xl text-[#18181B] group-hover:text-amber-950 transition-colors leading-tight truncate">
                      {book.devanagari}
                    </h4>

                    <p className="text-xs sm:text-[13px] font-laila text-neutral-500 line-clamp-1 mt-1 leading-relaxed">
                      {book.essence}
                    </p>

                    <div className="text-[11px] font-mono text-neutral-400 mt-1">
                      {book.count} {book.countUnit === 'Padas' ? 'पद संग्रह' : book.countUnit} • मूल ग्रंथ
                    </div>
                  </div>
                </div>

                {/* Right Action Affordance (Company Underline Animation) */}
                <div className="company-link group-company-link text-xs sm:text-sm font-laila font-semibold text-neutral-600 group-hover:text-amber-900 transition-colors shrink-0 pl-2">
                  <span>वाणी पाठ</span>
                  <span className="text-amber-700 text-base leading-none">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. SECTION B: Master Authors & Rasik Saints (Merged Rows, Soft Outer Area) */}
      {activeTab === 'authors' && (
        <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white divide-y divide-neutral-100">
          {authors.map((author) => (
            <div
              key={author.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectAuthor(author.name)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectAuthor(author.name)}
              className="group w-full p-4 sm:p-5 flex items-center justify-between gap-4 sm:gap-6 hover:bg-[#FAF8F5]/80 transition-colors duration-150 cursor-pointer select-none"
            >
              <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                {/* Saint Medallion Emblems */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0">
                  <ArtworkGraphicSlot
                    src={author.imageUrl || null}
                    aspectRatio="square"
                    theme="amber"
                    placeholderCategory="saint"
                    roundedClassName="rounded-full"
                    customFallback={
                      <div className="w-full h-full rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center relative overflow-hidden shadow-2xs group-hover:border-amber-400 transition-colors">
                        <Feather className="w-5 h-5 text-amber-800" />
                      </div>
                    }
                  />
                </div>

                {/* Information Stack */}
                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="text-xs font-laila font-semibold text-amber-800 tracking-wider mb-0.5 truncate">
                    {author.tradition} &nbsp; रसिक आचार्य
                  </div>

                  <h4 className="font-rozha text-xl sm:text-2xl text-[#18181B] group-hover:text-amber-950 transition-colors leading-tight truncate">
                    {author.devanagari}
                  </h4>

                  <p className="text-xs sm:text-[13px] font-laila text-neutral-500 line-clamp-1 mt-1 leading-relaxed">
                    {author.significance}
                  </p>

                  <div className="text-[11px] font-mono text-neutral-400 mt-1">
                    {author.totalCompositions} पद उपलब्ध • रसिक वाणी
                  </div>
                </div>
              </div>

              {/* Right Action Affordance (Company Underline Animation) */}
              <div className="company-link group-company-link text-xs sm:text-sm font-laila font-semibold text-neutral-600 group-hover:text-amber-900 transition-colors shrink-0 pl-2">
                <span>रसिक वाणी</span>
                <span className="text-amber-700 text-base leading-none">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. SECTION C: Sacred Leelas & Dham Relations (Merged Rows, Soft Outer Area) */}
      {activeTab === 'relations' && (
        <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white divide-y divide-neutral-100">
          {relations.map((rel) => {
            const isAshtayama = rel.id === 'ashtayama';
            const isParikrama = rel.id === 'parikrama';
            const isYamuna = rel.id === 'yamuna';

            let relEyebrow = 'ब्रज शास्त्रीय संगीत';
            if (isAshtayama) relEyebrow = 'अष्टयाम सेवा  ८ प्रहर नित्य सेवा';
            else if (isParikrama) relEyebrow = 'ब्रज तीर्थ परिक्रमा  ८४ कोस महामार्ग';
            else if (isYamuna) relEyebrow = 'पावन कालिन्दी सेवा  केशी घाट';

            let actionText = 'राग संगीत';
            if (isAshtayama) actionText = 'लीला दर्शन';
            else if (isParikrama) actionText = 'परिक्रमा दर्शन';
            else if (isYamuna) actionText = 'यमुना भाव';

            return (
              <div
                key={rel.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectRelation(rel.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectRelation(rel.id)}
                className="group w-full p-4 sm:p-5 flex items-center justify-between gap-4 sm:gap-6 hover:bg-[#FAF8F5]/80 transition-colors duration-150 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                  {/* Bespoke Visual Emblem */}
                  <div className="shrink-0">
                    <ArtworkGraphicSlot
                      src={rel.imageUrl || null}
                      aspectRatio="square"
                      theme={isYamuna ? 'sky' : isParikrama ? 'orange' : 'amber'}
                      roundedClassName="rounded-[12px]"
                      customFallback={renderRelationEmblem(rel.id)}
                    />
                  </div>

                  {/* Information Stack */}
                  <div className="flex flex-col min-w-0 flex-1 justify-center">
                    <div className="text-xs font-laila font-semibold text-amber-800 tracking-wider mb-0.5 truncate">
                      {relEyebrow}
                    </div>

                    <h4 className="font-rozha text-xl sm:text-2xl text-[#18181B] group-hover:text-amber-950 transition-colors leading-tight truncate">
                      {rel.devanagari}
                    </h4>

                    <p className="text-xs sm:text-[13px] font-laila text-neutral-500 line-clamp-1 mt-1 leading-relaxed">
                      {rel.essence}
                    </p>

                    <div className="text-[11px] font-mono text-neutral-400 mt-1">
                      नित्य निकुंज विहार धाम
                    </div>
                  </div>
                </div>

                {/* Right Action Affordance (Company Underline Animation) */}
                <div className="company-link group-company-link text-xs sm:text-sm font-laila font-semibold text-neutral-600 group-hover:text-amber-900 transition-colors shrink-0 pl-2">
                  <span>{actionText}</span>
                  <span className="text-amber-700 text-base leading-none">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
