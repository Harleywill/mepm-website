'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type ServiceVariant = 'electrical' | 'mechanical' | 'environmental';

const NAVY = 0x004078;
const GREEN = 0x68b830;

type Disposable = THREE.BufferGeometry | THREE.Material;

interface Built {
  disposables: Disposable[];
  animate: (t: number) => void;
}

/** Atom: nucleus with multiple electrons orbiting in synchronized 3D paths */
function buildElectrical(rig: THREE.Group): Built {
  const disposables: Disposable[] = [];

  const coreGeo = new THREE.SphereGeometry(0.45, 16, 12);
  const coreMat = new THREE.MeshStandardMaterial({
    color: NAVY,
    metalness: 0.5,
    roughness: 0.3,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  rig.add(core);
  disposables.push(coreGeo, coreMat);

  // Three orbital rings at different angles
  const orbitals: { ring: THREE.Group; electrons: THREE.Mesh[]; speed: number }[] = [];
  const orbitalConfigs = [
    { angle: [0, 0, 0], radius: 1.4, electronCount: 4, speed: 0.35 },
    { angle: [Math.PI / 2.5, Math.PI / 3.2, 0], radius: 1.75, electronCount: 4, speed: 0.28 },
    { angle: [Math.PI / 3.5, -Math.PI / 2.8, Math.PI / 4], radius: 2.05, electronCount: 3, speed: 0.22 },
  ];

  orbitalConfigs.forEach((config) => {
    const orbital = new THREE.Group();
    orbital.rotation.set(config.angle[0], config.angle[1], config.angle[2]);
    rig.add(orbital);

    // Orbital ring visualization
    const ringGeo = new THREE.TorusGeometry(config.radius, 0.018, 6, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: NAVY,
      transparent: true,
      opacity: 0.35,
    });
    orbital.add(new THREE.Mesh(ringGeo, ringMat));
    disposables.push(ringGeo, ringMat);

    // Electrons evenly spaced around the ring
    const electrons: THREE.Mesh[] = [];
    const electronGeo = new THREE.SphereGeometry(0.065, 14, 10);
    const electronMat = new THREE.MeshBasicMaterial({ color: GREEN });
    for (let i = 0; i < config.electronCount; i++) {
      const electron = new THREE.Mesh(electronGeo, electronMat);
      electron.position.x = config.radius;
      electron.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), (i / config.electronCount) * Math.PI * 2);
      orbital.add(electron);
      electrons.push(electron);
    }
    disposables.push(electronGeo, electronMat);

    orbitals.push({ ring: orbital, electrons, speed: config.speed });
  });

  return {
    disposables,
    animate: (t) => {
      core.rotation.y = t * 0.18;
      core.rotation.x = t * 0.11;
      orbitals.forEach(({ ring }, i) => {
        ring.rotation.z = t * (0.35 + i * 0.15);
      });
    },
  };
}

/** Impeller: hub, pitched blades and shroud ring, slowly turning */
function buildMechanical(rig: THREE.Group): Built {
  const disposables: Disposable[] = [];

  const assembly = new THREE.Group();
  assembly.rotation.set(0.55, -0.35, 0);
  rig.add(assembly);

  const navyMat = new THREE.MeshStandardMaterial({
    color: NAVY,
    metalness: 0.4,
    roughness: 0.35,
    flatShading: true,
  });
  disposables.push(navyMat);

  const hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.26, 24);
  const hub = new THREE.Mesh(hubGeo, navyMat);
  hub.rotation.x = Math.PI / 2;
  assembly.add(hub);
  disposables.push(hubGeo);

  const rotor = new THREE.Group();
  assembly.add(rotor);
  const bladeGeo = new THREE.BoxGeometry(0.16, 0.95, 0.04);
  const bladeEdgeGeo = new THREE.EdgesGeometry(bladeGeo);
  const bladeEdgeMat = new THREE.LineBasicMaterial({
    color: GREEN,
    transparent: true,
    opacity: 0.6,
  });
  for (let i = 0; i < 7; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i / 7) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, navyMat);
    blade.position.y = 0.78;
    blade.rotation.y = 0.45;
    blade.add(new THREE.LineSegments(bladeEdgeGeo, bladeEdgeMat));
    arm.add(blade);
    rotor.add(arm);
  }
  disposables.push(bladeGeo, bladeEdgeGeo, bladeEdgeMat);

  const shroudGeo = new THREE.TorusGeometry(1.42, 0.02, 6, 80);
  const shroudMat = new THREE.MeshBasicMaterial({
    color: NAVY,
    transparent: true,
    opacity: 0.4,
  });
  assembly.add(new THREE.Mesh(shroudGeo, shroudMat));
  disposables.push(shroudGeo, shroudMat);

  return {
    disposables,
    animate: (t) => {
      rotor.rotation.z = t * 0.5;
    },
  };
}

