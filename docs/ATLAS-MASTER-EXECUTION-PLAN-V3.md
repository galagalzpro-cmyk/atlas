# ATLAS — Plan directeur d’exécution V3

## Décision stratégique

ATLAS ne sera plus développé comme une accumulation de fonctionnalités. Le projet est recentré autour d’un noyau cognitif autonome, gouverné et mesurable.

L’objectif de la V3 est de construire une présence numérique émotionnellement intelligente capable de :

- comprendre le sens d’un message et son contexte ;
- maintenir plusieurs hypothèses au lieu d’imposer une lecture ;
- suivre l’évolution émotionnelle et relationnelle ;
- choisir une posture adaptée ;
- conserver une mémoire fiable et contrôlable ;
- produire une réponse, la critiquer puis la corriger si nécessaire ;
- utiliser des outils ou parcours adaptés lorsqu’ils apportent une valeur réelle ;
- évoluer par versions mesurées et réversibles.

## Architecture cible

```text
Entrée utilisateur
  ↓
Normalisation et compréhension linguistique
  ↓
Sécurité déterministe indépendante
  ↓
Mémoire structurée et contradictions
  ↓
Interprétation multi-hypothèses
  ↓
État émotionnel, relationnel et situationnel
  ↓
Modèle des besoins humains
  ↓
Décision autonome de posture
  ↓
Plan conversationnel invisible
  ↓
Génération gouvernée
  ↓
Critique : sécurité, continuité, naturel, autonomie, pertinence
  ↓
Correction bornée ou repli contextuel
  ↓
Réponse textuelle, vocale et adaptation de l’interface
  ↓
Mise à jour contrôlée de la mémoire et des métriques
```

## Phase 1 — Verrouiller le noyau cognitif

Livrables :

1. `atlas-core/state`
   - état émotionnel hypothétique ;
   - besoin humain ;
   - objectif de la personne ;
   - sujet principal et sujets secondaires ;
   - état relationnel ;
   - niveau de confiance ;
   - disponibilité à agir ;
   - tolérance aux questions ;
   - contraintes de sécurité.

2. `atlas-core/interpretation`
   - plusieurs hypothèses simultanées ;
   - justification interne ;
   - signaux contraires ;
   - niveau de confiance ;
   - révision après chaque réponse de la personne.

3. `atlas-core/memory`
   - faits de session ;
   - préférences ;
   - corrections ;
   - refus ;
   - sujets laissés de côté ;
   - questions déjà posées ;
   - contradictions ;
   - expiration et oubli ;
   - mémoire persistante uniquement avec consentement.

4. `atlas-core/planning`
   - objectif du tour ;
   - posture ;
   - profondeur ;
   - besoin de question ou non ;
   - action éventuelle ;
   - raison explicite de ne pas questionner ;
   - stratégie de réparation.

5. `atlas-core/critique`
   - continuité ;
   - non-répétition ;
   - adéquation émotionnelle ;
   - autonomie ;
   - sécurité ;
   - naturel ;
   - longueur ;
   - absence de pression ou dépendance.

Critère de sortie : le cœur peut expliquer techniquement pourquoi il choisit une posture, produire une réponse et la rejeter lui-même si elle ne respecte pas les règles.

## Phase 2 — Construire le modèle humain ATLAS

Créer une ontologie opérationnelle des besoins humains contemporains :

- être entendu ;
- être rassuré ;
- clarifier ;
- se protéger ;
- retrouver du contrôle ;
- décider ;
- agir ;
- se reposer ;
- poser une limite ;
- réparer une relation ;
- trouver du sens ;
- accéder à une ressource ;
- ne pas rester seul ;
- pouvoir parler sans solution immédiate.

Le modèle doit relier :

- émotions ;
- besoins ;
- contexte social ;
- âge et capacités ;
- contraintes matérielles ;
- trajectoire de conversation ;
- niveau d’énergie ;
- risques ;
- préférences de la personne.

Critère de sortie : ATLAS ne répond plus seulement à une émotion détectée, mais au besoin le plus probable en maintenant l’incertitude.

## Phase 3 — Créer les trois univers complets

### Adultes

