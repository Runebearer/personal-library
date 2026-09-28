import { useEffect, useMemo, useState } from 'react'
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

// Title printed on the front cover: drawn into a canvas texture (no font file to load, so it
// works offline like the rest of the PWA), on a plane hovering just off the +x cover face.
// Unlit (basic material) so the gilt lettering stays readable in the dim lobby.
const TITLE_INSET = 0.02
const TITLE_OFFSET = 0.0008
const TITLE_CANVAS_WIDTH = 256
const TITLE_CANVAS_HEIGHT = Math.round((TITLE_CANVAS_WIDTH * BOOK_HEIGHT) / BOOK_DEPTH)
const TITLE_FONT = 'bold 60px Georgia, "Times New Roman", serif'
const TITLE_LINE_HEIGHT = 70

// Greedy word wrap to the canvas width (minus a margin).
function wrapTitle(ctx: CanvasRenderingContext2D, title: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of title.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

function useTitleTexture(title: string | undefined, color: string) {
  const texture = useMemo(() => {
    if (!title) return null
    const canvas = document.createElement('canvas')
    canvas.width = TITLE_CANVAS_WIDTH
    canvas.height = TITLE_CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.font = TITLE_FONT
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lines = wrapTitle(ctx, title, TITLE_CANVAS_WIDTH * 0.85)
    const top = TITLE_CANVAS_HEIGHT / 2 - ((lines.length - 1) * TITLE_LINE_HEIGHT) / 2
    lines.forEach((l, i) => ctx.fillText(l, TITLE_CANVAS_WIDTH / 2, top + i * TITLE_LINE_HEIGHT))

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [title, color])

  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}

// A single closed book, standing upright with its spine facing +z (the same "faces the
// room" convention as Door/Desk). Meant to be placed on shelves or a countertop; position
// is the point where its bottom sits. coverColor defaults to the theme's color but can be
// overridden per book once real book data drives it. title, if given, is printed on the
// front cover — the +x face, so rotate the book by -PI/2 around y to face it +z. onSelect, if given, makes the book
// clickable (e.g. to open its detail sheet) with a hover highlight like Door's.
export function Book({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  coverColor,
  title,
  onSelect,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  coverColor?: string
  title?: string
  onSelect?: () => void
}) {
  const theme = useLibraryTheme()
  const [hovered, setHovered] = useState(false)
  const titleTexture = useTitleTexture(title, theme.bookTitleColor)

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

      {titleTexture && (
        <mesh
          position={[BOOK_WIDTH / 2 + TITLE_OFFSET, BOOK_HEIGHT / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[BOOK_DEPTH - TITLE_INSET, BOOK_HEIGHT - TITLE_INSET]} />
          <meshBasicMaterial map={titleTexture} transparent />
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
