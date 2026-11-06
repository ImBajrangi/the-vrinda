import React, { useState } from 'react';

interface SacredLogoProps {
  className?: string;
  size?: number;
  variant?: 'official' | 'mukut';
}

export const SacredLogo: React.FC<SacredLogoProps> = ({
  className = '',
  size = 44,
  variant = 'official',
}) => {
  const [imgError, setImgError] = useState(false);
  const iconSrc = variant === 'mukut' ? '/assets/icons/shriJiMukut.svg' : '/assets/icons/official-logo.svg';

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-purple-200/80 ring-1 ring-purple-100 bg-white ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF9F6 100%)',
      }}
    >
      {!imgError ? (
        <img
          src={iconSrc}
          alt="वृन्दोपनिषद्"
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          width={Math.round(size * 0.65)}
          height={Math.round(size * 0.65)}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M16 3C16 10 11 16 11 20C11 22.8 13.2 25 16 25C18.8 25 21 22.8 21 20C21 16 16 10 16 3Z"
            fill="#D4A359"
          />
          <path
            d="M9.5 12C6 16 6 21 8 23C10 25 13 25 14.5 22C12.5 18 11.5 14 9.5 12Z"
            fill="#7C3AED"
            opacity="0.9"
          />
          <path
            d="M22.5 12C26 16 26 21 24 23C22 25 19 25 17.5 22C19.5 18 20.5 14 22.5 12Z"
            fill="#7C3AED"
            opacity="0.9"
          />
          <circle cx="16" cy="18" r="2" fill="#F59E0B" />
          <circle cx="16" cy="18" r="0.8" fill="#18181B" />
          <path
            d="M6 25C11 28 21 28 26 25C23 29 9 29 6 25Z"
            fill="#7C3AED"
            opacity="0.85"
          />
        </svg>
      )}
    </div>
  );
};


