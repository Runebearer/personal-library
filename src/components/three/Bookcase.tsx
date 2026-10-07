import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'
import { isDragRelease } from '../../three/pointer'
import { useSeriesById } from '../../three/SeriesContext'
import { isDark } from '../../lib/color'
import { useTextTexture } from '../../three/textTexture'
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
  type BookInstance,
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

// The series name printed along the spines of its volumes, reading bottom to top. All the
// volumes of a series share their size (see layoutBooks), so one text texture serves them
// all. Unlit like Book's title so the lettering stays readable in the dim scenes.
const SPINE_CANVAS_WIDTH = 512
const SPINE_TEXT_INSET = 0.92
const SPINE_OFFSET = 0.001

// The tome number sits at the top end of the spine, the series name takes the rest.
const TOME_SHARE = 0.22
const NAME_SHARE_WITH_TOME = 0.74
const TOME_CANVAS_WIDTH = 128

// Tome is free text ("3", "Tome 3"): print just its number when there is one.
function tomeLabel(tome: string | null) {
  return tome?.match(/\d+(?:[.,]\d+)?/)?.[0] ?? tome?.trim() ?? undefined
}

function SeriesSpines({ name, instances }: { name: string; instances: BookInstance[] }) {
  const theme = useLibraryTheme()
  const { invalidate } = useThree()
  const [thickness, height] = instances[0].size
  const length = height * SPINE_TEXT_INSET
  const width = thickness * SPINE_TEXT_INSET
  const hasTomes = instances.some((b) => tomeLabel(b.book.tome))
  const nameLength = hasTomes ? length * NAME_SHARE_WITH_TOME : length
  const tomeLength = length * TOME_SHARE
  // light lettering on dark spines, dark on light ones (a series can pick any color)
  const color = isDark(instances[0].color) ? theme.bookTitleColor : '#2a1d0a'
  const texture = useTextTexture(name, {
    width: SPINE_CANVAS_WIDTH,
    height: Math.round((SPINE_CANVAS_WIDTH * width) / nameLength),
    color,
    fontSize: 72,
    maxLines: 1,
  })

  useEffect(() => invalidate(), [texture, invalidate])
  if (!texture) return null

  return (
    <>
      {instances.map((b) => {
        const z = b.position[2] + b.size[2] / 2 + SPINE_OFFSET
        const label = tomeLabel(b.book.tome)
        return (
          <group key={b.book.id}>
            <mesh
              position={[b.position[0], b.position[1] + (hasTomes ? -(length - nameLength) / 2 : 0), z]}
              rotation={[0, 0, Math.PI / 2]}
              raycast={() => null}
            >
              <planeGeometry args={[nameLength, width]} />
              <meshBasicMaterial map={texture} transparent />
            </mesh>
            {label && (
              <TomeNumber
                label={label}
                position={[b.position[0], b.position[1] + (length - tomeLength) / 2, z]}
                length={tomeLength}
                width={width}
                color={color}
              />
            )}
          </group>
        )
      })}
    </>
  )
}

function TomeNumber({
  label,
  position,
  length,
  width,
  color,
}: {
  label: string
  position: [number, number, number]
  length: number
  width: number
  color: string
}) {
  const { invalidate } = useThree()
  const texture = useTextTexture(label, {
    width: TOME_CANVAS_WIDTH,
    height: Math.round((TOME_CANVAS_WIDTH * width) / length),
    color,
    fontSize: 110,
    maxLines: 1,
  })

  useEffect(() => invalidate(), [texture, invalidate])
  if (!texture) return null

  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
      <planeGeometry args={[length, width]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  )
}

// All the books of a bookcase, as one instanced mesh. With onSelectBook, each book is its
// own click target: hovering one shows the Door-style halo around its spine and its title.
function Books({ books, onSelectBook }: { books: Book[]; onSelectBook?: (book: Book) => void }) {
  const theme = useLibraryTheme()
  const { invalidate } = useThree()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const seriesById = useSeriesById()
  const instances = useMemo(() => {
    const seriesColors = Object.fromEntries(Object.values(seriesById).map((s) => [s.id, s.color]))
    return layoutBooks(books, theme.bookSpineColors, seriesColors)
  }, [books, theme.bookSpineColors, seriesById])
  const hovered = hoveredIndex !== null ? instances[hoveredIndex] : undefined

  const spinesBySeries = useMemo(() => {
    // a book outside any series prints its own title, alone on its spine
    const spines = new Map<string, { name: string; instances: BookInstance[] }>()
    for (const instance of instances) {
      const id = instance.book.seriesId
      if (!id) {
        spines.set(`book:${instance.book.id}`, {
          name: instance.book.title,
          instances: [instance],
        })
        continue
      }
      if (!seriesById[id]) continue
      const entry = spines.get(id)
      if (entry) entry.instances.push(instance)
      else spines.set(id, { name: seriesById[id].name, instances: [instance] })
    }
    return [...spines.entries()]
  }, [instances, seriesById])

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

      {spinesBySeries.map(([key, { name, instances: spines }]) => (
        <SeriesSpines key={key} name={name} instances={spines} />
      ))}

      {hovered && (
        <>
          <RectGlow
            // remount per book: the plane's size and shader uniforms are fixed when it's built,
            // so reusing one instance kept the first hovered book's halo for every other book
            key={hovered.book.id}
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
