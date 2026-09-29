import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useTransition } from '../../context/TransitionContext'
import { SceneReadySignal } from '../../three/SceneReadySignal'
import { LibraryThemeProvider } from '../../three/ThemeContext'
import { CLOSE_UP_FOV, closeUpDistance, closeUpPose } from '../../three/bookcaseFraming'
import {
  LIBRARY_FOV,
  LIBRARY_VIEW_CENTER,
  libraryPoseFacing,
  placeBookcases,
} from '../../three/libraryLayout'
import { useCameraApproach } from '../../three/useCameraApproach'
import { LibraryRoom } from './LibraryRoom'
import type { Book, Shelf } from '../../types'

// Closest the user can zoom in on the books.
const MIN_DISTANCE = 0.5
// How far the user may turn around the bookcase, each way.
const MAX_TURN = Math.PI / 6
// Slide from one of the shelf's bookcases to the next.
const SWITCH_DURATION = 0.7
// Zoom-out back to the library view — the library's zoom-in flight, reversed.
const EXIT_FLIGHT_DURATION = 1.1

function ShelfContents({
  shelves,
  booksByShelf,
  shelfId,
  part,
  exiting,
  onExited,
  onSelectBook,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  shelfId: string
  part: number
  exiting: boolean
  onExited: (snapshot: string) => void
  onSelectBook: (book: Book) => void
}) {
  const { camera, size, invalidate, gl, scene } = useThree()
  const { approaching, approach } = useCameraApproach()
  const aspect = size.width / size.height
  const { half, placements } = useMemo(
    () => placeBookcases(shelves, booksByShelf),
    [shelves, booksByShelf],
  )
  const placement = placements.find((p) => p.shelf.id === shelfId && p.part === part)

  // the exact pose the library's camera flies to when this bookcase is clicked
  const pose = useMemo(
    () =>
      placement && closeUpPose(new THREE.Vector3(...placement.position), placement.normal, aspect),
    [placement, aspect],
  )

  // Re-frame only when the pose really moves — not when a data update merely rebuilds the
  // same layout, which would throw away the user's zoom.
  const poseKey = pose ? [...pose.position.toArray(), ...pose.lookAt.toArray()].join(',') : ''

  // First framing (and resizes) jump straight to the pose; switching to another of the
  // shelf's bookcases slides the camera over to it instead.
  const shownPart = useRef<number | null>(null)
  useLayoutEffect(() => {
    // once leaving, the camera belongs to the zoom-out
    if (!pose || exiting) return
    if (shownPart.current !== null && shownPart.current !== part) {
      approach(pose.position, pose.lookAt, { duration: SWITCH_DURATION })
    } else {
      camera.position.copy(pose.position)
      camera.lookAt(pose.lookAt)
      invalidate()
    }
    shownPart.current = part
    // pose is tracked through poseKey
  }, [camera, poseKey, part, approach, invalidate])

  // Leaving for the library: fly back to the library view's own pose, still facing this
  // bookcase, and widen the field of view to the library's — the reverse of the zoom-in —
  // then hand over a snapshot of the final frame for a seamless crossfade.
  useLayoutEffect(() => {
    if (!exiting) return
    if (!placement) {
      onExited('')
      return
    }
    approach(libraryPoseFacing(placement.normal), LIBRARY_VIEW_CENTER, {
      fov: LIBRARY_FOV,
      duration: EXIT_FLIGHT_DURATION,
      onArrive: () => {
        gl.render(scene, camera)
        onExited(gl.domElement.toDataURL('image/jpeg', 0.92))
      },
    })
    // deliberately only when the exit starts
  }, [exiting])

  // OrbitControls azimuths are absolute, so the allowed turn is centered on the direction
  // the bookcase faces (it may stand on any wall).
  const facing = placement ? Math.atan2(placement.normal.x, placement.normal.z) : 0

  return (
    <>
      <LibraryRoom
        half={half}
        placements={placements}
        focusedShelfId={shelfId}
        onSelectBook={exiting ? undefined : onSelectBook}
      />

      {pose && (
        // look around a little and zoom in on the books, without leaving the bookcase
        <OrbitControls
          target={pose.lookAt}
          enabled={!approaching && !exiting}
          minDistance={MIN_DISTANCE}
          maxDistance={closeUpDistance(aspect)}
          minAzimuthAngle={facing - MAX_TURN}
          maxAzimuthAngle={facing + MAX_TURN}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
        />
      )}
    </>
  )
}

// 3D counterpart of the classic shelf page: a close-up of one of the shelf's bookcases
// (`part`), standing in the library room itself — the camera is placed exactly where the
// library's camera flies to, so arriving from the library is seamless. Each book of the
// shelf opens its detail sheet.
export function ShelfScene({
  shelves,
  booksByShelf,
  shelfId,
  part,
  exiting = false,
  onExited,
  onSelectBook,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  shelfId: string
  part: number
  // set to true to play the zoom-out back to the library; onExited then gets the snapshot
  // of its last frame ('' if it couldn't play)
  exiting?: boolean
  onExited: (snapshot: string) => void
  onSelectBook: (book: Book) => void
}) {
  const { notifySceneReady } = useTransition()

  return (
    <div className="h-dvh w-full bg-gray-900">
      {/* preserveDrawingBuffer: the last frame is captured as a snapshot for the crossfade */}
      <Canvas
        frameloop="demand"
        camera={{ fov: CLOSE_UP_FOV }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <SceneReadySignal onReady={notifySceneReady} />
        <LibraryThemeProvider>
          <ShelfContents
            shelves={shelves}
            booksByShelf={booksByShelf}
            shelfId={shelfId}
            part={part}
            exiting={exiting}
            onExited={onExited}
            onSelectBook={onSelectBook}
          />
        </LibraryThemeProvider>
      </Canvas>
    </div>
  )
}
