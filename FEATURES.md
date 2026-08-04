# Fonctionnalités — Personal Library

## Authentification
- Connexion par email / mot de passe
- Inscription par email / mot de passe
- Connexion avec Google (popup OAuth)
- Liaison automatique d'un compte Google à un compte email/mot de passe existant (même adresse)
- Déconnexion
- Redirection automatique selon l'état de connexion (page de login ↔ application)
- Message d'avertissement si Firebase n'est pas configuré (`.env.local` manquant)

## Étagères
- Création d'une étagère avec un nom
- 4 modes de classement au choix :
  - **Perso** : aucun tri, ordre d'ajout
  - **Genre** : étagère dédiée à un genre précis choisi via menu déroulant (n'affiche que les livres de ce genre)
  - **Auteur** : regroupement automatique par premier auteur
  - **Titre** : tri alphabétique
- Renommage d'une étagère
- Suppression d'une étagère (avec confirmation, supprime aussi tous les livres qu'elle contient)
- Badge affichant le mode de l'étagère (ou le genre précis pour une étagère dédiée)

## Livres
- Ajout par scan de code-barres (caméra, sur mobile/tablette)
- Ajout par saisie manuelle du code ISBN (détection automatique desktop vs mobile pour proposer le bon mode de saisie)
- Récupération automatique des métadonnées : Open Library en premier, puis Google Books en repli si non trouvé
- Ajout 100% manuel si aucune des deux API ne trouve le livre (titre, auteur, genre à saisir soi-même)
- Champs éditables sur la fiche livre :
  - Titre (obligatoire)
  - Sous-titre (optionnel, révélé via bouton "+ Sous-titre")
  - Tome (optionnel, révélé via bouton "+ Tome")
  - Auteur(s) multiples (obligatoire au moins un, ajout/suppression dynamique via "+ Auteur")
  - Genre (obligatoire, liste contrôlée)
  - Synopsis (optionnel)
  - Note (0 à 5 étoiles)
- Message d'erreur si titre / auteur / genre manquant à la validation
- Modification d'un livre existant (mêmes champs que l'ajout)
- Suppression d'un livre
- Déplacement d'un livre vers une autre étagère (popup listant les étagères disponibles)

## Genres
- Liste contrôlée et fixe de genres : Science-fiction, Fantasy, Policier / Thriller, Horreur, Romance, Manga, Bande dessinée, Poésie, Théâtre, Jeunesse, Biographie, Histoire, Essai, Fiction
- Détection automatique du genre à partir des données brutes des API (mots-clés dans les sujets/catégories) au moment de l'ajout
- Genre toujours modifiable/corrigeable manuellement via menu déroulant

## Apparence
- Interface mobile-first (cartes, modales pleine largeur en bas d'écran sur mobile, centrées sur desktop)
- Cartes livre avec couverture, titre, auteur(s), badge de genre, étoiles
- Icône livre par défaut (📖) si aucune couverture disponible
- Design épuré en niveaux de gris (Tailwind CSS)

## Technique
- Stack : React + TypeScript + Vite + Tailwind CSS
- Authentification et base de données : Firebase (Auth + Firestore)
- Structure des données Firestore : `users/{uid}/shelves/{shelfId}/books/{bookId}`
- Règles de sécurité Firestore : accès restreint à son propre `uid`
- Sources externes de métadonnées : Open Library (principale), Google Books (repli)
- Résilience réseau : toute erreur d'API (quota dépassé, panne réseau, timeout) se traduit par un état "non trouvé" plutôt qu'un plantage, pour garder la saisie manuelle toujours accessible
- Détection desktop/mobile via `matchMedia('(pointer: fine)')` + `navigator.maxTouchPoints`
- Scan de code-barres via `@zxing/browser`
- Navigation via `react-router-dom`
