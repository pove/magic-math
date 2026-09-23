import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './kit'
import GlowParticles from '../three/GlowParticles'
import { glowTexture } from '../three/textures'

/**
 * 3D take on floor 11, "El Puente de las Nubes": the one daytime scene in
 * the castle — a deep blue sky with a blazing sun, a sea of clouds below,
 * big lit cumulus drifting by, a walkway of flattened cloud puffs under the
 * characters' feet, and a rainbow arching over the far end of the bridge.
 *
 * Colours are chosen for the shared post-processing tone map (it would roll
 * flat pastels down to grey), so the sky is painted deeper and brighter.
 */

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`
const skyFragment = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float up = d.y;
    vec3 zenith = vec3(0.02, 0.14, 0.7);
    vec3 horizon = vec3(0.4, 0.66, 1.1);
    vec3 col = mix(horizon, zenith, pow(smoothstep(-0.1, 0.6, up), 0.6));
    float s = max(0.0, dot(d, uSun));
    col += vec3(1.6, 1.4, 1.0) * pow(s, 700.0) * 6.0; // sun disc
    col += vec3(1.0, 0.85, 0.55) * pow(s, 12.0) * 0.5; // glow
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

function DaySky({ sunDir }) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: skyVertex, fragmentShader: skyFragment, side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: sunDir } } }),
    [sunDir]
  )
  return (
    <mesh material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[300, 48, 24]} />
    </mesh>
  )
}

// Soft white, lightly self-lit so the shaded side stays fluffy, not grey
const CLOUD = new THREE.MeshStandardMaterial({ color: '#eef3ff', roughness: 1, emissive: '#c9d8ff', emissiveIntensity: 0.12 })
const puffGeo = new THREE.IcosahedronGeometry(1, 3)

/** Cumulus: a cluster of overlapping puffs, drifting slowly. */
function Cloud({ position, scale = 1, speed = 1, seed = 1 }) {
  const ref = useRef()
  const puffs = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: 7 }, (_, i) => ({
      p: [(i - 3) * 0.7 + (r() - 0.5) * 0.4, (r() - 0.3) * 0.5 + (3 - Math.abs(i - 3)) * 0.18, (r() - 0.5) * 0.6],
      s: 0.55 + r() * 0.5 + (3 - Math.abs(i - 3)) * 0.12,
    }))
  }, [seed])
  const baseX = position[0]
  useFrame((state) => {
    if (ref.current) ref.current.position.x = baseX + Math.sin(state.clock.elapsedTime * 0.08 * speed + seed) * 2
  })
  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map((pf, i) => (
        <mesh key={i} geometry={puffGeo} material={CLOUD} position={pf.p} scale={[pf.s, pf.s * 0.8, pf.s]} />
      ))}
    </group>
  )
}

/** Endless-looking sea of cloud puffs below the bridge (instanced). */
function CloudSea() {
  const ref = useRef()
  const COUNT = 140
  useLayoutEffect(() => {
    const r = mulberry32(5)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < COUNT; i++) {
      const a = r() * Math.PI * 2
      const d = 6 + r() * 60
      dummy.position.set(Math.cos(a) * d, -3.5 - r() * 3, Math.sin(a) * d - 10)
      const s = 2 + r() * 4
      dummy.scale.set(s, s * 0.45, s)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return <instancedMesh ref={ref} args={[puffGeo, CLOUD, COUNT]} />
}

/** The walkway: flattened puffs whose tops sit at y≈0, from the foreground
 *  back under the rainbow. */
function CloudBridge() {
  const ref = useRef()
  const puffs = useMemo(() => {
    const r = mulberry32(21)
    const out = []
    for (let z = 7; z > -15; z -= 1.3) {
      const width = z > -2 ? 4.2 : 2.6 // a wide landing where the characters stand
      for (let k = 0; k < 3; k++) {
        out.push([(r() - 0.5) * width * 1.6 + Math.sin(z * 0.2) * 0.6, z + (r() - 0.5) * 0.6, 1.2 + r() * 0.9])
      }
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    puffs.forEach(([x, z, s], i) => {
      dummy.position.set(x, -s * 0.3, z)
      dummy.scale.set(s * 1.3, s * 0.3, s)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [puffs])
  return <instancedMesh ref={ref} args={[puffGeo, CLOUD, puffs.length]} receiveShadow />
}

function Rainbow() {
  const colors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6']
  return (
    <group position={[0, -0.5, -12]}>
      {colors.map((c, i) => (
        <mesh key={c}>
          <torusGeometry args={[7 - i * 0.32, 0.17, 8, 64, Math.PI]} />
          <meshBasicMaterial color={new THREE.Color(c).multiplyScalar(1.4)} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function CloudBridgeRoom() {
  const sunDir = useMemo(() => new THREE.Vector3(-0.45, 0.5, -0.75).normalize(), [])
  const glow = glowTexture()
  return (
    <group>
      <color attach="background" args={['#5aa9ff']} />
      <fog attach="fog" args={['#9fc9ff', 45, 140]} />

      <DaySky sunDir={sunDir} />
      <directionalLight position={sunDir.clone().multiplyScalar(40).toArray()} intensity={1.3} color="#fff3d6" />
      <hemisphereLight args={['#9cc8ff', '#e8eeff', 0.8]} />
      <ambientLight intensity={0.35} color="#ffffff" />

      <Rainbow />
      <Cloud position={[-10, 7, -22]} scale={2.2} speed={0.8} seed={1} />
      <Cloud position={[9, 10, -28]} scale={2.8} speed={1.1} seed={2} />
      <Cloud position={[13, 4, -16]} scale={1.6} speed={0.6} seed={3} />
      <Cloud position={[-7, 3.5, -12]} scale={1.2} speed={1.3} seed={4} />
      <Cloud position={[-15, 6, -6]} scale={1.8} speed={0.9} seed={5} />

      <CloudSea />
      <CloudBridge />

      {/* Sun sparkles drifting over the bridge */}
      <GlowParticles count={50} radius={[1, 9]} height={[0.3, 5]} colors={['#fff7cc', '#ffffff', '#fde68a']} size={0.14} rise={0.2} wander={0.8} brightness={2} seed={11} position={[0, 0, -3]} />
      <sprite position={[0, 6, -14]} scale={[12, 12, 1]}>
        <spriteMaterial map={glow} color="#fff3d6" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}
