import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  createAcademicCardTexture,
  createCodeforcesCardTexture,
  createGitHubCardTexture,
  createInternshipMatchTexture,
} from './cardTextures';
import {
  COLORS,
  LEFT_CARD_TRANSFORMS,
  RIGHT_CARD_TRANSFORM,
  createSeededRandom,
} from './constants';
import {
  createDarkGlassMaterial,
  createGlassRimBorderMaterial,
} from './materials';

export interface GlassCardsHandle {
  group: THREE.Group;
  githubOutputAnchor: THREE.Vector3;
  codeforcesOutputAnchor: THREE.Vector3;
  academicOutputAnchor: THREE.Vector3;
  rightInputAnchor: THREE.Vector3;
  update: (elapsed: number) => void;
  dispose: () => void;
}

function createRoundedCardShape(width: number, height: number, radius: number): THREE.Shape {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

function createRoundedBorderCurve(
  width: number,
  height: number,
  radius: number,
  zOffset: number,
): THREE.CatmullRomCurve3 {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);
  const pts: THREE.Vector3[] = [];
  const cornerSegs = 6;

  const corners = [
    { cx: hw - r, cy: -hh + r, start: -Math.PI / 2, end: 0 },
    { cx: hw - r, cy: hh - r, start: 0, end: Math.PI / 2 },
    { cx: -hw + r, cy: hh - r, start: Math.PI / 2, end: Math.PI },
    { cx: -hw + r, cy: -hh + r, start: Math.PI, end: Math.PI * 1.5 },
  ];

  corners.forEach((c) => {
    for (let i = 0; i <= cornerSegs; i++) {
      const a = THREE.MathUtils.lerp(c.start, c.end, i / cornerSegs);
      pts.push(
        new THREE.Vector3(c.cx + Math.cos(a) * r, c.cy + Math.sin(a) * r, zOffset),
      );
    }
  });

  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.15);
}

