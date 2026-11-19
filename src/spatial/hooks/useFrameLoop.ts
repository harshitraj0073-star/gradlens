'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useCallback } from 'react';

type FrameCallback = (delta: number, elapsed: number) => void;

export function useFrameLoop() {
  const callbacksRef = useRef<Map<string, FrameCallback>>(new Map());
  const { clock } = useThree();

  const register = useCallback((id: string, callback: FrameCallback) => {
    callbacksRef.current.set(id, callback);
    return () => {
      callbacksRef.current.delete(id);
    };
  }, []);

  const unregister = useCallback((id: string) => {
    callbacksRef.current.delete(id);
  }, []);

  useFrame(() => {
    const elapsed = clock.getElapsedTime();
    callbacksRef.current.forEach((callback) => {
      try {
        callback(clock.getDelta(), elapsed);
      } catch (e) {
        console.error('Frame callback error:', e);
      }
    });
  });

  return { register, unregister };
}

export function useFrameCallback(id: string, callback: FrameCallback) {
  const { register } = useFrameLoop();

  useEffect(() => {
    const cleanup = register(id, callback);
    return cleanup;
  }, [id, callback, register]);
}