import { useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Book } from '../types'

const BOOK_WIDTH = 0.9
const BOOK_HEIGHT = 1.3
const BOOK_DEPTH = 0.15
const GAP = 0.15

function useCoverTexture(url: string | null) {
  const { invalidate } = useThree()
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    setTexture(null)
    if (!url) return

    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(url, (tex) => {
      if (cancelled) return
      tex.colorSpace = THREE.SRGBColorSpace
      setTexture(tex)
      invalidate()
    })

    return () => {
      cancelled = true
    }
  }, [url, invalidate])

  return texture
}

function BookMesh({ book, x, onSelect }: { book: Book; x: number; onSelect: (book: Book) => void }) {
  const texture = useCoverTexture(book.coverUrl)

  const materials = useMemo(() => {
    const spine = new THREE.MeshStandardMaterial({ color: '#d1d5db' })
    const cover = new THREE.MeshStandardMaterial({
      color: texture ? '#ffffff' : '#9ca3af',
      map: texture ?? undefined,
    })
    // Box face order: +x, -x, +y, -y, +z (front), -z
    return [spine, spine, spine, spine, cover, spine]
  }, [texture])

  return (
    <mesh
      position={[x, BOOK_HEIGHT / 2, 0]}
      material={materials}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(book)
      }}
    >
      <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
    </mesh>
  )
}

export function Shelf3D({
  books,
  onSelectBook,
}: {
  books: Book[]
  onSelectBook: (book: Book) => void
}) {
  const totalWidth = books.length * (BOOK_WIDTH + GAP)
  const plankWidth = Math.max(totalWidth + 1, 3)

  return (
    <div className="h-[65vh] w-full overflow-hidden rounded-xl bg-gradient-to-b from-gray-100 to-gray-200">
      <Canvas frameloop="demand" camera={{ position: [0, 1.6, 4], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 5]} intensity={0.8} />

        <group position={[-totalWidth / 2 + (BOOK_WIDTH + GAP) / 2, 0, 0]}>
          {books.map((book, i) => (
            <BookMesh key={book.id} book={book} x={i * (BOOK_WIDTH + GAP)} onSelect={onSelectBook} />
          ))}
        </group>

        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[plankWidth, 0.06, 0.6]} />
          <meshStandardMaterial color="#a16207" />
        </mesh>

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  )
}
