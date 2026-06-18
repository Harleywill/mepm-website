'use client';

import { useState } from 'react';
import { Icon } from './Icon';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: any;
  iconRight?: any;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  const baseClasses = [
    'font-semibold',
    'border-[1.5px] border-transparent',
    'rounded-md',
    'cursor-pointer',
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'whitespace-nowrap',
    'transition-all',
    'duration-120',
    disabled && 'opacity-45 cursor-not-allowed',
  ]
    .filter(Boolean)
    .join(' ');

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-sm px-3.5 py-1.5',
    md: 'text-base px-4.5 py-2.5',
    lg: 'text-base px-6 py-3.5',
  };

  const variantClasses: Record<ButtonVariant, { base: string; hover: string }> =
    {
      primary: {
        base: 'bg-navy-700 text-white border-navy-700',
        hover: hovered && !disabled ? 'bg-navy-800' : '',
      },
      accent: {
        base: 'bg-green-500 text-slate-950 border-green-500',
        hover:
          hovered && !disabled ? 'brightness-95' : '',
      },
      secondary: {
        base: 'bg-white text-navy-700 border-slate-300',
        hover: hovered && !disabled ? 'border-navy-600 bg-navy-50' : '',
      },
      ghost: {
        base: 'bg-transparent text-slate-700 border-transparent',
        hover: hovered && !disabled ? 'bg-slate-100' : '',
      },
      danger: {
        base: 'bg-white text-danger border-red-200',
        hover: hovered && !disabled ? 'bg-danger-bg' : '',
      },
    };

  const vClasses = variantClasses[variant];
  const finalClass = [
    baseClasses,
    sizeClasses[size],
    vClasses.base,
    vClasses.hover,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 15 : 16;

  return (
    <button
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: !disabled && hovered ? 'translateY(-1px)' : 'none',
        ...style,
      }}
      className={finalClass}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
