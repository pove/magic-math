import { EffectComposer, Bloom, N8AO, Vignette, ToneMapping, SMAA } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useQuality } from './quality'

/**
 * Shared cinematic post-processing stack for every 3D scene.
 *
 * The Canvas renders `flat` (no tone mapping) into a half-float buffer, so
 * anything brighter than 1.0 — emissive windows, crystals, torch flames, the
 * moon — survives to the Bloom pass and glows. Tone mapping happens last,
 * here, so the bloom rolls off naturally instead of clipping.
 *
 * On the low quality tiers the whole stack is skipped (it's the single most
 * expensive thing on a weak GPU) and the renderer tone-maps directly — see
 * RendererSettings in quality.jsx.
 */
export default function PostFX({ bloom = 0.9, bloomThreshold = 0.95, aoRadius = 2.5, aoIntensity = 2.2, vignette = 0.55 }) {
  const q = useQuality()
  if (!q.post) return null

  return (
    <EffectComposer multisampling={q.msaa} disableNormalPass>
      {q.ao ? (
        <N8AO aoRadius={aoRadius} intensity={aoIntensity} distanceFalloff={1} quality="medium" halfRes />
      ) : (
        <></>
      )}
      <Bloom mipmapBlur luminanceThreshold={bloomThreshold} luminanceSmoothing={0.2} intensity={bloom} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.25} darkness={vignette} />
      {q.msaa === 0 ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
