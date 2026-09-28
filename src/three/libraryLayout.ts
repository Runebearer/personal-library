import * as THREE from 'three'
import { BOOKCASE_DEPTH, BOOKCASE_WIDTH, splitIntoBookcases } from './bookcaseLayout'
import type { Book, Shelf } from '../types'

export const ROOM_HEIGHT = 3

// The library view's camera: it turns around LIBRARY_VIEW_CENTER at LIBRARY_VIEW_RADIUS (with
// inverted controls, so it feels like turning one's head from the center of the room).
export const LIBRARY_FOV = 60
export const LIBRARY_VIEW_CENTER = new THREE.Vector3(0, 1.6, 0)
export const LIBRARY_VIEW_RADIUS = 1.2

// Library camera pose looking straight at a bookcase facing `normal` — where the camera
// starts when coming back from that bookcase's close-up.
export function libraryPoseFacing(normal: THREE.Vector3) {
  return LIBRARY_VIEW_CENTER.clone().addScaledVector(normal, LIBRARY_VIEW_RADIUS)
}
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

// One bookcase in the room. A shelf with more books than one bookcase holds gets several,
// side by side: `part` is this one's index among the shelf's `partCount` bookcases, and
// `books` the ones it holds.
export type Placement = {
  shelf: Shelf
  part: number
  partCount: number
  books: Book[]
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

type Unit = { group: number; part: number }

// Distributes the groups of bookcases (one group per shelf, `sizes[i]` bookcases each) over
// the wall segments in order, keeping each group on a single segment when it fits there.
// Returns the units assigned to each segment, or null if the room is too small.
function assignToWalls(sizes: number[], half: number): Unit[][] | null {
  const segments = wallSegments(half)
  const capacities = segments.map((seg) => slotsAlong(seg.from, seg.to).length)
  const used: Unit[][] = segments.map(() => [])
  let s = 0

  for (let group = 0; group < sizes.length; group++) {
    const size = sizes[group]
    // move on to the next segment if the whole group doesn't fit in what's left of this
    // one — unless this segment is empty and the group is bigger than it anyway, in which
    // case it starts here and spills over
    while (
      s < segments.length &&
      capacities[s] - used[s].length < size &&
      !(used[s].length === 0 && size > capacities[s])
    ) {
      s++
    }
    for (let part = 0; part < size; part++) {
      while (s < segments.length && used[s].length >= capacities[s]) s++
      if (s >= segments.length) return null
      used[s].push({ group, part })
    }
  }
  return used
}

// Where every bookcase stands in the library room, and the room's half-size. Deterministic
// for given shelves and books, so the shelf close-up can rebuild the exact same room around
// its bookcase.
export function placeBookcases(shelves: Shelf[], booksByShelf: Record<string, Book[]>) {
  const split = shelves.map((shelf) => splitIntoBookcases(booksByShelf[shelf.id] ?? []))
  const sizes = split.map((bookcases) => bookcases.length)

  let half = MIN_HALF
  let assignment = assignToWalls(sizes, half)
  while (!assignment) {
    half += HALF_STEP
    assignment = assignToWalls(sizes, half)
  }

  const placements: Placement[] = []
  wallSegments(half).forEach((segment, i) => {
    const units = assignment[i]
    if (units.length === 0) return
    // the front wall is what the viewer sees first: center a partial row there
    const slots =
      segment.wall === 'front'
        ? slotsAlong(segment.from, segment.to, units.length)
        : slotsAlong(segment.from, segment.to)
    units.forEach(({ group, part }, j) => {
      const t = wallTransform(segment.wall, slots[j], half)
      placements.push({
        shelf: shelves[group],
        part,
        partCount: sizes[group],
        books: split[group][part],
        position: t.position as [number, number, number],
        rotationY: t.rotationY,
        normal: t.normal,
      })
    })
  })
  return { half, placements }
}
