import { Suspense, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'
import { SpriteFlipbook } from './SpriteFlipbook'

const WIDTH = 1.1
const HEIGHT = 1.5
const DEPTH = 0.5
const PILLAR_WIDTH = 0.25
const OPENING_WIDTH = WIDTH - PILLAR_WIDTH * 2
const OPENING_HEIGHT = 0.95
const HEARTH_WIDTH = WIDTH + 0.3
const HEARTH_DEPTH = DEPTH + 0.3
const HEARTH_THICKNESS = 0.1
// Darkens the jamb texture slightly so it doesn't read brighter than the room's ambient light.
const JAMB_TINT = '#c2c2c2'

// theme.fireplaceFireTexture is a 4x2 sheet of 8 hand-painted frames (logs + flame together).
const FIRE_COLUMNS = 4
const FIRE_ROWS = 2
const FIRE_FRAME_COUNT = 8
const FIRE_FPS = 10
const FIRE_WIDTH = 0.73
const FIRE_HEIGHT = 0.8
// The logs sit well above each frame's bottom edge (~13% padding, measured across all 8
// frames) — without this the plane's bottom lines up with empty transparent space instead
// of the visual base of the fire, making it look like it's floating above the hearth.
const FIRE_BASE_PADDING = FIRE_HEIGHT * 0.13
// Sits 1/4 of the way across the hearth slab's depth, measured from the back (wall) edge.
const HEARTH_BACK_Z = DEPTH / 2 - HEARTH_DEPTH / 2
const FIRE_Z = HEARTH_BACK_Z + HEARTH_DEPTH / 4

function TexturedMaterial({ url, tint }: { url: string; tint?: string }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
  }, [texture])

  return <meshStandardMaterial map={texture} color={tint} />
}

