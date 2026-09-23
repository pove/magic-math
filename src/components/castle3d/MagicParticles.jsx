import GlowParticles from '../three/GlowParticles'

/**
 * Magic dust spiralling up around the tower, plus fireflies drifting low
 * over the island's meadow.
 */
export default function MagicParticles({ height = 90 }) {
  return (
    <>
      <GlowParticles
        count={260}
        radius={[9, 22]}
        height={[0, height]}
        colors={['#c4b5fd', '#a78bfa', '#fde68a', '#67e8f9']}
        size={0.32}
        rise={0.9}
        wander={1.2}
        brightness={3}
        seed={7}
      />
      <GlowParticles
        count={140}
        radius={[11, 29]}
        height={[0.8, 4.5]}
        colors={['#fef08a', '#bef264', '#fde047']}
        size={0.26}
        rise={0.05}
        wander={1.6}
        brightness={4}
        seed={31}
      />
    </>
  )
}
