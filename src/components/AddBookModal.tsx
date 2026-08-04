import { useState } from 'react'
import type { FormEvent } from 'react'
import { BarcodeScanner } from './BarcodeScanner'
import { BookDetailModal } from './BookDetailModal'
import { fetchBookByIsbn } from '../lib/openLibrary'
import type { BookMetadata } from '../types'

type Step =
  | { kind: 'scanning' }
  | { kind: 'looking-up'; isbn: string }
  | { kind: 'confirm'; metadata: BookMetadata }
  | { kind: 'not-found'; isbn: string }
  | { kind: 'error'; message: string }

function isDesktopDevice() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches &&
    navigator.maxTouchPoints === 0
  )
}

function ManualIsbnForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (isbn: string) => void
  onCancel: () => void
}) {
  const [isbn, setIsbn] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = isbn.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl"
      >
        <p className="text-center font-medium text-gray-900">Ajouter un livre</p>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Code ISBN
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="Ex. 9780140328721"
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>
        <button type="submit" className="rounded-lg bg-gray-900 py-2 text-white">
          Rechercher
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg py-2 text-gray-500">
          Annuler
        </button>
      </form>
    </div>
  )
}

export function AddBookModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (metadata: BookMetadata) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>({ kind: 'scanning' })

  async function handleDetected(isbn: string) {
    setStep({ kind: 'looking-up', isbn })
    try {
      const metadata = await fetchBookByIsbn(isbn)
      if (!metadata) {
        setStep({ kind: 'not-found', isbn })
        return
      }
      setStep({ kind: 'confirm', metadata })
    } catch {
      setStep({ kind: 'error', message: 'La recherche du livre a échoué. Réessayez.' })
    }
  }

  function handleManualEntry(isbn: string) {
    setStep({
      kind: 'confirm',
      metadata: {
        isbn,
        title: '',
        authors: [],
        coverUrl: null,
        genre: null,
        synopsis: null,
        rating: 0,
      },
    })
  }

  if (step.kind === 'scanning') {
    return isDesktopDevice() ? (
      <ManualIsbnForm onSubmit={handleDetected} onCancel={onClose} />
    ) : (
      <BarcodeScanner onDetected={handleDetected} onCancel={onClose} />
    )
  }

  if (step.kind === 'confirm') {
    return (
      <BookDetailModal
        metadata={step.metadata}
        confirmLabel="Ajouter à l'étagère"
        onConfirm={onConfirm}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl">
        {step.kind === 'looking-up' && (
          <p className="py-6 text-center text-gray-600">Recherche du livre (ISBN {step.isbn})…</p>
        )}

        {step.kind === 'not-found' && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-center text-gray-700">
              Aucun livre trouvé pour l'ISBN {step.isbn}.
            </p>
            <button
              type="button"
              onClick={() => handleManualEntry(step.isbn)}
              className="rounded-lg bg-gray-900 py-2 text-white"
            >
              Ajouter manuellement
            </button>
            <button
              type="button"
              onClick={() => setStep({ kind: 'scanning' })}
              className="rounded-lg py-2 text-gray-600 ring-1 ring-gray-200"
            >
              Rescanner
            </button>
            <button type="button" onClick={onClose} className="rounded-lg py-2 text-gray-500">
              Annuler
            </button>
          </div>
        )}

        {step.kind === 'error' && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-center text-red-600">{step.message}</p>
            <button
              type="button"
              onClick={() => setStep({ kind: 'scanning' })}
              className="rounded-lg bg-gray-900 py-2 text-white"
            >
              Rescanner
            </button>
            <button type="button" onClick={onClose} className="rounded-lg py-2 text-gray-500">
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
