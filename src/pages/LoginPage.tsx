import { useViewMode } from '../context/ViewModeContext'
import { ClassicLoginForm } from './login/ClassicLoginForm'
import { AltLoginForm } from './login/AltLoginForm'

export function LoginPage() {
  const { viewMode, setViewMode } = useViewMode()

  function toggleStyle() {
    setViewMode(viewMode === 'classic' ? '3d' : 'classic')
  }

  const toggleButtonClass =
    viewMode === 'classic'
      ? 'fixed right-4 top-4 z-10 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow ring-1 ring-gray-200'
      : 'fixed right-4 top-4 z-10 rounded-full border border-[#6b4226] bg-[#3d2817] px-3 py-1.5 text-xs font-medium text-[#ede4d3] shadow'

  const toggle = (
    <button type="button" onClick={toggleStyle} className={toggleButtonClass}>
      {viewMode === 'classic' ? 'Style bibliothèque' : 'Style classique'}
    </button>
  )

  return viewMode === 'classic' ? (
    <ClassicLoginForm toggle={toggle} />
  ) : (
    <AltLoginForm toggle={toggle} />
  )
}
