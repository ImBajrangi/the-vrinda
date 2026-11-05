import React from 'react';

interface DotMatrixNumberProps {
  value: string | number;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DotMatrixNumber: React.FC<DotMatrixNumberProps> = ({
  value,
  label,
  size = 'md',
  className = '',
}) => {
  const sizeClass = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl sm:text-5xl',
  }[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span className={`font-doto font-light tracking-wide text-[#111111] leading-none ${sizeClass}`}>
        {value}
      </span>
      {label && (
        <span className="text-[11px] font-medium text-[#6B6F6B] mt-1 tracking-tight">
          {label}
        </span>
      )}
    </div>
  );
};

