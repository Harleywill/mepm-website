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

/** Atom: orbit rings with green electrons around a faceted core */
function buildElectrical(rig: THREE.Group): Built {
  const disposables: Disposable[] = [];

  const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: NAVY,
    metalness: 0.3,
    roughness: 0.4,
    flatShading: true,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  rig.add(core);
  const coreEdgeGeo = new THREE.EdgesGeometry(coreGeo);
  const coreEdgeMat = new THREE.LineBasicMaterial({
    color: GREEN,
    transparent: true,
    opacity: 0.8,
  });
  core.add(new THREE.LineSegments(coreEdgeGeo, coreEdgeMat));
  disposables.push(coreGeo, coreMat, coreEdgeGeo, coreEdgeMat);

  const spinners: THREE.Group[] = [];
  const tilts: [number, number][] = [
    [Math.PI / 2.2, 0],
    [Math.PI / 3, Math.PI / 3],
    [-Math.PI / 3.5, -Math.PI / 4],
  ];
  tilts.forEach(([rx, ry], i) => {
    const radius = 1.25 + i * 0.12;
    const tilt = new THREE.Group();
    tilt.rotation.set(rx, ry, 0);
    const spin = new THREE.Group();

    const ringGeo = new THREE.TorusGeometry(radius, 0.015, 6, 72);
    const ringMat = new THREE.MeshBasicMaterial({
      color: NAVY,
      transparent: true,
      opacity: 0.4,
    });
    spin.add(new THREE.Mesh(ringGeo, ringMat));

    const electronGeo = new THREE.SphereGeometry(0.06, 12, 8);
    const electronMat = new THREE.MeshBasicMaterial({ color: GREEN });
    const electron = new THREE.Mesh(electronGeo, electronMat);
    electron.position.x = radius;
    spin.add(electron);

    tilt.add(spin);
    rig.add(tilt);
    spinners.push(spin);
    disposables.push(ringGeo, ringMat, electronGeo, electronMat);
  });

  return {
    disposables,
    animate: (t) => {
      core.rotation.y = t * 0.15;
      core.rotation.x = t * 0.09;
      spinners.forEach((spin, i) => {
        spin.rotation.z = t * (0.4 + i * 0.18);
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
    camera.position.z = 5.2;

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

    // Sit the object under the title block column on wide screens,
    // raised so it peeks above and around the card
    const place = () => {
      const w = container.clientWidth;
      const h = container.clientHeight || 1;
      const halfWidth = Math.tan((40 * Math.PI) / 360) * 5.2 * (w / h);
      rig.position.x = Math.min(halfWidth * 0.64, 3.1);
      rig.position.y = 0.45;
    };
    place();

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
      place();
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
      className="hidden lg:block absolute inset-0 pointer-events-none"
    />
  );
}
