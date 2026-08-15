# ATLAS

ATLAS 1.1 RC2 est une préproduction privée d’assistance conversationnelle et émotionnelle gouvernée. Cette branche réunit le socle fonctionnel V4, l’expérience visuelle procédurale Presence V6 et le contrôle de lancement dans une application Next.js unique.

## Périmètre testable

- Séquence d’ouverture ATLAS Awakening procédurale, adaptative, contournable et sans image ni vidéo préinstallée.
- Site de présentation responsive et salon conversationnel procédural.
- Conversation locale, détection de sécurité prioritaire et continuité de session signée.
- IA externe facultative, désactivée sans consentement explicite et sans conservation chez le fournisseur.
- Voix locale du navigateur, mode calme et qualité visuelle adaptée au terminal.
- Comptes, espaces professionnels, administration agrégée et PostgreSQL lorsqu’ils sont configurés ; variantes de test en mode laboratoire.
- E-mail transactionnel via Brevo, avec Resend en repli, et mode sandbox Brevo.
- Stripe et PayPal strictement limités au sandbox tant que les preuves de lancement et l’autorisation explicite ne sont pas présentes.
- Google Analytics, Google Ads et Meta Pixel chargés uniquement après consentement de leur catégorie et uniquement si leurs identifiants sont configurés.
- Endpoints distincts de vie (`/api/health`) et de capacité (`/api/readiness`).
- Console de lancement admin affichant les contrôles satisfaits, les blockers et le responsable de chaque preuve.

## Démarrage local

Prérequis : Node.js 24.

```bash
npm ci
npm run check
npm run dev
```

Copier `.env.example` vers `.env.local` pour activer les intégrations voulues. Les secrets restent côté serveur ; les seuls identifiants publics sont les identifiants optionnels de mesure et de marketing.

## Contrôles de livraison

`npm run check` vérifie l’architecture, les invariants de sécurité, les moteurs conversationnels et de gouvernance, la continuité signée, le routage de modèles, le contrôle de lancement, les types TypeScript et le build de production.

Le détail de la dernière recette se trouve dans `QUALITY_REPORT.md`. Le runbook de préproduction est dans `docs/ATLAS_PREPRODUCTION_RUNBOOK.md`. Les décisions et données que seul le fondateur peut fournir sont regroupées dans `docs/ATLAS-OWNER-INPUTS.md`.

## Limites assumées

Cette version est faite pour une recette privée, pas pour une ouverture commerciale immédiate. La mémoire durable consentie, les actions externes automatiques, les paiements réels et le relais humain opérationnel restent désactivés ou soumis à preuve. Une mise en production publique exige encore les validations juridiques, cliniques, sécurité, confidentialité, accessibilité multi-appareils et exploitation prévues par le contrat de complétude du projet.
