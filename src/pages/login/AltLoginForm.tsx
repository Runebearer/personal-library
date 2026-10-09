import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLoginForm } from './useLoginForm'
import { GoogleIcon } from './GoogleIcon'

const cardClass =
  'w-full max-w-sm rounded-2xl border border-[#6b4226] bg-[#3d2817]/20 p-8 shadow-2xl shadow-black/60 backdrop-blur-sm'
const inputClass =
  'rounded-lg border border-[#6b4226] bg-[#2e1c10] px-4 py-3 text-base text-[#ede4d3] placeholder-[#ede4d3]/40 outline-none focus:border-[#ff7a33]'
const primaryButtonClass =
  'rounded-lg bg-[#ff7a33] py-3 font-semibold text-[#2e1c10] transition hover:bg-[#e2661f] disabled:opacity-50'

function AltLoginBackground({ toggle, children }: { toggle: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#1a1108] bg-cover bg-center bg-no-repeat px-6 py-12
        bg-[url('/images/login-door-mobile.webp')] sm:bg-[url('/images/login-door-desktop.webp')]">
      <div className="absolute inset-0 bg-black/35" />
      {toggle}
      <div className="relative">{children}</div>
    </div>
  )
}

export function AltLoginForm({ toggle }: { toggle: ReactNode }) {
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
      <AltLoginBackground toggle={toggle}>
        <div className={cardClass}>
          <h1 className="text-center font-serif text-2xl font-semibold text-[#ede4d3]">
            Personal Library
          </h1>
          <div className="mt-4 flex flex-col gap-2 text-center">
            <p className="text-sm text-[#ede4d3]/90">
              Un compte existe déjà pour <strong>{pendingLink.email}</strong> avec un mot de
              passe.
            </p>
            <p className="text-sm text-[#ede4d3]/60">
              Entre ce mot de passe pour lier ton compte Google à ce compte existant.
            </p>
          </div>
          <form onSubmit={handleLinkSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="password"
              required
              placeholder="Mot de passe"
              value={linkPassword}
              onChange={(e) => setLinkPassword(e.target.value)}
              className={inputClass}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className={primaryButtonClass}>
              Lier les comptes
            </button>
          </form>
          <button
            type="button"
            onClick={cancelLink}
            className="mt-4 w-full text-center text-sm text-[#ede4d3]/60"
          >
            Annuler
          </button>
        </div>
      </AltLoginBackground>
    )
  }

  return (
    <AltLoginBackground toggle={toggle}>
      <div className={cardClass}>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-center font-serif text-2xl font-semibold text-[#ede4d3]">
            Personal Library
          </h1>
          {!isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-[#ede4d3]/40 transition hover:text-[#ede4d3]/60"
              aria-label="Dépliez le formulaire"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
        <div className="mx-auto mt-3 h-px w-16 bg-[#ff7a33]" />

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className={primaryButtonClass}>
            {mode === 'signin' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="mt-4 w-full text-center text-sm text-[#ede4d3]/60"
          >
            {mode === 'signin' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#6b4226]" />
            <span className="text-xs text-[#ede4d3]/40">ou</span>
            <div className="h-px flex-1 bg-[#6b4226]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#6b4226] bg-[#ede4d3] py-3 font-medium text-[#2e1c10] transition hover:bg-[#ded2ba] disabled:opacity-50"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          <p className="mt-4 text-center text-sm italic text-[#ede4d3]/70">
            En vous connectant, vous acceptez notre politique de confidentialité
          </p>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <Link
          to="/privacy"
          className="rounded-lg bg-[#3d2817] px-4 py-2 text-sm font-medium text-[#ede4d3] transition hover:bg-[#4a3220]"
        >
          Politiques de confidentialité
        </Link>
      </div>
    </AltLoginBackground>
  )
}
