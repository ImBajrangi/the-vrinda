import { SacredDatabase } from './sacredDatabase';
import {
  computePanchangForDate,
  computeLiveMandirSchedule,
  getNextUpcomingFestival,
  getIstParts,
} from './panchangService';
import { computeAshtayamaPhase } from './cacheService';
import brajGlossaryData from '../data/brajGlossary.json';
import { FESTIVALS_LIST } from '../data/festivalsData';
import type { SanctuaryBotAgent } from '../data/botRoster';
import { SANCTUARY_BOTS } from '../data/botRoster';
import { assistantCache } from './assistantCache';
import { resolveBotReply, type BotReplyResult } from './botBrain';

export type BotCategoryId = 'all' | 'sanctuary' | 'scripture' | 'farmdirect';

export const BOT_CATEGORIES: ReadonlyArray<{ id: BotCategoryId; label: string; shortLabel: string }> = [
  { id: 'all', label: 'All (14)', shortLabel: 'All' },
  { id: 'sanctuary', label: 'Vrindavan & Seva', shortLabel: 'Seva' },
  { id: 'scripture', label: 'Scriptures & Braj', shortLabel: 'Texts' },
  { id: 'farmdirect', label: 'Gaushala & FarmDirect', shortLabel: 'Agro' },
];

const BOT_CATEGORY_BY_ID: Record<string, Exclude<BotCategoryId, 'all'>> = {
  kisan: 'sanctuary',
  raju: 'sanctuary',
  moti: 'sanctuary',
  chintu: 'sanctuary',
  heera: 'sanctuary',
  sita: 'scripture',
  tara: 'scripture',
  bheem: 'scripture',
  trishul: 'scripture',
  shetty: 'scripture',
  guddu: 'farmdirect',
  boond: 'farmdirect',
  services: 'farmdirect',
  platform: 'farmdirect',
};

const BOT_SYSTEM_DIRECTIVES: Record<string, string> = {
  kisan: 'Focus on Mangala dawn Darshan windows across Vrindavan & Barsana temples alongside Nashik morning harvest windows and seasonal Seva readiness.',
  sita: 'Focus on authentic Rasik Braj terminology from brajGlossaryData, textual purity across Hit Chaurasi & Kelimal, and pure origin-verified sourcing standards.',
  shetty: 'Focus on Sampradaya lineages (Radhavallabh, Haridasi, Gaudiya, Vallabh, Nimbarka), Acharya lineages, and fair transparent farmer harvest rates.',
  raju: 'Focus on exact real-time Ashtayama 8-watch progression (Mangala through Shayana), ragas, bhava, and synchronized dispatch timing.',
  tara: 'Focus on rapid cross-corpus scripture lookup across 43,520+ verses, providing concise couplet previews, exact Pad titles, and internal route paths.',
  moti: 'Focus on Braj 84 Kos Parikrama landmarks, Vrindavan sacred paths (Seva Kunj, Nidhivan, Radha Kund, Govardhan), and temple visit practicalities.',
  chintu: 'Focus on upcoming Vrindavan Utsavs, Ekadashi/Purnima observances, Rajbhog bhog customs, and festival Ragaseva schedules.',
  heera: 'Focus on astronomical Panchang (Tithi, Paksha, Masa, Nakshatra, Ekadashi) computed at Braj sunrise IST alongside rural harvest climate intel.',
  bheem: 'Focus on heavy classical Mahagranths (Shrimad Bhagavatam, Valmiki Ramayana, Shri Ramcharitmanas, Bhagavad Gita) chapter structure and study guidance.',
  trishul: 'Focus on sacred Stotras (Rudrashtakam, Madhurashtakam, Radha Kripa Kataksha, Yamunashtakam) chanting discipline, meter, and daily sadhana integration.',
  guddu: 'Focus on Vrindavan Gaushala cow-care seva, organic Vedic Bilona A2 ghee, herbal prasad brews, and sustainable farm nutrition.',
  boond: 'Focus on Shri Yamuna Maharani devotion (Yamunashtakam), Kund restoration, drip irrigation efficiency, and rainwater conservation in Braj & rural farms.',
  services: 'Focus on helping visitors navigate Vrindopnisad sections cleanly (/padavali, /sanatan-epics, /ragas, /festivals, /glossary, /places, /rituals, Audio player) and FarmDirect orders.',
  platform: 'Focus on privacy-first local IndexedDB caching, fast offline Padavali reading, low-spec performance tuning, and direct transparent payouts.',
};

