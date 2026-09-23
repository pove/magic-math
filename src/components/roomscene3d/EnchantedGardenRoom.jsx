import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './kit'
import { SkyShaderDome } from '../castle3d/SkyDome'
import GlowParticles from '../three/GlowParticles'
import GrassField from '../three/GrassField'
import { useQuality } from '../three/quality'
import { stoneTextures } from '../three/textures'

/**
 * 3D take on floor 4, "El Jardín Encantado": a moonlit garden under the
 * aurora — a wind-blown lawn, a flagstone path to the garden gate, clipped
 * hedges and topiaries, a stone fountain whose water ripples and sparkles,
 * glowing flowers pulsing like little lanterns and fireflies drifting
 * between them.
 */

// Leafy lumps: a noise-displaced sphere reads as clipped foliage.
const leafGeo = (() => {
  const g = new THREE.IcosahedronGeometry(1, 3)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const k = 1 + (Math.sin(x * 7.1 + y * 3.3) * Math.cos(z * 6.7 - x * 2.1)) * 0.08
    p.setXYZ(i, x * k, y * k, z * k)
  }
  g.computeVertexNormals()
  return g
})()
const LEAF = new THREE.MeshStandardMaterial({ color: '#1f6b3e', roughness: 1, flatShading: true })
const LEAF_DARK = new THREE.MeshStandardMaterial({ color: '#16502e', roughness: 1, flatShading: true })

function Hedge({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh geometry={leafGeo} position={[0, 0.9, 0]} scale={1.3} material={LEAF} castShadow />
      <mesh geometry={leafGeo} position={[0.9, 0.6, 0.3]} scale={0.9} material={LEAF_DARK} />
      <mesh geometry={leafGeo} position={[-0.85, 0.55, -0.2]} scale={0.8} material={LEAF} />
    </group>
  )
}

/** Ball-on-a-stem topiary in a stone pot. */
function Topiary({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.45, 0.35, 0.7, 12]} />
        <meshStandardMaterial color="#8c8577" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.2, 6]} />
        <meshStandardMaterial color="#4a2f1f" />
      </mesh>
      <mesh geometry={leafGeo} position={[0, 2.1, 0]} scale={0.75} material={LEAF} castShadow />
      <mesh geometry={leafGeo} position={[0, 1.45, 0]} scale={0.45} material={LEAF_DARK} />
    </group>
  )
}

/** Flowers glow on their own (emissive → bloom) instead of each carrying a
 *  point light like before. */
function GlowFlower({ position, color, phase = 0 }) {
  const bloom = useRef()
  const hdr = useMemo(() => new THREE.Color(color).multiplyScalar(2.2), [color])
  useFrame((state) => {
    const t = state.clock.elapsedTime * 1.3 + phase
    if (bloom.current) {
      const s = 1 + Math.sin(t) * 0.18
      bloom.current.scale.set(s, s, s)
    }
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, 0.25, 0]} rotation={[0, 0, s * -0.9]} scale={[1, 0.3, 0.6]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#22803f" />
        </mesh>
      ))}
      <mesh ref={bloom} position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshBasicMaterial color={hdr} toneMapped={false} />
      </mesh>
    </group>
  )
}

const waterVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const waterFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);
    float ripple = sin(d * 60.0 - uTime * 4.0) * 0.5 + 0.5;
    float sparkle = pow(max(0.0, sin(c.x * 90.0 + uTime * 2.0) * sin(c.y * 80.0 - uTime * 1.7)), 12.0);
    vec3 col = mix(vec3(0.05, 0.18, 0.32), vec3(0.25, 0.55, 0.85), ripple * 0.5) + sparkle * vec3(1.6, 1.8, 2.2);
    gl_FragColor = vec4(col, 0.92);
  }
