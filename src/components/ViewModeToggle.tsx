import { useTransition } from '../context/TransitionContext'
import { useViewMode, type ViewMode } from '../context/ViewModeContext'

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'classic', label: 'Classique' },
  { value: '3d', label: '3D' },
]

// Switches between the classic and 3D rendering of the current page. Every route has both
// views, so the user stays where they are — only the rendering changes. Both options are
// always shown, the current one highlighted.
export function ViewModeToggle({ className }: { className?: string }) {
  const { viewMode, setViewMode } = useViewMode()
  const { fadeAndNavigate } = useTransition()

  function handleSelect(next: ViewMode) {
    if (next === viewMode) return
    // switching to 3D: stay dark until the scene is drawn, then fade in on it
    fadeAndNavigate(() => setViewMode(next), { waitForScene: next === '3d' })
  }

  return (
    <div
      role="group"
      aria-label="Mode d'affichage"
      className={`flex rounded-full bg-white/90 p-0.5 text-xs font-medium shadow ring-1 ring-gray-200 backdrop-blur ${className ?? ''}`}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={viewMode === option.value}
          onClick={() => handleSelect(option.value)}
          className={`rounded-full px-3 py-1 ${
            viewMode === option.value ? 'bg-gray-900 text-white' : 'text-gray-500'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
