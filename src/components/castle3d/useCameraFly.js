import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Smoothly flies the camera to a target height when `targetY` changes.
 * The flight only runs while animating — user orbit/zoom is free otherwise.
 *
 * `distance` comes from the aspect-aware framing, so rotating the device also
 * triggers a flight and the tower re-frames itself for the new orientation.
 */
export default function useCameraFly({ targetY, controlsRef, distance = 26 }) {
  const { camera } = useThree()
  const desired = useRef(new THREE.Vector3())
  const lookAt = useRef(new THREE.Vector3())
  const flying = useRef(false)
  const flyingStarted = useRef(false)
  const prevTargetY = useRef(targetY)
  const prevDistance = useRef(distance)

  // Start a flight whenever the target height or the framing changes —
  // including the initial mount
  useEffect(() => {
    if (prevTargetY.current !== targetY || prevDistance.current !== distance || !flyingStarted.current) {
      prevTargetY.current = targetY
      prevDistance.current = distance
      flying.current = true
      flyingStarted.current = true
    }
  }, [targetY, distance])

  useFrame((_, delta) => {
    if (!flying.current) return
    desired.current.set(0, targetY + 4, distance)
    lookAt.current.set(0, targetY, 0)
    const k = Math.min(1, delta * 2.5)
    camera.position.lerp(desired.current, k)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(lookAt.current, k)
      controlsRef.current.update()
    }
    // Stop when close enough
    if (camera.position.distanceTo(desired.current) < 0.15) {
      flying.current = false
    }
  })
}
