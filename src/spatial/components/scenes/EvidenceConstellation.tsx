'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

const REPO_DATA = [
  { name: 'gradlens', lang: 'TypeScript', stars: 0, commits: 47, days: 12, hasTests: true, hasCI: true, color: '#3178c6' },
  { name: 'skill-dna-engine', lang: 'TypeScript', stars: 2, commits: 31, days: 8, hasTests: true, hasCI: true, color: '#3178c6' },
  { name: 'cf-analytics', lang: 'Python', stars: 1, commits: 23, days: 6, hasTests: false, hasCI: true, color: '#3572A5' },
  { name: 'portfolio-v2', lang: 'TypeScript', stars: 5, commits: 18, days: 4, hasTests: true, hasCI: false, color: '#3178c6' },
  { name: 'algo-practice', lang: 'C++', stars: 0, commits: 15, days: 3, hasTests: false, hasCI: false, color: '#f34b7d' },
  { name: 'leetcode-solutions', lang: 'Python', stars: 3, commits: 22, days: 7, hasTests: false, hasCI: false, color: '#3572A5' },
];

const CF_DATA = [
  { rating: 1420, tag: 'graphs', count: 8 },
  { rating: 1380, tag: 'dp', count: 6 },
  { rating: 1350, tag: 'trees', count: 5 },
  { rating: 1280, tag: 'greedy', count: 4 },
  { rating: 1200, tag: 'math', count: 7 },
  { rating: 1150, tag: 'strings', count: 3 },
];

export function EvidenceConstellation() {
  const { config } = useQuality();
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Mesh[]>([]);
  const pulsarsRef = useRef<THREE.Mesh[]>([]);
  const connectionsRef = useRef<THREE.Line[]>([]);
  const timeRef = useRef(0);
  const [hoveredStar, setHoveredStar] = useState<{ type: 'repo' | 'cf', index: number } | null>(null);

  const starGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.5, 0), []);
  const pulsarGeometry = useMemo(() => new THREE.OctahedronGeometry(0.4, 0), []);
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(1.2, 16, 16), []);

  const repoMaterials = useMemo(() => REPO_DATA.map(d => new THREE.MeshPhysicalMaterial({
    color: d.color,
    metalness: 0.4,
    roughness: 0.2,
    emissive: d.color,
    emissiveIntensity: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })), []);

  const cfMaterials = useMemo(() => CF_DATA.map(d => new THREE.MeshPhysicalMaterial({
    color: '#22d3ee',
    metalness: 0.3,
    roughness: 0.2,
    emissive: '#22d3ee',
    emissiveIntensity: 0.6,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })), []);

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const connectionMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: '#334155',
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.015;
    }

    starsRef.current.forEach((star, i) => {
      if (!star) return;
      const isHovered = hoveredStar?.type === 'repo' && hoveredStar.index === i;
      star.scale.setScalar(isHovered ? 1.5 : 1 + Math.sin(t * 2 + i) * 0.1);
      (star.material as THREE.MeshPhysicalMaterial).emissiveIntensity = isHovered ? 1.0 : 0.5 + Math.sin(t * 3 + i) * 0.2;
      star.rotation.y += delta * 0.2;
    });

    pulsarsRef.current.forEach((pulsar, i) => {
      if (!pulsar) return;
      const isHovered = hoveredStar?.type === 'cf' && hoveredStar.index === i;
      pulsar.scale.setScalar(isHovered ? 1.5 : 1 + Math.sin(t * 2.5 + i) * 0.15);
      (pulsar.material as THREE.MeshPhysicalMaterial).emissiveIntensity = isHovered ? 1.0 : 0.6 + Math.sin(t * 4 + i) * 0.3;
      pulsar.rotation.x += delta * 0.3;
      pulsar.rotation.y += delta * 0.2;
    });
  });

  if (!config.postProcessing) {
    return <SimpleEvidenceConstellation />;
  }

  return (
    <group ref={groupRef} name="evidence-constellation">
      <group name="github-repos">
        {REPO_DATA.map((data, i) => {
          const angle = (i / REPO_DATA.length) * Math.PI * 2;
          const radius = 15 + Math.sin(i) * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (Math.sin(i) - 0.5) * 3;

          return (
            <group key={data.name} name={`repo-${data.name}`}>
              <mesh
                ref={(el) => { if (el) starsRef.current[i] = el; }}
                geometry={starGeometry}
                material={repoMaterials[i]}
                position={[x, y, z]}
                onPointerOver={() => setHoveredStar({ type: 'repo', index: i })}
                onPointerOut={() => setHoveredStar(null)}
                castShadow
                receiveShadow
              />
              <mesh
                geometry={glowGeometry}
                material={glowMaterial.clone()}
                position={[x, y, z]}
                scale={hoveredStar?.type === 'repo' && hoveredStar.index === i ? 1 : 0}
              >
                <meshBasicMaterial attach="material" color={data.color} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              
              <Html
                position={[x, y - 1.5, z]}
                occlude
                transform
                sprite
                distanceFactor={20}
                fullscreen
                prepend
                style={{ pointerEvents: 'none', opacity: hoveredStar?.type === 'repo' && hoveredStar.index === i ? 1 : 0.4 }}
              >
                <div className="text-center text-white">
                  <div className="font-mono text-sm font-bold" style={{ color: data.color }}>{data.name}</div>
                  <div className="text-[10px] text-slate-400">{data.commits} commits · {data.days} days</div>
                </div>
              </Html>
            </group>
          );
        })}
      </group>

      <group name="codeforces-solves">
        {CF_DATA.map((data, i) => {
          const angle = (i / CF_DATA.length) * Math.PI * 2 + Math.PI / CF_DATA.length;
          const radius = 10 + Math.cos(i) * 1.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (Math.cos(i * 1.5) - 0.3) * 4;

          return (
            <group key={i} name={`cf-${data.tag}`}>
              <mesh
                ref={(el) => { if (el) pulsarsRef.current[i] = el; }}
                geometry={pulsarGeometry}
                material={cfMaterials[i]}
                position={[x, y, z]}
                onPointerOver={() => setHoveredStar({ type: 'cf', index: i })}
                onPointerOut={() => setHoveredStar(null)}
                castShadow
                receiveShadow
              />
              <mesh
                geometry={glowGeometry}
                material={glowMaterial.clone()}
                position={[x, y, z]}
                scale={hoveredStar?.type === 'cf' && hoveredStar.index === i ? 1 : 0}
              >
                <meshBasicMaterial attach="material" color="#22d3ee" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              
              <Html
                position={[x, y - 1.2, z]}
                occlude
                transform
                sprite
                distanceFactor={20}
                fullscreen
                prepend
                style={{ pointerEvents: 'none', opacity: hoveredStar?.type === 'cf' && hoveredStar.index === i ? 1 : 0.4 }}
              >
                <div className="text-center text-white">
                  <div className="font-mono text-sm font-bold text-cyan-400">{data.rating}</div>
                  <div className="text-[10px] text-slate-400">{data.tag} · {data.count} solves</div>
                </div>
              </Html>
            </group>
          );
        })}
      </group>

      {hoveredStar && (
        <Html
          position={[0, 8, 20]}
          occlude
          transform
          sprite
          distanceFactor={30}
          fullscreen
          prepend
        >
          <EvidenceDetailPanel 
            data={hoveredStar.type === 'repo' ? REPO_DATA[hoveredStar.index] : CF_DATA[hoveredStar.index]}
            type={hoveredStar.type}
            onClose={() => setHoveredStar(null)}
          />
        </Html>
      )}
    </group>
  );
}

