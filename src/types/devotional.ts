export interface SacredPad {
  id: string;
  collectionId: string;
  index: number;
  titleDevanagari: string;
  titleEnglish: string;
  author: string;
  rag: string;
  slug?: string;
  chapterId?: string;
  chapterName?: string;
  verseNumber?: number;
  verses: Array<{
    stanzaNumber: number;
    linesDevanagari: string[];
    linesTransliteration?: string[];
    linesEnglish?: string[];
  }>;
  audioUrl?: string;
  isStub?: boolean;
}

export interface ChapterInfo {
  id: string;
  name: string;
  verseCount: number;
  firstPadId?: string;
  firstPadSlug?: string;
}

export interface GranthaHierarchyInfo {
  id: string;
  verseCount: number;
  chaptersCount: number;
  chapters: ChapterInfo[];
}

export interface AuthorHierarchyInfo {
  name: string;
  verseCount: number;
  granthas: string[];
}

export interface ScriptureHierarchyData {
  granthas: Record<string, GranthaHierarchyInfo>;
  authors: Record<string, AuthorHierarchyInfo>;
}

export interface DevotionalFeedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isVerified: boolean;
  timestamp: string;
  contentDevanagari: string;
  contentEnglish?: string;
  hashtags: string[];
  imageUrl: string;
  imageAlt: string;
  likes: number;
  comments: number;
  views: string;
  isBookmarked?: boolean;
}

export interface SadhanaState {
  japaCompleted: number;
  japaTarget: number;
  beadInCurrentMala?: number;
  shravanMinutes: number;
  shravanTarget: number;
  svadhyayaPadas: number;
  svadhyayaTarget: number;
  currentStreakDays: number;
  completedMilestones: string[];
  bookmarkedPads: string[];

  // Contemplative Dhyana & Manasi Sewa Extensions (Backward-Compatible)
  dhyanaMinutesCompleted?: number;
  dhyanaMinutesTarget?: number;
  chittaShantiScore?: number;
  manasiSewaMinutes?: number;
  unbrokenFocusStreak?: number;
}

export interface FeedInteractionData {
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing: boolean;
  likes: number;
  views?: number;
}

export interface ReaderState {
  lastPadId?: string;
  showTransliteration?: boolean;
  bookmarkedPadIds?: string[];
  selectedTradition?: string;
}

export interface UserPreferences {
  isLowSpecMode?: boolean;
  audioVolume?: number;
  activeTab?: string;
}

export type SyncEventType =
  | 'SADHANA_UPDATED'
  | 'FEED_INTERACTION_UPDATED'
  | 'READER_STATE_UPDATED'
  | 'USER_PREFERENCES_UPDATED'
  | 'BOOKMARKS_UPDATED'
  | 'DHYANA_SESSION_COMPLETED';

export interface MultiTabSyncEvent<T = unknown> {
  type: SyncEventType | string;
  payload: T;
  sourceTabId?: string;
  timestamp: number;
}

export interface AshtayamaPhaseInfo {
  nameDevanagari: string;
  nameEnglish: string;
  timeRange: string;
  descriptionDevanagari: string;
  bhava: string;
  isActive: boolean;
}

// ==========================================
// CONTEMPLATIVE DHYANA & SACRED REFLECTION SCHEMAS
// ==========================================

export type FlowStage = 'dharana' | 'shanta' | 'dhara' | 'samadhi';

export interface DhyanaSessionRecord {
  id: string;
  timestamp: number;
  durationSeconds: number;
  japaCount: number;
  stillnessScore: number;       // 0 to 100
  coherenceScore: number;       // 0 to 100
  flowStageReached: FlowStage;  // 'dharana' | 'shanta' | 'dhara' | 'samadhi'
  reflectionNote?: string;
  reflectionSentiment?: 'shanti' | 'bhava' | 'yugal' | 'sthirata';
}

export interface ContemplativeMetrics {
  totalDhyanaMinutes: number;
  todayDhyanaMinutes: number;
  currentFlowStage: FlowStage;
  averageStillnessScore: number;
  manasiSewaLevel: number;      // 1 to 5 progression
  unbrokenFocusStreakDays: number;
  lastSessionTimestamp: number;
}

export interface SacredReflectionEntry {
  id: string;
  dateISO: string;
  sentiment: string;
  note: string;
  dhyanaMinutes: number;
  mantraCount: number;
}

export interface DhyanaImpactState {
  metrics: ContemplativeMetrics;
  recentSessions: DhyanaSessionRecord[];
  reflections: SacredReflectionEntry[];
  unlockedAntarangaBadges: string[];
}

export interface EpicChapterItem {
  id: string;
  name: string;
  section: string;
  verseCount: number;
  file: string;
  firstPadId?: string;
  firstPadSlug?: string;
}

export interface EpicIndexData {
  id: string;
  name: string;
  author: string;
  description: string;
  totalVerses: number;
  totalChapters: number;
  chapters: EpicChapterItem[];
}

export interface EpicManifestEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  totalVerses: number;
  totalChapters: number;
  indexPath: string;
}




