import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Feather,
  Globe,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Share2,
  Sparkles,
  User,
} from 'lucide-react';
import { SacredPad } from '../../types/devotional';
import { SacredDatabase } from '../../services/sacredDatabase';
import { extractPurePadaTitle } from '../../utils/padaTitle';
import { transliterateDevanagari } from '../../utils/transliterate';
import { BrajWordStudyPanel } from './BrajWordStudyPanel';
import { SacredDiscoveryShelf } from '../common/SacredDiscoveryShelf';
import {
  getCachedDevotionalSummarySync,
  getDevotionalSummary,
} from '../../services/devotionalSummaryService';
import { getSaintPortrait } from '../../services/devotionalVisuals';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { IOSSpinner } from '../common/IOSActivityIndicator';
import { resetScrollToTop } from '../../utils/scrollTop';
import { seo } from '../../services/seoService';
import ragaIndexData from '../../data/ragaIndex.json';

const RAW_RAGA_INDEX = (
  (ragaIndexData as any)?.default || ragaIndexData || {}
) as Record<string, { name: string; padas: string[] }>;

function resolveRagaSlug(ragaName?: string, padSlugOrId?: string): string | null {
  if (!ragaName) return null;
  const trimmed = ragaName.trim();
  const entries = Object.entries(RAW_RAGA_INDEX);
  if (padSlugOrId) {
    const byPad = entries.find(([, entry]) => Array.isArray(entry.padas) && entry.padas.includes(padSlugOrId));
    if (byPad) return byPad[0];
  }
  const exact = entries.find(([, entry]) => entry.name === trimmed);
  if (exact) return exact[0];
  const normTarget = trimmed.replace(/[·•,\-–—/|\s]+/g, '');
  const fuzzy = entries.find(([, entry]) => entry.name.replace(/[·•,\-–—/|\s]+/g, '') === normTarget);
  return fuzzy ? fuzzy[0] : null;
}

export interface DedicatedPadReadingViewProps {
  padSlug: string;
  initialPad?: SacredPad | null;
  activePlayingPadId?: string;
  isPlayingAudio?: boolean;
  onSelectPad?: (slug: string, pad?: SacredPad) => void;
  onPlayPad?: (pad: SacredPad) => void;
  onOpenInReader?: (pad: SacredPad) => void;
  onNavigateGrantha?: (granthaId: string) => void;
  onNavigateSaint?: (saintSlugOrName: string) => void;
  onNavigateRaga?: (ragaName: string) => void;
  onNavigateHome?: () => void;
}

