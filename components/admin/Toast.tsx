'use client';

import { useState, useCallback } from 'react';
import { Icon } from './Icon';

interface ToastItem {
  id: string;
  message: string;
  icon?: any;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (message: string, icon?: any) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, icon }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-navy-800 text-white px-4 py-3.5 rounded-md shadow-lg flex items-center gap-2.5 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t.icon && <Icon name={t.icon} size={18} />}
          <span className="font-body text-sm">{t.message}</span>
        </div>
      ))}
    </div>
  );

  return [<ToastContainer key="toast-container" />, toast] as const;
}
