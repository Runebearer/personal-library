import { useState } from 'react'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'

const BOOK_WIDTH = 0.035 // spine thickness
const BOOK_HEIGHT = 0.24
const BOOK_DEPTH = 0.16
const PAGE_INSET = 0.006
const PAGE_HEIGHT = 0.012
// How far the page block pokes out above the cover's top face — without this its top face
// sits exactly flush with the cover's, and the two coplanar surfaces z-fight (flicker) as
// the camera moves.
const PAGE_PROTRUSION = 0.004

const HOVER_GLOW = '#fdf6e3'
// The book has no cutout texture to trace like Door's outline shader, so instead of that
// alpha-based glow it uses an "inverted hull": a slightly bigger copy of the cover, rendered
// back-face only, which pokes out as a thin rim around the real geometry on hover.
const OUTLINE_MARGIN = 0.01

// A single closed book, standing upright with its spine facing +z (the same "faces the
// room" convention as Door/Desk). Meant to be placed on shelves or a countertop; position
// is the point where its bottom sits. coverColor defaults to the theme's color but can be
// overridden per book once real book data drives it. onSelect, if given, makes the book
// clickable (e.g. to open its detail sheet) with a hover highlight like Door's.
export function Book({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  coverColor,
  onSelect,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  coverColor?: string
  onSelect?: () => void
}) {
  const theme = useLibraryTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position} rotation={rotation}>
      <mesh
        position={[0, BOOK_HEIGHT / 2, 0]}
        onClick={
          onSelect &&
          ((e) => {
            e.stopPropagation()
            onSelect()
          })
        }
        onPointerOver={
          onSelect &&
          ((e) => {
            e.stopPropagation()
            setHovered(true)
          })
        }
        onPointerOut={onSelect && (() => setHovered(false))}
      >
        <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
        <meshStandardMaterial color={coverColor ?? theme.bookCoverColor} />
      </mesh>

      {hovered && (
        <mesh position={[0, BOOK_HEIGHT / 2, 0]} raycast={() => null}>
          <boxGeometry
            args={[
              BOOK_WIDTH + OUTLINE_MARGIN,
              BOOK_HEIGHT + OUTLINE_MARGIN,
              BOOK_DEPTH + OUTLINE_MARGIN,
            ]}
          />
          <meshBasicMaterial color={HOVER_GLOW} side={THREE.BackSide} />
        </mesh>
      )}

      {/* page block, peeking out along the top edge */}
      <mesh position={[0, BOOK_HEIGHT - PAGE_HEIGHT / 2 + PAGE_PROTRUSION, 0]}>
        <boxGeometry args={[BOOK_WIDTH - PAGE_INSET, PAGE_HEIGHT, BOOK_DEPTH - PAGE_INSET]} />
        <meshStandardMaterial color={theme.bookPageColor} />
      </mesh>
    </group>
  )
}
