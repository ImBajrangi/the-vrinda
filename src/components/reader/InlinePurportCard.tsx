import React, { useState, useEffect } from 'react';
import { IOSSpinner } from '../common/IOSActivityIndicator';
import {
  getCachedDevotionalSummarySync,
  getDevotionalSummary,
  DevotionalSummaryRequest,
} from '../../services/devotionalSummaryService';
import { Sparkles } from 'lucide-react';
import { SacredPad } from '../../types/devotional';
import { sanitizeSacredText } from '../../services/sacredDatabase';

interface InlinePurportCardProps {
  pad: SacredPad;
  isOpen: boolean;
}

export const InlinePurportCard: React.FC<InlinePurportCardProps> = ({ pad, isOpen }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const req: DevotionalSummaryRequest = {
    id: pad.id,
    text:
      pad.verses?.map((v) => v.linesDevanagari?.join(' ')).filter(Boolean).join('\n') ||
      pad.titleDevanagari,
    source: pad.collectionId || pad.rag,
    author: pad.author,
    type: 'pad',
    fallbackText:
      'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।',
    collectionId: pad.collectionId,
    padId: pad.id,
    stanzaNumber: 1,
  };

  useEffect(() => {
    if (!isOpen) return;
    const peek = getCachedDevotionalSummarySync(req);
    if (peek) {
      setSummary(peek);
      setLoading(false);
    } else {
      setLoading(true);
      getDevotionalSummary(req)
        .then((res) => setSummary(res.summary))
        .catch(() => setSummary(req.fallbackText || ''))
        .finally(() => setLoading(false));
    }
  }, [isOpen, pad.id]);

  if (!isOpen) return null;

  return (
    <div className="mt-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-neutral-800 transition-all duration-300">
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase font-mono tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
        <span>भावार्थ एवं चिंतन (Purport)</span>
      </div>
      {loading ? (
        <div className="py-3 flex items-center justify-center gap-2 text-xs text-amber-800">
          <IOSSpinner size="xs" theme="amber" />
          <span>भावार्थ संकलित हो रहा है...</span>
        </div>
      ) : (
        <p className="text-sm sm:text-base leading-relaxed text-neutral-800 font-devanagari">
          {sanitizeSacredText(summary || req.fallbackText || '')}
        </p>
      )}
    </div>
  );
};

