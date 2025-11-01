# Admissions Équivalences – Admin Frontend

Application Angular 17+ (standalone components, TailwindCSS design tokens) permettant de piloter la revue des candidats et la validation des mappings matières. Quatre variantes visuelles sont fournies et activables via `?variant=1|2|3|4` ou depuis le sélecteur UI.

## 🚀 Démarrage rapide

```bash
npm install
npm run start
```

- Développement : `http://localhost:4200`
- Build production : `npm run build`
- Lint (Angular CLI) : `npm run lint`

## 🧱 Structure principale

- `src/app/core` – services mock (BehaviorSubject), thèmes, calcul des scores.
- `src/app/features` – pages lazy-loaded : dashboard, candidats, revue mapping, catalogue, suggestions LLM, paramètres, audit.
- `src/app/shared` – composants UI réutilisables (bouton, input, badge, table, toasts, dialog, shell).

## 🎨 Variantes (query param `variant` + menu en haut à droite)

| Variante | Description rapide |
| --- | --- |
| 1 – Minimal | Palette neutre, cartes épurées. |
| 2 – Data-dense | Nav rail gauche + inspecteur latéral, tables compactes. |
| 3 – Split-pane | Revue mapping double panneau avec séparateur draggable. |
| 4 – Board | Candidats en kanban, suggestions en tuiles "quick approve". |

La variante choisie est persistée (localStorage) et applique des tokens Tailwind (CSS variables) sur `:root[data-variant="n"]`.

## ✨ Fonctionnalités clefs

- **Tableau de bord** : KPI, tâches ouvertes, fil d’activité, jobs 24h.
- **Candidats** : filtres, recherche, pagination, export CSV, board par statut (Var 4).
- **Fiche candidat** : profil, aperçu documents (PDF/JPEG), matières normalisées, accès direct revue.
- **Revue mapping** : acceptation/remplacement/retrait par ligne, actions de lot, recalcul live score et taux d’équivalence.
- **Catalogue** : CRUD mock des matières cibles, alias, import/export CSV, fiche cible avec suggestions associées.
- **Suggestions LLM** : clavier A/R, lot ≥0.90, hot cache configuré.
- **Paramètres** : seuils, poids, pipeline (lecture seule), thème clair/sombre, rétention.
- **Audit & logs** : filtrage texte, export CSV.

Toutes les actions (acceptations, imports mock, alias, paramètres) sont tracées dans le journal d’audit en mémoire.

## 🧪 Données mock

Seeder embarqué (`DataStoreService`) :
- 12 candidats, 20 matières cibles, ~60 matières extraites, mappings multi-méthodes.
- ~10 suggestions d’alias LLM dont ≥0.9.
- Tâches, jobs et audit en temps réel.

## 📸 Aperçu des variantes

Des captures sont générées automatiquement via Playwright lorsque disponible (voir dossier `artifacts/` après exécution des tests UI).

## 📝 Notes

- Frontend seulement (mock API en mémoire).
- TailwindCSS utilisé via tokens (`@tailwind` + CSS variables) dans `src/styles.css`.
- Aucun framework d’état externe requis (signals + BehaviorSubject).
