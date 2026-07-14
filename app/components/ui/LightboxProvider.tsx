'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import ImageLightbox, { type LightboxImage } from './ImageLightbox';

interface LightboxContextValue {
  open: (index: number) => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

/** Server components render the page; this client island owns the lightbox
 *  state so cover + gallery images (rendered server-side) can share one
 *  navigable sequence without the whole page becoming a client component
 *  (which would break generateStaticParams / ISR). */
export function useLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error('useLightbox must be used within a LightboxProvider');
  return ctx;
}

export default function LightboxProvider({
  images,
  children,
}: {
  images: LightboxImage[];
  children: ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <LightboxContext.Provider value={{ open: setOpenIndex }}>
      {children}
      {openIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </LightboxContext.Provider>
  );
}
