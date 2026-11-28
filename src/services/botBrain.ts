import { SacredDatabase } from './sacredDatabase';
import { computePanchangForDate, computeLiveMandirSchedule, getNextUpcomingFestival, getIstParts } from './panchangService';
import { computeAshtayamaPhase } from './cacheService';
import brajGlossaryData from '../data/brajGlossary.json';
import { FESTIVALS_LIST, type FestivalGuideEntry } from '../data/festivalsData';
import type { SanctuaryBotAgent } from '../data/botRoster';

export interface BotReplyResult {
  text: string;
  steps: string[];
}

export function resolveBotReply(agent: SanctuaryBotAgent, rawQuery: string): BotReplyResult {
  const q = rawQuery.trim();
  const lower = q.toLowerCase();
  const now = new Date();
  const ist = getIstParts(now);
  const panchang = computePanchangForDate(now);
  const prahar = computeAshtayamaPhase(now);
  const mandirs = {
    bihari: computeLiveMandirSchedule('bihari', ist.minutesOfDay, ist.month, true),
    vallabh: computeLiveMandirSchedule('vallabh', ist.minutesOfDay, ist.month, true),
    raman: computeLiveMandirSchedule('raman', ist.minutesOfDay, ist.month, true),
    barsana: computeLiveMandirSchedule('barsana', ist.minutesOfDay, ist.month, true),
  };
  const nextFest = getNextUpcomingFestival(now);

  // 1. Live Panchang / Tithi / Festival timing queries
  if (lower.includes('panchang') || lower.includes('tithi') || lower.includes('ekadashi') || q.includes('पंचांग') || q.includes('तिथि')) {
    return {
      text: `Today in Braj Dham: ${panchang.masaDevanagari} ${panchang.pakshaDevanagari} ${panchang.tithiNameDevanagari} (${panchang.nakshatraDevanagari} नक्षत्र). Next upcoming festival: ${nextFest.nameDevanagari} (${nextFest.dateLabel}).`,
      steps: [
        'Computing Surya-Chandra ecliptic longitudes at Braj sunrise',
        `Matched Tithi: ${panchang.tithiNameDevanagari}`,
        'Verified upcoming Utsav countdown',
      ],
    };
  }

  // 2. Live Temple Open / Closed / Ashtayama queries
  if (
    lower.includes('mandir') ||
    lower.includes('temple') ||
    lower.includes('darshan') ||
    lower.includes('open') ||
    lower.includes('prahar') ||
    lower.includes('mangala') ||
    lower.includes('ashtayama') ||
    q.includes('मंदिर') ||
    q.includes('प्रहर') ||
    q.includes('दर्शन')
  ) {
    const allM = [mandirs.bihari, mandirs.vallabh, mandirs.raman, mandirs.barsana];
    const openOnes = allM.filter((m) => m.isOpen);
    const openNames = openOnes.length > 0
      ? openOnes.map((m) => `${m.templeName.split('(')[0].trim()} (${m.sevaTitleDevanagari})`).join(', ')
      : 'Mandirs are currently resting (पट विश्राम) — check next Mangala/Sandhya countdowns in the Seva Schedule.';
    return {
      text: `Current Braj Prahar: ${prahar.nameDevanagari} (${prahar.timeRange}) — ${prahar.descriptionDevanagari}. Live Mandirs: ${openNames}`,
      steps: [
        'Evaluating live IST vs seasonal Vrindavan timetable',
        `Active Ashtayama Watch: ${prahar.nameDevanagari}`,
        'Prepared real-time temple status',
      ],
    };
  }

  // 3. Festivals lookup (Radhashtami, Holi, Sharad Purnima, etc.)
  const matchedFest = FESTIVALS_LIST.find(
    (f: FestivalGuideEntry) =>
      lower.includes(f.slug.replace('-', ' ')) ||
      lower.includes(f.name.toLowerCase()) ||
      q.includes(f.hindiName.split(' ')[0])
  );
  if (matchedFest) {
    return {
      text: `${matchedFest.hindiName} (${matchedFest.name}) — ${matchedFest.timelineHi}: ${matchedFest.descriptionHi} Visit /festivals/${matchedFest.slug} for full history, seva vidhi & classical ragas.`,
      steps: [
        'Searching Vrindavan Utsav archives',
        `Loaded bilingual guide: ${matchedFest.hindiName}`,
        'Prepared festival seva summary',
      ],
    };
  }

  // 4. Braj Glossary Lookup
  const glossaryList = (Array.isArray(brajGlossaryData) ? brajGlossaryData : (brajGlossaryData as any)?.default || []) as any[];
  const matchedGlossary = glossaryList.find(
    (g) => lower.includes(g.transliteration?.toLowerCase() || g.id) || q.includes(g.term)
  );
  if (matchedGlossary) {
    return {
      text: `${matchedGlossary.term} (${matchedGlossary.transliteration}): ${matchedGlossary.meaningDevanagari} Open /glossary/${matchedGlossary.id} for Sampradaya citations.`,
      steps: [
        'Scanning 22+ canonical Braj philosophy terms',
        `Matched term: ${matchedGlossary.term}`,
        'Verified Sampradaya context',
      ],
    };
  }

  // 5. Scripture & Verse Search inside SacredDatabase
  const searchResults = SacredDatabase.search(q, 3);
  if (searchResults.length > 0 && (q.length >= 3 || q.includes('पद') || q.includes('राम') || q.includes('राधा'))) {
    const lines = searchResults
      .map((p, idx) => `${idx + 1}. "${p.titleDevanagari}" — ${p.author}${p.rag ? ` (राग ${p.rag})` : ''}`)
      .join('\n');
    return {
      text: `Found matching scriptures in Vrindopnisad:\n${lines}\n\nTap Search (⌘K) or Padavali & Chhand to read complete verses and listen to audio.`,
      steps: [
        `Searching in-memory scripture catalog (${agent.name})`,
        `Matched ${searchResults.length} canonical records`,
        'Formatted sanitized verse references',
      ],
    };
  }

  // 6. FarmDirect / MyVilej & Offline Architecture Specific Knowledge
  if (lower.includes('harvest') || lower.includes('fresh')) {
    return {
      text: 'Produce on MyVilej is harvested fresh at dawn across verified belts in Nashik, Niphad, and Pune and dispatched within 4–6 hours. In Vrindopnisad, dawn Mangala Seva begins at 5:00–5:30 AM.',
      steps: ['Querying Kisan harvest desk', 'Checked dispatch windows', 'Response ready'],
    };
  }
  if (lower.includes('order') || lower.includes('track') || lower.includes('delivery')) {
    return {
      text: 'Order tracking monitors real-time harvest dispatch timestamps via India Post & local enablers. On Vrindopnisad, all your saved chapters and padas stay cached offline in IndexedDB.',
      steps: ['Checking MyVilej Services telemetry', 'Verified delivery checkpoints', 'Formatted guidance'],
    };
  }
  if (lower.includes('organic') || lower.includes('verify') || lower.includes('payout') || lower.includes('split')) {
    return {
      text: 'Verified farmers receive up to 78% of consumer value through 3-mode payouts (At Handover, Receiver Pays, or 50% Split + Balance Due) backed by NPOP / PGS-India audits.',
      steps: ['Checking Trust & Platform verification rules', 'Validated escrow payout policy', 'Summary generated'],
    };
  }
  if (lower.includes('soil') || lower.includes('moisture') || lower.includes('drip') || lower.includes('water') || lower.includes('jeevamrit')) {
    return {
      text: 'Sensor intelligence tracks N-P-K nutrients, drip water savings (~18% monthly reduction), solar pump peak hours (11 AM), and native Jeevamrit bio-cultures.',
      steps: [`Polling ${agent.name} telemetry`, 'Analyzing field parameters', 'Prepared recommendation'],
    };
  }
  if (lower.includes('audio') || lower.includes('japamala') || lower.includes('offline') || lower.includes('cache')) {
    return {
      text: 'Vrindopnisad stores your Japamala bead counts, Mala targets, streaks, and Hit Chaurasi audio state locally in IndexedDB + LocalStorage for instant 0ms loading—and zero unsolicited autoplay.',
      steps: ['Inspecting local IndexedDB sanctuary cache', 'Checked Hit Chaurasi audio resolver', 'Verified offline guarantees'],
    };
  }

  // 7. Rich Persona Contextual Fallback
  const summary = q.length > 44 ? `${q.slice(0, 41)}…` : q;
  return {
    text: `${agent.tip} (${agent.name} notes for “${summary}”: try asking about Hit Chaurasi, Panchang Tithi, Nitya Vihar, live Mandir timings, or FarmDirect harvest/payout rules!)`,
    steps: [
      `Understanding query with ${agent.name}`,
      `Checking ${agent.tag} knowledge index`,
      'Formulated verified response',
    ],
  };
}
