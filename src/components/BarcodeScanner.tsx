import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { normalizeIsbn } from '../lib/openLibrary'

function cameraErrorMessage(err: unknown): string {
  if (!window.isSecureContext) {
    return 'La caméra nécessite une connexion sécurisée (HTTPS).'
  }
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError') {
    return "L'accès à la caméra a été refusé. Autorisez-le dans les réglages du navigateur."
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Aucune caméra détectée sur cet appareil.'
  }
  if (name === 'NotReadableError') {
    return 'La caméra est déjà utilisée par une autre application.'
  }
  return "Impossible d'accéder à la caméra."
}

export function BarcodeScanner({
  onDetected,
  onManualEntry,
  onCancel,
}: {
  onDetected: (isbn: string) => void
  onManualEntry: () => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]]])
    const reader = new BrowserMultiFormatReader(hints)
    let controls: IScannerControls | undefined
    let stream: MediaStream | undefined
    let active = true

    // We open the stream ourselves: if this effect was already cleaned up (StrictMode double
    // mount) we just release the camera, instead of calling controls.stop() which would clear
    // the <video> shared with the live instance.
    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (!active) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      controls = await reader.decodeFromStream(stream, videoRef.current ?? undefined, (result) => {
        if (!active || !result) return
        const isbn = normalizeIsbn(result.getText())
        if (!isbn || !/^97[89]/.test(isbn)) return
        // The decoder keeps firing on every frame: report the first ISBN only
        active = false
        controls?.stop()
        onDetected(isbn)
      })
    }

    start().catch((err: unknown) => {
      if (active) setError(cameraErrorMessage(err))
    })

    return () => {
      active = false
      controls?.stop()
      stream?.getTracks().forEach((t) => t.stop())
    }
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
      <div className="p-4">
        <button
          type="button"
          onClick={onManualEntry}
          className="w-full rounded-lg bg-white py-2 text-sm font-medium text-gray-900"
        >
          Saisir l'ISBN manuellement
        </button>
      </div>
    </div>
  )
}
