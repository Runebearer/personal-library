import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'
import { isDragRelease } from '../../three/pointer'
import { RectGlow, type GlowRect } from './RectGlow'
import { SceneLabel } from './SceneLabel'
import {
  BOOKCASE_DEPTH,
  BOOKCASE_HEIGHT,
  BOOKCASE_WIDTH,
  INNER_WIDTH,
  MAX_BOOKS,
  PANEL,
  ROW_PITCH,
  ROWS,
  layoutBooks,
} from '../../three/bookcaseLayout'
import type { Book } from '../../types'

export { BOOKCASE_DEPTH, BOOKCASE_HEIGHT, BOOKCASE_WIDTH }

// The shelf's name floats above the bookcase, like Door's label (same offset).
const LABEL_OFFSET = 0.15
// Full height including room for the name label — for framing the bookcase with the camera.
export const BOOKCASE_TOTAL_HEIGHT = BOOKCASE_HEIGHT + LABEL_OFFSET * 2

// Front silhouette that the hover halo traces, like Door's.
const GLOW_RECTS: GlowRect[] = [
  { center: [0, BOOKCASE_HEIGHT / 2], size: [BOOKCASE_WIDTH, BOOKCASE_HEIGHT] },
]

// All the books of a bookcase, as one instanced mesh. With onSelectBook, each book is its
// own click target: hovering one shows the Door-style halo around its spine and its title.
function Books({ books, onSelectBook }: { books: Book[]; onSelectBook?: (book: Book) => void }) {
  const theme = useLibraryTheme()
  const { invalidate } = useThree()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const instances = useMemo(
    () => layoutBooks(books, theme.bookSpineColors),
    [books, theme.bookSpineColors],
  )
  const hovered = hoveredIndex !== null ? instances[hoveredIndex] : undefined

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    instances.forEach((b, i) => {
      matrix.compose(
        new THREE.Vector3(...b.position),
        new THREE.Quaternion(),
        new THREE.Vector3(...b.size),
      )
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, color.set(b.color))
    })
    mesh.count = instances.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
    invalidate()
  }, [instances, invalidate])

  useEffect(() => setHoveredIndex(null), [instances])

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, MAX_BOOKS]}
        raycast={onSelectBook ? undefined : () => null}
        onClick={
          onSelectBook &&
          ((e) => {
            e.stopPropagation()
            if (isDragRelease(e) || e.instanceId === undefined) return
            const instance = instances[e.instanceId]
            if (instance) onSelectBook(instance.book)
          })
        }
        onPointerMove={
          onSelectBook &&
          ((e) => {
            e.stopPropagation()
            if (e.instanceId !== undefined && e.instanceId !== hoveredIndex) {
              setHoveredIndex(e.instanceId)
              invalidate()
            }
          })
        }
        onPointerOut={onSelectBook && (() => setHoveredIndex(null))}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </instancedMesh>

      {hovered && (
        <>
          <RectGlow
            rects={[
              {
                center: [hovered.position[0], hovered.position[1]],
                size: [hovered.size[0], hovered.size[1]],
              },
            ]}
            position={[0, 0, hovered.position[2] + hovered.size[2] / 2 + 0.002]}
          />
          <SceneLabel
            position={[
              hovered.position[0],
              hovered.position[1] + hovered.size[1] / 2 + 0.05,
              hovered.position[2] + hovered.size[2] / 2,
            ]}
            text={hovered.book.title}
            distanceFactor={3}
          />
        </>
      )}
    </>
  )
}

