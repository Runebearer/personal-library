import { useLayoutEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useTransition } from '../../context/TransitionContext'
import { SceneReadySignal } from '../../three/SceneReadySignal'
import { LibraryThemeProvider } from '../../three/ThemeContext'
import { SeriesProvider } from '../../three/SeriesContext'
import { useSeries } from '../../hooks/useSeries'
import { useCameraApproach } from '../../three/useCameraApproach'
import { CLOSE_UP_FOV, closeUpPose } from '../../three/bookcaseFraming'
import {
  LIBRARY_FOV,
  LIBRARY_VIEW_CENTER,
  LIBRARY_VIEW_RADIUS,
  libraryPoseFacing,
  placeBookcases,
  type Placement,
} from '../../three/libraryLayout'
import { LibraryRoom } from './LibraryRoom'
import type { Book, Shelf } from '../../types'

// Flight from the center to a bookcase's close-up, before handing over to the shelf page.
const CLOSE_UP_FLIGHT_DURATION = 1.1

// A bookcase of the room, identified by its shelf and its index among the shelf's bookcases.
export type BookcaseRef = { shelfId: string; part: number }

function LibraryContents({
  shelves,
  booksByShelf,
  returningFrom,
  onSelectShelf,
  onExit,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  returningFrom?: BookcaseRef
  onSelectShelf: (shelf: Shelf, part: number, snapshot: string) => void
  onExit: () => void
}) {
  const { approaching, approach } = useCameraApproach()
  const { gl, scene, camera, size } = useThree()
  // once a bookcase or the door is clicked, the camera belongs to the exit animation
  const [leaving, setLeaving] = useState(false)
  const { half, placements } = useMemo(
    () => placeBookcases(shelves, booksByShelf),
    [shelves, booksByShelf],
  )

  // Coming back from a bookcase's close-up: start out looking at that bookcase, where the
  // close-up's zoom-out animation ended, so the handover is seamless.
  useLayoutEffect(() => {
    const from =
      returningFrom &&
      placements.find((p) => p.shelf.id === returningFrom.shelfId && p.part === returningFrom.part)
    if (from) {
      camera.position.copy(libraryPoseFacing(from.normal))
      camera.lookAt(LIBRARY_VIEW_CENTER)
    }
    // deliberately only on arrival: later data updates must not turn the user's head
  }, [])

  function handleSelectBookcase({ shelf, part, position, normal }: Placement) {
    if (leaving) return
    setLeaving(true)
    // fly to exactly the shelf page's close-up framing (position, angle and field of view),
    // then hand over a snapshot of the final frame so the page switch is seamless
    const pose = closeUpPose(new THREE.Vector3(...position), normal, size.width / size.height)
    approach(pose.position, pose.lookAt, {
      fov: CLOSE_UP_FOV,
      duration: CLOSE_UP_FLIGHT_DURATION,
      onArrive: () => {
        gl.render(scene, camera)
        onSelectShelf(shelf, part, gl.domElement.toDataURL('image/jpeg', 0.92))
      },
    })
  }

  function handleExit() {
    if (leaving) return
    setLeaving(true)
    approach(new THREE.Vector3(0, 1.55, half - 0.55))
    onExit()
  }

  return (
    <>
      <LibraryRoom
        half={half}
        placements={placements}
        onSelectBookcase={leaving ? undefined : handleSelectBookcase}
        onExit={leaving ? undefined : handleExit}
      />

      <OrbitControls
        target={LIBRARY_VIEW_CENTER}
        enablePan={false}
        enableZoom={false}
        enabled={!approaching && !leaving}
        rotateSpeed={-1}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.7}
      />
    </>
  )
}

// The 3D counterpart of the classic shelves list: one bookcase per shelf, holding its
// books. Same fixed-camera, turn-your-head controls as the lobby.
export function LibraryScene({
  shelves,
  booksByShelf,
  returningFrom,
  onSelectShelf,
  onExit,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  returningFrom?: BookcaseRef
  onSelectShelf: (shelf: Shelf, part: number, snapshot: string) => void
  onExit: () => void
}) {
  const { notifySceneReady } = useTransition()
  const { series } = useSeries()

  return (
    <div className="h-dvh w-full bg-gray-900">
      {/* preserveDrawingBuffer: the last frame is captured as a snapshot for the crossfade */}
      <Canvas
        frameloop="demand"
        camera={{
          position: [LIBRARY_VIEW_CENTER.x, LIBRARY_VIEW_CENTER.y, LIBRARY_VIEW_RADIUS],
          fov: LIBRARY_FOV,
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <SceneReadySignal onReady={notifySceneReady} />
        <LibraryThemeProvider>
          <SeriesProvider series={series}>
            <LibraryContents
              shelves={shelves}
              booksByShelf={booksByShelf}
              returningFrom={returningFrom}
              onSelectShelf={onSelectShelf}
              onExit={onExit}
            />
          </SeriesProvider>
        </LibraryThemeProvider>
      </Canvas>
    </div>
  )
}