export function getBotCategory(botId: string): Exclude<BotCategoryId, 'all'> {
  return BOT_CATEGORY_BY_ID[botId] || 'sanctuary';
}

export interface BotSectionHome {
  label: string;
  href: string;
}

const BOT_HOME_SECTION_BY_ID: Record<string, BotSectionHome> = {
  kisan: { label: 'Home Seva', href: '/' },
  raju: { label: 'Ashtayama', href: '/' },
  heera: { label: 'Knowledge Hub', href: '/festivals' },
  tara: { label: 'Padavali Reader', href: '/padavali' },
  sita: { label: 'Braj Glossary', href: '/glossary' },
  bheem: { label: 'Sanatan Epics', href: '/sanatan-epics' },
  trishul: { label: 'Nitya Upasana', href: '/rituals' },
  shetty: { label: 'Saints & Lineages', href: '/biographies' },
  chintu: { label: 'Braj Festivals', href: '/festivals' },
  moti: { label: 'Sacred Places', href: '/places' },
  boond: { label: 'Sacred Streams', href: '/places' },
  guddu: { label: 'Dharmic Living', href: '/rituals' },
  services: { label: 'Raga Directory', href: '/ragas' },
  platform: { label: 'Devotion Tracker', href: '/themes' },
};

export function getBotHomeSection(botId: string): BotSectionHome {
  return BOT_HOME_SECTION_BY_ID[botId] || { label: 'Home Sanctuary', href: '/' };
}

export interface BotSuggestedLink {
  label: string;
  href: string;
}

export type BotResponseSource = 'groq' | 'edge-groq' | 'cache' | 'local';

export interface BotStreamReplyResult extends BotReplyResult {
  source: BotResponseSource;
  model?: string;
  suggestedLinks?: BotSuggestedLink[];
}

export interface ChatTurnForPrompt {
  role: 'user' | 'agent';
  text: string;
}

export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_PRIMARY_MODEL = 'qwen/qwen3.8-27b';
export const GROQ_MODEL_CASCADE = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b'] as const;

let edgeProxyAvailable: boolean | null = null;

function resolveClientGroqKey(): string {
  try {
    return (import.meta.env?.VITE_GROQ_API_KEY || '').trim();
  } catch {
    return '';
  }
}

export function isGroqConfigured(): boolean {
  return Boolean(resolveClientGroqKey()) || edgeProxyAvailable !== false;
}

export function stripThinkingTags(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const openIdx = cleaned.toLowerCase().lastIndexOf('<think>');
  if (openIdx !== -1) {
    cleaned = cleaned.slice(0, openIdx);
  }
  return cleaned.trimStart();
}

const SCRIPTURE_STOPWORDS = new Set([
  'give', 'show', 'find', 'tell', 'what', 'which', 'when', 'where', 'how', 'why',
  'brief', 'short', 'line', 'lines', 'preview', 'summary', 'today', 'panchang',
  'tithi', 'mandir', 'status', 'darshan', 'please', 'help', 'about', 'with',
  'from', 'into', 'this', 'that', 'verse', 'pad', 'stotra', 'explain', 'meaning',
  'right', 'now', 'current', 'active', 'open', 'closed', 'vrindavan', 'and', 'the',
]);

