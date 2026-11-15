import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import {
  SacredStory,
  SacredStoryPreview,
  StoryChapter,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';

interface KathaSanctuaryProps {
  initialStorySlug?: string;
  onSelectStory?: (slug: string) => void;
  onNavigateToPadavali?: () => void;
}

export const KathaSanctuary: React.FC<KathaSanctuaryProps> = ({
  initialStorySlug,
  onSelectStory,
}) => {
  const [stories, setStories] = useState<SacredStoryPreview[]>([]);
  const [selectedStory, setSelectedStory] = useState<SacredStory | null>(null);
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

  // Load index
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Handle deep link or prop story change
  useEffect(() => {
    if (initialStorySlug) {
      loadStory(initialStorySlug);
    }
  }, [initialStorySlug, loadStory]);

  const handleSelectStory = (slug: string) => {
    loadStory(slug);
    if (onSelectStory) {
      onSelectStory(slug);
    }
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
      } catch {
        // ignore
      }
      return next;
    });
  };

  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.titleDevanagari.includes(searchQuery) ||
        s.summary.includes(searchQuery) ||
        s.tags.some((t) => t.includes(searchQuery));
      return matchesCategory && matchesSearch;
    });
  }, [stories, selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'सभी कथाएं (All Kathas)' },
    { id: 'shrimad-bhagavatam', label: 'श्रीमद्भागवत' },
    { id: 'ramayana', label: 'श्री रामायण' },
    { id: 'leela', label: 'ब्रज नित्यलीला' },
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

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-28 text-sacred-ink dark:text-neutral-100">
        {/* Top Control Bar */}
        {/* Outer: rounded-[24px] p-4 -> Inner: rounded-[8px] (24 - 16 = 8) */}
        <div className="rounded-[24px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedStory(null)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-sacred-kesar hover:bg-sacred-kesar/10 rounded-[8px] transition-colors"
            >
              <ArrowLeft size={18} />
              <span>कथा सूची (All Stories)</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Font size toggles */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-[8px] p-1 border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setFontSizeLevel('normal')}
                  className={`px-2 py-1 text-xs font-semibold rounded-[4px] transition-colors ${
                    fontSizeLevel === 'normal'
                      ? 'bg-white dark:bg-neutral-900 text-sacred-kesar shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                  title="सामान्य अक्षर (Normal text)"
                >
                  अ
                </button>
                <button
                  onClick={() => setFontSizeLevel('large')}
                  className={`px-2 py-1 text-xs font-semibold rounded-[4px] transition-colors ${
                    fontSizeLevel === 'large'
                      ? 'bg-white dark:bg-neutral-900 text-sacred-kesar shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                  title="मध्यम अक्षर (Large text)"
                >
                  अ+
                </button>
                <button
                  onClick={() => setFontSizeLevel('huge')}
                  className={`px-2 py-1 text-xs font-semibold rounded-[4px] transition-colors ${
                    fontSizeLevel === 'huge'
                      ? 'bg-white dark:bg-neutral-900 text-sacred-kesar shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                  title="विशाल अक्षर (Huge text)"
                >
                  अ++
                </button>
              </div>

              {/* Character Drawer Toggle */}
              {selectedStory.characters.length > 0 && (
                <button
                  onClick={() => setShowCharactersDrawer((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[8px] border transition-colors ${
                    showCharactersDrawer
                      ? 'bg-sacred-kesar text-white border-sacred-kesar'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Users size={14} />
                  <span>पात्र ({selectedStory.characters.length})</span>
                </button>
              )}

              {/* Bookmark */}
              <button
                onClick={() => toggleBookmark(selectedStory.id)}
                className={`p-2 rounded-[8px] border transition-colors ${
                  isBookmarked
                    ? 'text-sacred-kesar bg-sacred-kesar/10 border-sacred-kesar/30'
                    : 'text-neutral-500 hover:text-sacred-kesar border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                title="कथा संग्रह करें"
              >
                {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Characters Drawer */}
        {showCharactersDrawer && selectedStory.characters.length > 0 && (
          /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
          <div className="rounded-[28px] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-neutral-900 dark:to-neutral-950 border border-amber-200 dark:border-amber-900/40 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-base text-sacred-kesar flex items-center gap-2">
                <Sparkles size={16} />
                <span>कथा पात्र परिचय (Characters of the Katha)</span>
              </h3>
              <button
                onClick={() => setShowCharactersDrawer(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 px-2 py-1 rounded-[4px]"
              >
                बन्द करें ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedStory.characters.map((char, idx) => (
                /* Card: rounded-[8px] p-3 -> Inner avatar: rounded-[4px] */
                <div
                  key={idx}
                  className="rounded-[8px] bg-white/90 dark:bg-neutral-800/90 border border-amber-100 dark:border-neutral-700 p-3 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-[4px] bg-amber-100 dark:bg-neutral-700 flex items-center justify-center text-sacred-kesar font-serif font-bold text-sm shrink-0">
                      {char.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {char.nameDevanagari || char.name}
                      </div>
                      <div className="text-xs text-sacred-kesar font-medium">
                        {char.role}
                      </div>
                      {char.bioSnippet && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
                          {char.bioSnippet}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story Title & Meta Card */}
        {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
        <div className="rounded-[32px] bg-gradient-to-b from-white via-white to-amber-50/40 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 shadow-card mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar border border-sacred-kesar/20">
              {selectedStory.categoryHindi}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {selectedStory.tradition}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500 ml-auto">
              <Clock size={13} />
              <span>{selectedStory.readingTimeMinutes} मिनट पठन</span>
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 leading-snug tracking-tight mb-4">
            {selectedStory.titleDevanagari}
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed border-l-2 border-sacred-kesar pl-3 italic mb-6">
            {selectedStory.summary}
          </p>

          {/* Chapter Progression Tracker */}
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 mb-2">
              <span>
                अध्याय {currentChapterIndex + 1} / {totalChapters}
              </span>
              <span>{progressPercent}% सम्पूर्ण</span>
            </div>

            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-[8px] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sacred-kesar to-sacred-gold rounded-[8px] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Chapter Stepper Buttons */}
            {/* Outer: rounded-[20px] p-3 -> Inner: rounded-[8px] (20 - 12 = 8) */}
            <div className="flex items-center gap-2 overflow-x-auto py-3 mt-2 rounded-[20px] p-3 bg-neutral-50 dark:bg-neutral-800/50">
              {selectedStory.chapters.map((chap, idx) => (
                <button
                  key={chap.id}
                  onClick={() => {
                    setCurrentChapterIndex(idx);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className={`px-3 py-1.5 text-xs font-serif font-semibold whitespace-nowrap rounded-[8px] transition-colors ${
                    currentChapterIndex === idx
                      ? 'bg-sacred-kesar text-white shadow-xs'
                      : idx < currentChapterIndex
                      ? 'bg-amber-100 dark:bg-neutral-700 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-neutral-600'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  अध्याय {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Chapter Narrative */}
        {currentChapter && (
          <div className="space-y-6">
            {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
            <article className="rounded-[32px] bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card">
              <div className="mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-semibold text-sacred-kesar tracking-widest uppercase">
                  अध्याय {currentChapter.chapterNumber}
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">
                  {currentChapter.titleDevanagari || currentChapter.title}
                </h2>
              </div>

              {/* Shlokas Callout if available */}
              {currentChapter.shlokas && currentChapter.shlokas.length > 0 && (
                <div className="space-y-4 mb-8">
                  {currentChapter.shlokas.map((shloka, sIdx) => (
                    /* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */
                    <div
                      key={sIdx}
                      className="rounded-[8px] bg-gradient-to-r from-amber-50/70 to-orange-50/70 dark:from-neutral-800/80 dark:to-neutral-850/80 border-l-4 border-sacred-kesar p-4 text-center"
                    >
                      <p className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-amber-100 tracking-wide leading-relaxed">
                        {shloka.devanagari}
                      </p>
                      {shloka.meaning && (
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans mt-2 pt-2 border-t border-amber-200/50 dark:border-neutral-700">
                          भावार्थ: {shloka.meaning}
                        </p>
                      )}
                      {shloka.reference && (
                        <div className="text-[11px] font-medium text-sacred-kesar mt-1">
                          — {shloka.reference}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Prose narrative */}
              <div
                className={`font-serif text-neutral-800 dark:text-neutral-200 space-y-4 ${contentFontSizeClass}`}
              >
                {currentChapter.content.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx} className="indent-4 sm:indent-6">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>

              {/* Chapter Purport (शिक्षा / तत्व) */}
              {currentChapter.purport && (
                /* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */
                <div className="mt-8 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-serif font-bold text-sm mb-1">
                    <Sparkles size={16} />
                    <span>अध्याय सार एवं साधना सूत्र (Chapter Purport)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-sans leading-relaxed">
                    {currentChapter.purport}
                  </p>
                </div>
              )}
            </article>

            {/* Overall Moral / Purport Callout Card (Always Visible on Last Chapter or in reader) */}
            {currentChapterIndex === totalChapters - 1 && selectedStory.purport && (
              /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
              <div className="rounded-[28px] bg-gradient-to-br from-sacred-kesar/10 via-amber-100/40 to-yellow-50/60 dark:from-neutral-900 dark:via-neutral-850 dark:to-neutral-900 border-2 border-sacred-kesar/40 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sacred-kesar font-serif font-extrabold text-base mb-2">
                  <Sparkles size={18} />
                  <span>कथा का परम तत्व एवं भक्ति सिद्धान्त (Supreme Moral & Purport)</span>
                </div>
                <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 font-serif leading-relaxed">
                  {selectedStory.purport}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    कथा पारायण पूर्ण हुआ। श्री राधेश्याम की कृपा आप पर बनी रहे।
                  </span>
                </div>
              </div>
            )}

            {/* Chapter Navigation Controls */}
            {/* Outer: rounded-[24px] p-4 -> Inner: rounded-[8px] (24 - 16 = 8) */}
            <div className="rounded-[24px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm flex items-center justify-between gap-4">
              <button
                disabled={currentChapterIndex === 0}
                onClick={() => {
                  if (currentChapterIndex > 0) {
                    setCurrentChapterIndex((prev) => prev - 1);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-[8px] border transition-colors ${
                  currentChapterIndex === 0
                    ? 'opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                <ChevronLeft size={16} />
                <span>पिछला अध्याय</span>
              </button>

              <span className="text-xs text-neutral-500 font-medium">
                {currentChapterIndex + 1} of {totalChapters}
              </span>

              {currentChapterIndex < totalChapters - 1 ? (
                <button
                  onClick={() => {
                    setCurrentChapterIndex((prev) => prev + 1);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-[8px] bg-sacred-kesar text-white hover:bg-orange-700 transition-colors shadow-xs"
                >
                  <span>अगला अध्याय</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setSelectedStory(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-[8px] bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <CheckCircle2 size={16} />
                  <span>समाप्त / कथा सूची</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: Stories Catalog / List
  // ==========================================
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 pb-28 text-sacred-ink dark:text-neutral-100">
      {/* Header Banner */}
      {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
      <div className="rounded-[32px] bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-white dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-amber-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card mb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar text-xs font-bold uppercase tracking-wider mb-3">
            <BookOpen size={14} />
            <span>कथा अभयारण्य (Katha Sanctuary)</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
            पवित्र पुराण एवं लीला आख्यान
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-sans mt-2 leading-relaxed">
            श्रीमद्भागवत, श्री रामायण और ब्रजधाम के सनातन आख्यानों का सस्वर पाठ। शुद्ध देवनागरी लिपि, चरित्र परिचय और भक्तिरस से परिपूर्ण अमृत कथाएं।
          </p>
        </div>

        {/* Search & Filter Bar */}
        {/* Outer: rounded-[20px] p-3 -> Inner: rounded-[8px] (20 - 12 = 8) */}
        <div className="mt-6 rounded-[20px] bg-white/95 dark:bg-neutral-800/95 border border-amber-200 dark:border-neutral-700 p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full flex items-center">
              <Search
                size={18}
                className="absolute left-3.5 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="कथा, प्रसंग, पात्र या विषय खोजें (Search stories)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-sacred-kesar/40 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
              />
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 px-3 py-1 shrink-0"
              >
                साफ़ करें ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-700">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-[8px] transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-sacred-kesar text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        /* Outer: rounded-[24px] p-8 -> Inner: rounded-[8px] (24 - 16 = 8) */
        <div className="rounded-[24px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <BookOpen size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <h3 className="font-serif text-lg font-bold text-neutral-700 dark:text-neutral-300">
            कोई कथा नहीं मिली
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            कृपया कोई भिन्न शब्द खोजें अथवा फ़िल्टर बदलें।
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-sacred-kesar bg-sacred-kesar/10 rounded-[8px] hover:bg-sacred-kesar/20 transition-colors"
          >
            सभी कथाएं देखें
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredStories.map((story) => {
            const isBookmarked = bookmarkedStories.has(story.id);
            return (
              /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
              <div
                key={story.id}
                className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-5 shadow-card flex flex-col justify-between hover:border-amber-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar">
                      {story.categoryHindi}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(story.id);
                      }}
                      className={`p-1.5 rounded-[8px] transition-colors ${
                        isBookmarked
                          ? 'text-sacred-kesar bg-sacred-kesar/10'
                          : 'text-neutral-400 hover:text-sacred-kesar'
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  <h3
                    onClick={() => handleSelectStory(story.slug || story.id)}
                    className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 hover:text-sacred-kesar cursor-pointer transition-colors leading-snug line-clamp-2"
                  >
                    {story.titleDevanagari}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans mt-2 line-clamp-3 leading-relaxed">
                    {story.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      <span>{story.readingTimeMinutes} मि.</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={12} />
                      <span>{story.chapterCount} अध्याय</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectStory(story.slug || story.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-sacred-kesar text-white hover:bg-orange-700 transition-colors shadow-2xs"
                  >
                    <span>कथा पढ़ें</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
