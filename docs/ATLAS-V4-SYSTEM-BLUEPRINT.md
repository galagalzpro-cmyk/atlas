# ATLAS V4 — System Blueprint

## 1. Positionnement

ATLAS n'est ni un chatbot, ni une landing page, ni une simple interface de bien-être. ATLAS est une plateforme d'intelligence émotionnelle adaptative, générative et temps réel, composée de plusieurs moteurs spécialisés coopérant sous une gouvernance explicite.

La plateforme doit simultanément couvrir :

- l'expérience publique et marketing ;
- les parcours émotionnels individuels ;
- les espaces adolescents, adultes et seniors ;
- les usages professionnels, cabinets et organisations ;
- les abonnements, paiements et droits d'accès ;
- les contenus, ressources et scénarios génératifs ;
- la génération visuelle et sonore contextuelle ;
- l'observabilité, l'administration et l'exploitation ;
- la sécurité, la conformité, le consentement et la traçabilité.

## 2. Principes non négociables

1. **Profondeur avant vitesse** — aucune fonctionnalité ne peut être considérée comme terminée sans logique métier, gestion d'erreur, sécurité, tests et observabilité.
2. **Adaptation explicable** — chaque changement d'interface, de scénario ou de ton doit provenir d'un état identifiable et auditable.
3. **Génération sous contraintes** — les moteurs génératifs doivent respecter des schémas, règles de sécurité, budgets, délais et stratégies de repli.
4. **Temps réel maîtrisé** — toute interaction temps réel doit être résiliente aux coupures, à la latence, aux doubles envois et aux changements d'état concurrents.
5. **Sécurité locale prioritaire** — les signaux sensibles sont évalués avant tout appel à un fournisseur externe.
6. **Consentement granulaire** — mémoire, analytics, marketing, voix et IA externe sont des consentements indépendants.
7. **Aucune métrique fictive** — aucune donnée marketing, clinique ou opérationnelle ne doit être affichée sans source réelle.
8. **Réversibilité** — toute décision de personnalisation, mémoire ou parcours doit pouvoir être corrigée, annulée ou supprimée.
9. **Aucune promesse clinique abusive** — ATLAS accompagne, clarifie et oriente ; il ne diagnostique pas et ne remplace pas un professionnel de santé.
10. **Production contrôlée** — aucune mise en production sans build, tests, vérification visuelle, audit des erreurs et plan de retour arrière.

## 3. Architecture fonctionnelle

### 3.1 Expérience publique

- page d'accueil cinématique ;
- démonstration interactive du système ;
- présentation des univers et cas d'usage ;
- pages offres, tarifs et comparatif ;
- pages professionnels, cabinets et entreprises ;
- bibliothèque de ressources ;
- centre de confiance ;
- documentation et FAQ ;
- acquisition SEO et campagnes publicitaires ;
- suivi de conversion et attribution.

### 3.2 Espace personnel

- création de compte et authentification ;
- onboarding adaptatif ;
- profil de préférences ;
- consentements indépendants ;
- sessions émotionnelles ;
- parcours guidés ;
- scénarios temps réel ;
- ressources recommandées ;
- journal de progression non clinique ;
- export et suppression des données ;
- gestion abonnement et facturation.

### 3.3 Espace professionnel

- organisation et équipes ;
- rôles et permissions ;
- invitations ;
- catalogue de parcours ;
- affectation de programmes ;
- suivi d'utilisation agrégé ;
- bibliothèque interne ;
- gestion des bénéficiaires sans exposition inutile des contenus sensibles ;
- facturation organisationnelle ;
- audit des actions ;
- configuration de marque et domaines.

### 3.4 Administration et exploitation

- supervision des services ;
- disponibilité des fournisseurs ;
- métriques techniques ;
- métriques produit ;
- cohortes et conversion ;
- gestion des plans et prix ;
- gestion de contenu ;
- modération et sécurité ;
- journal d'audit ;
- gestion des incidents ;
- rétention et suppression ;
- maintenance et opérations.

## 4. Moteurs intelligents

### 4.1 Signal Engine

Responsabilités :

- analyser texte, voix et interactions ;
- séparer faits, émotions déclarées, intention et urgence ;
- produire un état structuré ;
- conserver l'incertitude ;
- bloquer les interprétations non justifiées.

Sortie contractuelle minimale :

```ts
interface SignalState {
  locale: string;
  audience: "adolescent" | "adult" | "senior";
  explicitEmotion?: string;
  intensity?: number;
  intent: string;
  urgency: "normal" | "attention" | "urgent";
  uncertainty: number;
  evidence: string[];
}
```

