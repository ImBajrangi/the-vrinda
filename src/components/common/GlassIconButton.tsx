import React from 'react';

interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  badge?: number | string;
  size?: 'sm' | 'md' | 'lg';
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  children,
  badge,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-[36px] h-[36px]',
    md: 'w-[42px] h-[42px]',
    lg: 'w-[48px] h-[48px]',
  }[size];

  return (
    <button
      type="button"
      className={`relative inline-flex items-center justify-center rounded-full text-[#111111] pressable border border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.05)] ${sizeClasses} ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      {...props}
    >
      {children}
      {badge !== undefined && (
        <i
          className="absolute -top-[2px] -right-[2px] w-[15px] h-[15px] rounded-full flex items-center justify-center not-italic font-sans font-semibold text-[9px] shadow-xs"
          style={{
            background: '#D97706',
            color: '#FFFFFF',
          }}
        >
          {badge}
        </i>
      )}
    </button>
  );
};
