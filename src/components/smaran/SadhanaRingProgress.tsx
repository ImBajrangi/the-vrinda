import React from 'react';
import { Flame, Music2, BookOpen, Wind, HelpCircle, Disc3 } from 'lucide-react';
import { SadhanaState, SacredPad } from '../../types/devotional';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';

interface SadhanaRingProgressProps {
  sadhana: SadhanaState;
  mantraCountFormatted: string;
  mantraCountDevanagari: string;
  malasDevanagari: string;
  malasTargetDevanagari: string;
  beadInCurrentMala: number;
  counterTick: boolean;
  handleTapBead: () => void;
  incrementJapa: () => void;
  dhyanaStillnessScore?: number;
  isPlayingAudio: boolean;
  currentPad: SacredPad | null;
  onOpenPillar: (type: 'japa' | 'shravan' | 'svadhyaya') => void;
  onToggleAudio: () => void;
  onOpenReader: () => void;
  onOpenGuide: () => void;
  onOpenFocus: () => void;
  currentStreakDays?: number;
}

export const SadhanaRingProgress: React.FC<SadhanaRingProgressProps> = ({
  sadhana,
  mantraCountFormatted,
  mantraCountDevanagari,
  malasDevanagari,
  malasTargetDevanagari,
  beadInCurrentMala,
  counterTick,
  handleTapBead,
  incrementJapa,
  dhyanaStillnessScore: _dhyanaStillnessScore = 88,
  isPlayingAudio: _isPlayingAudio,
  currentPad: _currentPad,
  onOpenPillar,
  onToggleAudio: _onToggleAudio,
  onOpenReader: _onOpenReader,
  onOpenGuide,
  onOpenFocus,
  currentStreakDays = 7,
}) => {
  // 27 visual segments representing the 108-bead Tulsi mala (each bead marker = 4 mantras)
  const totalMalaMarkers = 27;
  const activeMarkerIndex = Math.floor((beadInCurrentMala / 108) * totalMalaMarkers);

  return (
    <div className="w-full bg-white rounded-[32px] p-6 sm:p-8 space-y-6">
      {/* 1. Serene Sanctuary Header in Classical Editorial Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-neutral-400">
              श्री धाम वृन्दावन • नित्य साधना
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-800 bg-amber-50 font-mono">
              {currentStreakDays}-दिवसीय अखंड स्मरण
            </span>
          </div>
          <h2 className="font-serif font-bold text-2xl sm:text-[26px] text-[#18181B] leading-tight">
            दैनिक युगल स्मरण एवं जप साधना
          </h2>
          <p className="text-xs sm:text-[13px] text-[#71717A] font-normal">
            "जोई जोई प्यारो करे सोई मोहि भावै" • नाम जप, वाणी श्रवण एवं नित्य ग्रंथ चिंतन का पावन संगम।
          </p>
        </div>

        {/* Quiet Editorial Action Gateways */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FAF6EE] hover:bg-[#FEFCE8] text-xs font-semibold text-[#18181B] transition-colors cursor-pointer"
            title="Sadhana Guide: Essential daily devotional practices"
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
            <span>विधि संग्रह</span>
          </button>

          <button
            type="button"
            onClick={onOpenFocus}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-bold transition-colors cursor-pointer"
            title="Open Dhyāna Sanctuary (ध्यान कक्ष)"
          >
            <Wind className="w-3.5 h-3.5 text-amber-700" />
            <span>ध्यान कक्ष</span>
          </button>
        </div>
      </div>

      {/* 2. Artisanal Tulsi Japamala Centerpiece (Replaces Generic Concentric Rings) */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-[#FAF9F5] flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Left: Tactile Japamala Chanting Medallion */}
        <div className="flex items-center gap-5 sm:gap-6 w-full lg:w-auto">
          {/* Circular Touch Bead Medallion */}
          <button
            type="button"
            onClick={handleTapBead}
            aria-label="Count 1 bead on Tulsi Mala"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-amber-300/80 shadow-[0_4px_20px_rgba(217,119,6,0.1)] flex flex-col items-center justify-center shrink-0 cursor-pointer select-none transition-all active:scale-95 group relative overflow-hidden"
          >
            {/* Subtle inner gold rim */}
            <div className="absolute inset-1 rounded-full border border-amber-200/50 pointer-events-none" />
            
            <span className={`font-serif font-bold text-2xl sm:text-3xl text-amber-800 leading-none transition-transform duration-150 ${counterTick ? 'scale-110' : ''}`}>
              राधे
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 font-mono mt-1">
              मनका जप
            </span>
            <span className="text-[9px] text-[#A1A1AA] font-mono">
              +1 Bead
            </span>
          </button>

          {/* Majestic Chanting Numbers & Status */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
                तुलसी माला जप • 108 Beads Japa
              </span>
            </div>

            {/* Prominent Devanagari Numeral Display */}
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className={`font-serif font-bold text-3xl sm:text-4xl lg:text-[42px] text-[#18181B] leading-none tracking-tight ${counterTick ? 'animate-number-tick' : ''}`}>
                {mantraCountDevanagari}
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#71717A]">
                मंत्र उच्चारित ({mantraCountFormatted})
              </span>
            </div>

            {/* Mala count & bead status */}
            <div className="flex items-center gap-2 text-xs text-[#52525B] mt-1.5 font-medium flex-wrap">
              <span className="text-[#18181B] font-bold">
                {malasDevanagari} of {malasTargetDevanagari} माला पूर्ण
              </span>
              <span className="text-amber-800 font-mono font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full">
                मनका {beadInCurrentMala} / 108
              </span>
            </div>
          </div>
        </div>

        {/* Right: The 108-Bead Physical Mala Track & Action */}
        <div className="w-full lg:w-96 flex flex-col justify-between space-y-3 pt-2 lg:pt-0 lg:border-l lg:border-neutral-200/70 lg:pl-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">
              १०८ मनकों की पावन माला
            </span>
            <span className="text-xs font-bold text-amber-700 font-mono">
              {Math.round((beadInCurrentMala / 108) * 100)}% Mala Track
            </span>
          </div>

          {/* Authentic Physical Tulsi Beads Strand (27 beads representing the 108 cycle) */}
          <div className="flex items-center justify-between gap-1 p-2 bg-white rounded-2xl border border-neutral-200/60 shadow-2xs">
            {/* Meru Bead Indicator (सुमेरु) */}
            <div
              title="सुमेरु मनका (Meru Bead)"
              className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-600 shrink-0 shadow-2xs flex items-center justify-center text-[7px] text-white font-bold"
            >
              ✦
            </div>

            {/* The 27 beaded pearl markers */}
            {Array.from({ length: totalMalaMarkers }).map((_, idx) => {
              const isChanted = idx < activeMarkerIndex;
              const isActive = idx === activeMarkerIndex;

              return (
                <div
                  key={idx}
                  title={`Bead segment ${(idx + 1) * 4} / 108`}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    isChanted
                      ? 'bg-amber-400 border border-amber-500'
                      : isActive
                      ? 'bg-amber-600 ring-2 ring-amber-300 scale-125'
                      : 'bg-neutral-200/80 border border-neutral-300/50'
                  }`}
                />
              );
            })}
          </div>

          {/* Quick Increment Controls */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTapBead}
              className="flex-1 py-2 px-3 rounded-full bg-white hover:bg-[#FEFCE8] text-[#18181B] flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
            >
              <Disc3 className="w-3.5 h-3.5 text-amber-700" />
              <span>+१ मनका</span>
            </button>

            <button
              type="button"
              onClick={incrementJapa}
              className="py-2 px-4 rounded-full bg-[#FACC15] hover:bg-[#FDE047] text-[#18181B] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+१ पूरी माला</span>
              <span className="text-[10px] text-amber-900 font-mono font-bold">(108)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. The Three Sacred Daily Offerings (त्रिविध नित्य सेवा समर्पण) - Graphics Friendly Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Offering 1: Naam Japa */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('japa')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('japa')}
          className="p-4 rounded-[22px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Japa Meditation Art */}
          <ArtworkGraphicSlot
            src={null}
            aspectRatio="card"
            theme="amber"
            placeholderLabel="नाम जप ध्यान चित्र"
            placeholderCategory="general"
            roundedClassName="rounded-[16px]"
          />

          <div>
            <div className="mb-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                १. युगल नाम जप
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {sadhana.japaCompleted} / {sadhana.japaTarget} माला
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5">
              श्री राधा-माधव युगल नाम का पावन अखंड जप।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#71717A] font-mono">१०८ मनके / माला</span>
            <span className="font-semibold text-xs text-amber-700 hover:underline">
              विवरण देखें →
            </span>
          </div>
        </div>

        {/* Offering 2: Pad Shravan */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('shravan')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('shravan')}
          className="p-4 rounded-[22px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Pad Shravan & Raga Art */}
          <ArtworkGraphicSlot
            src={null}
            aspectRatio="card"
            theme="amber"
            placeholderLabel="वाणी श्रवण कला"
            placeholderCategory="music"
            roundedClassName="rounded-[16px]"
          />

          <div>
            <div className="mb-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Music2 className="w-3.5 h-3.5 text-amber-700" />
                २. रसिक वाणी श्रवण
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {sadhana.shravanMinutes} / {sadhana.shravanTarget} मिनट
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5">
              राग विभास, सारंग एवं बिलावल के दिव्य निकुंज पद।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#71717A] font-mono">शास्त्रीय कीर्तन</span>
            <span className="font-semibold text-xs text-indigo-600 hover:underline">
              श्रवण करें →
            </span>
          </div>
        </div>

        {/* Offering 3: Grantha Svadhyaya */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('svadhyaya')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('svadhyaya')}
          className="p-4 rounded-[22px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Grantha Scripture Manuscript Art */}
          <ArtworkGraphicSlot
            src={null}
            aspectRatio="card"
            theme="orange"
            placeholderLabel="ग्रंथ स्वाध्याय आवरण"
            placeholderCategory="book"
            roundedClassName="rounded-[16px]"
          />

          <div>
            <div className="mb-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                ३. ग्रंथ स्वाध्याय
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {sadhana.svadhyayaPadas} / {sadhana.svadhyayaTarget} पद
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5">
              श्री हित चौरासी, केलिमाल एवं राधा सुधानिधि चिंतन।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#71717A] font-mono">रस उपासना</span>
            <span className="font-semibold text-xs text-amber-700 hover:underline">
              स्वाध्याय करें →
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};