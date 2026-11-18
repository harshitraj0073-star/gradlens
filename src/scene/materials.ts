import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { COLORS } from './constants';

export function detectSoftwareWebGL(): boolean {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export interface StudioRig {
  dispose: () => void;
}

export function setupStudioEnvironmentAndLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean,
): StudioRig {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTarget = pmremGenerator.fromScene(roomEnv, 0.045);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.88;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // Soft cool sky / obsidian ground fill
  const hemi = new THREE.HemisphereLight(0x94a3b8, 0x07090e, 0.65);
  scene.add(hemi);

  // Clean Linear-style cool top-front key light for glass bevel speculars
  const keyLight = new THREE.DirectionalLight(0xf1f5f9, 1.85);
  keyLight.position.set(2.5, 5.5, 6.0);
  scene.add(keyLight);

  // Soft cyan rim light sweeping left cards & central hologram
  const cyanRim = new THREE.PointLight(COLORS.cyan, 5.2, 12.0, 1.45);
  cyanRim.position.set(-2.1, 1.8, -1.6);
  scene.add(cyanRim);

  // Soft emerald rim light illuminating central Skill DNA & right Internship Match card
  const emeraldRim = new THREE.PointLight(COLORS.emerald, 5.4, 12.0, 1.45);
  emeraldRim.position.set(2.6, -0.8, -1.4);
  scene.add(emeraldRim);

  // Subtle cool indigo backlight behind central hologram
  const centerRim = new THREE.PointLight(0x38bdf8, 3.4, 9.5, 1.5);
  centerRim.position.set(0.0, 0.4, -2.0);
  scene.add(centerRim);

  // Elongated studio softboxes on GPU for sleek Linear/Apple glass edge reflections
  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    const topSoftbox = new THREE.RectAreaLight(0xe0f2fe, 2.8, 9.0, 0.65);
    topSoftbox.position.set(0.0, 4.2, 2.4);
    topSoftbox.lookAt(0.0, 0.0, 0.0);
    scene.add(topSoftbox);

    const leftRimStrip = new THREE.RectAreaLight(COLORS.cyan, 2.2, 0.55, 4.8);
    leftRimStrip.position.set(-4.6, 0.0, -1.0);
    leftRimStrip.lookAt(-2.6, 0.0, 0.0);
    scene.add(leftRimStrip);

    const rightRimStrip = new THREE.RectAreaLight(COLORS.emerald, 2.4, 0.55, 4.8);
    rightRimStrip.position.set(4.8, 0.0, -1.0);
    rightRimStrip.lookAt(2.8, 0.0, 0.0);
    scene.add(rightRimStrip);
  }

  return {
    dispose: () => {
      envTarget.dispose();
    },
  };
}

export function createDarkGlassMaterial(isSoftwareGl: boolean): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0c1220),
    metalness: 0.06,
    roughness: 0.14,
    transmission: isSoftwareGl ? 0.0 : 0.72,
    transparent: true,
    opacity: isSoftwareGl ? 0.82 : 0.96,
    ior: 1.48,
    thickness: 0.35,
    attenuationColor: new THREE.Color(0x0d1b2a),
    attenuationDistance: 1.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 0.9,
    envMapIntensity: 1.55,
  });
}

export function createGlassRimBorderMaterial(
  primaryColor: number,
  secondaryColor: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(primaryColor) },
      uColorB: { value: new THREE.Color(secondaryColor) },
    },
    vertexShader: `
      varying vec3 vLocalPos;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        vLocalPos = position;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;

      varying vec3 vLocalPos;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        float grad = clamp(0.5 + vLocalPos.x * 0.45 + vLocalPos.y * 0.35, 0.0, 1.0);
        float shimmer = 0.5 + 0.5 * sin(uTime * 0.9 + vLocalPos.x * 2.2 + vLocalPos.y * 1.6);
        vec3 col = mix(uColorA, uColorB, grad);

        float ndotv = abs(dot(normalize(vNormalView), normalize(vViewDir)));
        float rim = mix(0.65, 1.25, 1.0 - ndotv);

        gl_FragColor = vec4(col * (0.7 + shimmer * 0.45) * rim, 0.82);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createDataBeamMaterial(
  colorStart: number,
  colorEnd: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorStart: { value: new THREE.Color(colorStart) },
      uColorEnd: { value: new THREE.Color(colorEnd) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorStart;
      uniform vec3 uColorEnd;

      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        float t = vUv.x;
        vec3 baseCol = mix(uColorStart, uColorEnd, smoothstep(0.05, 0.95, t));

        float p1 = fract(uTime * 0.38);
        float d1 = min(abs(t - p1), 1.0 - abs(t - p1));
        float pulse1 = exp(-pow(d1 * 11.0, 2.0));

        float p2 = fract(uTime * 0.38 + 0.5);
        float d2 = min(abs(t - p2), 1.0 - abs(t - p2));
        float pulse2 = exp(-pow(d2 * 11.0, 2.0)) * 0.65;

        float ndotv = abs(dot(normalize(vNormalView), normalize(vViewDir)));
        float core = pow(ndotv, 0.7);
        float endFade = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.92, 1.0, t));

        vec3 finalCol = baseCol * (0.75 + (pulse1 + pulse2) * 1.45);
        float alpha = (0.36 * core + (pulse1 + pulse2) * 0.55) * endFade;

        gl_FragColor = vec4(finalCol, clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createBokehDustMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: `
      attribute float aScale;
      attribute float aPhase;
      attribute vec3 aColor;

      uniform float uTime;
      uniform float uPixelRatio;

      varying vec3 vColor;
      varying float vBlur;
      varying float vAlpha;

      void main() {
        vColor = aColor;
        vec3 pos = position;
        pos.y += sin(uTime * 0.32 + aPhase) * 0.12;
        pos.x += cos(uTime * 0.24 + aPhase * 1.2) * 0.06;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float distFromFocus = abs(pos.z);

        vBlur = clamp(distFromFocus * 0.28, 0.08, 1.0);
        vAlpha = clamp(1.0 - distFromFocus * 0.12, 0.14, 0.68);

        float size = aScale * (1.0 + vBlur * 2.1) * uPixelRatio;
        gl_PointSize = clamp(size * (115.0 / max(-mvPosition.z, 1.0)), 2.0, 44.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vBlur;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv) * 2.0;
        if (d > 1.0) discard;

        float edgeStart = mix(0.26, 0.0, vBlur);
        float disc = 1.0 - smoothstep(edgeStart, 1.0, d);
        float ring = exp(-pow((d - 0.72) * 5.0, 2.0)) * vBlur * 0.25;

        float alpha = (disc * 0.62 + ring) * vAlpha * 0.52;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
