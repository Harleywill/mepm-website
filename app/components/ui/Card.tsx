import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  children: React.ReactNode;
}

export default function Card({ accent = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200 rounded-lg p-6 shadow-sm transition-all duration-200 ease-standard hover:shadow-lg hover:translate-y-[-4px]',
        accent && 'border-t-[5px] border-t-green-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
