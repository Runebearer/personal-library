import { FormEvent, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { AuthErrorCodes, GoogleAuthProvider, type AuthCredential } from 'firebase/auth'
import { linkGoogleToPasswordAccount, signIn, signInWithGoogle, signUp } from '../firebase/auth'

interface PendingLink {
  email: string
  credential: AuthCredential
}

function formatAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/email-already-in-use':
        return 'Un compte existe déjà avec cet email. Connecte-toi plutôt.'
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect.'
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.'
      case 'auth/invalid-email':
        return 'Adresse email invalide.'
      default:
        return err.message
    }
  }
  return err instanceof Error ? err.message : 'Une erreur est survenue.'
}

export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null)
  const [linkPassword, setLinkPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/email-already-in-use') {
        setMode('signin')
      }
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      if (err instanceof FirebaseError && err.code === AuthErrorCodes.NEED_CONFIRMATION) {
        const credential = GoogleAuthProvider.credentialFromError(err)
        const linkEmail = (err.customData as { email?: string } | undefined)?.email
        if (credential && linkEmail) {
          setPendingLink({ email: linkEmail, credential })
          return
        }
      }
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleLinkSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pendingLink) return
    setError(null)
    setLoading(true)
    try {
      await linkGoogleToPasswordAccount(pendingLink.email, linkPassword, pendingLink.credential)
      setPendingLink(null)
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  if (pendingLink) {
    return (
      <div className="flex min-h-dvh flex-col justify-center gap-6 bg-gray-50 px-6 py-12">
        <h1 className="text-center text-2xl font-semibold text-gray-900">Personal Library</h1>
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-gray-700">
            Un compte existe déjà pour <strong>{pendingLink.email}</strong> avec un mot de passe.
          </p>
          <p className="text-sm text-gray-500">
            Entre ce mot de passe pour lier ton compte Google à ce compte existant.
          </p>
        </div>
        <form onSubmit={handleLinkSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            placeholder="Mot de passe"
            value={linkPassword}
            onChange={(e) => setLinkPassword(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 text-base"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
          >
            Lier les comptes
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setPendingLink(null)
            setError(null)
            setLinkPassword('')
          }}
          className="text-center text-sm text-gray-500"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center gap-6 bg-gray-50 px-6 py-12">
      <h1 className="text-center text-2xl font-semibold text-gray-900">Personal Library</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 py-3 font-medium text-white disabled:opacity-50"
        >
          {mode === 'signin' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="text-center text-sm text-gray-500"
      >
        {mode === 'signin' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">ou</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 disabled:opacity-50"
      >
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.7 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.9 35.9 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
          />
        </svg>
        Continuer avec Google
      </button>
    </div>
  )
}
