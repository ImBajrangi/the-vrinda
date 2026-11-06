/**
 * Vrindopnisad 2.0 - CMS Service Hub
 * Unified content access layer abstracting static files vs. headless CMS endpoints.
 */

import { ICMSProvider } from './CMSProvider';
import { StaticFileCMSProvider } from './StaticFileCMSProvider';
import { HeadlessAPICMSProvider } from './HeadlessAPICMSProvider';
import { SacredPad, DevotionalFeedPost, AshtayamaPhaseInfo } from '../../types/devotional';
import { CanonicalGrantha, CanonicalSaint } from '../sacredDatabase';
import { CMSFilter, CMSManifest } from '../../types/cms';

class CMSService {
  private static instance: CMSService;
  private currentProvider: ICMSProvider;
  private staticProvider: StaticFileCMSProvider;
  private headlessProvider: HeadlessAPICMSProvider;

  private constructor() {
    this.staticProvider = new StaticFileCMSProvider();
    this.headlessProvider = new HeadlessAPICMSProvider();

    // Auto-select headless API if configured via environment, otherwise default to static
    if (this.headlessProvider.isConfigured()) {
      this.currentProvider = this.headlessProvider;
    } else {
      this.currentProvider = this.staticProvider;
    }
  }

  public static getInstance(): CMSService {
    if (!CMSService.instance) {
      CMSService.instance = new CMSService();
    }
    return CMSService.instance;
  }

  public getActiveProvider(): ICMSProvider {
    return this.currentProvider;
  }

  public setProvider(type: 'static' | 'headless-api'): void {
    if (type === 'headless-api') {
      this.currentProvider = this.headlessProvider;
    } else {
      this.currentProvider = this.staticProvider;
    }
  }

  // --- Delegated Queries ---

  public async getPadas(filter?: CMSFilter): Promise<SacredPad[]> {
    return this.currentProvider.getPadas(filter);
  }

  public async getPadById(id: string): Promise<SacredPad | null> {
    return this.currentProvider.getPadById(id);
  }

  public async getGranthas(): Promise<CanonicalGrantha[]> {
    return this.currentProvider.getGranthas();
  }

  public async getSaints(tradition?: string): Promise<CanonicalSaint[]> {
    return this.currentProvider.getSaints(tradition);
  }

  public async getAshtayamaSchedule(): Promise<AshtayamaPhaseInfo[]> {
    return this.currentProvider.getAshtayamaSchedule();
  }

  public async getFeedPosts(): Promise<DevotionalFeedPost[]> {
    return this.currentProvider.getFeedPosts();
  }

  // --- Content Export for CMS Migration & External Synchronization ---

  public async exportFullCMSManifest(): Promise<CMSManifest> {
    return this.staticProvider.exportManifest();
  }

  public downloadCMSManifestFile(): void {
    if (typeof document === 'undefined') return;

    this.exportFullCMSManifest().then((manifest) => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `vrindopnisad-cms-manifest-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }
}

export const cms = CMSService.getInstance();
