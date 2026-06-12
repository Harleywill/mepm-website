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

/** Atom: faceted nucleus with multiple electrons orbiting in synchronized 3D paths */
function buildElectrical(rig: THREE.Group): Built {
  const disposables: Disposable[] = [];

  // Faceted nucleus
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

  // Three orbital rings at different angles with uniform electron distribution
  const orbitals: { ring: THREE.Group; electrons: THREE.Mesh[]; speed: number }[] = [];
  const orbitalConfigs = [
    { angle: [0, 0, 0], radius: 1.3, electronCount: 4, speed: 0.35 },
    { angle: [Math.PI / 2.8, Math.PI / 3.5, 0], radius: 1.7, electronCount: 4, speed: 0.28 },
    { angle: [Math.PI / 3.2, -Math.PI / 2.5, Math.PI / 4.2], radius: 2.1, electronCount: 4, speed: 0.22 },
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

/** Gear train: a large and a small gear meshing, counter-rotating */
function buildMechanical(rig: THREE.Group): Built {
  const disposables: Disposable[] = [];

  const assembly = new THREE.Group();
  assembly.rotation.set(0.65, -0.25, 0);
  assembly.position.set(-0.2, -0.25, 0);
  assembly.scale.setScalar(1.12);
  rig.add(assembly);

  const navyMat = new THREE.MeshStandardMaterial({
    color: NAVY,
    metalness: 0.4,
    roughness: 0.35,
    flatShading: true,
  });
  const edgeMat = new THREE.LineBasicMaterial({
    color: GREEN,
    transparent: true,
    opacity: 0.6,
  });
  const boreMat = new THREE.MeshBasicMaterial({
    color: GREEN,
    transparent: true,
    opacity: 0.55,
  });
  disposables.push(navyMat, edgeMat, boreMat);

  const THICKNESS = 0.22;
  const TOOTH_HEIGHT = 0.16;
  const TOOTH_DEPTH = 0.14;

  const buildGear = (radius: number, teeth: number, phaseOffset: number = 0): THREE.Group => {
    const gear = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(radius, radius, THICKNESS, 32);
    const body = new THREE.Mesh(bodyGeo, navyMat);
    body.rotation.x = Math.PI / 2;
    gear.add(body);
    const bodyEdgeGeo = new THREE.EdgesGeometry(bodyGeo);
    const bodyEdges = new THREE.LineSegments(bodyEdgeGeo, edgeMat);
    bodyEdges.rotation.x = Math.PI / 2;
    gear.add(bodyEdges);
    disposables.push(bodyGeo, bodyEdgeGeo);

    const toothWidth = ((2 * Math.PI * radius) / teeth) * 0.45;
    const toothGeo = new THREE.BoxGeometry(toothWidth, TOOTH_HEIGHT, THICKNESS);
    const toothEdgeGeo = new THREE.EdgesGeometry(toothGeo);
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2 + phaseOffset;
      const tooth = new THREE.Mesh(toothGeo, navyMat);
      tooth.position.set(
        Math.cos(a) * (radius + TOOTH_HEIGHT / 2),
        Math.sin(a) * (radius + TOOTH_HEIGHT / 2),
        0
      );
      tooth.rotation.z = a - Math.PI / 2;
      tooth.add(new THREE.LineSegments(toothEdgeGeo, edgeMat));
      gear.add(tooth);
    }
    disposables.push(toothGeo, toothEdgeGeo);

    const boreGeo = new THREE.TorusGeometry(radius * 0.28, 0.015, 6, 32);
    const bore = new THREE.Mesh(boreGeo, boreMat);
    bore.position.z = THICKNESS / 2 + 0.005;
    gear.add(bore);
    disposables.push(boreGeo);

    return gear;
  };

  // Meshing maths: both gears must share the same tooth pitch, so the
  // small gear's pitch radius is fixed by the 12:7 tooth ratio. Meshing
  // happens at the pitch circles (mid-tooth), so the centre distance is
  // the sum of the two pitch radii.
  const MESH_ANGLE = 0.68;
  const LARGE_RADIUS = 0.95;
  const largePitch = LARGE_RADIUS + TOOTH_HEIGHT / 2;
  const smallPitch = (largePitch * 7) / 12;
  const SMALL_RADIUS = smallPitch - TOOTH_HEIGHT / 2;
  const centreDistance = largePitch + smallPitch + 0.02;

  // Phases: large gear starts with a tooth pointing along the line of
  // centres; small gear starts with a gap pointing back at it (a gap
  // centre sits half a tooth spacing, π/7, from a tooth centre)
  const largeGear = buildGear(LARGE_RADIUS, 12, MESH_ANGLE);
  largeGear.position.set(-0.45, -0.2, 0);
  assembly.add(largeGear);

  const smallGear = buildGear(SMALL_RADIUS, 7, MESH_ANGLE + Math.PI - Math.PI / 7);
  smallGear.position.set(
    -0.45 + Math.cos(MESH_ANGLE) * centreDistance,
    -0.2 + Math.sin(MESH_ANGLE) * centreDistance,
    0
  );
  assembly.add(smallGear);

  const RATIO = 12 / 7;
  return {
    disposables,
    animate: (t) => {
      largeGear.rotation.z = t * 0.25;
      smallGear.rotation.z = -t * 0.25 * RATIO;
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

export default function ServiceHero3D({ variant }: { variant: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Only render 3D objects for discipline-specific services (electrical, mechanical, environmental)
    if (!['electrical', 'mechanical', 'environmental'].includes(variant)) {
      return;
    }

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

    const { disposables, animate } = builders[variant as ServiceVariant](rig);

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
