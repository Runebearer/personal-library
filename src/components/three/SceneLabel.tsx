import { Html } from '@react-three/drei'
import { useLibraryTheme } from '../../three/ThemeContext'

// The pill-shaped name tag floating above scene objects (doors, bookcases, hovered books),
// so every label in the 3D views looks the same. Never intercepts pointer events.
export function SceneLabel({
  position,
  text,
  distanceFactor = 6,
}: {
  position: [number, number, number]
  text: string
  distanceFactor?: number
}) {
  const theme = useLibraryTheme()

  return (
    <Html
      position={position}
      center
      distanceFactor={distanceFactor}
      // drei's default z-index is huge; keep labels under the page's overlay buttons
      // (z-10), modals and transitions (z-50)
      zIndexRange={[9, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <span
        className="whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-medium shadow-sm"
        style={{ color: theme.labelColor }}
      >
        {text}
      </span>
    </Html>
  )
}
