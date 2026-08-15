# ATLAS — Entrées fondatrices requises pour le lancement

**Cible actuelle : bêta contrôlée adultes · France**  
**Principe : aucune donnée juridique, commerciale ou de sécurité n’est inventée.**

## 1. Informations à fournir par le fondateur

Ces éléments sont les seules décisions qui ne peuvent pas être produites automatiquement par l’équipe technique.

### Identité juridique

- nom légal ou raison sociale de l’éditeur ;
- forme juridique ;
- adresse du siège ou adresse professionnelle publiable ;
- SIREN/SIRET ou numéro d’immatriculation applicable ;
- capital social lorsque requis ;
- nom du directeur de publication ;
- numéro de TVA intracommunautaire lorsqu’applicable.

### Contacts publics

- adresse de support utilisateur ;
- adresse dédiée à la confidentialité et à l’exercice des droits ;
- adresse de sécurité ou d’incident ;
- canal de relais humain réellement surveillé.

### Produit et commerce

- domaine public définitif ;
- offres conservées au lancement ;
- prix TTC, périodicité et politique d’essai ;
- politique d’annulation et de remboursement ;
- décision d’activer ou non Stripe et PayPal en production.

### Décision de lancement

- périmètre initial confirmé : adultes en France ;
- activation ultérieure des univers seniors et adolescents uniquement après leurs validations dédiées ;
- autorisation finale de lancement après réception du dossier de preuves.

## 2. Accès techniques à connecter

Les secrets ne doivent jamais être envoyés dans une conversation ou ajoutés au dépôt GitHub. Ils doivent être créés directement dans les variables sécurisées Vercel.

- PostgreSQL ou Supabase : `DATABASE_URL` ;
- OpenAI : `OPENAI_API_KEY` ;
- Brevo : `BREVO_API_KEY` et expéditeur vérifié ;
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
