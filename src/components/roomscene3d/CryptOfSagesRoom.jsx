import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Torch, Candle, StoneFloor, Column, GlowPedestal } from './kit'
import GlowParticles from '../three/GlowParticles'
import { stoneTextures, runeBandTexture } from '../three/textures'

/**
 * 3D take on floor 8, "La Cripta de los Sabios": a vaulted hall of fluted
 * columns where the old sages rest in stone sarcophagi carved with glowing
 * runes; burial niches hold candles and scrolls, two crystal orbs pulse on
 * their pedestals, an ancient scroll hovers above the altar unrolling
 * itself, and a violet mist creeps along the floor.
 */

function FloatingScroll() {
  const group = useRef()
  const leftRod = useRef()
  const rightRod = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.position.y = 2.9 + Math.sin(t * 0.9) * 0.18
      group.current.rotation.y = Math.sin(t * 0.4) * 0.3
    }
    const spread = 0.62 + Math.sin(t * 0.7) * 0.06
    if (leftRod.current) leftRod.current.position.x = -spread
    if (rightRod.current) rightRod.current.position.x = spread
  })
  return (
    <group ref={group} position={[0, 2.9, -9.2]}>
      <mesh>
        <planeGeometry args={[1.2, 0.65]} />
        <meshStandardMaterial color="#e7d8b0" roughness={0.9} emissive="#f5d88a" emissiveIntensity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2].map((l) => (
        <mesh key={l} position={[0, 0.18 - l * 0.16, 0.01]}>
          <boxGeometry args={[0.85, 0.03, 0.01]} />
          <meshBasicMaterial color={[1.6, 1.1, 2.4]} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={leftRod} position={[-0.62, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.75, 10]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>
      <mesh ref={rightRod} position={[0.62, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.75, 10]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>
    </group>
  )
}

/** Stone sarcophagus with a gabled lid and a band of glowing runes. */
function Sarcophagus({ position, rotation = 0 }) {
  const stone = useMemo(() => stoneTextures(0.6, 0.3), [])
  const runes = useMemo(() => runeBandTexture(2), [])
  const band = useRef()
  useFrame((state) => {
    if (band.current) band.current.emissiveIntensity = 1.4 + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.5
  })
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 1, 2.6]} />
        <meshStandardMaterial {...stone} color="#9b98b0" roughness={0.9} />
      </mesh>
      {/* Rune band wrapping the chest */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.32, 0.22, 2.62]} />
        <meshStandardMaterial ref={band} color="#2a2340" emissive="#a78bfa" emissiveMap={runes} emissiveIntensity={1.6} />
      </mesh>
      {/* Gabled lid */}
      <mesh position={[0, 1.12, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1]} castShadow>
        <boxGeometry args={[0.72, 0.72, 2.75]} />
        <meshStandardMaterial {...stone} color="#b3b0c6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.45, 0.12, 2.8]} />
        <meshStandardMaterial {...stone} color="#8c89a3" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Burial niches in the back wall, each holding a candle or a scroll. */
function Niches() {
  const stone = useMemo(() => stoneTextures(0.3, 0.3), [])
  const spots = [[-10.5, 2.4], [-10.5, 4.6], [3.2, 5.2], [6, 5.2], [8.8, 5.2], [10.8, 2.4], [10.8, 4.6]]
  return (
    <group>
      {spots.map(([x, y], i) => (
        <group key={i} position={[x, y, -13.35]}>
          <mesh>
            <boxGeometry args={[1.5, 1.1, 0.3]} />
            <meshStandardMaterial {...stone} color="#3c3b50" />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[1.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#0a0a12" />
          </mesh>
          {i % 2 === 0 ? (
            <Candle position={[0, -0.4, 0.15]} scale={0.9} light={false} />
          ) : (
            <mesh position={[0, -0.28, 0.15]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.8, 10]} />
              <meshStandardMaterial color="#e7d8b0" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

const mistVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const mistFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vWorld;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 p = vWorld.xz * 0.35;
    float n = noise(p + vec2(uTime * 0.08, uTime * 0.03)) * 0.6 + noise(p * 2.3 - vec2(uTime * 0.05, 0.0)) * 0.4;
    float a = smoothstep(0.4, 0.85, n) * 0.3;
    gl_FragColor = vec4(uColor, a);
  }
`

/** Low violet mist creeping over the floor. */
function GroundMist() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: mistVertex,
        fragmentShader: mistFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#8b7fd4') } },
      }),
    []
  )
  useFrame((state) => (mat.uniforms.uTime.value = state.clock.elapsedTime))
  return (
    <group>
      {[0.12, 0.35].map((y, i) => (
        <mesh key={i} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, -3]}>
          <planeGeometry args={[26, 22]} />
        </mesh>
      ))}
    </group>
  )
}

export default function CryptOfSagesRoom({ accent = '#8b5cf6' }) {
  return (
    <group>
      <color attach="background" args={['#0d0d14']} />
      <fog attach="fog" args={['#0d0d14', 15, 40]} />

      <Column position={[-9, 0, -10]} height={5.6} color="#4a4860" capColor="#3a3b4d" />
      <Column position={[-3.6, 0, -10.6]} height={5.8} color="#4a4860" capColor="#3a3b4d" />
      <Column position={[3.6, 0, -10.6]} height={5.8} color="#4a4860" capColor="#3a3b4d" />
      <Column position={[9, 0, -10]} height={5.6} color="#4a4860" capColor="#3a3b4d" />

      <Niches />
      <Sarcophagus position={[-6.8, 0, -6.5]} rotation={0.15} />
      <Sarcophagus position={[6.8, 0, -6.5]} rotation={-0.15} />

      <GlowPedestal position={[-3.4, 0, -4]} color="#a78bfa" pulse={1} />
      <GlowPedestal position={[3.4, 0, -4]} color="#c4b5fd" pulse={1.2} />

      {/* Altar under the floating scroll */}
      <mesh position={[0, 0.55, -9.2]} castShadow>
        <boxGeometry args={[2.2, 1.1, 1.2]} />
        <meshStandardMaterial color="#5a586e" roughness={0.9} />
      </mesh>
      <FloatingScroll />
      <Candle position={[-0.8, 1.1, -9.1]} />
      <Candle position={[0.8, 1.1, -9.1]} />
      {[[-5.4, -5], [-5.2, -8.4], [5.3, -5.1], [5.5, -8.2]].map(([x, z], i) => (
        <Candle key={i} position={[x, 0, z]} scale={1.4} light={false} />
      ))}

      <Torch position={[-11.8, 0, -8]} scale={1.1} />
      <Torch position={[11.8, 0, -8]} scale={1.1} />

      <GroundMist />
      <GlowParticles count={60} radius={[1, 11]} height={[0.2, 3]} colors={['#c4b5fd', '#a78bfa']} size={0.16} rise={0.15} wander={0.8} brightness={2} seed={21} position={[0, 0, -6]} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />
      <pointLight position={[0, 4.5, -8]} color="#a78bfa" intensity={10} distance={16} decay={1.5} />

      <StoneFloor baseColor="#1c1b26" tileColor="#2c2b3b" />
    </group>
  )
}
