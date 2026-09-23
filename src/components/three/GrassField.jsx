import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEFAULT_GREENS = ['#3a9a62', '#4fb572', '#358a66', '#5cb87a', '#2b8060']

/**
 * Wind-blown grass blades — one instanced draw call, swaying in the vertex
 * shader, so thousands cost no CPU per frame.
 *
 * `place(random)` returns a blade's [x, y, z] (or null to reject the spot);
 * it's called until `count` blades are placed (with a retry cap).
 * `density` (0..1) draws only that share of them — blades are scattered at
 * random, so any leading share covers the whole area evenly. Changing it
 * (quality tier) doesn't rebuild anything.
 */
export default function GrassField({ count = 4000, density = 1, place, colors = DEFAULT_GREENS, height = 0.42, seed = 99 }) {
  const mesh = useRef()
  const placedRef = useRef(0)

  const { geometry, material } = useMemo(() => {
    const H = height
    const geo = new THREE.PlaneGeometry(0.09, H, 1, 4)
    geo.translate(0, H / 2, 0)
    const p = geo.attributes.position
    const col = new Float32Array(p.count * 3)
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / H
      p.setX(i, p.getX(i) * (1 - y * 0.92)) // taper to a point
      const k = 0.7 + y * 0.5 // darker at the root, lighter at the tip
      col.set([k, k, k], i * 3)
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    // Normals pointing up so blades light like the ground they grow from
    const n = geo.attributes.normal
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0)

    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.9 })
    mat.userData.uTime = { value: 0 }
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = mat.userData.uTime
      // Double-sided materials flip the normal on back faces, which pointed
      // half the blades' "up" normals downward and rendered them black.
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0')
      )
      shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float hh = position.y / ${H.toFixed(3)};
         vec3 root = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
         float gust = sin(uTime * 1.3 + root.x * 0.25 + root.z * 0.18) * 0.6 + sin(uTime * 2.9 + root.x * 0.9 - root.z * 0.6) * 0.25;
         transformed.x += gust * hh * hh * 0.28;
         transformed.z += gust * hh * hh * 0.12;`
      )
    }
    return { geometry: geo, material: mat }
  }, [height])

  useLayoutEffect(() => {
    const r = rng(seed)
    const dummy = new THREE.Object3D()
    const palette = colors.map((c) => new THREE.Color(c))
    let placed = 0
    let guard = 0
    while (placed < count && guard++ < count * 6) {
      const spot = place(r)
      if (!spot) continue
      dummy.position.set(spot[0], spot[1] - 0.02, spot[2])
      dummy.rotation.set((r() - 0.5) * 0.3, r() * Math.PI, (r() - 0.5) * 0.3)
      const s = 0.6 + r() * 0.9
      dummy.scale.set(s * 1.2, s * (0.6 + r() * 0.5), s * 1.2)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(placed, dummy.matrix)
      mesh.current.setColorAt(placed, palette[Math.floor(r() * palette.length)])
      placed++
    }
    placedRef.current = placed
    mesh.current.count = Math.round(placed * density)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed])

  useLayoutEffect(() => {
    if (mesh.current && placedRef.current) mesh.current.count = Math.round(placedRef.current * density)
  }, [density])

  useFrame((state) => {
    material.userData.uTime.value = state.clock.elapsedTime
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} receiveShadow frustumCulled={false} />
}
