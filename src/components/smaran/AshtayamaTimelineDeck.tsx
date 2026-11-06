import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { computeAshtayamaPhase } from '../../services/cacheService';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';

interface AshtayamaPeriod {
  id: string;
  nameDevanagari: string;
  nameEnglish: string;
  timeRange: string;
  raga: string;
  bhava: string;
  description: string;
}

const ASHTAYAMA_PERIODS: AshtayamaPeriod[] = [
  {
    id: 'mangala',
    nameDevanagari: 'Mangala (Dawn)',
    nameEnglish: 'Mangala',
    timeRange: '03:30 - 06:00 AM',
    raga: 'Raga Vibhas / Lalit',
    bhava: 'Morning Awakening (Jagaran)',
    description: 'Dawn awakening of the Divine Couple, morning mangala aarti, and melodious flute vibrations echoing across the groves.',
  },
  {
    id: 'shringar',
    nameDevanagari: 'Shringar (Adornment)',
    nameEnglish: 'Shringar',
    timeRange: '06:00 - 08:30 AM',
    raga: 'Raga Bilawal / Bhairav',
    bhava: 'Devotional Adornment (Sakhi Shringar)',
    description: 'The sakhis lovingly adorn Shri Radha-Krishna with fine silk garments, fragrant sandalwood paste, and fresh jasmine garlands.',
  },
  {
    id: 'gwal',
    nameDevanagari: 'Gwal (Pastoral)',
    nameEnglish: 'Gwal',
    timeRange: '08:30 - 10:30 AM',
    raga: 'Raga Asavari / Todi',
    bhava: 'Friendly Leela (Sakhya Bhava)',
    description: 'Krishna gathers cows and comrades for pasturing in the green meadows of Braj with sweet flute melodies.',
  },
  {
    id: 'rajbhog',
    nameDevanagari: 'Rajbhog (Midday Feast)',
    nameEnglish: 'Rajbhog',
    timeRange: '10:30 AM - 03:30 PM',
    raga: 'Raga Sarang / Multani',
    bhava: 'Opulent Seva & Midday Rest',
    description: 'Sumptuous offering of 56 delicacies prepared by Shri Radha Maharani, followed by soothing afternoon rest and kirtan.',
  },
  {
    id: 'utthan',
    nameDevanagari: 'Utthapan (Awakening)',
    nameEnglish: 'Utthapan',
    timeRange: '03:30 - 05:00 PM',
    raga: 'Raga Gauri / Poorvi',
    bhava: 'Afternoon Awakening',
    description: 'Gentle waking of the deities with cooling drinks, sweet seasonal fruits, and soft musical chanting.',
  },
  {
    id: 'bhog',
    nameDevanagari: 'Sandhya Bhog (Sunset Offering)',
    nameEnglish: 'Sandhya Bhog',
    timeRange: '05:00 - 06:30 PM',
    raga: 'Raga Kalyan / Bhupali',
    bhava: 'Evening Gathering (Gaudhuli)',
    description: 'Cows return home under the twilight sky while evening snacks and warm milk are loving offered.',
  },
  {
    id: 'sandhya',
    nameDevanagari: 'Sandhya Aarti (Twilight Lamp)',
    nameEnglish: 'Sandhya Aarti',
    timeRange: '06:30 - 08:30 PM',
    raga: 'Raga Yaman / Kedar',
    bhava: 'Evening Worship (Deep Aarti)',
    description: 'Solemn evening aarti with hundred-wick camphor lamps, sacred conch resonance, and ecstatic kirtan by rasik devotees.',
  },
  {
    id: 'shayana',
    nameDevanagari: 'Shayana (Night Repose)',
    nameEnglish: 'Shayana',
    timeRange: '08:30 PM - 03:30 AM',
    raga: 'Raga Bihag / Kanhara',
    bhava: 'Eternal Ras (Nitya Ras)',
    description: 'The intimate moonlit ras-lila in the sacred groves of Seva Kunj and Nidhiban, followed by the peaceful rest of the Divine Couple.',
  },
];

export const AshtayamaTimelineDeck: React.FC = () => {
  const currentActive = computeAshtayamaPhase();
  const defaultPeriod =
    ASHTAYAMA_PERIODS.find((p) => p.nameDevanagari.includes(currentActive.nameDevanagari) || currentActive.nameDevanagari.includes(p.nameDevanagari)) ||
    ASHTAYAMA_PERIODS[3];

  const [selectedPeriod, setSelectedPeriod] = useState<AshtayamaPeriod>(defaultPeriod);

  return (
    <div className="w-full bg-white rounded-[32px] p-6 sm:p-7 border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
      {/* Header Bar matching pure porcelain aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0" />
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              Ashtayama 8-Watch Timeline
            </h3>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-mono">
              नित्य अष्टयाम लीला
            </span>
          </div>
          <p className="text-xs text-[#71717A] font-normal mt-1">
            24-hour contemplative cycle of Priya-Priyatam’s divine pastimes and aligned classical ragas.
          </p>
        </div>

        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-mono self-start sm:self-auto">
          • {currentActive.nameEnglish} (Active Now)
        </span>
      </div>

      {/* 8-Pahar Horizontal Interactive Pill Strip */}
      <div className="w-full flex items-center gap-1.5 p-1.5 bg-[#F4F4F5]/70 rounded-[22px] border border-neutral-200/60 overflow-x-auto no-scrollbar">
        {ASHTAYAMA_PERIODS.map((period) => {
          const isSelected = selectedPeriod.id === period.id;
          const isCurrentTime =
            period.nameEnglish.toLowerCase() === currentActive.nameEnglish.toLowerCase() ||
            period.nameDevanagari.includes(currentActive.nameDevanagari) ||
            currentActive.nameDevanagari.includes(period.nameDevanagari);

          return (
            <button
              key={period.id}
              type="button"
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-2 rounded-[16px] text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer select-none ${
                isSelected
                  ? 'bg-white text-[#18181B] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80'
                  : 'bg-transparent text-[#71717A] hover:text-[#18181B] hover:bg-white/60 border border-transparent'
              }`}
            >
              {isCurrentTime && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              <span>{period.nameDevanagari}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Watch Formatted as a Graphics-Friendly Editorial Card */}
      <div className="w-full bg-white rounded-[24px] p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
        {/* Dedicated Ashtayama Leela Graphic Slot - Empty by default, ready for painting */}
        <ArtworkGraphicSlot
          src={null}
          aspectRatio="card"
          theme="amber"
          placeholderLabel={`${selectedPeriod.nameEnglish} Leela Artwork • 16:9 Slot`}
          placeholderCategory="dham"
          badge={`${selectedPeriod.bhava} • ${selectedPeriod.timeRange}`}
          roundedClassName="rounded-[18px]"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider font-mono">
                {selectedPeriod.bhava} • {selectedPeriod.timeRange}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-800 bg-amber-50">
                Nikunja Bhava
              </span>
            </div>

            <h4 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              {selectedPeriod.nameEnglish} Watch ({selectedPeriod.nameDevanagari})
            </h4>

            <p className="text-xs sm:text-[13px] text-[#71717A] leading-relaxed font-normal">
              {selectedPeriod.description}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
            <span className="text-[10px] text-[#71717A] uppercase font-mono font-medium">
              Classical Raga
            </span>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#7C3AED] font-mono">
              <Music className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{selectedPeriod.raga}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
