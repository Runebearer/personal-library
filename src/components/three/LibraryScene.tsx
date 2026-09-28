import { useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LibraryThemeProvider } from '../../three/ThemeContext'
import { useCameraApproach } from '../../three/useCameraApproach'
import { CLOSE_UP_FOV, closeUpPose } from '../../three/bookcaseFraming'
import { placeBookcases, type Placement } from '../../three/libraryLayout'
import { LibraryRoom } from './LibraryRoom'
import type { Book, Shelf } from '../../types'

// Flight from the center to a bookcase's close-up, before handing over to the shelf page.
const CLOSE_UP_FLIGHT_DURATION = 1.1

function LibraryContents({
  shelves,
  booksByShelf,
  onSelectShelf,
  onExit,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  onSelectShelf: (shelf: Shelf, snapshot: string) => void
  onExit: () => void
}) {
  const { approaching, approach } = useCameraApproach()
  const { gl, scene, camera, size } = useThree()
  // once a bookcase or the door is clicked, the camera belongs to the exit animation
  const [leaving, setLeaving] = useState(false)
  const { half, placements } = useMemo(() => placeBookcases(shelves), [shelves])

  function handleSelectBookcase({ shelf, position, normal }: Placement) {
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
        onSelectShelf(shelf, gl.domElement.toDataURL('image/jpeg', 0.92))
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
        booksByShelf={booksByShelf}
        onSelectBookcase={leaving ? undefined : handleSelectBookcase}
        onExit={leaving ? undefined : handleExit}
      />

      <OrbitControls
        target={[0, 1.6, 0]}
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
  onSelectShelf,
  onExit,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  onSelectShelf: (shelf: Shelf, snapshot: string) => void
  onExit: () => void
}) {
  return (
    <div className="h-dvh w-full bg-gray-900">
      {/* preserveDrawingBuffer: the last frame is captured as a snapshot for the crossfade */}
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 1.6, 1.2], fov: 60 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <LibraryThemeProvider>
          <LibraryContents
            shelves={shelves}
            booksByShelf={booksByShelf}
            onSelectShelf={onSelectShelf}
            onExit={onExit}
          />
        </LibraryThemeProvider>
      </Canvas>
    </div>
  )
}
