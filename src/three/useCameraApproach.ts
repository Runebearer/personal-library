import { useCallback, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const DEFAULT_DURATION = 0.6 // seconds

export interface ApproachOptions {
  duration?: number // seconds
  fov?: number // animate a perspective camera's field of view to this value too
  onArrive?: () => void // called once the camera has reached the target
}

// "Walk up to" animation used before leaving a scene (door, bookcase…): eases the camera
// to `target` and, if `lookAt` is given, turns it to face that point along the way.
// Must be used inside a <Canvas>. While `approaching`, OrbitControls should be disabled
// so they don't fight the animation.
export function useCameraApproach() {
  const { camera, invalidate } = useThree()
  const [approaching, setApproaching] = useState(false)
  const progress = useRef(0)
  const duration = useRef(DEFAULT_DURATION)
  const fromPos = useRef(new THREE.Vector3())
  const toPos = useRef(new THREE.Vector3())
  const fromQuat = useRef(new THREE.Quaternion())
  const toQuat = useRef(new THREE.Quaternion())
  const fromFov = useRef<number | null>(null)
  const toFov = useRef<number | null>(null)
  const onArrive = useRef<(() => void) | undefined>()

  const approach = useCallback(
    (target: THREE.Vector3, lookAt?: THREE.Vector3, options: ApproachOptions = {}) => {
      fromPos.current.copy(camera.position)
      toPos.current.copy(target)
      fromQuat.current.copy(camera.quaternion)
      if (lookAt) {
        const m = new THREE.Matrix4().lookAt(target, lookAt, camera.up)
        toQuat.current.setFromRotationMatrix(m)
      } else {
        toQuat.current.copy(camera.quaternion)
      }
      const perspective = camera instanceof THREE.PerspectiveCamera
      fromFov.current = perspective ? camera.fov : null
      toFov.current = perspective && options.fov !== undefined ? options.fov : null
      duration.current = options.duration ?? DEFAULT_DURATION
      onArrive.current = options.onArrive
      progress.current = 0
      setApproaching(true)
      invalidate()
    },
    [camera, invalidate],
  )

  useFrame((_, delta) => {
    if (!approaching) return

    progress.current = Math.min(1, progress.current + delta / duration.current)
    const eased = 1 - Math.pow(1 - progress.current, 3)
    camera.position.lerpVectors(fromPos.current, toPos.current, eased)
    camera.quaternion.slerpQuaternions(fromQuat.current, toQuat.current, eased)
    if (
      camera instanceof THREE.PerspectiveCamera &&
      fromFov.current !== null &&
      toFov.current !== null
    ) {
      camera.fov = THREE.MathUtils.lerp(fromFov.current, toFov.current, eased)
      camera.updateProjectionMatrix()
    }

    if (progress.current < 1) {
      invalidate()
    } else {
      setApproaching(false)
      onArrive.current?.()
    }
  })

  return { approaching, approach }
}
