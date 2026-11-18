'use client';

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { COLORS } from './constants';
import { createGlassCardsShowcase } from './glassCards';
import {
  detectSoftwareWebGL,
  setupStudioEnvironmentAndLighting,
} from './materials';
import { createSkillDnaAndBeams } from './skillDnaHologram';

export interface GradLensCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  setExportLock: (locked: boolean) => void;
  renderDeterministicFrame: (elapsedSec: number) => void;
  renderCurrentFrame: () => void;
}

const OpticalDepthVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAspect: { value: 1.777 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    varying vec2 vUv;

    void main() {
      vec2 centered = (vUv - 0.5) * vec2(uAspect, 1.0);
      float dist = length(centered);

      float vig = smoothstep(0.62, 1.42, dist);
      vec4 base = texture2D(tDiffuse, vUv);

      vec2 dir = (vUv - 0.5) * 0.0015 * vig;
      vec4 s1 = texture2D(tDiffuse, vUv + dir);
      vec4 s2 = texture2D(tDiffuse, vUv - dir);
      vec3 color = mix(base.rgb, (base.rgb + s1.rgb + s2.rgb) / 3.0, vig * 0.42);

      color *= mix(1.0, 0.8, vig);
      gl_FragColor = vec4(color, base.a);
    }
  `,
};

export const GradLensCanvas = forwardRef<GradLensCanvasHandle>(function GradLensCanvas(
  _props,
  ref,
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const runtimeRef = useRef<{
    canvas: HTMLCanvasElement;
    setExportLock: (locked: boolean) => void;
    renderDeterministicFrame: (elapsedSec: number) => void;
    renderCurrentFrame: () => void;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => runtimeRef.current?.canvas ?? null,
    setExportLock: (locked: boolean) => runtimeRef.current?.setExportLock(locked),
    renderDeterministicFrame: (elapsedSec: number) =>
      runtimeRef.current?.renderDeterministicFrame(elapsedSec),
    renderCurrentFrame: () => runtimeRef.current?.renderCurrentFrame(),
  }));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const pixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(COLORS.bgObsidian, 1);

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bgObsidian);
    scene.fog = new THREE.FogExp2(COLORS.bgObsidian, 0.036);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 60);
    const baseTarget = new THREE.Vector3(0.05, 0.02, 0.0);
    const baseRadius = 9.25;
    camera.position.set(-1.35, 0.42, baseRadius);
    camera.lookAt(baseTarget);

    const studioRig = setupStudioEnvironmentAndLighting(scene, renderer, isSoftwareGl);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const glassCards = createGlassCardsShowcase(isSoftwareGl, maxAnisotropy);
    scene.add(glassCards.group);

    const skillDnaHologram = createSkillDnaAndBeams({
      githubOutputAnchor: glassCards.githubOutputAnchor,
      codeforcesOutputAnchor: glassCards.codeforcesOutputAnchor,
      academicOutputAnchor: glassCards.academicOutputAnchor,
      rightInputAnchor: glassCards.rightInputAnchor,
    });
    scene.add(skillDnaHologram.group);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(baseTarget);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.045;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.36;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.minAzimuthAngle = -0.55;
    controls.maxAzimuthAngle = 0.55;

    let userInteracting = false;
    let lastInteractionTime = -100;
    const onControlStart = () => {
      userInteracting = true;
    };
    const onControlEnd = () => {
      userInteracting = false;
      lastInteractionTime = performance.now() * 0.001;
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerTarget.y = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    let vignettePass: ShaderPass | null = null;

    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.42,
        0.58,
        0.74,
      );
      composer.addPass(bloomPass);

      vignettePass = new ShaderPass(OpticalDepthVignetteShader);
      vignettePass.uniforms.uAspect.value = width / Math.max(height, 1);
      composer.addPass(vignettePass);

      composer.addPass(new OutputPass());
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const pr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);

      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(pr);
      renderer.setSize(w, h);

      if (composer && bloomPass && vignettePass) {
        composer.setPixelRatio(pr);
        composer.setSize(w, h);
        bloomPass.resolution.set(w, h);
        vignettePass.uniforms.uAspect.value = w / Math.max(h, 1);
      }
    };
    window.addEventListener('resize', handleResize);

    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    let frameId = 0;
    let disposed = false;
    let exportLocked = false;
    const clock = new THREE.Clock();
    const desiredCamPos = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();

    function computeCinematicCamera(elapsedSec: number, px: number, py: number) {
      const panPhase = elapsedSec * ((Math.PI * 2) / 28.0);
      const azimuth = -Math.cos(panPhase) * 0.16 + px * 0.045;
      const panX = -Math.cos(panPhase) * 0.48 + px * 0.16;
      const elevation = 0.045 + Math.sin(panPhase * 0.5) * 0.035 - py * 0.03;
      const radius = baseRadius + Math.sin(panPhase) * 0.28;

      desiredTarget.set(
        baseTarget.x + panX * 0.45 + px * 0.08,
        baseTarget.y - py * 0.06,
        baseTarget.z,
      );

      desiredCamPos.set(
        desiredTarget.x + Math.sin(azimuth) * Math.cos(elevation) * radius,
        desiredTarget.y + Math.sin(elevation) * radius,
        Math.cos(azimuth) * Math.cos(elevation) * radius,
      );
    }

    function drawFrame() {
      if (contextLost) return;
      if (composer) composer.render();
      else renderer.render(scene, camera);
    }

    runtimeRef.current = {
      canvas: renderer.domElement,
      setExportLock: (locked: boolean) => {
        exportLocked = locked;
        clock.getDelta();
        if (!locked && !disposed) {
          cancelAnimationFrame(frameId);
          clearTimeout(frameId);
          if (isSoftwareGl) {
            drawFrame();
            afterDraw(tick);
          } else {
            frameId = requestAnimationFrame(tick);
          }
        }
      },
      renderDeterministicFrame: (elapsedSec: number) => {
        glassCards.update(elapsedSec);
        skillDnaHologram.update(elapsedSec, renderer.getPixelRatio());
        computeCinematicCamera(elapsedSec, 0, 0);
        camera.position.copy(desiredCamPos);
        controls.target.copy(desiredTarget);
        controls.update();
        drawFrame();
      },
      renderCurrentFrame: () => {
        drawFrame();
      },
    };

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed || exportLocked) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed || exportLocked) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const motionElapsed = prefersReducedMotion ? elapsed * 0.08 : elapsed;

      pointerSmooth.x = THREE.MathUtils.damp(pointerSmooth.x, pointerTarget.x, 3.2, delta);
      pointerSmooth.y = THREE.MathUtils.damp(pointerSmooth.y, pointerTarget.y, 3.2, delta);

      glassCards.update(motionElapsed);
      skillDnaHologram.update(motionElapsed, renderer.getPixelRatio());

      const nowSec = performance.now() * 0.001;
      const idleDuration = nowSec - lastInteractionTime;

      if (!userInteracting && idleDuration > 3.5) {
        computeCinematicCamera(motionElapsed, pointerSmooth.x, pointerSmooth.y);

        const dampSpeed = idleDuration < 6.0 ? 1.5 : 3.2;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          desiredCamPos.x,
          dampSpeed,
          delta,
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          desiredCamPos.y,
          dampSpeed,
          delta,
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          desiredCamPos.z,
          dampSpeed,
          delta,
        );
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          desiredTarget.x,
          dampSpeed,
          delta,
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          desiredTarget.y,
          dampSpeed,
          delta,
        );
      }

      controls.update();
      drawFrame();

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      drawFrame();
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      runtimeRef.current = null;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      controls.dispose();
      glassCards.dispose();
      skillDnaHologram.dispose();
      studioRig.dispose();
      composer?.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#07090e]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: webglUnavailable
            ? 'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.14) 0%, rgba(16, 185, 129, 0.08) 28%, rgba(7, 9, 14, 1) 66%)'
            : '#07090e',
        }}
      />
      {!webglUnavailable && (
        <div
          ref={mountRef}
          className="relative h-full w-full"
          aria-label="GradLens 3D Product Showcase"
        />
      )}
    </div>
  );
});
