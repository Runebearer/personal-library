import { useViewMode } from '../context/ViewModeContext'
import { LibraryClassic } from './library/LibraryClassic'
import { Library3D } from './library/Library3D'

export function LibraryPage() {
  const { viewMode } = useViewMode()
  return viewMode === '3d' ? <Library3D /> : <LibraryClassic />
}
