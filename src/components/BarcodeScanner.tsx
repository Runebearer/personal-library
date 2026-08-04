import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'

export function BarcodeScanner({
  onDetected,
  onCancel,
}: {
  onDetected: (isbn: string) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let controls: IScannerControls | undefined

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (result) {
          onDetected(result.getText())
        }
      })
      .then((c) => {
        controls = c
      })
      .catch(() => {
        setError("Impossible d'accéder à la caméra. Vérifiez les autorisations.")
      })

    return () => controls?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-white">Visez le code-barres ISBN</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-white/20 px-3 py-1 text-sm text-white"
        >
          Annuler
        </button>
      </div>
      <div className="relative flex-1">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {error && (
          <p className="absolute inset-x-4 top-4 rounded-lg bg-red-600/90 p-3 text-center text-sm text-white">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