function searchCorpusForQuery(rawQuery: string): ReturnType<typeof SacredDatabase.search> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];
  const direct = SacredDatabase.search(q, 3);
  if (direct.length > 0) return direct;

  const qLower = q.toLowerCase();
  const knownAliases: Array<{ needle: string; padId?: string; query: string }> = [
    { needle: 'hit chaurasi', padId: 'hit-chaurasi-01', query: 'जोई जोई प्यारो' },
    { needle: 'chaurasi', padId: 'hit-chaurasi-01', query: 'जोई जोई प्यारो' },
    { needle: 'joi joi', padId: 'hit-chaurasi-01', query: 'जोई जोई प्यारो' },
    { needle: 'pyaro', padId: 'hit-chaurasi-01', query: 'प्यारो' },
    { needle: 'kelimal', padId: 'kelimal-01', query: 'केलिमाल' },
    { needle: 'radha kripa', padId: 'radha-kripa-kataksha', query: 'राधा कृपा' },
    { needle: 'kataksha', padId: 'radha-kripa-kataksha', query: 'राधा कृपा' },
    { needle: 'yamunashtakam', padId: 'yamunashtakam', query: 'यमुनाष्टकम्' },
    { needle: 'madhurashtakam', padId: 'madhurashtakam', query: 'मधुराष्टकम्' },
    { needle: 'rudrashtakam', padId: 'rudrashtakam', query: 'रुद्राष्टकम्' },
    { needle: 'ramcharitmanas', query: 'रामचरितमानस' },
    { needle: 'ramayana', query: 'रामायण' },
    { needle: 'bhagavatam', query: 'भागवत' },
    { needle: 'bhagavad gita', query: 'गीता' },
    { needle: 'gita', query: 'गीता' },
    { needle: 'harivansh', query: 'हरिवंश' },
    { needle: 'haridas', query: 'हरिदास' },
    { needle: 'bihari', query: 'बिहारी' },
    { needle: 'surdas', query: 'सूरदास' },
    { needle: 'mirabai', query: 'मीरा' },
  ];
  for (const item of knownAliases) {
    if (qLower.includes(item.needle)) {
      const idHit = item.padId ? SacredDatabase.getPadById(item.padId) : undefined;
      const queryHits = SacredDatabase.search(item.query, 3);
      if (idHit) {
        const merged = [idHit, ...queryHits.filter((p) => p.id !== idHit.id)].slice(0, 3);
        return merged;
      }
      if (queryHits.length > 0) return queryHits;
    }
  }

  const tokens = q
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !SCRIPTURE_STOPWORDS.has(w.toLowerCase()));

  for (let i = 0; i < tokens.length; i++) {
    const bigram = tokens[i + 1] ? `${tokens[i]} ${tokens[i + 1]}` : '';
    if (bigram) {
      const biHits = SacredDatabase.search(bigram, 3);
      if (biHits.length > 0) return biHits;
    }
    const uniHits = SacredDatabase.search(tokens[i], 3);
    if (uniHits.length > 0) return uniHits;
  }
  return [];
}

