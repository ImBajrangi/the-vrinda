import React from 'react';
import { Flame, Music2, BookOpen, Wind, HelpCircle, Disc3 } from 'lucide-react';
import { SadhanaState, SacredPad } from '../../types/devotional';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';
import { formatDevanagariNumerals } from '../../services/cacheService';

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
  mantraCountFormatted: _mantraCountFormatted,
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
          <div className="text-xs font-laila font-semibold text-amber-800 tracking-wide flex items-center gap-2">
            <span>श्री धाम वृन्दावन नित्य साधना</span>
            <span className="text-neutral-300 font-normal">—</span>
            <span className="text-amber-900 font-medium">
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
      <div className="p-5 sm:p-6 rounded-[28px] bg-[#FAF8F3] border border-amber-200/70 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column (Cols 1-7): Tactile Japamala Chanting Medallion + Core Metrics */}
          <div className="lg:col-span-7 flex items-center gap-4 sm:gap-6">
            
            {/* Circular Touch Bead Medallion */}
            <button
              type="button"
              onClick={handleTapBead}
              aria-label="Count 1 bead on Tulsi Mala"
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border border-amber-300/80 shadow-[0_8px_24px_rgba(217,119,6,0.12),inset_0_2px_4px_rgba(255,255,255,1)] flex flex-col items-center justify-center shrink-0 cursor-pointer select-none active:scale-95 transition-transform group"
            >
              {/* Concentric Inner Gold Ring */}
              <div className="absolute inset-[4px] rounded-full border border-amber-200/70 pointer-events-none" />

              <span className={`font-rozha text-2xl sm:text-3xl text-amber-900 leading-none transition-transform duration-150 ${counterTick ? 'scale-110' : ''}`}>
                राधे
              </span>
              <span className="font-laila text-[11px] font-semibold text-amber-800 mt-1 leading-none">
                मनका जप
              </span>
              <span className="font-laila text-[10px] text-amber-600/80 mt-0.5 leading-none">
                +१ मनका
              </span>
            </button>

            {/* Chanting Progress Metrics */}
            <div className="flex flex-col min-w-0 flex-1 justify-center space-y-1">
              
              <div className="text-xs font-laila font-semibold text-amber-800 tracking-wide">
                पवित्र तुलसी माला साधना
              </div>

              {/* Prominent Devanagari Numeral Display */}
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className={`font-rozha text-3xl sm:text-4xl lg:text-[42px] text-[#18181B] leading-none tracking-tight ${counterTick ? 'animate-number-tick' : ''}`}>
                  {mantraCountDevanagari}
                </span>
                <span className="text-xs sm:text-sm font-laila font-semibold text-neutral-500">
                  मंत्र जप
                </span>
              </div>

              {/* Secondary Status: Clean & Direct */}
              <div className="flex items-center gap-x-2 gap-y-0.5 pt-1 font-laila text-xs text-neutral-800 flex-wrap">
                <span className="font-bold text-neutral-900 whitespace-nowrap">
                  {malasDevanagari} / {malasTargetDevanagari} माला पूर्ण
                </span>
                <span className="text-neutral-300 font-normal hidden sm:inline">—</span>
                <span className="font-semibold text-amber-800 whitespace-nowrap">
                  मनका {formatDevanagariNumerals(beadInCurrentMala)} / १०८
                </span>
              </div>

            </div>

          </div>

          {/* Right Column (Cols 8-12): Tulsi Beads Strand & Direct Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3 pt-4 lg:pt-0 border-t border-amber-200/40 lg:border-t-0 lg:border-l lg:border-amber-200/60 lg:pl-6">
            
            {/* Strand Header: Clean Devanagari */}
            <div className="flex items-center justify-between text-xs font-laila">
              <span className="font-semibold text-neutral-700">
                १०८ मनकों की पावन माला
              </span>
              <span className="font-bold text-amber-800">
                {formatDevanagariNumerals(Math.round((beadInCurrentMala / 108) * 100))}% माला पूर्ण
              </span>
            </div>

            {/* Tulsi Beads Strand (27 beads representing the 108 cycle) */}
            <div className="flex items-center justify-between gap-0.5 sm:gap-1 p-2 sm:p-2.5 bg-white rounded-full border border-amber-200/60 shadow-2xs overflow-hidden">
              {/* Meru Bead Indicator (सुमेरु) */}
              <div
                title="सुमेरु मनका (Meru Bead)"
                className="w-3.5 h-3.5 rounded-full meru-bead border border-amber-500 shrink-0 aspect-square flex items-center justify-center text-[8px] text-white font-bold"
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
                    className={`rounded-full shrink-0 aspect-square transition-all duration-200 ${
                      isActive
                        ? 'w-2.5 h-2.5 tulsi-bead-active ring-2 ring-amber-300'
                        : isChanted
                        ? 'w-2 h-2 tulsi-bead-chanted'
                        : 'w-1.5 h-1.5 sm:w-2 sm:h-2 tulsi-bead-pending'
                    }`}
                  />
                );
              })}
            </div>

            {/* Quick Increment Controls */}
            <div className="flex items-center gap-2 pt-1 font-laila">
              <button
                type="button"
                onClick={handleTapBead}
                className="flex-1 py-2 px-3 rounded-full bg-white hover:bg-[#FEFCE8] text-[#18181B] border border-amber-200/70 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer active:scale-95"
              >
                <Disc3 className="w-3.5 h-3.5 text-amber-700" />
                <span>+१ मनका</span>
              </button>

              <button
                type="button"
                onClick={incrementJapa}
                className="py-2 px-4 rounded-full bg-amber-100 hover:bg-amber-200/80 text-amber-950 border border-amber-300/80 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>+१ पूरी माला</span>
                <span className="text-[10px] text-amber-800 font-mono font-bold">(१०८)</span>
              </button>
            </div>

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
          className="group p-4 rounded-[24px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Japa Meditation Art */}
          <ArtworkGraphicSlot
            src={null}
            aspectRatio="card"
            theme="amber"
            placeholderLabel="नाम जप ध्यान चित्र"
            placeholderCategory="general"
            roundedClassName="rounded-[8px]"
          />

          <div>
            <div className="mb-1">
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 font-laila">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                १. युगल नाम जप
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {formatDevanagariNumerals(sadhana.japaCompleted)} / {formatDevanagariNumerals(sadhana.japaTarget)} माला
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 font-laila">
              श्री राधा-माधव युगल नाम का पावन अखंड जप।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-laila">
            <span className="text-xs text-neutral-500">१०८ मनके / माला</span>
            <div className="company-link group-company-link font-semibold text-xs text-amber-700 group-hover:text-amber-900 transition-colors">
              <span>विवरण देखें</span>
              <span className="text-sm leading-none">→</span>
            </div>
          </div>
        </div>

        {/* Offering 2: Pad Shravan */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('shravan')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('shravan')}
          className="group p-4 rounded-[24px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Pad Shravan & Raga Art */}
          <ArtworkGraphicSlot
            src={null}
            aspectRatio="card"
            theme="amber"
            placeholderLabel="वाणी श्रवण कला"
            placeholderCategory="music"
            roundedClassName="rounded-[8px]"
          />

          <div>
            <div className="mb-1">
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 font-laila">
                <Music2 className="w-3.5 h-3.5 text-amber-700" />
                २. रसिक वाणी श्रवण
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {formatDevanagariNumerals(sadhana.shravanMinutes)} / {formatDevanagariNumerals(sadhana.shravanTarget)} मिनट
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 font-laila">
              राग विभास, सारंग एवं बिलावल के दिव्य निकुंज पद।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-laila">
            <span className="text-xs text-neutral-500">शास्त्रीय कीर्तन</span>
            <div className="company-link group-company-link font-semibold text-xs text-indigo-600 group-hover:text-indigo-800 transition-colors">
              <span>श्रवण करें</span>
              <span className="text-sm leading-none">→</span>
            </div>
          </div>
        </div>

        {/* Offering 3: Grantha Svadhyaya */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('svadhyaya')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('svadhyaya')}
          className="group p-4 rounded-[24px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Grantha Scripture Manuscript Art */}
          <ArtworkGraphicSlot
            src={null}
            aspectRatio="card"
            theme="orange"
            placeholderLabel="ग्रंथ स्वाध्याय आवरण"
            placeholderCategory="book"
            roundedClassName="rounded-[8px]"
          />

          <div>
            <div className="mb-1">
              <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 font-laila">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                ३. ग्रंथ स्वाध्याय
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {formatDevanagariNumerals(sadhana.svadhyayaPadas)} / {formatDevanagariNumerals(sadhana.svadhyayaTarget)} पद
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 font-laila">
              श्री हित चौरासी, केलिमाल एवं राधा सुधानिधि चिंतन।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-laila">
            <span className="text-xs text-neutral-500">रस उपासना</span>
            <div className="company-link group-company-link font-semibold text-xs text-amber-700 group-hover:text-amber-900 transition-colors">
              <span>स्वाध्याय करें</span>
              <span className="text-sm leading-none">→</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};