import React, { useState } from 'react';
import { BookOpen, Feather, Landmark, ExternalLink, Sparkles, Compass } from 'lucide-react';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';

export type ContentBarTab = 'books' | 'authors' | 'relations';

interface BookItem {
  id: string;
  title: string;
  devanagari: string;
  author: string;
  count: number;
  countUnit: string;
  tradition: string;
  essence: string;
  tagColor: string;
  imageUrl: string;
}

interface AuthorItem {
  id: string;
  name: string;
  devanagari: string;
  tradition: string;
  totalCompositions: number;
  significance: string;
  tagColor: string;
  imageUrl: string;
}

interface RelationItem {
  id: string;
  title: string;
  devanagari: string;
  typeLabel: string;
  location: string;
  tradition: string;
  essence: string;
  tagColor: string;
  imageUrl: string;
}

interface CategoriesRowProps {
  onSelectBook: (granthaId: string) => void;
  onSelectAuthor: (authorName: string) => void;
  onSelectRelation: (relationId: string) => void;
  onOpenSaintsDirectory: () => void;
}

const BOOKS: BookItem[] = [
  {
    id: 'hit-chaurasi',
    title: 'Shri Hit Chaurasi',
    devanagari: 'श्री हित चौरासी',
    author: 'श्री हित हरिवंश महाप्रभु',
    count: 84,
    countUnit: 'Padas',
    tradition: 'Harivansh Sampradaya',
    essence: 'The pinnacle of unalloyed eternal Nikunj Ras & divine love',
    tagColor: 'text-[#7C3AED]',
    imageUrl: '',
  },
  {
    id: 'radha-sudha-nidhi',
    title: 'Shri Radha Sudhanidhi',
    devanagari: 'श्री राधा सुधानिधि',
    author: 'श्री हित हरिवंश महाप्रभु',
    count: 270,
    countUnit: 'Shlokas',
    tradition: 'Radha-Snehi Path',
    essence: 'Sublime Sanskrit stotras devoted exclusively to Sriji’s lotus feet',
    tagColor: 'text-[#EA580C]',
    imageUrl: '',
  },
  {
    id: 'kelimal',
    title: 'Shri Kelimal',
    devanagari: 'श्री केलिमाल',
    author: 'स्वामी श्री हरिदास जी',
    count: 110,
    countUnit: 'Padas',
    tradition: 'Haridasi Sangeet',
    essence: 'Secret Nidhivan Raj Leela revealed in profound classical Dhrupad',
    tagColor: 'text-[#D97706]',
    imageUrl: '',
  },
  {
    id: 'sur-sagar',
    title: 'Sur Sagar',
    devanagari: 'सूरसागर',
    author: 'महाकवि सूरदास जी',
    count: 364,
    countUnit: 'Padas',
    tradition: 'Ashtachhap Parampara',
    essence: 'Boundless ocean of Vatsalya and Madhurya Krishna leelas',
    tagColor: 'text-[#C2410C]',
    imageUrl: '',
  },
  {
    id: 'bayalees-leela',
    title: 'Bayalees Leela',
    devanagari: 'बयालीस लीला',
    author: 'श्री ध्रुवदास जी',
    count: 42,
    countUnit: 'Leelas',
    tradition: 'Hit Parampara',
    essence: '42 divine leelas of Priya-Priyatam in Vrindavan Nikunj',
    tagColor: 'text-[#E11D48]',
    imageUrl: '',
  },
  {
    id: 'raskhan-padavali',
    title: 'Raskhan Padavali',
    devanagari: 'रसखान पदावली',
    author: 'रसखान जी',
    count: 139,
    countUnit: 'Savaiyas',
    tradition: 'Krishna Prem',
    essence: 'Impassioned Braj Bhasha savaiyas of tender love and surrender',
    tagColor: 'text-[#0284C7]',
    imageUrl: '',
  },
];

