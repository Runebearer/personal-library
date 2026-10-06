# Fonctionnalités — Personal Library

## Authentification
- Connexion par email / mot de passe
- Inscription par email / mot de passe
- Connexion avec Google (popup OAuth)
- Liaison automatique d'un compte Google à un compte email/mot de passe existant (même adresse)
- Déconnexion
- Redirection automatique selon l'état de connexion (page de login ↔ application)
- Message d'avertissement si Firebase n'est pas configuré (`.env.local` manquant)
- Deux présentations de la page de connexion : formulaire classique, ou décor 3D/illustré « porte de bibliothèque » (bascule via le sélecteur de mode)

## Modes d'affichage (Classique / 3D)
- Chaque page (accueil, bibliothèque, étagère) existe en version **Classique** (2D, cartes) et **3D** (scène Three.js)
- Sélecteur « Classique / 3D » toujours visible ; le choix est mémorisé (`localStorage`), 3D par défaut
- Bascule sans changer de page : seul le rendu change
- Transitions en fondu entre les scènes, avec attente du rendu de la scène 3D et préchargement des scènes/textures voisines

## Accueil
- **Classique** : cartes « Mes livres préférés », « La bibliothèque » et « Déconnexion »
- **3D (hall d'entrée)** : le livre posé sur le bureau ouvre l'étagère de favoris, la porte de gauche mène à la bibliothèque, la porte du fond déconnecte
- Étagère « Mes livres préférés » : créée à la demande (jamais automatiquement) si elle n'existe pas

## Bibliothèque
- Vue d'ensemble de toutes les étagères (cartes en classique ; salle avec une bibliothèque par étagère en 3D, navigation caméra vers la bibliothèque choisie)
- Outils communs aux deux vues, ouverts dans des feuilles : **Rechercher un livre** et **Gérer les étagères**

## Recherche
- Recherche par titre (et sous-titre) ou par auteur dans tous les livres de toutes les étagères (filtres de genre ignorés)
- Insensible à la casse et aux accents (« celine » trouve « Céline »)
- Résultats sous forme de cartes ; un clic ouvre le livre (modification, déplacement vers une autre étagère)

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
- Page d'étagère en vue classique (liste de cartes) ou 3D (bibliothèque en bois avec les livres sur leurs dos, couleurs de tranche, survol lumineux, clic pour ouvrir la fiche)

## Livres
- Ajout par scan de code-barres (caméra, sur mobile/tablette)
- Après le scan/la saisie : choix de l'étagère de destination (celle ouverte est présélectionnée ; avertissement si une étagère de genre masquerait le livre)
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
  - Série (optionnelle, révélée via bouton « + Série » : choisir une série existante ou en créer une)
  - Couleur de la série (roue chromatique, ou « Par défaut » pour la couleur du thème)
  - Note (0 à 5 étoiles)
- Message d'erreur si titre / auteur / genre manquant à la validation
- Modification d'un livre existant (mêmes champs que l'ajout)
- Suppression d'un livre (avec confirmation dans la fiche)
- Déplacement d'un livre vers une autre étagère (popup listant les étagères disponibles)

## Séries
- Une série (ex. les tomes d'un manga) est partagée entre étagères ; les livres y sont rattachés par identifiant
- Les livres d'une même série sont rangés côte à côte, triés par numéro de tome (tomes sans numéro en dernier)
- Couleur de tranche commune à tous les tomes de la série, modifiable depuis la fiche d'un livre

## Genres
- Liste contrôlée et fixe de genres : Science-fiction, Fantasy, Policier / Thriller, Horreur, Romance, Manga, Bande dessinée, Poésie, Théâtre, Jeunesse, Biographie, Histoire, Essai, Fiction
- Détection automatique du genre à partir des données brutes des API (mots-clés dans les sujets/catégories) au moment de l'ajout
- Genre toujours modifiable/corrigeable manuellement via menu déroulant

## Apparence
- Interface mobile-first (cartes, modales pleine largeur en bas d'écran sur mobile, centrées sur desktop)
- Cartes livre avec couverture, titre, auteur(s), badge de genre, étoiles
- Icône livre par défaut (📖) si aucune couverture disponible
- Design épuré en niveaux de gris (Tailwind CSS) en vue classique ; ambiance bois/pierre/bougies en 3D et sur la page de connexion alternative
- Application installable (PWA)

## Technique
- Stack : React + TypeScript + Vite + Tailwind CSS, PWA via `vite-plugin-pwa`
- Rendu 3D : `three` + `@react-three/fiber` + `@react-three/drei`
- Authentification et base de données : Firebase (Auth + Firestore)
- Structure des données Firestore : `users/{uid}/shelves/{shelfId}/books/{bookId}` et `users/{uid}/series/{seriesId}`
- Règles de sécurité Firestore : accès restreint à son propre `uid`
- Sources externes de métadonnées : Open Library (principale), Google Books (repli)
- Résilience réseau : toute erreur d'API (quota dépassé, panne réseau, timeout) se traduit par un état "non trouvé" plutôt qu'un plantage, pour garder la saisie manuelle toujours accessible
- Détection desktop/mobile via `matchMedia('(pointer: fine)')` + `navigator.maxTouchPoints`
- Scan de code-barres via `@zxing/browser`
- Navigation via `react-router-dom`

## Idées à venir (`dev.md`)
- Types de compte : Lecteur / Libraire / Auteur
- Partage sur les réseaux sociaux (priorité Instagram)
- Liste de contacts (visite de la bibliothèque, fiche bibliothèque avec stats)
- Invitation à utiliser l'app
- Envoi d'une fiche livre (avec indication de qui l'a envoyée)
