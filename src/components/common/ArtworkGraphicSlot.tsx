import React, { useState } from 'react';
import { Image, Sparkles, BookOpen, Users, Landmark, Music, Heart } from 'lucide-react';

export type GraphicAspectRatio = 'banner' | 'video' | 'card' | 'portrait' | 'square' | 'squircle' | 'compact';

export type GraphicSlotTheme = 'neutral' | 'purple' | 'amber' | 'orange' | 'sky';

interface ArtworkGraphicSlotProps {
  src?: string | null;
  alt?: string;
  aspectRatio?: GraphicAspectRatio;
  theme?: GraphicSlotTheme;
  placeholderLabel?: string;
  placeholderCategory?: 'temple' | 'book' | 'saint' | 'music' | 'dham' | 'general';
  badge?: string;
  badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  overlayContent?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  roundedClassName?: string;
}

export const ArtworkGraphicSlot: React.FC<ArtworkGraphicSlotProps> = ({
  src,
  alt = 'Devotional Graphic Canvas',
  aspectRatio = 'card',
  theme = 'neutral',
  placeholderLabel = 'Graphic Canvas • Empty Slot',
  placeholderCategory = 'general',
  badge,
  badgePosition = 'top-left',
  overlayContent,
  className = '',
  onClick,
  roundedClassName = 'rounded-[20px]',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Responsive Aspect Ratios
  const aspectClasses: Record<GraphicAspectRatio, string> = {
    banner: 'aspect-[21/9] sm:aspect-[24/9]',
    video: 'aspect-[16/9]',
    card: 'aspect-[16/10] sm:aspect-[16/9]',
    portrait: 'aspect-[3/4]',
    square: 'aspect-square',
    squircle: 'aspect-square w-14 h-14 sm:w-16 sm:h-16',
    compact: 'h-24 sm:h-28 w-full',
  };

  const themeGradients: Record<GraphicSlotTheme, { bg: string; iconBg: string; iconColor: string; labelColor: string }> = {
    neutral: {
      bg: 'bg-gradient-to-br from-[#FFFFFF] via-[#FAF9F6] to-[#F4F4F5]',
      iconBg: 'bg-neutral-100',
      iconColor: 'text-[#71717A]',
      labelColor: 'text-[#71717A]',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50/60 via-purple-50/30 to-[#FAFAFA]',
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-[#7C3AED]',
      labelColor: 'text-purple-700',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50/60 via-amber-50/30 to-[#FAFAFA]',
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-[#D97706]',
      labelColor: 'text-amber-700',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50/60 via-orange-50/30 to-[#FAFAFA]',
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-[#EA580C]',
      labelColor: 'text-orange-700',
    },
    sky: {
      bg: 'bg-gradient-to-br from-sky-50/60 via-sky-50/30 to-[#FAFAFA]',
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-[#0284C7]',
      labelColor: 'text-sky-700',
    },
  };

  const currentTheme = themeGradients[theme] || themeGradients.neutral;

  const renderPlaceholderIcon = () => {
    switch (placeholderCategory) {
      case 'temple':
        return <Landmark className={`w-5 h-5 ${currentTheme.iconColor}`} />;
      case 'book':
        return <BookOpen className={`w-5 h-5 ${currentTheme.iconColor}`} />;
      case 'saint':
        return <Users className={`w-5 h-5 ${currentTheme.iconColor}`} />;
      case 'music':
        return <Music className={`w-5 h-5 ${currentTheme.iconColor}`} />;
      case 'dham':
        return <Sparkles className={`w-5 h-5 ${currentTheme.iconColor}`} />;
      case 'general':
      default:
        return <Image className={`w-5 h-5 ${currentTheme.iconColor}`} />;
    }
  };

  const isImageValid = Boolean(src && src.trim().length > 0 && !hasError);

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={`relative w-full overflow-hidden ${roundedClassName} select-none ${aspectClasses[aspectRatio]} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {isImageValid ? (
        <>
          <img
            src={src!}
            alt={alt}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />

          {/* Soft scrim gradient when overlay content is present so text pops effortlessly */}
          {overlayContent && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
          )}
        </>
      ) : (
        /* Empty Artwork / Graphics Slot Frame: Designed specifically for later graphics insertion */
        <div
          className={`w-full h-full ${currentTheme.bg} flex flex-col items-center justify-center p-4 text-center relative border border-dashed border-neutral-300/80`}
        >
          {/* Subtle artistic watermark in the background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Heart className="w-32 h-32 text-current" />
          </div>

          {/* Central Art Emblem */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl ${currentTheme.iconBg} flex items-center justify-center shadow-2xs`}>
              {renderPlaceholderIcon()}
            </div>

            <div className="space-y-0.5">
              <span className={`text-[11px] font-bold font-mono tracking-wide block ${currentTheme.labelColor}`}>
                {placeholderLabel}
              </span>
              <span className="text-[10px] text-[#A1A1AA] font-sans block">
                Reserved Graphics Slot
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Badge (Borderless soft-tinted aesthetic) */}
      {badge && (
        <div
          className={`absolute z-20 m-2.5 sm:m-3 ${
            badgePosition === 'top-left'
              ? 'top-0 left-0'
              : badgePosition === 'top-right'
              ? 'top-0 right-0'
              : badgePosition === 'bottom-left'
              ? 'bottom-0 left-0'
              : 'bottom-0 right-0'
          }`}
        >
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-white/95 backdrop-blur-md text-[#18181B] shadow-2xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
            {badge}
          </span>
        </div>
      )}

      {/* Dynamic Overlay Content (e.g. titles, tags, play buttons placed over the graphic) */}
      {overlayContent && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-5 text-white pointer-events-none">
          <div className="pointer-events-auto">
            {overlayContent}
          </div>
        </div>
      )}
    </div>
  );
};

