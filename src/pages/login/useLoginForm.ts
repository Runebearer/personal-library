import { FormEvent, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { AuthErrorCodes, GoogleAuthProvider, type AuthCredential } from 'firebase/auth'
import { linkGoogleToPasswordAccount, signIn, signInWithGoogle, signUp } from '../../firebase/auth'

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

export function useLoginForm() {
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

  function cancelLink() {
    setPendingLink(null)
    setError(null)
    setLinkPassword('')
  }

  return {
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
  }
}
