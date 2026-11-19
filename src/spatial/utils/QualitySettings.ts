export type QualityTier = 'low' | 'medium' | 'high';

export interface QualityConfig {
  pixelRatio: number;
  postProcessing: boolean;
  shadows: boolean;
  particles: number;
  antialias: boolean;
  bloom?: boolean;
  dof?: boolean;
  toneMapping?: 'none' | 'aces' | 'cineon';
}

export const qualityConfigs: Record<QualityTier, QualityConfig> = {
  low: {
    pixelRatio: 1,
    postProcessing: false,
    shadows: false,
    particles: 500,
    antialias: false,
    toneMapping: 'none',
  },
  medium: {
    pixelRatio: 1.5,
    postProcessing: true,
    shadows: true,
    particles: 2000,
    antialias: true,
    toneMapping: 'aces',
  },
  high: {
    pixelRatio: 2,
    postProcessing: true,
    shadows: true,
    particles: 5000,
    antialias: true,
    bloom: true,
    dof: true,
    toneMapping: 'aces',
  },
};

export function detectQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'medium';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return 'low';

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  const slowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';

  if (isMobile || deviceMemory < 4 || cores < 4 || slowConnection) return 'low';
  if (deviceMemory >= 8 && cores >= 8 && !isMobile) return 'high';
  return 'medium';
}

export function getQualityConfig(tier?: QualityTier): QualityConfig {
  return qualityConfigs[tier ?? detectQualityTier()];
}

export const QUALITY_STORAGE_KEY = 'gradlens-quality-tier';

export function getStoredQualityTier(): QualityTier | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(QUALITY_STORAGE_KEY);
  if (stored && ['low', 'medium', 'high'].includes(stored)) return stored as QualityTier;
  return null;
}

export function setStoredQualityTier(tier: QualityTier): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUALITY_STORAGE_KEY, tier);
  }
}