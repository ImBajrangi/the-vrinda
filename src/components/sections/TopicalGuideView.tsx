import React, { useState } from 'react';
import { BookOpen, ArrowLeft, Globe, Sparkles } from 'lucide-react';
import topicalGuidesData from '../../data/topicalGuides.json';

interface GuideLangContent {
  title: string;
  description: string;
  body: string;
}

interface TopicalGuideEntry {
  slug: string;
  hi: GuideLangContent;
  en: GuideLangContent;
}

const GUIDES_MAP = topicalGuidesData as Record<string, TopicalGuideEntry>;

const RELATED_GUIDE_SLUGS = [
  'what-is-vrindopnishad',
  'philosophy',
  'teachings',
  'nitya-vihar-vs-nikunj-vihar',
  'radhavallabh-vs-gaudiya-sampradaya',
  'vrindavan-parikrama-guide',
  'major-rasik-saints-of-braj',
  'what-is-madhurya-and-sakhi-bhava',
  'faq',
];

export interface TopicalGuideViewProps {
  slug: string;
  onNavigateHome?: () => void;
  onSelectGuide?: (slug: string) => void;
}

export const TopicalGuideView: React.FC<TopicalGuideViewProps> = ({
  slug,
  onNavigateHome,
  onSelectGuide,
}) => {
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const guide = GUIDES_MAP[slug] || GUIDES_MAP['what-is-vrindopnishad'];
  const content = guide[lang] || guide.hi;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-serif">
      {/* Top Navigation & Language Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <a
          href="/"
          onClick={(e) => {
            if (onNavigateHome && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              onNavigateHome();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-amber-900/10 text-sm font-sans font-medium text-stone-700 hover:bg-amber-50 transition-colors no-underline"
        >
          <ArrowLeft className="w-4 h-4 text-amber-700" />
          <span>होम सैंक्चुअरी</span>
        </a>

        <button
          type="button"
          onClick={() => setLang((l) => (l === 'hi' ? 'en' : 'hi'))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200/80 text-xs font-sans font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-amber-700" />
          <span>{lang === 'hi' ? 'Read in English' : 'हिन्दी में पढ़ें'}</span>
        </button>
      </div>

      {/* Main Article Card */}
      <div className="bg-white rounded-3xl border border-amber-900/10 shadow-sm p-6 sm:p-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-xs font-sans font-semibold text-amber-900 mb-4">
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>वृन्दोपनिषद् ज्ञानकोश • Sacred Guide</span>
        </div>

        <p className="text-sm sm:text-base text-stone-600 font-sans mb-6 leading-relaxed">
          {content.description}
        </p>

        <div
          className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-stone-900 prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3 prose-p:text-stone-700 prose-p:leading-relaxed prose-p:mb-4 prose-a:text-amber-800 prose-a:underline prose-li:text-stone-700 [&_.verse-card]:bg-amber-50/70 [&_.verse-card]:border [&_.verse-card]:border-amber-200/70 [&_.verse-card]:rounded-2xl [&_.verse-card]:p-5 [&_.verse-card]:my-5 [&_.devanagari]:text-lg [&_.devanagari]:font-semibold [&_.devanagari]:text-amber-950 [&_.devanagari]:mb-1"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      </div>

      {/* Related Guides */}
      <section className="mt-8 bg-white/80 rounded-3xl border border-amber-900/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <h2 className="text-lg font-bold text-stone-900 m-0">
            अन्य प्रमुख आध्यात्मिक मार्गदर्शिकाएँ
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RELATED_GUIDE_SLUGS.filter((s) => s !== slug && GUIDES_MAP[s]).map((s) => {
            const rel = GUIDES_MAP[s];
            return (
              <a
                key={s}
                href={`/${s}`}
                onClick={(e) => {
                  if (onSelectGuide && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onSelectGuide(s);
                  }
                }}
                className="block p-3.5 rounded-2xl bg-[#FAF8F5] border border-amber-900/10 hover:border-amber-400/60 transition-colors no-underline"
              >
                <div className="text-sm font-bold text-stone-900 line-clamp-2">
                  {rel[lang].title.split('—')[0].split('|')[0].trim()}
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </article>
  );
};

export default TopicalGuideView;