// The boards: sides, back, top, bottom and the ROWS-1 shelves in between.
function useBoards() {
  return useMemo(() => {
    const vertical: { position: [number, number, number]; size: [number, number, number] }[] = [
      {
        position: [-(BOOKCASE_WIDTH - PANEL) / 2, BOOKCASE_HEIGHT / 2, 0],
        size: [PANEL, BOOKCASE_HEIGHT, BOOKCASE_DEPTH],
      },
      {
        position: [(BOOKCASE_WIDTH - PANEL) / 2, BOOKCASE_HEIGHT / 2, 0],
        size: [PANEL, BOOKCASE_HEIGHT, BOOKCASE_DEPTH],
      },
      {
        position: [0, BOOKCASE_HEIGHT / 2, -(BOOKCASE_DEPTH - PANEL) / 2],
        size: [BOOKCASE_WIDTH, BOOKCASE_HEIGHT, PANEL],
      },
    ]
    const horizontal = Array.from({ length: ROWS + 1 }, (_, i) => ({
      position: [0, i * ROW_PITCH + PANEL / 2, 0] as [number, number, number],
      size: [INNER_WIDTH, PANEL, BOOKCASE_DEPTH - PANEL] as [number, number, number],
    }))
    return { vertical, horizontal }
  }, [])
}

function PlainFrame({ color }: { color: string }) {
  const { vertical, horizontal } = useBoards()
  return (
    <>
      {[...vertical, ...horizontal].map((b, i) => (
        <mesh key={i} position={b.position} raycast={() => null}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  )
}

// Same wood as the lobby desk; horizontal boards get the grain turned 90° like Desk does.
function TexturedFrame({ url }: { url: string }) {
  const texture = useTexture(url)
  const { vertical, horizontal } = useBoards()

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  const horizontalTexture = useMemo(() => {
    const clone = texture.clone()
    clone.wrapS = THREE.RepeatWrapping
    clone.wrapT = THREE.RepeatWrapping
    clone.colorSpace = THREE.SRGBColorSpace
    clone.center.set(0.5, 0.5)
    clone.rotation = Math.PI / 2
    clone.needsUpdate = true
    return clone
  }, [texture])

  return (
    <>
      {vertical.map((b, i) => (
        <mesh key={`v${i}`} position={b.position} raycast={() => null}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial map={texture} />
        </mesh>
      ))}
      {horizontal.map((b, i) => (
        <mesh key={`h${i}`} position={b.position} raycast={() => null}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial map={horizontalTexture} />
        </mesh>
      ))}
    </>
  )
}

// One of the user's shelves as a piece of furniture: a wooden bookcase holding the shelf's
// real books, with its name floating above it like a door's label. Front faces +z (same convention as Desk and
// Door); position is the center of its footprint on the floor. Two ways to interact:
// onSelect makes the whole bookcase one click target (an invisible box around it) with the
// same hover halo as Door — the library room; onSelectBook makes each book clickable
// instead — the shelf close-up.
export function Bookcase({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  name,
  books,
  onSelect,
  onSelectBook,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  name: string
  books: Book[]
  onSelect?: () => void
  onSelectBook?: (book: Book) => void
}) {
  const theme = useLibraryTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position} rotation={rotation}>
      {theme.deskTexture ? (
        <Suspense fallback={<PlainFrame color={theme.deskColor} />}>
          <TexturedFrame url={theme.deskTexture} />
        </Suspense>
      ) : (
        <PlainFrame color={theme.deskColor} />
      )}

      <Books books={books} onSelectBook={onSelectBook} />
      <SceneLabel position={[0, BOOKCASE_HEIGHT + LABEL_OFFSET, BOOKCASE_DEPTH / 2]} text={name} />

      {onSelect && (
        <mesh
          position={[0, BOOKCASE_HEIGHT / 2, 0]}
          onClick={(e) => {
            e.stopPropagation()
            if (isDragRelease(e)) return
            onSelect()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[BOOKCASE_WIDTH + 0.02, BOOKCASE_HEIGHT + 0.02, BOOKCASE_DEPTH + 0.02]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {hovered && onSelect && <RectGlow rects={GLOW_RECTS} position={[0, 0, BOOKCASE_DEPTH / 2 + 0.002]} />}
    </group>
  )
}