// A stone hearth built from boxes: two side pillars + a lintel framing the opening,
// topped with a wood mantel. Sits flush against a wall, like Desk.
export function Fireplace({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const theme = useLibraryTheme()

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, HEARTH_THICKNESS / 2, DEPTH / 2]}>
        <boxGeometry args={[HEARTH_WIDTH, HEARTH_THICKNESS, HEARTH_DEPTH]} />
        <meshStandardMaterial color={theme.doorFrameColor} />
      </mesh>

      <mesh position={[0, HEARTH_THICKNESS + 0.001, DEPTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HEARTH_WIDTH, HEARTH_DEPTH]} />
        {theme.fireplaceHearthTexture ? (
          <Suspense fallback={<meshStandardMaterial color={theme.doorFrameColor} />}>
            <TexturedMaterial url={theme.fireplaceHearthTexture} />
          </Suspense>
        ) : (
          <meshStandardMaterial color={theme.doorFrameColor} />
        )}
      </mesh>

      <mesh position={[-(OPENING_WIDTH / 2 + PILLAR_WIDTH / 2), HEIGHT / 2, 0]}>
        <boxGeometry args={[PILLAR_WIDTH, HEIGHT, DEPTH]} />
        <meshStandardMaterial color={theme.doorFrameColor} />
      </mesh>
      <mesh position={[-(OPENING_WIDTH / 2 + PILLAR_WIDTH / 2), HEIGHT / 2, DEPTH / 2 + 0.001]}>
        <planeGeometry args={[PILLAR_WIDTH, HEIGHT]} />
        {theme.fireplaceJambTexture ? (
          <Suspense fallback={<meshStandardMaterial color={theme.doorFrameColor} />}>
            <TexturedMaterial url={theme.fireplaceJambTexture} tint={JAMB_TINT} />
          </Suspense>
        ) : (
          <meshStandardMaterial color={theme.doorFrameColor} />
        )}
      </mesh>
      {/* left pillar's outer side, facing away from the opening */}
      <mesh
        position={[-(OPENING_WIDTH / 2 + PILLAR_WIDTH) - 0.001, HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[DEPTH, HEIGHT]} />
        {theme.fireplaceJambTexture ? (
          <Suspense fallback={<meshStandardMaterial color={theme.doorFrameColor} />}>
            <TexturedMaterial url={theme.fireplaceJambTexture} tint={JAMB_TINT} />
          </Suspense>
        ) : (
          <meshStandardMaterial color={theme.doorFrameColor} />
        )}
      </mesh>

      <mesh position={[OPENING_WIDTH / 2 + PILLAR_WIDTH / 2, HEIGHT / 2, 0]}>
        <boxGeometry args={[PILLAR_WIDTH, HEIGHT, DEPTH]} />
        <meshStandardMaterial color={theme.doorFrameColor} />
      </mesh>
      <mesh position={[OPENING_WIDTH / 2 + PILLAR_WIDTH / 2, HEIGHT / 2, DEPTH / 2 + 0.001]}>
        <planeGeometry args={[PILLAR_WIDTH, HEIGHT]} />
        {theme.fireplaceJambTexture ? (
          <Suspense fallback={<meshStandardMaterial color={theme.doorFrameColor} />}>
            <TexturedMaterial url={theme.fireplaceJambTexture} tint={JAMB_TINT} />
          </Suspense>
        ) : (
          <meshStandardMaterial color={theme.doorFrameColor} />
        )}
      </mesh>
      {/* right pillar's outer side, facing away from the opening */}
      <mesh
        position={[OPENING_WIDTH / 2 + PILLAR_WIDTH + 0.001, HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[DEPTH, HEIGHT]} />
        {theme.fireplaceJambTexture ? (
          <Suspense fallback={<meshStandardMaterial color={theme.doorFrameColor} />}>
            <TexturedMaterial url={theme.fireplaceJambTexture} tint={JAMB_TINT} />
          </Suspense>
        ) : (
          <meshStandardMaterial color={theme.doorFrameColor} />
        )}
      </mesh>

      <mesh position={[0, (HEIGHT + OPENING_HEIGHT) / 2, 0]}>
        <boxGeometry args={[WIDTH, HEIGHT - OPENING_HEIGHT, DEPTH]} />
        <meshStandardMaterial color={theme.doorFrameColor} />
      </mesh>

      <mesh position={[0, HEIGHT + 0.04, 0.04]}>
        <boxGeometry args={[WIDTH + 0.25, 0.08, DEPTH + 0.15]} />
        <meshStandardMaterial color={theme.deskAccentColor} />
      </mesh>

      <mesh position={[0, OPENING_HEIGHT / 2, -DEPTH / 2 + 0.06]}>
        <planeGeometry args={[OPENING_WIDTH, OPENING_HEIGHT]} />
        <meshStandardMaterial color="#140b06" />
      </mesh>

      {theme.fireplaceFireTexture ? (
        <Suspense fallback={null}>
          <SpriteFlipbook
            url={theme.fireplaceFireTexture}
            columns={FIRE_COLUMNS}
            rows={FIRE_ROWS}
            frameCount={FIRE_FRAME_COUNT}
            fps={FIRE_FPS}
            width={FIRE_WIDTH}
            height={FIRE_HEIGHT}
            position={[0, HEARTH_THICKNESS + FIRE_HEIGHT / 2 - FIRE_BASE_PADDING, FIRE_Z]}
          />
        </Suspense>
      ) : (
        <mesh position={[0, 0.14, -DEPTH / 2 + 0.12]}>
          <planeGeometry args={[OPENING_WIDTH * 0.7, 0.2]} />
          <meshStandardMaterial
            color={theme.fireplaceEmberColor}
            emissive={theme.fireplaceEmberColor}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      )}

      <pointLight
        position={[0, 0.4, -DEPTH / 2 + 0.3]}
        color={theme.fireplaceEmberColor}
        intensity={0.6}
        distance={3}
      />
    </group>
  )
}
