/**
 * Vrindopnisad 2.0 - Abstract CMS Provider Interface
 * Supports Headless CMS backends (Strapi, Sanity, Supabase, Contentful)
 * alongside zero-latency static file ingestion and client-side draft overrides.
 */

import { SacredPad, DevotionalFeedPost, AshtayamaPhaseInfo } from '../../types/devotional';
import { CanonicalGrantha, CanonicalSaint } from '../sacredDatabase';
import { CMSPadEntry, CMSFilter, CMSManifest } from '../../types/cms';

export interface ICMSProvider {
  /**
   * Human-readable provider identifier (e.g. 'Local Static Repository', 'Strapi Headless API')
   */
  readonly name: string;
  readonly type: 'static' | 'headless-api' | 'supabase' | 'local-override';

  /**
   * Health check / connectivity check
   */
  checkConnection(): Promise<{ ok: boolean; message: string; latencyMs?: number }>;

  // --- Content Queries ---
  getPadas(filter?: CMSFilter): Promise<SacredPad[]>;
  getPadById(id: string): Promise<SacredPad | null>;
  getGranthas(): Promise<CanonicalGrantha[]>;
  getSaints(tradition?: string): Promise<CanonicalSaint[]>;
  getAshtayamaSchedule(): Promise<AshtayamaPhaseInfo[]>;
  getFeedPosts(): Promise<DevotionalFeedPost[]>;

  // --- Editorial & CMS Mutations (for CMS / Preview Mode) ---
  saveDraftPad?(pad: Partial<CMSPadEntry>): Promise<CMSPadEntry>;
  publishPad?(id: string): Promise<boolean>;
  deletePad?(id: string): Promise<boolean>;

  // --- Content Manifest Export & Import (Sync with Headless CMS) ---
  exportManifest?(): Promise<CMSManifest>;
  importManifest?(manifest: CMSManifest): Promise<{ importedCount: number; errors: string[] }>;
}
