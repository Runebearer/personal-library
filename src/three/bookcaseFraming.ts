import * as THREE from 'three'
import { BOOKCASE_TOTAL_HEIGHT, BOOKCASE_WIDTH } from '../components/three/Bookcase'

// The shelf close-up's camera framing. Shared by the close-up scene itself and by the
// library room, whose camera flies to exactly this pose before handing over to it, so the
// switch between the two scenes is seamless.
export const CLOSE_UP_FOV = 50
// Empty space kept around the bookcase when framing it.
const FRAME_MARGIN = 0.35

// Distance from the bookcase's front at which all of it (name label included) fits the
// screen, whichever of its height or width is the tighter fit for the aspect ratio.
export function closeUpDistance(aspect: number) {
  const tan = Math.tan(THREE.MathUtils.degToRad(CLOSE_UP_FOV / 2))
  const byHeight = (BOOKCASE_TOTAL_HEIGHT + FRAME_MARGIN) / 2 / tan
  const byWidth = (BOOKCASE_WIDTH + FRAME_MARGIN) / 2 / (tan * aspect)
  return Math.max(byHeight, byWidth)
}

// Camera pose for the close-up of a bookcase standing at `position` (center of its
// footprint) and facing `normal`.
export function closeUpPose(
  position: THREE.Vector3,
  normal: THREE.Vector3,
  aspect: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const lookAt = position.clone().setY(BOOKCASE_TOTAL_HEIGHT / 2)
  return {
    lookAt,
    position: lookAt.clone().addScaledVector(normal, closeUpDistance(aspect)),
  }
}
