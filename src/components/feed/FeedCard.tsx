import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Heart,
  MessageCircle,
  Eye,
  Bookmark,
  MoreVertical,
  Languages,
  Share2,
  Copy,
  Sparkles,
  X,
} from 'lucide-react';
import { DevotionalFeedPost } from '../../types/devotional';
import { EmojiTray } from './EmojiTray';
import {
  getFeedInteractionsSync,
  saveFeedInteraction,
  formatDevanagariNumerals,
} from '../../services/cacheService';
import {
  getDevotionalSummary,
  getCachedDevotionalSummarySync,
} from '../../services/devotionalSummaryService';

interface FeedCardProps {
  post: DevotionalFeedPost;
}

export const FeedCard: React.FC<FeedCardProps> = ({ post }) => {
  // Two-tier cache initialization: read L1 synchronous interaction state
  const cachedInteractions = getFeedInteractionsSync();
  const cached = cachedInteractions[post.id];

  const [likes, setLikes] = useState<number>(cached?.likes ?? post.likes);
  const [isLiked, setIsLiked] = useState<boolean>(cached?.isLiked ?? false);

  const [views, setViews] = useState<number>(() => {
    if (cached?.views && cached.views > 0) return cached.views;
    const clean = (post.views || '10K').toUpperCase().trim();
    if (clean.endsWith('K')) {
      return Math.round(parseFloat(clean.replace('K', '')) * 1000);
    }
    return parseInt(clean, 10) || 12000;
  });

  useEffect(() => {
    const sessionKey = `viewed_post_${post.id}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
      try {
        sessionStorage.setItem(sessionKey, '1');
      } catch {
        // storage disabled fallback
      }
      setViews((prev) => {
        const nextViews = prev + 1;
        saveFeedInteraction(post.id, { views: nextViews });
        return nextViews;
      });
    }
  }, [post.id]);

  const formattedViews =
    views >= 1000
      ? `${formatDevanagariNumerals((views / 1000).toFixed(1))}K`
      : formatDevanagariNumerals(views);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    cached?.isBookmarked ?? (post.isBookmarked ?? false)
  );
  const [isFollowing, setIsFollowing] = useState<boolean>(cached?.isFollowing ?? false);
  const [showEnglish, setShowEnglish] = useState<boolean>(false);
  const [flowerBurst, setFlowerBurst] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(() =>
    getCachedDevotionalSummarySync({
      id: `feed-${post.id}`,
      text: post.contentDevanagari,
      author: post.authorName,
      type: 'quote',
    })
  );
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest(`[data-feed-menu="${post.id}"]`)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isMenuOpen, post.id]);

  // Double-tap tracker for sacred Pushparpan (flower offering)
  const lastTapRef = useRef<number>(0);

  const handleShare = async () => {
    setIsMenuOpen(false);
    const text = `🌸 ${post.authorName} • दिव्य दर्शन\n\n${post.contentDevanagari}\n\nवृन्दोपनिषद् २.० • जय श्री राधे!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${post.authorName} • दिव्य दर्शन`,
          text,
          url: window.location.href,
        });
        setToast('दर्शन संदेश साझा किया गया!');
        return;
      } catch (e) {
        // user cancelled
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setToast('पावन दर्शन कॉपी हो गया!');
    }
  };

  const handleCopyVerse = async () => {
    setIsMenuOpen(false);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(post.contentDevanagari);
      setToast('भावार्थ कॉपी हो गया!');
    }
  };

  const handleToggleSummary = async () => {
    setIsMenuOpen(false);
    setIsSummaryOpen((prev) => !prev);
    if (!summary && !isSummaryLoading) {
      setIsSummaryLoading(true);
      try {
        const result = await getDevotionalSummary({
          id: `feed-${post.id}`,
          text: post.contentDevanagari,
          author: post.authorName,
          type: 'quote',
        });
        setSummary(result.summary);
      } catch (err) {
        setSummary('श्री युगल सरकार का नित्य स्मरण चित्त में असीम आनंद व शांति का संचार करता है। जय श्री राधे!');
      } finally {
        setIsSummaryLoading(false);
      }
    }
  };

  const toggleLike = () => {
    const nextLiked = !isLiked;
    const nextLikes = nextLiked ? likes + 1 : Math.max(0, likes - 1);
    setIsLiked(nextLiked);
    setLikes(nextLikes);
    saveFeedInteraction(post.id, {
      isLiked: nextLiked,
      likes: nextLikes,
      isBookmarked,
      isFollowing,
    });
    if (nextLiked) {
      setFlowerBurst(true);
      setTimeout(() => setFlowerBurst(false), 900);
    }
  };

  const toggleBookmark = () => {
    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);
    saveFeedInteraction(post.id, {
      isLiked,
      likes,
      isBookmarked: nextBookmarked,
      isFollowing,
    });
  };

  const toggleFollow = () => {
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    saveFeedInteraction(post.id, {
      isLiked,
      likes,
      isBookmarked,
      isFollowing: nextFollowing,
    });
  };

  const handlePhotoDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_WINDOW_MS = 320;
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      // Double tap confirmed: offer Pushparpan & like
      if (!isLiked) {
        const nextLikes = likes + 1;
        setIsLiked(true);
        setLikes(nextLikes);
        saveFeedInteraction(post.id, {
          isLiked: true,
          likes: nextLikes,
          isBookmarked,
          isFollowing,
        });
      }
      setFlowerBurst(true);
      setTimeout(() => setFlowerBurst(false), 900);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <article className="w-full bg-white rounded-[28px] p-4 sm:p-5 mb-5 transition-colors">
      <style>{`
        @keyframes pushparpanFloat {
          0% {
            transform: scale(0.3) translateY(14px);
            opacity: 0;
          }
          35% {
            transform: scale(1.3) translateY(-10px);
            opacity: 1;
          }
          70% {
            transform: scale(1.08) translateY(-22px);
            opacity: 0.95;
          }
          100% {
            transform: scale(0.85) translateY(-38px);
            opacity: 0;
          }
        }
        .animate-pushparpan {
          animation: pushparpanFloat 0.88s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {post.authorAvatar && !avatarError ? (
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              onError={() => setAvatarError(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] shrink-0 flex items-center justify-center font-bold text-sm text-[#B84A28] font-devanagari select-none">
              {post.authorName.slice(0, 1)}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-sm sm:text-[15px] text-[#111111] truncate">
                {post.authorName}
              </span>
              {post.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 fill-amber-100 shrink-0" />
              )}
            </div>
            <span className="text-[10.5px] sm:text-[11.5px] text-[#71717A] truncate">
              {post.timestamp}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Authentic Braj & Clear English: "Follow" / "Following" */}
          <button
            type="button"
            onClick={toggleFollow}
            className={`text-xs sm:text-[12.5px] font-sans font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors cursor-pointer shrink-0 ${
              isFollowing
                ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                : 'bg-[#FACC15] hover:bg-[#FDE047] text-[#18181B] font-bold'
            }`}
          >
            {isFollowing ? 'Following ✓' : 'Follow'}
          </button>

          {/* Glass 34x34 more button with working popover */}
          <div className="relative" data-feed-menu={post.id}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="More options"
              aria-expanded={isMenuOpen}
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[#111111] pressable shrink-0 hover:bg-[#FAF6EE] transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Contextual Popover */}
            {isMenuOpen && (
              <div className="absolute right-0 top-10 z-40 w-56 bg-white rounded-2xl p-1.5 apple-dialog-enter text-left">
                <div className="py-0.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Share Darshan</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyVerse}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Copy Text & Meaning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleBookmark();
                      setIsMenuOpen(false);
                      setToast(isBookmarked ? 'Removed from saved darshan' : 'Saved to your sacred bookmarks!');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-[#D97706]' : 'text-[#71717A]'}`} />
                    <span>{isBookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleSummary}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A359]" />
                    <span>Divine Essence Summary</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Toast Notification */}
      {toast && (
        <div className="my-1.5 py-1 px-3 rounded-full bg-[#FEF08A] text-[#78350F] text-[11px] font-bold inline-flex items-center gap-1.5 apple-dialog-enter">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Post Text & Bilingual Translation Bar */}
      <div className="mb-2">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-devanagari text-[13.5px] sm:text-[14px] leading-relaxed text-[#222222] font-medium flex-1">
            {post.contentDevanagari}
          </p>

          {post.contentEnglish && (
            <button
              type="button"
              onClick={() => setShowEnglish(!showEnglish)}
              title="Translation / English meaning"
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                showEnglish
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                  : 'bg-[#FAF6EE] text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Languages className="w-3 h-3" />
              <span>{showEnglish ? 'हिन्दी' : 'EN'}</span>
            </button>
          )}
        </div>

        {/* Sleek Bilingual English Drawer */}
        {showEnglish && post.contentEnglish && (
          <div className="mt-1.5 p-2.5 rounded-xl bg-[#FAF9F5] text-xs sm:text-[13px] leading-relaxed text-[#52525B] font-serif italic">
            <p>{post.contentEnglish}</p>
          </div>
        )}

        {/* Devotional AI Summary Drawer */}
        {isSummaryOpen && (
          <div className="mt-2 bg-[#FEFCE8] rounded-2xl p-3 sm:p-3.5 apple-view-enter text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Divine Essence Summary
              </span>
              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                aria-label="Close summary"
                className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[#555555] pressable"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {isSummaryLoading ? (
              <div className="flex items-center gap-2 text-xs text-amber-700 font-medium py-1">
                <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>Revealing divine essence and spiritual theme...</span>
              </div>
            ) : (
              <p className="text-xs text-[#444444] leading-relaxed font-medium">
                {summary}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Devotional Hashtags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {post.hashtags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] sm:text-xs font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors cursor-pointer select-none"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Deity Darshan Photo with Double-Tap Pushparpan and Emoji Tray */}
      <div
        onClick={handlePhotoDoubleTap}
        className="relative rounded-[24px] overflow-hidden mb-3 aspect-[4/3] bg-black/5 cursor-pointer select-none group"
      >
        <img
          src={post.imageUrl}
          alt={post.imageAlt}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Sacred Pushparpan Double-Tap Floating Flower Overlay */}
        {flowerBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="animate-pushparpan flex flex-col items-center">
              <span className="text-5xl sm:text-6xl select-none">🌸</span>
              <span className="text-[11px] font-bold text-[#18181B] bg-[#FEF08A] px-2.5 py-0.5 rounded-full mt-1.5">
                Pushparpan • पुष्पार्पण
              </span>
            </div>
          </div>
        )}

        {/* Floating Glass Reaction Tray */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-4 sm:right-4 flex justify-center z-10 pointer-events-auto">
          <EmojiTray />
        </div>
      </div>

      {/* Interaction Metrics: Sunlit Capsule Pills */}
      <div className="flex items-center justify-between text-xs pt-1.5 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Like Pill */}
          <button
            type="button"
            onClick={toggleLike}
            className="h-9 px-3.5 sm:px-4 rounded-full bg-[#FAF6EE] hover:bg-[#FEFCE8] flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-[#18181B] transition-colors cursor-pointer shrink-0"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isLiked
                  ? 'fill-[#EF4444] text-[#EF4444]'
                  : 'fill-[#EF4444] text-[#EF4444]'
              }`}
            />
            <span className="font-semibold text-xs sm:text-[13px] whitespace-nowrap text-[#18181B]">
              {formatDevanagariNumerals(likes)}
            </span>
          </button>

          {/* Comments Pill */}
          <div className="h-9 px-3.5 sm:px-4 rounded-full bg-[#FAF6EE] flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-[#18181B] shrink-0">
            <MessageCircle className="w-4 h-4 text-[#71717A] stroke-[1.8]" />
            <span className="font-semibold text-xs sm:text-[13px] text-[#18181B]">
              {formatDevanagariNumerals(post.comments)}
            </span>
          </div>

          {/* Views Pill */}
          <div className="h-9 px-3.5 sm:px-4 rounded-full bg-[#FAF6EE] flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-[#18181B] shrink-0">
            <Eye className="w-4 h-4 text-[#71717A] stroke-[1.8]" />
            <span className="font-semibold text-xs sm:text-[13px] text-[#18181B]">
              {formattedViews}
            </span>
          </div>
        </div>

        {/* Bookmark Pill */}
        <button
          type="button"
          onClick={toggleBookmark}
          aria-label={isBookmarked ? 'उर से हटाएं' : 'उर धरें (सहेजें)'}
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
            isBookmarked
              ? 'bg-[#FEF08A] text-[#78350F]'
              : 'bg-[#FAF6EE] text-[#71717A] hover:text-[#18181B]'
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${
              isBookmarked ? 'fill-current text-[#78350F]' : ''
            }`}
          />
        </button>
      </div>
    </article>
  );
};
