import { useLayoutEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LibraryThemeProvider } from '../../three/ThemeContext'
import { CLOSE_UP_FOV, closeUpDistance, closeUpPose } from '../../three/bookcaseFraming'
import { placeBookcases } from '../../three/libraryLayout'
import { LibraryRoom } from './LibraryRoom'
import type { Book, Shelf } from '../../types'

// Closest the user can zoom in on the books.
const MIN_DISTANCE = 0.5
// How far the user may turn around the bookcase, each way.
const MAX_TURN = Math.PI / 6

function ShelfContents({
  shelves,
  booksByShelf,
  shelfId,
  onSelectBook,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  shelfId: string
  onSelectBook: (book: Book) => void
}) {
  const { camera, size, invalidate } = useThree()
  const aspect = size.width / size.height
  const { half, placements } = useMemo(() => placeBookcases(shelves), [shelves])
  const placement = placements.find((p) => p.shelf.id === shelfId)

  // the exact pose the library's camera flies to when this bookcase is clicked
  const pose = useMemo(
    () =>
      placement && closeUpPose(new THREE.Vector3(...placement.position), placement.normal, aspect),
    [placement, aspect],
  )

  useLayoutEffect(() => {
    if (!pose) return
    camera.position.copy(pose.position)
    camera.lookAt(pose.lookAt)
    invalidate()
  }, [camera, pose, invalidate])

  // OrbitControls azimuths are absolute, so the allowed turn is centered on the direction
  // the bookcase faces (it may stand on any wall).
  const facing = placement ? Math.atan2(placement.normal.x, placement.normal.z) : 0

  return (
    <>
      <LibraryRoom
        half={half}
        placements={placements}
        booksByShelf={booksByShelf}
        focusedShelfId={shelfId}
        onSelectBook={onSelectBook}
      />

      {pose && (
        // look around a little and zoom in on the books, without leaving the bookcase
        <OrbitControls
          target={pose.lookAt}
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

// 3D counterpart of the classic shelf page: a close-up of the shelf's bookcase, standing in
// the library room itself — the camera is placed exactly where the library's camera flies
// to, so arriving from the library is seamless. Each book of the shelf opens its detail
// sheet.
export function ShelfScene({
  shelves,
  booksByShelf,
  shelfId,
  onSelectBook,
}: {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  shelfId: string
  onSelectBook: (book: Book) => void
}) {
  return (
    <div className="h-dvh w-full bg-gray-900">
      <Canvas frameloop="demand" camera={{ fov: CLOSE_UP_FOV }}>
        <LibraryThemeProvider>
          <ShelfContents
            shelves={shelves}
            booksByShelf={booksByShelf}
            shelfId={shelfId}
            onSelectBook={onSelectBook}
          />
        </LibraryThemeProvider>
      </Canvas>
    </div>
  )
}
