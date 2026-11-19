'use client';

import { useEffect, useState, useCallback } from 'react';
import { QualityTier, QualityConfig, detectQualityTier, getQualityConfig, getStoredQualityTier, setStoredQualityTier, QUALITY_STORAGE_KEY } from '@/spatial/utils/QualitySettings';

export function useQuality(): {
  tier: QualityTier;
  config: QualityConfig;
  setTier: (tier: QualityTier) => void;
  resetToAuto: () => void;
  isAuto: boolean;
} {
  const [tier, setTierState] = useState<QualityTier>('medium');
  const [isAuto, setIsAuto] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredQualityTier();
    const detected = detectQualityTier();
    const initialTier = stored ?? detected;
    setTierState(initialTier);
    setIsAuto(!stored);
    setHydrated(true);
  }, []);

  const config = getQualityConfig(tier);

  const setTier = useCallback((newTier: QualityTier) => {
    setTierState(newTier);
    setIsAuto(false);
    setStoredQualityTier(newTier);
  }, []);

  const resetToAuto = useCallback(() => {
    const detected = detectQualityTier();
    setTierState(detected);
    setIsAuto(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(QUALITY_STORAGE_KEY);
    }
  }, []);

  if (!hydrated) {
    return { tier: 'medium', config: getQualityConfig('medium'), setTier: () => {}, resetToAuto: () => {}, isAuto: true };
  }

  return { tier, config, setTier, resetToAuto, isAuto };
}

export function useQualitySelector() {
  const { tier, config, setTier, resetToAuto, isAuto } = useQuality();

  const options: { value: QualityTier; label: string; description: string }[] = [
    { value: 'low', label: 'Performance', description: 'Minimal effects, max FPS' },
    { value: 'medium', label: 'Balanced', description: 'Post-processing, shadows, 2K particles' },
    { value: 'high', label: 'Visual Fidelity', description: 'Bloom, DOF, 5K particles, best quality' },
  ];

  return { tier, config, setTier, resetToAuto, isAuto, options };
}