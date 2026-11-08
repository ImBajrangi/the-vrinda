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
  currentStreakDays = 1,
}) => {
  // 27 visual segments representing the 108-bead Tulsi mala (each bead marker = 4 mantras)
  const totalMalaMarkers = 27;
  const activeMarkerIndex = Math.floor((beadInCurrentMala / 108) * totalMalaMarkers);

  // Precompute 27 radial bead positions around the circular rosary ring
  // Slot 0 is the golden Meru bead at the 12 o'clock apex (-90 degrees)
  const beadPositions = React.useMemo(() => {
    const radiusPercent = 41.5;
    return Array.from({ length: totalMalaMarkers }).map((_, idx) => {
      const slot = idx + 1; // slots 1 to 27 clockwise
      const angle = -Math.PI / 2 + (slot / 28) * 2 * Math.PI;
      const x = 50 + radiusPercent * Math.cos(angle);
      const y = 50 + radiusPercent * Math.sin(angle);
      return { x, y };
    });
  }, [totalMalaMarkers]);

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

      {/* 2. Artisanal Tulsi Japamala Sanctuary (Concept A: Circular Rosary Ring) */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FAF8F3] border border-amber-200/80 shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_12px_36px_rgba(217,119,6,0.04)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Center: The Circular Chanting Rosary Ring */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
              
              {/* Circular Thread Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="41.5" fill="none" stroke="#E6DCCA" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
              </svg>

              {/* Apex Golden Meru Bead (सुमेरु - 12 o'clock) */}
              <div 
                title="सुमेरु मनका (Meru Bead)"
                className="absolute w-5 h-5 rounded-full meru-bead border border-amber-400 flex items-center justify-center text-[9px] text-white font-bold z-20 aspect-square shadow-sm"
                style={{ top: '8.5%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                ✦
              </div>

              {/* 27 Radial Beads distributed around the circle */}
              {beadPositions.map((pos, idx) => {
                const isChanted = idx < activeMarkerIndex;
                const isActive = idx === activeMarkerIndex && beadInCurrentMala > 0;

                return (
                  <div
                    key={idx}
                    title={`मनका खंड ${(idx + 1) * 4} / १०८`}
                    className={`absolute rounded-full aspect-square shrink-0 transition-all duration-200 z-10 ${
                      isActive
                        ? 'w-3.5 h-3.5 tulsi-bead-active ring-2 ring-amber-300'
                        : isChanted
                        ? 'w-2.5 h-2.5 sm:w-3 sm:h-3 tulsi-bead-chanted'
                        : 'w-2 h-2 sm:w-2.5 sm:h-2.5 tulsi-bead-pending'
                    }`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                );
              })}

              {/* Central "राधे" Touch Gem Medallion */}
              <button 
                type="button" 
                onClick={handleTapBead}
                aria-label="Count 1 bead on Tulsi Mala"
                className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-white via-[#FCFAF5] to-[#F5EEDB] border border-amber-300/90 shadow-[0_12px_32px_rgba(217,119,6,0.14),inset_0_2px_4px_rgba(255,255,255,1)] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all group z-20"
              >
                {/* Inner Concentric Rim */}
                <div className="absolute inset-2 rounded-full border border-amber-200/60 pointer-events-none" />

                <span className="text-[10px] font-laila font-semibold uppercase tracking-wider text-amber-800/80 mb-1 leading-none">
                  नित्य युगल स्मरण
                </span>
                <span className={`font-rozha text-3xl sm:text-4xl text-amber-900 leading-none transition-transform duration-150 ${counterTick ? 'scale-110' : ''}`}>
                  राधे
                </span>
                <div className="mt-1.5 flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-laila text-[11px] font-bold text-amber-900">
                    +१ मनका जप
                  </span>
                </div>
              </button>
            </div>

            <div className="text-[11px] font-laila text-neutral-500 mt-2 text-center">
              केंद्र पर स्पर्श करें अथवा नीचे दिए बटनों का प्रयोग करें
            </div>
          </div>

          {/* Right Column: Modern Minimal Status & Chanting Metrics */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 pt-4 lg:pt-0 border-t border-amber-200/50 lg:border-t-0 lg:border-l lg:border-amber-200/60 lg:pl-8">
            
            {/* Category Header & Majestic Hero Counter */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-laila font-bold text-amber-800">
                  पवित्र तुलसी माला साधना
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs font-laila text-amber-900/80 font-semibold bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                  १०८ मनका चक्र
                </span>
              </div>
              
              <div className="flex items-baseline gap-3 pt-1">
                <span className={`font-rozha text-4xl sm:text-5xl text-[#18181B] leading-none ${counterTick ? 'animate-number-tick' : ''}`}>
                  {mantraCountDevanagari}
                </span>
                <div className="flex flex-col">
                  <span className="font-laila text-sm font-bold text-amber-900">
                    मंत्र जप पूर्ण
                  </span>
                  <span className="text-[11px] font-laila text-neutral-400">
                    आज का पावन संकल्प
                  </span>
                </div>
              </div>
            </div>

            {/* Modern Grid of 2 Metric Cards */}
            <div className="grid grid-cols-2 gap-3 font-laila">
              {/* Card 1: Mala Progress */}
              <div className="p-3.5 rounded-[18px] bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] text-neutral-500 font-medium block">
                  माला संकल्प सिद्धि
                </span>
                <div className="text-base sm:text-lg font-bold text-neutral-900 mt-0.5">
                  {malasDevanagari} / {malasTargetDevanagari} <span className="text-xs font-normal text-amber-800">माला</span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((sadhana.japaCompleted / Math.max(1, sadhana.japaTarget)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Current Bead Track */}
              <div className="p-3.5 rounded-[18px] bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] text-neutral-500 font-medium block">
                  वर्तमान माला स्थिति
                </span>
                <div className="text-base sm:text-lg font-bold text-neutral-900 mt-0.5">
                  मनका {formatDevanagariNumerals(beadInCurrentMala)} <span className="text-xs font-normal text-neutral-500">/ १०८</span>
                </div>
                <div className="text-[11px] text-amber-800 font-semibold mt-1">
                  {formatDevanagariNumerals(Math.round((beadInCurrentMala / 108) * 100))}% माला पूर्ण
                </div>
              </div>
            </div>

            {/* Bottom Action Controls */}
            <div className="flex items-center gap-3 pt-1 font-laila">
              <button
                type="button"
                onClick={handleTapBead}
                className="flex-1 py-3 px-4 rounded-full bg-white hover:bg-[#FEFCE8] text-[#18181B] border border-amber-300/80 shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer active:scale-95 transition-all"
              >
                <Disc3 className="w-4 h-4 text-amber-700" />
                <span>+१ मनका जप</span>
              </button>

              <button
                type="button"
                onClick={incrementJapa}
                className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-amber-100 to-amber-200/90 hover:from-amber-200 hover:to-amber-300/80 text-amber-950 border border-amber-300/90 shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer active:scale-95 transition-all"
              >
                <span>+१ पूरी माला</span>
                <span className="text-[11px] font-mono font-bold text-amber-900 bg-white/70 px-2 py-0.5 rounded-full">(१०८)</span>
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