function buildGroundedContext(agent: SanctuaryBotAgent, rawQuery: string): {
  contextBlock: string;
  steps: string[];
  suggestedLinks: BotSuggestedLink[];
} {
  const now = new Date();
  const ist = getIstParts(now);
  const panchang = computePanchangForDate(now);
  const prahar = computeAshtayamaPhase(now);
  const mandirs = [
    computeLiveMandirSchedule('bihari', ist.minutesOfDay, ist.month, true),
    computeLiveMandirSchedule('vallabh', ist.minutesOfDay, ist.month, true),
    computeLiveMandirSchedule('raman', ist.minutesOfDay, ist.month, true),
    computeLiveMandirSchedule('barsana', ist.minutesOfDay, ist.month, true),
  ];
  const nextFest = getNextUpcomingFestival(now);

  const q = rawQuery.trim();
  const qLower = q.toLowerCase();
  const steps: string[] = [
    `${panchang.tithiShortDevanagari} • ${prahar.nameDevanagari} (${ist.minutesOfDay > 0 ? `${String(Math.floor(ist.minutesOfDay / 60)).padStart(2, '0')}:${String(ist.minutesOfDay % 60).padStart(2, '0')} IST` : 'IST'})`,
  ];
  const suggestedLinks: BotSuggestedLink[] = [];

  // Search matching verses across corpus with keyword/alias extraction
  const matchedPads = searchCorpusForQuery(q);
  if (matchedPads.length > 0) {
    steps.push(`Corpus match: ${matchedPads.length} sacred pad${matchedPads.length > 1 ? 's' : ''}`);
    for (const p of matchedPads.slice(0, 2)) {
      const slug = p.slug || p.id;
      suggestedLinks.push({
        label: p.titleDevanagari || p.titleEnglish,
        href: `/pad/${slug}`,
      });
    }
  }

  // Match festivals
  const matchedFestival = FESTIVALS_LIST.find(
    (f) =>
      qLower.includes(f.slug.replace(/-/g, ' ')) ||
      qLower.includes(f.name.toLowerCase()) ||
      q.includes(f.hindiName)
  );
  if (matchedFestival) {
    steps.push(`Festival match: ${matchedFestival.name}`);
    suggestedLinks.push({
      label: `${matchedFestival.name} Guide`,
      href: `/festivals/${matchedFestival.slug}`,
    });
  }

  // Match glossary
  const glossaryArr = brajGlossaryData as Array<{
    id: string;
    term: string;
    transliteration: string;
    meaningDevanagari: string;
    context: string;
  }>;
  const matchedTerms = glossaryArr
    .filter(
      (g) =>
        qLower.includes(g.id.replace(/-/g, ' ')) ||
        qLower.includes(g.transliteration.toLowerCase().split(' ')[0] || '') ||
        q.includes(g.term.split(' ')[0] || '')
    )
    .slice(0, 2);
  if (matchedTerms.length > 0) {
    steps.push(`Glossary: ${matchedTerms.map((t) => t.transliteration).join(', ')}`);
    suggestedLinks.push({ label: 'Braj Glossary', href: '/glossary' });
  }

  // Domain default suggested link if empty
  if (suggestedLinks.length === 0) {
    const cat = getBotCategory(agent.id);
    if (cat === 'scripture') {
      suggestedLinks.push({ label: 'Open Padavali Reader', href: '/padavali' });
    } else if (agent.id === 'raju' || agent.id === 'kisan' || agent.id === 'chintu') {
      suggestedLinks.push({ label: 'Darshan & Festivals', href: '/festivals' });
    } else if (agent.id === 'moti' || agent.id === 'boond') {
      suggestedLinks.push({ label: 'Sacred Braj Places', href: '/places' });
    } else if (agent.id === 'services') {
      suggestedLinks.push({ label: 'Explore Ragas', href: '/ragas' });
    }
  }

  const hh = String(Math.floor(ist.minutesOfDay / 60)).padStart(2, '0');
  const mm = String(ist.minutesOfDay % 60).padStart(2, '0');

  const lines: string[] = [
    `LIVE VRINDAVAN SANCTUARY TELEMETRY (${hh}:${mm} IST):`,
    `- Panchang: ${panchang.weekdayShort} (${panchang.weekdayDevanagari}), ${panchang.masaEnglish} (${panchang.masaDevanagari}), ${panchang.pakshaEnglish} ${panchang.tithiNameEnglish} (${panchang.tithiShortDevanagari}), Nakshatra: ${panchang.nakshatraEnglish}${panchang.specialOccasionEnglish ? `, Occasion: ${panchang.specialOccasionEnglish}` : ''}`,
    `- Ashtayama Prahar: ${prahar.nameEnglish} (${prahar.nameDevanagari}, ${prahar.timeRange}) | Bhava: ${prahar.bhava}`,
    `- Next Major Utsav: ${nextFest.nameEnglish} (${nextFest.nameDevanagari}) in ${nextFest.daysAway} days (${nextFest.dateLabel})`,
    `- Live Mandir Doors Now:`,
    ...mandirs.map(
      (m) => `  • ${m.templeName}: ${m.isOpen ? 'OPEN' : 'CLOSED'} — ${m.sevaTitleEnglish} (${m.countdownLabel})`
    ),
  ];

  if (matchedPads.length > 0) {
    lines.push('- MATCHED SCRIPTURES IN VRINDOPNISAD CORPUS:');
    for (const p of matchedPads) {
      const sampleLine =
        p.verses?.[0]?.linesDevanagari?.slice(0, 2).join(' / ') || '';
      const eng = p.verses?.[0]?.linesEnglish?.slice(0, 1).join(' ') || '';
      lines.push(
        `  • "${p.titleDevanagari || p.titleEnglish}" by ${p.author} (Raga: ${p.rag || 'Traditional'}, Route: /pad/${p.slug || p.id})${sampleLine ? ` — "${sampleLine}"` : ''}${eng ? ` [${eng}]` : ''}`
      );
    }
  }

  if (matchedFestival) {
    lines.push(
      `- MATCHED FESTIVAL (/festivals/${matchedFestival.slug}): ${matchedFestival.name} (${matchedFestival.hindiName}) at ${matchedFestival.primaryTemple}. Raga: ${matchedFestival.recommendedRaga}. ${matchedFestival.descriptionEn}`
    );
  }

  if (matchedTerms.length > 0) {
    lines.push('- MATCHED BRAJ GLOSSARY:');
    for (const t of matchedTerms) {
      lines.push(`  • ${t.term} (${t.transliteration}): ${t.meaningDevanagari} — ${t.context}`);
    }
  }

  if (agent.handoff?.length) {
    const [targetId, reason] = agent.handoff;
    const targetName = SANCTUARY_BOTS.find((b) => b.id === targetId)?.name || targetId;
    lines.push(`- Companion bot handoff option: ${targetName} (${targetId}) for ${reason}`);
  }

  lines.push(
    '- Available Vrindopnisad routes you may cite plainly as paths when useful: /padavali, /sanatan-epics, /ragas, /festivals, /rituals, /places, /glossary, /biographies'
  );

  return {
    contextBlock: lines.join('\n'),
    steps,
    suggestedLinks: suggestedLinks.slice(0, 2),
  };
}

