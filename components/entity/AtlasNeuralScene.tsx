"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type AtlasPresenceState = "idle" | "listening" | "thinking" | "speaking";

export interface AtlasNeuralSceneProps {
  state: AtlasPresenceState;
  pointer: { x: number; y: number };
  intensity: number;
  hue: number;
}

type BrainField = {
  points: THREE.BufferGeometry;
  connections: THREE.BufferGeometry;
  pulseStarts: Float32Array;
  pulseEnds: Float32Array;
  pulsePhases: Float32Array;
};

const CORTEX_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vView;

  void main() {
    vec3 displaced = position;
    float macroFold = sin(position.y * 17.0 + position.z * 9.0 + uTime * 0.12);
    float microFold = sin(position.x * 31.0 - position.y * 21.0 + position.z * 13.0);
    float ridge = macroFold * 0.035 + microFold * 0.016;
    displaced += normal * ridge * (0.72 + uIntensity * 0.65);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vPosition = displaced;
    vView = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const CORTEX_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vView;

  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.35);
    float folds = sin(vPosition.y * 23.0 + vPosition.z * 13.0 + uTime * 0.18);
    folds *= sin(vPosition.x * 29.0 - vPosition.z * 19.0);
    float active = smoothstep(0.52, 0.94, folds * 0.5 + 0.5);
    vec3 base = uColor * (0.10 + fresnel * 0.62);
    vec3 signal = uColor * active * (0.18 + uIntensity * 0.52);
    gl_FragColor = vec4(base + signal, uOpacity * (0.22 + fresnel * 0.72 + active * 0.18));
  }
