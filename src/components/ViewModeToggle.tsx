import { useTransition } from '../context/TransitionContext'
import { useViewMode } from '../context/ViewModeContext'

// Switches between the classic and 3D rendering of the current page. Every route has both
// views, so the user stays where they are — only the rendering changes.
export function ViewModeToggle({ className }: { className?: string }) {
  const { viewMode, setViewMode } = useViewMode()
  const { fadeAndNavigate } = useTransition()

  function handleToggle() {
    const next = viewMode === '3d' ? 'classic' : '3d'
    fadeAndNavigate(() => setViewMode(next))
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow ring-1 ring-gray-200 backdrop-blur ${className ?? ''}`}
    >
      {viewMode === '3d' ? 'Vue classique' : 'Vue 3D'}
    </button>
  )
}
