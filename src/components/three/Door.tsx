import { Suspense, useEffect, useState } from 'react'
import { Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'
import type { LibraryTheme } from '../../three/theme'

const DOOR_HEIGHT = 2.1
// The door texture bakes in its own stone arch, so geometry must match its aspect ratio.
const DOOR_TEXTURE_ASPECT = 512 / 917
const DOOR_WIDTH = DOOR_HEIGHT * DOOR_TEXTURE_ASPECT

const HOVER_GLOW = '#f4b942'

function PlainDoorMaterial({ theme, hovered }: { theme: LibraryTheme; hovered: boolean }) {
  return (
    <meshStandardMaterial
      color={theme.doorColor}
      emissive={hovered ? HOVER_GLOW : '#000000'}
      emissiveIntensity={hovered ? 0.4 : 0}
    />
  )
}

function TexturedDoorMaterial({ url, hovered }: { url: string; hovered: boolean }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
  }, [texture])

  return (
    <meshStandardMaterial
      map={texture}
      alphaTest={0.5}
      emissive={hovered ? HOVER_GLOW : '#000000'}
      emissiveIntensity={hovered ? 0.4 : 0}
    />
  )
}

export function Door({
  position,
  rotation = [0, 0, 0],
  label,
  onSelect,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  label: string
  onSelect: () => void
}) {
  const theme = useLibraryTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position} rotation={rotation}>
      <mesh
        position={[0, DOOR_HEIGHT / 2, 0.03]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
        {theme.doorTexture ? (
          <Suspense fallback={<PlainDoorMaterial theme={theme} hovered={hovered} />}>
            <TexturedDoorMaterial url={theme.doorTexture} hovered={hovered} />
          </Suspense>
        ) : (
          <PlainDoorMaterial theme={theme} hovered={hovered} />
        )}
      </mesh>

      <Html
        position={[0, DOOR_HEIGHT + 0.15, 0.1]}
        center
        distanceFactor={6}
        style={{ pointerEvents: 'none' }}
      >
        <span
          className="whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-medium shadow-sm"
          style={{ color: theme.labelColor }}
        >
          {label}
        </span>
      </Html>
    </group>
  )
}
