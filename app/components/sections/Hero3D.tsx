'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, useReducedMotion } from 'framer-motion';

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Rig handles placement + mouse parallax; children handle their own spin
    const rig = new THREE.Group();
    scene.add(rig);

    // Outer lattice shell — detail 1 keeps facets large enough to read as structure
    const outerGeo = new THREE.IcosahedronGeometry(2.3, 1);
    const outerEdgesGeo = new THREE.EdgesGeometry(outerGeo);
    const outerMat = new THREE.LineBasicMaterial({
      color: 0x004078,
      transparent: true,
      opacity: 0.45,
    });
    const outerShell = new THREE.LineSegments(outerEdgesGeo, outerMat);
    outerShell.rotation.set(0.4, 0.6, 0);
    rig.add(outerShell);

    // Node points at the lattice vertices — green for the brand accent
    const nodesMat = new THREE.PointsMaterial({
      color: 0x68b830,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
    });
    const nodes = new THREE.Points(outerGeo, nodesMat);
    outerShell.add(nodes);

    // Inner core — solid faceted crystal, counter-rotating, green edges
    const coreGeo = new THREE.IcosahedronGeometry(1.1, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x004078,
      metalness: 0.4,
      roughness: 0.35,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.set(0.2, -0.4, 0);
    rig.add(core);

    const coreEdgesGeo = new THREE.EdgesGeometry(coreGeo);
    const coreEdgesMat = new THREE.LineBasicMaterial({
      color: 0x68b830,
      transparent: true,
      opacity: 0.95,
    });
    const coreEdges = new THREE.LineSegments(coreEdgesGeo, coreEdgesMat);
    core.add(coreEdges);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(6, 6, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x68b830, 0.5);
    fillLight.position.set(-6, -4, 6);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    // Offset right of the text on desktop, centred and smaller on mobile
    const place = () => {
      if (container.clientWidth >= 768) {
        rig.position.x = 2.4;
        rig.scale.setScalar(1);
      } else {
        rig.position.x = 0;
        rig.scale.setScalar(0.55);
      }
    };
    place();

    let targetTiltX = 0;
    let targetTiltY = 0;
    const onPointerMove = (e: PointerEvent) => {
      targetTiltY = (e.clientX / window.innerWidth - 0.5) * 0.4;
      targetTiltX = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    if (!prefersReducedMotion) {
      window.addEventListener('pointermove', onPointerMove);
    }

    let frameId = 0;
    const clock = new THREE.Clock();
    const renderFrame = () => {
      const t = clock.getElapsedTime();
      outerShell.rotation.y = 0.6 + t * 0.12;
      outerShell.rotation.x = 0.4 + t * 0.05;
      core.rotation.y = -0.4 - t * 0.25;
      core.rotation.x = 0.2 + t * 0.1;
      rig.position.y = Math.sin(t * 0.6) * 0.15;
      rig.rotation.x += (targetTiltX - rig.rotation.x) * 0.05;
      rig.rotation.y += (targetTiltY - rig.rotation.y) * 0.05;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderFrame);
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      frameId = requestAnimationFrame(renderFrame);
    }

    // ResizeObserver fires with the real size once layout settles (a window
    // resize listener misses the post-hydration layout pass entirely)
    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      place();
      if (prefersReducedMotion) renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      container.removeChild(renderer.domElement);
      [outerGeo, outerEdgesGeo, coreGeo, coreEdgesGeo].forEach((g) => g.dispose());
      [outerMat, nodesMat, coreMat, coreEdgesMat].forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center overflow-hidden bg-white"
    >
      {/* Faint blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0, 64, 120, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 64, 120, 0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Legibility wash — gradient only, no blur, so the model stays crisp */}
      <div aria-hidden className="absolute inset-0 bg-white/65 md:hidden" />
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block bg-gradient-to-r from-white via-white/60 to-transparent"
      />

      {/* Content */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6"
      >
        <div className="max-w-2xl">
          <div className="mepm-eyebrow mb-6">BUILDING SERVICES CONSULTANTS</div>
          <h1 className="mepm-display text-navy-700 mb-6">
            Engineering buildings that{' '}
            <span className="text-mepm-green">perform</span>.
          </h1>
          <p className="mepm-lead text-slate-600 mb-10 max-w-xl">
            Multi-disciplinary electrical, mechanical and environmental
            engineering: innovative design and efficient, sustainable systems
            tailored to your project.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-base bg-mepm-green text-white shadow-sm hover:bg-mepm-green/90 transition-colors duration-200">
              Get a quote
            </button>
            <button className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-base border border-navy-700/25 text-navy-700 hover:border-navy-700 hover:bg-navy-700 hover:text-white transition-colors duration-200">
              View our work
            </button>
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={reduceMotion ? undefined : { y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
      >
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-navy-700/40" />
      </motion.div>
    </section>
  );
}
