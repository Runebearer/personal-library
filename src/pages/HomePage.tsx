import { useViewMode } from '../context/ViewModeContext'
import { HomeClassic } from './home/HomeClassic'
import { Home3D } from './home/Home3D'

export function HomePage() {
  const { viewMode } = useViewMode()
  return viewMode === '3d' ? <Home3D /> : <HomeClassic />
}
