import { useState } from 'react'
import { RatingStars } from './RatingStars'
import type { BookMetadata } from '../types'

export function BookDetailModal({
  metadata,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  metadata: BookMetadata
  confirmLabel: string
  onConfirm: (metadata: BookMetadata) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(metadata.title)
  const [authors, setAuthors] = useState(metadata.authors.join(', '))
  const [genre, setGenre] = useState(metadata.genre ?? '')
  const [synopsis, setSynopsis] = useState(metadata.synopsis ?? '')
  const [rating, setRating] = useState(metadata.rating)

  function handleConfirm() {
    onConfirm({
      ...metadata,
      title: title.trim() || 'Titre inconnu',
      authors: authors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      genre: genre.trim() || null,
      synopsis: synopsis.trim() || null,
      rating,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <div className="flex max-h-[90vh] w-full flex-col gap-3 overflow-y-auto rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl">
        <div className="flex gap-3">
          <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {metadata.coverUrl && (
              <img
                src={metadata.coverUrl}
                alt={metadata.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du livre"
              className="rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-900"
            />
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Auteur(s), séparés par une virgule"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500"
            />
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Genre
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Ex. Science-fiction"
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Synopsis
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="Optionnel"
            rows={3}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <div className="flex flex-col gap-1 text-sm text-gray-600">
          Ma note
          <RatingStars rating={rating} onChange={setRating} />
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-lg bg-gray-900 py-2 text-white"
        >
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg py-2 text-gray-500">
          Annuler
        </button>
      </div>
    </div>
  )
}
