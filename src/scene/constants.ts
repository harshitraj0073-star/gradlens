import * as THREE from 'three';

export const COLORS = {
  bgObsidian: 0x07090e,
  glassTint: 0x0b101b,
  glassBorder: 0x334155,
  cyan: 0x22d3ee,
  emerald: 0x10b981,
  indigo: 0x6366f1,
  slateMuted: 0x1e293b,
  slateText: 0x94a3b8,
} as const;

// Left side: 3 staggered floating dark-glass cards
export const LEFT_CARD_TRANSFORMS = {
  github: {
    pos: new THREE.Vector3(-3.05, 1.18, -0.35),
    rot: new THREE.Euler(0.08, 0.34, -0.02),
  },
  codeforces: {
    pos: new THREE.Vector3(-3.32, -0.02, 0.25),
    rot: new THREE.Euler(0.0, 0.38, 0.0),
  },
  academic: {
    pos: new THREE.Vector3(-2.95, -1.2, -0.22),
    rot: new THREE.Euler(-0.08, 0.32, 0.02),
  },
} as const;

// Center: 3D Hexagonal Radar-Chart Hologram (Skill DNA)
export const HOLOGRAM_POS = new THREE.Vector3(0.06, 0.04, 0.18);

// Right side: Glassmorphic Internship Match Card
export const RIGHT_CARD_TRANSFORM = {
  pos: new THREE.Vector3(3.18, 0.02, 0.04),
  rot: new THREE.Euler(0.02, -0.32, 0.0),
} as const;

export function createSeededRandom(seed = 70901) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