export function createGlassCardsShowcase(
  isSoftwareGl: boolean,
  maxAnisotropy: number,
): GlassCardsHandle {
  const rand = createSeededRandom(90817);
  const root = new THREE.Group();

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const rimMaterials: THREE.ShaderMaterial[] = [];

  const glassMat = createDarkGlassMaterial(isSoftwareGl);
  materials.push(glassMat);

  // Shared left-card geometry (16:10 aspect: 1.92 x 1.20)
  const leftW = 1.92;
  const leftH = 1.2;
  const leftShape = createRoundedCardShape(leftW, leftH, 0.085);
  const leftExtrudeGeo = new THREE.ExtrudeGeometry(leftShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 16,
  });
  leftExtrudeGeo.translate(0, 0, -0.016);
  geometries.push(leftExtrudeGeo);

  const leftBorderCurve = createRoundedBorderCurve(leftW + 0.02, leftH + 0.02, 0.095, 0.0);
  const leftBorderGeo = new THREE.TubeGeometry(leftBorderCurve, 96, 0.0065, 8, true);
  geometries.push(leftBorderGeo);

  const leftPlaneGeo = new THREE.PlaneGeometry(leftW - 0.06, leftH - 0.06);
  geometries.push(leftPlaneGeo);

  // Helper to assemble a left glass card chassis
  function buildLeftChassis(
    pos: THREE.Vector3,
    rot: THREE.Euler,
    tex: THREE.CanvasTexture,
    rimA: number,
    rimB: number,
  ): THREE.Group {
    const cardGroup = new THREE.Group();
    cardGroup.position.copy(pos);
    cardGroup.rotation.copy(rot);

    const glassMesh = new THREE.Mesh(leftExtrudeGeo, glassMat);
    glassMesh.renderOrder = 2;
    cardGroup.add(glassMesh);

    const rimMat = createGlassRimBorderMaterial(rimA, rimB);
    materials.push(rimMat);
    rimMaterials.push(rimMat);

    const rimMesh = new THREE.Mesh(leftBorderGeo, rimMat);
    rimMesh.renderOrder = 3;
    cardGroup.add(rimMesh);

    const uiMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    materials.push(uiMat);

    const uiMesh = new THREE.Mesh(leftPlaneGeo, uiMat);
    uiMesh.position.z = 0.031;
    uiMesh.renderOrder = 4;
    cardGroup.add(uiMesh);

    root.add(cardGroup);
    return cardGroup;
  }

  // =========================================================================
  // CARD 1 (TOP-LEFT): GITHUB COMMIT GRAPH + 3D RELIEF MATRIX
  // =========================================================================
  const ghTex = createGitHubCardTexture(maxAnisotropy);
  textures.push(ghTex);
  const githubCard = buildLeftChassis(
    LEFT_CARD_TRANSFORMS.github.pos,
    LEFT_CARD_TRANSFORMS.github.rot,
    ghTex,
    COLORS.cyan,
    COLORS.emerald,
  );

  const ghCols = 14;
  const ghRows = 5;
  const ghCubeGeo = new RoundedBoxGeometry(0.078, 0.078, 0.036, 2, 0.01);
  geometries.push(ghCubeGeo);
  const ghCubeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffffff),
    emissive: new THREE.Color(0x10b981),
    emissiveIntensity: 0.72,
    roughness: 0.22,
    metalness: 0.4,
  });
  materials.push(ghCubeMat);

  const ghMatrix = new THREE.InstancedMesh(ghCubeGeo, ghCubeMat, ghCols * ghRows);
  const ghDummy = new THREE.Object3D();
  const ghCol = new THREE.Color();
  const ghLevels: number[] = [];

  for (let c = 0; c < ghCols; c++) {
    for (let r = 0; r < ghRows; r++) {
      const idx = c * ghRows + r;
      const activity = rand();
      ghLevels.push(activity);

      if (activity < 0.22) ghCol.setHex(0x0f172a);
      else if (activity < 0.55) ghCol.setHex(0x0e7490);
      else if (activity < 0.82) ghCol.setHex(COLORS.cyan);
      else ghCol.setHex(COLORS.emerald);

      ghMatrix.setColorAt(idx, ghCol);

      const x = -0.77 + c * 0.12;
      const y = 0.206 - r * 0.1176;
      ghDummy.position.set(x, y, 0.048);
      ghDummy.scale.set(1, 1, 0.55 + activity * 1.15);
      ghDummy.updateMatrix();
      ghMatrix.setMatrixAt(idx, ghDummy.matrix);
    }
  }
  if (ghMatrix.instanceColor) ghMatrix.instanceColor.needsUpdate = true;
  ghMatrix.computeBoundingSphere();
  githubCard.add(ghMatrix);

  // =========================================================================
  // CARD 2 (MID-LEFT): CODEFORCES RATING-STEP BARS + 3D ASCENDING BARS
  // =========================================================================
  const cfTex = createCodeforcesCardTexture(maxAnisotropy);
  textures.push(cfTex);
  const codeforcesCard = buildLeftChassis(
    LEFT_CARD_TRANSFORMS.codeforces.pos,
    LEFT_CARD_TRANSFORMS.codeforces.rot,
    cfTex,
    COLORS.cyan,
    COLORS.indigo,
  );

  const barCount = 8;
  const barHeights = [0.22, 0.28, 0.25, 0.36, 0.44, 0.41, 0.54, 0.64];
  const barGeo = new RoundedBoxGeometry(0.11, 1.0, 0.045, 2, 0.012);
  geometries.push(barGeo);
  const barMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffffff),
    emissive: new THREE.Color(COLORS.cyan),
    emissiveIntensity: 0.82,
    roughness: 0.18,
    metalness: 0.45,
  });
  materials.push(barMat);

  const cfBars = new THREE.InstancedMesh(barGeo, barMat, barCount);
  const cyanCol = new THREE.Color(COLORS.cyan);
  const emeraldCol = new THREE.Color(COLORS.emerald);

  for (let i = 0; i < barCount; i++) {
    const t = i / (barCount - 1);
    ghCol.copy(cyanCol).lerp(emeraldCol, t);
    cfBars.setColorAt(i, ghCol);

    const h = barHeights[i];
    const x = -0.68 + i * 0.194;
    const y = -0.34 + h / 2;
    ghDummy.position.set(x, y, 0.052);
    ghDummy.scale.set(1, h, 1);
    ghDummy.updateMatrix();
    cfBars.setMatrixAt(i, ghDummy.matrix);
  }
  if (cfBars.instanceColor) cfBars.instanceColor.needsUpdate = true;
  cfBars.computeBoundingSphere();
  codeforcesCard.add(cfBars);

  // =========================================================================
  // CARD 3 (BOTTOM-LEFT): 4-SEMESTER ACADEMIC TREND LINES + 3D SPLINE
  // =========================================================================
  const acTex = createAcademicCardTexture(maxAnisotropy);
  textures.push(acTex);
  const academicCard = buildLeftChassis(
    LEFT_CARD_TRANSFORMS.academic.pos,
    LEFT_CARD_TRANSFORMS.academic.rot,
    acTex,
    COLORS.emerald,
    COLORS.cyan,
  );

  const trendPts = [
    new THREE.Vector3(-0.62, -0.22, 0.055),
    new THREE.Vector3(-0.21, -0.1, 0.062),
    new THREE.Vector3(0.21, 0.08, 0.068),
    new THREE.Vector3(0.62, 0.24, 0.075),
  ];
  const trendCurve = new THREE.CatmullRomCurve3(trendPts, false, 'catmullrom', 0.4);
  const trendTubeGeo = new THREE.TubeGeometry(trendCurve, 64, 0.015, 12, false);
  const trendNodeGeo = new THREE.SphereGeometry(0.036, 16, 16);
  geometries.push(trendTubeGeo, trendNodeGeo);

  const trendTubeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.cyan),
    emissive: new THREE.Color(COLORS.cyan),
    emissiveIntensity: 1.65,
    roughness: 0.15,
    metalness: 0.3,
  });
  const trendNodeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.emerald),
    emissive: new THREE.Color(COLORS.emerald),
    emissiveIntensity: 1.9,
    roughness: 0.12,
    metalness: 0.25,
  });
  materials.push(trendTubeMat, trendNodeMat);

  const trendMesh = new THREE.Mesh(trendTubeGeo, trendTubeMat);
  academicCard.add(trendMesh);

  const trendNodes: THREE.Mesh[] = [];
  trendPts.forEach((pt) => {
    const node = new THREE.Mesh(trendNodeGeo, trendNodeMat);
    node.position.copy(pt);
    academicCard.add(node);
    trendNodes.push(node);
  });

  // =========================================================================
  // RIGHT CARD: CRISP GLASSMORPHIC INTERNSHIP MATCH CARD + GLOWING EMERALD RING
  // =========================================================================
  const rightW = 2.04;
  const rightH = 2.55;
  const rightShape = createRoundedCardShape(rightW, rightH, 0.11);
  const rightExtrudeGeo = new THREE.ExtrudeGeometry(rightShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 3,
    curveSegments: 16,
  });
  rightExtrudeGeo.translate(0, 0, -0.02);
  geometries.push(rightExtrudeGeo);

  const rightBorderCurve = createRoundedBorderCurve(rightW + 0.024, rightH + 0.024, 0.12, 0);
  const rightBorderGeo = new THREE.TubeGeometry(rightBorderCurve, 112, 0.0075, 8, true);
  const rightPlaneGeo = new THREE.PlaneGeometry(rightW - 0.08, rightH - 0.08);
  geometries.push(rightBorderGeo, rightPlaneGeo);

  const rightCard = new THREE.Group();
  rightCard.position.copy(RIGHT_CARD_TRANSFORM.pos);
  rightCard.rotation.copy(RIGHT_CARD_TRANSFORM.rot);

  const rightGlassMesh = new THREE.Mesh(rightExtrudeGeo, glassMat);
  rightGlassMesh.renderOrder = 2;
  rightCard.add(rightGlassMesh);

  const rightRimMat = createGlassRimBorderMaterial(COLORS.emerald, COLORS.cyan);
  materials.push(rightRimMat);
  rimMaterials.push(rightRimMat);

  const rightRimMesh = new THREE.Mesh(rightBorderGeo, rightRimMat);
  rightRimMesh.renderOrder = 3;
  rightCard.add(rightRimMesh);

  const rightTex = createInternshipMatchTexture(maxAnisotropy);
  textures.push(rightTex);
  const rightUiMat = new THREE.MeshBasicMaterial({
    map: rightTex,
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  materials.push(rightUiMat);
  const rightUiMesh = new THREE.Mesh(rightPlaneGeo, rightUiMat);
  rightUiMesh.position.z = 0.038;
  rightUiMesh.renderOrder = 4;
  rightCard.add(rightUiMesh);

  // 3D Glowing Emerald Readiness Ring floating cleanly in front of upper Match Card
  const ringCenterY = 0.39;
  const trackRingGeo = new THREE.TorusGeometry(0.49, 0.022, 16, 80);
  const activeRingGeo = new THREE.TorusGeometry(0.49, 0.028, 20, 80, Math.PI * 2 * 0.94);
  const outerHaloRingGeo = new THREE.TorusGeometry(0.56, 0.006, 10, 80);
  const tipBeaconGeo = new THREE.SphereGeometry(0.044, 16, 16);
  geometries.push(trackRingGeo, activeRingGeo, outerHaloRingGeo, tipBeaconGeo);

  const trackRingMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0f172a),
    roughness: 0.4,
    metalness: 0.8,
  });
  const activeRingMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.emerald),
    emissive: new THREE.Color(COLORS.emerald),
    emissiveIntensity: 1.95,
    roughness: 0.14,
    metalness: 0.25,
  });
  const haloRingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(COLORS.emerald),
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
  });
  const tipBeaconMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xa7f3d0),
    emissive: new THREE.Color(0x6ee7b7),
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });
  materials.push(trackRingMat, activeRingMat, haloRingMat, tipBeaconMat);

  const trackRingMesh = new THREE.Mesh(trackRingGeo, trackRingMat);
  trackRingMesh.position.set(0, ringCenterY, 0.068);
  rightCard.add(trackRingMesh);

  const activeRingMesh = new THREE.Mesh(activeRingGeo, activeRingMat);
  activeRingMesh.position.set(0, ringCenterY, 0.075);
  activeRingMesh.rotation.z = Math.PI * 0.5;
  rightCard.add(activeRingMesh);

  const haloRingMesh = new THREE.Mesh(outerHaloRingGeo, haloRingMat);
  haloRingMesh.position.set(0, ringCenterY, 0.07);
  rightCard.add(haloRingMesh);

  const tipAngle = Math.PI * 0.5 + Math.PI * 2 * 0.94;
  const tipBeaconMesh = new THREE.Mesh(tipBeaconGeo, tipBeaconMat);
  tipBeaconMesh.position.set(
    Math.cos(tipAngle) * 0.49,
    ringCenterY + Math.sin(tipAngle) * 0.49,
    0.076,
  );
  rightCard.add(tipBeaconMesh);

  // 3D Luminous Match Bars floating inside the 3 role slots below the readiness ring
  const roleWidths = [1.59, 1.54, 1.5];
  const roleColors = [COLORS.emerald, COLORS.cyan, COLORS.cyan];
  const roleBarY = [-0.421, -0.7, -0.98];

  roleWidths.forEach((bw, idx) => {
    const rBarGeo = new RoundedBoxGeometry(bw, 0.03, 0.022, 2, 0.01);
    geometries.push(rBarGeo);
    const rBarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(roleColors[idx]),
      emissive: new THREE.Color(roleColors[idx]),
      emissiveIntensity: idx === 0 ? 1.55 : 1.15,
      roughness: 0.18,
      metalness: 0.35,
    });
    materials.push(rBarMat);
    const barMesh = new THREE.Mesh(rBarGeo, rBarMat);
    barMesh.position.set(-0.85 + bw / 2, roleBarY[idx], 0.054);
    rightCard.add(barMesh);
  });

  root.add(rightCard);

  // Compute exact world-space anchor points for luminous data beams
  root.updateMatrixWorld(true);
  const githubOutputAnchor = new THREE.Vector3(leftW / 2, 0, 0).applyMatrix4(
    githubCard.matrixWorld,
  );
  const codeforcesOutputAnchor = new THREE.Vector3(leftW / 2, 0, 0).applyMatrix4(
    codeforcesCard.matrixWorld,
  );
  const academicOutputAnchor = new THREE.Vector3(leftW / 2, 0, 0).applyMatrix4(
    academicCard.matrixWorld,
  );
  const rightInputAnchor = new THREE.Vector3(-rightW / 2, 0.05, 0).applyMatrix4(
    rightCard.matrixWorld,
  );

  return {
    group: root,
    githubOutputAnchor,
    codeforcesOutputAnchor,
    academicOutputAnchor,
    rightInputAnchor,
    update: (elapsed: number) => {
      rimMaterials.forEach((mat) => {
        mat.uniforms.uTime.value = elapsed;
      });

      // Gentle zero-G floating cadence on the glass cards
      githubCard.position.y =
        LEFT_CARD_TRANSFORMS.github.pos.y + Math.sin(elapsed * 0.72 + 0.2) * 0.04;
      codeforcesCard.position.y =
        LEFT_CARD_TRANSFORMS.codeforces.pos.y + Math.sin(elapsed * 0.68 + 1.4) * 0.045;
      academicCard.position.y =
        LEFT_CARD_TRANSFORMS.academic.pos.y + Math.sin(elapsed * 0.75 + 2.6) * 0.04;

      rightCard.position.y =
        RIGHT_CARD_TRANSFORM.pos.y + Math.sin(elapsed * 0.64 + 0.9) * 0.042;

      // Subtle breathing pulse on the emerald readiness ring & trend nodes
      const ringPulse = 1.75 + Math.sin(elapsed * 1.4) * 0.35;
      activeRingMat.emissiveIntensity = ringPulse;
      haloRingMat.opacity = 0.28 + Math.sin(elapsed * 1.4) * 0.1;

      for (let i = 0; i < trendNodes.length; i++) {
        const s = 1.0 + Math.sin(elapsed * 1.8 - i * 0.6) * 0.12;
        trendNodes[i].scale.setScalar(s);
      }

      // Subtle breathing depth on GitHub 3D commit matrix
      for (let c = 0; c < ghCols; c++) {
        for (let r = 0; r < ghRows; r++) {
          const idx = c * ghRows + r;
          const act = ghLevels[idx];
          const x = -0.77 + c * 0.12;
          const y = 0.206 - r * 0.1176;
          const zScale =
            0.55 + act * 1.15 + Math.sin(elapsed * 1.2 + c * 0.35 + r * 0.5) * 0.14;
          ghDummy.position.set(x, y, 0.048);
          ghDummy.scale.set(1, 1, Math.max(zScale, 0.25));
          ghDummy.updateMatrix();
          ghMatrix.setMatrixAt(idx, ghDummy.matrix);
        }
      }
      ghMatrix.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
