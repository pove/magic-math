import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import FloorNode, { FLOOR_HEIGHT, FLOOR_GAP, TERRACE_DECK } from './FloorNode'
import Wizard from './Wizard'
import PlayerAvatar3D from './PlayerAvatar3D'
import { stoneTextures, shingleTextures, glowTexture } from '../three/textures'
import { windowGlassGeometry } from './windowGeometry'
import { Door } from '../roomscene3d/props'

export { FLOOR_HEIGHT, FLOOR_GAP }

const STEP = FLOOR_HEIGHT + FLOOR_GAP
const BASE_R = 7.8
const MIN_R = 5.2

/** Bottom radius of floor `i`. Gentle, clamped taper so the keep stays a
 *  solid-looking tower instead of pinching into a cone (or going negative). */
function floorRadius(i) {
  return Math.max(MIN_R, BASE_R - 0.2 * i)
}

/** Ring of instanced merlons (one draw call). */
function Merlons({ count, radius, y, size, material }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      dummy.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius)
      dummy.rotation.set(0, -a, 0)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count, radius, y])
  return (
    <instancedMesh ref={ref} args={[undefined, material, count]} castShadow receiveShadow>
      <boxGeometry args={size} />
    </instancedMesh>
  )
}

/** Cloth flag rippling in the wind (vertex shader), on a pole. */
function Flag({ color }) {
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.8, emissive: color, emissiveIntensity: 0.25 })
    m.userData.uTime = { value: 0 }
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = m.userData.uTime
      shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float along = position.x + 0.6; // 0 at the pole
         transformed.z += sin(along * 5.0 - uTime * 6.0) * 0.12 * along;
         transformed.y += sin(along * 3.0 - uTime * 4.0) * 0.04 * along;`
      )
    }
    return m
  }, [color])
  useFrame((state) => {
    material.userData.uTime.value = state.clock.elapsedTime
  })
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
        <meshStandardMaterial color="#c9a54a" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0.62, 1.45, 0]} material={material}>
        <planeGeometry args={[1.2, 0.65, 16, 4]} />
      </mesh>
    </group>
  )
}

/** Corner turret: stone shaft, corbelled battlements, shingled cone roof,
 *  glowing arrow-slit windows, finial orb and a waving flag. */
function Turret({ position, height, accent, stoneMat, trimMat, seed }) {
  const roofTex = useMemo(() => shingleTextures(3, 2), [])
  const windowRef = useRef()
  const glow = glowTexture()

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const outward = Math.atan2(position[2], position[0])
    for (let i = 0; i < 3; i++) {
      const a = outward + (i - 1) * 0.9
      const y = height * (0.3 + i * 0.22)
      const rad = 2.7 - 0.4 * (y / height) + 0.02 // shaft tapers 2.7 → 2.3
      dummy.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad)
      dummy.rotation.set(-0.02, -a + Math.PI / 2, 0, 'YXZ')
      dummy.scale.set(0.5, 0.6, 1)
      dummy.updateMatrix()
      windowRef.current.setMatrixAt(i, dummy.matrix)
    }
    windowRef.current.instanceMatrix.needsUpdate = true
  }, [height, position])

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} material={stoneMat} castShadow receiveShadow>
        <cylinderGeometry args={[2.3, 2.7, height, 40, 1, true]} />
      </mesh>
      <instancedMesh ref={windowRef} args={[windowGlassGeometry(), undefined, 3]}>
        <meshStandardMaterial color="#ffc46b" emissive="#ffb04a" emissiveIntensity={2.2} />
      </instancedMesh>
      {/* Corbel ring + walkway */}
      <mesh position={[0, height - 0.1, 0]} material={trimMat} castShadow receiveShadow>
        <cylinderGeometry args={[2.85, 2.3, 0.9, 40]} />
      </mesh>
      <Merlons count={9} radius={2.55} y={height + 0.65} size={[0.8, 0.7, 0.5]} material={trimMat} />
      {/* Shingled roof */}
      <mesh position={[0, height + 3.1, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.75, 5.2, 40, 1, true]} />
        <meshStandardMaterial {...roofTex} color={accent} roughness={1} envMapIntensity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Finial: gold spike + glowing orb */}
      <mesh position={[0, height + 6.0, 0]}>
        <coneGeometry args={[0.12, 1.0, 8]} />
        <meshStandardMaterial color="#e8c35a" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, height + 6.55, 0]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshBasicMaterial color={new THREE.Color(accent).multiplyScalar(4)} toneMapped={false} />
      </mesh>
      <sprite position={[0, height + 6.55, 0]} scale={[2.2, 2.2, 1]}>
        <spriteMaterial map={glow} color={accent} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <group position={[0, height + 6.7, 0]} rotation={[0, seed * 1.3, 0]}>
        <Flag color={seed % 2 ? '#e11d48' : '#f59e0b'} />
      </group>
    </group>
  )
}

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const beamFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float fade = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.04, vUv.y);
    float streaks = 0.65 + 0.35 * sin(vUv.x * 50.0 + uTime * 2.0) * sin(vUv.y * 12.0 - uTime * 3.0);
    gl_FragColor = vec4(uColor * fade * streaks, fade * streaks);
  }
`

