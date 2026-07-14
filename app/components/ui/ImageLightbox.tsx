'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';

export interface LightboxImage {
  id: string;
  src: string;
  caption?: string | null;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goNext, goPrev]);

  const current = images[index];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 md:p-6"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <Icon name="X" size={20} />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:left-4"
            >
              <Icon name="ChevronLeft" size={22} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:right-4"
            >
              <Icon name="ChevronRight" size={22} />
            </button>
          </>
        )}

        <div
          className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 md:h-auto md:w-auto md:max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, scale: 0.95, x: direction * 24 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.15 }}
              className="relative flex max-h-[75vh] w-full items-center justify-center md:max-h-[600px]"
            >
              <Image
                src={current.src}
                alt={current.caption ?? ''}
                width={1200}
                height={800}
                className="max-h-[75vh] w-auto object-contain md:max-h-[600px]"
                priority
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col items-center gap-1 text-center">
            {current.caption && (
              <p className="text-sm text-white/80">{current.caption}</p>
            )}
            {images.length > 1 && (
              <p className="font-mono text-xs text-white/50">
                {index + 1} of {images.length}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
