/**
 * Sacred Sections Type Definitions
 * TypeScript contracts for Vrindopnisad Sacred Corpus:
 * - SacredStory (Katha Sanctuary)
 * - SacredBiography (Charitra Darshan)
 * - SacredPlace (Dham & Tirtha Explorer)
 * - SacredRitual (Nitya Upasana & Chanting Reader)
 */

export type StoryCategory =
  | 'ramayana'
  | 'mahabharata'
  | 'shrimad-bhagavatam'
  | 'leela'
  | 'purana'
  | 'bhaktamal'
  | 'braj-charitra';

export interface StoryCharacter {
  name: string;
  nameDevanagari?: string;
  role: string;
  avatarWebp?: string;
  bioSnippet?: string;
}

export interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  titleDevanagari?: string;
  content: string; // Rich Devanagari narrative text / markdown
  purport?: string; // Tattwa / Shiksha / Spiritual realization
  shlokas?: Array<{
    devanagari: string;
    transliteration?: string;
    meaning: string;
    reference?: string;
  }>;
}

export interface SacredStory {
  id: string; // URL-safe slug
  slug: string;
  title: string;
  titleDevanagari: string;
  category: StoryCategory;
  categoryHindi: string;
  summary: string;
  readingTimeMinutes: number;
  characters: StoryCharacter[];
  chapters: StoryChapter[];
  purport: string; // Sacred moral / siddhanta callout
  coverImageWebp?: string;
  tradition: string; // 'सनातन परम्परा' / 'श्रीमद्भागवत परम्परा' / etc.
  tags: string[];
}

export interface SacredStoryPreview {
  id: string;
  slug: string;
  title: string;
  titleDevanagari: string;
  category: StoryCategory;
  categoryHindi: string;
  summary: string;
  readingTimeMinutes: number;
  chapterCount: number;
  characterCount: number;
  coverImageWebp?: string;
  tradition: string;
  tags: string[];
}

// ==========================================
// Sacred Biographies (Saint & Rishi Charitras)
// ==========================================

export interface SaintLineage {
  sampradaya: string;
  guru: string;
  prominentDisciples?: string[];
  seatOrPeetham?: string;
}

export interface SamadhiLocation {
  place: string;
  dhamOrRegion: string;
  coordinates?: { lat: number; lng: number };
  darshanSignificance?: string;
}

export interface LiteraryWork {
  title: string;
  titleDevanagari?: string;
  description: string;
  language?: string;
  versesCount?: number;
  granthId?: string;
}

export interface SaintLeela {
  title: string;
  description: string;
  shiksha?: string;
}

export interface SacredBiography {
  id: string;
  slug: string;
  name: string;
  nameDevanagari: string;
  titleHonorific?: string;
  period: string; // e.g. "15वीं शताब्दी"
  tradition: string;
  guru?: string;
  lineage: SaintLineage;
  birthPlace?: string;
  samadhiLocation: SamadhiLocation;
  literaryWorks: LiteraryWork[];
  keyLeelas: SaintLeela[];
  lifeSummary: string;
  fullBioHtml?: string;
  avatarWebp?: string;
  versesOrBaniCount?: number;
  tags: string[];
}

export interface SacredBiographyPreview {
  id: string;
  slug: string;
  name: string;
  nameDevanagari: string;
  titleHonorific?: string;
  period: string;
  tradition: string;
  samadhiPlace: string;
  worksCount: number;
  lifeSummary: string;
  avatarWebp?: string;
  tags: string[];
}

// ==========================================
// Sacred Places (Tirtha & Dham Mahatmya)
// ==========================================

export type DhamRegion =
  | 'braj'
  | 'vrindavan'
  | 'mathura'
  | 'barsana'
  | 'govardhan'
  | 'ayodhya'
  | 'puri'
  | 'dwarka'
  | 'kashi'
  | 'char-dham'
  | 'all';

export interface DarshanSlot {
  open: string;
  close: string;
  aartiName?: string;
}

export interface DarshanTimings {
  morning?: DarshanSlot;
  evening?: DarshanSlot;
  specialNotes?: string;
}

export interface AssociatedLeela {
  title: string;
  description: string;
  eraOrLila?: string;
}

export interface SacredPlace {
  id: string;
  slug: string;
  name: string;
  nameDevanagari: string;
  dhamRegion: DhamRegion;
  regionNameHindi: string;
  briefSignificance: string;
  deity: string;
  deityDevanagari?: string;
  darshanTimings: DarshanTimings;
  parikramaKm?: number;
  associatedLeelas: AssociatedLeela[];
  nearbyKundsOrShilats?: string[];
  samadhisNearby?: string[];
  imageWebp?: string;
  rulesAndEtiquette?: string[];
  tags: string[];
}

export interface SacredPlacePreview {
  id: string;
  slug: string;
  name: string;
  nameDevanagari: string;
  dhamRegion: DhamRegion;
  regionNameHindi: string;
  briefSignificance: string;
  deity: string;
  deityDevanagari?: string;
  parikramaKm?: number;
  imageWebp?: string;
  tags: string[];
}

// ==========================================
// Sacred Rituals (Aartis, Chalisas, Upasana)
// ==========================================

export type RitualCategory =
  | 'aarti'
  | 'chalisa'
  | 'stotra'
  | 'ashtakam'
  | 'sahasranama'
  | 'mantra'
  | 'kavach';

export interface RitualStanza {
  stanzaNumber: number;
  textDevanagari: string[];
  transliteration?: string[];
  meaning?: string;
}

export interface PujaVidhi {
  timing?: string;
  requiredItems?: string[];
  steps?: string[];
  benefits?: string;
  sankalp?: string;
}

export interface SacredRitual {
  id: string;
  slug: string;
  title: string;
  titleDevanagari: string;
  category: RitualCategory;
  categoryHindi: string;
  deity: string;
  deityDevanagari: string;
  author?: string;
  totalVerses: number;
  durationMinutes: number;
  stanzas: RitualStanza[];
  pujaVidhi: PujaVidhi;
  audioUrl?: string;
  tags: string[];
}

export interface SacredRitualPreview {
  id: string;
  slug: string;
  title: string;
  titleDevanagari: string;
  category: RitualCategory;
  categoryHindi: string;
  deity: string;
  deityDevanagari: string;
  totalVerses: number;
  durationMinutes: number;
  tags: string[];
}

// ==========================================
// Corpus Index & Generic Envelope
// ==========================================

export interface CorpusIndexManifest<T> {
  category: string;
  categoryHindi: string;
  count: number;
  updatedAt: string;
  items: T[];
}
