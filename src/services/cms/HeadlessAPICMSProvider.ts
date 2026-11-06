/**
 * Vrindopnisad 2.0 - Headless API CMS Provider
 * Generic adapter connecting Vrindopnisad to Headless CMS instances (Strapi, Sanity, Supabase, Contentful)
 * via REST / GraphQL endpoints configured in environment variables.
 */

import { ICMSProvider } from './CMSProvider';
import { SacredPad, DevotionalFeedPost, AshtayamaPhaseInfo } from '../../types/devotional';
import { CanonicalGrantha, CanonicalSaint } from '../sacredDatabase';
import { CMSFilter, CMSPadEntry } from '../../types/cms';
import { StaticFileCMSProvider } from './StaticFileCMSProvider';

export class HeadlessAPICMSProvider implements ICMSProvider {
  public readonly name = 'Headless CMS API Gateway';
  public readonly type = 'headless-api';

  private fallbackProvider: StaticFileCMSProvider;
  private apiUrl: string;
  private apiToken?: string;

  constructor() {
    this.fallbackProvider = new StaticFileCMSProvider();
    const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
    this.apiUrl = env?.VITE_CMS_API_URL || '';
    this.apiToken = env?.VITE_CMS_API_TOKEN || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiUrl.trim().length > 0);
  }

  public async checkConnection(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: 'No VITE_CMS_API_URL configured. Falling back to local static repository.',
      };
    }

    try {
      const t0 = performance.now();
      const res = await fetch(`${this.apiUrl}/health`, {
        headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {},
      });
      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        return { ok: true, message: 'Connected to Headless CMS backend.', latencyMs };
      }
      return { ok: false, message: `CMS endpoint responded with status ${res.status}`, latencyMs };
    } catch (err: any) {
      return {
        ok: false,
        message: `Could not reach CMS endpoint (${err.message || 'Network Error'}). Using local cache.`,
      };
    }
  }

  public async getPadas(filter?: CMSFilter): Promise<SacredPad[]> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.getPadas(filter);
    }

    try {
      const params = new URLSearchParams();
      if (filter?.collectionId) params.append('collectionId', filter.collectionId);
      if (filter?.author) params.append('author', filter.author);
      if (filter?.raga) params.append('raga', filter.raga);
      if (filter?.search) params.append('search', filter.search);
      if (filter?.limit) params.append('limit', String(filter.limit));
      if (filter?.offset) params.append('offset', String(filter.offset));

      const res = await fetch(`${this.apiUrl}/padas?${params.toString()}`, {
        headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        return data.items || data;
      }
    } catch {
      // Graceful fallback to static files if headless API fails or is offline
    }

    return this.fallbackProvider.getPadas(filter);
  }

  public async getPadById(id: string): Promise<SacredPad | null> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.getPadById(id);
    }

    try {
      const res = await fetch(`${this.apiUrl}/padas/${id}`, {
        headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {},
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return this.fallbackProvider.getPadById(id);
  }

  public async getGranthas(): Promise<CanonicalGrantha[]> {
    if (!this.isConfigured()) return this.fallbackProvider.getGranthas();
    try {
      const res = await fetch(`${this.apiUrl}/granthas`, {
        headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {},
      });
      if (res.ok) return await res.json();
    } catch {}
    return this.fallbackProvider.getGranthas();
  }

  public async getSaints(tradition?: string): Promise<CanonicalSaint[]> {
    if (!this.isConfigured()) return this.fallbackProvider.getSaints(tradition);
    try {
      const url = tradition ? `${this.apiUrl}/saints?tradition=${tradition}` : `${this.apiUrl}/saints`;
      const res = await fetch(url, {
        headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {},
      });
      if (res.ok) return await res.json();
    } catch {}
    return this.fallbackProvider.getSaints(tradition);
  }

  public async getAshtayamaSchedule(): Promise<AshtayamaPhaseInfo[]> {
    return this.fallbackProvider.getAshtayamaSchedule();
  }

  public async getFeedPosts(): Promise<DevotionalFeedPost[]> {
    if (!this.isConfigured()) return this.fallbackProvider.getFeedPosts();
    try {
      const res = await fetch(`${this.apiUrl}/feed-posts`, {
        headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {},
      });
      if (res.ok) return await res.json();
    } catch {}
    return this.fallbackProvider.getFeedPosts();
  }

  public async saveDraftPad(pad: Partial<CMSPadEntry>): Promise<CMSPadEntry> {
    if (!this.isConfigured()) {
      throw new Error('Cannot mutate remote CMS: VITE_CMS_API_URL is not set.');
    }
    const res = await fetch(`${this.apiUrl}/padas/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {}),
      },
      body: JSON.stringify(pad),
    });
    if (!res.ok) throw new Error(`CMS API error: ${res.statusText}`);
    return await res.json();
  }
}
