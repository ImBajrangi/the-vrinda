import { sanitizeSacredText } from '../services/sacredDatabase';

export interface VerseMeaningUnit {
  type: 'verse_pair';
  verse: string;
  meaning?: string;
}

export interface SectionHeaderUnit {
  type: 'section_header';
  title: string;
  content?: string;
}

export interface ProseUnit {
  type: 'prose';
  text: string;
}

export type DevotionalUnit = VerseMeaningUnit | SectionHeaderUnit | ProseUnit;

export interface ParsedSacredPadaContent {
  detectedRaga?: string;
  attribution?: string;
  units: DevotionalUnit[];
  hasVersePairs: boolean;
}

/**
 * Intelligently decomposes raw Devanagari text into inherently distributed devotional units.
 * Separates sacred poetic verses from inherent line-by-line Hindi meaning, extracts
 * raga tags & attribution signatures, and deduplicates trailing raw scrape dumps.
 */
export function parseDevotionalContent(rawLines: string[]): ParsedSacredPadaContent {
  if (!rawLines || rawLines.length === 0) {
    return { units: [], hasVersePairs: false };
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

  // 5. Build structured units
  const units: DevotionalUnit[] = [];
  let hasVersePairs = false;

  for (let i = 0; i < expandedLines.length; i++) {
    const line = expandedLines[i];

    // Check for inline attribution
    if (/^[-—–]\s*(.+)$/.test(line)) {
      if (!attribution) attribution = line.replace(/^[-—–]\s*/, '').trim();
      continue;
    }

    // Check for section headers: e.g. "स्थान:", "दिव्य लीला:", "कथा प्रसंग:"
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

    // Check for quoted verse line
    const isQuoted = /^([“"][^”"]+[”"])$/.test(line);
    if (isQuoted) {
      hasVersePairs = true;
      const verseText = line.replace(/^[“"]|[”"]$/g, '').trim();
      let meaningText: string | undefined = undefined;

      // Look ahead for translation in next line
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

  return { detectedRaga, attribution, units, hasVersePairs };
}
