import * as THREE from 'three'
import { BOOKCASE_DEPTH, BOOKCASE_WIDTH } from '../components/three/Bookcase'
import type { Shelf } from '../types'

export const ROOM_HEIGHT = 3
// Bookcases stand against the walls, facing the center where the camera is. The room starts
// at the lobby's size and grows until every shelf gets a spot.
const MIN_HALF = 3
const HALF_STEP = 0.5
const GAP = 0.3 // between neighbouring bookcases on a wall
// Keeps bookcases out of the corners, where they'd collide with the neighbouring wall's.
const CORNER = BOOKCASE_DEPTH + 0.05
// Half-width of the back wall's free zone around the door and its two lanterns.
const DOOR_CLEARANCE = 1.4
// Distance from the wall to the bookcase's center (small gap so the back doesn't z-fight).
const WALL_OFFSET = BOOKCASE_DEPTH / 2 + 0.02

type Wall = 'front' | 'right' | 'back' | 'left'

export type Placement = {
  shelf: Shelf
  position: [number, number, number]
  rotationY: number
  normal: THREE.Vector3 // direction the bookcase faces, toward the room
}

// Centers of the bookcases fitting between `from` and `to` along a wall, ordered from
// `from`; `count` (if given, and smaller) places fewer, still centered in the segment.
function slotsAlong(from: number, to: number, count?: number) {
  const length = Math.abs(to - from)
  const step = BOOKCASE_WIDTH + GAP
  const capacity = Math.max(0, Math.floor((length + GAP) / step))
  const n = count === undefined ? capacity : Math.min(capacity, count)
  const offset = (length - (n * step - GAP)) / 2
  const sign = Math.sign(to - from)
  return Array.from({ length: n }, (_, i) => from + sign * (offset + BOOKCASE_WIDTH / 2 + i * step))
}

// Wall segments in the order the viewer meets them turning right from the starting view:
// front wall left to right, right wall, back wall on each side of the door, left wall.
function wallSegments(half: number): { wall: Wall; from: number; to: number }[] {
  const end = half - CORNER
  return [
    { wall: 'front', from: -end, to: end },
    { wall: 'right', from: -end, to: end },
    { wall: 'back', from: end, to: DOOR_CLEARANCE },
    { wall: 'back', from: -DOOR_CLEARANCE, to: -end },
    { wall: 'left', from: end, to: -end },
  ]
}

function wallTransform(wall: Wall, along: number, half: number) {
  const d = half - WALL_OFFSET
  switch (wall) {
    case 'front':
      return { position: [along, 0, -d], rotationY: 0, normal: new THREE.Vector3(0, 0, 1) }
    case 'right':
      return { position: [d, 0, along], rotationY: -Math.PI / 2, normal: new THREE.Vector3(-1, 0, 0) }
    case 'back':
      return { position: [along, 0, d], rotationY: Math.PI, normal: new THREE.Vector3(0, 0, -1) }
    case 'left':
      return { position: [-d, 0, along], rotationY: Math.PI / 2, normal: new THREE.Vector3(1, 0, 0) }
  }
}

function capacity(half: number) {
  return wallSegments(half).reduce((sum, s) => sum + slotsAlong(s.from, s.to).length, 0)
}

// Where every shelf's bookcase stands in the library room, and the room's half-size.
// Deterministic for a given shelves list, so the shelf close-up can rebuild the exact same
// room around its bookcase.
export function placeBookcases(shelves: Shelf[]) {
  let half = MIN_HALF
  while (capacity(half) < shelves.length) half += HALF_STEP

  const placements: Placement[] = []
  let next = 0
  for (const segment of wallSegments(half)) {
    const remaining = shelves.length - next
    if (remaining <= 0) break
    // the front wall is what the viewer sees first: center a partial row there
    const slots = slotsAlong(segment.from, segment.to, segment.wall === 'front' ? remaining : undefined)
    for (const along of slots.slice(0, remaining)) {
      const t = wallTransform(segment.wall, along, half)
      placements.push({
        shelf: shelves[next++],
        position: t.position as [number, number, number],
        rotationY: t.rotationY,
        normal: t.normal,
      })
    }
  }
  return { half, placements }
}
