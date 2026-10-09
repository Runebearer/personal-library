# Guide de Migration des Dépendances

**Date**: 2026-10-09  
**Statut**: À faire quand connexion stable  
**Durée estimée**: 2-3 semaines  

## 📋 Résumé des Risques Critiques Identifiés

### ⚠️ Blocages Majeurs
- **React 19 + @react-three/fiber 8**: ❌ Incompatible → Fiber DOIT passer à v9
- **React Router 8 + React 18**: ❌ Nécessite React 19 comme peer dependency
- **Vite 8**: Change les configs (esbuild → Rolldown)

### ✅ Dépendances Sûres
- createRoot() déjà utilisé (pas de breaking change)
- TypeScript 5 → 7 devrait être compatible
- zustand, @react-spring seront auto-updatées

---

## 🚀 Phase 1: React 18.3.1 → React 19

**Étape 1.1: Installer les nouvelles versions**
```bash
npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19
```

**Étape 1.2: Vérifier les erreurs de compilation**
```bash
npm run build
```

**Points à vérifier dans le code**:
- ❌ Supprimer les `propTypes` (utiliser TypeScript)
- ❌ Supprimer les `defaultProps` (utiliser ES6 defaults)
- ❌ Remplacer les string refs par ref callbacks
- ❌ Chercher `React.createFactory()` (deprecated)

**Commande pour trouver les problèmes potentiels**:
```bash
# Chercher propTypes
grep -r "propTypes" src/

# Chercher defaultProps
grep -r "defaultProps" src/

# Chercher string refs (ref="...")
grep -r 'ref="' src/
```

**Étape 1.3: Tester la compilation et preview**
```bash
npm run dev
# Vérifier dans le navigateur qu'il n'y a pas de console errors
# Tester les flows principaux: scan barcode, library affichage
```

**Étape 1.4: Commit**
```bash
git add package.json package-lock.json
git commit -m "upgrade: React 18 → 19 with type updates"
```

---

## 🎨 Phase 2: @react-three/fiber 8 → 9

**Étape 2.1: Installer la nouvelle version**
```bash
npm install @react-three/fiber@9 @react-three/drei@10
```

**Étape 2.2: Vérifier les erreurs de compilation**
```bash
npm run build
```

**Breaking Changes à regarder dans ton code**:
- `Props` → `CanvasProps` (si utilisé en types)
- Vérifier les JSX types Three.js
- Vérifier `MeshProps` → utiliser `ThreeElements['mesh']`

**Commandes pour identifier les problèmes**:
```bash
# Chercher les anciens types Props dans les fichiers 3D
grep -r "Props\|MeshProps" src/ --include="*.tsx" --include="*.ts"

# Chercher Canvas usage
grep -r "Canvas\|CanvasProps" src/ --include="*.tsx"
```

**Étape 2.3: Tester la 3D et la prévisualisation**
```bash
npm run dev
# Tester le rendu 3D (si applicable)
# Vérifier pas de console errors
```

**Étape 2.4: Commit**
```bash
git add package.json package-lock.json
git commit -m "upgrade: @react-three/fiber 8 → 9 with drei 10"
```

---

## 🛣️ Phase 3: React Router 6 → 7

**Étape 3.1: Installer la nouvelle version**
```bash
npm install react-router@7 react-router-dom@7
```

**Étape 3.2: Vérifier les erreurs de compilation**
```bash
npm run build
```

**Breaking Changes à vérifier**:
- `useMatches()` retourne `loaderData` au lieu de `data`
- Routes avec `meta` functions: `{ data }` → `{ loaderData }`
- Check les `loader` et `action` functions

**Commandes pour identifier les changements**:
```bash
# Chercher useMatches
grep -r "useMatches" src/ --include="*.tsx" --include="*.ts"

# Chercher routes avec loaders/actions
grep -r "loader\|action\|meta" src/ --include="*.tsx" --include="*.ts" | grep -v "// "
```

**Étape 3.3: Appliquer les changements au besoin**
Si tu as du code React Router, les changements ressemblent à:
```typescript
// AVANT (React Router 6)
const matches = useMatches();
const data = matches[0]?.data;

// APRÈS (React Router 7)
const matches = useMatches();
const data = matches[0]?.loaderData;
```

**Étape 3.4: Tester la navigation et les routes**
```bash
npm run dev
# Tester la navigation entre pages
# Tester les loaders (si utilisés)
# Vérifier pas de console errors
```

**Étape 3.5: Commit**
```bash
git add package.json package-lock.json src/
git commit -m "upgrade: react-router-dom 6 → 7 with loaderData changes"
```

