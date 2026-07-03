'use client';

import dynamic from 'next/dynamic';

// Same as Hero3DClient — defers the three.js chunk off the initial bundle
// for every service detail page.
const ServiceHero3D = dynamic(() => import('./ServiceHero3D'), { ssr: false });

export default ServiceHero3D;
