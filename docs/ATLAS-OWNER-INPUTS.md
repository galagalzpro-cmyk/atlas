# ATLAS — Entrées fondatrices requises pour le lancement

**Cible actuelle : bêta contrôlée adultes · France**  
**Principe : aucune donnée juridique, commerciale ou de sécurité n’est inventée.**

## 1. Informations à fournir par le fondateur

Ces éléments sont les seules décisions qui ne peuvent pas être produits automatiquement par l’équipe technique. Les valeurs publiques peuvent être communiquées dans le dossier projet. Les secrets ne doivent jamais être transmis dans une conversation.

### Identité juridique

| Information | Variable Vercel |
| --- | --- |
| Nom légal ou raison sociale | `ATLAS_LEGAL_ENTITY` |
| Forme juridique | `ATLAS_LEGAL_FORM` |
| Adresse publiable du siège ou de l’activité | `ATLAS_LEGAL_ADDRESS` |
| Téléphone public de l’éditeur | `ATLAS_LEGAL_PHONE` |
| SIREN/SIRET ou immatriculation applicable | `ATLAS_REGISTRATION_ID` |
| Capital social, lorsque requis | `ATLAS_SHARE_CAPITAL` |
| Directeur de publication | `ATLAS_PUBLICATION_DIRECTOR` |
| TVA intracommunautaire, lorsqu’applicable | `ATLAS_VAT_ID` |

### Contacts publics

| Information | Variable Vercel |
| --- | --- |
| Support utilisateur | `ATLAS_SUPPORT_EMAIL` |
| Confidentialité et exercice des droits | `ATLAS_PRIVACY_EMAIL` |
| Sécurité ou incident | `ATLAS_SECURITY_EMAIL` |
| Relais humain réellement surveillé | `ATLAS_HUMAN_RELAY` |

### Hébergement et documents

| Information | Variable Vercel |
| --- | --- |
| Nom légal de l’hébergeur | `ATLAS_HOST_LEGAL_NAME` |
| Adresse contractuelle de l’hébergeur | `ATLAS_HOST_LEGAL_ADDRESS` |
| Téléphone de l’hébergeur | `ATLAS_HOST_PHONE` |
| Contact public de l’hébergeur, si applicable | `ATLAS_HOST_CONTACT` |
| Version des conditions | `ATLAS_TERMS_VERSION` |
| Version de la politique de confidentialité | `ATLAS_PRIVACY_VERSION` |

Ces champs alimentent automatiquement `/mentions-legales`, `/conditions`, `/confidentialite`, l’administration et `/api/readiness`. Aucun changement de code n’est nécessaire après leur saisie.

### Produit et commerce

- domaine public définitif (`ATLAS_APP_URL`) ;
- offres conservées au lancement ;
- prix TTC, périodicité et politique d’essai ;
- politique d’annulation et de remboursement ;
- version des CGV (`ATLAS_SALES_TERMS_VERSION`) ;
- version de la politique de remboursement (`ATLAS_REFUND_POLICY_VERSION`) ;
- médiateur de la consommation (`ATLAS_CONSUMER_MEDIATOR`) ;
- URL de résiliation électronique (`ATLAS_CANCELLATION_URL`) ;
- décision d’activer ou non Stripe et PayPal en production.

### Décision de lancement

- périmètre initial confirmé : adultes en France ;
- activation ultérieure des univers seniors et adolescents uniquement après leurs validations dédiées ;
- autorisation finale de lancement après réception du dossier de preuves (`ATLAS_PUBLIC_LAUNCH_APPROVED=true`).

## 2. Accès techniques à connecter

Les secrets doivent être créés directement dans les variables sécurisées Vercel, jamais ajoutés au dépôt GitHub ou envoyés dans une conversation.

- PostgreSQL ou Supabase : `DATABASE_URL` ;
- OpenAI : `OPENAI_API_KEY` ;
- Brevo : `BREVO_API_KEY` et expéditeur vérifié ;
- continuité : `ATLAS_CONVERSATION_STATE_SECRET` ;
- maintenance : `CRON_SECRET` ;
- Stripe : clés, prix et secret webhook ;
- PayPal : identifiants et identifiant webhook ;
- domaine DNS ;
- identifiants analytics et pixels uniquement s’ils sont réellement utilisés.

## 3. Validations indépendantes

Elles ne peuvent pas être auto-déclarées par le code.

- revue juridique ;
- revue RGPD/confidentialité ;
- audit sécurité externe ;
- revue clinique du positionnement et des limites ;
- recette d’accessibilité humaine et multi-appareils ;
- validation mineurs avant l’univers adolescents ;
- validation seniors avant l’univers seniors.

## 4. Ce que l’équipe technique termine sans intervention fondatrice

- architecture et consolidation du dépôt ;
- ATLAS Awakening et expérience procédurale ;
- conversation, voix locale, sécurité et consentement ;
- comptes, organisations, administration et migrations ;
- paiements sandbox et webhooks ;
- observabilité minimisée, maintenance, rollback et preuves ;
- tests, qualité, performance, charge et dossiers de recette ;
- déploiements preview et préparation de la release.

## 5. Règle de fermeture

Un contrôle n’est marqué `true` qu’après présence d’une preuve datée. Le build, une variable d’environnement ou une déclaration orale ne remplacent pas l’audit, le test ou la validation correspondante.
