const GENRE_RULES: { genre: string; keywords: string[] }[] = [
  { genre: 'Science-fiction', keywords: ['science fiction', 'sci-fi'] },
  { genre: 'Fantasy', keywords: ['fantasy', 'fantastique'] },
  { genre: 'Policier / Thriller', keywords: ['mystery', 'detective', 'thriller', 'crime', 'policier'] },
  { genre: 'Horreur', keywords: ['horror', 'horreur'] },
  { genre: 'Romance', keywords: ['romance', 'love stories'] },
  { genre: 'Manga', keywords: ['manga'] },
  { genre: 'Bande dessinée', keywords: ['comic', 'graphic novel', 'bande dessinée'] },
  { genre: 'Poésie', keywords: ['poetry', 'poésie'] },
  { genre: 'Théâtre', keywords: ['drama', 'plays', 'théâtre'] },
  { genre: 'Jeunesse', keywords: ['juvenile', "children's", 'young adult'] },
  { genre: 'Biographie', keywords: ['biography', 'autobiography', 'biographie'] },
  { genre: 'Histoire', keywords: ['history', 'histoire'] },
  { genre: 'Essai', keywords: ['essay', 'essai', 'philosophy', 'politics', 'economics'] },
  { genre: 'Fiction', keywords: ['fiction'] },
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
