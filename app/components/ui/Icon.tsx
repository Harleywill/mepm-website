import * as Icons from 'lucide-react';
import React from 'react';
import clsx from 'clsx';

interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 24, className }: IconProps) {
  const LucideIcon = Icons[name] as React.ComponentType<{
    size: number;
    className?: string;
    strokeWidth?: number;
  }>;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in Lucide`);
    return null;
  }

  return (
    <LucideIcon
      size={size}
      className={clsx('stroke-[1.75px]', className)}
      strokeWidth={1.75}
    />
  );
}
