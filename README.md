# IronTracker

![Version](https://img.shields.io/badge/version-4.0.0-blue.svg?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb.svg?style=flat-square)
![Status](https://img.shields.io/badge/Status-Stable-success.svg?style=flat-square)

**Application Progressive Web App (PWA) dédiée au suivi de performance en force athlétique et musculation.**

IronTracker est conçu pour remplacer le carnet papier et les tableurs complexes. L'application privilégie la rapidité d'exécution en salle, l'autonomie des données (Local-First) et une interface utilisateur minimaliste optimisée pour les environnements sombres.

## 🚀 Release Notes v4.0.0 (Genesis Update)

Cette version majeure introduit une refonte complète de l'architecture et de l'interface utilisateur.

- **Architecture Modulaire :** Transition vers une structure "Feature-Based" (Core, Features, Components) pour une maintenabilité accrue et un chargement optimisé (Lazy Loading).
- **Soft Geometry UI :** Adoption du design system "Nested Corners" (32px > 16px > 8px) pour une interface plus organique et fluide.
- **Performance Engine :** Réécriture des algorithmes de calcul de statistiques (passage de O(N²) à O(N)) et virtualisation des listes (Records, Library, History) pour une fluidité parfaite même avec des milliers de données.
- **History Hub :** Nouvelle vue centralisée regroupant le Calendrier, les Notes et les Records.
- **PWA Level Up :** Stratégie de cache "Network First" optimisée pour le offline, gestion avancée du cycle de vie (installation, mises à jour).

## Fonctionnalités

### Suivi d'Entraînement

- **Mode Session Active :** Interface optimisée pour la saisie rapide des séries, répétitions, charges et RPE (Rate of Perceived Exertion).
- **Chronomètre de Repos Intelligent :** Système d'overlay global permettant de naviguer dans l'application tout en gardant un œil sur le temps de repos.
- **Calculateur de Plaques :** Outil intégré pour calculer instantanément la répartition des disques sur la barre.
- **Échauffement Automatique :** Génération intelligente de séries de montée en gamme (Warm-up) basées sur la charge de travail historique.
- **Feedback Immédiat :** Comparaison en temps réel avec les performances de la séance précédente (Volume, 1RM estimé) via des indicateurs de tendance.

### Coach Virtuel & Insights

- **Carousel Intelligent :** Analyse en temps réel de votre semaine d'entraînement.
- **Détection de Déséquilibres :** Alerte sur les ratios Agonistes/Antagonistes (ex: Trop de Push, pas assez de Pull).
- **Surveillance de Volume :** Notification en cas de sous-dosage d'un groupe musculaire majeur (< 10 sets/semaine).

### Gestion des Programmes

- **Éditeur de Programmes :** Création et modification complète de routines d'entraînement (Split, Full Body, PPL).
- **Système de Session :** Organisation des exercices, définition des temps de repos cibles et des objectifs de RIR (Reps in Reserve).
- **Duplication :** Fonctionnalité de clonage pour créer rapidement des variantes de programmes existants.
- **Prévisualisation :** Consultation du contenu d'une séance avant son lancement.

### Bibliothèque d'Exercices

- **Base de Données Complète :** Plus de 80 exercices pré-configurés incluant des instructions techniques (Setup, Exécution, Erreurs à éviter).
- **Catégorisation Avancée :** Filtrage par groupe musculaire, type d'exercice (Polyarticulaire, Isolation, Cardio, Statique) et équipement.
- **Personnalisation :** Possibilité d'ajouter, de modifier, de mettre en favori et d'archiver des exercices personnalisés.

### Analyse et Performance

- **Tableau de Bord (Dashboard) :** Vue d'ensemble de l'activité hebdomadaire avec graphiques de volume et suggestions intelligentes de séance (Smart Start).
- **Standards de Force (SBD) :** Radar de performance comparant les max estimés (Squat, Bench, Deadlift) aux standards de force internationaux relatifs au poids de corps.
- **Graphiques de Progression :** Visualisation de l'évolution du 1RM estimé, du volume et du tonnage sur différentes périodes (7, 30, 90 jours).
- **Analyse de Répartition :** Diagrammes circulaires et histogrammes pour analyser l'équilibre musculaire et l'utilisation du matériel.

### Historique et Données

- **History Hub :** Centralisation des journaux d'entraînement avec une vue calendrier interactive et des indicateurs visuels de fatigue.
- **Ticket de Séance (Sharing) :** Génération d'une image récapitulative "Receipt style" pour partager ses perfs sur les réseaux sociaux.
- **Souveraineté des Données :** Export complet des données au format JSON (Backup) et CSV (compatible Excel/Tableurs).

## Stack Technique

L'architecture technique privilégie la performance instantanée et la robustesse.

- **Framework :** React 18 + Vite
- **Langage :** TypeScript
- **Gestion d'État :** Zustand
- **Styling :** TailwindCSS
- **Visualisation :** Recharts
- **Persistance :** LocalStorage + LZ-String

## Architecture du Projet

Le code suit une architecture modulaire par fonctionnalités ("Feature-Based") :

- `core/` : Logique métier agnostique, types, constantes et utilitaires purs.
- `features/` : Modules autonomes (Dashboard, Workout, Analytics, History...) contenant leurs propres composants et hooks.
- `components/` : Bibliothèque de composants UI réutilisables.
- `services/` : Couches d'abstraction pour le stockage et l'indexation.

## Installation

Pour exécuter le projet localement :

1.  Cloner le dépôt :

    ```bash
    git clone https://github.com/votre-username/irontracker.git
    ```

2.  Installer les dépendances :

    ```bash
    npm install
    ```

3.  Lancer le serveur de développement :

    ```bash
    npm run dev
    ```

4.  Construire pour la production :
    ```bash
    npm run build
    ```