/** The magic crystal standing on the keep's rooftop terrace: carved
 *  pedestal, floating spinning gem, orbiting rings and a pillar of light
 *  rising into the sky. `y` is the terrace deck. */
function Crystal({ y }) {
  const gem = useRef()
  const ringA = useRef()
  const ringB = useRef()
  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(1.2, 0.85, 0.3) } },
      }),
    []
  )
  const glow = glowTexture()
  const pedestalMat = useMemo(() => new THREE.MeshStandardMaterial({ ...stoneTextures(1, 0.5), color: '#b3aacb', roughness: 1 }), [])
  const G = y + 4.3 // gem height

  useFrame((state) => {
    const t = state.clock.elapsedTime
    beamMat.uniforms.uTime.value = t
    if (gem.current) {
      gem.current.rotation.y = t * 0.6
      gem.current.position.y = G + Math.sin(t * 1.3) * 0.25
    }
    if (ringA.current) ringA.current.rotation.set(Math.PI / 2 + Math.sin(t * 0.4) * 0.3, 0, t * 0.9)
    if (ringB.current) ringB.current.rotation.set(Math.PI / 2 - 0.5, t * 0.5, -t * 0.7)
  })

  return (
    <group>
      {/* Stepped pedestal with a gold cap */}
      <mesh position={[0, y + 0.2, 0]} material={pedestalMat} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.4, 32]} />
      </mesh>
      <mesh position={[0, y + 1.1, 0]} material={pedestalMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.95, 1.5, 24]} />
      </mesh>
      <mesh position={[0, y + 1.95, 0]} castShadow>
        <cylinderGeometry args={[1.0, 0.7, 0.28, 24]} />
        <meshStandardMaterial color="#d6b04c" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh ref={gem} position={[0, G, 0]} scale={[1, 1.5, 1]}>
        <octahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={3.5} roughness={0.15} metalness={0.3} flatShading />
      </mesh>
      <sprite position={[0, G, 0]} scale={[7, 7, 1]}>
        <spriteMaterial map={glow} color="#fbbf24" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <group position={[0, G, 0]}>
        <mesh ref={ringA}>
          <torusGeometry args={[1.9, 0.05, 8, 96]} />
          <meshBasicMaterial color={[2.5, 1.6, 4]} toneMapped={false} />
        </mesh>
        <mesh ref={ringB}>
          <torusGeometry args={[2.35, 0.04, 8, 96]} />
          <meshBasicMaterial color={[0.6, 2.8, 3]} toneMapped={false} />
        </mesh>
      </group>
      {/* Sky beam */}
      <mesh position={[0, G + 45, 0]} material={beamMat}>
        <cylinderGeometry args={[3.5, 0.7, 90, 32, 1, true]} />
      </mesh>
      <pointLight position={[0, G, 0]} color="#fbbf24" intensity={40} distance={30} />
    </group>
  )
}

/**
 * Wall-walk ringing the whole keep at the foot of the active floor — it sits
 * on the battlements of the floor below, with a corbel underneath and a
 * balustrade all the way round. `y` is the deck surface (where the
 * characters' feet go), `r` the floor's radius, `outer` the walk's outer
 * edge. On the lower floors it runs into the corner turrets, like a real
 * castle's wall-walk.
 */
