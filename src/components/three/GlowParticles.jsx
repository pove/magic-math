import { useMemo } from 'react'
import { useQuality } from './quality'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uSize;
  uniform float uRise;
  uniform float uWander;
  uniform vec2 uYRange;
  attribute vec4 aSeed;   // xyz: phases, w: size/brightness factor
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float span = uYRange.y - uYRange.x;
    // Rise and wrap, fading at both ends of the column so nothing pops
    float y = mod(p.y - uYRange.x + uTime * uRise * (0.6 + aSeed.w * 0.8), span);
    p.y = uYRange.x + y;
    float edge = smoothstep(0.0, 0.12, y / span) * (1.0 - smoothstep(0.85, 1.0, y / span));
    // Lazy looping wander
    p.x += sin(uTime * 0.7 + aSeed.x * 6.283) * uWander + sin(uTime * 1.9 + aSeed.y * 9.0) * uWander * 0.3;
    p.z += cos(uTime * 0.6 + aSeed.y * 6.283) * uWander + cos(uTime * 1.7 + aSeed.z * 7.0) * uWander * 0.3;
    p.y += sin(uTime * 1.1 + aSeed.z * 6.283) * uWander * 0.4;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aSeed.w) * uScale / -mv.z;

    float blink = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.5 + aSeed.x * 2.5) + aSeed.y * 30.0), 2.0);
    vAlpha = edge * blink;
    vColor = aColor;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uBrightness;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = smoothstep(0.35, 0.0, d);
    float halo = smoothstep(1.0, 0.0, d) * 0.35;
    float a = (core + halo) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * uBrightness * (core * 1.5 + halo), a);
  }
`

/**
 * GPU-animated glowing particles — magic dust, fireflies, embers. All motion
 * happens in the vertex shader, so thousands cost no CPU per frame. Colours
 * are pushed past 1.0 so they catch the Bloom pass.
 *
 * Positions are scattered in an annulus `radius: [min, max]` between heights
 * `height: [min, max]`.
 */
export default function GlowParticles({
  count = 200,
  radius = [4, 20],
  height = [0, 40],
  colors = ['#c4b5fd', '#fde68a', '#67e8f9'],
  size = 0.35,
  rise = 0.6,
  wander = 0.8,
  brightness = 2.5,
  seed = 1,
  position,
}) {
  const { gl } = useThree()
  // Fewer particles on weaker devices — drawn from the same buffer, so a
  // quality change doesn't rebuild it
  const q = useQuality()
  const drawn = Math.max(8, Math.round(count * q.particles))
  const size2 = useThree((s) => s.size)

  const geometry = useMemo(() => {
    let s = seed
    const rand = () => {
      s = (s * 16807) % 2147483647
      return (s - 1) / 2147483646
    }
    const pos = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 4)
    const cols = new Float32Array(count * 3)
    const palette = colors.map((c) => new THREE.Color(c))
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      // sqrt for even area distribution across the annulus
      const r = Math.sqrt(radius[0] ** 2 + rand() * (radius[1] ** 2 - radius[0] ** 2))
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = height[0] + rand() * (height[1] - height[0])
      pos[i * 3 + 2] = Math.sin(a) * r
      seeds.set([rand(), rand(), rand(), rand()], i * 4)
      const c = palette[Math.floor(rand() * palette.length)]
      cols.set([c.r, c.g, c.b], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
    g.setAttribute('aColor', new THREE.BufferAttribute(cols, 3))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, (height[0] + height[1]) / 2, 0), radius[1] + height[1])
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed, radius[0], radius[1], height[0], height[1], colors.join()])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: 400 },
          uSize: { value: size },
          uRise: { value: rise },
          uWander: { value: wander },
          uBrightness: { value: brightness },
          uYRange: { value: new THREE.Vector2(height[0], height[1]) },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  material.uniforms.uSize.value = size
  material.uniforms.uRise.value = rise
  material.uniforms.uWander.value = wander
  material.uniforms.uBrightness.value = brightness
  material.uniforms.uYRange.value.set(height[0], height[1])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    // Point sizes are in pixels: scale with the drawing-buffer height so
    // particles keep their world size across screens and pixel ratios.
    material.uniforms.uScale.value = size2.height * gl.getPixelRatio() * 0.9
  })

  geometry.setDrawRange(0, drawn)

  return <points geometry={geometry} material={material} position={position} frustumCulled={false} />
}
