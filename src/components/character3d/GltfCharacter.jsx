import { useEffect, useMemo, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

// Source packs (Quaternius characters, Kenney pets, Quaternius monsters) each
// use different native units and some models don't sit flush on the ground
// (e.g. flying monsters in their idle pose). Rather than eyeball a per-model
// scale, measure each model's real bounding box and normalize it to a target
// height, grounding its lowest point at y=0 so everything stands consistently
// next to the player character regardless of the source model's quirks.
export default function GltfCharacter({
  src,
  animationName,
  position = [0, 0, 0],
  targetHeight,
  rotationY = 0,
}) {
  const group = useRef()
  const { scene, animations } = useGLTF(src)
  const { actions, names } = useAnimations(animations, group)

  const { scale, groundOffset } = useMemo(() => {
    if (!targetHeight) return { scale: 1, groundOffset: 0 }
    const box = new THREE.Box3().setFromObject(scene)
    const height = box.max.y - box.min.y
    const s = height > 0 ? targetHeight / height : 1
    return { scale: s, groundOffset: -box.min.y * s }
  }, [scene, targetHeight])

  useEffect(() => {
    const clip = animationName && names.includes(animationName) ? animationName : names[0]
    if (!clip) return
    const action = actions[clip]
    action?.reset().fadeIn(0.2).play()
    return () => action?.fadeOut(0.2)
  }, [actions, names, animationName])

  return (
    <group
      ref={group}
      position={[position[0], position[1] + groundOffset, position[2]]}
      rotation={[0, rotationY, 0]}
      scale={scale}
    >
      <primitive object={scene} />
    </group>
  )
}
