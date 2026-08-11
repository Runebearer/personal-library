import { Suspense, useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'

const PANEL_WIDTH = 2.2
const PANEL_HEIGHT = 0.825
const PANEL_DEPTH = 0.5
const WALL_THICKNESS = 0.05

// The cubby's wood surfaces (floor, walls, shelf) — everything except the countertop, which
// keeps the flat accent color.
function DeskPanels({ color }: { color: string }) {
  return (
    <>
      {/* cubby floor */}
      <mesh position={[0, WALL_THICKNESS / 2, 0]}>
        <boxGeometry args={[PANEL_WIDTH, WALL_THICKNESS, PANEL_DEPTH]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* left wall */}
      <mesh position={[-(PANEL_WIDTH - WALL_THICKNESS) / 2, PANEL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, PANEL_HEIGHT, PANEL_DEPTH]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* right wall */}
      <mesh position={[(PANEL_WIDTH - WALL_THICKNESS) / 2, PANEL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, PANEL_HEIGHT, PANEL_DEPTH]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* back wall, against the room wall behind the desk */}
      <mesh position={[0, PANEL_HEIGHT / 2, -(PANEL_DEPTH - WALL_THICKNESS) / 2]}>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* mid-height shelf, splitting the cubby into two compartments */}
      <mesh position={[0, PANEL_HEIGHT / 2, 0]}>
        <boxGeometry args={[PANEL_WIDTH, WALL_THICKNESS, PANEL_DEPTH]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  )
}

function TexturedDeskPanels({ url }: { url: string }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 1)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  // Floor and shelf are horizontal — turn the plank direction 90° there so it doesn't run
  // the same way as the vertical wall planks. Cloned so the shared wall texture is untouched.
  const horizontalTexture = useMemo(() => {
    const clone = texture.clone()
    clone.wrapS = THREE.RepeatWrapping
    clone.wrapT = THREE.RepeatWrapping
    clone.repeat.set(2, 1)
    clone.colorSpace = THREE.SRGBColorSpace
    clone.center.set(0.5, 0.5)
    clone.rotation = Math.PI / 2
    clone.needsUpdate = true
    return clone
  }, [texture])

  return (
    <>
      <mesh position={[0, WALL_THICKNESS / 2, 0]}>
        <boxGeometry args={[PANEL_WIDTH, WALL_THICKNESS, PANEL_DEPTH]} />
        <meshStandardMaterial map={horizontalTexture} />
      </mesh>

      <mesh position={[-(PANEL_WIDTH - WALL_THICKNESS) / 2, PANEL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, PANEL_HEIGHT, PANEL_DEPTH]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      <mesh position={[(PANEL_WIDTH - WALL_THICKNESS) / 2, PANEL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, PANEL_HEIGHT, PANEL_DEPTH]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      <mesh position={[0, PANEL_HEIGHT / 2, -(PANEL_DEPTH - WALL_THICKNESS) / 2]}>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      <mesh position={[0, PANEL_HEIGHT / 2, 0]}>
        <boxGeometry args={[PANEL_WIDTH, WALL_THICKNESS, PANEL_DEPTH]} />
        <meshStandardMaterial map={horizontalTexture} />
      </mesh>
    </>
  )
}

// A hotel-style reception counter, open-fronted like a cubby so books can be stored inside
// (visible from the room side), with an overhanging countertop on top.
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
      {theme.deskTexture ? (
        <Suspense fallback={<DeskPanels color={theme.deskColor} />}>
          <TexturedDeskPanels url={theme.deskTexture} />
        </Suspense>
      ) : (
        <DeskPanels color={theme.deskColor} />
      )}

      <mesh position={[0, PANEL_HEIGHT + 0.03, 0.05]}>
        <boxGeometry args={[PANEL_WIDTH + 0.1, 0.06, PANEL_DEPTH + 0.1]} />
        <meshStandardMaterial color={theme.deskAccentColor} />
      </mesh>
    </group>
  )
}
