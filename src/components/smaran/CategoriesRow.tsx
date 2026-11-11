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
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';

export type ContentBarTab = 'mahagranth' | 'books' | 'authors' | 'relations';

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
  const [activeTab, setActiveTab] = useState<ContentBarTab>('mahagranth');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleBookClick = (granthaId: string) => {
    setLoadingItemId(granthaId);
    navigationProgress.start();
    onSelectBook(granthaId);
    setTimeout(() => setLoadingItemId(null), 800);
  };

  const handleAuthorClick = (authorName: string) => {
    setLoadingItemId(authorName);
    navigationProgress.start();
    onSelectAuthor(authorName);
    setTimeout(() => setLoadingItemId(null), 800);
  };

  const handleRelationClick = (relationId: string) => {
    setLoadingItemId(relationId);
    navigationProgress.start();
    onSelectRelation(relationId);
    setTimeout(() => setLoadingItemId(null), 800);
  };

  const mahagranths = SacredDatabase.getDisplayMahagranths();
  const rasikBooks = SacredDatabase.getDisplayRasikBooks();
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
      { id: 'mahagranth', label: 'सनातन महाग्रंथ', mobileLabel: 'महाग्रंथ', count: mahagranths.length, icon: BookOpen, iconColor: 'text-amber-700' },
      { id: 'books', label: 'रसिक वाणी', mobileLabel: 'वाणी', count: rasikBooks.length, icon: BookOpen, iconColor: 'text-amber-600' },
      { id: 'authors', label: 'रसिक आचार्य', mobileLabel: 'संत', count: authors.length, icon: Feather, iconColor: 'text-amber-700' },
      { id: 'relations', label: 'लीला एवं धाम', mobileLabel: 'लीला', count: relations.length, icon: Landmark, iconColor: 'text-[#0284C7]' },
    ];

  const activeIndex = Math.max(0, tabsList.findIndex((t) => t.id === activeTab));

  // Sacred Pothi Cover Architecture (3 Professional Variations from test-outer-line-options)
  // 1. 'gold-frame': Canonical Scriptures (Sant-Vaani Pure Scripture with balanced delicate gold filigree)
  // 2. 'cartouche': Extensive Collections & Anthologies (Gold Frame + Inset Cartouche Badge)
  // 3. 'pure-leather': Intimate Rasik Vanis, Dohas & Lyric Poetry (Borderless Pure Leather + Pill)
  type BookCoverStyle = 'gold-frame' | 'cartouche' | 'pure-leather';

  interface BookCoverConfig {
    bg: string;
    style: BookCoverStyle;
  }

  const getBookCoverConfig = (id: string, name: string): BookCoverConfig => {
    const specificConfigs: Record<string, BookCoverConfig> = {
      // 0. सनातन महाग्रंथ -> Style 1: Regal Ancient Gold Frame
      'valmiki-ramayana': {
        bg: 'linear-gradient(135deg, #421C0E 0%, #250E06 55%, #120602 100%)',
        style: 'gold-frame',
      },
      'shrimad-bhagavatam': {
        bg: 'linear-gradient(135deg, #162447 0%, #0D162E 55%, #060B17 100%)',
        style: 'gold-frame',
      },
      'ramcharitmanas': {
        bg: 'linear-gradient(135deg, #4A1218 0%, #28080C 55%, #130305 100%)',
        style: 'gold-frame',
      },
      'bhagavad-gita': {
        bg: 'linear-gradient(135deg, #3C2704 0%, #221501 55%, #100A00 100%)',
        style: 'gold-frame',
      },
      'durga-saptashati': {
        bg: 'linear-gradient(135deg, #470D21 0%, #290612 55%, #130208 100%)',
        style: 'gold-frame',
      },
      // 1. Foundational Sampradayic Scriptures -> Style 1: Delicate Gold Frame
      'hit-chaurasi': {
        bg: 'linear-gradient(135deg, #4A0E17 0%, #25060C 55%, #120205 100%)',
        style: 'gold-frame',
      },
      'kelimal': {
        bg: 'linear-gradient(135deg, #093326 0%, #041B14 55%, #020D0A 100%)',
        style: 'gold-frame',
      },
      'bhakti-shatak': {
        bg: 'linear-gradient(135deg, #3A1535 0%, #200A1D 55%, #10040E 100%)',
        style: 'gold-frame',
      },
      'sur-sagar': {
        bg: 'linear-gradient(135deg, #261646 0%, #150A29 55%, #080313 100%)',
        style: 'gold-frame',
      },
      'stotras': {
        bg: 'linear-gradient(135deg, #2D2E0E 0%, #181905 55%, #090A02 100%)',
        style: 'gold-frame',
      },

      // 2. Extensive Compilations & Anthologies -> Style 2: Gold Frame + Tag Cartouche
      'vyas-vani': {
        bg: 'linear-gradient(135deg, #3E2108 0%, #241203 55%, #120801 100%)',
        style: 'cartouche',
      },
      'bayalees-leela': {
        bg: 'linear-gradient(135deg, #102542 0%, #091527 55%, #040913 100%)',
        style: 'cartouche',
      },
      'braj-binod': {
        bg: 'linear-gradient(135deg, #421D10 0%, #260E07 55%, #120603 100%)',
        style: 'cartouche',
      },
      'rasik-vani-sangrah': {
        bg: 'linear-gradient(135deg, #44141E 0%, #260910 55%, #120307 100%)',
        style: 'cartouche',
      },

      // 3. Intimate Rasik Vanis, Dohas & Lyric Poetry -> Style 3: Borderless Pure Leather
      'lalit-kishori': {
        bg: 'linear-gradient(135deg, #4A121A 0%, #29080E 55%, #130306 100%)',
        style: 'pure-leather',
      },
      'biharin-dev': {
        bg: 'linear-gradient(135deg, #152B3C 0%, #0A1722 55%, #04090E 100%)',
        style: 'pure-leather',
      },
      'narayan-swami': {
        bg: 'linear-gradient(135deg, #381B34 0%, #210E1F 55%, #10060F 100%)',
        style: 'pure-leather',
      },
      'raskhan-padavali': {
        bg: 'linear-gradient(135deg, #133320 0%, #0A1C11 55%, #040C07 100%)',
        style: 'pure-leather',
      },
      'braj-dohe': {
        bg: 'linear-gradient(135deg, #421D10 0%, #260E07 55%, #120603 100%)',
        style: 'pure-leather',
      },
      'braj-savaiya': {
        bg: 'linear-gradient(135deg, #182C3F 0%, #0C1824 55%, #050B12 100%)',
        style: 'pure-leather',
      },
    };

    // Normalize IDs (e.g. biharin-dev-vani -> biharin-dev, braj-ke-dohe -> braj-dohe)
    const norm = (id || '')
      .replace(/-vani$/, '')
      .replace(/-ke-/, '-')
      .replace(/^akhand-/, '');

    if (specificConfigs[id]) return specificConfigs[id];
    if (specificConfigs[norm]) return specificConfigs[norm];

    // Deterministic fallback cycling through the 3 styles
    const seed = id || name;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
    const h1 = Math.abs(h % 360);
    const h2 = (h1 + 45) % 360;
    const styles: BookCoverStyle[] = ['gold-frame', 'cartouche', 'pure-leather'];
    return {
      bg: `linear-gradient(135deg, hsl(${h1}, 75%, 17%) 0%, hsl(${h2}, 70%, 8%) 100%)`,
      style: styles[Math.abs(h % 3)],
    };
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
              पावन महाग्रंथ, रसिक वाणी एवं संत संग्रह
            </h3>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono">
              {activeTab === 'mahagranth'
                ? `सनातन महाग्रंथ (${mahagranths.length})`
                : activeTab === 'books'
                  ? `रसिक वाणी संग्रह (${rasikBooks.length})`
                  : activeTab === 'authors'
                    ? `रसिक संत (${authors.length})`
                    : `धाम लीला (${relations.length})`}
            </span>
          </div>
          <p className="text-xs text-[#71717A] font-normal mt-1 font-laila">
            सनातन महाग्रंथ (रामायण, भागवत, गीता), श्री वृन्दावन के रसिक आचार्यों की वाणी एवं नित्य निकुंज धाम लीला।
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
        <div
          role="tablist"
          aria-label="स्मरण ग्रंथ व वाणी श्रेणियाँ"
          className="relative w-full max-w-2xl grid grid-cols-4 p-1 bg-[#FAF6EE] rounded-full border border-amber-200/50"
        >
          {/* Dynamic Sliding Indicator Bar */}
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-transform duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform shadow-xs"
            style={{
              width: 'calc((100% - 8px) / 4)',
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
                role="tab"
                aria-selected={isActive}
                aria-label={`${tab.label}, ${tab.count} संग्रह`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 py-2 px-1.5 sm:px-3 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer select-none flex items-center justify-center gap-1 sm:gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                  isActive ? 'text-[#18181B] font-bold' : 'text-neutral-700 hover:text-neutral-950'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-[#B45309]' : tab.iconColor
                  }`}
                />
                <span className="truncate">
                  <span aria-hidden="true" className="sm:hidden">{tab.mobileLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full leading-none shrink-0 transition-colors ${
                    isActive ? 'bg-[#FACC15] text-[#78350F]' : 'bg-neutral-200/90 text-neutral-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION A: Canonical Mahagranths & Books (Merged Rows, Soft Outer Area) */}
      {(activeTab === 'mahagranth' || activeTab === 'books') && (
        <div className="rounded-[24px] overflow-hidden border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white divide-y divide-neutral-100">
          {(activeTab === 'mahagranth' ? mahagranths : rasikBooks).map((book) => {
            const coverConfig = getBookCoverConfig(book.id, book.devanagari);
            const bookTitle = book.devanagari
              .replace(/जी की वाणी/g, '')
              .replace(/वाणी/g, '')
              .replace(/ग्रन्थ/g, '')
              .trim();
            const unitLabel =
              book.countUnit === 'Shlokas'
                ? 'श्लोक'
                : book.countUnit === 'Chaupais'
                  ? 'चौपाई'
                  : book.countUnit === 'Dohe'
                    ? 'दोहे'
                    : book.countUnit === 'Savaiyas'
                      ? 'सवैये'
                      : 'पद';

            return (
              <div
                key={book.id}
                role="button"
                tabIndex={0}
                onClick={() => handleBookClick(book.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleBookClick(book.id)}
                className="group w-full p-4 sm:p-5 flex items-center justify-between gap-4 sm:gap-6 hover:bg-[#FAF8F5]/80 transition-colors duration-150 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                  {/* Authentic 3D Sacred Pothi Book Cover */}
                  <div className="shrink-0 select-none">
                    <div
                      className="sacred-book-pothi w-[68px] h-[98px] sm:w-[72px] sm:h-[104px] text-white"
                      style={{ background: coverConfig.bg }}
                    >
                      {/* Spine Groove Crease */}
                      <div className="spine-groove" />

                      {/* Style 1: Delicate Gold Frame (Sant-Vaani Pure Scripture) */}
                      {coverConfig.style === 'gold-frame' && (
                        <div className="book-gold-filigree">
                          <div className="text-[8px] text-amber-200/60 font-bold leading-none tracking-widest flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-px bg-amber-200/30" />
                            <span>ॐ</span>
                            <span className="w-1.5 h-px bg-amber-200/30" />
                          </div>

                          <div className="flex-1 flex items-center justify-center w-full my-0.5 min-h-0">
                            <span className="font-rozha text-[10.5px] sm:text-[11.5px] font-bold line-clamp-3 text-center leading-[1.15] tracking-wide px-0.5 gold-foil-title">
                              {bookTitle}
                            </span>
                          </div>

                          <span className="text-[8px] font-mono font-bold text-amber-300/90 tracking-wider whitespace-nowrap leading-none shrink-0">
                            {book.count.toLocaleString('en-IN')} {unitLabel}
                          </span>
                        </div>
                      )}

                      {/* Style 2: Gold Frame + Soft Inset Cartouche (Distinguished Compendium) */}
                      {coverConfig.style === 'cartouche' && (
                        <div className="book-gold-filigree">
                          <div className="text-[8px] text-amber-200/70 font-bold leading-none tracking-widest flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-px bg-amber-200/30" />
                            <span>ॐ</span>
                            <span className="w-1.5 h-px bg-amber-200/30" />
                          </div>

                          <div className="flex-1 flex items-center justify-center w-full my-0.5 min-h-0">
                            <span className="font-rozha text-[10.5px] sm:text-[11.5px] font-bold line-clamp-3 text-center leading-[1.15] tracking-wide px-0.5 gold-foil-title">
                              {bookTitle}
                            </span>
                          </div>

                          <div className="px-1.5 py-0.5 rounded-[3px] bg-black/40 border border-amber-300/30 text-[7.5px] font-mono font-bold text-amber-200 tracking-wider whitespace-nowrap leading-none shrink-0 inline-flex items-center justify-center">
                            {book.count.toLocaleString('en-IN')} {unitLabel}
                          </div>
                        </div>
                      )}

                      {/* Style 3: Borderless Pure Leather (Intimate Rasik Vani & Lyric Poetry) */}
                      {coverConfig.style === 'pure-leather' && (
                        <div className="book-pure-leather-inner">
                          <div className="text-[8px] text-amber-300/70 font-bold leading-none tracking-widest flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-px bg-amber-300/30" />
                            <span>ॐ</span>
                            <span className="w-1.5 h-px bg-amber-300/30" />
                          </div>

                          <div className="flex-1 flex items-center justify-center w-full my-0.5 min-h-0">
                            <span className="font-rozha text-[11px] sm:text-[12px] font-bold line-clamp-3 text-center leading-[1.15] tracking-wide px-0.5 gold-foil-title">
                              {bookTitle}
                            </span>
                          </div>

                          <div className="px-2 py-0.5 rounded-full bg-black/35 border border-amber-400/30 text-[7.5px] font-mono font-bold text-amber-200 tracking-wider whitespace-nowrap leading-none shrink-0 inline-flex items-center justify-center">
                            {book.count.toLocaleString('en-IN')} {unitLabel}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Information Stack (Rozha & Laila Hindi Typography) */}
                  <div className="flex flex-col min-w-0 flex-1 justify-center">
                    <div className="text-xs font-laila font-semibold text-amber-800 tracking-wider mb-0.5 truncate">
                      {book.tradition} &nbsp;•&nbsp; {book.author}
                    </div>

                    <h4 className="font-rozha text-xl sm:text-2xl text-[#18181B] group-hover:text-amber-950 transition-colors leading-tight truncate">
                      {book.devanagari}
                    </h4>

                    <p className="text-xs sm:text-[13px] font-laila text-neutral-500 line-clamp-1 mt-1 leading-relaxed">
                      {book.essence}
                    </p>

                    <div className="text-[11px] font-mono text-neutral-400 mt-1">
                      {book.count.toLocaleString('en-IN')} {unitLabel} • मूल ग्रंथ पाठ
                    </div>
                  </div>
                </div>

                {/* Right Action Affordance (Company Underline Animation) */}
                <div className="company-link group-company-link text-xs sm:text-sm font-laila font-semibold text-neutral-600 group-hover:text-amber-900 transition-colors shrink-0 pl-2 flex items-center gap-1.5">
                  <span>{book.category === 'mahagranth' ? 'मूल श्लोक पाठ' : 'वाणी पाठ'}</span>
                  {loadingItemId === book.id ? (
                    <IOSSpinner size="xs" theme="amber" />
                  ) : (
                    <span className="text-amber-700 text-base leading-none">→</span>
                  )}
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
              onClick={() => handleAuthorClick(author.name)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAuthorClick(author.name)}
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
              <div className="company-link group-company-link text-xs sm:text-sm font-laila font-semibold text-neutral-600 group-hover:text-amber-900 transition-colors shrink-0 pl-2 flex items-center gap-1.5">
                <span>रसिक वाणी</span>
                {loadingItemId === author.name ? (
                  <IOSSpinner size="xs" theme="amber" />
                ) : (
                  <span className="text-amber-700 text-base leading-none">→</span>
                )}
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
                onClick={() => handleRelationClick(rel.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleRelationClick(rel.id)}
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
                <div className="company-link group-company-link text-xs sm:text-sm font-laila font-semibold text-neutral-600 group-hover:text-amber-900 transition-colors shrink-0 pl-2 flex items-center gap-1.5">
                  <span>{actionText}</span>
                  {loadingItemId === rel.id ? (
                    <IOSSpinner size="xs" theme="amber" />
                  ) : (
                    <span className="text-amber-700 text-base leading-none">→</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