function buildSystemPrompt(agent: SanctuaryBotAgent, groundedContext: string): string {
  const directive = BOT_SYSTEM_DIRECTIVES[agent.id] || agent.role;
  return [
    `You are ${agent.name} — "${agent.role}" on Vrindopnisad 2.0 (Braj Rasik literature, live Vrindavan temple Darshan, Panchang, and FarmDirect ethical agro-seva assistant network).`,
    `Persona tag: ${agent.tag}. Note: ${agent.tip}`,
    `Specialty focus: ${directive}`,
    '',
    'RESPONSE RULES:',
    '1. Ground every time-sensitive answer (Darshan open/closed, Tithi, Ashtayama prahar, festivals, verses) STRICTLY in the Live Sanctuary Telemetry below — never invent temple timings or fabricate couplets.',
    '2. Keep replies warm, crisp, scannable, and genuinely helpful (3–6 concise lines or short bullet points using **bold** sparingly). Use Hindi/Sanskrit terms naturally in parentheses alongside clear English when helpful.',
    '3. If a route path like /padavali or /pad/... fits the answer, include it verbatim once so the UI turns it into a clickable link.',
    '4. Never output <think> blocks or internal scratchpad text; output the final answer directly.',
    '',
    groundedContext,
  ].join('\n');
}

async function fetchGroqStreamFromUrl(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
}

async function readSseContentStream(
  response: Response,
  onChunk: (cleanText: string) => void
): Promise<string> {
  if (!response.body) {
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const full = stripThinkingTags(json.choices?.[0]?.message?.content || '');
    if (full) onChunk(full);
    return full;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let rawAccumulated = '';
  let lastEmitMs = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx = buffer.indexOf('\n');
      while (newlineIdx !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') {
            newlineIdx = buffer.indexOf('\n');
            continue;
          }
          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
            };
            const piece =
              parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? '';
            if (piece) {
              rawAccumulated += piece;
              const now = performance.now();
              if (now - lastEmitMs >= 42) {
                const clean = stripThinkingTags(rawAccumulated);
                if (clean) onChunk(clean);
                lastEmitMs = now;
              }
            }
          } catch {
            // Skip malformed partial SSE frames safely
          }
        }
        newlineIdx = buffer.indexOf('\n');
      }
    }
  } finally {
    reader.releaseLock();
  }

  const finalClean = stripThinkingTags(rawAccumulated);
  if (finalClean) onChunk(finalClean);
  return finalClean;
}

function makeCacheKey(agentId: string, query: string): string {
  return `v3_groq_${agentId}_${query.toLowerCase().trim().slice(0, 140)}`;
}

