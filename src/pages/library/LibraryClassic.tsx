import { Link } from 'react-router-dom'
import { ShelfManager } from '../../components/ShelfManager'
import { ViewModeToggle } from '../../components/ViewModeToggle'

export function LibraryClassic() {
  return (
    <div className="min-h-dvh bg-gray-50 pb-8">
      <header className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-500">
            ‹
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Mes étagères</h1>
        </div>
        <ViewModeToggle />
      </header>

      <div className="px-4">
        <ShelfManager />
      </div>
    </div>
  )
}
