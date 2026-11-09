import { sanitizeSacredText } from '../services/sacredDatabase';

export interface VerseMeaningUnit {
  type: 'verse_pair';
  verse: string;
  meaning?: string;
}

export interface StanzaUnit {
  type: 'stanza';
  lines: string[];
  stanzaNumber?: number;
}

export interface SectionHeaderUnit {
  type: 'section_header';
  title: string;
  content?: string;
}

export interface FloralGarlandUnit {
  type: 'garland';
  text: string;
}

export interface PoemTitleUnit {
  type: 'poem_title';
  text: string;
}

export interface ProseUnit {
  type: 'prose';
  text: string;
}

export type DevotionalUnit =
  | VerseMeaningUnit
  | StanzaUnit
  | SectionHeaderUnit
  | FloralGarlandUnit
  | PoemTitleUnit
  | ProseUnit;

export interface ParsedSacredPadaContent {
  detectedRaga?: string;
  attribution?: string;
  units: DevotionalUnit[];
  hasVersePairs: boolean;
  hasStanzas: boolean;
}

/**
 * Checks if a Devanagari line ends with a terminal stanza punctuation:
 * Double Danda (॥ or \u0965), ASCII double pipe (||), or stanza number bracket/dandas (e.g. ॥ १ ॥, [1])
 */
function isStanzaTerminal(line: string): boolean {
  return /([॥\u0965]|\|\||\[\d+\])\s*$/.test(line) || /॥\s*[\d०-९]+\s*॥\s*$/.test(line);
}

/**
 * Intelligently decomposes raw Devanagari text into inherently distributed devotional units.
 * Separates sacred poetic verses from inherent line-by-line Hindi meaning, partitions traditional
 * poetry into rhythmic stanzas (छंद / चरण), extracts raga tags & attribution signatures,
 * and deduplicates trailing raw scrape dumps.
 */