/** Globe: navy sphere in a green wireframe grid, satellite on an orbit ring */
function buildEnvironmental(rig: THREE.Group): Built {
  const disposables: Disposable[] = [];

  const globe = new THREE.Group();
  globe.rotation.z = 0.2;
  rig.add(globe);

  const sphereGeo = new THREE.SphereGeometry(1.02, 24, 16);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: NAVY,
    metalness: 0.2,
    roughness: 0.55,
  });
  globe.add(new THREE.Mesh(sphereGeo, sphereMat));
  disposables.push(sphereGeo, sphereMat);

  const gridSphereGeo = new THREE.SphereGeometry(1.22, 18, 12);
  const gridGeo = new THREE.WireframeGeometry(gridSphereGeo);
  const gridMat = new THREE.LineBasicMaterial({
    color: GREEN,
    transparent: true,
    opacity: 0.35,
  });
  const grid = new THREE.LineSegments(gridGeo, gridMat);
  globe.add(grid);
  disposables.push(gridSphereGeo, gridGeo, gridMat);

  const orbitTilt = new THREE.Group();
  orbitTilt.rotation.set(1.15, 0.3, 0);
  rig.add(orbitTilt);
  const orbitSpin = new THREE.Group();
  orbitTilt.add(orbitSpin);

  const orbitGeo = new THREE.TorusGeometry(1.55, 0.012, 6, 80);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: NAVY,
    transparent: true,
    opacity: 0.35,
  });
  orbitSpin.add(new THREE.Mesh(orbitGeo, orbitMat));

  const satGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const satMat = new THREE.MeshBasicMaterial({ color: GREEN });
  const sat = new THREE.Mesh(satGeo, satMat);
  sat.position.x = 1.55;
  orbitSpin.add(sat);
  disposables.push(orbitGeo, orbitMat, satGeo, satMat);

  return {
    disposables,
    animate: (t) => {
      globe.rotation.y = t * 0.12;
      grid.rotation.y = t * 0.05;
      orbitSpin.rotation.z = t * 0.3;
    },
  };
}

const builders: Record<ServiceVariant, (rig: THREE.Group) => Built> = {
  electrical: buildElectrical,
  mechanical: buildMechanical,
  environmental: buildEnvironmental,
};

export default function ServiceHero3D({ variant }: { variant: ServiceVariant }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      (container.clientWidth || 1) / (container.clientHeight || 1),
      0.1,
      50
    );
    camera.position.z = 5.6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const rig = new THREE.Group();
    scene.add(rig);

    const { disposables, animate } = builders[variant](rig);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    let frameId = 0;
    const clock = new THREE.Clock();
    const renderFrame = () => {
      animate(clock.getElapsedTime());
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderFrame);
    };

    // Always paint one frame synchronously so the object exists even
    // where requestAnimationFrame is throttled or paused
    animate(0);
    renderer.render(scene, camera);
    if (!prefersReducedMotion) {
      frameId = requestAnimationFrame(renderFrame);
    }

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeChild(renderer.domElement);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [variant]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="relative h-52 lg:h-64 pointer-events-none"
    />
  );
}
