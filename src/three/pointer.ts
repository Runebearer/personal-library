import type { ThreeEvent } from '@react-three/fiber'

// Pixels the pointer may move between press and release and still count as a click.
const CLICK_MAX_DRAG_PX = 5

// R3F fires onClick whenever press and release land on the same object — including at the
// end of a drag that turned the camera. Clickable scene objects (doors, books, bookcases)
// ignore those so looking around never triggers a navigation.
export function isDragRelease(e: ThreeEvent<MouseEvent>) {
  return e.delta > CLICK_MAX_DRAG_PX
}
