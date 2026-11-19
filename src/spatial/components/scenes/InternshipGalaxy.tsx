'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

const INTERNSHIP_DATA = [
  { id: 'systems-sde', title: 'Systems & Backend Engineering', company: 'Zerodha / Groww Tier-1', category: 'Systems & AI', match: 94, status: 'READY_TO_APPLY', color: '#10b981', gravity: 1.2, orbitRadius: 6 },
  { id: 'fullstack-startup', title: 'Full-Stack Product Engineering', company: 'YC / Series-A SaaS', category: 'Full-Stack Startup', match: 87, status: 'NEARLY_READY', color: '#22d3ee', gravity: 1.0, orbitRadius: 10 },
  { id: 'gsoc-lfx', title: 'Open Source Contributor Fellow', company: 'CNCF / GSoC / LFX', category: 'Open Source', match: 78, status: 'NEARLY_READY', color: '#a855f7', gravity: 0.9, orbitRadius: 14 },
  { id: 'product-sde1', title: 'STEP / Explore SDE Intern', company: 'Global Tier-1 Product', category: 'Product SDE', match: 72, status: 'SKILL_GAP', color: '#f59e0b', gravity: 0.8, orbitRadius: 18 },
  { id: 'aicte-naps', title: 'AI & Data Research Intern', company: 'MeitY / AICTE / NAPS', category: 'Govt / Apprenticeship', match: 65, status: 'SKILL_GAP', color: '#ec4899', gravity: 0.7, orbitRadius: 22 },
];

const STATUS_COLORS = {
  READY_TO_APPLY: '#10b981',
  NEARLY_READY: '#22d3ee',
  SKILL_GAP: '#f59e0b',
};

export function InternshipGalaxy() {
  const { config } = useQuality();
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const planetsRef = useRef<THREE.Mesh[]>([]);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const orbitsRef = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);
  const [hoveredPlanet, setHoveredPlanet] = useState<number | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);

  const planetGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const ringGeometry = useMemo(() => new THREE.RingGeometry(1.3, 1.8, 32), []);
  const orbitGeometry = useMemo(() => new THREE.RingGeometry(0.05, 0.05, 64), []);
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(2.5, 16, 16), []);

  const planetMaterials = useMemo(() => INTERNSHIP_DATA.map(d => new THREE.MeshPhysicalMaterial({
    color: d.color,
    metalness: 0.3,
    roughness: 0.2,
    emissive: d.color,
    emissiveIntensity: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })), []);

  const ringMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#10b981',
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  }), []);

  const orbitMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#334155',
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
  }), []);

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.01;
    }

    INTERNSHIP_DATA.forEach((data, i) => {
      const angle = t * 0.15 * data.gravity + i * 2;
      const x = Math.cos(angle) * data.orbitRadius;
      const z = Math.sin(angle) * data.orbitRadius;
      const y = Math.sin(t * 0.5 + i) * 0.5;
      const isHovered = hoveredPlanet === i;
      const isSelected = selectedPlanet === i;

      if (planetsRef.current[i]) {
        planetsRef.current[i].position.set(x, y, z);
        planetsRef.current[i].rotation.y += delta * 0.3;
        planetsRef.current[i].scale.setScalar((isHovered ? 1.5 : 1) * (isSelected ? 1.2 : 1));
        (planetsRef.current[i].material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.4 + (isHovered || isSelected ? 0.4 : Math.sin(t * 2 + i) * 0.15);
      }

      if (ringsRef.current[i]) {
        ringsRef.current[i].position.set(x, y, z);
        ringsRef.current[i].rotation.x = -Math.PI / 2;
        (ringsRef.current[i].material as THREE.MeshBasicMaterial).opacity = (isHovered || isSelected) ? 0.5 : 0.3;
        (ringsRef.current[i].material as THREE.MeshBasicMaterial).color.set(STATUS_COLORS[data.status as keyof typeof STATUS_COLORS]);
      }

      if (orbitsRef.current[i]) {
        orbitsRef.current[i].scale.setScalar(data.orbitRadius * 2);
      }
    });
  });

  if (!config.postProcessing) {
    return <SimpleInternshipGalaxy />;
  }

  return (
    <group ref={groupRef} name="internship-galaxy">
      <mesh
        geometry={new THREE.SphereGeometry(2, 32, 32)}
        material={new THREE.MeshPhysicalMaterial({
          color: '#07090e',
          metalness: 0.1,
          roughness: 0.1,
          transmission: 0.9,
          thickness: 0.3,
          ior: 1.3,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
        })}
        name="central-core"
      >
        <Html position={[0, 0, 0]} occlude transform sprite distanceFactor={15} fullscreen prepend style={{ pointerEvents: 'none' }}>
          <div className="text-center text-white">
            <div className="font-mono text-2xl font-bold text-emerald-400">YOU</div>
            <div className="text-xs text-slate-400">Skill DNA: 78</div>
          </div>
        </Html>
      </mesh>

      {INTERNSHIP_DATA.map((data, i) => (
        <group key={data.id} name={`internship-${data.id}`}>
          <mesh
            ref={(el) => { if (el) orbitsRef.current[i] = el; }}
            geometry={orbitGeometry.clone()}
            material={orbitMaterial}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={data.orbitRadius * 2}
          />
          
          <mesh
            ref={(el) => { if (el) planetsRef.current[i] = el; }}
            geometry={planetGeometry}
            material={planetMaterials[i]}
            onPointerOver={() => setHoveredPlanet(i)}
            onPointerOut={() => setHoveredPlanet(null)}
            onClick={() => setSelectedPlanet(selectedPlanet === i ? null : i)}
            castShadow
            receiveShadow
          />
          
          <mesh
            ref={(el) => { if (el) ringsRef.current[i] = el; }}
            geometry={ringGeometry}
            material={ringMaterial.clone()}
          >
            <meshBasicMaterial attach="material" color={STATUS_COLORS[data.status as keyof typeof STATUS_COLORS]} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>

          <Html
            position={[0, -2.5, 0]}
            occlude
            transform
            sprite
            distanceFactor={20}
            fullscreen
            prepend
            style={{ pointerEvents: 'none', opacity: hoveredPlanet === i || selectedPlanet === i ? 1 : 0.5 }}
          >
            <div className="text-center text-white">
              <div className="font-mono text-lg font-bold" style={{ color: data.color }}>{data.match}%</div>
              <div className="text-[10px] text-slate-400">{data.title}</div>
              <div className="text-[9px]" style={{ color: STATUS_COLORS[data.status as keyof typeof STATUS_COLORS] }}>{data.status.replace('_', ' ')}</div>
            </div>
          </Html>
        </group>
      ))}

      {selectedPlanet !== null && (
        <Html
          position={[0, 8, 25]}
          occlude
          transform
          sprite
          distanceFactor={35}
          fullscreen
          prepend
        >
          <InternshipDetailPanel
            data={INTERNSHIP_DATA[selectedPlanet]}
            onClose={() => setSelectedPlanet(null)}
          />
        </Html>
      )}
    </group>
  );
}

