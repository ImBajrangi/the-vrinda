import React from 'react';
import { BookOpen, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { NavTab } from './FloatingNavbar';
import { resetScrollToTop } from '../../utils/scrollTop';

interface SacredFooterProps {
  onSelectTab?: (tab: NavTab) => void;
  onNavigatePath?: (path: string) => void;
}

export const SacredFooter: React.FC<SacredFooterProps> = ({
  onSelectTab,
  onNavigatePath,
}) => {
  const handleInternalLink = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    tab?: NavTab
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || href.startsWith('http')) return;
    if (tab && onSelectTab) {
      e.preventDefault();
      onSelectTab(tab);
      resetScrollToTop();
      return;
    }
    if (onNavigatePath) {
      e.preventDefault();
      onNavigatePath(href);
      resetScrollToTop();
    }
  };

  return (
    <footer
      aria-label="वृन्दोपनिषद् सनातन निर्देशिका (Sanctuary Directory)"
      className="mt-10 rounded-[24px] bg-white p-6 sm:p-8 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-6 font-serif"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Column 1: Mahagranth & Padavali Hubs */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>महाग्रन्थ व रसिक वाणी</span>
          </div>
          <ul className="space-y-1.5 text-xs text-neutral-600">
            <li>
              <a
                href="https://path.vrindopnishad.in/grantha/valmiki-ramayana"
                className="hover:text-amber-800 no-underline transition-colors"
              >
                श्रीमद् वाल्मीकि रामायण
              </a>
            </li>
            <li>
              <a
                href="https://path.vrindopnishad.in/grantha/shrimad-bhagavatam"
                className="hover:text-amber-800 no-underline transition-colors"
              >
                श्रीमद् भागवत महापुराण
              </a>
            </li>
            <li>
              <a
                href="https://path.vrindopnishad.in/grantha/ramcharitmanas"
                className="hover:text-amber-800 no-underline transition-colors"
              >
                श्री रामचरितमानस
              </a>
            </li>
            <li>
              <a
                href="https://path.vrindopnishad.in/grantha/bhagavad-gita"
                className="hover:text-amber-800 no-underline transition-colors"
              >
                श्रीमद्भगवद्गीता
              </a>
            </li>
            <li>
              <a
                href="/padavali"
                onClick={(e) => handleInternalLink(e, '/padavali', 'padavali')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                रसिक वाणी व पदावली (४,२००+ पद)
              </a>
            </li>
            <li>
              <a
                href="/ragas"
                onClick={(e) => handleInternalLink(e, '/ragas')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                शास्त्रीय राग अनुक्रमणिका
              </a>
            </li>
          </ul>
        </div>

        {/* Column 2: Sacred Collections & Festivals */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            <span>पावन संकलन व उत्सव</span>
          </div>
          <ul className="space-y-1.5 text-xs text-neutral-600">
            <li>
              <a
                href="/rituals"
                onClick={(e) => handleInternalLink(e, '/rituals', 'rituals')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                नित्य आरती, चालीसा व स्तोत्र
              </a>
            </li>
            <li>
              <a
                href="/stories"
                onClick={(e) => handleInternalLink(e, '/stories', 'stories')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                दिव्य कथा व लीला अमृत
              </a>
            </li>
            <li>
              <a
                href="/biographies"
                onClick={(e) => handleInternalLink(e, '/biographies', 'biographies')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                सनातन संत व ऋषि चरित्र
              </a>
            </li>
            <li>
              <a
                href="/places"
                onClick={(e) => handleInternalLink(e, '/places', 'places')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                पावन तीर्थ व ब्रज धाम
              </a>
            </li>
            <li>
              <a
                href="/festivals"
                onClick={(e) => handleInternalLink(e, '/festivals')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                ब्रज महोत्सव (झूलन, राधाष्टमी, शरद रास)
              </a>
            </li>
            <li>
              <a
                href="/themes"
                onClick={(e) => handleInternalLink(e, '/themes')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                ब्रज लीला प्रसंग व पद संग्रह
              </a>
            </li>
            <li>
              <a
                href="/glossary"
                onClick={(e) => handleInternalLink(e, '/glossary')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                ब्रजभाषा आध्यात्मिक शब्दकोश
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Sanctuary Philosophy & Seeker Guides */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>ज्ञानकोश व मार्गदर्शिकाएँ</span>
          </div>
          <ul className="space-y-1.5 text-xs text-neutral-600">
            <li>
              <a
                href="/knowledge-base"
                onClick={(e) => handleInternalLink(e, '/knowledge-base')}
                className="font-bold text-amber-900 hover:text-amber-700 no-underline transition-colors"
              >
                समस्त ज्ञानकोश विकी (Knowledge Base)
              </a>
            </li>
            <li>
              <a
                href="/what-is-vrindopnishad"
                onClick={(e) => handleInternalLink(e, '/what-is-vrindopnishad')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                वृन्दोपनिषद् क्या है?
              </a>
            </li>
            <li>
              <a
                href="/philosophy"
                onClick={(e) => handleInternalLink(e, '/philosophy')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                अचिन्त्य भेदाभेद व रागानुगा भक्ति
              </a>
            </li>
            <li>
              <a
                href="/nitya-vihar-vs-nikunj-vihar"
                onClick={(e) => handleInternalLink(e, '/nitya-vihar-vs-nikunj-vihar')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                नित्य विहार व निकुंज लीला
              </a>
            </li>
            <li>
              <a
                href="/radhavallabh-vs-gaudiya-sampradaya"
                onClick={(e) => handleInternalLink(e, '/radhavallabh-vs-gaudiya-sampradaya')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                राधावल्लभ व गौड़ीय सम्प्रदाय
              </a>
            </li>
            <li>
              <a
                href="/vrindavan-parikrama-guide"
                onClick={(e) => handleInternalLink(e, '/vrindavan-parikrama-guide')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                वृन्दावन पञ्चकोसी परिक्रमा गाइड
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Editorial Verification, Policies & Q&A */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>सत्यापन व साधक सहायता</span>
          </div>
          <ul className="space-y-1.5 text-xs text-neutral-600">
            <li>
              <a
                href="/faq"
                onClick={(e) => handleInternalLink(e, '/faq')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                साधक प्रश्नोत्तरी (FAQ)
              </a>
            </li>
            <li>
              <a
                href="/guide"
                onClick={(e) => handleInternalLink(e, '/guide')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                प्रारम्भिक साधक मार्गदर्शिका
              </a>
            </li>
            <li>
              <a
                href="/about"
                onClick={(e) => handleInternalLink(e, '/about')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                परियोजना व डिजिटल आश्रम परिचय
              </a>
            </li>
            <li>
              <a
                href="/editorial-policy"
                onClick={(e) => handleInternalLink(e, '/editorial-policy')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                सम्पादन एवं पाठ सत्यापन नीति
              </a>
            </li>
            <li>
              <a
                href="/sources"
                onClick={(e) => handleInternalLink(e, '/sources')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                शास्त्र स्रोत व सन्दर्भ ग्रन्थ
              </a>
            </li>
            <li>
              <a
                href="/privacy"
                onClick={(e) => handleInternalLink(e, '/privacy')}
                className="hover:text-amber-800 no-underline transition-colors"
              >
                गोपनीयता नीति • Privacy & Terms
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Colophon */}
      <div className="rounded-[14px] bg-[#FAF8F4] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500">
        <span>॥ श्रीराधावल्लभो जयति ॥ वृन्दोपनिषद् २.० — निःशुल्क सनातन एवं ब्रज रस डिजिटल आश्रम</span>
        <div className="flex items-center gap-3">
          <a
            href="/contact"
            onClick={(e) => handleInternalLink(e, '/contact')}
            className="text-amber-800 hover:underline no-underline font-bold"
          >
            सम्पर्क एवं सुझाव
          </a>
          <a
            href="/terms"
            onClick={(e) => handleInternalLink(e, '/terms')}
            className="hover:text-neutral-800 no-underline inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <span aria-hidden="true">•</span>
            <span>Terms of Use</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default SacredFooter;
