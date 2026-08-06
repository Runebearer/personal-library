import { useLibraryTheme } from '../../three/ThemeContext'

const PANEL_WIDTH = 2.2
const PANEL_HEIGHT = 1.1
const PANEL_DEPTH = 0.5

// A hotel-style reception counter: solid front panel + overhanging countertop,
// rather than an open desk with visible legs.
export function Desk({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const theme = useLibraryTheme()

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, PANEL_HEIGHT / 2, 0]}>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <meshStandardMaterial color={theme.deskColor} />
      </mesh>

      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.01]}>
        <boxGeometry args={[PANEL_WIDTH, 0.16, 0.02]} />
        <meshStandardMaterial color={theme.deskAccentColor} />
      </mesh>

      <mesh position={[0, PANEL_HEIGHT + 0.03, 0.05]}>
        <boxGeometry args={[PANEL_WIDTH + 0.1, 0.06, PANEL_DEPTH + 0.1]} />
        <meshStandardMaterial color={theme.deskAccentColor} />
      </mesh>
    </group>
  )
}
