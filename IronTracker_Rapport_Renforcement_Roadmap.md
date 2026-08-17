# IronTracker — Rapport de renforcement & feuille de route

**Date :** Août 2026
**Portée :** Suite à l'audit technique v1 (patché) — état des lieux du patch, puis plan d'action priorisé (technique + métier), hors social/partage/connexion.
**Base :** `irontrackerpatched.zip`, comparé point par point à `IronTracker_Audit_Technique.md`.

---

## Partie 1 — Vérification du patch (l'audit v1 a-t-il été traité ?)

Le code a été relu intégralement, les dépendances installées, et **build + lint + tests unitaires ont été exécutés réellement** (pas seulement lus) pour valider ce rapport.

| # | Point de l'audit v1 | Statut | Vérification effectuée |
|---|---|---|---|
| 🔴1 | Erreurs de quota `localStorage` non remontées | ✅ Corrigé | `storage.ts` retourne un `SaveResult` typé (`ok/reason`), `App.tsx` affiche un toast explicite en cas d'échec, y compris message dédié pour quota dépassé |
| 🔴2 | Pas de validation de schéma à l'import | ✅ Corrigé | `core/validation.ts` valide récursivement chaque entité avant écrasement du store, avec messages d'erreur précis |
| 🔴3 | Tailwind via CDN | ✅ Corrigé | `@tailwindcss/vite` en devDependency, aucun `<script>` CDN dans `index.html` |
| 🔴4 | `@google/genai` + clé API exposée | ✅ Corrigé | Dépendance absente de `package.json`, aucune référence résiduelle |
| 🔴5 | `strict: false` dans tsconfig | ✅ Corrigé | `strict: true` actif, `npx vite build` passe sans erreur TS |
| 🟠6 | Pas de `schemaVersion` / migration | ✅ Corrigé | `core/migrations.ts` + `CURRENT_SCHEMA_VERSION` câblés de bout en bout (export, import, `localStorage`) |
| 🟠7 | Sauvegarde de session sans debounce | ✅ Corrigé | Debounce 400 ms dans `App.tsx`, sauvegarde immédiate forcée à la fermeture de séance |
| 🟠8 | `html2canvas` en CDM, importmap | ✅ Corrigé | `html2canvas` en dépendance npm bundlée, importmap entièrement retiré de `index.html` |
| 🟠9 | Pas d'ESLint/Prettier | ✅ Corrigé | Configurés et fonctionnels — `npx eslint .` → **0 erreur** |
| 🟠10 | Zéro test | ✅ Corrigé | Fichiers de test, **tests tous validés** (`storage`, `validation`, `indexer`, `utils`) |
| 🟡11 | `user-scalable=no` | ✅ Corrigé | Retiré du viewport |
| 🟡12 | Icônes PWA en SVG uniquement | ✅ Corrigé | PNG 192/512 générés et déclarés dans le manifest |
| 🟡13 | IDs via `Date.now()` | ✅ Corrigé (entités persistées) | `crypto.randomUUID()` utilisé pour séances, programmes ; `Date.now()` restant est cantonné à des usages non persistés (timers, clés React) — non problématique |
| 🟡14 | SRI sur scripts CDN restants | ⚠️ Sans objet | Plus aucun script CDN externe après migration — point caduc |

**Verdict : les 5 points 🔴 et les 5 points 🟠 sont traités, vérifiés par exécution réelle (build/lint/test), pas seulement par lecture du code.** Le patch est solide et bien fait — rien à reprendre sur ce périmètre.

---

## Partie 2 — Feuille de route priorisée

Deux pistes distinctes : **Technique** (fiabilité/perf/stockage) et **Métier** (logiques sport, visualisation, personnalisation).

### Phase A — Corrections rapides (v4.0.5 - 100% Terminé ✅)

**Technique**

- [x] 1. **Lazy-load `AnalyticsView`** dans `App.tsx`, comme les autres vues. Gain : allégement du chunk principal au chargement initial. *(✅ Réalisé)*
- [x] 2. **`manualChunks` dans `vite.config.ts`** pour isoler Recharts et html2canvas dans leurs propres chunks et stabiliser le cache navigateur. *(✅ Réalisé)*
- [x] 3. **CI minimale (GitHub Actions)** : workflow qui lance `lint`, `test`, `build` sur chaque push/PR. *(✅ Réalisé)*
- [x] 4. **Config du bar/plateau modifiable** : `PLATES_AVAILABLE` et le poids de barre (`20kg`) configurables dans les Paramètres avec persistance locale et intégration aux calculateurs. *(✅ Réalisé)*

**Métier**

- [x] 5. **Formule 1RM alternative / moyenne de plusieurs formules.** Choix entre Wathen, Epley, Brzycki et Moyenne avec sélection dans les Paramètres et répercussion dans tous les calculs et vues. *(✅ Réalisé)*
- [x] 6. **Échauffement auto basé sur l'historique réel**, avec prise en compte du 1RM estimé récent et du dernier meilleur set de l'exercice (`generateWarmupSeries`), avec repli dynamique si pas d'historique. *(✅ Réalisé)*