export function parseDevotionalContent(rawLines: string[]): ParsedSacredPadaContent {
  if (!rawLines || rawLines.length === 0) {
    return { units: [], hasVersePairs: false, hasStanzas: false };
  }

  let lines = rawLines.map((l) => sanitizeSacredText(l || '').trim()).filter(Boolean);
  let detectedRaga: string | undefined = undefined;
  let attribution: string | undefined = undefined;

  // 1. Detect and discard duplicate monolithic concatenated dump if present at the end
  if (lines.length > 2) {
    const last = lines[lines.length - 1];
    if (last.length > 140) {
      const samplePhrases = lines
        .slice(0, lines.length - 1)
        .map((l) => l.replace(/^[“"\(]+|[”"\)]+$/g, '').trim())
        .filter((l) => l.length > 8);

      const matched = samplePhrases.filter((p) =>
        last.includes(p.substring(0, Math.min(25, p.length)))
      );

      if (
        matched.length >= 2 ||
        (samplePhrases.length > 0 && matched.length / samplePhrases.length > 0.4)
      ) {
        lines.pop(); // Remove duplicate monolithic block
      }
    }
  }

  // 2. Extract leading Raga annotation if present: (राग ...)
  if (lines.length > 0 && /^\(राग\s+([^\)]+)\)$/.test(lines[0])) {
    const m = lines[0].match(/^\(राग\s+([^\)]+)\)$/);
    if (m) {
      detectedRaga = m[1].trim();
      lines.shift();
    }
  }

  // 3. Extract trailing attribution signature if present: - ... or — ...
  if (lines.length > 0) {
    const last = lines[lines.length - 1];
    if (/^[-—–]\s*(.+)$/.test(last)) {
      attribution = last.replace(/^[-—–]\s*/, '').trim();
      lines.pop();
    }
  }

  // 4. Check if any remaining line is an un-split monolithic block containing quoted verses
  const expandedLines: string[] = [];
  for (const line of lines) {
    if (line.length > 150 && /([“"][^”"]+[”"])/.test(line)) {
      const parts = line.split(/([“"][^”"]+[”"])/g).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (/^\(राग\s+([^\)]+)\)$/.test(p)) {
          if (!detectedRaga) {
            detectedRaga = p.replace(/[()]/g, '').replace(/^राग\s*/, '').trim();
          }
          continue;
        }
        if (/^[-—–]\s*(.+)$/.test(p)) {
          if (!attribution) {
            attribution = p.replace(/^[-—–]\s*/, '').trim();
          }
          continue;
        }
        expandedLines.push(p);
      }
    } else {
      expandedLines.push(line);
    }
  }

  // Check if content uses quoted verse + meaning format
  const hasQuotedPairs = expandedLines.some((l) => /^([“"][^”"]+[”"])$/.test(l));

  // 5A. Handle Quoted Verse + Meaning Pairs (Interleaved Commentary)
  if (hasQuotedPairs) {
    const units: DevotionalUnit[] = [];

    for (let i = 0; i < expandedLines.length; i++) {
      const line = expandedLines[i];

      if (/^[-—–]\s*(.+)$/.test(line)) {
        if (!attribution) attribution = line.replace(/^[-—–]\s*/, '').trim();
        continue;
      }

      const secMatch = line.match(
        /^(स्थान|दिव्य लीला|लीला|दर्शन|कथा|माहात्म्य|भाव|विशेष|प्रसंग|स्वरूप|परिकर)\s*[:：]\s*(.*)$/
      );
      if (secMatch) {
        units.push({
          type: 'section_header',
          title: secMatch[1].trim(),
          content: secMatch[2]?.trim() || undefined,
        });
        continue;
      }

      const isQuoted = /^([“"][^”"]+[”"])$/.test(line);
      if (isQuoted) {
        const verseText = line.replace(/^[“"]|[”"]$/g, '').trim();
        let meaningText: string | undefined = undefined;

        if (i + 1 < expandedLines.length) {
          const next = expandedLines[i + 1];
          const nextIsQuoted = /^([“"][^”"]+[”"])$/.test(next);
          const nextIsSec =
            /^(स्थान|दिव्य लीला|लीला|दर्शन|कथा|माहात्म्य|भाव|विशेष|प्रसंग|स्वरूप|परिकर)\s*[:：]/.test(
              next
            );
          const nextIsAttr = /^[-—–]/.test(next);
          if (!nextIsQuoted && !nextIsSec && !nextIsAttr) {
            meaningText = next;
            i++; // Consume meaning line
          }
        }

        units.push({
          type: 'verse_pair',
          verse: verseText,
          meaning: meaningText,
        });
      } else {
        units.push({
          type: 'prose',
          text: line,
        });
      }
    }

    return { detectedRaga, attribution, units, hasVersePairs: true, hasStanzas: false };
  }

  // 5B. Handle Classical Poetry with Stanza Rhythm (छंद / दोहा / चरण विभाजन)
  const units: DevotionalUnit[] = [];
  let currentStanzaLines: string[] = [];
  let stanzaCounter = 1;
  let hasStanzas = false;

  for (let i = 0; i < expandedLines.length; i++) {
    const line = expandedLines[i];

    if (/^[-—–]\s*(.+)$/.test(line)) {
      if (!attribution) attribution = line.replace(/^[-—–]\s*/, '').trim();
      continue;
    }

    // 1. Heading line (e.g. "झूलन उत्सव संध्या दर्शन ||" or "आरती श्री युगल किशोर की")
    const cleanCandidate = line.replace(/^[\{\[\(\s]+/, '').replace(/[\}\]\)\s]+$/, '').trim();
    if (
      i === 0 &&
      (cleanCandidate.includes('दर्शन') ||
        cleanCandidate.includes('उत्सव') ||
        cleanCandidate.includes('लीला') ||
        cleanCandidate.includes('आरती') ||
        cleanCandidate.includes('मंगलाचरण') ||
        cleanCandidate.endsWith('||') ||
        cleanCandidate.endsWith('॥'))
    ) {
      const normalizedTitle = cleanCandidate
        .replace(/\|\|/g, '')
        .replace(/॥/g, '')
        .trim();
      units.push({ type: 'poem_title', text: normalizedTitle || cleanCandidate });
      continue;
    }

    // 2. Floral Garland line (e.g. "🥀🌹🥀🌹🥀🌹🥀🌹🥀" or "🪷 ❀ 🪷 ❀ 🪷")
    if (/^[🥀🌹🌸🌺🪷🌻🌷🌼🌾🌿🍃🍂❀✿\s\-_=~*•+]+$/.test(line)) {
      units.push({ type: 'garland', text: line });
      continue;
    }

    // 3. Section headers
    const secMatch = line.match(
      /^(स्थान|दिव्य लीला|लीला|दर्शन|कथा|माहात्म्य|भाव|विशेष|प्रसंग|स्वरूप|परिकर)\s*[:：]\s*(.*)$/
    );
    if (secMatch) {
      if (currentStanzaLines.length > 0) {
        units.push({
          type: 'stanza',
          lines: currentStanzaLines,
          stanzaNumber: stanzaCounter++,
        });
        currentStanzaLines = [];
        hasStanzas = true;
      }
      units.push({
        type: 'section_header',
        title: secMatch[1].trim(),
        content: secMatch[2]?.trim() || undefined,
      });
      continue;
    }

    currentStanzaLines.push(line);

    // If terminal danda ॥ or || or [1] reached, conclude stanza
    if (isStanzaTerminal(line)) {
      units.push({
        type: 'stanza',
        lines: currentStanzaLines,
        stanzaNumber: stanzaCounter++,
      });
      currentStanzaLines = [];
      hasStanzas = true;
    }
  }

  // Push any trailing lines as final stanza
  if (currentStanzaLines.length > 0) {
    units.push({
      type: 'stanza',
      lines: currentStanzaLines,
      stanzaNumber: stanzaCounter++,
    });
    hasStanzas = true;
  }

  return { detectedRaga, attribution, units, hasVersePairs: false, hasStanzas };
}
