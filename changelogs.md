# Changelog IronTracker

## [4.0.6-rc.2] - 2026-08-15
### Ajouts / Modifications (Phase B - Volet Métier & Visualisation)
- **Journal de Mensurations Corporelles & Suivi Morphologique (Point 13)** :
  - Outil autonome dédié aux mensurations corporelles (Poids, Tour de taille, Poitrine, Bras, Cuisses, Mollets, Masse grasse, Notes).
  - Modal dédiée (`BodyMeasurementsModal`) accessible depuis les Outils et intégrée dans l'interface d'entraînement active sous forme de raccourci ergonomique (`Shortcut` SVG).
  - Migration automatique rétrocompatible des anciennes pesées de séances vers le journal de mensurations au démarrage (`initData`).
  - Prise en compte prioritaire de la dernière pesée du journal de mensurations dans les calculs de ratios SBD (Squat / Bench / Deadlift) et les statistiques globales d'Analytics.
- **Partage Social & Export de Séance Multi-Formats (Point 11)** :
  - Double mode d'export visuel haute résolution : **Ticket de caisse thermique (Receipt)** et **Carte Sociale Moderne (façon Strava / Instagram)**.
  - Sélecteur de mode avec prévisualisation en temps réel avant capture.
  - Statistiques complètes intégrées : durée, volume total converti, séries validées, badge de complétion, RPE/fatigue et répartition des groupes musculaires travaillés.
  - Génération d'image PNG avec support du partage natif (`navigator.share`) ou téléchargement direct.
- **Visualisation de Distribution Musculaire dans le Calendrier (Point 12 / 18)** :
  - Jauge segmentée multicolore intégrée dans chaque cellule de jour du calendrier pour représenter la répartition des séries par groupe musculaire ou type d'effort.
  - Visualisation fluide et intuitive de l'équilibre musculaire au fil du mois.

## [4.0.6-rc.1] - 2026-08-15
### Ajouts / Modifications (Phase B - Volet Technique & Sécurité des Données)
- **Support Universel des Unités (kg / lbs)** :
  - Choix de l'unité de mesure dans les Paramètres (`kg` ou `lbs`), mémorisé de façon persistante.
  - Adaptation dynamique intelligente des disques disponibles (ex. 45, 35, 25 lbs vs 25, 20, 15 kg) et du poids par défaut de la barre (45 lbs / 20 kg).
  - Propagation dans toute l'application : séance active, historique des séances, consultation des records (PR), modales d'outils, graphiques d'évolution et calculateurs de disques.
- **Snapshots Automatiques de Sécurité** :
  - Sauvegardes rotatives en arrière-plan (max. 3 snapshots conservés localement sous format compressé).
  - Création déclenchée automatiquement lors de la fin d'une séance, avant une restauration, avant un reset ou avant un archivage (avec possibilité de créer des snapshots manuels).
  - Interface dédiée dans les Paramètres avec prévisualisation du contenu (nombre de séances et d'exercices), restauration en 1 clic et suppression sélective.
- **Archivage & Purge Assistée de l'Historique** :
  - Estimation et affichage en temps réel de l'espace de stockage `localStorage` consommé (Ko et pourcentage).
  - Filtrage des séances antérieures à 1, 2 ou 3 ans.
  - Export d'une archive autonome au format JSON et proposition de purge assistée pour libérer de l'espace.
  - Fonction de fusion et réintégration d'archive sans création de doublons.
- **Typage Strict TypeScript & Nettoyage de Code** :
  - Élimination intégrale des types `any` résiduels au profit de types génériques et d'interfaces strictes (`SetRecord`, `ExerciseStats`, `AutoSnapshot`, `OneRMFormula`, `WeightUnit`, etc.).
  - Résolution des warnings de clés React (clé composite unique sur le calendrier) et stabilisation des dépendances de hooks (`useCallback`, `useEffect`).

## [4.0.5] - 2026-08-12
### Ajouts / Modifications (Phase A - Performance & Métier)
- **Performance & Lazy-loading** :
  - Lazy loading de la vue `AnalyticsView` dans `App.tsx` pour alléger le bundle principal initial.
  - Configuration de `manualChunks` dans `vite.config.ts` (Recharts, html2canvas, vendors).
- **Intégration Continue (CI)** :
  - Mise en place du workflow GitHub Actions exécutant `lint`, `test` et `build`.
- **Personnalisation du Matériel** :
  - Configuration de la barre par défaut et des disques de fonte dans les Paramètres.
- **Formules 1RM Multiples** :
  - Intégration des formules Wathen, Epley, Brzycki et Moyenne avec sélection dans les Paramètres et répercussion immédiate dans les outils et les cartes d'exercices.
- **Échauffement Dynamique Intelligent** :
  - Calcul des paliers d'échauffement basé sur le 1RM historique récent et le dernier meilleur set enregistré, avec repli automatique sur la cible du jour.

## [4.0.4] - 2026-08-11
### Ajouts / Modifications (Initial Patch)
- **Vite & Optimisation du Bundle** : Configuration de `manualChunks` dans `vite.config.ts` pour isoler `recharts`, `html2canvas` et les librairies de base (vendor chunk), afin d'optimiser le cache du navigateur.
- **Intégration Continue (CI)** : Création d'un workflow GitHub Actions pour exécuter automatiquement le linter, les tests unitaires et le build sur chaque push et pull_request.
- **Configuration Matériel** : Possibilité de personnaliser le poids de la barre par défaut et les disques disponibles directement depuis la page des Paramètres (SettingsView).
  - Paramètres sauvegardés de manière persistante (localStorage) et dans le state global.
  - Calculateur de disques mis à jour pour prendre en compte ces nouveaux paramètres.
