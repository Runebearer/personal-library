import { useState } from 'react'
import type { FormEvent } from 'react'
import { useShelves } from '../hooks/useShelves'
import type { BookMetadata } from '../types'

// Last step of adding a book: pick the shelf it goes to (the open shelf is preselected).
export function ChooseShelfModal({
  metadata,
  defaultShelfId,
  onConfirm,
  onBack,
}: {
  metadata: BookMetadata
  defaultShelfId: string
  onConfirm: (shelfId: string) => Promise<void>
  onBack: () => void
}) {
  const { shelves, loaded } = useShelves()
  const [choice, setChoice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shelfId =
    choice ?? (shelves.some((s) => s.id === defaultShelfId) ? defaultShelfId : shelves[0]?.id)
  const shelf = shelves.find((s) => s.id === shelfId)
  // A genre shelf only shows its genre: the book would be saved but invisible there
  const hiddenByGenre =
    shelf?.mode === 'genre' && !!shelf.genreFilter && shelf.genreFilter !== metadata.genre

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!shelfId) return
    setSaving(true)
    setError(null)
    try {
      await onConfirm(shelfId)
    } catch {
      setError("L'ajout du livre a échoué. Réessayez.")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl"
      >
        <p className="text-center font-medium text-gray-900">
          Dans quelle étagère ranger « {metadata.title} » ?
        </p>

        {loaded && shelves.length === 0 ? (
          <p className="py-2 text-center text-sm text-gray-500">Aucune étagère disponible.</p>
        ) : (
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Étagère
            <select
              value={shelfId ?? ''}
              onChange={(e) => setChoice(e.target.value)}
              disabled={!loaded || saving}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
            >
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {hiddenByGenre && (
          <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
            Cette étagère n'affiche que le genre « {shelf.genreFilter} » : ce livre (
            {metadata.genre ?? 'sans genre'}) n'y sera pas visible.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!shelfId || saving}
          className="rounded-lg bg-gray-900 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Ajout…' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-lg py-2 text-gray-500"
        >
          Retour
        </button>
      </form>
    </div>
  )
}
