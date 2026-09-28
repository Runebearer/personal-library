import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Phase = 'idle' | 'covering' | 'revealing'

const FADE_MS = 650
// Crossfade: how long the frozen frame of the old page stays fully opaque while the new
// page (and its 3D scene) renders underneath, then how long it takes to melt away.
const CROSSFADE_HOLD_MS = 350
const CROSSFADE_MS = 450

const TransitionContext = createContext<{
  fadeAndNavigate: (navigateFn: () => void) => void
  crossfadeAndNavigate: (snapshot: string, navigateFn: () => void) => void
} | null>(null)

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const timeoutRef = useRef<number>()
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [snapshotVisible, setSnapshotVisible] = useState(false)
  const crossfadeTimeoutRef = useRef<number>()

  // Fade to black, navigate, fade back in.
  const fadeAndNavigate = useCallback((navigateFn: () => void) => {
    window.clearTimeout(timeoutRef.current)
    setPhase('covering')
    timeoutRef.current = window.setTimeout(() => {
      navigateFn()
      // wait for the new route to paint behind the black overlay before revealing it
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('revealing'))
      })
    }, FADE_MS)
  }, [])

  // Seamless handover: `snapshot` (an image of the current screen, e.g. a 3D canvas's last
  // frame) covers the screen instantly, the route changes underneath, then the snapshot
  // melts away into the new page — no black in between.
  const crossfadeAndNavigate = useCallback((image: string, navigateFn: () => void) => {
    window.clearTimeout(crossfadeTimeoutRef.current)
    setSnapshot(image)
    setSnapshotVisible(true)
    navigateFn()
    crossfadeTimeoutRef.current = window.setTimeout(() => {
      setSnapshotVisible(false)
      crossfadeTimeoutRef.current = window.setTimeout(() => setSnapshot(null), CROSSFADE_MS)
    }, CROSSFADE_HOLD_MS)
  }, [])

  return (
    <TransitionContext.Provider value={{ fadeAndNavigate, crossfadeAndNavigate }}>
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
