'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuality } from '@/spatial/hooks/useQuality';

const WEEKS = 24;
const HISTORICAL_WEEKS = 16;
const FORECAST_WEEKS = 8;

const mockCapabilityData = Array.from({ length: WEEKS }, (_, i) => {
  const base = 45;
  const trend = i * 0.4;
  const noise = Math.sin(i * 0.5) * 8 + Math.sin(i * 1.3) * 4;
  const value = Math.max(10, Math.min(95, base + trend + noise));
  return {
    week: i,
    capability: Math.round(value),
    isForecast: i >= HISTORICAL_WEEKS,
    problemsSolved: i < HISTORICAL_WEEKS ? Math.max(0, Math.round(value / 8 + (Math.random() - 0.5) * 3)) : 0,
    avgRating: i < HISTORICAL_WEEKS ? 800 + Math.round(value * 6) : 0,
  };
});

export function TrajectoryRiver() {
  const { config } = useQuality();
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const tubeRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const crossSectionsRef = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);

  const spline = useMemo(() => {
    const points = mockCapabilityData.map((d, i) => 
      new THREE.Vector3(
        (i - WEEKS / 2) * 3,
        (d.capability - 50) * 0.15,
        -i * 2.5
      )
    );
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const tubeGeometry = useMemo(() => {
    const geometry = new THREE.TubeGeometry(spline, 200, 0.8, 8, false);
    return geometry;
  }, [spline]);

  const tubeMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#22d3ee',
    metalness: 0.2,
    roughness: 0.3,
    transparent: true,
    opacity: 0.25,
    transmission: 0.3,
    thickness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  }), []);

  const particleGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = config.particles;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const point = spline.getPoint(t);
      const tangent = spline.getTangent(t).normalize();
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      const isForecast = t > HISTORICAL_WEEKS / WEEKS;
      colors[i * 3] = isForecast ? 0.9 : 0.1;
      colors[i * 3 + 1] = isForecast ? 0.6 : 0.8;
      colors[i * 3 + 2] = isForecast ? 0.1 : 1.0;
      sizes[i] = Math.random() * 1.5 + 0.5;
      alphas[i] = Math.random() * 0.5 + 0.3;
      speeds[i] = 0.5 + Math.random() * 1.5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    g.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    return g;
  }, [spline, config.particles]);

  const particleMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.05;
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const speeds = particlesRef.current.geometry.attributes.speed.array as Float32Array;
      const alphas = particlesRef.current.geometry.attributes.alpha.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const pointAt = (i / 3) / config.particles;
        const speed = speeds[i / 3] * delta * 2;
        const newT = (pointAt + speed / spline.getLength()) % 1;
        const point = spline.getPoint(newT);
        positions[i] = point.x;
        positions[i + 1] = point.y + Math.sin(t * 5 + i) * 0.1;
        positions[i + 2] = point.z;
        
        alphas[i / 3] = 0.3 + Math.sin(t * 3 + i * 0.1) * 0.2;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.alpha.needsUpdate = true;
    }

    if (tubeRef.current) {
      ((tubeRef.current.material as THREE.MeshPhysicalMaterial).opacity) = 0.2 + Math.sin(t * 0.5) * 0.05;
    }
  });

  if (!config.postProcessing) {
    return <SimpleTrajectoryRiver />;
  }

  return (
    <group ref={groupRef} name="trajectory-river">
      <mesh ref={tubeRef} geometry={tubeGeometry} material={tubeMaterial} name="river-tube" castShadow receiveShadow />
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} name="river-particles" />
      
      {mockCapabilityData.map((d, i) => {
        if (i % 2 !== 0) return null;
        const point = spline.getPoint(i / (WEEKS - 1));
        const isForecast = d.isForecast;
        const radius = 0.3 + (d.capability / 100) * 0.8;
        
        return (
          <mesh
            key={i}
            ref={(el) => { if (el) crossSectionsRef.current[i] = el; }}
            geometry={new THREE.RingGeometry(radius * 0.7, radius, 32)}
            material={new THREE.MeshBasicMaterial({
              color: isForecast ? '#f59e0b' : '#22d3ee',
              transparent: true,
              opacity: isForecast ? 0.3 : 0.5,
              side: THREE.DoubleSide,
              blending: THREE.AdditiveBlending,
            })}
            position={[point.x, point.y, point.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            name={`cross-section-${i}`}
          />
        );
      })}
      
      <Html
        position={[0, 8, -10]}
        occlude
        transform
        sprite
        distanceFactor={25}
        fullscreen
        prepend
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center text-white">
          <div className="font-mono text-2xl font-bold text-cyan-400">+0.42</div>
          <div className="text-xs text-slate-400">pts/week (Theil-Sen)</div>
          <div className="text-[10px] text-emerald-400 mt-1">Growth Trajectory</div>
        </div>
      </Html>
    </group>
  );
}

function SimpleTrajectoryRiver() {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * 0.005;
    }
  });

  return (
    <group ref={groupRef} name="simple-trajectory">
      <mesh>
        <torusGeometry args={[10, 0.5, 8, 50]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

