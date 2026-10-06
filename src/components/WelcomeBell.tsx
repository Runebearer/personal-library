import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// 'login': same look as the login card (AltLoginForm). 'classic': the light cards of HomeClassic.
const STYLES = {
  login: {
    card: 'w-72 rounded-2xl border border-[#6b4226] bg-[#3d2817]/20 p-6 shadow-2xl shadow-black/60 backdrop-blur-sm',
    title: 'text-center font-serif text-xl font-semibold text-[#ede4d3]',
    rule: 'bg-[#ff7a33]',
    body: 'text-[#ede4d3]/80',
    signature: 'font-serif italic text-[#ede4d3]/60',
    arrow:
      'text-[#ede4d3]/60 hover:text-[#ff7a33] disabled:opacity-20 disabled:hover:text-[#ede4d3]/60',
    dotOn: 'bg-[#ff7a33]',
    dotOff: 'bg-[#ede4d3]/30',
    bell: 'border border-[#6b4226] bg-[#3d2817]/90 text-[#ede4d3] shadow-lg shadow-black/60 backdrop-blur-sm hover:border-[#ff7a33] hover:text-[#ff7a33]',
  },
  classic: {
    card: 'w-72 rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-200',
    title: 'text-center text-lg font-semibold text-gray-900',
    rule: 'bg-gray-200',
    body: 'text-gray-600',
    signature: 'italic text-gray-400',
    arrow: 'text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400',
    dotOn: 'bg-gray-900',
    dotOff: 'bg-gray-300',
    bell: 'bg-white text-gray-500 shadow-md ring-1 ring-gray-200 hover:text-gray-900',
  },
}

const SLIDES = [
  "Merci d'avoir pris ton abonnement de bibliothèque. J'ai aménagé cet endroit cosy pour te permettre de retrouver plus facilement les livres que tu as déjà lus. Plus de livre en double, plus d'hésitation sur les tomes des longues sagas !",
  "Cette Bibliothèque est un peu spéciale. Bien sûr tu peux y naviguer de façon classique grâce au bouton en haut à droite. Tu peux aussi y naviguer en 3D et t'y déplacer. Elle s'agrandira au fur et à mesure du temps qui passe !",
]

// Bell at the bottom-right; the welcome message is closed by default and opens on click.
export function WelcomeBell({
  className = '',
  variant = 'login',
}: {
  className?: string
  variant?: keyof typeof STYLES
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState(0)
  const name = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0]
  const s = STYLES[variant]

  return (
    <div className={`flex flex-col items-end gap-3 ${className}`}>
      {open && (
        <div className={s.card} role="status">
          <h2 className={s.title}>Bienvenue{name ? `, ${name}` : ''}</h2>
          <div className={`mx-auto mt-3 h-px w-16 ${s.rule}`} />
          <p className={`mt-4 min-h-40 text-center text-sm leading-relaxed ${s.body}`}>
            {SLIDES[slide]}
          </p>
          <p className={`mt-2 text-right text-sm ${s.signature}`}>— Le Bibliothécaire</p>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSlide((i) => i - 1)}
              disabled={slide === 0}
              aria-label="Message précédent"
              className={`px-2 text-lg transition ${s.arrow}`}
            >
              ‹
            </button>
            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Message ${i + 1}`}
                  aria-current={i === slide}
                  className={`h-2 w-2 rounded-full transition ${i === slide ? s.dotOn : s.dotOff}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSlide((i) => i + 1)}
              disabled={slide === SLIDES.length - 1}
              aria-label="Message suivant"
              className={`px-2 text-lg transition ${s.arrow}`}
            >
              ›
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Fermer le message de bienvenue' : 'Afficher le message de bienvenue'}
        aria-expanded={open}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition ${s.bell}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </button>
    </div>
  )
}
