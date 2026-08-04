import { RatingStars } from './RatingStars'
import type { Book } from '../types'

export function BookCard({
  book,
  onClick,
  onDelete,
}: {
  book: Book
  onClick?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 flex-col text-left"
        disabled={!onClick}
      >
        <div className="aspect-[2/3] w-full bg-gray-100">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">
              📖
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          <p className="line-clamp-2 text-sm font-medium text-gray-900">{book.title}</p>
          <p className="line-clamp-1 text-xs text-gray-500">{book.authors.join(', ')}</p>
          {book.genre && (
            <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              {book.genre}
            </span>
          )}
          <RatingStars rating={book.rating} size="sm" />
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer le livre"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white"
        >
          ×
        </button>
      )}
    </div>
  )
}