function InternshipDetailPanel({ data, onClose }: { data: typeof INTERNSHIP_DATA[0]; onClose: () => void }) {
  const statusColor = STATUS_COLORS[data.status as keyof typeof STATUS_COLORS];
  
  return (
    <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 min-w-[300px] max-w-[380px] text-white shadow-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400">Internship Match</div>
          <h3 className="text-lg font-semibold mt-1" style={{ color: data.color }}>{data.title}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{data.company}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-mono text-4xl font-bold" style={{ color: data.color }}>{data.match}%</span>
          <span className="text-slate-400">Match Score</span>
        </div>
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${data.match}%`, backgroundColor: data.color }} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor + '33', color: statusColor }}>
          {data.status.replace('_', ' ')}
        </span>
        <span className="text-xs text-slate-400">{data.category}</span>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-slate-300">Stipend: ₹60,000 - ₹85,000 / mo</p>
        <p className="text-slate-300">Location: Bengaluru / Hybrid</p>
        <p className="text-slate-300">Min CGPA: 7.0 | Min Grad Year: 2027</p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <button className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors" style={{ backgroundColor: data.color + '33', color: data.color, border: `1px solid ${data.color}66` }}>
          View Details & Apply
        </button>
      </div>
    </div>
  );
}

function SimpleInternshipGalaxy() {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.005;
    }
  });

  return (
    <group ref={groupRef} name="simple-galaxy">
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#07090e" wireframe transparent opacity={0.3} />
      </mesh>
      {INTERNSHIP_DATA.map((data, i) => (
        <mesh key={data.id} position={[Math.cos(i) * data.orbitRadius, 0, Math.sin(i) * data.orbitRadius]}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color={data.color} wireframe transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