export async function streamBotReply(
  agent: SanctuaryBotAgent,
  rawQuery: string,
  history: ChatTurnForPrompt[],
  options: {
    signal?: AbortSignal;
    skipCache?: boolean;
    onSteps?: (steps: string[]) => void;
    onToken?: (textSoFar: string) => void;
  } = {}
): Promise<BotStreamReplyResult> {
  const { signal, skipCache = false, onSteps, onToken } = options;
  const grounded = buildGroundedContext(agent, rawQuery);
  onSteps?.(grounded.steps);

  // Use persistent L1 + localStorage cache cleanly for first-turn / single-turn queries
  const cacheKey = makeCacheKey(agent.id, rawQuery);
  if (!skipCache && history.length <= 1) {
    const cached = assistantCache.get<{ text: string; steps?: string[]; model?: string }>(cacheKey);
    if (cached?.text) {
      onToken?.(cached.text);
      return {
        text: cached.text,
        steps: cached.steps || grounded.steps,
        source: 'cache',
        model: cached.model || GROQ_PRIMARY_MODEL,
        suggestedLinks: grounded.suggestedLinks,
      };
    }
  }

  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(agent, grounded.contextBlock) },
    ...history
      .slice(-6)
      .filter((t) => t.text.trim().length > 0)
      .map((t) => ({
        role: t.role === 'agent' ? ('assistant' as const) : ('user' as const),
        content: t.text.slice(0, 1200),
      })),
    { role: 'user' as const, content: rawQuery.trim() },
  ];

  const clientKey = resolveClientGroqKey();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const shouldTryEdge =
    edgeProxyAvailable !== false &&
    (!clientKey ||
      hostname.endsWith('vrindopnishad.in') ||
      hostname.endsWith('.pages.dev'));

  for (const model of GROQ_MODEL_CASCADE) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const requestBody = {
      model,
      messages,
      temperature: 0.45,
      max_tokens: 650,
      stream: true,
    };

    // 1. Try Cloudflare Pages Function proxy (/api/bot-chat) on deployed Worker or when client key absent
    if (shouldTryEdge && edgeProxyAvailable !== false) {
      try {
        const edgeRes = await fetchGroqStreamFromUrl(
          '/api/bot-chat',
          { 'Content-Type': 'application/json' },
          requestBody,
          signal
        );
        const contentType = (edgeRes.headers.get('content-type') || '').toLowerCase();
        if (edgeRes.ok && !contentType.includes('text/html')) {
          edgeProxyAvailable = true;
          const text = await readSseContentStream(edgeRes, (partial) => onToken?.(partial));
          if (text) {
            const finalSteps = [...grounded.steps, 'Live Sanctuary Synthesis'];
            onSteps?.(finalSteps);
            if (history.length <= 1) {
              assistantCache.set(cacheKey, { text, steps: finalSteps, model });
            }
            return {
              text,
              steps: finalSteps,
              source: 'edge-groq',
              model,
              suggestedLinks: grounded.suggestedLinks,
            };
          }
        } else if (edgeRes.status === 404 || edgeRes.status === 405 || edgeRes.status === 503 || contentType.includes('text/html')) {
          // Local Vite preview or Edge secret unset -> cleanly remember & fall back to direct client Groq API
          edgeProxyAvailable = false;
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
        edgeProxyAvailable = false;
      }
    }

    // 2. Direct Groq OpenAI-compatible SSE stream
    if (clientKey) {
      try {
        const directRes = await fetchGroqStreamFromUrl(
          GROQ_ENDPOINT,
          {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clientKey}`,
          },
          requestBody,
          signal
        );
        if (directRes.ok) {
          const text = await readSseContentStream(directRes, (partial) => onToken?.(partial));
          if (text) {
            const finalSteps = [...grounded.steps, 'Verified Live Context'];
            onSteps?.(finalSteps);
            if (history.length <= 1) {
              assistantCache.set(cacheKey, { text, steps: finalSteps, model });
            }
            return {
              text,
              steps: finalSteps,
              source: 'groq',
              model,
              suggestedLinks: grounded.suggestedLinks,
            };
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
      }
    }
  }

  // 3. Deterministic Offline Sanctuary RAG fallback (guarantees zero dead ends offline)
  const local = resolveBotReply(agent, rawQuery);
  const localSteps = [...(local.steps || grounded.steps), 'Offline Sanctuary Engine'];
  onSteps?.(localSteps);
  onToken?.(local.text);
  return {
    text: local.text,
    steps: localSteps,
    source: 'local',
    suggestedLinks: grounded.suggestedLinks,
  };
}

export function clearBotConversationCache(agentId: string): void {
  const prefix = `v3_groq_${agentId}_`;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.includes(prefix)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch {}
}

export type RichReplySegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'link'; value: string; href: string };

const INTERNAL_ROUTE_RE =
  /(\/(?:padavali|pad|sanatan-epics|biographies|bio|festivals|rituals|ritual|places|place|stories|story|themes|theme|glossary|ragas|raga|guide)(?:\/[a-zA-Z0-9_-]+)*)/g;

export function parseRichInlineSegments(line: string): RichReplySegment[] {
  const segments: RichReplySegment[] = [];
  const tokenRe = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\/(?:padavali|pad|sanatan-epics|biographies|bio|festivals|rituals|ritual|places|place|stories|story|themes|theme|glossary|ragas|raga|guide)(?:\/[a-zA-Z0-9_-]+)*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ type: 'bold', value: token.slice(2, -2) });
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      segments.push({ type: 'italic', value: token.slice(1, -1) });
    } else if (token.startsWith('/')) {
      segments.push({ type: 'link', value: token, href: token });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    segments.push({ type: 'text', value: line.slice(lastIndex) });
  }
  return segments;
}

export function extractRoutePathsFromText(text: string): string[] {
  const matches = text.match(INTERNAL_ROUTE_RE) || [];
  return Array.from(new Set(matches));
}

export function navigateSpaRoute(href: string, afterNavigate?: () => void): void {
  if (typeof window === 'undefined' || !href.startsWith('/')) return;
  try {
    if (window.location.pathname + window.location.search !== href) {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    afterNavigate?.();
  } catch {
    window.location.assign(href);
  }
}
