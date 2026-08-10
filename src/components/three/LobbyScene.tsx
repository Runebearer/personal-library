import { useCallback, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LibraryThemeProvider } from '../../three/ThemeContext'
import { useLibraryTheme } from '../../three/ThemeContext'
import { Room } from './Room'
import { Desk } from './Desk'
import { Door } from './Door'
import { Fireplace } from './Fireplace'

const ROOM_SIZE = 6
const ROOM_HEIGHT = 3
const APPROACH_DURATION = 0.6 // seconds to walk up to the door

function LobbyContents({
  onEnterLibrary,
  onLogout,
}: {
  onEnterLibrary: () => void
  onLogout: () => void
}) {
  const theme = useLibraryTheme()
  const half = ROOM_SIZE / 2
  const { camera, invalidate } = useThree()

  const [approaching, setApproaching] = useState(false)
  const startPos = useRef(new THREE.Vector3())
  const targetPos = useRef(new THREE.Vector3(0, 1.55, -half + 0.55))
  const progress = useRef(0)

  const beginApproach = useCallback(() => {
    startPos.current.copy(camera.position)
    progress.current = 0
    setApproaching(true)
    invalidate()
  }, [camera, invalidate])

  useFrame((_, delta) => {
    if (!approaching) return

    progress.current = Math.min(1, progress.current + delta / APPROACH_DURATION)
    const eased = 1 - Math.pow(1 - progress.current, 3)
    camera.position.lerpVectors(startPos.current, targetPos.current, eased)

    if (progress.current < 1) {
      invalidate()
    } else {
      setApproaching(false)
    }
  })

  return (
    <>
      <ambientLight intensity={theme.ambientIntensity} />
      <pointLight position={[0, ROOM_HEIGHT - 0.3, 0]} intensity={0.8} />

      <Room size={ROOM_SIZE} height={ROOM_HEIGHT} />

      {/* desk on the left wall */}
      <Desk position={[-half + 0.9, 0, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* door in front of the user: enters the library */}
      <Door
        position={[0, 0, -half]}
        label="La bibliothèque"
        onSelect={() => {
          beginApproach()
          onEnterLibrary()
        }}
      />

      {/* door behind the user: logout */}
      <Door
        position={[0, 0, half]}
        rotation={[0, Math.PI, 0]}
        label="Déconnexion"
        onSelect={onLogout}
      />

      {/* fireplace in the corner right of the library door */}
      <Fireplace position={[half - 0.9, 0, -half + 0.35]} />

      <OrbitControls
        target={[0, 1.6, 0]}
        enablePan={false}
        enableZoom={false}
        enabled={!approaching}
        rotateSpeed={-1}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.7}
      />
    </>
  )
}

export function LobbyScene({
  onEnterLibrary,
  onLogout,
}: {
  onEnterLibrary: () => void
  onLogout: () => void
}) {
  return (
    <div className="h-dvh w-full bg-gray-900">
      <Canvas frameloop="demand" camera={{ position: [0, 1.6, 1.2], fov: 60 }}>
        <LibraryThemeProvider>
          <LobbyContents onEnterLibrary={onEnterLibrary} onLogout={onLogout} />
        </LibraryThemeProvider>
      </Canvas>
    </div>
  )
}
