'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

const SHAPES = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'];
const DIAGNOSIS_LINES = [
  "Your verified Skill DNA stands at 78/100 (±3 pts, 87% evidence coverage).",
  "Strongest pillar: Algorithmic Problem Solving (72/100 with P80 difficulty 1420 across 47 solves).",
  "Your CGPA (8.72) currently tracks solidly with your public code/contest evidence (Inflation Delta: +4 pts).",
  "Over 16 weeks, your Theil-Sen capability slope is +0.42 pts/week (Growth trajectory).",
  "At this pace, Holt's smoothing projects your capability index to reach 84/100 in 8 weeks.",
  "This unlocks Systems & Backend Engineering roles (94% match) — ready to apply.",
  "Smallest next action: Ship 1 multi-week repo with tests + CI, solve 8 CF 1500+ problems.",
];

export function AICore() {
  const { config } = useQuality();
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const [currentShape, setCurrentShape] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lineTimerRef = useRef(0);
  const shapeTimerRef = useRef(0);

  const geometries = useMemo(() => ({
    tetrahedron: new THREE.TetrahedronGeometry(2, 0),
    cube: new THREE.BoxGeometry(2.5, 2.5, 2.5),
    octahedron: new THREE.OctahedronGeometry(2, 0),
    dodecahedron: new THREE.DodecahedronGeometry(2, 0),
    icosahedron: new THREE.IcosahedronGeometry(2, 0),
  }), []);

  const coreMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#07090e',
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.85,
    thickness: 0.5,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
  }), []);

  const wireframeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#22d3ee',
    wireframe: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
  }), []);

  const particleGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = config.particles;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1.0;
      sizes[i] = Math.random() * 2 + 0.5;
      speeds[i] = 0.2 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    return g;
  }, [config.particles]);

  const particleMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.02;
    }

    lineTimerRef.current += delta;
    if (lineTimerRef.current > 4) {
      lineTimerRef.current = 0;
      setCurrentLine((prev) => (prev + 1) % DIAGNOSIS_LINES.length);
    }

    shapeTimerRef.current += delta;
    if (shapeTimerRef.current > 3) {
      shapeTimerRef.current = 0;
      setCurrentShape((prev) => (prev + 1) % SHAPES.length);
    }

    if (coreRef.current) {
      const targetGeo = geometries[SHAPES[currentShape] as keyof typeof geometries];
      const currentPos = coreRef.current.geometry.attributes.position;
      const targetPos = targetGeo.attributes.position;
      
      if (currentPos.count === targetPos.count) {
        for (let i = 0; i < currentPos.count; i++) {
          currentPos.setXYZ(i,
            THREE.MathUtils.lerp(currentPos.getX(i), targetPos.getX(i), delta * 3),
            THREE.MathUtils.lerp(currentPos.getY(i), targetPos.getY(i), delta * 3),
            THREE.MathUtils.lerp(currentPos.getZ(i), targetPos.getZ(i), delta * 3)
          );
        }
        currentPos.needsUpdate = true;
        coreRef.current.geometry.computeVertexNormals();
      }

      const pulse = 1 + Math.sin(t * 4) * 0.05;
      coreRef.current.scale.setScalar(pulse);
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const speeds = particlesRef.current.geometry.attributes.speed.array as Float32Array;
      const phases = particlesRef.current.geometry.attributes.phase.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const speed = speeds[i / 3];
        const phase = phases[i / 3];
        const radius = 3 + Math.sin(t * speed + phase) * 2;
        const theta = t * 0.1 + phase;
        const phi = Math.acos(2 * (i / 3 / config.particles) - 1);
        
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.cos(phi);
        positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y += delta * 0.01;
    }
  });

  if (!config.postProcessing) {
    return <SimpleAICore />;
  }

  return (
    <group ref={groupRef} name="ai-core">
      <mesh
        ref={coreRef}
        geometry={geometries[SHAPES[currentShape] as keyof typeof geometries]}
        material={coreMaterial}
        name="ai-core-mesh"
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries[SHAPES[currentShape] as keyof typeof geometries]}
        material={wireframeMaterial}
        name="ai-core-wireframe"
        scale={1.02}
      />
      <points geometry={particleGeometry} material={particleMaterial} name="ai-particles" />
      
      <Html
        position={[0, 6, 12]}
        occlude
        transform
        sprite
        distanceFactor={25}
        fullscreen
        prepend
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full bg-emerald-400 ${isSpeaking ? 'animate-pulse' : ''}`} />
            <span className="font-mono text-xs text-cyan-400">AI MIRROR</span>
          </div>
          <div className="font-mono text-xl font-bold text-emerald-400">78/100</div>
        </div>
      </Html>

      <Html
        position={[0, -6, 15]}
        occlude
        transform
        sprite
        distanceFactor={30}
        fullscreen
        prepend
      >
        <AIDiagnosisPanel
          lines={DIAGNOSIS_LINES}
          currentLine={currentLine}
          onClose={() => {}}
        />
      </Html>
    </group>
  );
}

function AIDiagnosisPanel({ lines, currentLine, onClose }: { lines: string[]; currentLine: number; onClose: () => void }) {
  return (
    <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 min-w-[320px] max-w-[400px] text-white shadow-2xl text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs text-cyan-400">GRADLENS ENGINE v2.4</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`text-sm leading-relaxed transition-all duration-300 ${
              i === currentLine 
                ? 'text-white opacity-100' 
                : 'text-slate-400 opacity-60'
            }`}
            style={{ transform: i === currentLine ? 'translateX(4px)' : 'translateX(0)' }}
          >
            {line}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-500">
        <span className="font-mono">Deterministic Engine</span>
        <span>·</span>
        <span className="font-mono">Grounded Citations</span>
        <span>·</span>
        <span className="font-mono">No Hallucination</span>
      </div>
    </div>
  );
}

function SimpleAICore() {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.01;
    }
  });

  return (
    <group ref={groupRef} name="simple-ai-core">
      <mesh>
        <octahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.4} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

