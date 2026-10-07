import { useRef, useState } from 'react'
import { RatingStars } from './RatingStars'
import { GENRE_LIST } from '../lib/genre'
import { formatIsbn } from '../lib/openLibrary'
import { useSeries } from '../hooks/useSeries'
import { ColorWheel } from './ColorWheel'
import type { BookMetadata } from '../types'

// Value of the series <select> meaning "create a new series with the typed name".
const NEW_SERIES = '__new__'

export function BookDetailModal({
  metadata,
  confirmLabel,
  onConfirm,
  onClose,
  onMoveToShelf,
  onDelete,
}: {
  metadata: BookMetadata
  confirmLabel: string
  onConfirm: (metadata: BookMetadata) => void
  onClose: () => void
  onMoveToShelf?: () => void
  onDelete?: () => void | Promise<void>
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [title, setTitle] = useState(metadata.title)
  const [showSubtitle, setShowSubtitle] = useState(Boolean(metadata.subtitle))
  const [subtitle, setSubtitle] = useState(metadata.subtitle ?? '')
  const [showTome, setShowTome] = useState(Boolean(metadata.tome))
  const [tome, setTome] = useState(metadata.tome ?? '')
  const { series, findOrCreate, setColor, rename } = useSeries()
  const [showSeries, setShowSeries] = useState(Boolean(metadata.seriesId))
  // '' = no series, NEW_SERIES = create one named newSeriesName, otherwise an existing id
  const [seriesChoice, setSeriesChoice] = useState(metadata.seriesId ?? '')
  const [seriesMenuOpen, setSeriesMenuOpen] = useState(false)
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const seriesLabel =
    seriesChoice === NEW_SERIES
      ? '+ Nouvelle série…'
      : seriesChoice
        ? (series.find((s) => s.id === seriesChoice)?.name ?? '…')
        : 'Aucune série'
  const [newSeriesName, setNewSeriesName] = useState('')
  // The series' spine color: undefined = untouched (the series' saved one applies), null =
  // back to the theme's colors, otherwise the picked #rrggbb.
  const [colorEdit, setColorEdit] = useState<string | null | undefined>(undefined)
  const [showWheel, setShowWheel] = useState(false)
  const savedColor = series.find((s) => s.id === seriesChoice)?.color ?? null
  const seriesColor = colorEdit !== undefined ? colorEdit : savedColor
  const [saving, setSaving] = useState(false)
  const [authors, setAuthors] = useState(metadata.authors.length > 0 ? metadata.authors : [''])
  const [genre, setGenre] = useState(metadata.genre ?? '')
  const [synopsis, setSynopsis] = useState(metadata.synopsis ?? '')
  const [rating, setRating] = useState(metadata.rating)
  const [error, setError] = useState<string | null>(null)
  const pressedBackdrop = useRef(false)

  function handleAuthorChange(index: number, value: string) {
    setAuthors((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  function handleAddAuthor() {
    setAuthors((prev) => [...prev, ''])
  }

  function handleRemoveAuthor(index: number) {
    setAuthors((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSeriesChange(value: string) {
    setSeriesChoice(value)
    setColorEdit(undefined)
    setShowWheel(false)
    // a book in a series usually has a volume number: offer the field right away
    if (value && value !== NEW_SERIES) setShowTome(true)
  }

  function chooseSeries(value: string) {
    setSeriesMenuOpen(false)
    setEditingSeriesId(null)
    handleSeriesChange(value)
  }

  function startRename(id: string, name: string) {
    setSeriesMenuOpen(false)
    setEditingSeriesId(id)
    setEditName(name)
    setError(null)
  }

  async function handleRenameSeries() {
    const name = editName.trim()
    if (!editingSeriesId) return
    if (!name) {
      setError('Le nom de la série ne peut pas être vide.')
      return
    }
    const clash = series.some(
      (s) => s.id !== editingSeriesId && s.name.trim().toLowerCase() === name.toLowerCase(),
    )
    if (clash) {
      setError('Une série porte déjà ce nom.')
      return
    }
    setRenaming(true)
    try {
      await rename(editingSeriesId, name)
      setEditingSeriesId(null)
      setError(null)
    } catch {
      setError('Impossible de renommer la série. Réessaie plus tard.')
    }
    setRenaming(false)
  }

  // The series id to save: the chosen one, or a newly created series (reusing an existing
  // one with the same name rather than duplicating it).
  async function resolveSeriesId(): Promise<string | null> {
    if (seriesChoice !== NEW_SERIES) return seriesChoice || null
    return findOrCreate(newSeriesName)
  }

  async function handleConfirm() {
    const trimmedTitle = title.trim()
    const authorsList = authors.map((a) => a.trim()).filter(Boolean)

    if (!trimmedTitle || authorsList.length === 0 || !genre) {
      setError("Le titre, l'auteur et le genre sont obligatoires.")
      return
    }
    if (seriesChoice === NEW_SERIES && !newSeriesName.trim()) {
      setError('Donne un nom à la nouvelle série.')
      return
    }

    setSaving(true)
    let seriesId: string | null
    try {
      seriesId = await resolveSeriesId()
    } catch {
      setError('Impossible de créer la série. Réessaie plus tard.')
      setSaving(false)
      return
    }
    try {
      if (seriesId && colorEdit !== undefined) await setColor(seriesId, colorEdit)
    } catch {
      setError("Impossible d'enregistrer la couleur de la série. Réessaie plus tard.")
      setSaving(false)
      return
    }
    setSaving(false)

    onConfirm({
      ...metadata,
      title: trimmedTitle,
      subtitle: subtitle.trim() || null,
      tome: tome.trim() || null,
      seriesId,
      authors: authorsList,
      genre,
      synopsis: synopsis.trim() || null,
      rating,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center"
      // a click on the dimmed backdrop closes the sheet; the press must also start there, so
      // dragging a text selection out of a field doesn't dismiss it
      onPointerDown={(e) => (pressedBackdrop.current = e.target === e.currentTarget)}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full flex-col gap-3 overflow-y-auto rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl">
        <p className="font-mono text-xs text-gray-500">ISBN {formatIsbn(metadata.isbn)}</p>
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

        {showSeries ? (
          <div className="flex flex-col gap-2">
            <div className="relative flex flex-col gap-1 text-sm text-gray-600">
              Série
              <button
                type="button"
                onClick={() => setSeriesMenuOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={seriesMenuOpen}
                className="flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-gray-900"
              >
                <span className="truncate">{seriesLabel}</span>
                <span aria-hidden className="text-gray-400">▾</span>
              </button>
              {seriesMenuOpen && (
                <ul
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-300 bg-white py-1 text-gray-900 shadow-lg"
                >
                  <li>
                    <button
                      type="button"
                      onClick={() => chooseSeries('')}
                      className="w-full px-3 py-2 text-left"
                    >
                      Aucune série
                    </button>
                  </li>
                  {series.map((s) => (
                    <li key={s.id} className="flex items-center">
                      <button
                        type="button"
                        role="option"
                        aria-selected={s.id === seriesChoice}
                        onClick={() => chooseSeries(s.id)}
                        className={`min-w-0 flex-1 truncate px-3 py-2 text-left ${
                          s.id === seriesChoice ? 'font-medium' : ''
                        }`}
                      >
                        {s.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => startRename(s.id, s.name)}
                        aria-label={`Modifier la série ${s.name}`}
                        className="px-3 py-2 text-gray-400 hover:text-gray-700"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => chooseSeries(NEW_SERIES)}
                      className="w-full px-3 py-2 text-left"
                    >
                      + Nouvelle série…
                    </button>
                  </li>
                </ul>
              )}
            </div>
            {editingSeriesId && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nom de la série"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSeriesId(null)}
                    disabled={renaming}
                    className="rounded-lg py-2 text-gray-500 ring-1 ring-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleRenameSeries}
                    disabled={renaming}
                    className="rounded-lg bg-gray-900 py-2 text-white disabled:opacity-60"
                  >
                    {renaming ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
            {seriesChoice === NEW_SERIES && (
              <input
                type="text"
                autoFocus
                value={newSeriesName}
                onChange={(e) => setNewSeriesName(e.target.value)}
                placeholder="Nom de la nouvelle série"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            )}
            {seriesChoice && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => setShowWheel((open) => !open)}
                    aria-label="Choisir la couleur de la série"
                    className="h-8 w-8 rounded-full ring-1 ring-gray-300"
                    style={{
                      background:
                        seriesColor ??
                        'conic-gradient(from 90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                    }}
                  />
                  <span>{seriesColor ? `Couleur de la série ${seriesColor}` : 'Couleur de la série'}</span>
                  {seriesColor && (
                    <button
                      type="button"
                      onClick={() => {
                        setColorEdit(null)
                        setShowWheel(false)
                      }}
                      className="ml-auto text-gray-500"
                    >
                      Par défaut
                    </button>
                  )}
                </div>
                {showWheel && <ColorWheel value={seriesColor} onChange={setColorEdit} />}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSeries(true)}
            className="self-start text-sm text-gray-500"
          >
            + Série
          </button>
        )}

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
          disabled={saving}
          className="rounded-lg bg-gray-900 py-2 text-white disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : confirmLabel}
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
        {confirmingDelete && onDelete ? (
          <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-3">
            <p className="text-center text-sm text-red-800">
              Supprimer « {metadata.title} » ? Cette action est définitive.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-lg bg-white py-2 text-gray-600 ring-1 ring-gray-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await onDelete()
                  } catch {
                    setError('La suppression a échoué. Réessaie plus tard.')
                    setConfirmingDelete(false)
                    setDeleting(false)
                  }
                }}
                disabled={deleting}
                className="rounded-lg bg-red-600 py-2 font-medium text-white disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Confirmer'}
              </button>
            </div>
          </div>
        ) : (
          <div className={onDelete ? 'grid grid-cols-2 gap-2' : 'flex flex-col'}>
            <button type="button" onClick={onClose} className="rounded-lg py-2 text-gray-500">
              Annuler
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-lg py-2 text-red-600 ring-1 ring-red-200"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
