"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/Fox.glb";

function FoxModel() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, names } = useAnimations(animations, group);
  const pointer = useRef({ x: 0, y: 0 });
  const { size } = useThree();
  const [activeIdx, setActiveIdx] = useState(0);

  const clipNames = useMemo(() => {
    const preferred = ["Survey", "Walk", "Run"];
    const ordered = preferred.filter((n) => names.includes(n));
    return ordered.length ? ordered : names;
  }, [names]);

  useEffect(() => {
    if (!clipNames.length) return;
    const current = actions[clipNames[activeIdx]];
    current?.reset().fadeIn(0.5).play();

    const dwell =
      clipNames[activeIdx] === "Survey"
        ? 4500 + Math.random() * 2500
        : 3500 + Math.random() * 1500;
    const id = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % clipNames.length);
    }, dwell);

    return () => {
      clearTimeout(id);
      current?.fadeOut(0.5);
    };
  }, [actions, clipNames, activeIdx]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / size.width) * 2 - 1;
      pointer.current.y = -(e.clientY / size.height) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [size.width, size.height]);

  useFrame((state, delta) => {
    if (!group.current || !inner.current) return;
    const t = state.clock.elapsedTime;

    const maxYaw = THREE.MathUtils.degToRad(20);
    const maxPitch = THREE.MathUtils.degToRad(12);
    const targetY = pointer.current.x * maxYaw + Math.sin(t * 0.4) * 0.08;
    const targetX = -pointer.current.y * maxPitch + Math.sin(t * 0.7) * 0.04;

    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetY,
      4,
      delta
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      targetX,
      4,
      delta
    );
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      Math.sin(t * 0.5) * 0.05,
      3,
      delta
    );

    const bob = Math.sin(t * 1.6) * 0.04;
    const sway = Math.sin(t * 0.8) * 0.08;
    inner.current.position.y = -0.6 + bob;
    inner.current.position.x = sway;
    inner.current.scale.setScalar(0.018 * (1 + Math.sin(t * 2.2) * 0.012));
  });

  return (
    <group ref={group} dispose={null}>
      <group ref={inner} position={[0, -0.6, 0]} scale={0.018}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export function Fox3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 4], fov: 35 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#8FB1E8" />
      <Suspense fallback={null}>
        <FoxModel />
      </Suspense>
    </Canvas>
  );
}
