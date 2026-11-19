'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useScrollController } from '@/spatial/hooks/useScrollController';

interface CameraRigProps {
  onSectionChange?: (section: { name: string }, progress: number) => void;
}

export function CameraRig({ onSectionChange }: CameraRigProps) {
  const { camera } = useThree();
  const currentPositionRef = useRef(new THREE.Vector3(0, 0, 30));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPosition = useRef(new THREE.Vector3(0, 0, 30));
  const desiredLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const lerpFactor = 0.06;

  useScrollController((section, progress) => {
    desiredPosition.current.set(section.camera[0], section.camera[1], section.camera[2]);
    desiredLookAt.current.set(section.lookAt[0], section.lookAt[1], section.lookAt[2]);
    onSectionChange?.({ name: section.name }, progress);
  });

  useFrame(() => {
    currentPositionRef.current.lerp(desiredPosition.current, lerpFactor);
    currentLookAtRef.current.lerp(desiredLookAt.current, lerpFactor);

    camera.position.copy(currentPositionRef.current);
    camera.lookAt(currentLookAtRef.current);
  });

  useEffect(() => {
    camera.position.set(0, 0, 30);
    camera.lookAt(0, 0, 0);
    currentPositionRef.current.set(0, 0, 30);
    currentLookAtRef.current.set(0, 0, 0);
  }, [camera]);

  return null;
}