const AUTHORS: AuthorItem[] = [
  {
    id: 'hit-harivansh',
    name: 'Shri Hit Harivansh',
    devanagari: 'श्री हित हरिवंश महाप्रभु',
    tradition: 'राधावल्लभ संप्रदाय • मुरली अवतार',
    totalCompositions: 354,
    significance: 'Avatar of Shriji’s flute; pioneer of unalloyed eternal Nikunj Ras',
    tagColor: 'text-[#7C3AED]',
    imageUrl: '',
  },
  {
    id: 'swami-haridas',
    name: 'Swami Shri Haridas',
    devanagari: 'स्वामी श्री हरिदास जी',
    tradition: 'सखी भाव / हरिदासी • संगीत सम्राट',
    totalCompositions: 110,
    significance: 'Revealer of Thakur Banke Bihari Lal in Nidhivan; Sangeet Samrat',
    tagColor: 'text-[#D97706]',
    imageUrl: '',
  },
  {
    id: 'surdas',
    name: 'Mahakavi Surdas',
    devanagari: 'महाकवि सूरदास जी',
    tradition: 'अष्टछाप / पुष्टिमार्ग • महाकवि',
    totalCompositions: 364,
    significance: 'The Sun of devotional poetry, celebrated for matchless divine vision',
    tagColor: 'text-[#C2410C]',
    imageUrl: '',
  },
  {
    id: 'dhruvdas',
    name: 'Shri Dhruvdas Ji',
    devanagari: 'श्री ध्रुवदास जी',
    tradition: 'हित रस परंपरा • बयालीस लीला',
    totalCompositions: 42,
    significance: 'Chronicler of Nikunj Leelas; composer of Bayalees Leela & Ras Muktavali',
    tagColor: 'text-[#E11D48]',
    imageUrl: '',
  },
  {
    id: 'raskhan',
    name: 'Rasik Raskhan',
    devanagari: 'रसखान जी',
    tradition: 'अनन्य कृष्ण प्रेम • सवैया रस',
    totalCompositions: 139,
    significance: 'Muslim nobleman who surrendered everything to become a resident of Braj',
    tagColor: 'text-[#0284C7]',
    imageUrl: '',
  },
  {
    id: 'meera',
    name: 'Bhakta Meera Bai',
    devanagari: 'भक्त मीरा बाई',
    tradition: 'माधुर्य भक्ति • गिरिधर गोपाल',
    totalCompositions: 28,
    significance: 'Royal queen whose pure love for Giridhar Gopal transcends all realms',
    tagColor: 'text-[#EA580C]',
    imageUrl: '',
  },
];

const RELATIONS: RelationItem[] = [
  {
    id: 'ashtayama',
    title: 'Ashtayama Nitya Leela',
    devanagari: 'अष्टयाम नित्य लीला',
    typeLabel: 'Sacred Leela Cycle',
    location: '8 Watches of 24 Hours',
    tradition: 'Eternal Nikunj Cycle • 8 Prahar',
    essence: 'Contemplative 24-hour cycle of Priya-Priyatam’s intimate seva and pastimes',
    tagColor: 'text-[#0284C7]',
    imageUrl: '',
  },
  {
    id: 'parikrama',
    title: 'Braj 84 Kos Parikrama',
    devanagari: 'ब्रज चौरासी कोस परिक्रमा',
    typeLabel: 'Sacred Parikrama',
    location: 'Govardhan, Barsana, Nandgaon, Vrindavan',
    tradition: 'Holy Abodes Circuit • 84 Kos',
    essence: 'Circumambulation of the holy forest groves and bathing kundas of Braj Mandal',
    tagColor: 'text-[#C2410C]',
    imageUrl: '',
  },
  {
    id: 'yamuna',
    title: 'Shri Yamuna Maharani Ji',
    devanagari: 'श्री यमुना महारानी जी',
    typeLabel: 'Sacred River of Grace',
    location: 'Keshi Ghat & Vishram Ghat',
    tradition: 'Kalindi Bhav • Pushti & Ras',
    essence: 'The divine flowing waters that purify the heart and bestow devotion to Shriji',
    tagColor: 'text-[#0284C7]',
    imageUrl: '',
  },
  {
    id: 'ragas',
    title: 'Braj Classical Ragas',
    devanagari: 'ब्रज राग संगीत धारा',
    typeLabel: 'Sacred Music',
    location: 'Vibhas, Sarang, Bilawal, Yaman',
    tradition: 'Dhrupad & Haveli Sangeet',
    essence: 'Sacred classical melodies aligned with daily Ashtayama devotional hours',
    tagColor: 'text-[#E11D48]',
    imageUrl: '',
  },
];

export const CategoriesRow: React.FC<CategoriesRowProps> = ({
  onSelectBook,
  onSelectAuthor,
  onSelectRelation,
  onOpenSaintsDirectory,
}) => {
  const [activeTab, setActiveTab] = useState<ContentBarTab>('books');

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
              {activeTab === 'books' ? 'ग्रंथ संग्रह (६)' : activeTab === 'authors' ? 'रसिक संत (६)' : 'धाम लीला (४)'}
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
          <span>पावन ग्रंथ ({BOOKS.length})</span>
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
          <span>रसिक आचार्य ({AUTHORS.length})</span>
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
          <span>लीला एवं धाम ({RELATIONS.length})</span>
        </button>
      </div>

      {/* 3. SECTION A: Canonical Books - Graphics Friendly Layout */}
      {activeTab === 'books' && (
        <div className="space-y-3 pt-1">
          {BOOKS.map((book) => (
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
                    placeholderLabel="आवरण चित्र • 3:4"
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
          {AUTHORS.map((author) => (
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
                    placeholderLabel="संत स्वरूप • 1:1"
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
          {RELATIONS.map((rel) => (
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
                    placeholderLabel="धाम लीला • 16:9"
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
