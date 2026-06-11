'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0xffffff, 0);
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 3;

    // Create rotating icosahedron (engineering geometry)
    const geometry = new THREE.IcosahedronGeometry(1.8, 4);

    // Solid base mesh
    const material = new THREE.MeshStandardMaterial({
      color: 0x003d6b, // Darker navy
      metalness: 0.8,
      roughness: 0.15,
    });
    const object = new THREE.Mesh(geometry, material);
    scene.add(object);

    // Bright wireframe overlay for clarity
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x68b830, // Green edges
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    object.add(wireframe);

    // Intense lighting
    const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
    light1.position.set(8, 8, 8);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x68b830, 1.2);
    light2.position.set(-6, -6, 6);
    scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff, 0.6);
    light3.position.set(0, -8, 0);
    scene.add(light3);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      object.rotation.x += 0.003;
      object.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Canvas Background */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Glass-morphism Overlay */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
      >
        <div className="mepm-eyebrow mb-6">BUILDING SERVICES CONSULTANTS</div>
        <h1 className="mepm-display text-navy-700 mb-6">
          Engineering buildings that <span className="text-mepm-green">perform</span>.
        </h1>
        <p className="mepm-lead text-slate-600 mb-12 max-w-2xl mx-auto">
          Multi-disciplinary electrical, mechanical and environmental engineering — innovative design and efficient, sustainable systems tailored to your project.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-base bg-green-500/60 text-white backdrop-blur-sm border border-green-300/40 hover:bg-green-500/80 transition-all duration-200">
            Get a quote
          </button>
          <button className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-base border border-slate-200 text-navy-700 hover:bg-navy-50 transition-all duration-200">
            View our work
          </button>
        </div>
      </motion.div>
    </section>
  );
}
