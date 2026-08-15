# ATLAS

ATLAS est une préproduction privée d’assistance conversationnelle et émotionnelle gouvernée. Cette branche réunit le socle fonctionnel V4 et l’expérience visuelle procédurale Presence V6 dans une application Next.js unique.

## Périmètre testable

- Site de présentation responsive et salon conversationnel procédural sans image ni vidéo préinstallée.
- Conversation locale, détection de sécurité prioritaire et continuité de session signée.
- IA externe facultative, désactivée sans consentement explicite et sans conservation chez le fournisseur.
- Voix locale du navigateur, mode calme et qualité visuelle adaptée au terminal.
- Comptes, espaces professionnels, administration agrégée et PostgreSQL lorsqu’ils sont configurés ; variantes de test en mode laboratoire.
- Stripe et PayPal strictement limités au sandbox.
- Google Analytics, Google Ads et Meta Pixel chargés uniquement après consentement de leur catégorie et uniquement si leurs identifiants sont configurés.
- Endpoints distincts de vie (`/api/health`) et de capacité (`/api/readiness`).

## Démarrage local

Prérequis : Node.js 24.

```bash
npm install
npm run check
npm start
```

Copier `.env.example` vers `.env.local` pour activer les intégrations voulues. Les secrets restent côté serveur ; les seuls identifiants publics sont les identifiants optionnels de mesure et de marketing.

## Contrôles de livraison

`npm run check` vérifie l’architecture, 30 invariants de sécurité, les moteurs conversationnels et de gouvernance, le routage de modèles, les types TypeScript et le build de production.

Le détail de la dernière recette se trouve dans `QUALITY_REPORT.md`. Le runbook de préproduction est dans `docs/ATLAS_PREPRODUCTION_RUNBOOK.md`.

## Limites assumées

Cette version est faite pour une recette privée, pas pour une ouverture commerciale. La mémoire durable, le Control Plane autonome, les actions externes automatiques, les paiements réels et le relais humain opérationnel restent désactivés ou hors périmètre. Une mise en production publique exige encore les validations juridiques, cliniques, sécurité, accessibilité multi-appareils et exploitation prévues par le contrat de complétude du projet.
