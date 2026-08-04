import { Link } from 'react-router-dom'
import type { Shelf } from '../types'

export function ShelfCard({ shelf }: { shelf: Shelf }) {
  return (
    <Link
      to={`/shelves/${shelf.id}`}
      className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 active:bg-gray-50"
    >
      <span className="font-medium text-gray-900">{shelf.name}</span>
      <span className="text-gray-400">›</span>
    </Link>
  )
}
