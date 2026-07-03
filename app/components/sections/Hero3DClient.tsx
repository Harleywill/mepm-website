'use client';

import dynamic from 'next/dynamic';

// Hero3D pulls in three.js purely to animate a client-only canvas — there's
// nothing meaningful for the server to render, so split it into its own
// chunk and skip the SSR pass entirely.
const Hero3D = dynamic(() => import('./Hero3D'), { ssr: false });

export default Hero3D;
