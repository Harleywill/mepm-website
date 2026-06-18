import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-200 ease-standard focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-navy-700 text-white hover:bg-navy-800 hover:shadow-lg hover:translate-y-[-1px] focus:ring-navy-300',
    secondary: 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:translate-y-[-1px] focus:ring-green-200',
    ghost: 'border border-slate-200 text-navy-700 hover:bg-navy-50 hover:shadow-sm focus:ring-navy-300',
    glass: 'bg-green-500/60 text-white backdrop-blur-sm border border-green-300/40 hover:bg-green-500/80 hover:shadow-lg hover:translate-y-[-1px] focus:ring-green-200',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-md',
    lg: 'px-8 py-4 text-lg rounded-lg',
  };

  return (
    <button
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}