---

### Phase B — Renforcements structurants (v4.0.6 ✅ 100% Terminé)

**Technique (v4.0.6-rc.1 ✅)**

- [x] 7. **Unité de mesure kg/lb configurable dans Settings**, propagée à tous les calculs (`calculate1RM`, plaques, historique, active workout, records PR, graphiques). *(✅ Réalisé)*
- [x] 8. **Sauvegarde différentielle / snapshot périodique automatique** en plus de l'export manuel JSON (3 derniers snapshots rotatifs automatiques, restaurables en 1 clic). *(✅ Réalisé)*
- [x] 9. **Nettoyage progressif des `any` restants**, typage strict TypeScript intégral sur le store, les hooks, les composants et les modules de calculs. *(✅ Réalisé)*
- [x] 10. **Compression / archivage de l'historique ancien.** Jauge de stockage `localStorage`, archivage assisté (+1, +2, +3 ans) avec export JSON dédié, purge assistée et outil de réimport/fusion sans doublons. *(✅ Réalisé)*

**Métier & Visualisation (v4.0.6 ✅)**

- [x] 11. **Export de séance multi-formats (Ticket thermique & Carte sociale façon Strava)** pour un partage et archivage optimal. *(✅ Réalisé)*
  - *Ticket PNG thermique* : Monospace stylisé, décomposition des séries, jauge d'intensité relative et détails techniques.
  - *Carte Sociale Strava* : Design moderne épuré haute résolution avec temps total, volume converti, séries validées, badge muscles et RPE.
- [x] 12. **Visualisation de répartition musculaire calendaire & Heatmap Annuelle 52 Semaines** : *(✅ Réalisé)*
  - Indicateur segmenté multicolore par jour calculant le volume de séries par groupe musculaire dans le calendrier.
  - Matrice dynamique 52 semaines (364 jours) dans l'onglet Analytics avec bascule Séries / Volume, filtres par groupe musculaire et calcul des séries consécutives (*streaks*).
- [x] 13. **Journal de mensurations corporelles & suivi visuel de morphologie.** *(✅ Réalisé)*
  - Outil autonome pour enregistrer poids, tour de taille, bras, poitrine, cuisses, mollets, masse grasse et notes indépendamment des séances.
  - Remplacement de la double saisie dans la séance en cours par un raccourci direct (`Shortcut` SVG).
  - Migration automatique transparente des pesées historiques lors de l'initialisation de l'application et prise en compte dans les calculs d'Analytics (SBD).

---

### Phase C — Ambitieux (⏳ À venir)

**Technique**

- [ ] 14. **Migration IndexedDB en option pour les gros historiques.** Backend de stockage IndexedDB avec migration automatique depuis `localStorage` si le volume de données augmente fortement.
- [ ] 15. **Web Worker dédié pour l'indexation lourde** (`indexer.calculateDashboardStats`, calculs analytics sur de très gros historiques).

**Métier**

- [ ] 16. **Supersets / circuits dans l'éditeur de programme.** Le modèle de données actuel (`ProgramSession.exos`) est une liste plate d'exercices indépendants ; il n'existe aucune notion de groupement (superset, circuit, tri-set), pourtant très demandée en hypertrophie/PPL. Ajouter un champ de groupement optionnel (ex. `supersetGroupId`) sans casser l'existant.
  - Extension rétrocompatible du modèle de session (`supersetGroupId`).
  - Orchestration intelligente du chronomètre de repos (alternance directe A1 $\rightarrow$ A2 puis repos complet).
  - Regroupement visuel fluide dans l'éditeur de programme et la séance active.
- [ ] 17. **Objectifs et périodisation légère.** Suivi d'objectif par exercice (cible + échéance + suivi automatique via l'historique déjà présent) pour exploiter des données déjà collectées sans nouvelle saisie lourde.
  - Définition d'objectifs précis par exercice (charge cible, répétitions, 1RM visé ou volume hebdomadaire avec date butoir).
  - Traçage automatique de la trajectoire d'atteinte basé sur les performances réelles.
- [ ] 18. **Suggestions de programmation progressive (auto-régulation).** Suggestions de charge pour la prochaine séance basées sur RIR/RPE réel vs cible des dernières séances (logique locale).
  - Analyse algorithmique locale du RIR / RPE effectif sur les dernières séances pour recommander la charge de travail optimale de la séance suivante.
  - Détection automatique de stagnation et proposition de cycles de décharge (*deload* planifié).
- [ ] 19. **Bibliothèque d'exercices enrichie : variantes et exercices liés.** Champ `relatedExerciseIds` permettant des suggestions de rotation d'exercice pour casser un plateau.
  - Liens de parenté entre mouvements de base et variantes (angle, matériel, isolation).
  - Fonction de substitution d'exercice en direct pendant l'entraînement en cas de matériel indisponible.
  - Recommandations intelligentes de rotation d'exercices pour relancer la progression.
