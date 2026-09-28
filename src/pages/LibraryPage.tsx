import { useViewMode } from '../context/ViewModeContext'
import { LibraryClassic } from './library/LibraryClassic'

export function LibraryPage() {
  const { viewMode } = useViewMode()
  // TODO: the 3D library room (one bookcase per shelf) isn't built yet — until it is, the
  // 3D mode falls back to the classic view.
  return viewMode === '3d' ? <LibraryClassic /> : <LibraryClassic />
}
