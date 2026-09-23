import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Direction of the moon — also where the key moonlight comes from. */
export const MOON_DIR = new THREE.Vector3(-0.55, 0.42, -0.72).normalize()

/** Colour the far fog fades into — matches the sky's horizon band. */
export const HORIZON = '#2b1f5c'

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // pin to the far plane
  }
`

// Everything in the sky is painted analytically per pixel: a deep gradient,
// drifting nebula clouds, a slow aurora curtain, hashed-cell stars that
// twinkle individually, and the moon with a soft halo. Values above 1.0 on
// the moon and brightest stars feed the Bloom pass.
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMoonDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uNebulaA;
  uniform vec3 uNebulaB;
  varying vec3 vDir;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += noise(p) * a; p *= 2.03; a *= 0.5; }
    return s;
  }

  // One layer of cell stars: each cell holds at most one star at a random
  // offset, with its own size, colour temperature and twinkle phase.
  vec3 starLayer(vec3 dir, float scale, float density, float sizeMul) {
    vec3 p = dir * scale;
    vec3 cell = floor(p);
    vec3 h = hash33(cell);
    if (h.x > density) return vec3(0.0);
    vec3 starPos = cell + 0.2 + 0.6 * hash33(cell + 17.0);
    float d = length(p - starPos);
    float size = (0.04 + h.y * 0.09) * sizeMul;
    float core = smoothstep(size, 0.0, d);
    float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + h.z * 3.0) + h.y * 40.0);
    vec3 tint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.86, 0.7), h.z);
    return tint * core * core * twinkle * (1.0 + h.y * 2.2);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float up = dir.y;

    // Base gradient: warm-violet glow at the horizon into near-black zenith
    float t = smoothstep(-0.15, 0.65, up);
    vec3 col = mix(uHorizon, uZenith, t);
    // Below the horizon keep the mist colour (the island floats in it)
    col = mix(col, uHorizon * 0.8, smoothstep(0.0, -0.3, up));

    // Nebula: two-tone fbm clouds, strongest mid-sky
    float n = fbm(dir * 2.2 + vec3(0.0, 0.0, uTime * 0.004));
    float n2 = fbm(dir * 4.5 - vec3(uTime * 0.003, 0.0, 0.0));
    float neb = smoothstep(0.45, 0.85, n) * smoothstep(-0.05, 0.35, up) * (1.0 - smoothstep(0.75, 1.0, up));
    col += mix(uNebulaA, uNebulaB, n2) * neb * 0.55;

    // Aurora: vertical curtains swaying across one band of the sky
    float band = exp(-pow((up - 0.32 - 0.08 * sin(dir.x * 3.0 + uTime * 0.05)) * 5.0, 2.0));
    float curtain = fbm(vec3(dir.x * 6.0 + uTime * 0.05, up * 1.5, dir.z * 6.0));
    float rays = pow(0.5 + 0.5 * sin(dir.x * 40.0 + dir.z * 25.0 + curtain * 8.0), 3.0);
    float facing = smoothstep(-0.2, 0.6, -dir.z); // mostly behind the castle
    vec3 aurora = mix(vec3(0.1, 0.9, 0.6), vec3(0.55, 0.3, 1.0), smoothstep(0.25, 0.5, up));
    col += aurora * band * curtain * (0.35 + rays * 0.65) * facing * 0.55;

    // Stars (fade out toward the glowing horizon)
    float starMask = smoothstep(0.02, 0.25, up) * (1.0 - neb * 0.5);
    col += (starLayer(dir, 90.0, 0.35, 1.0) + starLayer(dir, 180.0, 0.25, 0.8) * 0.7 + starLayer(dir, 45.0, 0.08, 1.6) * 1.4) * starMask;

    // Moon: disc with mottled maria + wide halo
    float md = dot(dir, uMoonDir);
    float ang = acos(clamp(md, -1.0, 1.0));
    float disc = smoothstep(0.062, 0.058, ang);
    vec3 local = (dir - uMoonDir) * 30.0;
    float maria = fbm(local * 1.3 + 3.0);
    vec3 moonCol = vec3(1.35, 1.28, 1.08) * (0.82 + 0.25 * smoothstep(0.35, 0.65, maria));
    col = mix(col, moonCol * 1.8, disc);
    col += vec3(0.9, 0.85, 1.0) * (exp(-ang * 14.0) * 0.55 + exp(-ang * 4.0) * 0.12) * (1.0 - disc);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/**
 * Night sky dome painted entirely in a shader — gradient, nebula, aurora,
 * twinkling stars and the moon. Zero assets, one draw call.
 */
export default function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTime: { value: 0 },
          uMoonDir: { value: MOON_DIR },
          uZenith: { value: new THREE.Color('#05030f') },
          uHorizon: { value: new THREE.Color(HORIZON) },
          uNebulaA: { value: new THREE.Color('#6d28d9') },
          uNebulaB: { value: new THREE.Color('#0e7490') },
        },
      }),
    []
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <>
      <color attach="background" args={['#05030f']} />
      <fogExp2 attach="fog" args={[HORIZON, 0.0065]} />
      <mesh material={material} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[500, 64, 32]} />
      </mesh>
    </>
  )
}