`;

function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 9283.133 + salt * 77.71) * 43758.5453;
  return value - Math.floor(value);
}

function makeBrainField(hue: number): BrainField {
  const count = 2800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const hemispheres = new Int8Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    hemispheres[index] = side;
    const theta = seeded(index, 1) * Math.PI * 2;
    const phi = Math.acos(2 * seeded(index, 2) - 1);
    const sx = Math.sin(phi) * Math.cos(theta);
    const sy = Math.cos(phi);
    const sz = Math.sin(phi) * Math.sin(theta);
    const corticalFold = 1
      + Math.sin(theta * 11 + phi * 7) * 0.055
      + Math.sin(theta * 23 - phi * 13) * 0.024;
    const x = side * (0.2 + Math.abs(sx) * 1.52 * corticalFold);
    const y = sy * 1.28 * corticalFold + 0.42;
    const z = sz * 1.14 * corticalFold - 0.52;
    const offset = index * 3;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    color.setHSL(((hue + seeded(index, 3) * 48 - 12) % 360) / 360, 0.88, 0.5 + seeded(index, 4) * 0.32);
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const connectionPositions: number[] = [];
  const pulsePairs: Array<[number, number]> = [];
  const offsets = [17, 41, 89, 173];
  for (let index = 0; index < count; index += 1) {
    for (const offsetIndex of offsets) {
      const next = (index + offsetIndex + (index % 13)) % count;
      if (hemispheres[index] !== hemispheres[next]) continue;
      const a = index * 3;
      const b = next * 3;
      const distance = Math.hypot(
        positions[a] - positions[b],
        positions[a + 1] - positions[b + 1],
        positions[a + 2] - positions[b + 2],
      );
      if (distance > 0.48 || seeded(index + next, offsetIndex) < 0.46) continue;
      connectionPositions.push(
        positions[a], positions[a + 1], positions[a + 2],
        positions[b], positions[b + 1], positions[b + 2],
      );
      if (pulsePairs.length < 220 && seeded(index, offsetIndex + 9) > 0.82) pulsePairs.push([index, next]);
    }
  }

  for (let bridge = 0; bridge < 120; bridge += 1) {
    const left = (bridge * 22) % count;
    const right = (left + 1) % count;
    if (hemispheres[left] === hemispheres[right]) continue;
    const a = left * 3;
    const b = right * 3;
    if (Math.abs(positions[a + 1] - positions[b + 1]) > 0.44) continue;
    connectionPositions.push(
      positions[a], positions[a + 1], positions[a + 2],
      positions[b], positions[b + 1], positions[b + 2],
    );
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(connectionPositions, 3));

  const pulseStarts = new Float32Array(pulsePairs.length * 3);
  const pulseEnds = new Float32Array(pulsePairs.length * 3);
  const pulsePhases = new Float32Array(pulsePairs.length);
  pulsePairs.forEach(([start, end], index) => {
    pulseStarts.set(positions.slice(start * 3, start * 3 + 3), index * 3);
    pulseEnds.set(positions.slice(end * 3, end * 3 + 3), index * 3);
    pulsePhases[index] = seeded(index, 31);
  });

  return { points: pointGeometry, connections: lineGeometry, pulseStarts, pulseEnds, pulsePhases };
}

function CorticalLobe({ side, state, intensity, hue }: { side: -1 | 1; state: AtlasPresenceState; intensity: number; hue: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uOpacity: { value: 0.46 },
    uColor: { value: new THREE.Color().setHSL(hue / 360, 0.84, 0.58) },
  }), [hue, intensity]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (material.current) {
      material.current.uniforms.uTime.value = elapsed;
      material.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(material.current.uniforms.uIntensity.value, intensity, 0.08);
      material.current.uniforms.uOpacity.value = state === "thinking" ? 0.7 : state === "listening" ? 0.58 : 0.46;
    }
    if (mesh.current) {
      mesh.current.rotation.y = side * Math.sin(elapsed * 0.12) * 0.018;
      const pulse = 1 + Math.sin(elapsed * (state === "thinking" ? 4.2 : 1.4) + side) * (0.008 + intensity * 0.008);
      mesh.current.scale.set(1.52 * pulse, 1.3 * pulse, 1.08 * pulse);
    }
  });

  return (
    <mesh ref={mesh} position={[side * 0.76, 0.43, -0.55]} scale={[1.52, 1.3, 1.08]}>
      <icosahedronGeometry args={[1, 7]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={CORTEX_VERTEX}
        fragmentShader={CORTEX_FRAGMENT}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function NeuralPulses({ field, state, intensity, hue }: { field: BrainField; state: AtlasPresenceState; intensity: number; hue: number }) {
  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(new Float32Array(field.pulsePhases.length * 3), 3));
    return value;
  }, [field]);
  const material = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    const speed = state === "thinking" ? 0.92 : state === "speaking" ? 0.68 : state === "listening" ? 0.52 : 0.34;
    for (let index = 0; index < field.pulsePhases.length; index += 1) {
      const t = (elapsed * speed + field.pulsePhases[index]) % 1;
      const offset = index * 3;
      const ease = t * t * (3 - 2 * t);
      attribute.setXYZ(
        index,
        THREE.MathUtils.lerp(field.pulseStarts[offset], field.pulseEnds[offset], ease),
        THREE.MathUtils.lerp(field.pulseStarts[offset + 1], field.pulseEnds[offset + 1], ease),
        THREE.MathUtils.lerp(field.pulseStarts[offset + 2], field.pulseEnds[offset + 2], ease),
      );
    }
    attribute.needsUpdate = true;
    if (material.current) {
      material.current.size = 0.022 + intensity * 0.025 + (state === "thinking" ? Math.sin(elapsed * 9) * 0.004 : 0);
      material.current.opacity = 0.65 + intensity * 0.3;
    }
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={material}
        color={new THREE.Color().setHSL(hue / 360, 0.95, 0.76)}
        size={0.04}
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function NeuralBrain({ state, intensity, hue }: Omit<AtlasNeuralSceneProps, "pointer">) {
  const group = useRef<THREE.Group>(null);
  const pointMaterial = useRef<THREE.PointsMaterial>(null);
  const lineMaterial = useRef<THREE.LineBasicMaterial>(null);
  const field = useMemo(() => makeBrainField(hue), [hue]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(elapsed * 0.09) * 0.045;
      group.current.rotation.x = Math.cos(elapsed * 0.075) * 0.012;
      const scale = 1 + Math.sin(elapsed * (state === "thinking" ? 4.1 : 1.35)) * (0.004 + intensity * 0.008);
      group.current.scale.setScalar(scale);
    }
    if (pointMaterial.current) {
      pointMaterial.current.size = 0.012 + intensity * 0.012;
      pointMaterial.current.opacity = state === "thinking" ? 0.96 : 0.74 + intensity * 0.16;
    }
    if (lineMaterial.current) {
      lineMaterial.current.opacity = 0.06 + intensity * 0.15 + (state === "thinking" ? Math.sin(elapsed * 5) * 0.025 : 0);
    }
  });

  return (
    <group ref={group} position={[0, 0.02, -0.35]} scale={1.42}>
      <CorticalLobe side={-1} state={state} intensity={intensity} hue={hue} />
      <CorticalLobe side={1} state={state} intensity={intensity} hue={hue} />
      <points geometry={field.points}>
        <pointsMaterial
          ref={pointMaterial}
          size={0.019}
          vertexColors
          transparent
          opacity={0.86}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
      <lineSegments geometry={field.connections}>
        <lineBasicMaterial
          ref={lineMaterial}
          color={new THREE.Color().setHSL(hue / 360, 0.82, 0.66)}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <NeuralPulses field={field} state={state} intensity={intensity} hue={hue} />
    </group>
  );
}

function FaceCircuit({ points, color, opacity = 0.8 }: { points: Array<[number, number, number]>; color: THREE.Color; opacity?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 36, 0.009, 7, false]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

function EyeAssembly({ side, state, pointer, accent }: { side: -1 | 1; state: AtlasPresenceState; pointer: { x: number; y: number }; accent: THREE.Color }) {
  const assembly = useRef<THREE.Group>(null);
  const iris = useRef<THREE.Mesh>(null);
  const lid = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const blinkClock = (elapsed + (side === 1 ? 0.025 : 0)) % 5.4;
    const blink = blinkClock > 5.16 ? Math.max(0.06, Math.abs(blinkClock - 5.28) / 0.12) : 1;
    if (assembly.current) assembly.current.scale.y = blink;
    if (iris.current) {
      iris.current.position.x = THREE.MathUtils.lerp(iris.current.position.x, pointer.x * 0.045, 0.1);
      iris.current.position.y = THREE.MathUtils.lerp(iris.current.position.y, pointer.y * 0.035, 0.1);
      const focus = state === "listening" ? 1.18 : state === "thinking" ? 0.88 + Math.sin(elapsed * 5.8) * 0.08 : 1;
      iris.current.scale.setScalar(focus);
    }
    if (lid.current) lid.current.rotation.z = state === "thinking" ? side * 0.08 : 0;
  });

  return (
    <group ref={assembly} position={[side * 0.31, 0.2, 0.92]}>
      <mesh scale={[1.45, 0.78, 0.38]}>
        <sphereGeometry args={[0.18, 48, 32]} />
        <meshPhysicalMaterial color="#01050a" metalness={0.98} roughness={0.08} clearcoat={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.018, 16, 72]} />
        <meshPhysicalMaterial color="#8e99a8" metalness={1} roughness={0.13} />
      </mesh>
      <mesh ref={iris} position={[0, 0, 0.145]}>
        <circleGeometry args={[0.095, 64]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.16]}>
        <circleGeometry args={[0.038, 48]} />
        <meshBasicMaterial color="#f6fbff" toneMapped={false} />
      </mesh>
      <mesh ref={lid} position={[0, 0.095, 0.15]} rotation={[0, 0, side * 0.015]} scale={[1.6, 0.17, 0.28]}>
        <sphereGeometry args={[0.18, 36, 24]} />
        <meshPhysicalMaterial color="#cfd5dc" metalness={0.84} roughness={0.16} />
      </mesh>
      <pointLight position={[0, 0, 0.32]} color={accent} intensity={state === "listening" ? 3.6 : 2.2} distance={1.25} />
    </group>
  );
}

function InternalCognition({ state, intensity, accent }: { state: AtlasPresenceState; intensity: number; accent: THREE.Color }) {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo(() => Array.from({ length: 90 }, (_, index) => {
    const theta = seeded(index, 55) * Math.PI * 2;
    const phi = Math.acos(2 * seeded(index, 56) - 1);
    const radius = 0.33 + seeded(index, 57) * 0.2;
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * radius,
      Math.cos(phi) * radius * 0.82,
      Math.sin(phi) * Math.sin(theta) * radius,
    );
  }), []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const elapsed = clock.getElapsedTime();
    group.current.rotation.y = elapsed * (state === "thinking" ? 0.48 : 0.12);
    group.current.rotation.x = Math.sin(elapsed * 0.23) * 0.16;
    const scale = 1 + Math.sin(elapsed * 3.2) * 0.025 * intensity;
    group.current.scale.setScalar(scale);
  });

  return (
    <group ref={group} position={[0, 0.52, 0.02]}>
      {nodes.map((position, index) => (
        <mesh key={index} position={position} scale={0.025 + seeded(index, 61) * 0.025}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color={accent} transparent opacity={0.5 + intensity * 0.4} toneMapped={false} />
        </mesh>
      ))}
      <mesh>
        <icosahedronGeometry args={[0.28, 3]} />
        <meshPhysicalMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={state === "thinking" ? 3.4 : 1.4}
          transparent
          opacity={0.24}
          wireframe
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function RobotHead({ state, pointer, intensity, hue }: AtlasNeuralSceneProps) {
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  const leftBrow = useRef<THREE.Mesh>(null);
  const rightBrow = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.MeshBasicMaterial>(null);
  const neck = useRef<THREE.Group>(null);
  const accent = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.86, 0.64), [hue]);
  const accentSoft = useMemo(() => new THREE.Color().setHSL(((hue + 24) % 360) / 360, 0.72, 0.76), [hue]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (head.current) {
      const targetX = -pointer.y * 0.13 + Math.sin(elapsed * 0.21) * 0.012;
      const targetY = pointer.x * 0.25 + Math.sin(elapsed * 0.16) * 0.022;
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, targetX, 0.055);
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, targetY, 0.055);
      head.current.position.y = Math.sin(elapsed * 0.72) * 0.025;
    }
    if (jaw.current) {
      const speech = state === "speaking" ? 0.04 + Math.abs(Math.sin(elapsed * 11.8)) * 0.095 : 0;
      jaw.current.position.y = THREE.MathUtils.lerp(jaw.current.position.y, -0.7 - speech, 0.25);
      jaw.current.rotation.x = speech * 0.32;
    }
    if (leftBrow.current && rightBrow.current) {
      const thinkingAngle = state === "thinking" ? 0.11 : state === "listening" ? -0.045 : 0.025;
      leftBrow.current.rotation.z = THREE.MathUtils.lerp(leftBrow.current.rotation.z, thinkingAngle, 0.1);
      rightBrow.current.rotation.z = THREE.MathUtils.lerp(rightBrow.current.rotation.z, -thinkingAngle, 0.1);
    }
    if (mouth.current) {
      mouth.current.opacity = state === "speaking" ? 0.62 + Math.abs(Math.sin(elapsed * 10.8)) * 0.38 : state === "listening" ? 0.46 : 0.2;
    }
    if (neck.current) neck.current.rotation.y = head.current?.rotation.y ? head.current.rotation.y * 0.24 : 0;
  });

  const metal = "#aeb5bf";
  const ceramic = "#e7ebf0";
  const dark = "#080b10";

  return (
    <Float speed={0.78} rotationIntensity={0.015} floatIntensity={0.05}>
      <group position={[0, -0.08, 1.08]}>
        <group ref={neck} position={[0, -1.24, -0.02]}>
          {[0, 1, 2, 3].map((index) => (
            <mesh key={index} position={[0, index * 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.43 - index * 0.025, 0.055, 14, 64]} />
              <meshPhysicalMaterial color={index % 2 ? dark : metal} metalness={0.96} roughness={0.15} />
            </mesh>
          ))}
          <mesh position={[0, -0.18, 0]} scale={[0.8, 0.25, 0.62]}>
            <sphereGeometry args={[1, 48, 32]} />
            <meshPhysicalMaterial color="#171c23" metalness={0.92} roughness={0.18} />
          </mesh>
        </group>

        <group ref={head}>
          <mesh scale={[0.84, 1.04, 0.78]}>
            <sphereGeometry args={[1, 128, 96]} />
            <meshPhysicalMaterial color={dark} metalness={0.98} roughness={0.11} clearcoat={1} clearcoatRoughness={0.08} />
          </mesh>
          <mesh position={[0, 0.53, -0.02]} scale={[0.87, 0.7, 0.79]}>
            <sphereGeometry args={[1, 112, 72, 0, Math.PI * 2, 0, Math.PI * 0.64]} />
            <meshPhysicalMaterial
              color={ceramic}
              metalness={0.68}
              roughness={0.15}
              clearcoat={1}
              clearcoatRoughness={0.07}
              transparent
              opacity={0.86}
              iridescence={0.25}
            />
          </mesh>
          <InternalCognition state={state} intensity={intensity} accent={accent} />

          <RoundedBox args={[1.15, 0.48, 0.16]} radius={0.16} smoothness={7} position={[0, 0.48, 0.74]} rotation={[-0.12, 0, 0]}>
            <meshPhysicalMaterial color={ceramic} metalness={0.72} roughness={0.14} clearcoat={1} />
          </RoundedBox>
          <mesh position={[0, 0.12, 0.76]} scale={[0.73, 0.5, 0.16]}>
            <sphereGeometry args={[1, 96, 64]} />
            <meshPhysicalMaterial color="#02070c" metalness={0.98} roughness={0.05} clearcoat={1} />
          </mesh>

          <EyeAssembly side={-1} state={state} pointer={pointer} accent={accent} />
          <EyeAssembly side={1} state={state} pointer={pointer} accent={accent} />

          <RoundedBox ref={leftBrow} args={[0.48, 0.1, 0.1]} radius={0.04} smoothness={5} position={[-0.31, 0.48, 0.91]} rotation={[0, 0, 0.025]}>
            <meshPhysicalMaterial color={metal} metalness={0.92} roughness={0.13} />
          </RoundedBox>
          <RoundedBox ref={rightBrow} args={[0.48, 0.1, 0.1]} radius={0.04} smoothness={5} position={[0.31, 0.48, 0.91]} rotation={[0, 0, -0.025]}>
            <meshPhysicalMaterial color={metal} metalness={0.92} roughness={0.13} />
          </RoundedBox>

          <RoundedBox args={[0.16, 0.42, 0.18]} radius={0.07} smoothness={6} position={[0, -0.16, 0.88]} rotation={[0.03, 0, 0]}>
            <meshPhysicalMaterial color={metal} metalness={0.92} roughness={0.16} />
          </RoundedBox>

          {([-1, 1] as const).map((side) => (
            <group key={side}>
              <RoundedBox args={[0.43, 0.49, 0.16]} radius={0.13} smoothness={7} position={[side * 0.49, -0.25, 0.72]} rotation={[0.04, side * -0.18, side * -0.09]}>
                <meshPhysicalMaterial color={ceramic} metalness={0.72} roughness={0.15} clearcoat={1} />
              </RoundedBox>
              <RoundedBox args={[0.26, 0.58, 0.14]} radius={0.1} smoothness={6} position={[side * 0.72, 0.02, 0.48]} rotation={[0, side * 0.42, side * -0.08]}>
                <meshPhysicalMaterial color={metal} metalness={0.9} roughness={0.16} />
              </RoundedBox>
              <mesh position={[side * 0.87, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.25, 0.25, 0.19, 48]} />
                <meshPhysicalMaterial color="#3d4652" metalness={0.98} roughness={0.12} />
              </mesh>
              <mesh position={[side * 0.98, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.17, 0.035, 12, 56]} />
                <meshBasicMaterial color={accent} transparent opacity={state === "listening" ? 0.95 : 0.36} toneMapped={false} />
              </mesh>
            </group>
          ))}

          <group ref={jaw} position={[0, -0.7, 0]}>
            <RoundedBox args={[0.82, 0.32, 0.54]} radius={0.17} smoothness={8} position={[0, 0, 0.28]}>
              <meshPhysicalMaterial color={metal} metalness={0.84} roughness={0.17} clearcoat={0.8} />
            </RoundedBox>
            <RoundedBox args={[0.56, 0.16, 0.17]} radius={0.07} smoothness={5} position={[0, 0.18, 0.6]}>
              <meshPhysicalMaterial color="#060a10" metalness={0.98} roughness={0.08} />
            </RoundedBox>
            <mesh position={[0, 0.18, 0.7]} scale={[0.42, 0.035, 0.02]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial ref={mouth} color={accentSoft} transparent opacity={0.25} toneMapped={false} />
            </mesh>
          </group>

          <FaceCircuit points={[[-0.7, 0.33, 0.66], [-0.55, 0.62, 0.7], [-0.24, 0.76, 0.74], [0, 0.78, 0.75]]} color={accent} opacity={0.54} />
          <FaceCircuit points={[[0.7, 0.33, 0.66], [0.55, 0.62, 0.7], [0.24, 0.76, 0.74], [0, 0.78, 0.75]]} color={accent} opacity={0.54} />
          <FaceCircuit points={[[-0.7, -0.16, 0.62], [-0.58, -0.4, 0.66], [-0.36, -0.58, 0.7]]} color={accentSoft} opacity={0.35} />
          <FaceCircuit points={[[0.7, -0.16, 0.62], [0.58, -0.4, 0.66], [0.36, -0.58, 0.7]]} color={accentSoft} opacity={0.35} />

          <pointLight position={[0, 0.3, 1.55]} color={accent} intensity={2.8 + intensity * 4.4} distance={4.2} />
        </group>
      </group>
    </Float>
  );
}

function AtmosphericField({ hue, intensity }: { hue: number; intensity: number }) {
  const points = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(900 * 3);
    for (let index = 0; index < 900; index += 1) {
      const radius = 4 + seeded(index, 81) * 9;
      const theta = seeded(index, 82) * Math.PI * 2;
      const phi = Math.acos(2 * seeded(index, 83) - 1);
      positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[index * 3 + 1] = Math.cos(phi) * radius;
      positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 2;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);
  const material = useRef<THREE.PointsMaterial>(null);
  const group = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.getElapsedTime() * 0.006;
    if (material.current) material.current.opacity = 0.16 + intensity * 0.15;
  });

  return (
    <points ref={group} geometry={points}>
      <pointsMaterial ref={material} color={new THREE.Color().setHSL(hue / 360, 0.72, 0.7)} size={0.016} transparent opacity={0.24} depthWrite={false} toneMapped={false} />
    </points>
  );
}

function Scene({ state, pointer, intensity, hue }: AtlasNeuralSceneProps) {
  const keyColor = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.72, 0.64), [hue]);
  const rimColor = useMemo(() => new THREE.Color().setHSL(((hue + 42) % 360) / 360, 0.8, 0.66), [hue]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.08, 7.3]} fov={34} />
      <color attach="background" args={["#010205"]} />
      <fog attach="fog" args={["#010205", 6.2, 15]} />
      <ambientLight intensity={0.12} />
      <hemisphereLight color="#dbeeff" groundColor="#020307" intensity={0.55} />
      <spotLight position={[4.8, 6.4, 6.5]} angle={0.38} penumbra={0.72} intensity={85} color="#f5f8ff" distance={18} />
      <spotLight position={[-5.2, 1.8, 4.2]} angle={0.52} penumbra={0.85} intensity={58} color={keyColor} distance={16} />
      <spotLight position={[4.6, -2.2, 2.4]} angle={0.56} penumbra={0.8} intensity={34} color={rimColor} distance={14} />
      <AtmosphericField hue={hue} intensity={intensity} />
      <NeuralBrain state={state} intensity={intensity} hue={hue} />
      <RobotHead state={state} pointer={pointer} intensity={intensity} hue={hue} />
      <EffectComposer multisampling={4}>
        <Bloom intensity={1.18 + intensity * 0.72} luminanceThreshold={0.42} luminanceSmoothing={0.24} mipmapBlur />
        <Vignette eskil={false} offset={0.18} darkness={0.72} />
      </EffectComposer>
    </>
  );
}

export function AtlasNeuralScene(props: AtlasNeuralSceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
