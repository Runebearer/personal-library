import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLoginForm } from './useLoginForm'
import { GoogleIcon } from './GoogleIcon'

export function ClassicLoginForm({ toggle }: { toggle: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    pendingLink,
    linkPassword,
    setLinkPassword,
    handleSubmit,
    handleGoogleSignIn,
    handleLinkSubmit,
    cancelLink,
  } = useLoginForm()

  if (pendingLink) {
    return (
      <div className="relative flex min-h-dvh flex-col justify-center gap-6 bg-gray-50 px-6 py-12">
        {toggle}
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
        <button type="button" onClick={cancelLink} className="text-center text-sm text-gray-500">
          Annuler
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh flex-col justify-center gap-6 bg-gray-50 px-6 py-12">
      {toggle}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center text-2xl font-semibold text-gray-900">Personal Library</h1>
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-gray-400 transition hover:text-gray-600"
            aria-label="Dépliez le formulaire"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      <div
        className={`flex w-full flex-col items-center overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
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
          <GoogleIcon />
          Continuer avec Google
        </button>

        <p className="text-center text-sm italic text-gray-500">
          En vous connectant, vous acceptez notre politique de confidentialité
        </p>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <Link
          to="/privacy"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Politiques de confidentialité
        </Link>
      </div>
    </div>
  )
}
