"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { useFrame, Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

const RAMP_LENGTH = 8;
const OBJECT_RADIUS = 0.5; // prominent size
const TRACK_OFFSET = 0.35;
const SLOWMO_DURATION = 3;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function getAccelerationDisk(angleDeg: number, g: number) {
  const θ = toRad(angleDeg);
  return (g * Math.sin(θ)) / 1.5;
}
function getAccelerationRing(angleDeg: number, g: number) {
  const θ = toRad(angleDeg);
  return (g * Math.sin(θ)) / 2;
}

interface SceneProps {
  angleDeg: number;
  mass: number;
  friction: number;
  onStatsChange: (stats: {
    sDisk: number;
    sRing: number;
    vDisk: number;
    vRing: number;
    winner: "disk" | "ring" | null;
  }) => void;
  resetKey: number;
}

export function RotationalInertiaScene3D({
  angleDeg,
  mass,
  friction,
  onStatsChange,
  resetKey,
}: SceneProps) {
  const timeRef = useRef(0);
  const sDiskRef = useRef(0);
  const sRingRef = useRef(0);
  const winnerRef = useRef<"disk" | "ring" | null>(null);
  const slowMoEndTimeRef = useRef(0);
  const lastStatsTimeRef = useRef(0);
  const trailDiskRef = useRef<THREE.Vector3[]>([]);
  const trailRingRef = useRef<THREE.Vector3[]>([]);
  const diskRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    timeRef.current = 0;
    sDiskRef.current = 0;
    sRingRef.current = 0;
    winnerRef.current = null;
    slowMoEndTimeRef.current = 0;
    trailDiskRef.current = [];
    trailRingRef.current = [];
  }, [resetKey, angleDeg, mass, friction]);

  const theta = useMemo(() => toRad(angleDeg), [angleDeg]);
  const g = 9.81;

  const trailMax = 40;
  const diskTrailLine = useMemo(() => {
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.BufferAttribute(new Float32Array(trailMax * 3), 3));
    const m = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
    return new THREE.Line(g2, m);
  }, []);
  const ringTrailLine = useMemo(() => {
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.BufferAttribute(new Float32Array(trailMax * 3), 3));
    const m = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
    return new THREE.Line(g2, m);
  }, []);

  useFrame((state, delta) => {
    const aD = getAccelerationDisk(angleDeg, g);
    const aR = getAccelerationRing(angleDeg, g);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    let animSpeed = 1;
    if (winnerRef.current !== null) {
      if (slowMoEndTimeRef.current === 0) {
        slowMoEndTimeRef.current = state.clock.elapsedTime + SLOWMO_DURATION;
      }
      if (state.clock.elapsedTime < slowMoEndTimeRef.current) {
        animSpeed = 0.25;
      }
    }

    const dt = Math.min(0.05, delta * animSpeed);
    timeRef.current += dt;
    const t = timeRef.current;
    const sDisk = Math.min(RAMP_LENGTH, 0.5 * aD * t * t);
    const sRing = Math.min(RAMP_LENGTH, 0.5 * aR * t * t);
    sDiskRef.current = sDisk;
    sRingRef.current = sRing;

    if (winnerRef.current === null) {
      if (sDisk >= RAMP_LENGTH) winnerRef.current = "disk";
      else if (sRing >= RAMP_LENGTH) winnerRef.current = "ring";
    }

    const vDisk = Math.sqrt(2 * aD * sDisk);
    const vRing = Math.sqrt(2 * aR * sRing);

    if (state.clock.elapsedTime - lastStatsTimeRef.current > 0.08) {
      lastStatsTimeRef.current = state.clock.elapsedTime;
      onStatsChange({
        sDisk,
        sRing,
        vDisk,
        vRing,
        winner: winnerRef.current,
      });
    }

    // Ramp high end at world (0,0,0); at distance s along slope: (0, -s*sin(θ), s*cos(θ))
    const diskX = -TRACK_OFFSET;
    const diskY = -sDisk * sinT;
    const diskZ = sDisk * cosT;
    const ringX = TRACK_OFFSET;
    const ringY = -sRing * sinT;
    const ringZ = sRing * cosT;

    if (diskRef.current) {
      diskRef.current.position.set(diskX, diskY, diskZ);
      diskRef.current.rotation.x = theta;
      diskRef.current.rotation.z = sDisk / OBJECT_RADIUS;
    }
    if (ringRef.current) {
      ringRef.current.position.set(ringX, ringY, ringZ);
      ringRef.current.rotation.x = theta;
      ringRef.current.rotation.z = sRing / OBJECT_RADIUS;
    }

    if (trailDiskRef.current.length < 40) {
      trailDiskRef.current.push(new THREE.Vector3(diskX, diskY, diskZ));
    } else {
      trailDiskRef.current.shift();
      trailDiskRef.current.push(new THREE.Vector3(diskX, diskY, diskZ));
    }
    if (trailRingRef.current.length < 40) {
      trailRingRef.current.push(new THREE.Vector3(ringX, ringY, ringZ));
    } else {
      trailRingRef.current.shift();
      trailRingRef.current.push(new THREE.Vector3(ringX, ringY, ringZ));
    }

    if (trailDiskRef.current.length > 1) {
      const trail = trailDiskRef.current;
      const arr = trail.flatMap((v) => [v.x, v.y, v.z]);
      const pos = diskTrailLine.geometry.attributes.position as THREE.BufferAttribute;
      (pos.array as Float32Array).set(arr);
      pos.needsUpdate = true;
      diskTrailLine.geometry.setDrawRange(0, trail.length);
    }
    if (trailRingRef.current.length > 1) {
      const trail = trailRingRef.current;
      const arr = trail.flatMap((v) => [v.x, v.y, v.z]);
      const pos = ringTrailLine.geometry.attributes.position as THREE.BufferAttribute;
      (pos.array as Float32Array).set(arr);
      pos.needsUpdate = true;
      ringTrailLine.geometry.setDrawRange(0, trail.length);
    }
  });

  const thetaMemo = theta;
  const rampRotation = useMemo(() => [Math.PI / 2 - thetaMemo, 0, 0] as [number, number, number], [thetaMemo]);
  const rampPosition = useMemo(
    () => [0, -4 * Math.sin(thetaMemo), 4 * Math.cos(thetaMemo)] as [number, number, number],
    [thetaMemo]
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />
      <Environment preset="studio" />

      {/* Ramp: wood PBR */}
      <mesh
        rotation={rampRotation}
        position={rampPosition}
        receiveShadow
        castShadow
      >
        <planeGeometry args={[2, RAMP_LENGTH]} />
        <meshStandardMaterial
          color="#8B5A2B"
          roughness={0.7}
          metalness={0.05}
          envMapIntensity={0.4}
        />
      </mesh>

      {/* Motion trails (primitive to avoid SVG line conflict) */}
      <primitive object={diskTrailLine} />
      <primitive object={ringTrailLine} />

      {/* Disk: metallic blue */}
      <mesh ref={diskRef} castShadow>
        <cylinderGeometry args={[OBJECT_RADIUS, OBJECT_RADIUS, 0.15, 32]} />
        <meshStandardMaterial
          color="#2563EB"
          metalness={0.6}
          roughness={0.2}
          envMapIntensity={1}
        />
      </mesh>

      {/* Ring: glowing cyan */}
      <mesh ref={ringRef} castShadow>
        <torusGeometry args={[OBJECT_RADIUS, 0.12, 16, 32]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Finish line indicator */}
      <mesh position={[0, -4 * Math.sin(thetaMemo), 4 * Math.cos(thetaMemo)]} rotation={rampRotation}>
        <planeGeometry args={[2.2, 0.2]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.9} />
      </mesh>
    </>
  );
}

/** Wrapper that provides Canvas for use in pages with SSR (e.g. Next.js). */
export function RotationalInertia3DView(props: SceneProps) {
  return (
    <Canvas
      camera={{ position: [12, 8, 15], fov: 45 }}
      shadows
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <RotationalInertiaScene3D {...props} />
    </Canvas>
  );
}
