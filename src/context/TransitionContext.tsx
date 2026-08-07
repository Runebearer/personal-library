import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Phase = 'idle' | 'covering' | 'revealing'

const FADE_MS = 650

const TransitionContext = createContext<{
  fadeAndNavigate: (navigateFn: () => void) => void
} | null>(null)

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const timeoutRef = useRef<number>()

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

  return (
    <TransitionContext.Provider value={{ fadeAndNavigate }}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-black"
        style={{
          opacity: phase === 'covering' ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      />
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
