# ATLAS — Rapport de recette privée RC2

Date de recette : 15 août 2026

Cible : branche `build/atlas-v5-web-experience`

Verdict mis à jour : **ATLAS 1.1.0-rc.2 est validée localement comme candidate à une preview privée configurée**. Le déploiement transmis par l’utilisateur n’embarque pas encore ces corrections et n’est pas prêt pour un lancement public. Le rapport détaillé `ATLAS_AUDIT_2026-08-15.md` fait foi.

## Périmètre livré

- Socle fonctionnel V4 : orchestration locale, politique, sécurité, critique de réponse, intelligence émotionnelle et routage de modèles.
- Expérience Presence V6 : présence volumétrique et fragments WebGL2 procéduraux, synchronisés avec les états écoute, réflexion, réponse et calme, avec repli sans WebGL.
- Séquence ATLAS Awakening procédurale sur l’accueil uniquement, contournable, adaptée aux visites suivantes et aux préférences de mouvements réduits.
- Salon utilisable au clavier : focus contenu dans les panneaux, fermeture par Échap, restitution du focus et annonces d’état.
- Conversation locale immédiatement testable ; IA externe uniquement après consentement explicite et configuration serveur.
- Continuité de session signée lorsqu’un secret serveur robuste est configuré ; aucun texte émotionnel brut dans le schéma de persistance ou les journaux d’administration.
- Identités de démonstration strictement limitées aux previews Vercel protégées et aux tests locaux explicitement activés ; elles restent indisponibles en production.
- Comptes, espaces professionnels et administration agrégée avec PostgreSQL, ou scénarios isolés en mode laboratoire.
- E-mail transactionnel Brevo avec Resend en repli, idempotence et mode sandbox pour les recettes sans livraison réelle.
- Paiements strictement sandbox ; checkout de production bloqué par politique, configuration et preuves de readiness.
- Gestion séparée du consentement analytics et marketing. Aucun script Google ou Meta n’est chargé par défaut.
- Endpoints `/api/health` pour la vie du processus et `/api/readiness` pour les capacités et portes de lancement réellement satisfaites.
- Console d’administration enrichie : phase, progression, blockers, catégories et propriétaire attendu de chaque preuve.
- Profil juridique centralisé et piloté par configuration : identité, contacts, hébergement et versions contractuelles alimentent automatiquement les pages légales et le contrôle de lancement.
- Ressources d’urgence France associées à une source officielle et une date de vérification dans le code.
- Dossier fondateur centralisé dans `docs/ATLAS-OWNER-INPUTS.md` afin qu’aucune donnée juridique, commerciale ou de sécurité ne soit inventée.

## Contrôles automatisés

La commande `npm run check` vérifie de bout en bout avec Node.js 24 :

- validation de l’architecture visuelle procédurale ;
- 34 invariants de sécurité serveur ;
- tests runtime, sécurité et gouvernance ;
- tests du cœur conversationnel, de la continuité et de l’intelligence émotionnelle ;
- tests V4 d’autonomie bornée, politique, sécurité et critique ;
- tests du routage de modèles ;
- tests du contrôle de lancement et de ses conditions par public ;
- tests du profil juridique et de la complétude des informations publiques ;
- tests des ressources d’urgence françaises, de leur unicité, de leurs sources et de leur date de vérification ;
- compilation TypeScript sans erreur ;
- build de production Next.js, pages statiques et routes dynamiques.

Le workflow `ATLAS Quality Gate` exécute cette chaîne sur Node.js 24 avec `npm ci`. Le build Vercel utilise Next.js 16.3.0 et l’installation contrôlée déclare 0 vulnérabilité npm connue.

## Recette de la preview Vercel

- URL transmise accessible et production inchangée ;
- continuité conversationnelle absente sur ce déploiement, défaut reproduit puis corrigé dans la candidate 1.1.0-rc.2 ;
- build Next.js et TypeScript réussis ;
- ensemble des routes statiques et dynamiques compilé ;
- métadonnées `noindex`, `nofollow` et en-tête `X-Robots-Tag: noindex` présents ;
- en-têtes de sécurité actifs : HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, politique de permissions et politique d’ouverture inter-origines ;
- ATLAS Awakening présent sur l’accueil et explicitement absent des autres routes au niveau du composant ;
- aucune erreur, alerte ou erreur fatale observée dans les logs runtime de la candidate après déploiement.

## Portes de lancement

La préparation publique est calculée par `lib/atlas/launch-control.ts`. Une moyenne ne peut pas compenser une absence critique : chaque contrôle obligatoire doit être satisfait et appuyé par une preuve datée.

La cible initiale est **adultes · France**. Les univers adolescents et seniors restent des capacités produit présentées dans la vision, mais leur activation publique est conditionnée à leurs validations dédiées. Les paiements réels restent optionnels et bloqués tant qu’ils ne sont pas explicitement demandés et entièrement configurés.

Les pages `/mentions-legales`, `/conditions` et `/confidentialite` utilisent le profil juridique configuré. En l’absence d’une donnée validée, elles affichent explicitement un état de préproduction au lieu d’inventer une information.

## Limites et responsabilités externes

Cette validation autorise une recette privée, pas une affirmation de complétude absolue ni une ouverture commerciale immédiate. Restent nécessaires avant ouverture publique : identité juridique et textes contractuels définitifs, contacts publics, domaine définitif, secrets d’infrastructure saisis directement dans Vercel, validation clinique indépendante, revue RGPD, audit sécurité externe, recette d’accessibilité et visuelle sur appareils physiques, stratégie de sauvegarde et reprise, alertes d’exploitation, support humain réel et décision formelle de lancement.

La mémoire durable consentie, les actions externes automatiques, le commerce réel et l’auto-déploiement restent désactivés ou soumis à preuve. Aucun indicateur de readiness ne doit être forcé à `true` sans élément vérifiable.
