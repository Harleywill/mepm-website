'use client';

import { useEffect, useRef, useState } from 'react';

// Placeholder until the client supplies real practice metrics (projects
// delivered, carbon savings, repeat-client rate) — these three are the
// only figures defensible from existing site content.
const STATS = [
  { end: 29, suffix: '', label: 'Years in practice' },
  { end: 3, suffix: '', label: 'Engineering disciplines, one team' },
  { end: 6, suffix: '', label: 'Service lines, feasibility to handover' },
];

function CountUp({ end, suffix }: { end: number; suffix: string }) {
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
    // Same safety net as Reveal: never leave the number at 0 if the
    // observer doesn't fire (background tabs, headless renderers)
    const fallback = setTimeout(start, 2000);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [end]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

export default function StatStrip() {
  return (
    <section className="bg-navy-900 bp-grid">
      <div className="max-w-7xl mx-auto px-6 py-18 grid gap-10 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="border-l-2 border-mepm-green pl-6">
            <div className="font-display font-extrabold text-5xl tracking-tight text-white">
              <CountUp end={stat.end} suffix={stat.suffix} />
            </div>
            <div className="text-white/72 text-[15px] leading-relaxed mt-3">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
