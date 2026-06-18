'use client';

import { useState } from 'react';

interface CardProps {
  children: React.ReactNode;
  topRule?: boolean;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({
  children,
  topRule,
  hover,
  onClick,
  className,
  style,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white border border-slate-200 rounded-lg overflow-hidden transition-all duration-220 ${
        hover && isHovered
          ? 'shadow-lg -translate-y-[3px]'
          : 'shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''} ${
        topRule ? 'border-t-4 border-t-green-500' : ''
      } ${className || ''}`}
      style={style}
    >
      {children}
    </div>
  );
}
