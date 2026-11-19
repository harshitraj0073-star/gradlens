'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

const SEMESTER_DATA = [
  { sem: 1, sgpa: 8.42, attendance: 86, credits: 22, highlight: 'Programming in C & DS (A+)' },
  { sem: 2, sgpa: 8.76, attendance: 89, credits: 24, highlight: 'OOP & Discrete Math (O)' },
  { sem: 3, sgpa: 8.65, attendance: 84, credits: 24, highlight: 'DSA & COA (A)' },
  { sem: 4, sgpa: 8.90, attendance: 88, credits: 22, highlight: 'DBMS & OS (A+)' },
  { sem: 5, sgpa: 8.55, attendance: 82, credits: 24, highlight: 'CN & Compiler (A)' },
  { sem: 6, sgpa: 8.80, attendance: 87, credits: 22, highlight: 'ML & Cloud (A+)' },
  { sem: 7, sgpa: 8.70, attendance: 85, credits: 20, highlight: 'Capstone Phase 1 (A)' },
  { sem: 8, sgpa: 8.85, attendance: 90, credits: 18, highlight: 'Capstone Phase 2 (O)' },
];

export function AcademicTower() {
  const { config } = useQuality();
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const floorsRef = useRef<THREE.Mesh[]>([]);
  const windowsRef = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);

  const floorGeometry = useMemo(() => new THREE.BoxGeometry(8, 3, 8), []);
  const windowGeometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.2), []);
  const pillarGeometry = useMemo(() => new THREE.CylinderGeometry(0.3, 0.3, 24, 8), []);

  const floorMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#0b101b',
    metalness: 0.2,
    roughness: 0.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
  }), []);

  const pillarMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#1e293b',
    metalness: 0.3,
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  }), []);

  const windowMaterials = useMemo(() => SEMESTER_DATA.map((d, i) => new THREE.MeshBasicMaterial({
    color: d.attendance >= 85 ? '#10b981' : '#f59e0b',
    transparent: true,
    opacity: 0.6 + (d.attendance / 100) * 0.4,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })), []);

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
      groupRef.current.rotation.y = t * 0.005;
    }

    windowsRef.current.forEach((window, i) => {
      if (!window) return;
      const data = SEMESTER_DATA[i];
      const pulse = Math.sin(t * 2 + i * 0.5) * 0.1 + 1;
      window.scale.setScalar(pulse);
      (window.material as THREE.MeshBasicMaterial).opacity = 0.6 + (data.attendance / 100) * 0.4 + Math.sin(t * 3 + i) * 0.1;
    });
  });

  if (!config.postProcessing) {
    return <SimpleAcademicTower />;
  }

  return (
    <group ref={groupRef} name="academic-tower">
      <mesh geometry={pillarGeometry} material={pillarMaterial} position={[-4.5, 12, -4.5]} castShadow receiveShadow />
      <mesh geometry={pillarGeometry} material={pillarMaterial} position={[4.5, 12, -4.5]} castShadow receiveShadow />
      <mesh geometry={pillarGeometry} material={pillarMaterial} position={[-4.5, 12, 4.5]} castShadow receiveShadow />
      <mesh geometry={pillarGeometry} material={pillarMaterial} position={[4.5, 12, 4.5]} castShadow receiveShadow />

      {SEMESTER_DATA.map((data, i) => {
        const y = -10 + i * 3;
        const floorColor = data.sgpa >= 8.7 ? '#10b981' : data.sgpa >= 8.5 ? '#22d3ee' : '#f59e0b';
        
        return (
          <group key={data.sem} name={`semester-${data.sem}`}>
            <mesh
              ref={(el) => { if (el) floorsRef.current[i] = el; }}
              geometry={floorGeometry}
              material={floorMaterial.clone()}
              position={[0, y, 0]}
              castShadow
              receiveShadow
            >
              <meshPhysicalMaterial attach="material" color={floorColor} metalness={0.2} roughness={0.4} />
            </mesh>

            <mesh
              ref={(el) => { if (el) windowsRef.current[i] = el; }}
              geometry={windowGeometry}
              material={windowMaterials[i]}
              position={[3.5, y, 4.1]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <mesh
              geometry={windowGeometry}
              material={windowMaterials[i]}
              position={[-3.5, y, 4.1]}
              rotation={[0, -Math.PI / 2, 0]}
            />
            <mesh
              geometry={windowGeometry}
              material={windowMaterials[i]}
              position={[4.1, y, 3.5]}
              rotation={[0, 0, 0]}
            />
            <mesh
              geometry={windowGeometry}
              material={windowMaterials[i]}
              position={[4.1, y, -3.5]}
              rotation={[0, Math.PI / 2, 0]}
            />

            <Html
              position={[0, y + 2, 10]}
              occlude
              transform
              sprite
              distanceFactor={25}
              fullscreen
              prepend
              style={{ pointerEvents: 'none' }}
            >
              <div className="text-center text-white">
                <div className="font-mono text-xl font-bold" style={{ color: floorColor }}>Sem {data.sem}</div>
                <div className="text-xs text-slate-400">SGPA: {data.sgpa} · Att: {data.attendance}%</div>
              </div>
            </Html>
          </group>
        );
      })}

      <Html
        position={[0, 16, 15]}
        occlude
        transform
        sprite
        distanceFactor={30}
        fullscreen
        prepend
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center text-white">
          <div className="font-mono text-2xl font-bold text-emerald-400">8.72</div>
          <div className="text-xs text-slate-400">Projected CGPA</div>
          <div className="text-[10px] text-cyan-400 mt-1">+0.12 trend</div>
        </div>
      </Html>
    </group>
  );
}

function SimpleAcademicTower() {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.003;
    }
  });

  return (
    <group ref={groupRef} name="simple-tower">
      <mesh>
        <boxGeometry args={[6, 24, 6]} />
        <meshBasicMaterial color="#0b101b" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

