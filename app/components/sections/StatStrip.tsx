'use client';

import { useEffect, useRef, useState } from 'react';
import type { StatDTO, QualificationDTO } from '@/lib/settings';

function CountUp({ end }: { end: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(end);
      return;
    }

    let raf = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const duration = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          start();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    const fallback = setTimeout(start, 2000);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [end]);

  return <span ref={ref}>{val}</span>;
}

export default function StatStrip({
  stats,
  qualifications,
}: {
  stats: StatDTO[];
  qualifications: QualificationDTO[];
}) {
  // Nothing to show — skip the band entirely.
  if (stats.length === 0 && qualifications.length === 0) return null;

  return (
    <section className="bg-navy-900 bp-grid">
      <div className="max-w-7xl mx-auto px-6 py-18">
        {stats.length > 0 && (
          <div
            className="grid gap-10"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            {stats.map((stat) => (
              <div key={stat.id} className="border-l-2 border-mepm-green pl-6">
                <div className="font-display font-extrabold text-5xl tracking-tight text-white">
                  {stat.prefix}
                  <CountUp end={stat.value} />
                  {stat.suffix}
                </div>
                <div className="text-white/72 text-[15px] leading-relaxed mt-3">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {qualifications.length > 0 && (
          <div
            className={
              stats.length > 0 ? 'mt-12 border-t border-white/12 pt-8' : ''
            }
          >
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-green-400">
              Qualifications & memberships
            </span>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {qualifications.map((q) => (
                <span
                  key={q.id}
                  className="inline-flex items-center rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/85"
                >
                  {q.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
