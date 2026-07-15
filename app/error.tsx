'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bp-grid-light flex min-h-[70vh] items-center border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <span className="mepm-eyebrow">MEPM · Error</span>
        <h1 className="mepm-display mt-4 text-navy-700">
          Something went <span className="text-slate-500">wrong</span>.
        </h1>
        <p className="mepm-lead mx-auto mt-5 max-w-xl">
          An unexpected error stopped this page from loading. Try again, or
          call us on{' '}
          <a
            href="tel:+441482838080"
            className="font-medium text-navy-700 underline underline-offset-2 hover:text-green-600"
          >
            01482 838080
          </a>{' '}
          if it keeps happening.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-base bg-mepm-green text-white shadow-sm hover:bg-mepm-green/90 transition-colors duration-200 cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-base border border-navy-700/25 text-navy-700 hover:border-navy-700 hover:bg-navy-700 hover:text-white transition-colors duration-200"
          >
            Back to home
          </a>
        </div>
      </div>
    </section>
  );
}
