/**
 * Vrindopnisad 2.0 - CMS Schema & Manifest Definitions
 * Defines standard headless CMS content types, publication lifecycle, and editorial metadata.
 */

import { SacredPad, DevotionalFeedPost, AshtayamaPhaseInfo } from './devotional';
import { CanonicalGrantha, CanonicalSaint } from '../services/sacredDatabase';

export type CMSContentStatus = 'published' | 'draft' | 'archived';

export interface CMSMetadata {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  status: CMSContentStatus;
  version: number;
  locale: 'hi' | 'en' | 'sa';
  editorNotes?: string;
}

export interface CMSPadEntry extends SacredPad {
  cmsMeta: CMSMetadata;
  seoTitle?: string;
  seoDescription?: string;
  featuredArtworkUrl?: string;
  audioNarrator?: string;
  meter?: string;
  tags?: string[];
}

export interface CMSGranthaEntry extends CanonicalGrantha {
  cmsMeta: CMSMetadata;
  introductoryEssay?: string;
  historicalContext?: string;
  canonicalEditor?: string;
}

export interface CMSSaintEntry extends CanonicalSaint {
  cmsMeta: CMSMetadata;
  samadhiLocation?: string;
  discipleLineage?: string[];
  birthTithi?: string;
  tirobhavTithi?: string;
}

export interface CMSFeedPostEntry extends DevotionalFeedPost {
  cmsMeta: CMSMetadata;
  scheduledPublishTime?: string;
  moderatorApproved?: boolean;
}

export interface CMSAshtayamaEntry extends AshtayamaPhaseInfo {
  cmsMeta: CMSMetadata;
  seasonalVariants?: Record<string, string>;
}

export interface CMSManifest {
  manifestVersion: string;
  exportedAt: string;
  schemaVersion: string;
  stats: {
    totalPadas: number;
    totalGranthas: number;
    totalSaints: number;
    totalFeedPosts: number;
  };
  padas: CMSPadEntry[];
  granthas: CMSGranthaEntry[];
  saints: CMSSaintEntry[];
}

export interface CMSFilter {
  collectionId?: string;
  status?: CMSContentStatus;
  author?: string;
  raga?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
