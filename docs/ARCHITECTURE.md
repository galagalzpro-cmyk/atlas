# Architecture ATLAS ZERO

## Domaines de premier niveau

1. **Experience** — site public, onboarding, univers, navigation, accessibilité, responsive.
2. **Adaptive Engine** — état utilisateur, contexte, règles, décisions, recomposition temps réel.
3. **Generative Engine** — texte, image, son, scène, animation et représentation procédurale.
4. **Scenario Engine** — scénarios, événements, transitions, objectifs, bifurcations et reprise.
5. **Identity & Organizations** — comptes, rôles, cabinets, entreprises, équipes et permissions.
6. **Commerce** — offres, abonnements, facturation, paiements, remboursements et droits d’accès.
7. **Data & Memory** — consentement, profils, mémoire autorisée, rétention, suppression et export.
8. **Analytics & Growth** — attribution, événements, campagnes, pixels, CRM, expérimentation et reporting.
9. **Trust & Safety** — filtrage, urgence, audit, journalisation, gouvernance et conformité.
10. **Operations** — observabilité, coûts, incidents, support, sauvegarde, reprise et administration.

## Règle d’architecture

Aucun domaine ne doit dépendre directement de l’interface. Les décisions métier passent par des contrats explicites, des événements versionnés et des adaptateurs remplaçables.

## Définition de terminé

Une capacité est terminée uniquement lorsque sont validés : contrat fonctionnel, modèle de données, logique métier, sécurité, erreurs, tests, performance, accessibilité, observabilité, documentation, procédure de repli et rollback.
