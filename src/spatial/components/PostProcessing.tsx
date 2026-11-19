'use client';

import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { useQuality } from '@/spatial/hooks/useQuality';

export function PostProcessing() {
  const { config } = useQuality();

  if (!config.postProcessing) {
    return null;
  }

  return (
    <EffectComposer multisampling={config.antialias ? 4 : 0}>
      <Bloom
        intensity={config.bloom ? 0.8 : 0.4}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0005, 0.0005]}
        radialModulation={true}
        modulationOffset={0.15}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.4} />
      {config.dof && (
        <DepthOfField focusDistance={0.015} focalLength={0.05} bokehScale={2} height={480} />
      )}
      <ToneMapping
        mode={
          config.toneMapping === 'cineon'
            ? ToneMappingMode.CINEON
            : config.toneMapping === 'aces'
              ? ToneMappingMode.ACES_FILMIC
              : ToneMappingMode.LINEAR
        }
      />
    </EffectComposer>
  );
}