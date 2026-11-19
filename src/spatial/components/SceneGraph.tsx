'use client';

import { Suspense, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroHologram } from './scenes/HeroHologram';
import { DimensionNodes } from './scenes/DimensionNodes';
import { TrajectoryRiver } from './scenes/TrajectoryRiver';
import { EvidenceConstellation } from './scenes/EvidenceConstellation';
import { AcademicTower } from './scenes/AcademicTower';
import { InternshipGalaxy } from './scenes/InternshipGalaxy';
import { AICore } from './scenes/AICore';
import { CalibrationChamber } from './scenes/CalibrationChamber';
import { useQuality } from '@/spatial/hooks/useQuality';

function SceneContent() {
  const { scene } = useThree();
  const { config } = useQuality();

  useEffect(() => {
    scene.fog = new THREE.Fog('#07090e', 10, 120);
    scene.background = new THREE.Color('#07090e');
  }, [scene]);

  return (
    <>
      <fog attach="fog" args={['#07090e', 10, 120]} />
      <color attach="background" args={['#07090e']} />

      <ambientLight intensity={0.45} color="#ffffff" />
      <directionalLight
        position={[12, 24, 12]}
        intensity={1.4}
        color="#ffffff"
        castShadow={config.shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-12, 12, -12]} intensity={0.6} color="#22d3ee" />
      <pointLight position={[0, 30, 0]} intensity={0.4} color="#10b981" distance={120} decay={2} />

      <group position={[0, 0, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <HeroHologram />
        </Suspense>
      </group>
      <group position={[0, -40, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <DimensionNodes />
        </Suspense>
      </group>
      <group position={[0, -90, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <TrajectoryRiver />
        </Suspense>
      </group>
      <group position={[0, -150, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <EvidenceConstellation />
        </Suspense>
      </group>
      <group position={[0, -220, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <AcademicTower />
        </Suspense>
      </group>
      <group position={[0, -300, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <InternshipGalaxy />
        </Suspense>
      </group>
      <group position={[0, -380, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <AICore />
        </Suspense>
      </group>
      <group position={[0, -460, 0]}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <CalibrationChamber />
        </Suspense>
      </group>
    </>
  );
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#1e293b" wireframe />
    </mesh>
  );
}

export function SceneGraph() {
  return <SceneContent />;
}