const DECK_THICK = 0.4
function Balcony({ y, r, outer }) {
  const inner = r - 0.3 // tucked into the wall
  const posts = useRef()
  const postCount = Math.round((Math.PI * 2 * (outer - 0.15)) / 0.9)
  const circ = Math.PI * 2 * outer
  const repeatX = Math.max(1, Math.round(circ / 5.1))
  // Paving with UVs that follow the ring (a cylinder's cap maps a flat
  // square onto it, which smeared the stone into streaks)
  const deckGeo = useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 128, 2)
    const p = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const yy = p.getY(i)
      const a = (i % 129) / 128
      uv.setXY(i, a * repeatX * 2, (Math.hypot(x, yy) - inner) / 1.7)
    }
    return g
  }, [inner, outer, repeatX])
  const mats = useMemo(() => {
    const paving = stoneTextures(1, 1)
    const side = stoneTextures(repeatX, DECK_THICK / 3.4)
    const corbel = stoneTextures(repeatX, 0.6 / 3.4)
    return {
      deck: new THREE.MeshStandardMaterial({ ...paving, color: '#c4bcdb', roughness: 1 }),
      side: new THREE.MeshStandardMaterial({ ...side, color: '#bdb5d6', roughness: 1 }),
      corbel: new THREE.MeshStandardMaterial({ ...corbel, color: '#8f88ab', roughness: 1 }),
      rail: new THREE.MeshStandardMaterial({ color: '#9a92b8', roughness: 0.85 }),
    }
  }, [repeatX])
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    for (let i = 0; i < postCount; i++) {
      const a = (i / postCount) * Math.PI * 2
      dummy.position.set(Math.sin(a) * (outer - 0.15), y + 0.36, Math.cos(a) * (outer - 0.15))
      dummy.updateMatrix()
      posts.current.setMatrixAt(i, dummy.matrix)
    }
    posts.current.instanceMatrix.needsUpdate = true
  }, [y, outer, postCount])
  return (
    <group>
      {/* Paving */}
      <mesh geometry={deckGeo} material={mats.deck} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {/* Outer edge of the slab */}
      <mesh position={[0, y - DECK_THICK / 2, 0]} material={mats.side} castShadow receiveShadow>
        <cylinderGeometry args={[outer, outer, DECK_THICK, 96, 1, true]} />
      </mesh>
      {/* Corbel tapering back into the wall */}
      <mesh position={[0, y - DECK_THICK - 0.3, 0]} material={mats.corbel} castShadow receiveShadow>
        <cylinderGeometry args={[outer, r - 0.2, 0.6, 96, 1, true]} />
      </mesh>
      {/* Balustrade: posts + top rail */}
      <instancedMesh key={postCount} ref={posts} args={[undefined, mats.rail, postCount]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.72, 8]} />
      </instancedMesh>
      <mesh position={[0, y + 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.rail} castShadow>
        <torusGeometry args={[outer - 0.15, 0.08, 6, 128]} />
      </mesh>
    </group>
  )
}

/** Arched wooden door set in a stone portal, lanterns either side. */
function Entrance({ trimMat, openRef }) {
  const portalGeo = useMemo(() => {
    const outer = new THREE.Shape()
    const w = 4.6
    const h = 4.9
    outer.moveTo(-w / 2, -h / 2)
    outer.lineTo(w / 2, -h / 2)
    outer.lineTo(w / 2, h / 2 - w / 2)
    outer.absarc(0, h / 2 - w / 2, w / 2, 0, Math.PI, false)
    outer.lineTo(-w / 2, -h / 2)
    const hole = new THREE.Path()
    const iw = 3.2
    const ih = 3.9
    const oy = -(h - ih) / 2
    hole.moveTo(-iw / 2, oy - ih / 2)
    hole.lineTo(iw / 2, oy - ih / 2)
    hole.lineTo(iw / 2, oy + ih / 2 - iw / 2)
    hole.absarc(0, oy + ih / 2 - iw / 2, iw / 2, 0, Math.PI, false)
    hole.lineTo(-iw / 2, oy - ih / 2)
    outer.holes.push(hole)
    return new THREE.ExtrudeGeometry(outer, { depth: 1.1, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 24 })
  }, [])
  const glow = glowTexture()

  return (
    // Set forward of the curved wall (radius 10 at ground level) so the wall
    // never shows through the bottom of the door, and raised so the door
    // sill meets the meadow (y ≈ 0.65) instead of sinking into it.
    <group position={[0, 2.9, 9.3]}>
      <mesh geometry={portalGeo} material={trimMat} castShadow receiveShadow />
      {/* Two-leaf door filling the portal's arch; swings open (inwards,
          onto warm light) when the entrance room's choreography asks */}
      <Door position={[0, -2.45, 0.72]} width={3.2} height={3.9} openRef={openRef} frameless />
      {/* Wall lanterns */}
      {[-2.9, 2.9].map((x) => (
        <group key={x} position={[x, 0.3, 1.35]}>
          <mesh>
            <boxGeometry args={[0.36, 0.5, 0.36]} />
            <meshStandardMaterial color="#1f1b2e" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.28, 0.4, 0.38]} />
            <meshBasicMaterial color={[4, 2.3, 0.8]} toneMapped={false} />
          </mesh>
          <sprite scale={[2.4, 2.4, 1]}>
            <spriteMaterial map={glow} color="#ffb347" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      ))}
      <pointLight position={[0, 0.2, 3.2]} color="#ffb347" intensity={14} distance={11} />
    </group>
  )
}