- relations ;
- travail ;
- anxiété ;
- fatigue ;
- parentalité ;
- décisions ;
- finances ;
- solitude ;
- sens ;
- séparation et deuil.

### Adolescents

- identité ;
- école ;
- harcèlement ;
- famille ;
- amitiés ;
- réseaux sociaux ;
- image de soi ;
- sécurité ;
- langage non infantilisant.

### Seniors

- solitude ;
- deuil ;
- santé et autonomie sans diagnostic ;
- transitions de vie ;
- accessibilité ;
- voix ;
- rythme plus lent ;
- navigation simplifiée sans appauvrissement.

Critère de sortie : chaque univers possède ses propres parcours, exercices, sécurité, voix, rythme et interface. Aucun n’est une simple variante cosmétique.

## Phase 4 — Expérience vivante et multimodale

- streaming des réponses ;
- interruption vocale ;
- voix réactive ;
- transcription temporaire ;
- interface qui s’adapte sans manipuler ;
- environnement procédural ;
- modes faible puissance, silencieux et mouvements réduits ;
- accessibilité native ;
- continuité entre texte, voix et environnement.

Critère de sortie : la sophistication ne ralentit jamais l’accès au soutien.

## Phase 5 — Bibliothèque d’accompagnement

Modules gouvernés :

- respiration ;
- ancrage ;
- clarification émotionnelle ;
- préparation d’une conversation ;
- prise de décision ;
- journal guidé ;
- limites ;
- retour au calme ;
- sommeil et décompression ;
- parcours de compréhension ;
- ressources administratives ou sociales lorsque pertinentes.

Chaque module possède :

- indications ;
- contre-indications ;
- niveau de preuve ;
- durée ;
- possibilité d’arrêt ;
- adaptation par public ;
- critères d’évaluation.

## Phase 6 — Évaluation industrielle

Construire :

- 500 scénarios courts minimum ;
- 100 conversations longues minimum ;
- tests de contradictions ;
- tests de refus ;
- tests de rupture relationnelle ;
- tests de sécurité ;
- tests de dépendance et manipulation ;
- tests adolescents, adultes et seniors ;
- comparaisons entre versions ;
- tests de latence et charge ;
- notation automatique et humaine de référence.

Métriques protégées :

- sentiment d’être compris ;
- continuité ;
- pertinence ;
- réparation ;
- autonomie ;
- sécurité ;
- non-répétition ;
- accessibilité ;
- latence ;
- liberté de terminer l’échange.

## Phase 7 — Évolution continue gouvernée

ATLAS peut :

- détecter ses erreurs récurrentes ;
- proposer une amélioration ;
- générer une variante ;
- la tester hors production ;
- fonctionner en mode fantôme ;
- passer en canari ;
- être promu si les métriques progressent ;
- revenir automatiquement à la version précédente en cas de régression.

ATLAS ne peut pas :

- modifier librement son cœur de sécurité en production ;
- apprendre directement de données sensibles sans consentement ;
- déployer une version non évaluée ;
- sacrifier la sécurité pour l’engagement ou la rétention.

## Phase 8 — Lancement public

Ordre de lancement :

1. laboratoire interne ;
2. préproduction fermée ;
3. bêta contrôlée adultes France ;
4. ouverture adultes France ;
5. ouverture seniors après validation dédiée ;
6. ouverture adolescents après validation dédiée ;
7. extension géographique pays par pays.

Le produit n’est pas déclaré prêt sur la base d’un build. Le lancement exige :

- tests ;
- sécurité ;
- confidentialité ;
- accessibilité ;
- charge ;
- observabilité ;
- rollback ;
- ressources locales validées ;
- seuils conversationnels atteints.

## Priorité immédiate

Le premier chantier est la création du module `atlas-core/state` et du contrat de données commun à tous les moteurs. Tant que cet état central n’existe pas, la mémoire, l’émotion, la planification et l’évolution restent fragmentées.

## Règle de gouvernance

Le fondateur intervient sur la vision et les engagements majeurs. La direction opérationnelle choisit, exécute, teste et documente les décisions réversibles compatibles avec la vision.

Chaque progrès est qualifié précisément : conçu, implémenté, compilé, testé, déployé, évalué ou validé. Aucun de ces termes ne remplace les autres.
