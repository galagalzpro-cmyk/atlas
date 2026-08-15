# ATLAS — Rapport de recette privée

Date de recette : 13 août 2026

Cible : branche `build/atlas-v5-web-experience`

Verdict : **candidate validée pour une preview privée de test**. La production publique reste volontairement bloquée.

## Périmètre livré

- Socle fonctionnel V4 : orchestration locale, politique, sécurité, critique de réponse et routage de modèles.
- Expérience Presence V6 : visage volumétrique et fragments WebGL2 procéduraux, synchronisés avec les états écoute, réflexion, réponse et calme ; repli sans WebGL.
- Salon utilisable au clavier : focus contenu dans les panneaux, fermeture par Échap, restitution du focus et annonces d’état.
- Conversation locale immédiatement testable ; IA externe uniquement après consentement explicite et configuration serveur.
- Continuité de session signée lorsqu’un secret serveur est configuré ; aucun texte émotionnel brut dans le schéma de persistance ou les journaux d’administration.
- Comptes, espaces professionnels et administration agrégée avec PostgreSQL, ou scénarios isolés en mode test.
- Paiements strictement sandbox ; checkout de production bloqué par politique et preuves de readiness.
- Gestion séparée du consentement analytics et marketing. Aucun script Google ou Meta n’est chargé par défaut.
- Endpoints `/api/health` (vie du processus) et `/api/readiness` (capacités réellement disponibles).

## Contrôles automatisés

La commande `npm run check` est réussie de bout en bout avec Node.js 24 :

- validation d’architecture sur 58 sources visuelles ;
- 30 invariants de sécurité serveur ;
- tests runtime, sécurité et gouvernance ;
- tests du cœur conversationnel, de la continuité et de l’intelligence émotionnelle ;
- tests V4 d’autonomie bornée, politique, sécurité et critique ;
- tests de routage des modèles ;
- compilation TypeScript sans erreur ;
- build de production Next.js réussi, 22 pages générées et routes dynamiques compilées.

L’application a été mise à niveau de Next.js 16.2.12 vers 16.3.0. `npm audit --omit=dev --audit-level=high` retourne **0 vulnérabilité connue** ; les versions transitives vérifiées sont PostCSS 8.5.23 et Sharp 0.35.3.

## Recette HTTP de production locale

- 12 pages critiques chargées avec un statut 200 et un marqueur ATLAS valide : accueil, expérience, architecture, confiance, protection, offres, publics, à propos, confidentialité, mentions légales, conversation et connexion.
- `GET /api/health` : 200, `status: ok`, réponse non mise en cache et sans fuite de configuration.
- `HEAD /api/health` : 200, corps vide.
- `GET /api/readiness` : 200, `functional-test-ready` dans l’environnement de recette.
- `POST /api/conversation` sans IA externe : 200 avec une réponse locale gouvernée.
- HTML initial : aucune ressource Google Tag Manager ou Meta chargée avant consentement.
- Journal du serveur de recette : démarrage propre, aucune erreur d’exécution observée.

## Revue React ciblée

- Les scripts tiers sont différés et montés conditionnellement après un choix enregistré.
- Le stockage local du consentement est versionné et limité à deux finalités.
- Les écouteurs globaux et le verrouillage du défilement sont nettoyés à la fermeture des panneaux.
- La qualité WebGL s’adapte aux préférences de mouvement réduit, à la mémoire, au nombre de cœurs et à la taille d’écran.

## Limites et portes de sortie

Cette validation autorise un test privé, pas une affirmation de complétude absolue. Restent nécessaires avant ouverture publique : identité juridique et textes contractuels définitifs, validation clinique indépendante, audit sécurité externe, recette d’accessibilité et visuelle sur appareils physiques, stratégie de sauvegarde et reprise, supervision d’exploitation, support humain réel et décision formelle d’activer les paiements de production.

La mémoire durable consentie, le Control Plane autonome, les actions externes automatiques et l’auto-déploiement ne sont pas présentés comme actifs. Ils restent des jalons séparés soumis au contrat de complétude et aux garde-fous du projet.
