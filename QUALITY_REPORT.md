# ATLAS — Rapport de recette privée RC2

Date de recette : 15 août 2026

Cible : branche `build/atlas-v5-web-experience`

Verdict : **candidate RC2 validée pour une preview privée de test**. La production publique reste volontairement bloquée jusqu’à la fermeture documentée de toutes les portes de lancement.

## Périmètre livré

- Socle fonctionnel V4 : orchestration locale, politique, sécurité, critique de réponse, intelligence émotionnelle et routage de modèles.
- Expérience Presence V6 : présence volumétrique et fragments WebGL2 procéduraux, synchronisés avec les états écoute, réflexion, réponse et calme, avec repli sans WebGL.
- Séquence ATLAS Awakening procédurale sur l’accueil uniquement, contournable, adaptée aux visites suivantes et aux préférences de mouvements réduits.
- Salon utilisable au clavier : focus contenu dans les panneaux, fermeture par Échap, restitution du focus et annonces d’état.
- Conversation locale immédiatement testable ; IA externe uniquement après consentement explicite et configuration serveur.
- Continuité de session signée lorsqu’un secret serveur robuste est configuré ; aucun texte émotionnel brut dans le schéma de persistance ou les journaux d’administration.
- Comptes, espaces professionnels et administration agrégée avec PostgreSQL, ou scénarios isolés en mode laboratoire.
- E-mail transactionnel Brevo avec Resend en repli et mode sandbox pour les recettes sans livraison réelle.
- Paiements strictement sandbox ; checkout de production bloqué par politique, configuration et preuves de readiness.
- Gestion séparée du consentement analytics et marketing. Aucun script Google ou Meta n’est chargé par défaut.
- Endpoints `/api/health` pour la vie du processus et `/api/readiness` pour les capacités et portes de lancement réellement satisfaites.
- Console d’administration enrichie : phase, progression, blockers, catégories et propriétaire attendu de chaque preuve.
- Dossier fondateur centralisé dans `docs/ATLAS-OWNER-INPUTS.md` afin qu’aucune donnée juridique, commerciale ou de sécurité ne soit inventée.

## Contrôles automatisés

La commande `npm run check` vérifie de bout en bout avec Node.js 24 :

- validation de l’architecture visuelle procédurale ;
- invariants de sécurité serveur ;
- tests runtime, sécurité et gouvernance ;
- tests du cœur conversationnel, de la continuité et de l’intelligence émotionnelle ;
- tests V4 d’autonomie bornée, politique, sécurité et critique ;
- tests du routage de modèles ;
- tests du contrôle de lancement et de ses conditions par public ;
- compilation TypeScript sans erreur ;
- build de production Next.js, pages statiques et routes dynamiques.

Le Quality Gate GitHub du 15 août 2026 a validé l’installation, l’architecture, la sécurité, l’ensemble des tests, les types et le build de production. Le build Vercel correspondant compile 22 routes avec Next.js 16.3.0. L’installation Vercel déclare 0 vulnérabilité npm connue.

## Recette de la preview Vercel

- preview protégée par Vercel Authentication ;
- production inchangée ;
- accueil servi avec un statut HTTP 200 via le lien de partage protégé ;
- métadonnées `noindex`, `nofollow` et en-tête `X-Robots-Tag: noindex` présents ;
- en-têtes de sécurité actifs : HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, politique de permissions et politique d’ouverture inter-origines ;
- ATLAS Awakening présent sur l’accueil et explicitement absent des autres routes au niveau du composant ;
- aucune erreur, alerte ou erreur fatale observée dans les logs runtime de la candidate après déploiement.

## Portes de lancement

La préparation publique est désormais calculée par `lib/atlas/launch-control.ts`. Une moyenne ne peut pas compenser une absence critique : chaque contrôle obligatoire doit être satisfait et appuyé par une preuve datée.

La cible initiale est **adultes · France**. Les univers adolescents et seniors restent des capacités produit présentées dans la vision, mais leur activation publique est conditionnée à leurs validations dédiées. Les paiements réels restent optionnels et bloqués tant qu’ils ne sont pas explicitement demandés et entièrement configurés.

## Limites et responsabilités externes

Cette validation autorise une recette privée, pas une affirmation de complétude absolue ni une ouverture commerciale immédiate. Restent nécessaires avant ouverture publique : identité juridique et textes contractuels définitifs, contacts publics, domaine définitif, secrets d’infrastructure saisis directement dans Vercel, validation clinique indépendante, revue RGPD, audit sécurité externe, recette d’accessibilité et visuelle sur appareils physiques, stratégie de sauvegarde et reprise, alertes d’exploitation, support humain réel et décision formelle de lancement.

La mémoire durable consentie, les actions externes automatiques, le commerce réel et l’auto-déploiement restent désactivés ou soumis à preuve. Aucun indicateur de readiness ne doit être forcé à `true` sans élément vérifiable.
