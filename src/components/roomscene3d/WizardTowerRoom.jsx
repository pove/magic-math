import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Torch, StoneFloor } from './kit'
import { SkyShaderDome } from '../castle3d/SkyDome'
import GlowParticles from '../three/GlowParticles'
import { runeBandTexture, stoneTextures, glowTexture } from '../three/textures'

/**
 * 3D take on floor 12, "La Torre de la Varita Encantada" — the castle's
 * final floor, open to the sky at the very top of the tower. The Enchanted
 * Wand hovers above a carved pedestal inside a turning circle of glowing
 * math runes, crystals orbit it, sparks spiral up and a pillar of light
 * climbs into the aurora — this is the last room in the whole game.
 */

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const beamFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float fade = pow(1.0 - vUv.y, 1.4) * smoothstep(0.0, 0.05, vUv.y);
    float streaks = 0.6 + 0.4 * sin(vUv.x * 60.0 + uTime * 2.0) * sin(vUv.y * 14.0 - uTime * 4.0);
    gl_FragColor = vec4(vec3(1.3, 1.0, 0.45) * fade * streaks, fade * streaks * 0.8);
  }
`

function EnchantedWand() {
  const wand = useRef()
  const halo = useRef()
  const crystals = useRef()
  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  )
  const shaft = useMemo(() => {
    // Wand shaft with a spiral ridge wound around it
    const pts = []
    for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector2(0.06 - i * 0.003, i * 0.15))
    const g = new THREE.LatheGeometry(pts, 16)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const a = Math.atan2(p.getZ(i), p.getX(i))
      const k = 1 + Math.max(0, Math.sin(a * 2 + p.getY(i) * 18)) * 0.25
      p.setX(i, p.getX(i) * k)
      p.setZ(i, p.getZ(i) * k)
    }
    g.computeVertexNormals()
    g.translate(0, -1.5, 0)
    return g
  }, [])
  const stone = useMemo(() => stoneTextures(0.8, 0.8), [])
  const glow = glowTexture()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    beamMat.uniforms.uTime.value = t
    if (wand.current) {
      wand.current.rotation.z = 0.35 + Math.sin(t * 0.5) * 0.08
      wand.current.rotation.y = t * 0.3
      wand.current.position.y = 3 + Math.sin(t * 0.8) * 0.12
    }
    if (halo.current) {
      halo.current.rotation.set(Math.PI / 2 + Math.sin(t * 0.7) * 0.3, 0, t * 0.8)
    }
    if (crystals.current) crystals.current.rotation.y = t * 0.45
  })

  return (
    <group position={[0, 0, -8.5]}>
      {/* Carved pedestal: plinth, fluted drum, capital */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[1.25, 1.35, 0.3, 8]} />
        <meshStandardMaterial {...stone} color="#8f84b8" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.85, 1.3, 8]} />
        <meshStandardMaterial {...stone} color="#a79dcc" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[1, 0.75, 0.25, 8]} />
        <meshStandardMaterial {...stone} color="#8f84b8" roughness={0.85} />
      </mesh>

      <group ref={wand} position={[0, 3, 0]}>
        <mesh geometry={shaft}>
          <meshStandardMaterial color="#6b3a1a" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[0, -1.52, 0]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color="#d4a64a" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.02, 0]} scale={[1, 1.4, 1]}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#fff7cc" emissive="#fbbf24" emissiveIntensity={4} flatShading />
        </mesh>
        <sprite position={[0, 0.02, 0]} scale={[2.6, 2.6, 1]}>
          <spriteMaterial map={glow} color="#fbbf24" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <mesh ref={halo} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.55, 0.025, 8, 48]} />
          <meshBasicMaterial color={[3, 2.4, 0.8]} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={14} distance={12} />
      </group>

      {/* Crystals orbiting the wand */}
      <group ref={crystals} position={[0, 3, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          const c = ['#a78bfa', '#67e8f9', '#f472b6', '#fde68a', '#86efac'][i]
          return (
            <mesh key={i} position={[Math.cos(a) * 1.6, Math.sin(a * 2) * 0.3, Math.sin(a) * 1.6]} scale={[0.6, 1.2, 0.6]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2.5} flatShading />
            </mesh>
          )
        })}
      </group>

      {/* Pillar of light into the sky */}
      <mesh position={[0, 3 + 30, 0]} material={beamMat}>
        <cylinderGeometry args={[2.2, 0.35, 60, 32, 1, true]} />
      </mesh>
      <GlowParticles count={90} radius={[0.2, 1.6]} height={[0.5, 9]} colors={['#fde68a', '#fbbf24', '#ffffff']} size={0.16} rise={1.1} wander={0.4} brightness={3} seed={12} />
    </group>
  )
}

/** A circle of glowing math runes inlaid in the floor, slowly turning. */
function RuneCircle() {
  const ref = useRef()
  const runes = useMemo(() => runeBandTexture(4), [])
  // Ring with polar UVs (u around, v across) so the rune strip wraps round
  // the circle instead of being projected flat across it
  const band = useMemo(() => {
    const g = new THREE.RingGeometry(2.7, 3.3, 96, 1)
    const p = g.attributes.position
    const uv = g.attributes.uv
    // RingGeometry lays vertices out ring by ring, 97 per ring (the seam
    // vertex is duplicated), so the index gives u without an atan2 wrap
    for (let i = 0; i < p.count; i++) {
      uv.setXY(i, (i % 97) / 96, (Math.hypot(p.getX(i), p.getY(i)) - 2.7) / 0.6)
    }
    return g
  }, [])
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.12
  })
  return (
    <group ref={ref} position={[0, 0.03, -8.5]}>
      <mesh geometry={band} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial map={runes} color={[2.2, 1.7, 0.6]} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {[2.55, 3.45].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.04, r, 96]} />
          <meshBasicMaterial color={[2.4, 1.9, 0.7]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function WizardTowerRoom({ accent = '#fbbf24' }) {
  return (
    <group>
      <color attach="background" args={['#05030f']} />
      <fog attach="fog" args={['#0b0a24', 28, 80]} />

      <SkyShaderDome radius={200} />

      <RuneCircle />
      <EnchantedWand />

      <Torch position={[-4, 0, -8.5]} scale={1.4} />
      <Torch position={[4, 0, -8.5]} scale={1.4} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />

      <StoneFloor baseColor="#2a2440" tileColor="#3c3460" />
    </group>
  )
}