/**
 * The castle: main keep with floors, corner turrets, battlemented base wall
 * with a grand entrance, and a magical crystal spire on top.
 */
export default function Tower({ levels, floorStates, currentFloor, onSelect, activeProfile, showLabels = true, entranceOpenRef }) {
  const topY = levels.length * STEP
  const lastIndex = levels.length - 1
  // The top floor's roof is an open terrace — the crystal stands on it
  const deckY = lastIndex * STEP + TERRACE_DECK
  const activeIndex = levels.findIndex((l) => l.floor === currentFloor)
  // Flanking turrets read as turrets only if they're clearly shorter (and
  // thicker) than the central keep — a full-height thin cylinder looks like
  // a spike, not a tower. Cap them well below the keep's own height.
  const turretHeight = Math.min(topY * 0.42, 28)

  const mats = useMemo(() => {
    const turret = stoneTextures(3, turretHeight / 3.4)
    const wall = stoneTextures(12, 3.5 / 3.4)
    const trim = stoneTextures(0.5, 0.3)
    return {
      turret: new THREE.MeshStandardMaterial({ ...turret, color: '#e4def2', roughness: 1 }),
      wall: new THREE.MeshStandardMaterial({ ...wall, color: '#d4cde6', roughness: 1 }),
      trim: new THREE.MeshStandardMaterial({ ...trim, color: '#a49cbd', roughness: 1 }),
    }
  }, [turretHeight])

  return (
    <group>
      {/* Main keep — the stacked playable floors */}
      {levels.map((level, i) => (
        <FloorNode
          key={level.floor}
          level={level}
          index={i}
          status={floorStates[level.floor] || 'locked'}
          onSelect={onSelect}
          r={floorRadius(i)}
          showLabels={showLabels}
          terrace={i === lastIndex}
        />
      ))}

      {/* The Director Mago and the player stand out on a balcony of the
          active floor — in front of the wall, not pressed against it */}
      {activeIndex >= 0 && (() => {
        // Floor 1 sits behind the base wall, right above the gatehouse, so a
        // balcony there would crash into the portal arch — its characters
        // wait on the meadow in front of the door instead.
        // The top floor is a terrace: they stand on it, in front of the
        // crystal, with no balcony needed.
        const onGround = activeIndex === 0
        const onTerrace = activeIndex === lastIndex
        const r = floorRadius(activeIndex)
        // Elsewhere the wall-walk runs round the foot of the floor, on the
        // battlements of the floor below. Floor 2's stays inside the base
        // wall's own battlements.
        const outer = activeIndex === 1 ? 9.2 : r + 2.2
        const deck = onGround ? 0.65 : onTerrace ? deckY : activeIndex * STEP - FLOOR_HEIGHT / 2 + 0.75
        const standR = onGround ? 13 : onTerrace ? r - 2.3 : outer - 1
        const spread = onGround ? 0.26 : onTerrace ? 0.6 : 0.42
        const spot = (a) => [Math.sin(a) * standR, deck, Math.cos(a) * standR]
        return (
          <>
            {!onGround && !onTerrace && <Balcony y={deck} r={r} outer={outer} />}
            <Wizard position={spot(spread)} />
            {activeProfile && <PlayerAvatar3D profile={activeProfile} position={spot(-spread)} />}
          </>
        )
      })()}

      {/* Base wall with battlements */}
      <mesh position={[0, 1.5, 0]} material={mats.wall} castShadow receiveShadow>
        <cylinderGeometry args={[9.5, 10, 3.5, 64, 1, true]} />
      </mesh>
      <mesh position={[0, 3.35, 0]} material={mats.trim} castShadow receiveShadow>
        <cylinderGeometry args={[9.9, 9.45, 0.45, 64]} />
      </mesh>
      <Merlons count={22} radius={9.55} y={3.95} size={[1.3, 0.9, 0.7]} material={mats.trim} />

      <Entrance trimMat={mats.trim} openRef={entranceOpenRef} />

      {/* Four corner turrets */}
      {[[8.2, 8.2], [-8.2, 8.2], [8.2, -8.2], [-8.2, -8.2]].map(([x, z], i) => (
        <Turret
          key={i}
          seed={i}
          position={[x, 0, z]}
          height={turretHeight}
          accent={i % 2 === 0 ? '#7c3aed' : '#be185d'}
          stoneMat={mats.turret}
          trimMat={mats.trim}
        />
      ))}

      <Crystal y={deckY} />
    </group>
  )
}

