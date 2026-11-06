import React, { useState } from 'react';

export type CategoryIconType = 'shriji' | 'bihari' | 'chaurasi' | 'kelimal' | 'ashtayama';

interface CategoryCircleProps {
  label: string;
  sublabel?: string;
  imageUrl?: string;
  iconType?: CategoryIconType;
  isActive?: boolean;
  onClick?: () => void;
}

export const CategoryCircle: React.FC<CategoryCircleProps> = ({
  label,
  sublabel,
  imageUrl,
  iconType = 'shriji',
  isActive = false,
  onClick,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const renderVectorIcon = () => {
    switch (iconType) {
      case 'shriji':
        // Shri Radha: Authentic Sacred Mukut Crown
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#FFF1E0] via-[#FDE3B8] to-[#FCD399] flex items-center justify-center p-2 rounded-full border border-[#D4A359]/30">
            <img
              src="/assets/icons/shriJiMukut.svg"
              alt="श्रीजी मुकुट"
              className="w-full h-full object-contain"
              onError={(e) => {
                // fallback to lotus if missing
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        );
      case 'bihari':
        // Thakur Banke Bihari: Peacock Feather & Flute
        return (
          <div className="w-full h-full bg-gradient-to-br from-purple-50 via-amber-50 to-amber-100 flex items-center justify-center p-2 rounded-full">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <circle cx="20" cy="20" r="18" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.2" />
              <ellipse cx="20" cy="18" rx="7" ry="10" fill="#18181B" />
              <ellipse cx="20" cy="18" rx="4.5" ry="6.5" fill="#7C3AED" />
              <ellipse cx="20" cy="18.5" rx="2.5" ry="3.5" fill="#3B82F6" />
              <circle cx="20" cy="19" r="1.3" fill="#F59E0B" />
              <line x1="10" y1="29" x2="30" y2="25" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="27.8" r="0.7" fill="#FEF3C7" />
              <circle cx="20" cy="27" r="0.7" fill="#FEF3C7" />
              <circle cx="24" cy="26.2" r="0.7" fill="#FEF3C7" />
            </svg>
          </div>
        );
      case 'chaurasi':
        // Hit Chaurasi: Sacred Rasik Pustak
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#F5E8FF] via-[#E9D5FF] to-[#D8B4FE] flex items-center justify-center p-2 rounded-full">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <circle cx="20" cy="20" r="18" fill="#FAF5FF" stroke="#8B5CF6" strokeWidth="1.2" />
              <path
                d="M11 16C15 15 18 16 20 18C22 16 25 15 29 16V27C25 26 22 27 20 29C18 27 15 26 11 27V16Z"
                fill="#8B5CF6"
                stroke="#6D28D9"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path d="M20 18V29" stroke="#6D28D9" strokeWidth="1.2" />
              <path d="M14 20H17M14 23H17M23 20H26M23 23H26" stroke="#EDE9FE" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'kelimal':
        // Swami Haridas: Veena & Sangeet Tanpura
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B]/30 flex items-center justify-center p-2 rounded-full">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <circle cx="20" cy="20" r="18" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.2" />
              <circle cx="20" cy="25" r="7" fill="#D97706" />
              <circle cx="20" cy="25" r="4.5" fill="#B45309" />
              <rect x="18.5" y="9" width="3" height="11" rx="1.5" fill="#92400E" />
              <line x1="16" y1="11" x2="24" y2="11" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="14" x2="24" y2="14" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="19.5" y1="10" x2="19.5" y2="25" stroke="#FEF3C7" strokeWidth="0.8" />
              <line x1="20.5" y1="10" x2="20.5" y2="25" stroke="#FEF3C7" strokeWidth="0.8" />
            </svg>
          </div>
        );
      case 'ashtayama':
      default:
        // Ashtayama: Authentic Sunrise Seva Icon
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC]/40 flex items-center justify-center p-2 rounded-full border border-sky-300">
            <img
              src="/assets/icons/sunrise.svg"
              alt="अष्टयाम सेवा"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center w-full min-w-0 pressable focus:outline-none select-none group"
    >
      <div
        className={`w-11 h-11 sm:w-14 sm:h-14 xl:w-14 xl:h-14 rounded-full overflow-hidden p-0.5 transition-all duration-300 ${
          isActive
            ? 'ring-2 ring-[#18181B] shadow-md ring-offset-2 ring-offset-white'
            : 'ring-1 ring-black/5 group-hover:ring-black/20'
        }`}
      >
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={label}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
          />
        ) : (
          renderVectorIcon()
        )}
      </div>
      <span
        title={label}
        className="text-[10.5px] sm:text-xs font-semibold text-[#111111] mt-1.5 text-center leading-tight tracking-tight truncate w-full max-w-[56px] sm:max-w-none px-0.5 group-hover:text-[#B84A28] transition-colors"
      >
        {label}
      </span>
      {sublabel && (
        <span
          title={sublabel}
          className="text-[9px] sm:text-[10px] text-[#6B6F6B] text-center leading-none mt-0.5 tracking-tight truncate w-full max-w-[56px] sm:max-w-none px-0.5"
        >
          {sublabel}
        </span>
      )}
    </button>
  );
};
