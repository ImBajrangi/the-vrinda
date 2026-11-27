import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Search,
  CheckCircle2,
  ArrowLeft,
  X,
  Volume2,
  Share2,
  Check
} from 'lucide-react';
import {
  SacredStory,
  SacredStoryPreview,
  StoryChapter,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { resetScrollToTop } from '../../utils/scrollTop';
import { seo } from '../../services/seoService';
import { getKathaArtwork, getArtworkObjectPosition } from '../../services/devotionalVisuals';
import { chimeService } from '../../services/chimeService';
import { SacredDiscoveryShelf } from '../common/SacredDiscoveryShelf';

interface KathaSanctuaryProps {
  initialStorySlug?: string;
  initialStory?: SacredStory | null;
  onSelectStory?: (slug: string) => void;
  onNavigateToPadavali?: () => void;
}

export const KathaSanctuary: React.FC<KathaSanctuaryProps> = ({
  initialStorySlug,
  initialStory = null,
  onSelectStory,
  onNavigateToPadavali: _onNavigateToPadavali,
}) => {
  const [stories, setStories] = useState<SacredStoryPreview[]>([]);
  const [selectedStory, setSelectedStory] = useState<SacredStory | null>(() => initialStory || null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookmarkedStories, setBookmarkedStories] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('vrindopnisad_bookmarked_kathas');
      return saved ? new Set(JSON.parse(saved)) : new Set(['govardhan-dharan-leela']);
    } catch {
      return new Set(['govardhan-dharan-leela']);
    }
  });
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'huge'>('large');
  const [showCharactersDrawer, setShowCharactersDrawer] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Stop any explicitly played chime when leaving Katha sanctuary
  useEffect(() => {
    return () => {
      chimeService.stop();
    };
  }, []);

  // Load story index on mount
  useEffect(() => {
    let isMounted = true;
    SacredSectionService.getStoriesIndex()
      .then((items) => {
        if (isMounted) {
          setStories(items);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const loadStory = useCallback(async (slugOrId: string) => {
    const story = await SacredSectionService.getStoryById(slugOrId);
    if (story) {
      setSelectedStory(story);
      setCurrentChapterIndex(0);
      resetScrollToTop();
    }
  }, []);

  const isFirstStoryRender = useRef(true);
  useEffect(() => {
    if (isFirstStoryRender.current) {
      isFirstStoryRender.current = false;
      return;
    }
    resetScrollToTop();
  }, [selectedStory?.id]);

  // Handle deep link or prop story change
  useEffect(() => {
    if (initialStorySlug) {
      loadStory(initialStorySlug);
    }
  }, [initialStorySlug, loadStory]);

  // SEO synchronization
  useEffect(() => {
    if (selectedStory) {
      seo.updateSEO({
        tab: 'stories',
        title: `${selectedStory.titleDevanagari} • पावन पौराणिक कथा व लीला | वृन्दोपनिषद् 2.0`,
        description: `${selectedStory.summary} • सम्पूर्ण कथा, चरित्र परिचय व दार्शनिक मर्म। वृन्दोपनिषद् 2.0`,
      });
    } else {
      seo.updateSEO({
        tab: 'stories',
        title: 'दिव्य कथा व लीला अमृत • पौराणिक प्रसंग व शिक्षाएँ | वृन्दोपनिषद् 2.0',
        description: 'श्रीमद्भागवत, श्री रामायण और पुराणों की पावन सनातन कथाएँ, चरित्र परिचय और भक्तिरस से परिपूर्ण अमृत आख्यान।',
      });
    }
  }, [selectedStory]);

  const handleSelectStory = (slug: string) => {
    loadStory(slug);
    if (onSelectStory) {
      onSelectStory(slug);
    }
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', `/story/${encodeURIComponent(slug)}`);
      } catch {}
    }
  };

  const handleBackToStories = () => {
    chimeService.stop();
    setSelectedStory(null);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', '/stories');
      } catch {}
    }
    resetScrollToTop();
  };

  const toggleBookmark = (storyId: string) => {
    setBookmarkedStories((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      try {
        localStorage.setItem('vrindopnisad_bookmarked_kathas', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleCopyShareLink = (story: SacredStory) => {
    try {
      const url = `${window.location.origin}/story/${encodeURIComponent(story.slug || story.id)}`;
      navigator.clipboard?.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const catTokens = selectedCategory.split(',');
    return stories.filter((s) => {
      const matchesCategory =
        selectedCategory === 'all' || catTokens.includes(s.category);
      const matchesSearch =
        q === '' ||
        (s.title || '').toLowerCase().includes(q) ||
        (s.titleDevanagari || '').includes(searchQuery) ||
        (s.summary || '').toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [stories, selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'सभी कथाएं' },
    { id: 'shrimad-bhagavatam', label: 'श्रीमद्भागवत' },
    { id: 'ramayana,ramcharitmanas', label: 'श्री रामायण' },
    { id: 'sant-charitra,rasik-charitra,bhaktamal', label: 'संत व रसिक चरित्र' },
    { id: 'purana', label: 'पुराण आख्यान' },
  ];

  const currentChapter: StoryChapter | null = useMemo(() => {
    if (!selectedStory || !selectedStory.chapters || selectedStory.chapters.length === 0) {
      return null;
    }
    return selectedStory.chapters[currentChapterIndex] || selectedStory.chapters[0];
  }, [selectedStory, currentChapterIndex]);

  const contentFontSizeClass = {
    normal: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    large: 'text-lg sm:text-xl leading-loose',
    huge: 'text-xl sm:text-2xl leading-loose',
  }[fontSizeLevel];

  // ==========================================
  // VIEW: Story Reader View
  // ==========================================
  if (selectedStory) {
    const totalChapters = selectedStory.chapters.length;
    const progressPercent = Math.round(((currentChapterIndex + 1) / totalChapters) * 100);
    const isBookmarked = bookmarkedStories.has(selectedStory.id);
    const storyArtwork = getKathaArtwork(selectedStory);

    return (
      <main
        role="main"
        aria-label={selectedStory.titleDevanagari}
        className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 text-[#18181B]"
      >
        {/* Top Control Bar */}
        <div className="rounded-[24px] bg-white p-3 sm:p-4 shadow-[0_2px_14px_rgba(24,24,27,0.03)] mb-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBackToStories}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-serif font-bold text-[#78350F] bg-[#FEF08A] hover:bg-[#FDE047] rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="कथा सूची पर वापस जाएँ"
            >
              <ArrowLeft className="w-4 h-4 text-[#78350F]" />
              <span>कथा सूची</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#FAF6EE] p-1 rounded-full text-xs">
                <button
                  type="button"
                  onClick={() => setFontSizeLevel('normal')}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    fontSizeLevel === 'normal'
                      ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="सामान्य आकार"
                  aria-label="सामान्य अक्षर आकार"
                >
                  अ
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeLevel('large')}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    fontSizeLevel === 'large'
                      ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="मध्यम आकार"
                  aria-label="मध्यम अक्षर आकार"
                >
                  आ
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeLevel('huge')}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    fontSizeLevel === 'huge'
                      ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="विशाल आकार"
                  aria-label="विशाल अक्षर आकार"
                >
                  बड़ा
                </button>
              </div>

              {selectedStory.characters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCharactersDrawer((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    showCharactersDrawer
                      ? 'bg-[#FEF08A] text-[#78350F]'
                      : 'bg-[#FAF6EE] text-neutral-700 hover:bg-[#EFE7D8]'
                  }`}
                  aria-expanded={showCharactersDrawer}
                  aria-label={`कथा पात्र सूची (${selectedStory.characters.length} पात्र)`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-800" />
                  <span>पात्र ({formatDevanagariNumerals(selectedStory.characters.length)})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCopyShareLink(selectedStory)}
                className="p-2 rounded-full bg-[#FAF6EE] text-neutral-600 hover:text-amber-900 hover:bg-[#EFE7D8] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="कथा लिंक कॉपी करें"
                aria-label="कथा लिंक कॉपी करें"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => toggleBookmark(selectedStory.id)}
                className={`p-2 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isBookmarked
                    ? 'text-[#78350F] bg-[#FEF08A]'
                    : 'text-neutral-500 bg-[#FAF6EE] hover:text-amber-900 hover:bg-[#EFE7D8]'
                }`}
                title={isBookmarked ? 'संग्रह से हटाएं' : 'कथा संग्रह करें'}
                aria-label={isBookmarked ? 'संग्रह से हटाएं' : 'कथा संग्रह करें'}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Characters Drawer */}
        {showCharactersDrawer && selectedStory.characters.length > 0 && (
          <aside
            aria-label="कथा पात्र परिचय"
            className="rounded-[24px] bg-white p-4 sm:p-5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-sm sm:text-base text-amber-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>कथा पात्र परिचय</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCharactersDrawer(false)}
                className="text-xs text-neutral-500 hover:text-neutral-900 p-1 rounded-full cursor-pointer"
                aria-label="पात्र सूची बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {selectedStory.characters.map((char, idx) => (
                <div
                  key={idx}
                  className="rounded-[12px] bg-[#FAF8F4] p-3 flex items-start gap-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FEF08A] text-[#78350F] flex items-center justify-center font-serif font-bold text-xs shrink-0">
                    {char.nameDevanagari ? char.nameDevanagari.charAt(0) : char.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif font-bold text-xs text-neutral-900 truncate">
                      {char.nameDevanagari || char.name}
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium">
                      {char.role}
                    </div>
                    {char.bioSnippet && (
                      <p className="text-[11px] text-neutral-600 font-serif mt-1 line-clamp-2">
                        {char.bioSnippet}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Story Title & Meta Card with Split Darshan Visual Plate */}
        <header className="rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.03)] mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center mb-5">
            <div className="md:col-span-5 aspect-[4/3] w-full rounded-[14px] overflow-hidden bg-[#EFE7D8]">
              <img
                src={storyArtwork}
                alt={selectedStory.titleDevanagari}
                className={`w-full h-full object-cover ${getArtworkObjectPosition(storyArtwork)}`}
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="md:col-span-7 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 text-xs font-serif font-bold rounded-full bg-[#FEF08A] text-[#78350F]">
                  {selectedStory.categoryHindi}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-serif font-medium rounded-full bg-[#FAF6EE] text-neutral-700">
                  {selectedStory.tradition}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500 font-mono ml-auto">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{formatDevanagariNumerals(selectedStory.readingTimeMinutes)} मिनट</span>
                </span>
              </div>

              <h1 className="font-rozha text-2xl sm:text-3xl font-bold text-neutral-900 leading-snug tracking-tight mb-2.5">
                {selectedStory.titleDevanagari}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 font-serif leading-relaxed rounded-[12px] bg-[#FAF8F4] p-3">
                {selectedStory.summary}
              </p>
            </div>
          </div>

          {/* Chapter Progression Tracker */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-serif text-neutral-500 mb-1.5">
              <span>
                अध्याय {formatDevanagariNumerals(currentChapterIndex + 1)} / {formatDevanagariNumerals(totalChapters)}
              </span>
              <span className="font-mono">{formatDevanagariNumerals(progressPercent)}% सम्पूर्ण</span>
            </div>

            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3">
              {selectedStory.chapters.map((chap, idx) => (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => {
                    setCurrentChapterIndex(idx);
                    window.scrollTo({ top: 140, behavior: 'smooth' });
                  }}
                  className={`px-3 py-1 text-xs font-serif font-bold whitespace-nowrap rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    currentChapterIndex === idx
                      ? 'bg-[#FEF08A] text-[#78350F]'
                      : idx < currentChapterIndex
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'bg-[#FAF6EE] text-neutral-600 hover:bg-[#EFE7D8]'
                  }`}
                  aria-current={currentChapterIndex === idx ? 'page' : undefined}
                >
                  अध्याय {formatDevanagariNumerals(idx + 1)}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Current Chapter Narrative */}
        {currentChapter && (
          <div className="space-y-6">
            <article className="rounded-[28px] bg-white p-5 sm:p-8 shadow-[0_2px_16px_rgba(24,24,27,0.03)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-serif font-bold text-amber-800 tracking-wider uppercase">
                    अध्याय {formatDevanagariNumerals(currentChapter.chapterNumber)}
                  </span>
                  <h2 className="font-rozha text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
                    {currentChapter.titleDevanagari || currentChapter.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => chimeService.playChime('temple-bell')}
                  className="p-2 rounded-full bg-[#FAF6EE] text-amber-800 hover:bg-[#EFE7D8] transition-colors cursor-pointer"
                  title="पावन घण्टा नाद"
                  aria-label="पावन घण्टा नाद बजाएं"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {currentChapter.shlokas && currentChapter.shlokas.length > 0 && (
                <div className="space-y-3 mb-6">
                  {currentChapter.shlokas.map((shloka, sIdx) => (
                    <div
                      key={sIdx}
                      className="rounded-[14px] bg-[#FAF8F4] p-4 text-center space-y-2"
                    >
                      <p className="font-serif font-bold text-base sm:text-lg text-neutral-900 tracking-wide leading-relaxed">
                        {shloka.devanagari}
                      </p>
                      {shloka.meaning && (
                        <p className="text-xs sm:text-sm text-neutral-700 font-serif">
                          भावार्थ: {shloka.meaning}
                        </p>
                      )}
                      {shloka.reference && (
                        <div className="text-[11px] font-medium text-amber-800 font-serif">
                          — {shloka.reference}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={`font-serif text-neutral-800 space-y-4 ${contentFontSizeClass}`}>
                {currentChapter.content.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>

              {currentChapter.purport && (
                <div className="mt-8 rounded-[14px] bg-[#FEF9C3]/65 p-4 text-neutral-900">
                  <div className="flex items-center gap-2 text-amber-900 font-serif font-bold text-xs sm:text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>अध्याय सार एवं साधना सूत्र</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-700 font-serif leading-relaxed">
                    {currentChapter.purport}
                  </p>
                </div>
              )}
            </article>

            {currentChapterIndex === totalChapters - 1 && selectedStory.purport && (
              <div className="rounded-[24px] bg-[#FAF8F4] p-5 shadow-[0_2px_12px_rgba(24,24,27,0.025)]">
                <div className="flex items-center gap-2 text-amber-900 font-rozha text-base sm:text-lg mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>कथा का परम तत्व एवं भक्ति सिद्धान्त</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 font-serif leading-relaxed">
                  {selectedStory.purport}
                </p>
                <div className="mt-3 flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-serif font-bold text-emerald-800">
                    कथा पारायण पूर्ण हुआ। श्री राधेश्याम की कृपा आप पर बनी रहे।
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-[20px] bg-white p-3 sm:p-4 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentChapterIndex === 0}
                onClick={() => {
                  if (currentChapterIndex > 0) {
                    setCurrentChapterIndex((prev) => prev - 1);
                    window.scrollTo({ top: 140, behavior: 'smooth' });
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-serif font-bold rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  currentChapterIndex === 0
                    ? 'opacity-40 cursor-not-allowed bg-[#FAF6EE] text-neutral-400'
                    : 'bg-[#FAF6EE] text-neutral-700 hover:bg-[#EFE7D8]'
                }`}
                aria-label="पिछला अध्याय"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>पिछला अध्याय</span>
              </button>

              <span className="text-xs text-neutral-500 font-serif font-medium">
                अध्याय {formatDevanagariNumerals(currentChapterIndex + 1)} / {formatDevanagariNumerals(totalChapters)}
              </span>

              {currentChapterIndex < totalChapters - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentChapterIndex((prev) => prev + 1);
                    window.scrollTo({ top: 140, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-serif font-bold rounded-full bg-[#FEF08A] text-[#78350F] hover:bg-[#FDE047] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label="अगला अध्याय"
                >
                  <span>अगला अध्याय</span>
                  <ChevronRight className="w-4 h-4 text-[#78350F]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleBackToStories();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-serif font-bold rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label="समाप्त / कथा सूची"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>समाप्त / सूची</span>
                </button>
              )}
            </div>

            <SacredDiscoveryShelf
              entityType="story"
              entitySlug={selectedStory.slug}
              title={`${selectedStory.titleDevanagari} • जुड़े तीर्थ, संत व पद`}
            />
          </div>
        )}
      </main>
    );
  }

  // ==========================================
  // VIEW: Stories Catalog / List
  // ==========================================
  return (
    <main
      role="main"
      aria-label="दिव्य कथा व लीला अमृत सूची"
      className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-28 text-[#18181B]"
    >
      {/* Compact Borderless Header + Search + Category Chips */}
      <section className="rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)] mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-laila font-bold text-amber-800">
              <BookOpen className="w-3.5 h-3.5" />
              <span>कथा अभयारण्य</span>
              <span className="text-neutral-300">·</span>
              <span>{formatDevanagariNumerals(filteredStories.length)} कथाएं</span>
            </div>
            <h1 className="font-rozha text-2xl sm:text-3xl text-[#18181B] leading-tight">
              पवित्र पुराण एवं लीला आख्यान
            </h1>
            <p className="text-xs sm:text-[13px] text-neutral-600 font-laila leading-relaxed">
              श्रीमद्भागवत, श्री रामायण और ब्रजधाम के सनातन आख्यानों का सस्वर पाठ व भक्तिरस से परिपूर्ण कथाएं।
            </p>
          </div>

          <div role="search" aria-label="कथा खोजें" className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="कथा, प्रसंग या पात्र खोजें..."
              className="w-full pl-10 pr-9 py-2.5 text-[16px] sm:text-xs bg-[#FAF8F4] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 text-neutral-900 placeholder-neutral-400 font-laila"
              aria-label="कथा खोजें"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer"
                aria-label="खोज साफ़ करें"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-laila whitespace-nowrap rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                selectedCategory === cat.id
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                  : 'bg-[#FAF8F4] text-neutral-600 hover:bg-[#F3ECE0] font-medium'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center shadow-[0_2px_14px_rgba(24,24,27,0.025)]">
          <BookOpen className="w-9 h-9 mx-auto text-neutral-300 mb-2" />
          <h3 className="font-rozha text-lg font-bold text-neutral-800">
            कोई कथा नहीं मिली
          </h3>
          <p className="text-xs text-neutral-500 mt-1 font-laila">
            कृपया कोई भिन्न शब्द खोजें अथवा फ़िल्टर बदलें।
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-3 px-4 py-1.5 text-xs font-laila font-bold text-amber-900 bg-[#FEF08A] hover:bg-[#FDE047] rounded-full transition-colors cursor-pointer"
          >
            सभी कथाएं देखें
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredStories.map((story, idx) => {
            const isBookmarked = bookmarkedStories.has(story.id);
            const art = getKathaArtwork(story);
            const chapterCount = (story as unknown as { totalChapters?: number }).totalChapters ?? story.chapterCount ?? 1;
            return (
              <article
                key={story.id}
                tabIndex={0}
                role="button"
                onClick={() => handleSelectStory(story.slug || story.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectStory(story.slug || story.id);
                  }
                }}
                className="group rounded-[24px] bg-white hover:bg-[#FFFDF9] p-3.5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] flex flex-col justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={story.titleDevanagari}
              >
                <div>
                  {/* Story Illustration Plate (24 - 14 = 10px concentric) */}
                  <div className="aspect-[16/10] w-full rounded-[10px] overflow-hidden bg-[#EFE7D8] mb-3.5">
                    <img
                      src={art}
                      alt={story.titleDevanagari}
                      className={`w-full h-full object-cover ${getArtworkObjectPosition(art)}`}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>

                  <div className="px-1">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 text-[10.5px] font-laila font-bold rounded-full bg-[#FAF6EE] text-[#78350F] truncate">
                        {story.categoryHindi}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(story.id);
                        }}
                        className={`p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                          isBookmarked
                            ? 'text-[#78350F] bg-[#FEF08A]'
                            : 'text-neutral-400 hover:text-amber-800'
                        }`}
                        aria-label={isBookmarked ? 'संग्रह से हटाएं' : 'संग्रह करें'}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <h2 className="font-rozha text-lg text-[#18181B] group-hover:text-[#B45309] transition-colors leading-snug line-clamp-2">
                      {story.titleDevanagari}
                    </h2>

                    <p className="text-xs text-neutral-600 font-laila mt-1.5 line-clamp-2 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2 px-1 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-laila">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>{formatDevanagariNumerals(story.readingTimeMinutes)} मि.</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-700" />
                      <span>{formatDevanagariNumerals(chapterCount)} अध्याय</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-laila font-bold rounded-full bg-[#FEF08A] group-hover:bg-[#FDE047] text-[#78350F] transition-colors">
                    <span>कथा पढ़ें</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#78350F]" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};
