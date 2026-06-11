'use client';

import { ReactNode, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion();
  // Safety net: if IntersectionObserver never fires (background tabs,
  // headless renderers, print), content must still become visible.
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={forceVisible ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