### 4.2 Adaptation Engine

Responsabilités :

- transformer le signal en décisions d'expérience ;
- sélectionner densité, rythme, contraste, narration et profondeur ;
- adapter sans manipuler ;
- conserver les préférences d'accessibilité ;
- empêcher les changements excessifs ou incohérents.

Sortie contractuelle minimale :

```ts
interface ExperienceState {
  pace: "slow" | "balanced" | "dynamic";
  density: "minimal" | "standard" | "rich";
  contrast: "soft" | "standard" | "high";
  motion: "reduced" | "ambient" | "immersive";
  guidance: "open" | "structured" | "protective";
  sceneId: string;
  rationaleCodes: string[];
}
```

### 4.3 Scenario Engine

Responsabilités :

- composer des scènes temps réel ;
- gérer objectifs, étapes, conditions et sorties ;
- maintenir la continuité entre écrans ;
- permettre pause, reprise et abandon ;
- garantir une stratégie de repli déterministe.

Un scénario doit contenir :

- identité et version ;
- public cible ;
- critères d'entrée ;
- états ;
- transitions ;
- garde-fous ;
- contenu génératif autorisé ;
- événements analytics ;
- critères de fin ;
- politique de reprise.

### 4.4 Generative Media Engine

Responsabilités :

- générer ou composer décors, formes, particules, typographies cinétiques et paysages sonores ;
- ne jamais dépendre d'une image fixe pour le fonctionnement critique ;
- imposer des budgets de rendu ;
- respecter accessibilité, réduction des animations et performance ;
- précharger ou dégrader proprement les ressources lourdes.

Modes de rendu :

1. procédural local : Canvas, WebGL, shaders, SVG ;
2. génératif distant : image, vidéo, audio ;
3. composition hybride : assets générés + moteur procédural ;
4. fallback statique optimisé.

### 4.5 Conversation Engine

Responsabilités :

- maintenir un dialogue structuré ;
- suivre contexte, objectifs et limites ;
- produire réponse, prochaine action et niveau de confiance ;
- utiliser une IA externe uniquement sous consentement ;
- fournir un fallback local déterministe.

La conversation n'est qu'un sous-système parmi les autres.

### 4.6 Memory Engine

Couches séparées :

- mémoire de session volatile ;
- préférences utilisateur ;
- mémoire explicitement consentie ;
- données opérationnelles ;
- analytics pseudonymisés ;
- journaux d'audit.

Aucune conversation sensible ne doit être copiée dans les analytics ou l'audit.

### 4.7 Safety Engine

Responsabilités :

- classifier les niveaux de vigilance ;
- interrompre les flux ordinaires ;
- prioriser le relais humain ;
- gérer les limites par public ;
- conserver les raisons techniques de la décision sans exposer inutilement le contenu.

## 5. Architecture technique cible

### 5.1 Frontend

- Next.js App Router ;
- composants serveur par défaut ;
- composants client uniquement pour interactions ;
- design tokens centralisés ;
- moteur de scène isolé ;
- state machine explicite ;
- responsive mobile-first ;
- accessibilité WCAG à valider ;
- budgets performance par route.

### 5.2 Backend

- API typées ;
- validation stricte des entrées ;
- idempotence ;
- timeouts ;
- rate limiting ;
- files d'attente pour tâches longues ;
- webhooks signés ;
- séparation lecture/écriture lorsque nécessaire ;
- journalisation structurée ;
- corrélation par request ID.

### 5.3 Données

Domaines séparés :

- identité ;
- organisations ;
- abonnements ;
- consentements ;
- sessions ;
- scénarios ;
- contenus ;
- événements ;
- audits ;
- opérations IA ;
- médias générés.

Chaque table doit avoir : propriétaire, rétention, base légale, droits d'accès et stratégie de suppression.

### 5.4 Temps réel

- SSE ou WebSocket selon le besoin ;
- reprise après reconnexion ;
- identifiant d'événement ;
- ordre des messages ;
- déduplication ;
- heartbeat ;
- stratégie offline ;
- gestion des erreurs partielles.

### 5.5 Génération asynchrone

Les générations longues doivent passer par une file :

1. requête validée ;
2. création d'un job ;
3. traitement par worker ;
4. stockage du résultat ;
5. notification temps réel ;
6. expiration et nettoyage ;
7. retry contrôlé ;
8. dead-letter queue.

## 6. Commerce et croissance

### 6.1 Offres

- particulier gratuit ou découverte ;
- particulier premium ;
- cabinet indépendant ;
- cabinet équipe ;
- entreprise ;
- contrat sur mesure.

