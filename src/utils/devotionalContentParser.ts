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

export interface MeterBadgeUnit {
  type: 'meter_badge';
  name: string;
}

export type DevotionalUnit =
  | VerseMeaningUnit
  | StanzaUnit
  | SectionHeaderUnit
  | FloralGarlandUnit
  | PoemTitleUnit
  | ProseUnit
  | MeterBadgeUnit;

export interface ParsedSacredPadaContent {
  detectedRaga?: string;
  attribution?: string;
  translations?: string[];
  transliterations?: string[];
  units: DevotionalUnit[];
  hasVersePairs: boolean;
  hasStanzas: boolean;
}

/**
 * Checks if a Devanagari line ends with a terminal stanza punctuation:
 * Double Danda (॥ or \u0965), ASCII double pipe (||), or stanza number bracket/dandas (e.g. ॥ १ ॥, [1])
 */
function isStanzaTerminal(line: string): boolean {
  return (
    /([॥\u0965]|\|\||\[\d+\])\s*$/.test(line) ||
    /॥\s*[\d०-९]+\s*॥\s*$/.test(line) ||
    /।।\s*[\d०-९]+\s*।।\s*$/.test(line)
  );
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

  const cleanedLines: string[] = [];
  const extractedTranslations: string[] = [];
  const extractedTransliterations: string[] = [];

  const prefixRegex = /^(\*|\•|\-|\–|\—|\s)*(दो[०0\.]\s*[-—–]?|चौ[०0\.]\s*[-—–]?|सो[०0\.]\s*[-—–]?|छं[०0\.]\s*[-—–]?)\s*/;
  const meterHeaderRegex = /^(\*|\•|\-|\–|\—|\s)*(दोहा|चौपाई|सोरठा|छन्द|छंद|श्लोक|सवैया|कवित्त)\s*(\|[^\:]+)?\s*[:：\s]*$/i;
  const pureMeterBadgeRegex = /^॥\s*(दोहा|चौपाई|सोरठा|छन्द|छंद|श्लोक|सवैया|कवित्त)\s*॥$/;

  for (const raw of rawLines) {
    let line = sanitizeSacredText(raw || '').trim();
    if (!line) continue;

    // Discard empty bullet/dashes/scraper dividers like *, –*–*–, ***
    if (/^(\*|\-|\–|\—|\s)+$/.test(line)) continue;

    // Discard empty scraper tags like "भावार्थ:-", "भावार्थ :"
    if (/^भावार्थ\s*[:：\-—]*\s*$/.test(line)) continue;

    // Match meter header like "दोहा | Dohā :", "दोहा | DOHAS : :", "चौपाई | CHAUPAIS :", "दोहा :"
    const meterMatch = line.match(meterHeaderRegex);
    if (meterMatch) {
      cleanedLines.push(`॥ ${meterMatch[2]} ॥`);
      continue;
    }

    if (pureMeterBadgeRegex.test(line)) {
      cleanedLines.push(line);
      continue;
    }

    // Devanagari lines
    if (/[\u0900-\u097F]/.test(line)) {
      line = line.replace(prefixRegex, '').replace(/^[\*\•\-\–\—\s]+/, '').trim();
      if (line) cleanedLines.push(line);
      continue;
    }

    // Non-Devanagari lines (Transliteration or English)
    const isEnglishWords = /\b(the|and|of|to|is|in|that|with|for|was|as|he|she|they|their|his|her|my|our|you|your|be|by|on|at|from|this|these|those|May|O|lord|king|palace|lotus|feet|water|ocean|mind|eyes)\b/i.test(line);
    if (isEnglishWords || line.startsWith('“') || line.startsWith('"') || (/^[A-Z][a-z\s,;:]+/.test(line) && line.includes(' '))) {
      extractedTranslations.push(line);
    } else {
      extractedTransliterations.push(line);
    }
  }

  let lines = cleanedLines;
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

    // Remove any trailing dangling meter badges that have no subsequent content
  while (units.length > 0 && units[units.length - 1].type === 'meter_badge') {
    units.pop();
  }

  return { detectedRaga, attribution, units, hasVersePairs: true, hasStanzas: false };
  }

  // 5B. Handle Classical Poetry with Stanza Rhythm (छंद / दोहा / चरण विभाजन)
  const units: DevotionalUnit[] = [];
  let currentStanzaLines: string[] = [];
  let stanzaCounter = 1;
  let hasStanzas = false;

  for (let i = 0; i < expandedLines.length; i++) {
    const rawItem = expandedLines[i];
    const line = rawItem.replace(/^[\*\•\-\–\—\s]+/, '').trim();
    if (!line) continue;

    if (/^[-—–]\s*(.+)$/.test(line)) {
      if (!attribution) attribution = line.replace(/^[-—–]\s*/, '').trim();
      continue;
    }

    // 0. Meter badge line: e.g. "॥ दोहा ॥", "॥ चौपाई ॥", "॥ सोरठा ॥"
    const mb = line.match(/^॥\s*(दोहा|चौपाई|सोरठा|छन्द|छंद|श्लोक|सवैया|कवित्त)\s*॥$/);
    if (mb) {
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
        type: 'meter_badge',
        name: mb[1].trim(),
      });
      continue;
    }

    // 1. Heading line (e.g. "झूलन उत्सव संध्या दर्शन ||" or "आरती श्री युगल किशोर की")
    const cleanCandidate = line.replace(/^[\{\[\(\s]+/, '').replace(/[\}\]\)\s]+$/, '').trim();
    const isExplicitHeading =
      cleanCandidate.length <= 40 &&
      expandedLines.length > 1 &&
      (cleanCandidate.includes('दर्शन') ||
        cleanCandidate.includes('उत्सव') ||
        cleanCandidate.includes('मंगलाचरण') ||
        cleanCandidate.includes('आरती') ||
        cleanCandidate.includes('बधाई') ||
        /^राग\s+/.test(cleanCandidate));

    if (i === 0 && isExplicitHeading) {
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

  // Remove any trailing dangling meter badges that have no subsequent content
  while (units.length > 0 && units[units.length - 1].type === 'meter_badge') {
    units.pop();
  }

  return {
    detectedRaga,
    attribution,
    translations: extractedTranslations.length > 0 ? extractedTranslations : undefined,
    transliterations: extractedTransliterations.length > 0 ? extractedTransliterations : undefined,
    units,
    hasVersePairs: false,
    hasStanzas,
  };
}