export const DedicatedPadReadingView: React.FC<DedicatedPadReadingViewProps> = ({
  padSlug,
  initialPad,
  activePlayingPadId,
  isPlayingAudio = false,
  onSelectPad,
  onPlayPad,
  onOpenInReader,
  onNavigateGrantha,
  onNavigateSaint,
  onNavigateRaga,
  onNavigateHome,
}) => {
  const [, setDbVersion] = useState(0);
  const [paperTone, setPaperTone] = useState<'porcelain' | 'chandan'>('porcelain');
  const [textScale, setTextScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [showRoman, setShowRoman] = useState(true);
  const [isWordStudyOpen, setIsWordStudyOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);

  useEffect(() => {
    const unsub = SacredDatabase.subscribe(() => setDbVersion((v) => v + 1));
    SacredDatabase.initialize().catch(() => {});
    return unsub;
  }, []);

  const pad = useMemo<SacredPad | null>(() => {
    const direct = SacredDatabase.getPadById(padSlug);
    if (direct && (!direct.isStub || !initialPad || initialPad.isStub)) return direct;
    return initialPad || direct || null;
  }, [padSlug, initialPad]);

  useEffect(() => {
    if (!padSlug) return;
    if (pad?.collectionId && !SacredDatabase.isEpicGrantha(pad.collectionId)) {
      SacredDatabase.fetchGranthaPadas(pad.collectionId).catch(() => {});
    }
    resetScrollToTop();
  }, [padSlug, pad?.collectionId]);

  useEffect(() => {
    if (!isZenMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZenMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZenMode]);

  const granthaMeta = useMemo(
    () => (pad?.collectionId ? SacredDatabase.getGranthaById(pad.collectionId) : undefined),
    [pad?.collectionId]
  );

  const saintMeta = useMemo(
    () => (pad?.author ? SacredDatabase.getSaintBySlugOrName(pad.author) : undefined),
    [pad?.author]
  );

  const parsedTitle = useMemo(
    () => (pad ? extractPurePadaTitle(pad.titleDevanagari) : { title: decodeURIComponent(padSlug).replace(/-/g, ' ') }),
    [pad, padSlug]
  );

  const granthaLabel = granthaMeta?.name || 'रसिक वाणी संग्रह';
  const granthaId = pad?.collectionId || 'hit-chaurasi';
  const saintSlug = saintMeta?.slug || encodeURIComponent(pad?.author || 'rasik-sant');
  const resolvedRagaSlug = useMemo(
    () => resolveRagaSlug(pad?.rag, pad?.slug || pad?.id),
    [pad?.rag, pad?.slug, pad?.id]
  );
  const ragaHref = resolvedRagaSlug ? `/raga/${encodeURIComponent(resolvedRagaSlug)}` : '/ragas';
  const fullVerseText = useMemo(() => {
    if (!pad?.verses || pad.verses.length === 0) return parsedTitle.title;
    return pad.verses.map((v) => v.linesDevanagari.join('\n')).join('\n\n');
  }, [pad, parsedTitle.title]);

  // Sibling padas for Previous / Next bidirectional links
  const { prevPad, nextPad } = useMemo(() => {
    if (!pad?.collectionId) return { prevPad: null, nextPad: null };
    const siblingList = SacredDatabase.getPadasByGrantha(pad.collectionId);
    if (!siblingList || siblingList.length < 2) return { prevPad: null, nextPad: null };
    const idx = siblingList.findIndex(
      (p) => p.id === pad.id || (p.slug && pad.slug && p.slug === pad.slug)
    );
    if (idx === -1) return { prevPad: null, nextPad: siblingList[0] || null };
    return {
      prevPad: idx > 0 ? siblingList[idx - 1] : null,
      nextPad: idx < siblingList.length - 1 ? siblingList[idx + 1] : null,
    };
  }, [pad]);

  // Synchronize cached reflection without firing network request automatically
  useEffect(() => {
    if (!pad) return;
    const cached = getCachedDevotionalSummarySync({
      id: pad.id,
      text: fullVerseText,
      source: granthaLabel,
      author: pad.author,
      type: 'pad',
      collectionId: pad.collectionId,
      padId: pad.id,
    });
    setAiReflection(cached || null);
  }, [pad, fullVerseText, granthaLabel]);

  // Sync page title / meta / canonical / JSON-LD
  useEffect(() => {
    if (!pad) return;
    seo.updateSEO({
      tab: 'padavali',
      ogType: 'article',
      pad,
      title: `${parsedTitle.title} - ${pad.author} | लिरिक्स व भावार्थ सहित • ${granthaLabel} - वृन्दोपनिषद्`,
      description: `पढ़िए "${parsedTitle.title}" का प्रामाणिक मूल पाठ, शब्दार्थ व भावार्थ। रचयिता: ${pad.author} (${granthaLabel})${pad.rag ? ` • राग ${pad.rag}` : ''}।`,
      canonicalUrl: `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(pad.slug || pad.id)}`,
    });
  }, [pad, parsedTitle.title, granthaLabel]);

  const handleLoadReflection = async () => {
    if (!pad || isLoadingReflection) return;
    setIsLoadingReflection(true);
    try {
      const res = await getDevotionalSummary({
        id: pad.id,
        text: fullVerseText,
        source: granthaLabel,
        author: pad.author,
        type: 'pad',
        collectionId: pad.collectionId,
        padId: pad.id,
      });
      setAiReflection(res.summary);
    } finally {
      setIsLoadingReflection(false);
    }
  };

  const handleCopyLinkOrQuote = async () => {
    const shareUrl = `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(pad?.slug || padSlug)}`;
    const quoteText = `${parsedTitle.title} — ${pad?.author || 'रसिक संत'} (${granthaLabel})\n${fullVerseText.slice(0, 240)}\n${shareUrl}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(quoteText);
        setCopiedCitation(true);
        setTimeout(() => setCopiedCitation(false), 2000);
      }
    } catch {}
  };

  const handleWhatsAppShare = () => {
    const shareUrl = `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(pad?.slug || padSlug)}`;
    const text = `🌸 ${parsedTitle.title}\nरचयिता: ${pad?.author || 'रसिक संत'} • ${granthaLabel}\n\n${fullVerseText.split('\n').slice(0, 4).join('\n')}\n\n📖 पूरा पाठ व भावार्थ: ${shareUrl}`;
    if (typeof window !== 'undefined') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const isThisPlaying = isPlayingAudio && pad && activePlayingPadId === pad.id;
  const verseSizeClass =
    textScale === 'sm'
      ? 'text-lg sm:text-xl leading-relaxed'
      : textScale === 'lg'
      ? 'text-2xl sm:text-[28px] leading-[2]'
      : 'text-xl sm:text-2xl leading-[1.9]';

  const faqs = useMemo(
    () => [
      {
        q: `${parsedTitle.title} के रचयिता कौन हैं और यह किस परंपरा का अंग है?`,
        a: `इस पावन पद के रचयिता परम पूज्य ${pad?.author || 'ब्रज रसिक संत'} हैं। यह रचना श्री धाम वृन्दावन की नित्य निकुंज रस उपासना परंपरा का पावन अंग है।`,
      },
      {
        q: `यह पद किस ग्रंथ एवं शास्त्रीय राग में संकलित है?`,
        a: `यह पद '${granthaLabel}' में संकलित है${pad?.rag ? ` और शास्त्रीय राग ${pad.rag} में गाया जाता है` : ''}।`,
      },
      {
        q: `क्या इस पद का शब्दार्थ, रोमन पाठ और भावार्थ भी उपलब्ध है?`,
        a: `हाँ, ऊपर दिए गए अध्ययन बार से आप ब्रज शब्दार्थ (Word Study), Hinglish/IAST उच्चारण, तथा दिव्य भावार्थ यहीं पढ़ सकते हैं।`,
      },
    ],
    [parsedTitle.title, pad?.author, pad?.rag, granthaLabel]
  );

  if (!pad) {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-6 pb-20">
        <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_2px_16px_rgba(24,24,27,0.025)] space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF8F4]">
            <IOSSpinner size="md" theme="amber" />
          </div>
          <h1 className="font-rozha text-2xl text-[#18181B]">
            {parsedTitle.title}
          </h1>
          <p className="text-sm text-neutral-600 font-laila">
            पावन पद की पाण्डुलिपि संकलित की जा रही है...
          </p>
          <a
            href="/padavali"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && onOpenInReader) {
                e.preventDefault();
                onNavigateHome?.();
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>समस्त वाणी संग्रह देखें</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isZenMode
          ? `fixed inset-0 z-[120] overflow-y-auto px-4 sm:px-8 py-6 ${paperTone === 'chandan' ? 'bg-[#FAF3E3]' : 'bg-[#FAF8F4]'}`
          : 'w-full max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-5'
      }
    >
      {/* 1. Semantic Breadcrumb Navigation + Study Switcher */}
      <nav
        aria-label="Breadcrumb"
        className="rounded-[20px] bg-white px-4 py-3 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex flex-wrap items-center justify-between gap-2.5"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-xs font-serif text-neutral-500 min-w-0">
          <li>
            <a
              href="/"
              onClick={(e) => {
                if (onNavigateHome && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
              className="hover:text-amber-800 no-underline font-semibold"
            >
              वृन्दोपनिषद्
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a
              href={`/grantha/${encodeURIComponent(granthaId)}`}
              onClick={(e) => {
                if (onNavigateGrantha && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onNavigateGrantha(granthaId);
                }
              }}
              className="hover:text-amber-800 no-underline font-semibold truncate max-w-[150px] inline-block align-bottom"
            >
              {granthaLabel}
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[#18181B] font-bold truncate max-w-[180px] sm:max-w-[260px]">
            {parsedTitle.title}
          </li>
        </ol>

        <div className="flex items-center gap-2 shrink-0">
          {isZenMode ? (
            <button
              type="button"
              onClick={() => setIsZenMode(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C140D] text-[#FEF08A] text-xs font-serif font-bold cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>ध्यान मोड बंद करें (Esc)</span>
            </button>
          ) : (
            onOpenInReader && (
              <button
                type="button"
                onClick={() => onOpenInReader(pad)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-serif font-bold cursor-pointer transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>पूर्ण अध्ययन कक्ष खोलें</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </nav>

      {/* 2. Main Editorial Reading Canvas (Outer 28px -> inner cards 16px) */}
      <article
        className={`rounded-[28px] p-5 sm:p-8 shadow-[0_2px_18px_rgba(24,24,27,0.03)] space-y-6 transition-colors ${
          paperTone === 'chandan' ? 'bg-[#FAF6EE]' : 'bg-white'
        }`}
      >
        {/* Header Metadata Badges & Author Card */}
        <header className="space-y-4 pb-5 border-b border-amber-900/10">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/grantha/${encodeURIComponent(granthaId)}`}
              onClick={(e) => {
                if (onNavigateGrantha && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onNavigateGrantha(granthaId);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold no-underline"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{granthaLabel}</span>
            </a>

            {pad.rag && (
              <a
                href={ragaHref}
                onClick={(e) => {
                  if (onNavigateRaga && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    onNavigateRaga(resolvedRagaSlug || '');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-amber-900 text-xs font-serif font-semibold no-underline transition-colors"
              >
                <Music className="w-3.5 h-3.5 text-amber-700" />
                <span>राग {pad.rag}</span>
              </a>
            )}

            {(pad.verseNumber || parsedTitle.padNumber) && (
              <span className="px-3 py-1 rounded-full bg-[#FAF8F4] text-neutral-600 text-xs font-mono font-bold">
                पद {formatDevanagariNumerals(pad.verseNumber || parsedTitle.padNumber || 1)}
              </span>
            )}
          </div>

          <h1 className="sanctuary-ssr-title font-rozha text-2xl sm:text-4xl text-[#18181B] leading-snug">
            {parsedTitle.title}
          </h1>

          {/* Author / Saint Profile Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href={`/sant/${saintSlug}`}
              onClick={(e) => {
                if (onNavigateSaint && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onNavigateSaint(pad.author);
                }
              }}
              className="inline-flex items-center gap-3 p-1.5 pr-4 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] no-underline transition-colors"
            >
              <img
                src={getSaintPortrait({ slug: saintMeta?.slug, name: pad.author, tradition: saintMeta?.tradition })}
                alt={pad.author}
                className="w-9 h-9 rounded-full object-cover object-top bg-[#EFE7D8] shrink-0"
              />
              <div className="min-w-0">
                <span className="font-serif font-bold text-xs sm:text-sm text-[#18181B] block leading-tight">
                  {pad.author}
                </span>
                <span className="text-[11px] font-laila text-amber-800 block truncate">
                  {saintMeta?.tradition || 'श्री वृन्दावन रसिक संत परंपरा'}
                </span>
              </div>
            </a>

            {onPlayPad && (
              <button
                type="button"
                onClick={() => onPlayPad(pad)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-serif font-bold cursor-pointer transition-colors ${
                  isThisPlaying
                    ? 'bg-[#FEF08A] text-[#78350F]'
                    : 'bg-[#1C140D] hover:bg-[#2F2217] text-[#FEF08A]'
                }`}
              >
                {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                <span>{isThisPlaying ? 'श्रवण सक्रिय (रोकें)' : 'पद श्रवण करें'}</span>
              </button>
            )}
          </div>

          {/* Reading Comfort Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaperTone((t) => (t === 'porcelain' ? 'chandan' : 'porcelain'))}
                className="px-3 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-semibold text-neutral-800 cursor-pointer"
              >
                {paperTone === 'chandan' ? 'पृष्ठ: चन्दन' : 'पृष्ठ: श्वेत'}
              </button>

              <div className="inline-flex items-center rounded-full bg-[#FAF8F4] p-0.5">
                {(['sm', 'md', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTextScale(sz)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      textScale === sz ? 'bg-[#FEF08A] text-[#78350F]' : 'text-neutral-600'
                    }`}
                  >
                    {sz === 'sm' ? 'अ' : sz === 'md' ? 'आ' : 'बड़ा'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowRoman((r) => !r)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-serif font-semibold cursor-pointer ${
                  showRoman ? 'bg-[#FEF08A] text-[#78350F]' : 'bg-[#FAF8F4] text-neutral-700'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>रोमन उच्चारण</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWordStudyOpen((v) => !v)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-serif font-semibold cursor-pointer ${
                  isWordStudyOpen ? 'bg-[#1C140D] text-[#FEF08A]' : 'bg-[#FAF8F4] text-amber-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>शब्दार्थ</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyLinkOrQuote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-semibold text-neutral-700 cursor-pointer"
              >
                {copiedCitation ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCitation ? 'कॉपी हुआ' : 'उद्धरण कॉपी'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-xs font-serif font-bold text-emerald-800 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>साझा करें</span>
              </button>

              <button
                type="button"
                onClick={() => setIsZenMode((z) => !z)}
                aria-label="Toggle Zen Reading Mode"
                title="ध्यान पठन मोड"
                className="w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-neutral-700 flex items-center justify-center cursor-pointer"
              >
                {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </header>

        {/* 3. Authentic Devanagari Verse Body & Optional Transliteration/Meaning */}
        <section
          aria-label="मूल पाठ"
          className="verse-body rounded-[20px] bg-[#FAF8F4] p-5 sm:p-8 space-y-6"
        >
          {pad.verses && pad.verses.length > 0 ? (
            pad.verses.map((stanza, idx) => {
              const romanLines =
                stanza.linesTransliteration && stanza.linesTransliteration.length > 0
                  ? stanza.linesTransliteration
                  : stanza.linesDevanagari.map((l) => transliterateDevanagari(l));

              return (
                <div
                  key={`${stanza.stanzaNumber}-${idx}`}
                  className="text-center space-y-2.5 pb-5 last:pb-0 border-b last:border-b-0 border-amber-900/10"
                >
                  {pad.verses.length > 1 && (
                    <span className="inline-block text-[11px] font-mono font-bold text-amber-800 bg-[#FEF08A]/70 px-2.5 py-0.5 rounded-full">
                      चरण {formatDevanagariNumerals(stanza.stanzaNumber || idx + 1)}
                    </span>
                  )}

                  <div className={`font-rozha text-[#18181B] space-y-1.5 ${verseSizeClass}`}>
                    {stanza.linesDevanagari.map((line, lIdx) => (
                      <p key={lIdx} className="m-0">
                        {line}
                      </p>
                    ))}
                  </div>

                  {showRoman && (
                    <div className="text-xs sm:text-sm text-amber-900/75 font-serif italic space-y-1 pt-1">
                      {romanLines.map((line, lIdx) => (
                        <p key={lIdx} className="m-0">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {stanza.linesEnglish && stanza.linesEnglish.length > 0 && (
                    <div className="text-xs sm:text-sm text-neutral-600 font-laila leading-relaxed max-w-2xl mx-auto pt-2">
                      {stanza.linesEnglish.map((line, lIdx) => (
                        <p key={lIdx} className="m-0">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className={`text-center font-rozha text-[#18181B] ${verseSizeClass}`}>
              {parsedTitle.title}
            </p>
          )}
        </section>

        {/* Braj Word Study Interactive Panel */}
        {isWordStudyOpen && (
          <BrajWordStudyPanel
            verseText={fullVerseText}
            onClose={() => setIsWordStudyOpen(false)}
          />
        )}

        {/* 4. Spiritual Essence & Devotional Purport */}
        <section className="rounded-[20px] bg-[#FAF8F4] p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#18181B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>दिव्य भाव संक्षेप एवं अनुशीलन</span>
            </h2>

            {!aiReflection && (
              <button
                type="button"
                onClick={handleLoadReflection}
                disabled={isLoadingReflection}
                aria-busy={isLoadingReflection}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] disabled:opacity-60 text-[#78350F] text-xs font-serif font-bold cursor-pointer"
              >
                {isLoadingReflection ? (
                  <IOSSpinner size="xs" theme="amber" />
                ) : (
                  <Feather className="w-3.5 h-3.5" />
                )}
                <span>{isLoadingReflection ? 'भावार्थ संकलित हो रहा है...' : 'भावार्थ विस्तार पढ़ें'}</span>
              </button>
            )}
          </div>

          <p className="text-sm text-neutral-700 font-laila leading-relaxed">
            {aiReflection ||
              `«${parsedTitle.title}» श्री धाम वृन्दावन की पावन ${granthaLabel} परंपरा का अनुपम दिव्य पद है। परम पूज्य ${pad.author} जी कृत इस वाणी में श्री प्रिया-प्रियतम (श्रीराधा-कृष्ण) के नित्य निकुंज रस एवं अनन्य शरणागति का पावन गान है।`}
          </p>
        </section>

        {/* 5. Semantic Composition Metadata Specification Table */}
        <section className="rounded-[20px] bg-[#FAF8F4] p-5 sm:p-6 space-y-3">
          <h2 className="font-serif font-bold text-base text-[#18181B]">
            रचना एवं परंपरा विवरण
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-laila">
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[11px] font-mono font-bold text-neutral-400 uppercase">पद शीर्षक</dt>
              <dd className="font-bold text-[#18181B] mt-0.5">{parsedTitle.title}</dd>
            </div>
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[11px] font-mono font-bold text-neutral-400 uppercase">रचयिता (संत)</dt>
              <dd className="mt-0.5">
                <a
                  href={`/sant/${saintSlug}`}
                  onClick={(e) => {
                    if (onNavigateSaint && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      onNavigateSaint(pad.author);
                    }
                  }}
                  className="font-bold text-amber-800 hover:underline no-underline inline-flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{pad.author}</span>
                </a>
              </dd>
            </div>
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[11px] font-mono font-bold text-neutral-400 uppercase">संकलन ग्रंथ</dt>
              <dd className="mt-0.5">
                <a
                  href={`/grantha/${encodeURIComponent(granthaId)}`}
                  onClick={(e) => {
                    if (onNavigateGrantha && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      onNavigateGrantha(granthaId);
                    }
                  }}
                  className="font-bold text-amber-800 hover:underline no-underline"
                >
                  {granthaLabel}
                </a>
              </dd>
            </div>
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[11px] font-mono font-bold text-neutral-400 uppercase">शास्त्रीय राग / भाषा</dt>
              <dd className="font-bold text-[#18181B] mt-0.5 flex flex-wrap items-center gap-1.5">
                {pad.rag && (
                  <>
                    <a
                      href={ragaHref}
                      onClick={(e) => {
                        if (onNavigateRaga && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                          e.preventDefault();
                          onNavigateRaga(resolvedRagaSlug || '');
                        }
                      }}
                      className="text-amber-800 hover:underline no-underline"
                    >
                      राग {pad.rag}
                    </a>
                    <span aria-hidden="true">•</span>
                  </>
                )}
                <span>ब्रजभाषा / संस्कृत</span>
              </dd>
            </div>
          </dl>
        </section>

        {/* 6. Previous / Next Pad Navigation */}
        {(prevPad || nextPad) && (
          <nav aria-label="क्रमिक पद नेविगेशन" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prevPad ? (
              <a
                href={`/pad/${encodeURIComponent(prevPad.slug || prevPad.id)}`}
                onClick={(e) => {
                  if (onSelectPad && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    onSelectPad(prevPad.slug || prevPad.id, prevPad);
                  }
                }}
                className="rounded-[16px] bg-[#FAF8F4] hover:bg-[#FEFCE8] p-4 flex items-center gap-3 no-underline transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-amber-800 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block">पिछला पद</span>
                  <span className="font-serif font-bold text-sm text-[#18181B] truncate block">
                    {extractPurePadaTitle(prevPad.titleDevanagari).title}
                  </span>
                </div>
              </a>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nextPad && (
              <a
                href={`/pad/${encodeURIComponent(nextPad.slug || nextPad.id)}`}
                onClick={(e) => {
                  if (onSelectPad && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    onSelectPad(nextPad.slug || nextPad.id, nextPad);
                  }
                }}
                className="rounded-[16px] bg-[#FAF8F4] hover:bg-[#FEFCE8] p-4 flex items-center justify-between gap-3 text-right no-underline transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block">अगला पद</span>
                  <span className="font-serif font-bold text-sm text-[#18181B] truncate block">
                    {extractPurePadaTitle(nextPad.titleDevanagari).title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-800 shrink-0" />
              </a>
            )}
          </nav>
        )}

        {/* 7. FAQ Section matching Rich Snippets Schema */}
        <section className="rounded-[20px] bg-[#FAF8F4] p-5 sm:p-6 space-y-2.5">
          <h2 className="font-serif font-bold text-base text-[#18181B]">
            अक्सर पूछे जाने वाले प्रश्न (FAQ)
          </h2>
          {faqs.map((f, idx) => {
            const open = openFaqIdx === idx;
            return (
              <div key={idx} className="rounded-[12px] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(open ? null : idx)}
                  aria-expanded={open}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 font-serif font-bold text-xs sm:text-sm text-[#18181B] cursor-pointer"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-amber-800 shrink-0 transition-transform duration-200 ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`accordion-slide-container ${open ? 'is-open' : 'is-closed'}`}>
                  <div className="px-4 pb-3.5 text-xs sm:text-sm text-neutral-600 font-laila leading-relaxed">
                    {f.a}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </article>

      {/* 8. Related Discovery Bento Shelf */}
      {!isZenMode && (
        <SacredDiscoveryShelf
          currentPad={pad}
          onSelectPad={(nextP) => onSelectPad?.(nextP.slug || nextP.id, nextP)}
        />
      )}
    </div>
  );
};
export default DedicatedPadReadingView;
