import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';

export interface NityaSevaCardProps {
  templeName: string;
  sevaTitle: string;
  time: string;
  sevaDetails?: string[];
  statusLabel?: string;
  statusType?: 'active' | 'upcoming' | 'completed';
  countdownLabel?: string;
  imageUrl?: string;
  onOpen?: () => void;
  isHero?: boolean;
  indexNumber?: string;
  seamless?: boolean;
}

/**
 * NityaSevaCard — Inspired by Company Showcase Layout Perfection
 * 
 * Features:
 * 1. Zero Unnecessary Dots/Outlines: No bullet dots, no green indicator dots, no border-t lines, no button outlines.
 * 2. 0 Gap Unified Mosaic: Inner gaps removed, master container gives soft outer corners.
 * 3. Ghost Numbers: 01, 02, 03, 04 in crisp font-mono.
 * 4. Concentric Geometry: R_inner = R_outer - padding.
 * 5. Zero translateY or scale on hover.
 */
export const NityaSevaCard: React.FC<NityaSevaCardProps> = ({
  templeName,
  sevaTitle,
  time,
  countdownLabel,
  imageUrl,
  onOpen,
  isHero = false,
  indexNumber,
  seamless = false,
}) => {
  const isBihari = templeName.toLowerCase().includes('bihari') || templeName.includes('बिहारी');
  const isVallabh = templeName.toLowerCase().includes('vallabh') || templeName.includes('वल्लभ');
  const isRaman = templeName.toLowerCase().includes('raman') || templeName.includes('रमण');
  const isBarsana = templeName.toLowerCase().includes('barsana') || templeName.includes('बरसाना');

  // Devanagari temple branding & timings
  let devanagariTemple = 'श्री वृन्दावन धाम मंदिर';
  let devanagariSeva = sevaTitle;
  let praharLabel = 'नित्य अष्टयाम';
  let defaultImage = '/assets/temples/banke-bihari-v2.jpg';
  let defaultNum = '01';

  if (isBihari) {
    devanagariTemple = 'श्री बाँके बिहारी मंदिर';
    devanagariSeva = 'मंगला दर्शन आरती';
    praharLabel = 'प्रातः अष्टयाम';
    defaultImage = '/assets/temples/banke-bihari-v2.jpg';
    defaultNum = '01';
  } else if (isVallabh) {
    devanagariTemple = 'श्री राधा वल्लभ लाल';
    devanagariSeva = 'राजभोग दर्शन एवं महाप्रसाद';
    praharLabel = 'मध्याह्न अष्टयाम';
    defaultImage = '/assets/temples/radha-vallabh.jpg';
    defaultNum = '02';
  } else if (isRaman) {
    devanagariTemple = 'श्री राधा रमण जू';
    devanagariSeva = 'संध्या आरती व दिव्य शृंगार';
    praharLabel = 'सायं संध्या';
    defaultImage = '/assets/temples/radha-raman.jpg';
    defaultNum = '03';
  } else if (isBarsana) {
    devanagariTemple = 'बरसाना श्री लाड़िली लाल जी';
    devanagariSeva = 'शयन दर्शन व चंवर सेवा';
    praharLabel = 'शयन अष्टयाम';
    defaultImage = '/assets/temples/barsana-radharani.jpg';
    defaultNum = '04';
  }

  const activeImage = imageUrl || defaultImage;
  const displayNum = indexNumber || defaultNum;

  // 1. FEATURED SHOWCASE HERO (Company showcase-featured)
  if (isHero) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen && onOpen()}
        className={`group relative w-full overflow-hidden cursor-pointer select-none transition-colors duration-200 min-h-[320px] sm:min-h-[360px] flex flex-col justify-end p-6 sm:p-8 bg-neutral-950 ${
          seamless
            ? ''
            : 'rounded-[24px] shadow-md'
        }`}
      >
        {/* Full-bleed Authentic Background Photo */}
        <img
          src={activeImage}
          alt={templeName}
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          loading="lazy"
        />
        {/* Cinematic Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

        {/* Ghost Number in Top-Right */}
        <span className="absolute top-5 right-7 text-6xl sm:text-7xl font-mono font-black text-white/20 select-none pointer-events-none leading-none">
          {displayNum}
        </span>

        {/* Bottom Content Area (No dots, no outlines, Laila & Rozha Hindi Typography) */}
        <div className="relative z-10 max-w-2xl">
          <div className="text-xs sm:text-sm font-laila font-semibold text-amber-300 tracking-wider mb-1 truncate">
            {praharLabel} &nbsp; {devanagariTemple}
          </div>

          <h3 className="text-2xl sm:text-3xl font-rozha text-white tracking-wide leading-tight">
            {devanagariSeva}
            <span className="text-sm sm:text-base font-normal text-white/70 ml-2 font-sans">
              ({sevaTitle})
            </span>
          </h3>

          {/* Gateway Action Bar (No border-t outline, no green dot, no badge outline) */}
          <div className="flex items-center justify-between pt-3 mt-3 gap-3">
            <div className="flex items-center gap-2 text-white font-mono text-xs sm:text-sm font-bold">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{time}</span>
              {countdownLabel && (
                <span className="text-xs font-normal text-emerald-300 font-mono ml-2 hidden sm:inline">
                  {countdownLabel}
                </span>
              )}
            </div>

            <div className="px-5 py-2 rounded-full bg-[#FEF08A] hover:bg-[#FACC15] text-[#78350F] text-xs sm:text-sm font-laila font-bold transition-colors flex items-center gap-1.5 shadow-sm shrink-0">
              <span>दर्शन प्रवेश</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#78350F]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPACT SHOWCASE CARD (Company showcase-card)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen && onOpen()}
      className={`group relative w-full overflow-hidden cursor-pointer select-none transition-colors duration-200 min-h-[220px] sm:min-h-[240px] flex flex-col justify-end p-5 sm:p-6 bg-neutral-950 ${
        seamless
          ? ''
          : 'rounded-[22px] shadow-sm'
      }`}
    >
      {/* Background Photo */}
      <img
        src={activeImage}
        alt={templeName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Scrim Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

      {/* Ghost Number in Top-Right */}
      <span className="absolute top-4 right-5 text-5xl font-mono font-black text-white/20 select-none pointer-events-none leading-none">
        {displayNum}
      </span>

      {/* Bottom Content (No dots, no outlines, Laila & Rozha Hindi Typography) */}
      <div className="relative z-10">
        <div className="text-[11px] sm:text-xs font-laila font-semibold text-amber-300 tracking-wider mb-0.5 truncate">
          {praharLabel} &nbsp; {devanagariTemple}
        </div>

        <h4 className="text-lg sm:text-xl font-rozha text-white tracking-wide leading-snug line-clamp-1">
          {devanagariSeva}
        </h4>

        {/* Bottom Bar: Timing & Clean CTA with NO outline */}
        <div className="flex items-center justify-between pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 gap-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white/90 whitespace-nowrap">
            {time}
          </span>

          <div className="company-link group-company-link text-amber-300 group-hover:text-white transition-colors text-xs sm:text-sm font-laila font-bold shrink-0">
            <span>दर्शन</span>
            <span className="text-base leading-none">→</span>
          </div>
        </div>
      </div>
    </div>
  );
};