**Étape 3.6: (Optionnel) React Router 7 → 8**
Si tu veux aller à la latest version:
```bash
npm install react-router@8 react-router-dom@8
npm run build

# Future flags peuvent être appliquées progressivement
# Consulte la doc React Router 8 si tu vas jusqu'au bout
```

---

## 📦 Phase 4: Vite 5 → 8

**Étape 4.1: Installer les nouvelles versions**
```bash
npm install vite@8 @vitejs/plugin-react@6
```

**Étape 4.2: Mettre à jour vite.config.ts**

Ouvre `vite.config.ts` et cherche la section Vite config.

**Breaking Change**: esbuild options → Rolldown options

```typescript
// AVANT (Vite 5)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // ...
    }
  }
})

// APRÈS (Vite 8)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // ...
    }
    // Les options esbuild spécifiques peuvent être supprimées
    // Vite 8 utilise Rolldown par défaut
  }
})
```

**Étape 4.3: Vérifier la compilation et le build**
```bash
npm run build

# Puis tester le preview
npm run preview
```

**Points à tester**:
- Le build se termine sans erreur
- La taille du bundle n'a pas augmenté dramatiquement
- Les assets (CSS, JS, images) se chargent correctement

**Étape 4.4: Tester le dev server**
```bash
npm run dev
# Vérifier que HMR marche toujours
# Vérifier pas de console errors
```

**Étape 4.5: Commit**
```bash
git add package.json package-lock.json vite.config.ts
git commit -m "upgrade: Vite 5 → 8 with @vitejs/plugin-react 6"
```

---

## 🔷 Phase 5: TypeScript 5 → 7

⚠️ **À faire APRÈS toutes les autres upgrades (Phase 1-4)**

**Étape 5.1: Installer la nouvelle version**
```bash
npm install typescript@7
```

**Étape 5.2: Vérifier la compilation stricte**
```bash
npm run build
```

**Points à vérifier**:
- Pas de nouvelles erreurs TypeScript
- Les types React 19 sont bien compilés
- Pas de breaking changes TypeScript majeurs

**Étape 5.3: Tester complet**
```bash
npm run dev
npm run lint
npm run build
```

**Étape 5.4: Commit**
```bash
git add package.json package-lock.json
git commit -m "upgrade: TypeScript 5 → 7"
```

---

## 🔍 Checklist Finale (après toutes les phases)

- [ ] Phase 1 complétée et testée (React 19)
- [ ] Phase 2 complétée et testée (@react-three/fiber 9)
- [ ] Phase 3 complétée et testée (react-router-dom 7)
- [ ] Phase 4 complétée et testée (Vite 8)
- [ ] Phase 5 complétée et testée (TypeScript 7)
- [ ] `npm run build` passe sans erreur
- [ ] `npm run dev` fonctionne sans console errors
- [ ] `npm run lint` passe tous les checks
- [ ] Tests manuels des flows principaux:
  - [ ] Page d'accueil se charge
  - [ ] Navigation entre pages
  - [ ] Scan barcode (si applicable)
  - [ ] Library affichage
  - [ ] Toute autre feature critique

---

## 🛠️ Commandes Utiles en Cours de Route

**Voir les packages outdatés**:
```bash
npm outdated
```

**Voir l'arbre des dépendances**:
```bash
npm ls react react-dom react-router-dom
```

**Nettoyer et réinstaller si problème**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Vérifier les warnings**:
```bash
npm ls
```

---

## ⚡ En Cas de Problème

Si une phase échoue:

1. **Vérifier les erreurs**:
   ```bash
   npm run build 2>&1 | head -50
   ```

2. **Revenir à la version précédente** si besoin:
   ```bash
   git checkout HEAD~1 -- package.json package-lock.json
   npm install
   ```

3. **Consulter les breaking changes** de la version:
   - React: https://react.dev/blog/2024/...
   - Vite: https://vite.dev/guide/migration.html
   - React Router: https://reactrouter.com/start/library/upgrading

---

## 📝 Progression

Marque ta progression ici:

- [ ] Phase 1: React 19 - Commencée le ___
- [ ] Phase 2: @react-three/fiber 9 - Commencée le ___
- [ ] Phase 3: React Router 7 - Commencée le ___
- [ ] Phase 4: Vite 8 - Commencée le ___
- [ ] Phase 5: TypeScript 7 - Commencée le ___
- [ ] ✅ Migration terminée le ___

---

**Bon courage! 🚀**  
N'hésite pas à revenir à ce guide si tu as des questions pendant l'upgrade.
