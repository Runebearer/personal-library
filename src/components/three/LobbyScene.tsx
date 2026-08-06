import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { LibraryThemeProvider } from '../../three/ThemeContext'
import { useLibraryTheme } from '../../three/ThemeContext'
import { Room } from './Room'
import { Desk } from './Desk'
import { Door } from './Door'

const ROOM_SIZE = 6
const ROOM_HEIGHT = 3

function LobbyContents({
  onEnterLibrary,
  onLogout,
}: {
  onEnterLibrary: () => void
  onLogout: () => void
}) {
  const theme = useLibraryTheme()
  const half = ROOM_SIZE / 2

  return (
    <>
      <ambientLight intensity={theme.ambientIntensity} />
      <pointLight position={[0, ROOM_HEIGHT - 0.3, 0]} intensity={0.8} />

      <Room size={ROOM_SIZE} height={ROOM_HEIGHT} />

      {/* desk on the left wall */}
      <Desk position={[-half + 0.9, 0, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* door in front of the user: enters the library */}
      <Door position={[0, 0, -half]} label="La bibliothèque" onSelect={onEnterLibrary} />

      {/* door behind the user: logout */}
      <Door
        position={[0, 0, half]}
        rotation={[0, Math.PI, 0]}
        label="Déconnexion"
        onSelect={onLogout}
      />

      <OrbitControls
        target={[0, 1.6, 0]}
        enablePan={false}
        enableZoom={false}
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
