'use client';

import { useEffect } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  width?: number;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  width = 500,
  children,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ width: Math.min(width, window.innerWidth - 48) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            {eyebrow && (
              <div className="font-mono text-xs tracking-widest uppercase text-green-700 mb-2">
                <span className="inline-block w-5.5 h-0.5 bg-green-500 mr-2.5"></span>
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="font-display text-2xl font-800 text-navy-800 m-0">
                {title}
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
