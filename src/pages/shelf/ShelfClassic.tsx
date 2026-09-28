import { BookCard } from '../../components/BookCard'
import type { BookGroup } from '../../hooks/useShelfBooks'
import type { Book } from '../../types'

export function ShelfClassic({
  groups,
  onSelectBook,
  onDeleteBook,
}: {
  groups: BookGroup[]
  onSelectBook: (book: Book) => void
  onDeleteBook: (book: Book) => void
}) {
  return (
    <div className="flex flex-col gap-4 px-4">
      {groups.map((group) => (
        <div key={group.heading ?? '_'} className="flex flex-col gap-2">
          {group.heading && <h2 className="text-sm font-medium text-gray-500">{group.heading}</h2>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => onSelectBook(book)}
                onDelete={() => onDeleteBook(book)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
