'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

interface DimensionData {
  id: string;
  label: string;
  shortLabel: string;
  score: number;
  weightPct: number;
  confidence: 'High' | 'Moderate' | 'Low';
  color: string;
  description: string;
  evidenceCount: string;
  angle: number;
  radius: number;
}

const DIMENSIONS: DimensionData[] = [
  { id: 'problem_solving', label: 'Algorithmic & Problem Solving', shortLabel: 'Problem Solving', score: 72, weightPct: 30, confidence: 'High', color: '#22d3ee', description: 'Based on 80th-percentile accepted difficulty (1420), 8 core topic tags, and 4 contests.', evidenceCount: '47 solves · P80 1420', angle: -Math.PI / 2, radius: 12 },
  { id: 'engineering', label: 'Software Engineering & Projects', shortLabel: 'Engineering', score: 68, weightPct: 25, confidence: 'Moderate', color: '#10b981', description: 'Evaluates original non-fork repositories (12), multi-day commit cadence, build manifests, and test/CI presence.', evidenceCount: '3 multi-week repos · 156 commits', angle: -Math.PI / 6, radius: 12 },
  { id: 'consistency', label: 'Deliberate Practice Consistency', shortLabel: 'Consistency', score: 65, weightPct: 15, confidence: 'High', color: '#f59e0b', description: 'Measures active coding weeks over the last 16 weeks alongside 87% academic attendance discipline.', evidenceCount: '12/16 active weeks · 87% attendance', angle: Math.PI / 6, radius: 12 },
  { id: 'depth_persistence', label: 'Debugging Grit & Depth', shortLabel: 'Depth & Grit', score: 70, weightPct: 15, confidence: 'Moderate', color: '#ef4444', description: 'Tracks willingness to wrestle with hard problems above your median (1380) and resolve failed attempts.', evidenceCount: '34% retry-to-AC persistence', angle: Math.PI * 5 / 6, radius: 12 },
  { id: 'academics', label: 'Academic Trajectory', shortLabel: 'Academics', score: 75, weightPct: 10, confidence: 'High', color: '#a855f7', description: 'Longitudinal SGPA trend (8.6/10) and attendance stability across 2 recorded semester(s).', evidenceCount: '8.6 CGPA · 2 sem(s)', angle: Math.PI * 7 / 6, radius: 12 },
  { id: 'growth_velocity', label: '16-Week Growth Velocity', shortLabel: 'Growth Velocity', score: 60, weightPct: 5, confidence: 'Moderate', color: '#ec4899', description: 'Non-parametric Theil-Sen trajectory slope (+0.42 pts/wk) and difficulty progression.', evidenceCount: 'Theil-Sen +0.42/wk', angle: Math.PI * 3 / 2, radius: 12 },
];

