'use client';

import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

interface SkillNodeData {
  label: string;
  shortLabel: string;
  score: number;
  color: string;
  angle: number;
  radius: number;
}

const NODE_DATA: SkillNodeData[] = [
  { label: 'Algorithmic & Problem Solving', shortLabel: 'Problem Solving', score: 72, color: '#22d3ee', angle: -Math.PI / 2, radius: 8 },
  { label: 'Software Engineering & Projects', shortLabel: 'Engineering', score: 68, color: '#10b981', angle: -Math.PI / 6, radius: 8 },
  { label: 'Deliberate Practice Consistency', shortLabel: 'Consistency', score: 65, color: '#f59e0b', angle: Math.PI / 6, radius: 8 },
  { label: 'Debugging Grit & Depth', shortLabel: 'Depth & Grit', score: 70, color: '#ef4444', angle: Math.PI * 5 / 6, radius: 8 },
  { label: 'Academic Trajectory', shortLabel: 'Academics', score: 75, color: '#a855f7', angle: Math.PI * 7 / 6, radius: 8 },
  { label: '16-Week Growth Velocity', shortLabel: 'Growth Velocity', score: 60, color: '#ec4899', angle: Math.PI * 3 / 2, radius: 8 },
];

export function HeroHologram() {
  const { config } = useQuality();
  
  const hologramRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const splinesRef = useRef<THREE.CatmullRomCurve3[]>([]);
  const particlesRef = useRef<THREE.Points[]>([]);
  const timeRef = useRef(0);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.6, 0), []);
  const ringGeometry = useMemo(() => new THREE.RingGeometry(7.5, 8.5, 64), []);
  const coreGeometry = useMemo(() => new THREE.OctahedronGeometry(2, 0), []);
  const particleGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = config.particles;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 7 + Math.random() * 2;
      const height = (Math.random() - 0.5) * 4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1.0;
      sizes[i] = Math.random() * 2 + 1;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [config.particles]);

  const coreMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#07090e',
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.8,
    thickness: 0.5,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  }), []);

  const ringMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#22d3ee',
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  }), []);

  const nodeMaterials = useMemo(() => NODE_DATA.map(d => new THREE.MeshPhysicalMaterial({
    color: d.color,
    metalness: 0.3,
    roughness: 0.2,
    emissive: d.color,
    emissiveIntensity: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })), []);

  const particleMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const splineMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: '#22d3ee',
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (hologramRef.current) {
      hologramRef.current.rotation.y = t * 0.05;
    }

    nodesRef.current.forEach((node, i) => {
      const data = NODE_DATA[i];
      const pulse = Math.sin(t * 3 + i) * 0.1 + 1;
      node.scale.setScalar(pulse);
      ((node.material as THREE.MeshPhysicalMaterial).emissiveIntensity) = 0.4 + Math.sin(t * 4 + i) * 0.2;
    });

    particlesRef.current.forEach((particles) => {
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += delta * 0.5;
        if (positions[i + 1] > 2) positions[i + 1] = -2;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += delta * 0.02;
    });
  });

  if (!config.postProcessing) {
    return <SimpleHologram />;
  }

  return (
    <group ref={hologramRef} name="hero-hologram">
      <mesh geometry={coreGeometry} material={coreMaterial} name="core" castShadow receiveShadow />
      <mesh geometry={ringGeometry} material={ringMaterial} name="ring" rotation={[-Math.PI / 2, 0, 0]} />
      
      {NODE_DATA.map((data, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) nodesRef.current[i] = el; }}
          geometry={geometry}
          material={nodeMaterials[i]}
          position={[
            Math.cos(data.angle) * data.radius,
            Math.sin(i) * 0.5,
            Math.sin(data.angle) * data.radius
          ]}
          name={`node-${i}`}
          castShadow
          receiveShadow
        />
      ))}

      {NODE_DATA.map((data, i) => {
        const nextData = NODE_DATA[(i + 1) % NODE_DATA.length];
        const spline = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(data.angle) * data.radius, 0, Math.sin(data.angle) * data.radius),
          new THREE.Vector3(0, 3, 0),
          new THREE.Vector3(Math.cos(nextData.angle) * nextData.radius, 0, Math.sin(nextData.angle) * nextData.radius),
        ]);
        splinesRef.current[i] = spline;
        
        const points = spline.getPoints(50);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineObject = new THREE.Line(lineGeometry, splineMaterial);
        lineObject.name = `spline-${i}`;

        return <primitive key={`spline-${i}`} object={lineObject} />;
      })}

      <points geometry={particleGeometry} material={particleMaterial} name="ambient-particles" />
      
      <Html
        position={[0, 5, 0]}
        occlude
        transform
        sprite
        distanceFactor={20}
        fullscreen
        prepend
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center text-white">
          <div className="font-mono text-3xl font-bold text-emerald-400">78</div>
          <div className="text-xs text-slate-400 mt-1">Skill DNA</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">±3 pts · 87% coverage</div>
        </div>
      </Html>
    </group>
  );
}

function SimpleHologram() {
  
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.03;
    }
  });

  return (
    <group ref={groupRef} name="simple-hologram">
      <mesh>
        <octahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.5} />
      </mesh>
      <Html
        position={[0, 4, 0]}
        occlude
        transform
        sprite
        distanceFactor={20}
        fullscreen
        prepend
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center text-white">
          <div className="font-mono text-3xl font-bold text-emerald-400">78</div>
          <div className="text-xs text-slate-400 mt-1">Skill DNA</div>
        </div>
      </Html>
    </group>
  );
}

