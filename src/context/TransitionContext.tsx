import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Phase = 'idle' | 'covering' | 'revealing'

// Duration of each half of the black fade (to black, then back from black).
const FADE_MS = 350
// Crossfade: how long the frozen frame of the old page takes to melt into the new page.
const CROSSFADE_MS = 450
// Minimum time the cover (black or frozen frame) stays up after navigating, so the new page
// has painted even when its 3D scene reports ready instantly.
const MIN_HOLD_MS = 150
// Never keep the screen covered longer than this waiting for a 3D scene to report ready.
const MAX_SCENE_WAIT_MS = 3000

export interface NavigateOptions {
  // The destination renders a 3D scene: keep the screen covered until it reports ready
  // (see notifySceneReady) instead of revealing a canvas that is still loading.
  waitForScene?: boolean
}

const TransitionContext = createContext<{
  fadeAndNavigate: (navigateFn: () => void, options?: NavigateOptions) => void
  crossfadeAndNavigate: (snapshot: string, navigateFn: () => void) => void
  notifySceneReady: () => void
} | null>(null)

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const timeoutRef = useRef<number>()
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [snapshotVisible, setSnapshotVisible] = useState(false)
  const crossfadeTimeoutRef = useRef<number>()
  // Reveal waiting for the destination's 3D scene to be ready; called at most once.
  const pendingReveal = useRef<(() => void) | null>(null)
  const sceneWaitRef = useRef<number>()

  // Runs `reveal` once the new page is ready to be shown: right after it has painted, or —
  // for a 3D destination — once its scene reports ready (bounded by MAX_SCENE_WAIT_MS).
  const revealWhenReady = useCallback((reveal: () => void, waitForScene: boolean) => {
    window.clearTimeout(sceneWaitRef.current)
    pendingReveal.current = null
    const start = performance.now()
    let done = false
    const run = () => {
      if (done) return
      done = true
      pendingReveal.current = null
      window.clearTimeout(sceneWaitRef.current)
      const wait = Math.max(0, MIN_HOLD_MS - (performance.now() - start))
      window.setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(reveal)), wait)
    }
    if (waitForScene) {
      pendingReveal.current = run
      sceneWaitRef.current = window.setTimeout(run, MAX_SCENE_WAIT_MS)
    } else {
      run()
    }
  }, [])

  // Called by 3D scenes once their first frames are drawn with all textures loaded.
  const notifySceneReady = useCallback(() => {
    pendingReveal.current?.()
  }, [])

  // Fade to black, navigate, then fade back in from black once the new page is ready.
  const fadeAndNavigate = useCallback(
    (navigateFn: () => void, options: NavigateOptions = {}) => {
      window.clearTimeout(timeoutRef.current)
      setPhase('covering')
      timeoutRef.current = window.setTimeout(() => {
        navigateFn()
        revealWhenReady(() => setPhase('revealing'), options.waitForScene ?? false)
      }, FADE_MS)
    },
    [revealWhenReady],
  )

  // Seamless handover between 3D scenes: `snapshot` (the old scene's last frame) covers the
  // screen instantly, the route changes underneath, then once the new scene is ready the
  // snapshot melts away into it — no black in between.
  const crossfadeAndNavigate = useCallback(
    (image: string, navigateFn: () => void) => {
      window.clearTimeout(crossfadeTimeoutRef.current)
      setSnapshot(image)
      setSnapshotVisible(true)
      navigateFn()
      revealWhenReady(() => {
        setSnapshotVisible(false)
        crossfadeTimeoutRef.current = window.setTimeout(() => setSnapshot(null), CROSSFADE_MS)
      }, true)
    },
    [revealWhenReady],
  )

  return (
    <TransitionContext.Provider value={{ fadeAndNavigate, crossfadeAndNavigate, notifySceneReady }}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-black"
        style={{
          opacity: phase === 'covering' ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      />
      {snapshot && (
        <img
          aria-hidden
          alt=""
          src={snapshot}
          className="pointer-events-none fixed inset-0 z-50 h-full w-full object-cover"
          style={{
            opacity: snapshotVisible ? 1 : 0,
            transition: snapshotVisible ? 'none' : `opacity ${CROSSFADE_MS}ms ease`,
          }}
        />
      )}
    </TransitionContext.Provider>
  )
}

export function useTransition() {
  const ctx = useContext(TransitionContext)
  if (!ctx) {
    throw new Error('useTransition must be used within a TransitionProvider')
  }
  return ctx
}
