import { useState } from 'react'
import { RatingStars } from './RatingStars'
import { GENRE_LIST } from '../lib/genre'
import type { BookMetadata } from '../types'

export function BookDetailModal({
  metadata,
  confirmLabel,
  onConfirm,
  onClose,
  onMoveToShelf,
}: {
  metadata: BookMetadata
  confirmLabel: string
  onConfirm: (metadata: BookMetadata) => void
  onClose: () => void
  onMoveToShelf?: () => void
}) {
  const [title, setTitle] = useState(metadata.title)
  const [showSubtitle, setShowSubtitle] = useState(Boolean(metadata.subtitle))
  const [subtitle, setSubtitle] = useState(metadata.subtitle ?? '')
  const [showTome, setShowTome] = useState(Boolean(metadata.tome))
  const [tome, setTome] = useState(metadata.tome ?? '')
  const [authors, setAuthors] = useState(metadata.authors.length > 0 ? metadata.authors : [''])
  const [genre, setGenre] = useState(metadata.genre ?? '')
  const [synopsis, setSynopsis] = useState(metadata.synopsis ?? '')
  const [rating, setRating] = useState(metadata.rating)
  const [error, setError] = useState<string | null>(null)

  function handleAuthorChange(index: number, value: string) {
    setAuthors((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  function handleAddAuthor() {
    setAuthors((prev) => [...prev, ''])
  }

  function handleRemoveAuthor(index: number) {
    setAuthors((prev) => prev.filter((_, i) => i !== index))
  }

  function handleConfirm() {
    const trimmedTitle = title.trim()
    const authorsList = authors.map((a) => a.trim()).filter(Boolean)

    if (!trimmedTitle || authorsList.length === 0 || !genre) {
      setError("Le titre, l'auteur et le genre sont obligatoires.")
      return
    }

    onConfirm({
      ...metadata,
      title: trimmedTitle,
      subtitle: subtitle.trim() || null,
      tome: tome.trim() || null,
      authors: authorsList,
      genre,
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
              placeholder="Titre du livre *"
              className="rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-900"
            />

            {showSubtitle ? (
              <input
                type="text"
                autoFocus
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Sous-titre"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowSubtitle(true)}
                className="self-start text-sm text-gray-500"
              >
                + Sous-titre
              </button>
            )}

            {showTome ? (
              <input
                type="text"
                autoFocus
                value={tome}
                onChange={(e) => setTome(e.target.value)}
                placeholder="Tome (ex. 3)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowTome(true)}
                className="self-start text-sm text-gray-500"
              >
                + Tome
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">Auteur(s) *</span>
          {authors.map((author, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={author}
                onChange={(e) => handleAuthorChange(index, e.target.value)}
                placeholder={`Auteur ${index + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveAuthor(index)}
                  className="px-2 text-gray-400"
                  aria-label={`Retirer l'auteur ${index + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAuthor}
            className="self-start text-sm text-gray-500"
          >
            + Auteur
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Genre *
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            <option value="">Choisir un genre</option>
            {GENRE_LIST.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-lg bg-gray-900 py-2 text-white"
        >
          {confirmLabel}
        </button>
        {onMoveToShelf && (
          <button
            type="button"
            onClick={onMoveToShelf}
            className="rounded-lg py-2 text-gray-600 ring-1 ring-gray-200"
          >
            Changer d'étagère
          </button>
        )}
        <button type="button" onClick={onClose} className="rounded-lg py-2 text-gray-500">
          Annuler
        </button>
      </div>
    </div>
  )
}
