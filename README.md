# IronTracker

Application Progressive Web App (PWA) de suivi de performance pour la musculation et la force athlétique, conçue selon les principes **Local-First**, **zéro tracking** et **haute vélocité de saisie**.

---

## 1. Vue d'ensemble

IronTracker remplace les carnets d'entraînement papier et les feuilles de calcul complexes par une interface sombre sobre, réactive et ergonomique, optimisée pour une utilisation directe en salle de sport, y compris hors-ligne.

- **Architecture Local-First** : Vos données vous appartiennent. Aucune création de compte obligatoire, aucun serveur distant, stockage local sécurisé avec sauvegardes automatiques.
- **Conformité & Intégrité** : Validation stricte des schémas de données, migrations automatiques de versions et export universel JSON / CSV.
- **Zéro latence** : Indexation instantanée, calculs de charges et records en temps réel O(N).

---

## 2. Fonctionnalités Principales

### Suivi de Séance en Direct
- **Saisie Rapide des Séries** : Répétitions, charges, statuts (Validée, Échauffement, Drop Set, Échec), indices RPE et RIR (*Reps in Reserve*).
- **Chronomètre de Repos Flottant** : Overlay persistant permettant de naviguer dans l'application pendant le décompte du repos.
- **Rappels Visuels de Performance** : Affichage côte à côte des charges et répétitions de la séance précédente pour chaque exercice.
- **Échauffement Intelligent** : Génération automatique des paliers de montée en gamme basée sur votre historique réel et vos 1RM estimés.
- **Calculateur de Disques** : Répartition visuelle instantanée des disques de fonte à charger sur la barre, selon votre configuration de matériel personnalisée.
- **Sélection de Formules 1RM** : Choix entre les formules éprouvées (*Wathen, Epley, Brzycki, ou Moyenne*).
- **Raccourci Morphologique** : Bouton rapide vers le journal de mensurations directement depuis la séance.

### Journal de Bord & Historique (History Hub)
- **Calendrier Visuel & Heatmap** : Consultation des séances passées avec jauges segmentées par groupe musculaire et indicateurs de fatigue.
- **Journal de Mensurations Corporelles** : Suivi dédié et autonome du poids, du tour de taille, des bras, de la poitrine, des cuisses, des mollets et du taux de masse grasse.
- **Tableau des Records Personnels (PR)** : Records absolus et par tranche de répétitions (1RM, 3RM, 5RM, 10RM) pour chaque mouvement.
- **Carnet de Notes** : Prise de notes libres par séance et annotations techniques.
- **Partage Social & Export Graphique** :
  - **Ticket Thermique** : Récapitulatif technique façon ticket de caisse vintage.
  - **Carte Sociale Moderne** : Rendu graphique haute définition (tonnage, séries, durée, muscles, RPE) prêt pour le partage ou l'archivage.

### Statistiques & Analytics
- **Heatmap de Régularité Annuelle (52 Semaines)** : Grille dynamique façon GitHub avec bascule Séries / Volume, filtres par groupe musculaire et calcul des séries consécutives (*streaks*).
- **Radar de Force Relative (SBD)** : Comparaison des max estimés (Squat, Développé couché, Soulevé de terre) aux standards internationaux rapportés au poids de corps.
- **Volume & Fatigue** : Graphiques d'évolution du tonnage hebdomadaire, du nombre de séries effectives et du niveau d'effort moyen.
- **Distribution du Matériel** : Répartition des sollicitations par équipement (Barre, Haltères, Machines, Câbles, Poids de corps).

### Bibliothèque d'Exercices & Programmes
- **Catalogue Exhaustif** : Plus de 80 exercices pré-configurés avec instructions techniques (Setup, Exécution, Erreurs à éviter).
- **Création & Personnalisation** : Ajout d'exercices personnalisés, favoris et archivage.
- **Éditeur de Programmes** : Création de routines sur mesure (PPL, Half Body, Full Body, Split) avec clonage et ordonnancement fluide.

### Sécurité & Gestion des Données
- **Support Universel des Unités** : Bascule complète `kg` ou `lbs` avec adaptation automatique des barres et disques.
- **Snapshots de Sécurité Automatiques** : Sauvegardes rotatives en arrière-plan (3 derniers points de restauration) restaurables en un clic.
- **Archivage & Purge Assistée** : Diagnostic du stockage local, export d'archives pour les historiques anciens et purge sans perte de données.
- **Import / Export Multi-formats** : Sauvegarde JSON complète, export CSV pour tableurs, et réintégration avec détection de doublons.

---

## 3. Code Couleur des Groupes Musculaires

Pour assurer une cohérence visuelle immédiate entre les graphiques, le calendrier, la heatmap et les cartes de séances, chaque groupe musculaire utilise une couleur dédiée :

- 🔴 **Pectoraux** (`#ef4444` - Rouge vif)
- 🔵 **Dos** (`#3b82f6` - Bleu)
- 🟢 **Quadriceps** (`#10b981` - Émeraude)
- 🟠 **Ischios** (`#f97316` - Orange)
- 🟣 **Fessiers** (`#a855f7` - Violet)
- 🟡 **Épaules** (`#eab308` - Jaune ambré)
- 🟣 **Bras** (`#8b5cf6` - Indigo)
- ⚪ **Abdos** (`#06b6d4` - Cyan)
- 🔘 **Mollets** (`#14b8a6` - Turquoise)
- 🔘 **Cardio / Statique / Autre** (`#64748b` - Ardoise neutre)

---

## 4. Stack Technique

- **Interface** : React 18, TypeScript, Tailwind CSS
- **État Global** : Zustand (avec persistance atomique)
- **Visualisation de Données** : Recharts, D3
- **Rendu Graphique / Export** : html2canvas-pro
- **Optimisation & Build** : Vite 6, Rollup (code-splitting ciblé)
- **Typographie** : Inter & JetBrains Mono (embarquées localement via Fontsource)
- **Qualité & Tests** : Vitest, ESLint, TypeScript Strict Mode, GitHub Actions CI

---

## 5. Feuille de Route — Prochaines Évolutions (Phase C)

- [ ] **Supersets & Circuits** : Prise en charge des séries groupées dans l'éditeur de programme et gestion intelligente des temps de repos alternés.
- [ ] **Objectifs & Périodisation Légère** : Suivi de trajectoires de charges cibles et échéances par exercice.
- [ ] **Suggestions de Progression (Auto-régulation)** : Recommandation algorithmique locale de charges basée sur le RIR réel des séances précédentes.
- [ ] **Exercices Liés & Variantes** : Suggestions de mouvements alternatifs en cas de matériel indisponible ou pour relancer la progression.
- [ ] **Moteur IndexedDB Optionnel** : Migration assistée pour les historiques volumineux (plusieurs années d'entraînement intensif).
- [ ] **Indexation en Arrière-plan (Web Worker)** : Déport des calculs analytiques lourds hors du thread principal.

---

## 6. Installation & Développement

```bash
# 1. Cloner le projet
git clone https://github.com/votre-compte/irontracker.git

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement local
npm run dev

# 4. Lancer les tests et le linter
npm test
npm run lint

# 5. Compiler pour la production
npm run build
```
