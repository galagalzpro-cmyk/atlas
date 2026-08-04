"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, PerspectiveCamera } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type AtlasPresenceState = "idle" | "listening" | "thinking" | "speaking";

export interface AtlasNeuralSceneProps {
  state: AtlasPresenceState;
  pointer: { x: number; y: number };
  intensity: number;
  hue: number;
}

function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 9283.133 + salt * 77.71) * 43758.5453;
  return value - Math.floor(value);
}

function NeuralBrain({ state, intensity, hue }: Omit<AtlasNeuralSceneProps, "pointer">) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const lineMaterial = useRef<THREE.LineBasicMaterial>(null);

  const geometry = useMemo(() => {
    const count = 760;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let index = 0; index < count; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const u = seeded(index, 1) * Math.PI * 2;
      const v = Math.acos(2 * seeded(index, 2) - 1);
      const fold = 1 + Math.sin(u * 7 + v * 5) * 0.08 + Math.sin(u * 13) * 0.035;
      const x = side * 0.2 + Math.sin(v) * Math.cos(u) * 1.55 * fold;
      const y = Math.cos(v) * 1.25 * fold + 0.35;
      const z = Math.sin(v) * Math.sin(u) * 1.15 * fold;
      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      color.setHSL(((hue + seeded(index, 3) * 34) % 360) / 360, 0.82, 0.58 + seeded(index, 4) * 0.24);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const connectionPositions: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const next = (index + 17 + (index % 11)) % count;
      if (seeded(index, 7) < 0.54) continue;
      connectionPositions.push(
        positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2],
        positions[next * 3], positions[next * 3 + 1], positions[next * 3 + 2],
      );
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(connectionPositions, 3));
    return { pointGeometry, lineGeometry };
  }, [hue]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (group.current) {
      const speed = state === "thinking" ? 0.19 : state === "speaking" ? 0.13 : 0.075;
      group.current.rotation.y = Math.sin(elapsed * speed) * 0.12;
      group.current.rotation.x = Math.cos(elapsed * 0.11) * 0.025;
      const pulse = 1 + Math.sin(elapsed * (state === "thinking" ? 3.8 : 1.6)) * (0.012 + intensity * 0.014);
      group.current.scale.setScalar(pulse);
    }
    if (material.current) {
      material.current.size = 0.016 + intensity * 0.012 + (state === "thinking" ? Math.sin(elapsed * 9) * 0.003 : 0);
      material.current.opacity = 0.66 + intensity * 0.28;
    }
    if (lineMaterial.current) {
      lineMaterial.current.opacity = 0.08 + intensity * 0.22 + (state === "thinking" ? Math.sin(elapsed * 4) * 0.035 : 0);
    }
  });

  return (
    <group ref={group} position={[0, 0.2, -1.2]} scale={1.22}>
      <points geometry={geometry.pointGeometry}>
        <pointsMaterial ref={material} size={0.022} vertexColors transparent opacity={0.82} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments geometry={geometry.lineGeometry}>
        <lineBasicMaterial ref={lineMaterial} color={new THREE.Color().setHSL(hue / 360, 0.78, 0.66)} transparent opacity={0.16} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

function RobotHead({ state, pointer, intensity, hue }: AtlasNeuralSceneProps) {
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Mesh>(null);
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const accent = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.78, 0.64), [hue]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (head.current) {
      const targetX = pointer.y * 0.18;
      const targetY = pointer.x * 0.34;
      head.current.rotation.x += (targetX - head.current.rotation.x) * 0.055;
      head.current.rotation.y += (targetY - head.current.rotation.y) * 0.055;
      head.current.position.y = Math.sin(elapsed * 0.85) * 0.035;
    }
    const speaking = state === "speaking";
    const listening = state === "listening";
    const thinking = state === "thinking";
    if (jaw.current) jaw.current.position.y = -0.83 - (speaking ? Math.abs(Math.sin(elapsed * 10.5)) * 0.09 : 0);
    const eyePulse = listening ? 1.4 : thinking ? 1 + Math.sin(elapsed * 5) * 0.22 : 1;
    leftEye.current?.scale.setScalar(eyePulse);
    rightEye.current?.scale.setScalar(eyePulse);
  });

  return (
    <Float speed={1.25} rotationIntensity={0.04} floatIntensity={0.11}>
      <group ref={head} position={[0, -0.03, 1.0]} scale={1.08}>
        <mesh scale={[0.96, 1.18, 0.86]}>
          <sphereGeometry args={[1, 96, 96]} />
          <meshPhysicalMaterial color="#d8d9dc" metalness={0.76} roughness={0.19} clearcoat={1} clearcoatRoughness={0.12} />
        </mesh>
        <mesh position={[0, 0.17, 0.79]} scale={[0.72, 0.54, 0.13]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial color="#0b0d12" metalness={0.92} roughness={0.12} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.78, 0.4]} rotation={[0.35, 0, 0]} scale={[0.64, 0.42, 0.18]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial color="#f0f1f2" metalness={0.7} roughness={0.16} />
        </mesh>
        <mesh position={[-0.29, 0.2, 0.9]} ref={leftEye}>
          <sphereGeometry args={[0.105, 36, 36]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
        <mesh position={[0.29, 0.2, 0.9]} ref={rightEye}>
          <sphereGeometry args={[0.105, 36, 36]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.18, 0.9]} scale={[0.09, 0.2, 0.08]}>
          <capsuleGeometry args={[0.36, 0.25, 8, 20]} />
          <meshPhysicalMaterial color="#b8bcc2" metalness={0.88} roughness={0.21} />
        </mesh>
        <mesh ref={jaw} position={[0, -0.83, 0.28]} scale={[0.68, 0.34, 0.58]}>
          <sphereGeometry args={[1, 56, 56]} />
          <meshPhysicalMaterial color="#c6c9cd" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.58, 0.82]} scale={[0.35, 0.035, 0.035]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={accent} transparent opacity={state === "speaking" ? 0.95 : 0.38} toneMapped={false} />
        </mesh>
        <mesh position={[-0.93, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.23, 0.23, 0.16, 32]} />
          <meshPhysicalMaterial color="#4b5059" metalness={0.95} roughness={0.18} />
        </mesh>
        <mesh position={[0.93, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.23, 0.23, 0.16, 32]} />
          <meshPhysicalMaterial color="#4b5059" metalness={0.95} roughness={0.18} />
        </mesh>
        <pointLight position={[0, 0.4, 1.5]} color={accent} intensity={3.4 + intensity * 3.8} distance={4.5} />
      </group>
    </Float>
  );
}

function Scene({ state, pointer, intensity, hue }: AtlasNeuralSceneProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.05, 6.3]} fov={38} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 5, 5]} intensity={3.8} color="#ffffff" />
      <directionalLight position={[-4, 1, 2]} intensity={2.1} color={new THREE.Color().setHSL(hue / 360, 0.74, 0.62)} />
      <NeuralBrain state={state} intensity={intensity} hue={hue} />
      <RobotHead state={state} pointer={pointer} intensity={intensity} hue={hue} />
      <Environment preset="studio" />
      <fog attach="fog" args={["#030306", 5.2, 10.5]} />
    </>
  );
}

export function AtlasNeuralScene(props: AtlasNeuralSceneProps) {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
      <Scene {...props} />
    </Canvas>
  );
}
