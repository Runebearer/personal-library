const GENRE_RULES: { genre: string; keywords: string[] }[] = [
  { genre: 'à lire', keywords: [] },
  { genre: 'Fantasy', keywords: ['fantasy', 'fantastique', 'fantasy fiction'] },
  { genre: 'Horreur', keywords: ['horror', 'horreur', 'scary'] },
  { genre: 'Conte', keywords: ['fairy tale', 'tale', 'conte', 'legend'] },
  { genre: 'Policier', keywords: ['mystery', 'detective', 'crime', 'policier', 'whodunit'] },
  { genre: 'Thriller', keywords: ['thriller', 'suspense', 'suspenseful'] },
  { genre: 'Aventure', keywords: ['adventure', 'aventure', 'exploration'] },
  { genre: 'Roman historique', keywords: ['historical fiction', 'history', 'historical', 'roman historique'] },
  { genre: 'Roman social', keywords: ['social', 'society', 'roman social'] },
  { genre: 'Biographie', keywords: ['biography', 'autobiography', 'biographie', 'memoir', 'life story'] },
  { genre: 'Sociologie', keywords: ['sociology', 'sociologie', 'social science', 'society'] },
  { genre: 'Politique', keywords: ['politics', 'politique', 'political', 'government'] },
  { genre: 'Philosophie', keywords: ['philosophy', 'philosophie', 'philosophical', 'ethics'] },
  { genre: 'Sciences humaines et sociales', keywords: ['social science', 'human science', 'sciences humaines', 'human studies'] },
  { genre: 'Économie', keywords: ['economics', 'économie', 'economy', 'business'] },
  { genre: 'Sciences', keywords: ['science', 'sciences', 'scientific', 'research', 'technology'] },
  { genre: 'Développement personnel / Psychologie', keywords: ['psychology', 'psychologie', 'self-help', 'développement personnel', 'personal development', 'mental health'] },
  { genre: 'Récit de voyage', keywords: ['travel', 'voyage', 'travel writing', 'journey', 'récit de voyage'] },
  { genre: 'Education', keywords: ['education', 'éducation', 'learning', 'educational'] },
  { genre: 'Manga', keywords: ['manga', 'japanese comics'] },
]

export const GENRE_LIST = GENRE_RULES.map((rule) => rule.genre)

export function normalizeGenre(rawSubjects: string[]): string | null {
  const lowerSubjects = rawSubjects.map((s) => s.toLowerCase())
  for (const { genre, keywords } of GENRE_RULES) {
    if (lowerSubjects.some((subject) => keywords.some((keyword) => subject.includes(keyword)))) {
      return genre
    }
  }
  return null
}