### 6.2 Paiements

- Stripe ;
- PayPal ;
- carte bancaire ;
- facturation récurrente ;
- essais ;
- coupons ;
- TVA et fiscalité à valider ;
- factures ;
- échecs de paiement ;
- résiliation ;
- remboursement selon politique validée.

### 6.3 Acquisition

- Google Analytics / alternative consentie ;
- Google Ads ;
- Meta Pixel ;
- gestionnaire de consentement ;
- attribution ;
- événements de conversion ;
- segmentation ;
- CRM ;
- email transactionnel et marketing séparés.

## 7. Sécurité et conformité

- RBAC strict ;
- sessions sécurisées ;
- rotation des secrets ;
- chiffrement en transit ;
- chiffrement au repos selon fournisseur ;
- CSP ;
- protection CSRF ;
- validation webhooks ;
- limitation de débit ;
- journal d'audit ;
- sauvegardes ;
- restauration testée ;
- politique de rétention ;
- export et suppression ;
- revue juridique ;
- revue clinique ;
- revue accessibilité ;
- test d'intrusion indépendant avant lancement large.

## 8. Observabilité

Chaque service doit exposer :

- disponibilité ;
- latence ;
- taux d'erreur ;
- saturation ;
- coûts IA ;
- temps de génération ;
- abandon de parcours ;
- conversion ;
- erreurs de paiement ;
- incidents de sécurité ;
- volume de fallback local.

Les tableaux de bord doivent séparer : produit, technique, commerce, sécurité et support.

## 9. Qualité et tests

### 9.1 Tests obligatoires

- unitaires ;
- intégration ;
- contrats API ;
- sécurité ;
- accessibilité ;
- performance ;
- responsive ;
- navigation clavier ;
- scénarios de panne fournisseur ;
- reprise réseau ;
- paiements sandbox ;
- webhooks ;
- migrations ;
- sauvegarde/restauration ;
- parcours utilisateur de bout en bout.

### 9.2 Definition of Done

Une fonctionnalité n'est terminée que si :

- la spécification est claire ;
- les cas limites sont définis ;
- les erreurs sont visibles et actionnables ;
- la sécurité est vérifiée ;
- les tests passent ;
- la performance respecte le budget ;
- les événements d'observabilité existent ;
- la documentation est à jour ;
- un rollback est possible ;
- une vérification visuelle a été faite.

## 10. Plan de construction

### Phase A — Fondation système

- cartographie des routes et modules existants ;
- design system unifié ;
- state machine globale ;
- contrats Signal, Experience, Scenario et Safety ;
- structure de données ;
- observabilité de base ;
- pipeline de tests.

### Phase B — Plateforme publique et commerciale

- architecture complète des pages ;
- offres ;
- prix ;
- démonstrations ;
- SEO ;
- analytics ;
- consentement ;
- acquisition ;
- paiements sandbox.

### Phase C — Produit personnel

- onboarding ;
- scénarios ;
- sessions ;
- mémoire ;
- ressources ;
- progression ;
- abonnement ;
- données personnelles.

### Phase D — Produit professionnel

- organisations ;
- équipes ;
- rôles ;
- invitations ;
- parcours ;
- indicateurs ;
- facturation ;
- audit ;
- configuration.

### Phase E — Génération multimodale et temps réel

- moteur procédural ;
- génération de scènes ;
- génération audio/visuelle distante ;
- jobs asynchrones ;
- streaming ;
- fallback ;
- cache ;
- contrôle des coûts.

### Phase F — Validation production

- audit fonctionnel ;
- audit sécurité ;
- audit accessibilité ;
- audit juridique ;
- audit clinique ;
- tests de charge ;
- sauvegarde/restauration ;
- runbooks ;
- surveillance ;
- lancement progressif.

## 11. Blocages externes à ne pas masquer

Même avec un code complet, le lancement sérieux exige encore :

- infrastructure PostgreSQL active ;
- migrations exécutées ;
- secrets réels ;
- fournisseur email ;
- clés IA ;
- comptes Stripe et PayPal validés ;
- webhooks enregistrés ;
- domaine et DNS ;
- politique juridique finale ;
- politique de remboursement ;
- validation fiscale ;
- validation clinique ;
- validation accessibilité ;
- sauvegardes réelles ;
- sécurité indépendante.

## 12. Règle de publication

La branche `platform/atlas-v4-deep-system` devient la zone de construction profonde. `main` ne doit recevoir que des versions :

- compilées ;
- testées ;
- visuellement vérifiées ;
- documentées ;
- réversibles ;
- explicitement approuvées pour publication.
