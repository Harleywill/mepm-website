'use client';

import type { ReactNode } from 'react';
import { useLightbox } from './LightboxProvider';

export default function LightboxTrigger({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useLightbox();
  return (
    <button
      type="button"
      onClick={() => open(index)}
      className={className}
      aria-label="View larger image"
    >
      {children}
    </button>
  );
}
