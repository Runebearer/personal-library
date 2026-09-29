import { Suspense, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'

// Width of the wooden molding around the canvas, and how far it stands out from the wall.
const FRAME_WIDTH = 0.05
const FRAME_DEPTH = 0.04
// The canvas sits slightly recessed inside the molding, like a real framed picture.
const CANVAS_RECESS = 0.012

function PaintingCanvas({ url, width, height }: { url: string; width: number; height: number }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
  }, [texture])

  return (
    <mesh position={[0, 0, FRAME_DEPTH - CANVAS_RECESS]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

// A framed picture hung on a wall: the image on a canvas, inside a wooden molding. Follows
// the wall-mount convention of Door/WallTorch — position is the center of the picture on
// the wall's surface, and it faces +z. `height` sets its size; the width follows the image's
// aspect ratio (`aspect` = width / height).
export function Painting({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  height,
  aspect,
}: {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  height: number
  aspect: number
}) {
  const theme = useLibraryTheme()
  const width = height * aspect
  const outerW = width + FRAME_WIDTH * 2
  const outerH = height + FRAME_WIDTH * 2

  // the four sides of the molding: top, bottom, left, right
  const horizontal: [number, number, number] = [outerW, FRAME_WIDTH, FRAME_DEPTH]
  const vertical: [number, number, number] = [FRAME_WIDTH, outerH, FRAME_DEPTH]
  const sides: { position: [number, number, number]; size: [number, number, number] }[] = [
    { position: [0, (height + FRAME_WIDTH) / 2, FRAME_DEPTH / 2], size: horizontal },
    { position: [0, -(height + FRAME_WIDTH) / 2, FRAME_DEPTH / 2], size: horizontal },
    { position: [-(width + FRAME_WIDTH) / 2, 0, FRAME_DEPTH / 2], size: vertical },
    { position: [(width + FRAME_WIDTH) / 2, 0, FRAME_DEPTH / 2], size: vertical },
  ]

  return (
    <group position={position} rotation={rotation}>
      {sides.map((side, i) => (
        <mesh key={i} position={side.position}>
          <boxGeometry args={side.size} />
          <meshStandardMaterial color={theme.paintingFrameColor} />
        </mesh>
      ))}

      {/* backing board, so the gap between canvas and wall isn't see-through at an angle */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={theme.paintingFrameColor} />
      </mesh>

      <Suspense fallback={null}>
        <PaintingCanvas url={url} width={width} height={height} />
      </Suspense>
    </group>
  )
}
