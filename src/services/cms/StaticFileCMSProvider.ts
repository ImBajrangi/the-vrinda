/**
 * Vrindopnisad 2.0 - Static File CMS Provider
 * Default zero-latency provider serving 4,200+ canonical Braj padas,
 * granthas, and saints from local compiled databases with offline-first reliability.
 */

import { ICMSProvider } from './CMSProvider';
import { SacredDatabase, CanonicalGrantha, CanonicalSaint } from '../sacredDatabase';
import { SacredPad, DevotionalFeedPost, AshtayamaPhaseInfo } from '../../types/devotional';
import { CMSFilter, CMSManifest, CMSPadEntry } from '../../types/cms';
import { SACRED_FEED_POSTS } from '../../data/feed';
import { computeAshtayamaPhase } from '../cacheService';

export class StaticFileCMSProvider implements ICMSProvider {
  public readonly name = 'Canonical Static Repository';
  public readonly type = 'static';

  public async checkConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    const t0 = performance.now();
    const count = SacredDatabase.getAllPadas().length;
    return {
      ok: count > 0,
      message: `Static repository loaded with ${count} canonical padas.`,
      latencyMs: Math.round(performance.now() - t0),
    };
  }

  public async getPadas(filter?: CMSFilter): Promise<SacredPad[]> {
    let padas = SacredDatabase.getAllPadas();

    if (filter) {
      if (filter.collectionId && filter.collectionId !== 'all') {
        padas = padas.filter((p) => p.collectionId === filter.collectionId);
      }
      if (filter.author) {
        padas = padas.filter((p) => p.author.toLowerCase().includes(filter.author!.toLowerCase()));
      }
      if (filter.raga && filter.raga !== 'all') {
        padas = padas.filter((p) => p.rag === filter.raga);
      }
      if (filter.search) {
        const query = filter.search.toLowerCase();
        padas = padas.filter(
          (p) =>
            p.titleDevanagari.toLowerCase().includes(query) ||
            p.titleEnglish.toLowerCase().includes(query) ||
            p.author.toLowerCase().includes(query)
        );
      }
      if (filter.offset || filter.limit) {
        const start = filter.offset || 0;
        const end = filter.limit ? start + filter.limit : undefined;
        padas = padas.slice(start, end);
      }
    }

    return padas;
  }

  public async getPadById(id: string): Promise<SacredPad | null> {
    const pad = SacredDatabase.getPadById(id);
    return pad || null;
  }

  public async getGranthas(): Promise<CanonicalGrantha[]> {
    return SacredDatabase.getAllGranthas();
  }

  public async getSaints(tradition?: string): Promise<CanonicalSaint[]> {
    return SacredDatabase.getAllSaints(tradition);
  }

  public async getAshtayamaSchedule(): Promise<AshtayamaPhaseInfo[]> {
    return [computeAshtayamaPhase()];
  }

  public async getFeedPosts(): Promise<DevotionalFeedPost[]> {
    return SACRED_FEED_POSTS;
  }

  public async exportManifest(): Promise<CMSManifest> {
    const allPadas = SacredDatabase.getAllPadas();
    const allGranthas = SacredDatabase.getAllGranthas();
    const allSaints = SacredDatabase.getAllSaints();
    const allFeed = SACRED_FEED_POSTS;

    const padasWithMeta: CMSPadEntry[] = allPadas.map((p) => ({
      ...p,
      cmsMeta: {
        id: p.id,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-11-06T00:00:00Z',
        publishedAt: '2026-01-01T00:00:00Z',
        status: 'published',
        version: 1,
        locale: 'hi',
      },
    }));

    const granthasWithMeta = allGranthas.map((g) => ({
      ...g,
      cmsMeta: {
        id: g.id,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-11-06T00:00:00Z',
        status: 'published' as const,
        version: 1,
        locale: 'hi' as const,
      },
    }));

    const saintsWithMeta = allSaints.map((s) => ({
      ...s,
      cmsMeta: {
        id: s.id,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-11-06T00:00:00Z',
        status: 'published' as const,
        version: 1,
        locale: 'hi' as const,
      },
    }));

    return {
      manifestVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      schemaVersion: 'vrindopnisad-cms-v1',
      stats: {
        totalPadas: allPadas.length,
        totalGranthas: allGranthas.length,
        totalSaints: allSaints.length,
        totalFeedPosts: allFeed.length,
      },
      padas: padasWithMeta,
      granthas: granthasWithMeta,
      saints: saintsWithMeta,
    };
  }
}
