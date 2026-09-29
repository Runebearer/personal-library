import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'

// Frames drawn before the scene may count as ready: the first ones can precede texture
// loads even starting (components suspend on their textures during those renders).
const MIN_FRAMES = 3

// Calls onReady once, when the scene has drawn a few frames and no texture is loading any
// more — i.e. what's on screen is the finished scene, not fallbacks. Page transitions wait
// for it before fading in (see TransitionContext's notifySceneReady). Must be rendered
// inside the <Canvas>, outside any Suspense boundary so it mounts right away.
export function SceneReadySignal({ onReady }: { onReady: () => void }) {
  const { active } = useProgress()
  const { invalidate } = useThree()
  const frames = useRef(0)
  const done = useRef(false)

  useFrame(() => {
    if (done.current) return
    frames.current++
    if (frames.current >= MIN_FRAMES && !active) {
      done.current = true
      onReady()
    } else {
      // on-demand canvases only draw when asked: keep frames coming until ready
      invalidate()
    }
  })

  useEffect(() => {
    invalidate()
  }, [invalidate])

  return null
}