`

/** Stone fountain: basin, pedestal, upper bowl, rippling water and spray. */
function Fountain({ position }) {
  const stone = useMemo(() => stoneTextures(1.5, 0.3), [])
  const water = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: waterVertex, fragmentShader: waterFragment, transparent: true, uniforms: { uTime: { value: 0 } } }),
    []
  )
  useFrame((state) => (water.uniforms.uTime.value = state.clock.elapsedTime))
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ ...stone, color: '#b8b2a4', roughness: 0.85 }), [stone])
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} material={stoneMat} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 2, 0.7, 32, 1, true]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} material={stoneMat}>
        <torusGeometry args={[1.9, 0.12, 8, 40]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} material={water}>
        <circleGeometry args={[1.85, 40]} />
      </mesh>
      <mesh position={[0, 1.1, 0]} material={stoneMat}>
        <cylinderGeometry args={[0.18, 0.28, 1.2, 12]} />
      </mesh>
      <mesh position={[0, 1.75, 0]} material={stoneMat}>
        <cylinderGeometry args={[0.8, 0.25, 0.3, 24]} />
      </mesh>
      <mesh position={[0, 1.91, 0]} rotation={[-Math.PI / 2, 0, 0]} material={water}>
        <circleGeometry args={[0.72, 32]} />
      </mesh>
      {/* Spray: sparkling droplets rising from the top */}
      <GlowParticles count={50} radius={[0, 0.25]} height={[1.95, 3]} colors={['#bae6fd', '#e0f2fe', '#ffffff']} size={0.1} rise={1.6} wander={0.15} brightness={2.2} seed={9} />
      <pointLight position={[0, 1.4, 0.8]} color="#93c5fd" intensity={4} distance={6} />
    </group>
  )
}

function PathStones() {
  const stone = useMemo(() => stoneTextures(0.3, 0.3), [])
  const stones = useMemo(() => {
    const r = mulberry32(12)
    const out = []
    for (let z = -11.8; z < 1.5; z += 0.95) {
      const x = 0.4 + Math.sin(z * 0.25) * 0.5
      out.push({ x: x + (r() - 0.5) * 0.3, z, s: 0.8 + r() * 0.3, rot: r() * 3 })
    }
    return out
  }, [])
  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, 0.03, s.z]} rotation={[0, s.rot, 0]} scale={[s.s, 1, s.s * 0.85]} receiveShadow>
          <cylinderGeometry args={[0.55, 0.6, 0.08, 7]} />
          <meshStandardMaterial {...stone} color="#aaa4b8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Lawn() {
  const q = useQuality()
  const place = (r) => {
    const x = (r() - 0.5) * 26
    const z = -13 + r() * 25
    if (Math.abs(x - 0.4 - Math.sin(z * 0.25) * 0.5) < 0.9) return null // keep the path clear
    if (Math.hypot(x - 6.5, z + 6) < 2.3) return null // fountain
    if (z > -1.5 && Math.abs(x) < 10) return null // clear lawn where the characters stand, near the camera
    return [x, 0, z]
  }
  return <GrassField count={6000} density={q.grass} place={place} seed={4} />
}

export default function EnchantedGardenRoom({ accent = '#60a5fa' }) {
  const flowers = useMemo(() => {
    const r = mulberry32(41)
    const colors = ['#f472b6', '#fbbf24', '#a78bfa', '#34d399']
    const out = []
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1
      out.push({
        position: [side * (1.6 + r() * 9), 0, -11 + r() * 12],
        color: colors[i % colors.length],
        phase: r() * Math.PI * 2,
      })
    }
    return out
  }, [])

  return (
    <group>
      <color attach="background" args={['#05030f']} />
      <fog attach="fog" args={['#0b1030', 24, 70]} />

      <SkyShaderDome radius={200} />

      {/* Back hedge wall behind the gate */}
      <mesh position={[0, 1.6, -13.4]} scale={[13, 1.6, 0.9]} geometry={leafGeo} material={LEAF_DARK} />

      <Hedge position={[-10, 0, -8]} scale={1.3} />
      <Hedge position={[-4.5, 0, -10]} scale={1.05} />
      <Hedge position={[10.5, 0, -8]} scale={1.25} />
      <Topiary position={[-2, 0, -11.6]} />
      <Topiary position={[2.8, 0, -11.6]} />

      <Fountain position={[6.5, 0, -6]} />
      <PathStones />

      {flowers.map((f, i) => (
        <GlowFlower key={i} {...f} />
      ))}

      <GlowParticles count={60} radius={[1, 11]} height={[0.5, 3.5]} colors={['#fef08a', '#bef264', '#fde047']} size={0.16} rise={0.05} wander={1.2} brightness={3.5} seed={33} position={[0, 0, -4]} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[-3, 7, -8]} color="#c7d2fe" intensity={10} distance={24} decay={1.5} />

      {/* Lawn: ground plane + blades */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 50]} />
        <meshStandardMaterial color="#1c4a2c" roughness={1} />
      </mesh>
      <Lawn />
    </group>
  )
}
