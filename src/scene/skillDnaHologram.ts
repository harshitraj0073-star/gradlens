import * as THREE from 'three';
import { COLORS, HOLOGRAM_POS, createSeededRandom } from './constants';
import {
  createBokehDustMaterial,
  createDataBeamMaterial,
} from './materials';

export interface SkillDnaHologramHandle {
  group: THREE.Group;
  update: (elapsed: number, pixelRatio: number) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();
const _vecA = new THREE.Vector3();
const _color = new THREE.Color();

export function createSkillDnaAndBeams(anchors: {
  githubOutputAnchor: THREE.Vector3;
  codeforcesOutputAnchor: THREE.Vector3;
  academicOutputAnchor: THREE.Vector3;
  rightInputAnchor: THREE.Vector3;
}): SkillDnaHologramHandle {
  const rand = createSeededRandom(314159);
  const root = new THREE.Group();

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // =========================================================================
  // 1. CENTRAL 3D HEXAGONAL RADAR-CHART HOLOGRAM (SKILL DNA)
  // =========================================================================
  const holoRoot = new THREE.Group();
  holoRoot.position.copy(HOLOGRAM_POS);
  // Subtle ergonomic 3D tilt so hexagonal radar geometry & depth shine
  holoRoot.rotation.set(0.24, -0.06, 0.0);
  root.add(holoRoot);

  const radarPlane = new THREE.Group();
  holoRoot.add(radarPlane);

  const outerRadius = 1.24;
  const ringRadii = [0.32, 0.62, 0.92, outerRadius];

  // Concentric hexagonal radar web rings with subtle Z-layering
  ringRadii.forEach((r, idx) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, (idx - 1.5) * 0.022));
    }
    const hexCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.05);
    const tubeGeo = new THREE.TubeGeometry(
      hexCurve,
      72,
      idx === 3 ? 0.011 : 0.006,
      8,
      true,
    );
    geometries.push(tubeGeo);

    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(idx === 3 ? COLORS.cyan : 0x38bdf8),
      transparent: true,
      opacity: idx === 3 ? 0.68 : 0.24 + idx * 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(ringMat);

    const ringMesh = new THREE.Mesh(tubeGeo, ringMat);
    radarPlane.add(ringMesh);
  });

  // 6 Radial Radar Axes + Outer Vertex Anchor Nodes
  const axisGeo = new THREE.BufferGeometry();
  const axisPositions = new Float32Array(6 * 6);
  const vertexNodeGeo = new THREE.OctahedronGeometry(0.036, 0);
  geometries.push(axisGeo, vertexNodeGeo);

  const vertexNodeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.cyan),
    emissive: new THREE.Color(COLORS.cyan),
    emissiveIntensity: 1.85,
    roughness: 0.15,
    metalness: 0.3,
  });
  const axisMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0x38bdf8),
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
  });
  materials.push(vertexNodeMat, axisMat);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const vx = Math.cos(a) * outerRadius;
    const vy = Math.sin(a) * outerRadius;
    axisPositions.set([0, 0, -0.02, vx, vy, 0.03], i * 6);

    const vNode = new THREE.Mesh(vertexNodeGeo, vertexNodeMat);
    vNode.position.set(vx, vy, 0.035);
    radarPlane.add(vNode);
  }
  axisGeo.setAttribute('position', new THREE.BufferAttribute(axisPositions, 3));
  const axisLines = new THREE.LineSegments(axisGeo, axisMat);
  radarPlane.add(axisLines);

  // Skill DNA Dynamic 6-Vertex Holographic Polygon + Glowing Perimeter
  const skillWeights = [0.88, 0.74, 0.92, 0.79, 0.94, 0.84];
  const polyPositions = new Float32Array(7 * 3); // center + 6 vertices
  const polyUvs = new Float32Array(7 * 2);
  const polyIndices = new Uint16Array([
    0, 1, 2,
    0, 2, 3,
    0, 3, 4,
    0, 4, 5,
    0, 5, 6,
    0, 6, 1,
  ]);
  polyUvs[0] = 0.5;
  polyUvs[1] = 0.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    polyUvs[(i + 1) * 2] = 0.5 + Math.cos(a) * 0.5;
    polyUvs[(i + 1) * 2 + 1] = 0.5 + Math.sin(a) * 0.5;
  }

  const polyGeo = new THREE.BufferGeometry();
  polyGeo.setAttribute('position', new THREE.BufferAttribute(polyPositions, 3));
  polyGeo.setAttribute('uv', new THREE.BufferAttribute(polyUvs, 2));
  polyGeo.setIndex(new THREE.BufferAttribute(polyIndices, 1));
  geometries.push(polyGeo);

  const polyMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLockPulse: { value: 0 },
      uCyan: { value: new THREE.Color(COLORS.cyan) },
      uEmerald: { value: new THREE.Color(COLORS.emerald) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uLockPulse;
      uniform vec3 uCyan;
      uniform vec3 uEmerald;
      varying vec2 vUv;

      void main() {
        float dist = length(vUv - 0.5) * 2.0;
        vec3 col = mix(uCyan, uEmerald, smoothstep(0.15, 0.95, dist));

        // Subtle holographic scanline & lock-pulse shimmer
        float scan = 0.88 + 0.12 * sin(vUv.y * 46.0 - uTime * 2.4);
        float edgeGlow = smoothstep(0.35, 1.0, dist);
        float alpha = (0.18 + edgeGlow * 0.36 + uLockPulse * 0.25) * scan;

        gl_FragColor = vec4(col * (1.0 + uLockPulse * 0.8), clamp(alpha, 0.0, 0.82));
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  materials.push(polyMat);

  const polyMesh = new THREE.Mesh(polyGeo, polyMat);
  polyMesh.position.z = 0.045;
  polyMesh.renderOrder = 5;
  radarPlane.add(polyMesh);

  // Glowing Perimeter LineLoop for Skill DNA Polygon
  const perimPositions = new Float32Array(6 * 3);
  const perimGeo = new THREE.BufferGeometry();
  perimGeo.setAttribute('position', new THREE.BufferAttribute(perimPositions, 3));
  geometries.push(perimGeo);

  const perimMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(COLORS.emerald),
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });
  materials.push(perimMat);

  const perimLoop = new THREE.LineLoop(perimGeo, perimMat);
  perimLoop.position.z = 0.052;
  radarPlane.add(perimLoop);

  // 6 Glowing Skill Vertex Nodes on the radar perimeter
  const skillDotGeo = new THREE.SphereGeometry(0.038, 12, 12);
  geometries.push(skillDotGeo);
  const skillDotMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.emerald),
    emissive: new THREE.Color(COLORS.emerald),
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });
  materials.push(skillDotMat);

  const skillDots: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const dot = new THREE.Mesh(skillDotGeo, skillDotMat);
    dot.position.z = 0.055;
    radarPlane.add(dot);
    skillDots.push(dot);
  }

  // Central Glowing Holographic Core & Precision Outer Gimbal Ring
  const coreGeo = new THREE.OctahedronGeometry(0.11, 0);
  const gimbalGeo = new THREE.TorusGeometry(1.44, 0.011, 14, 96);
  const pulseRingGeo = new THREE.RingGeometry(0.95, 1.0, 6);
  geometries.push(coreGeo, gimbalGeo, pulseRingGeo);

  const coreMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0b3838),
    emissive: new THREE.Color(COLORS.cyan),
    emissiveIntensity: 2.1,
    roughness: 0.12,
    metalness: 0.4,
  });
  const gimbalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x334155),
    emissive: new THREE.Color(COLORS.cyan),
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.9,
  });
  const lockWaveMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(COLORS.emerald),
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  materials.push(coreMat, gimbalMat, lockWaveMat);

  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.z = 0.06;
  holoRoot.add(coreMesh);

  const gimbalMesh = new THREE.Mesh(gimbalGeo, gimbalMat);
  holoRoot.add(gimbalMesh);

  const lockWaveMesh = new THREE.Mesh(pulseRingGeo, lockWaveMat);
  lockWaveMesh.position.z = 0.04;
  lockWaveMesh.rotation.z = Math.PI / 6;
  holoRoot.add(lockWaveMesh);

  // Soft volumetric cyan-emerald holographic halo behind radar chart
  const holoHaloGeo = new THREE.PlaneGeometry(3.8, 3.8);
  geometries.push(holoHaloGeo);
  const holoHaloMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyan: { value: new THREE.Color(COLORS.cyan) },
      uEmerald: { value: new THREE.Color(COLORS.emerald) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uCyan;
      uniform vec3 uEmerald;
      varying vec2 vUv;

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float glow = exp(-r * r * 3.4) * 0.22;
        vec3 col = mix(uCyan, uEmerald, 0.5 + 0.5 * sin(uTime * 0.6 + p.x));
        float clip = 1.0 - smoothstep(0.7, 1.0, r);
        gl_FragColor = vec4(col * glow * clip, glow * clip);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  materials.push(holoHaloMat);

  const holoHaloMesh = new THREE.Mesh(holoHaloGeo, holoHaloMat);
  holoHaloMesh.position.z = -0.18;
  holoRoot.add(holoHaloMesh);

  // =========================================================================
  // 2. LUMINOUS DATA BEAMS (LEFT CARDS -> SKILL DNA -> RIGHT MATCH CARD)
  // =========================================================================
  const beamCurves: THREE.CatmullRomCurve3[] = [
    // GitHub -> Skill DNA
    new THREE.CatmullRomCurve3([
      anchors.githubOutputAnchor.clone(),
      new THREE.Vector3(-1.35, 0.92, -0.05),
      new THREE.Vector3(-0.62, 0.36, 0.16),
      HOLOGRAM_POS.clone().add(new THREE.Vector3(-0.2, 0.08, 0.02)),
    ]),
    // Codeforces -> Skill DNA
    new THREE.CatmullRomCurve3([
      anchors.codeforcesOutputAnchor.clone(),
      new THREE.Vector3(-1.45, -0.05, 0.32),
      new THREE.Vector3(-0.68, 0.02, 0.24),
      HOLOGRAM_POS.clone().add(new THREE.Vector3(-0.22, 0.0, 0.02)),
    ]),
    // Academic -> Skill DNA
    new THREE.CatmullRomCurve3([
      anchors.academicOutputAnchor.clone(),
      new THREE.Vector3(-1.32, -0.82, 0.0),
      new THREE.Vector3(-0.6, -0.3, 0.16),
      HOLOGRAM_POS.clone().add(new THREE.Vector3(-0.2, -0.08, 0.02)),
    ]),
    // Skill DNA -> Right Internship Match Card
    new THREE.CatmullRomCurve3([
      HOLOGRAM_POS.clone().add(new THREE.Vector3(0.24, 0.04, 0.02)),
      new THREE.Vector3(1.12, 0.18, 0.22),
      new THREE.Vector3(1.75, 0.12, 0.14),
      anchors.rightInputAnchor.clone(),
    ]),
  ];

  const beamMaterials: THREE.ShaderMaterial[] = [];
  beamCurves.forEach((curve, idx) => {
    const isOutputBeam = idx === 3;
    const beamGeo = new THREE.TubeGeometry(
      curve,
      72,
      isOutputBeam ? 0.015 : 0.0105,
      10,
      false,
    );
    geometries.push(beamGeo);

    const beamMat = createDataBeamMaterial(
      isOutputBeam ? COLORS.cyan : COLORS.cyan,
      isOutputBeam ? COLORS.emerald : idx === 1 ? COLORS.emerald : COLORS.cyan,
    );
    materials.push(beamMat);
    beamMaterials.push(beamMat);

    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.renderOrder = 6;
    root.add(beamMesh);
  });

  // Traveling micro data-packet beads gliding along the 4 luminous beams
  const PACKETS_PER_BEAM = 4;
  const TOTAL_PACKETS = beamCurves.length * PACKETS_PER_BEAM;
  const packetGeo = new THREE.SphereGeometry(0.028, 10, 10);
  geometries.push(packetGeo);
  const packetMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });
  materials.push(packetMat);

  const packetMesh = new THREE.InstancedMesh(packetGeo, packetMat, TOTAL_PACKETS);
  packetMesh.frustumCulled = false;

  const packetMeta: Array<{ curveIdx: number; offset: number; speed: number }> = [];
  for (let b = 0; b < beamCurves.length; b++) {
    for (let k = 0; k < PACKETS_PER_BEAM; k++) {
      const idx = b * PACKETS_PER_BEAM + k;
      packetMeta.push({
        curveIdx: b,
        offset: k / PACKETS_PER_BEAM + rand() * 0.1,
        speed: 0.26 + (b === 3 ? 0.08 : 0.0),
      });
      _color.setHex(b === 3 ? COLORS.emerald : COLORS.cyan);
      packetMesh.setColorAt(idx, _color);
    }
  }
  if (packetMesh.instanceColor) packetMesh.instanceColor.needsUpdate = true;
  root.add(packetMesh);

  // =========================================================================
  // 3. SUBTLE DEPTH-OF-FIELD BOKEH PARTICLES IN OBSIDIAN SPACE
  // =========================================================================
  const DUST_COUNT = 180;
  const dustPos = new Float32Array(DUST_COUNT * 3);
  const dustScale = new Float32Array(DUST_COUNT);
  const dustPhase = new Float32Array(DUST_COUNT);
  const dustColor = new Float32Array(DUST_COUNT * 3);

  for (let i = 0; i < DUST_COUNT; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 10.5;
    dustPos[i * 3 + 1] = (rand() - 0.5) * 5.2;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 6.0;
    dustScale[i] = 0.65 + rand() * 1.5;
    dustPhase[i] = rand() * Math.PI * 2;

    _color.setHex(rand() > 0.45 ? COLORS.cyan : COLORS.emerald).multiplyScalar(0.75);
    dustColor[i * 3] = _color.r;
    dustColor[i * 3 + 1] = _color.g;
    dustColor[i * 3 + 2] = _color.b;
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aScale', new THREE.BufferAttribute(dustScale, 1));
  dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(dustPhase, 1));
  dustGeo.setAttribute('aColor', new THREE.BufferAttribute(dustColor, 3));
  geometries.push(dustGeo);

  const dustMat = createBokehDustMaterial();
  materials.push(dustMat);

  const dustPoints = new THREE.Points(dustGeo, dustMat);
  dustPoints.renderOrder = 1;
  root.add(dustPoints);

  // =========================================================================
  // FRAME UPDATE: ROTATION + LOCK-INTO-PLACE PULSE + BEAM FLOW
  // =========================================================================
  return {
    group: root,
    update: (elapsed: number, pixelRatio: number) => {
      polyMat.uniforms.uTime.value = elapsed;
      holoHaloMat.uniforms.uTime.value = elapsed;
      dustMat.uniforms.uTime.value = elapsed;
      dustMat.uniforms.uPixelRatio.value = pixelRatio;

      beamMaterials.forEach((m) => {
        m.uniforms.uTime.value = elapsed;
      });

      // Smooth 6-second cycle: smoothly rotates 60 degrees and locks into place with a luminous pulse
      const cycleDuration = 6.5;
      const cycleIndex = Math.floor(elapsed / cycleDuration);
      const cyclePhase = (elapsed % cycleDuration) / cycleDuration;

      // Rotate during first 45% of cycle, settle & lock during remaining 55%
      const moveT = THREE.MathUtils.clamp(cyclePhase / 0.45, 0, 1);
      const easedMove = moveT * moveT * (3 - 2 * moveT); // smoothstep
      const lockAngle = (cycleIndex + easedMove) * (Math.PI / 3);

      // Pulse peaks right as the Skill DNA hexagon locks into alignment
      const lockDelta = Math.max(0, cyclePhase - 0.44);
      const lockPulse =
        cyclePhase >= 0.44 ? Math.exp(-lockDelta * 7.5) * Math.sin(Math.min(lockDelta * 14, Math.PI)) : 0;

      polyMat.uniforms.uLockPulse.value = lockPulse;

      // Rotate the radar assembly smoothly into hexagonal alignment
      radarPlane.rotation.z = lockAngle;
      holoRoot.position.y = HOLOGRAM_POS.y + Math.sin(elapsed * 0.8) * 0.045;
      holoRoot.rotation.y = -0.06 + Math.sin(elapsed * 0.45) * 0.08;

      // Subtle breathing on Skill DNA vertices
      const pAttr = polyGeo.attributes.position as THREE.BufferAttribute;
      const perimAttr = perimGeo.attributes.position as THREE.BufferAttribute;

      pAttr.setXYZ(0, 0, 0, 0.02);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const breathe = 1.0 + Math.sin(elapsed * 1.4 + i * 0.9) * 0.045 + lockPulse * 0.05;
        const r = outerRadius * skillWeights[i] * breathe;
        const vx = Math.cos(a) * r;
        const vy = Math.sin(a) * r;

        pAttr.setXYZ(i + 1, vx, vy, 0.0);
        perimAttr.setXYZ(i, vx, vy, 0.0);
        skillDots[i].position.set(vx, vy, 0.055);
      }
      pAttr.needsUpdate = true;
      perimAttr.needsUpdate = true;

      // Lock-in hexagonal pulse ring expansion
      if (cyclePhase >= 0.44) {
        const waveT = (cyclePhase - 0.44) / 0.56;
        lockWaveMesh.scale.setScalar(0.85 + waveT * 0.72);
        lockWaveMat.opacity = (1.0 - waveT) * 0.45;
      } else {
        lockWaveMat.opacity = 0.0;
      }

      coreMesh.rotation.y = elapsed * 0.85;
      coreMesh.rotation.x = elapsed * 0.45;
      gimbalMesh.rotation.z = -elapsed * 0.18;

      // Update traveling data packets along all 4 beams
      for (let i = 0; i < TOTAL_PACKETS; i++) {
        const meta = packetMeta[i];
        const curve = beamCurves[meta.curveIdx];
        const t = (meta.offset + elapsed * meta.speed) % 1.0;
        curve.getPointAt(t, _vecA);

        const edgeEnv =
          THREE.MathUtils.smoothstep(t, 0.0, 0.12) *
          (1.0 - THREE.MathUtils.smoothstep(t, 0.88, 1.0));
        _dummy.position.copy(_vecA);
        _dummy.scale.setScalar(Math.max(edgeEnv * 1.15, 0.001));
        _dummy.updateMatrix();
        packetMesh.setMatrixAt(i, _dummy.matrix);
      }
      packetMesh.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
