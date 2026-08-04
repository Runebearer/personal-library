import { useState } from 'react'
import { BarcodeScanner } from './BarcodeScanner'
import { fetchBookByIsbn } from '../lib/openLibrary'
import type { BookMetadata } from '../types'

type Step =
  | { kind: 'scanning' }
  | { kind: 'looking-up'; isbn: string }
  | { kind: 'confirm'; metadata: BookMetadata }
  | { kind: 'not-found'; isbn: string }
  | { kind: 'error'; message: string }

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

  if (step.kind === 'scanning') {
    return <BarcodeScanner onDetected={handleDetected} onCancel={onClose} />
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

        {step.kind === 'confirm' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {step.metadata.coverUrl && (
                  <img
                    src={step.metadata.coverUrl}
                    alt={step.metadata.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-medium text-gray-900">{step.metadata.title}</p>
                <p className="text-sm text-gray-500">{step.metadata.authors.join(', ')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onConfirm(step.metadata)}
              className="rounded-lg bg-gray-900 py-2 text-white"
            >
              Ajouter à l'étagère
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
