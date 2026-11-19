'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

const CHALLENGE = {
  id: 'calib-sliding-window',
  title: 'Telemetry Subarray Latency Bound',
  difficulty: '1300 Rating Equivalent',
  prompt: 'Given an array of N packet latencies and a threshold K, what is the optimal time complexity to find the longest contiguous window whose sum ≤ K (all latencies > 0)?',
  options: [
    { id: 'a', text: 'O(N²) nested prefix scan with early break', correct: false },
    { id: 'b', text: 'O(N) monotonic two-pointer / sliding window', correct: true },
    { id: 'c', text: 'O(N log N) sorting latencies before window scan', correct: false },
  ],
  debugSnippet: `int maxLen = 0, left = 0;
long long windowSum = 0;
for (int right = 0; right < n; ++right) {
  windowSum += a[right];
  while (windowSum > k && left <= right) {
    windowSum -= a[left++];
  }
  maxLen = max(maxLen, right - left + 1);
}`,
};

const GATE_POSITIONS = [
  { x: -8, z: -5, label: 'Complexity' },
  { x: 0, z: -5, label: 'Implementation' },
  { x: 8, z: -5, label: 'Edge Cases' },
];

export function CalibrationChamber() {
  const { config } = useQuality();
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const gatesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [verified, setVerified] = useState(false);
  const [gateStates, setGateStates] = useState<Record<string, 'locked' | 'unlocked' | 'passed'>>({
    Complexity: 'locked',
    Implementation: 'locked',
    'Edge Cases': 'locked',
  });

  const floorGeometry = useMemo(() => new THREE.PlaneGeometry(40, 30), []);
  const wallGeometry = useMemo(() => new THREE.BoxGeometry(40, 10, 1), []);
  const gateGeometry = useMemo(() => new THREE.BoxGeometry(4, 6, 0.5), []);
  const pillarGeometry = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 10, 8), []);
  const particleGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = Math.min(config.particles, 1000);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 1.0;
      sizes[i] = Math.random() * 1.5 + 0.5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [config.particles]);

  const floorMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#07090e',
    metalness: 0.3,
    roughness: 0.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  }), []);

  const wallMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#1e293b',
    metalness: 0.2,
    roughness: 0.4,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  }), []);

  const pillarMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#334155',
    metalness: 0.3,
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  }), []);

  const gateMaterials = useMemo(() => ({
    locked: new THREE.MeshPhysicalMaterial({
      color: '#ef4444',
      metalness: 0.3,
      roughness: 0.3,
      emissive: '#ef4444',
      emissiveIntensity: 0.3,
    }),
    unlocked: new THREE.MeshPhysicalMaterial({
      color: '#f59e0b',
      metalness: 0.3,
      roughness: 0.3,
      emissive: '#f59e0b',
      emissiveIntensity: 0.4,
    }),
    passed: new THREE.MeshPhysicalMaterial({
      color: '#10b981',
      metalness: 0.3,
      roughness: 0.3,
      emissive: '#10b981',
      emissiveIntensity: 0.5,
    }),
  }), []);

  const particleMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.05) * 0.02;
    }

    gatesRef.current.forEach((gate, i) => {
      if (!gate) return;
      const state = gateStates[GATE_POSITIONS[i].label];
      gate.material = gateMaterials[state];
      gate.scale.y = state === 'passed' ? 1 + Math.sin(t * 4) * 0.1 : 1;
    });

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += delta * 0.3;
        if (positions[i + 1] > 8) {
          positions[i + 1] = 0;
          positions[i] = (Math.random() - 0.5) * 35;
          positions[i + 2] = (Math.random() - 0.5) * 25;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const handleVerify = () => {
    if (selectedOption !== 'b') return;
    setVerified(true);
    setGateStates({
      Complexity: 'passed',
      Implementation: 'passed',
      'Edge Cases': 'passed',
    });
  };

  if (!config.postProcessing) {
    return <SimpleCalibrationChamber />;
  }

  return (
    <group ref={groupRef} name="calibration-chamber">
      <mesh geometry={floorGeometry} material={floorMaterial} position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      
      <mesh geometry={wallGeometry} material={wallMaterial} position={[0, 4, -15]} receiveShadow />
      <mesh geometry={wallGeometry} material={wallMaterial} position={[0, 4, 15]} rotation={[0, Math.PI, 0]} receiveShadow />
      <mesh geometry={new THREE.BoxGeometry(1, 10, 30)} material={wallMaterial} position={[-20, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow />
      <mesh geometry={new THREE.BoxGeometry(1, 10, 30)} material={wallMaterial} position={[20, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow />

      {[-18, 18].map(x => (
        <mesh key={x} geometry={pillarGeometry} material={pillarMaterial} position={[x, 4, -13]} castShadow receiveShadow />
      ))}
      {[-18, 18].map(x => (
        <mesh key={x} geometry={pillarGeometry} material={pillarMaterial} position={[x, 4, 13]} castShadow receiveShadow />
      ))}

      {GATE_POSITIONS.map((pos, i) => (
        <mesh
          key={pos.label}
          ref={(el) => { if (el) gatesRef.current[i] = el; }}
          geometry={gateGeometry}
          material={gateMaterials[gateStates[pos.label]]}
          position={[pos.x, 2, pos.z]}
          name={`gate-${pos.label}`}
          castShadow
          receiveShadow
        />
      ))}

      <points geometry={particleGeometry} material={particleMaterial} name="chamber-particles" position={[0, 0, 0]} />

      <Html
        position={[0, 8, -12]}
        occlude
        transform
        sprite
        distanceFactor={25}
        fullscreen
        prepend
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center text-white">
          <div className="font-mono text-xs text-cyan-400 mb-1">CALIBRATION CHAMBER</div>
          <div className="font-mono text-2xl font-bold text-emerald-400">{verified ? 'VERIFIED' : 'PENDING'}</div>
          <div className="text-xs text-slate-400 mt-1">{CHALLENGE.difficulty}</div>
        </div>
      </Html>

      <Html
        position={[0, 0, 18]}
        occlude
        transform
        sprite
        distanceFactor={30}
        fullscreen
        prepend
      >
        <CalibrationPanel
          challenge={CHALLENGE}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          verified={verified}
          gateStates={gateStates}
          onVerify={handleVerify}
        />
      </Html>
    </group>
  );
}

function CalibrationPanel({ 
  challenge, 
  selectedOption, 
  setSelectedOption, 
  verified, 
  gateStates,
  onVerify 
}: {
  challenge: typeof CHALLENGE;
  selectedOption: string;
  setSelectedOption: (opt: string) => void;
  verified: boolean;
  gateStates: Record<string, 'locked' | 'unlocked' | 'passed'>;
  onVerify: () => void;
}) {
  const statusColor = (state: string) => {
    const colors = { locked: '#ef4444', unlocked: '#f59e0b', passed: '#10b981' };
    return colors[state as keyof typeof colors] || '#64748b';
  };

  return (
    <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 min-w-[340px] max-w-[420px] text-white shadow-2xl">
      <div className="mb-4">
        <div className="font-mono text-xs text-cyan-400 mb-1">{challenge.title}</div>
        <p className="text-sm text-slate-300 mb-3">{challenge.prompt}</p>
        
        <div className="space-y-2">
          {challenge.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => !verified && setSelectedOption(opt.id)}
              disabled={verified}
              className={`w-full text-left p-3 rounded-lg font-mono text-sm border-2 transition-all ${
                verified
                  ? (opt.correct ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-500')
                  : (selectedOption === opt.id ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50 text-slate-300')
              }`}
            >
              {opt.text}
              {verified && opt.correct && <span className="float-right text-emerald-400">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 p-3 bg-slate-900/50 rounded-lg font-mono text-[10px] text-slate-400 overflow-x-auto">
        {challenge.debugSnippet}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {Object.entries(gateStates).map(([label, state]) => (
          <div key={label} className="text-center p-2 rounded-lg" style={{ backgroundColor: statusColor(state) + '22', border: `1px solid ${statusColor(state)}44` }}>
            <div className="font-mono text-xs" style={{ color: statusColor(state) }}>{state.toUpperCase()}</div>
            <div className="text-[10px] text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {!verified && selectedOption ? (
        <button
          onClick={onVerify}
          disabled={selectedOption !== 'b'}
          className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: selectedOption === 'b' ? '#10b98133' : '#ef444433', 
            color: selectedOption === 'b' ? '#10b981' : '#ef4444',
            border: `1px solid ${selectedOption === 'b' ? '#10b98166' : '#ef444466'}`
          }}
        >
          {selectedOption === 'b' ? 'Verify Solution' : 'Incorrect - Try Again'}
        </button>
      ) : verified ? (
        <div className="w-full py-2 px-4 rounded-lg font-medium text-sm text-center text-emerald-400 border border-emerald-500/50 bg-emerald-500/10">
          ✓ Calibration Verified — Skill Boost Unlocked (+8 pts)
        </div>
      ) : (
        <button className="w-full py-2 px-4 rounded-lg font-medium text-sm text-slate-500 border border-slate-700 bg-slate-800/50 cursor-not-allowed" disabled>
          Select an option to verify
        </button>
      )}
    </div>
  );
}

function SimpleCalibrationChamber() {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.003;
    }
  });

  return (
    <group ref={groupRef} name="simple-calibration">
      <mesh>
        <boxGeometry args={[20, 10, 15]} />
        <meshBasicMaterial color="#0b101b" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