export function DimensionNodes() {
  const { config } = useQuality();
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const orbitsRef = useRef<THREE.Mesh[]>([]);
  const labelsRef = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const nodeGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.8, 0), []);
  const orbitGeometry = useMemo(() => new THREE.RingGeometry(11.5, 12.5, 64), []);
  const pulseGeometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);

  const orbitMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#334155',
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  }), []);

  const nodeMaterials = useMemo(() => DIMENSIONS.map(d => new THREE.MeshPhysicalMaterial({
    color: d.color,
    metalness: 0.3,
    roughness: 0.2,
    emissive: d.color,
    emissiveIntensity: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })), []);

  const pulseMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.02;
    }

    nodesRef.current.forEach((node, i) => {
      if (!node) return;
      const data = DIMENSIONS[i];
      const isHovered = hoveredIndex === i;
      const isSelected = selectedIndex === i;
      const baseScale = 1 + Math.sin(t * 2 + i) * 0.05;
      const hoverScale = isHovered ? 1.4 : (isSelected ? 1.2 : 1);
      node.scale.setScalar(baseScale * hoverScale);
      ((node.material as THREE.MeshPhysicalMaterial).emissiveIntensity) = 0.3 + (isHovered ? 0.5 : (isSelected ? 0.3 : Math.sin(t * 3 + i) * 0.15));
      
      if (orbitsRef.current[i]) {
        (orbitsRef.current[i].material as THREE.MeshBasicMaterial).opacity = isHovered || isSelected ? 0.5 : 0.2;
        orbitsRef.current[i].scale.setScalar(isHovered || isSelected ? 1.1 : 1);
      }
    });
  });

  const handlePointerOver = (index: number) => setHoveredIndex(index);
  const handlePointerOut = () => setHoveredIndex(null);
  const handleClick = (index: number) => setSelectedIndex(selectedIndex === index ? null : index);

  if (!config.postProcessing) {
    return <SimpleDimensionNodes />;
  }

  return (
    <group ref={groupRef} name="dimension-nodes">
      {DIMENSIONS.map((data, i) => {
        const x = Math.cos(data.angle) * data.radius;
        const z = Math.sin(data.angle) * data.radius;
        
        return (
          <group key={data.id} name={`dimension-${data.id}`}>
            <mesh
              ref={(el) => { if (el) nodesRef.current[i] = el; }}
              geometry={nodeGeometry}
              material={nodeMaterials[i]}
              position={[x, Math.sin(timeRef.current * 0.5 + i) * 0.3, z]}
              onPointerOver={() => handlePointerOver(i)}
              onPointerOut={handlePointerOut}
              onClick={() => handleClick(i)}
              castShadow
              receiveShadow
            />
            <mesh
              ref={(el) => { if (el) orbitsRef.current[i] = el; }}
              geometry={orbitGeometry}
              material={orbitMaterial}
              position={[x, 0, z]}
              rotation={[-Math.PI / 2, 0, 0]}
            />
            <mesh
              geometry={pulseGeometry}
              position={[x, 0, z]}
              scale={selectedIndex === i ? 1.5 : 0}
              name={`pulse-${i}`}
            >
              <meshBasicMaterial
                attach="material"
                color={data.color}
                transparent
                opacity={selectedIndex === i ? 0.15 : 0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            
            <Html
              position={[x, -2.5, z]}
              occlude
              transform
              sprite
              distanceFactor={15}
              fullscreen
              prepend
              style={{ pointerEvents: 'none', transition: 'opacity 0.2s' }}
            >
              <div className={`text-center text-white transition-opacity ${hoveredIndex === i || selectedIndex === i ? 'opacity-100' : 'opacity-60'}`}>
                <div className="font-mono text-lg font-bold" style={{ color: data.color }}>{data.score}</div>
                <div className="text-[10px] text-slate-400">{data.shortLabel}</div>
                <div className="text-[9px] text-slate-500">{data.weightPct}% weight</div>
              </div>
            </Html>
          </group>
        );
      })}

      {selectedIndex !== null && (
        <Html
          position={[0, 5, 18]}
          occlude
          transform
          sprite
          distanceFactor={30}
          fullscreen
          prepend
        >
          <DimensionPanel
            dimension={DIMENSIONS[selectedIndex]}
            onClose={() => setSelectedIndex(null)}
          />
        </Html>
      )}
    </group>
  );
}

function DimensionPanel({ dimension, onClose }: { dimension: DimensionData; onClose: () => void }) {
  return (
    <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 min-w-[280px] max-w-[360px] text-white shadow-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400">Skill Dimension</div>
          <h3 className="text-lg font-semibold mt-1">{dimension.label}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
          ✕
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-mono text-4xl font-bold" style={{ color: dimension.color }}>{dimension.score}</span>
          <span className="text-slate-400">/100</span>
        </div>
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${dimension.score}%`, backgroundColor: dimension.color }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <div className="text-slate-400">Weight</div>
          <div className="font-mono text-slate-200">{dimension.weightPct}%</div>
        </div>
        <div>
          <div className="text-slate-400">Confidence</div>
          <div className="font-mono text-slate-200">{dimension.confidence}</div>
        </div>
        <div>
          <div className="text-slate-400">Evidence</div>
          <div className="font-mono text-slate-200 text-[11px]">{dimension.evidenceCount}</div>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{dimension.description}</p>
    </div>
  );
}

function SimpleDimensionNodes() {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.01;
    }
  });

  return (
    <group ref={groupRef} name="simple-dimensions">
      {DIMENSIONS.map((data, i) => {
        const x = Math.cos(data.angle) * data.radius;
        const z = Math.sin(data.angle) * data.radius;
        return (
          <mesh
            key={data.id}
            position={[x, 0, z]}
            castShadow
            receiveShadow
          >
            <icosahedronGeometry args={[0.6, 0]} />
            <meshBasicMaterial color={data.color} wireframe transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