function EvidenceDetailPanel({ data, type, onClose }: { data: any; type: 'repo' | 'cf'; onClose: () => void }) {
  if (type === 'repo') {
    return (
      <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 min-w-[260px] text-white shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-slate-400">GitHub Repository</div>
            <h3 className="text-lg font-semibold mt-1" style={{ color: data.color }}>{data.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div><span className="text-slate-400">Language: </span><span className="font-mono" style={{ color: data.color }}>{data.lang}</span></div>
          <div><span className="text-slate-400">Commits: </span><span className="font-mono">{data.commits}</span></div>
          <div><span className="text-slate-400">Active Days: </span><span className="font-mono">{data.days}</span></div>
          <div><span className="text-slate-400">Tests: </span><span className="font-mono text-emerald-400">{data.hasTests ? '✓' : '✗'}</span></div>
          <div><span className="text-slate-400">CI: </span><span className="font-mono text-emerald-400">{data.hasCI ? '✓' : '✗'}</span></div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 min-w-[260px] text-white shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-slate-400">Codeforces Topic</div>
            <h3 className="text-lg font-semibold mt-1 text-cyan-400">{data.tag}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-400">Avg Rating: </span><span className="font-mono text-cyan-400">{data.rating}</span></div>
          <div><span className="text-slate-400">Solves: </span><span className="font-mono">{data.count}</span></div>
        </div>
      </div>
    );
  }
}

function SimpleEvidenceConstellation() {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.008;
    }
  });

  return (
    <group ref={groupRef} name="simple-evidence">
      {REPO_DATA.map((data, i) => {
        const angle = (i / REPO_DATA.length) * Math.PI * 2;
        const radius = 12;
        return (
          <mesh key={data.name} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <icosahedronGeometry args={[0.4, 0]} />
            <meshBasicMaterial color={data.color} wireframe transparent opacity={0.5} />
          </mesh>
        );
      })}
      {CF_DATA.map((data, i) => {
        const angle = (i / CF_DATA.length) * Math.PI * 2 + Math.PI / CF_DATA.length;
        const radius = 8;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

