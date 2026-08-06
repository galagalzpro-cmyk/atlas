# ATLAS V5 — Audit intégral d’autonomie « JARVIS »

**Date de l’audit :** 6 août 2026  
**Dépôt :** `galagalzpro-cmyk/atlas`  
**Branche auditée :** `core/atlas-autonomous-emotional-os-v4`  
**Révision de référence :** `b35c2989d67058bb62a90ea9777e9fcd047a3071`  
**Statut :** audit d’architecture, de code et de gouvernance — aucune certification de production

---

## 1. Objet de l’audit

Cet audit évalue la capacité d’ATLAS à devenir une intelligence émotionnelle autonome, continue, contextuelle, proactive et intégrée, selon la référence fonctionnelle « JARVIS » validée pour le projet.

La référence JARVIS ne signifie pas reproduire un personnage, une voix ou une œuvre. Elle décrit un niveau d’ambition :

- présence persistante ;
- compréhension contextuelle ;
- orchestration de systèmes ;
- prise d’initiative mesurée ;
- exécution fiable ;
- auto-surveillance ;
- réparation automatique ;
- continuité entre les situations ;
- disponibilité naturelle ;
- autonomie dans un périmètre strictement gouverné.

Pour ATLAS, cette ambition devient :

> **une intelligence émotionnelle et opérationnelle capable de comprendre une personne, de maintenir un modèle cohérent de sa situation, de choisir une stratégie, d’exécuter des actions autorisées, de contrôler ses propres résultats, de se réparer et d’évoluer sans supervision humaine quotidienne.**

L’autonomie recherchée doit être **forte, mesurable, bornée, réversible et explicable**. Une autonomie parfaite au sens absolu n’est ni démontrable ni souhaitable. La cible correcte est une autonomie opérationnelle maximale sous contraintes constitutionnelles impossibles à contourner par les agents ordinaires.

---

## 2. Périmètre vérifié

L’audit couvre notamment :

- la route conversationnelle V4 ;
- l’orchestrateur, l’état cognitif et le noyau relationnel ;
- la sécurité locale et les réponses sensibles ;
- la mémoire de session ;
- le Policy Kernel ;
- le critique et la révision ;
- la continuité signée ;
- l’accès à OpenAI ;
- l’authentification et les sessions ;
- les bases de données ;
- les consentements et la gouvernance ;
- les paiements et les webhooks ;
- les opérations et la maintenance ;
- la préparation publique ;
- le système d’évolution ;
- les tests et la CI ;
- les documents d’architecture ;
- la capacité de déploiement, d’observabilité, de reprise et d’auto-réparation.

### Limites de preuve

Cet audit repose sur le code, les migrations, les workflows GitHub, les résultats de CI déjà obtenus et la documentation disponible. Il ne remplace pas :

- un test d’intrusion indépendant ;
- une analyse dynamique de l’infrastructure Vercel et PostgreSQL ;
- un audit RGPD ou juridique signé ;
- une évaluation clinique ;
- un test de charge réel ;
- une campagne d’évaluation humaine ;
- une preuve de sauvegarde et de restauration ;
- une certification réglementaire.

---

## 3. Verdict exécutif

### Verdict principal

ATLAS V4 est aujourd’hui un **orchestrateur conversationnel gouverné partiellement autonome**. Il n’est pas encore un système autonome complet de type JARVIS.

Ses capacités les plus avancées sont :

- planification d’un tour conversationnel ;
- sécurité locale prioritaire ;
- lecture émotionnelle heuristique ;
- adaptation relationnelle ;
- critique et révision bornée ;
- continuité signée ;
- limitation des actions externes ;
- contrôles de sécurité serveur ;
- build et tests automatisés.

Ses lacunes structurelles les plus importantes sont :

1. absence de plan de contrôle autonome global ;
2. absence de moteur de workflows durables ;
3. absence de registre d’outils et de passerelle d’actions ;
4. absence de mémoire structurée persistante et gouvernée ;
5. absence d’observabilité distribuée ;
6. absence d’auto-réparation opérationnelle ;
7. absence de routage multi-modèles et multi-fournisseurs ;
8. absence de boucle d’évolution réellement branchée ;
9. absence de preuve cryptographique des politiques et déploiements ;
10. préparation publique fondée sur des variables déclaratives, et non sur des preuves vérifiées.

### Évaluation de maturité

Barème interne :

- **0 — absent** ;
- **1 — déclaré ou purement documentaire** ;
- **2 — fondation codée non industrialisée** ;
- **3 — fonctionnel et partiellement contrôlé** ;
- **4 — autonome, observable et éprouvé** ;
- **5 — autonome, résilient, attesté et continuellement évalué**.

| Domaine | Niveau actuel | Cible | Diagnostic |
|---|---:|---:|---|
| Orchestration conversationnelle | 3 | 5 | V4 réelle, mais limitée à un tour et à un fournisseur |
| Compréhension émotionnelle | 2 | 5 | Heuristiques lexicales, confiance non calibrée |
| État cognitif et relationnel | 2 | 5 | Contrat riche, modèle du monde encore faible |
| Mémoire | 1 | 5 | Extraction de phrases, sans provenance ni cycle de vie |
| Sécurité émotionnelle | 2 | 5 | Priorité locale correcte, couverture sémantique limitée |
| Autonomie d’action | 0 | 5 | Aucune passerelle d’outils ou d’actions externes |
| Gouvernance des politiques | 2 | 5 | Policy Kernel utile mais modifiable avec le code applicatif |
| Observabilité | 1 | 5 | Quelques compteurs DB, pas de traces, métriques ou SLO |
| Auto-réparation | 1 | 5 | Nettoyage planifié uniquement |
| Résilience fournisseurs | 1 | 5 | OpenAI unique, aucun circuit breaker ni repli fournisseur |
| Évaluation continue | 2 | 5 | Tests locaux, aucun corpus industriel ni mesure continue |
| Auto-évolution | 1 | 5 | Politique de promotion présente, boucle inactive |
| Sécurité agentique | 1 | 5 | Aucun sandbox d’outils, aucune identité par agent |
| Confidentialité | 2 | 5 | Bonnes interdictions, continuité signée mais non chiffrée |
| Identité et accès | 2 | 5 | Sessions solides, pas de MFA/passkeys/risk-based auth |
| Paiements autonomes | 1 | 5 | Sandbox uniquement, réconciliation et dunning absents |
| CI/CD et chaîne logicielle | 2 | 5 | Quality gate vert, pas d’attestation/SBOM/scan complet |
| Multimodal et voix | 1 | 5 | Interface vocale navigateur, pas de moteur temps réel gouverné |
| Exploitation sans opérateur | 1 | 5 | Pas de control plane, incidents ou remédiation automatique |

**Appréciation globale : environ 1,6 / 5.** Cette note décrit une maturité d’autonomie systémique, non la qualité potentielle du concept.

---

## 4. Ce que « agir comme JARVIS » doit signifier pour ATLAS

### 4.1 Présence continue

ATLAS doit conserver un état cohérent entre les tours, les appareils et les contextes autorisés. Il ne doit pas seulement répondre à un message ; il doit savoir :

- ce qui est en cours ;
- ce qui a été corrigé ;
- ce qui est incertain ;
- ce qui a été refusé ;
- ce qui attend une décision ;
- ce qui a déjà été essayé ;
- quel résultat a été obtenu ;
- quelle action est encore ouverte.

### 4.2 Modèle du monde personnel

ATLAS doit maintenir un modèle structuré, limité et consentement-dépendant :

- personnes et relations ;
- événements ;
- objectifs ;
- obligations ;
- préférences ;
- contraintes ;
- ressources ;
- risques ;
- décisions ;
- tâches ouvertes ;
- hypothèses non confirmées ;
- temporalité et expiration.

Ce modèle ne doit jamais devenir une prétendue vérité psychologique.

### 4.3 Proactivité non intrusive

ATLAS peut anticiper uniquement lorsque :

- l’utilisateur a activé cette capacité ;
- un objectif ou une échéance existe ;
- l’action reste dans un périmètre explicite ;
- la proposition est utile et proportionnée ;
- le silence reste une option ;
- aucune vulnérabilité émotionnelle n’est exploitée.

La proactivité ne doit jamais signifier relance compulsive, pression au retour ou création de dépendance.

### 4.4 Orchestration d’outils

La référence JARVIS implique qu’ATLAS puisse, à terme, orchestrer des capacités :

- calendrier ;
- rappels ;
- documents ;
- recherche ;
- messagerie ;
- paiement ;
- réservation ;
- données personnelles ;
- environnement connecté ;
- parcours ATLAS ;
- ressources de soutien.

Chaque capacité doit être enregistrée, limitée, journalisée, révocable et soumise à une politique.

### 4.5 Auto-surveillance

ATLAS doit observer :

- sa latence ;
- ses erreurs ;
- ses coûts ;
- ses taux de repli ;
- ses incompréhensions ;
- ses répétitions ;
- ses faux positifs et faux négatifs de sécurité ;
- la santé de ses fournisseurs ;
- la qualité de ses versions ;
- les dérives de mémoire ;
- les violations de politique.

### 4.6 Réparation autonome

ATLAS doit savoir :

- réessayer une opération idempotente ;
- changer de fournisseur ;
- revenir à une version stable ;
- isoler un composant défaillant ;
- réduire ses fonctionnalités ;
- fermer temporairement une capacité dangereuse ;
- restaurer un état ;
- créer un incident ;
- vérifier que la réparation a fonctionné.

---

## 5. Audit du noyau conversationnel

### État positif

La route `app/api/conversation/route.ts` exécute désormais une chaîne cohérente :

```text
sécurité
→ émotion
→ autonomie
→ mémoire de travail
→ relation
→ état cognitif
→ politique
→ génération
→ critique
→ révision bornée
→ réponse ou repli
```

Le système :

- garde la sécurité locale prioritaire ;
- empêche l’IA externe dans les situations sensibles ;
- limite le nombre de questions ;
- critique la dépendance, les diagnostics et la certitude excessive ;
- peut réviser une réponse ;
- utilise un repli local ;
- n’expose plus les métadonnées internes à l’utilisateur.

### Lacunes

- La logique est centrée sur un seul tour, sans plan d’objectif à long terme.
- Les hypothèses restent majoritairement lexicales.
- Le multi-hypothèses compare surtout plusieurs émotions, pas plusieurs modèles causaux complets.
- La confiance n’est pas calibrée sur un corpus réel.
- Le critique repose en grande partie sur des marqueurs textuels.
- Une seule génération et une seule révision sont possibles.
- Les erreurs sont absorbées sans taxonomie opérationnelle.
- Les repli, échecs et blocages ne sont pas tous enregistrés.
- Il n’existe pas de sélection dynamique d’un modèle spécialisé.
- Aucun outil n’est accessible au planificateur.
- Il n’existe pas de preuve que la réponse respecte toutes les contraintes au-delà des validateurs actuels.

### Renforcement requis

Créer un **Executive Planner** durable :

```text
objectif utilisateur
→ sous-objectifs
→ stratégies candidates
→ coût et risque
→ plan choisi
→ action conversationnelle ou outil
→ vérification du résultat
→ mise à jour de l’état
```

Chaque décision doit porter :

- version de politique ;
- justification ;
- niveau de confiance ;
- coût estimé ;
- niveau de risque ;
- capacités nécessaires ;
- condition d’arrêt ;
- stratégie de repli ;
- possibilité d’annulation.

---

## 6. Audit de la mémoire

### État actuel

`lib/atlas/memory.ts` construit des listes de phrases : faits, corrections, refus, préférences, sujets ouverts et questions déjà posées.

### Risques

- une phrase temporaire peut être enregistrée comme fait ;
- une supposition peut devenir une mémoire ;
- une correction ne remplace pas formellement l’ancienne donnée ;
- aucune date, source, confiance ou expiration ;
- aucune classification de sensibilité ;
- aucune base de consentement attachée à l’élément ;
- aucune séparation entre mémoire de travail, mémoire épisodique, préférence et tâche ;
- aucune visualisation ou suppression granulaire ;
- aucune recherche sémantique gouvernée ;
- aucune protection contre l’empoisonnement de mémoire.

### Architecture cible : Memory Fabric

Chaque élément doit inclure :

```text
id
namespace utilisateur/session
catégorie
contenu structuré
provenance
horodatage
confiance
sensibilité
base légale ou consentement
durée de vie
statut actif/contesté/remplacé/supprimé
relation avec les autres éléments
preuve de validation utilisateur
```

Séparer strictement :

1. **Working Memory** — état éphémère du tour ;
2. **Session Memory** — continuité temporaire ;
3. **Task Memory** — objectifs, étapes et résultats ;
4. **Preference Memory** — préférences explicites ;
5. **Episodic Memory** — événements confirmés ;
6. **Semantic Profile** — uniquement avec consentement fort ;
7. **Safety Memory** — séparée, minimisée et à rétention spécifique ;
8. **System Memory** — versions, décisions et incidents sans contenu émotionnel brut.

### Décision critique

La mémoire persistante ne doit jamais être activée par un simple booléen. Le consentement doit porter sur :

- la catégorie ;
- la finalité ;
- la durée ;
- le niveau de sensibilité ;
- la possibilité de révocation ;
- le fournisseur éventuel ;
- la localisation et la suppression.

---

## 7. Audit de la continuité conversationnelle

### État actuel

`lib/server/conversation-state.ts` signe l’historique avec HMAC. Cela garantit l’intégrité, mais pas la confidentialité.

### Risques

- le texte brut reste contenu dans le jeton transporté par le navigateur ;
- le jeton peut devenir volumineux ;
- aucune rotation de clé ni identifiant de clé ;
- aucune révocation ;
- aucune liaison forte à un utilisateur, appareil ou session ;
- aucune protection contre le rejeu ;
- un secret unique compromet toutes les continuités ;
- la préparation publique ne vérifie pas que le secret existe ;
- l’absence de secret supprime silencieusement la continuité.

### Cible

Préférer un identifiant opaque pointant vers un état serveur éphémère chiffré. Si un état portable est indispensable :

- chiffrement AEAD ;
- rotation de clés ;
- `kid` ;
- durée courte ;
- nonce ;
- liaison de session ;
- révocation ;
- limite stricte de taille ;
- aucune conservation dans les logs ou analytics.

---

## 8. Audit du Policy Kernel

### Force actuelle

Le Policy Kernel interdit correctement :

- l’action externe automatique ;
- le monitoring humain caché ;
- les logs bruts ;
- le diagnostic ;
- l’exclusivité ;
- la pression au retour ;
- l’optimisation de la dépendance.

### Faiblesse structurelle

La politique est compilée dans le même code que l’application. Une modification de code peut donc modifier simultanément l’agent et sa limite.

### Cible : Constitutional Kernel indépendant

- politique déclarative séparée ;
- bundle signé ;
- version immuable ;
- point de décision indépendant ;
- point d’application proche de chaque outil ;
- tests de politique ;
- attestation du bundle actif ;
- impossibilité pour un agent de modifier le bundle ;
- approbation spéciale pour toute modification ;
- rollback immédiat.

Un moteur de policy-as-code, tel qu’OPA ou une implémentation équivalente, permettrait de découpler décision et application.

---

## 9. Audit de l’autonomie d’action

### État actuel

ATLAS ne possède aucun outil externe et n’exécute aucune action. Cette restriction est correcte pour la V4, mais incompatible avec la cible JARVIS.

### Architecture cible : Action Gateway

Chaque action doit suivre :

```text
intention
→ résolution de la capacité
→ politique
→ aperçu
→ consentement si nécessaire
→ exécution idempotente
→ vérification
→ journal d’audit
→ possibilité d’annulation
```

### Classes d’autonomie

| Classe | Description | Exemple | Décision |
|---|---|---|---|
| A0 | Lecture interne sans effet externe | analyser un état, choisir un modèle | autonome |
| A1 | Action faible risque, réversible | créer un brouillon, classer une tâche | autonome selon préférence |
| A2 | Action externe réversible | créer un rappel, ajouter un événement | confirmation configurable |
| A3 | Action significative | envoyer un message, payer, partager une donnée | confirmation explicite |
| A4 | Action réglementée ou irréversible | signalement, engagement contractuel, changement de politique | approbation humaine/fondateur obligatoire |
| AX | Action interdite | contact secret d’une autorité, manipulation émotionnelle | jamais autorisée |

### Exigences du registre de capacités

Pour chaque outil :

- identité du fournisseur ;
- opérations autorisées ;
- données lues et écrites ;
- portée d’autorisation ;
- coût maximal ;
- durée maximale ;
- niveau de risque ;
- idempotence ;
- possibilité d’annulation ;
- stratégie de repli ;
- taux d’erreur ;
- version ;
- statut de santé ;
- politique applicable.

---

## 10. Audit de la sécurité agentique

Un agent autonome ajoute des risques spécifiques :

- détournement d’objectif ;
- injection d’instructions ;
- abus d’outils ;
- augmentation de privilèges ;
- empoisonnement de mémoire ;
- exécution de code inattendue ;
- fuite inter-agents ;
- boucle infinie ;
- surconsommation ;
- action sur la mauvaise personne ;
- confusion entre données et instructions ;
- fournisseur ou outil compromis.

### Contrôles requis

- identité distincte par agent ;
- privilège minimal ;
- jetons courts et ciblés ;
- séparation lecture/écriture ;
- sandbox réseau et système ;
- allowlist des outils ;
- validation stricte des paramètres ;
- budgets de temps, coût, appels et données ;
- prévention des boucles ;
- vérification du résultat ;
- quarantaine des contenus non fiables ;
- classification des sources ;
- défense contre l’injection indirecte ;
- journal d’actions sans contenu émotionnel ;
- kill switch ;
- retour automatique au mode lecture seule.

### Décision

Aucun outil externe ne doit être ajouté avant la création du Capability Registry, de l’Action Gateway, des budgets d’autonomie et du sandbox.

---

## 11. Audit de la sécurité émotionnelle

### Forces

- sécurité déterministe avant génération ;
- réponses locales ;
- distinction entre détresse, violence, mineur et urgence ;
- ressources françaises ;
- IA externe bloquée lors des signaux sensibles.

### Limites

- couverture majoritairement lexicale ;
- compréhension faible de la négation, de la citation et du récit passé ;
- langues et formulations indirectes limitées ;
- absence de calibration ;
- absence de corpus adversarial industriel ;
- absence de suivi longitudinal du risque ;
- aucune gestion structurée de l’incertitude de sécurité ;
- aucune preuve d’évaluation par population ;
- absence de surveillance des dérives du classificateur.

### Cible

```text
règles locales
+ classificateur sémantique spécialisé
+ analyse temporelle
+ historique de risque éphémère
+ arbitre de désaccord
+ repli prudent
+ ressources territoriales versionnées
```

Le système doit rester incapable de contacter automatiquement une autorité ou un proche. Il peut préparer une action et aider l’utilisateur à l’effectuer lui-même.

---

## 12. Audit du modèle et des fournisseurs

### État actuel

- un seul fournisseur ;
- un seul modèle configuré ;
- `store:false` ;
- aucun SDK officiel ;
- aucune abstraction ;
- aucun retry ;
- aucun circuit breaker ;
- aucun modèle de repli ;
- aucun routage par risque, coût ou latence ;
- aucune mesure de tokens ou coût ;
- aucun hash de prompt ou de politique dans la télémétrie.

### Cible : Model Gateway

Le Model Gateway doit :

- enregistrer modèles et snapshots ;
- mesurer qualité, coût et latence ;
- router par tâche ;
- bloquer les modèles non approuvés ;
- contrôler la résidence et la rétention ;
- gérer timeout, retry et circuit breaker ;
- utiliser un fournisseur secondaire ;
- assurer un mode local minimal ;
- vérifier les sorties ;
- produire une trace de décision ;
- permettre le rollback d’un modèle ;
- isoler les modèles de sécurité des modèles conversationnels.

### Données fournisseur

`store:false` réduit la persistance applicative de la Responses API, mais ne remplace pas un accord Zero Data Retention ou Modified Abuse Monitoring. Le statut réel du projet OpenAI doit être vérifié et attesté dans la préparation publique.

---

## 13. Audit de l’observabilité

### État actuel

Le dépôt dispose de compteurs PostgreSQL et d’identifiants de trace locaux. Il ne dispose pas d’un système d’observabilité distribué.

### Éléments absents

- traces corrélées ;
- métriques ;
- logs structurés ;
- SLO ;
- budgets d’erreur ;
- alertes ;
- latence par composant ;
- santé fournisseur ;
- taux de repli ;
- coût par session ;
- saturation ;
- qualité des critiques ;
- divergence entre agents ;
- dérive de sécurité ;
- dérive de mémoire ;
- propagation du `traceId` vers les fournisseurs et workflows.

### Cible

Instrumenter avec un standard neutre tel qu’OpenTelemetry :

```text
trace interaction
├── sécurité
├── mémoire
├── état cognitif
├── planification
├── politique
├── modèle
├── critique
├── outil
└── persistance
```

Ne jamais placer le texte émotionnel brut dans les spans. Utiliser uniquement :

- catégories ;
- versions ;
- durées ;
- tailles ;
- verdicts ;
- codes d’erreur ;
- identifiants pseudonymisés ;
- scores agrégés autorisés.

---

## 14. Audit de l’auto-réparation

### État actuel

La route de maintenance supprime des enregistrements expirés. Ce n’est pas un système auto-réparable.

### Capacités nécessaires

- health, readiness et liveness distincts ;
- détection d’anomalies ;
- retry exponentiel ;
- circuit breakers ;
- dead-letter queues ;
- réconciliation ;
- bascule de fournisseur ;
- autoscaling ;
- limitation adaptative ;
- purge des tâches bloquées ;
- restauration testée ;
- rollback automatique ;
- création et clôture d’incident ;
- vérification post-réparation ;
- mode dégradé ;
- désactivation automatique d’une capacité dangereuse.

### Incident Commander autonome

L’agent d’incident doit pouvoir :

1. détecter ;
2. qualifier ;
3. isoler ;
4. appliquer un runbook approuvé ;
5. vérifier ;
6. revenir en arrière ;
7. enregistrer la preuve ;
8. notifier uniquement les responsables requis.

Il ne doit jamais improviser une commande de production non prévue par un runbook signé.

---

## 15. Audit des workflows durables

### État actuel

Les opérations sont exécutées dans les requêtes HTTP ou un cron simple. Il n’existe pas de workflow durable.

### Risques

- perte d’une tâche lors d’un redémarrage ;
- double exécution ;
- aucune reprise d’étape ;
- absence de délai fiable ;
- pas de compensation ;
- pas d’historique de décision ;
- pas de verrou distribué ;
- pas de dépendances entre tâches ;
- pas de suivi de SLA.

### Cible : Durable Workflow Engine

Tous les processus longs doivent être transformés en machines d’état persistantes :

- suppression de données ;
- export ;
- envoi d’e-mail ;
- traitement de webhook ;
- réconciliation paiement ;
- évaluation nocturne ;
- promotion de modèle ;
- déploiement canari ;
- restauration ;
- notification ;
- rotation de clé ;
- fermeture de compte ;
- renouvellement d’autorisation ;
- incident.

---

## 16. Audit de l’évolution autonome

### État actuel

`lib/atlas/evolution.ts` définit une politique pertinente : évaluation hors ligne, shadow, canary, approbation, rejet et rollback. Cette politique n’est pas connectée à une boucle réelle.

### Éléments absents

- registre de versions ;
- collecte de métriques ;
- corpus d’évaluation ;
- génération de candidats ;
- exécution d’évaluations ;
- trafic shadow ;
- attribution de canari ;
- décision de promotion ;
- persistance des preuves ;
- activation ;
- rollback en production ;
- surveillance post-déploiement.

### Cible : Evolution Governor

```text
défaut détecté
→ hypothèse
→ candidat
→ tests statiques
→ corpus hors ligne
→ tests adversariaux
→ simulation longue
→ shadow
→ canari non sensible
→ comparaison
→ promotion ou rejet
→ surveillance
→ rollback automatique
```

### Règles absolues

Une version ne peut pas être promue si elle dégrade :

- sécurité ;
- autonomie utilisateur ;
- non-dépendance ;
- confidentialité ;
- accessibilité ;
- capacité de réparation ;
- exactitude des consentements ;
- taux de faux négatifs de sécurité.

La durée de session, le nombre de messages ou le revenu ne peuvent jamais compenser une régression protégée.

---

## 17. Audit de l’évaluation

### État actuel

Le quality gate vérifie architecture, sécurité, tests runtime, tests conversationnels, tests V4, TypeScript et build.

### Manques

- couverture mesurée ;
- tests de propriété ;
- fuzzing ;
- tests d’injection ;
- conversations longues ;
- multilingualité ;
- corpus par âge ;
- tests d’accessibilité ;
- tests end-to-end ;
- tests de charge ;
- chaos tests ;
- sécurité agentique ;
- red teaming ;
- comparaisons de modèles ;
- évaluations humaines consenties ;
- mesure statistique ;
- détection de régression sur distributions.

### Banc d’évaluation cible

- corpus synthétique ;
- corpus expert validé ;
- corpus adversarial ;
- corpus de conversations longues ;
- cas limites de consentement ;
- scénarios d’outils ;
- scénarios de mémoire empoisonnée ;
- scénarios de fournisseurs en panne ;
- scénarios de coûts et saturation ;
- tests de retour arrière ;
- évaluations automatiques et humaines séparées.

L’API Evals d’OpenAI peut compléter ce système, mais les jeux les plus sensibles doivent pouvoir s’exécuter dans une infrastructure contrôlée.

---

## 18. Audit des opérations commerciales

### Paiements

Le code est volontairement limité au sandbox. Sont absents :

- production Stripe/PayPal ;
- idempotence métier persistante ;
- taxes ;
- factures ;
- proration ;
- annulation ;
- remboursement ;
- dunning ;
- fraude ;
- réconciliation ;
- contrôle des droits d’accès ;
- clôture comptable ;
- alertes de revenu.

### Webhooks

Les signatures et l’idempotence de réception existent. Il manque :

- retry ;
- backoff ;
- dead-letter queue ;
- verrou de traitement ;
- incrément d’essais ;
- reaper des événements bloqués ;
- ordre des événements ;
- réconciliation avec le fournisseur ;
- replay contrôlé ;
- alerte automatique.

### E-mail

L’envoi est direct, sans outbox durable. Il manque :

- file persistante ;
- retry ;
- statut ;
- templates versionnés ;
- gestion bounce/complaint ;
- fournisseur de repli ;
- preuve d’envoi ;
- limitation par finalité.

### Support autonome

ATLAS peut automatiser :

- classification d’une demande ;
- diagnostic technique ;
- réponse documentaire ;
- vérification de compte ;
- suivi de statut ;
- remboursement selon règle ;
- escalade juridique ou sécurité.

Il ne doit pas lire les conversations émotionnelles pour traiter un support technique ordinaire.

---

## 19. Audit de l’identité et des privilèges

### Forces

- mots de passe scrypt ;
- comparaison timing-safe ;
- sessions hachées ;
- cookies HttpOnly ;
- révocation lors de la réinitialisation ;
- rôles ;
- événements d’audit.

### Manques

- passkeys ;
- MFA ;
- vérification d’e-mail obligatoire ;
- rotation de session ;
- gestion d’appareils ;
- authentification adaptative ;
- réauthentification privilégiée ;
- limitation de connexion ;
- récupération renforcée ;
- identité de service ;
- identité distincte par agent ;
- autorisations courtes ;
- gestion centralisée des secrets ;
- rotation automatique ;
- politiques zero-trust par ressource.

---

## 20. Audit des données et du RGPD

### Forces

- catégories de données ;
- interdiction de log de contenu brut ;
- sanitisation des métadonnées ;
- aucun stockage sensible prévu dans le socle public ;
- événements de consentement en base.

### Lacunes

- sanitisation fondée sur le nom des clés, pas le contenu ;
- pas de registre de traitements ;
- pas de lineage ;
- pas de preuve complète de consentement ;
- pas de version/texte présenté/source/appareil associés au consentement ;
- pas de workflow de retrait ;
- pas de suppression automatique ;
- pas d’export ;
- pas de chiffrement applicatif ;
- pas de classification DLP ;
- pas de vérification de résidence ;
- pas d’attestation ZDR ;
- pas de séparation cryptographique des catégories ;
- pas de politique dédiée aux mineurs.

### Point réglementaire critique

L’usage de l’inférence émotionnelle dans le travail ou les établissements d’enseignement est interdit par l’article 5 du règlement européen sur l’IA, sauf exceptions médicales ou de sécurité. ATLAS Pro ne doit donc jamais fournir de surveillance émotionnelle des salariés ou élèves. Les organisations ne doivent recevoir que des indicateurs opérationnels strictement agrégés, non déductifs et non individualisables.

ATLAS doit également informer clairement la personne qu’elle interagit avec un système d’IA, conformément aux obligations de transparence applicables aux systèmes interactifs.

---

## 21. Audit de la préparation publique

### État actuel

La route de readiness utilise de nombreuses variables `ATLAS_*_READY` ou `*_APPROVED`.

### Risque

Une variable d’environnement à `true` peut déclarer une capacité validée sans preuve associée.

### Cible : Evidence-backed Readiness

Chaque gate doit contenir :

```text
id du contrôle
statut
preuve
empreinte de l’artefact
commit
environnement
émetteur
date
expiration
périmètre
résultat
lien vers rapport
```

La readiness doit vérifier automatiquement :

- le dernier build ;
- les tests ;
- la version de politique ;
- la présence des secrets ;
- la santé DB ;
- la restauration ;
- la télémétrie ;
- les alertes ;
- la configuration de rétention ;
- les preuves juridiques et de sécurité non expirées ;
- la configuration du pays ;
- la version des ressources d’urgence.

---

## 22. Audit de la chaîne logicielle

### État actuel

Le workflow CI exécute un quality gate unique. Le build est fonctionnel, mais la chaîne n’est pas attestée.

### Manques

- `npm ci` strict ;
- audit de dépendances ;
- CodeQL/SAST ;
- secret scanning ;
- SBOM ;
- signature ;
- provenance de build ;
- vérification des artefacts ;
- pinning complet des actions ;
- tests de migration ;
- tests preview ;
- smoke tests ;
- promotion d’environnement ;
- canari ;
- rollback automatisé ;
- artefacts de résultats ;
- politique de branche ;
- protection contre le déploiement depuis une branche non attestée.

### Cible

- provenance SLSA ;
- signature Sigstore/Cosign ;
- SBOM CycloneDX ou SPDX ;
- vérification avant déploiement ;
- artefact immuable ;
- promotion du même artefact entre environnements ;
- déploiement progressif ;
- rollback automatique ;
- preuve enregistrée dans le registre de release.

---

## 23. Audit de l’infrastructure

### Manques observables dans le dépôt

- aucun endpoint health dédié ;
- aucun endpoint liveness ;
- aucun endpoint readiness technique séparé ;
- aucune configuration de cron dans `vercel.json` ;
- aucune politique de région ;
- aucun timeout par fonction ;
- aucune preuve de sauvegarde ;
- aucune restauration automatisée ;
- aucune stratégie multi-région ;
- aucune réplication ;
- aucun test de perte fournisseur ;
- aucune orchestration de capacité ;
- aucun plan de continuité automatisé.

### Base de données

Le pool PostgreSQL est simple et limité. Ajouter :

- timeout de requête ;
- transaction helper ;
- retries seulement sur erreurs transitoires ;
- migration versionnée et verrouillée ;
- backup point-in-time ;
- restore drills ;
- contrôle de schéma ;
- chiffrement applicatif ;
- observation des connexions ;
- partitionnement ou archivage des événements ;
- politique de purge prouvée.

---

## 24. Audit documentaire

Le `README.md` décrit encore un prototype sans IA, comptes ou paiements, ce qui est faux par rapport au dépôt actuel.

Cette divergence est critique : une plateforme autonome ne peut pas fonctionner avec une documentation qui ne reflète pas la réalité. Le README, le blueprint, les variables d’environnement, la readiness et les contrats d’API doivent être générés ou vérifiés automatiquement depuis les sources de vérité.

### Automatisations documentaires

- documentation des routes générée ;
- matrice de variables générée ;
- diagrammes depuis les contrats ;
- changelog automatique ;
- inventaire des capacités ;
- inventaire des données ;
- inventaire des politiques ;
- rapport de readiness ;
- rapport de provenance ;
- rapport d’évaluation ;
- détection CI des documents obsolètes.

---

## 25. Architecture cible : ATLAS Autonomous Control Plane

```text
                        CONSTITUTIONAL KERNEL
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
       AUTONOMY CONTROL PLANE                 SAFETY SENTINEL
              │                                     │
    ┌─────────┼─────────┐                    ┌──────┴──────┐
    │         │         │                    │             │
EVENT BUS  WORKFLOWS  REGISTRIES        RISK ENGINE   LOCAL FALLBACK
    │         │         │
    │     ┌───┴────┐    ├─ models
    │     │        │    ├─ tools
    │   TASKS   INCIDENTS├─ policies
    │                  ├─ prompts
    │                  └─ releases
    │
    ├─ PERCEPTION ENSEMBLE
    ├─ MEMORY FABRIC
    ├─ WORLD MODEL
    ├─ DELIBERATION ENGINE
    ├─ EXECUTIVE PLANNER
    ├─ MODEL GATEWAY
    ├─ ACTION GATEWAY
    ├─ RESPONSE CRITIC
    ├─ DATA RIGHTS GOVERNOR
    ├─ EVOLUTION GOVERNOR
    ├─ COMMERCE OPERATIONS
    └─ OBSERVABILITY / SLO / AUDIT
```

### Composants indispensables

1. **Constitutional Kernel** — limites signées et séparées ;
2. **Control Plane** — autorité centrale sur états, capacités et versions ;
3. **Event Bus** — événements typés et versionnés ;
4. **Durable Workflow Engine** — reprise et compensation ;
5. **Capability Registry** — inventaire et permissions ;
6. **Action Gateway** — confirmation, exécution, vérification et undo ;
7. **Memory Fabric** — mémoire structurée et consentie ;
8. **World Model** — personnes, objectifs, contraintes et temporalité ;
9. **Model Gateway** — routage, santé, coût et résilience ;
10. **Safety Sentinel** — sécurité indépendante ;
11. **Critic Mesh** — contrôles spécialisés ;
12. **Observability Plane** — traces, métriques, logs et SLO ;
13. **Incident Commander** — runbooks autonomes ;
14. **Evolution Governor** — évaluations, canaris et rollback ;
15. **Data Rights Governor** — consentement, rétention, export et suppression ;
16. **Release Controller** — provenance et promotion d’artefacts ;
17. **Commerce Ops** — paiements, droits et réconciliation ;
18. **Voice/Multimodal Gateway** — temps réel avec interruption et modes dégradés.

---

## 26. Matrice complète de ce qui peut être automatisé

### Automatisation complète autorisée

- health checks ;
- liveness/readiness ;
- collecte de métriques ;
- détection d’anomalies ;
- retries idempotents ;
- bascule fournisseur ;
- circuit breaker ;
- autoscaling ;
- nettoyage ;
- réconciliation de webhooks ;
- purge selon rétention ;
- sauvegardes ;
- tests de restauration ;
- génération de SBOM ;
- scans de sécurité ;
- évaluations nocturnes ;
- comparaison de modèles ;
- shadow traffic ;
- canari technique ;
- rollback ;
- classification du support ;
- documentation générée ;
- rotation planifiée de clés avec double période ;
- optimisation de coût sous budget ;
- désactivation d’un fournisseur défaillant ;
- repli local ;
- maintenance de files ;
- détection de drift ;
- création d’incident ;
- exécution de runbooks signés.

### Automatisation sous politique

- choix du modèle ;
- choix d’un exercice ;
- choix d’une cellule ;
- écriture d’une mémoire proposée ;
- changement de niveau de détail ;
- adaptation voix/interface ;
- génération et révision ;
- création de brouillon ;
- suggestion proactive ;
- création d’un rappel déjà autorisé ;
- renouvellement d’une tâche ;
- remboursement sous seuil et règle ;
- suspension d’une capacité ;
- promotion de configuration faible risque.

### Confirmation utilisateur obligatoire

- mémoire persistante sensible ;
- envoi d’un e-mail ou message ;
- création ou modification d’un rendez-vous significatif ;
- partage de données ;
- paiement ;
- remboursement hors règle ;
- suppression de compte ;
- export ;
- connexion d’un fournisseur ;
- appel d’un service externe ;
- transmission de localisation ;
- changement de destinataire ;
- action susceptible d’engager la personne.

### Approbation fondateur, juridique ou sécurité

- modification du Constitutional Kernel ;
- nouveau pays ;
- nouveau public mineur ;
- nouvelle finalité de traitement ;
- nouveau fournisseur de données ;
- production paiement ;
- changement de prix ;
- politique de sécurité ;
- politique d’urgence ;
- rétention ;
- suppression d’un contrôle ;
- action irréversible ;
- usage réglementé ;
- publication d’une allégation clinique.

### Automatisations interdites

- contact secret de la police, d’un proche ou d’un employeur ;
- partage de conversation sans consentement ;
- lecture humaine cachée ;
- tarification selon vulnérabilité ;
- marketing émotionnel ciblé ;
- optimisation de dépendance ;
- auto-attribution de privilèges ;
- modification par l’agent de ses propres limites ;
- suppression des preuves d’audit ;
- exécution arbitraire de code en production ;
- achat ou engagement contractuel non confirmé ;
- profilage émotionnel des salariés ou élèves ;
- décision médicale ou juridique autonome.

---

## 27. Schémas de données manquants

Créer des registres dédiés :

- `atlas_policy_bundles` ;
- `atlas_capabilities` ;
- `atlas_action_requests` ;
- `atlas_action_steps` ;
- `atlas_workflows` ;
- `atlas_workflow_steps` ;
- `atlas_outbox` ;
- `atlas_dead_letters` ;
- `atlas_model_registry` ;
- `atlas_provider_health` ;
- `atlas_prompt_versions` ;
- `atlas_eval_suites` ;
- `atlas_eval_cases` ;
- `atlas_eval_runs` ;
- `atlas_evolution_candidates` ;
- `atlas_experiments` ;
- `atlas_release_attestations` ;
- `atlas_incidents` ;
- `atlas_incident_actions` ;
- `atlas_slo_samples` ;
- `atlas_memory_items` ;
- `atlas_memory_relations` ;
- `atlas_consent_receipts` ;
- `atlas_data_rights_jobs` ;
- `atlas_key_versions` ;
- `atlas_backup_verifications`.

Aucun de ces registres ne doit contenir le texte émotionnel brut par défaut.

---

## 28. Idées indispensables ajoutées à la vision

### 28.1 Budget d’autonomie

Chaque session et chaque agent dispose d’un budget :

- argent ;
- appels ;
- durée ;
- données ;
- profondeur ;
- nombre d’actions ;
- niveau de risque ;
- portée des outils.

Un agent ne peut jamais dépasser son budget en le modifiant lui-même.

### 28.2 Mode de confiance réglable

L’utilisateur choisit :

- observation uniquement ;
- suggestions ;
- actions avec confirmation ;
- actions réversibles automatiques ;
- autonomie avancée dans un périmètre défini.

### 28.3 Explication d’action

Pour toute action significative, ATLAS doit pouvoir répondre :

- pourquoi ;
- sur quelles données ;
- avec quelle autorisation ;
- quel outil ;
- quel résultat ;
- comment annuler ;
- ce qui a été conservé.

### 28.4 Enregistreur de vol

Créer une trace technique inviolable sans contenu sensible :

- versions ;
- décisions ;
- politiques ;
- outils ;
- durées ;
- résultats ;
- erreurs ;
- rollback.

### 28.5 Chambre de simulation

Aucune évolution autonome ne touche la production avant d’avoir été testée dans un environnement simulant :

- utilisateurs synthétiques ;
- attaques ;
- panne fournisseur ;
- perte DB ;
- latence ;
- données corrompues ;
- mémoire empoisonnée ;
- action externe ;
- abus de privilège ;
- mineurs ;
- situations critiques.

### 28.6 Double validation indépendante

Les décisions sensibles doivent être validées par :

- un moteur déterministe ;
- un validateur indépendant du générateur.

Le générateur ne doit jamais être son unique contrôleur.

### 28.7 Autonomie silencieuse

ATLAS ne doit pas exposer la complexité de son système. L’utilisateur voit une présence fluide ; le control plane gère en arrière-plan :

- état ;
- sécurité ;
- routage ;
- outils ;
- preuves ;
- reprise ;
- coûts ;
- qualité.

---

## 29. Feuille de route priorisée

### Phase 0 — Vérité et contrôle

Priorité absolue :

- corriger le README ;
- rendre la readiness fondée sur des preuves ;
- ajouter health/readiness/liveness ;
- introduire OpenTelemetry ;
- taxonomie d’erreurs ;
- enregistrer tous les runs, y compris repli et échec ;
- chiffrer ou remplacer l’état conversationnel portable ;
- créer le registre de politiques ;
- versionner prompts, modèles et critic ;
- ajouter rotation de clés ;
- aligner `.env.example` avec tous les gates.

### Phase 1 — Autonomie durable

- Event Bus ;
- Durable Workflow Engine ;
- outbox ;
- dead-letter queues ;
- retries ;
- réconciliation webhooks et e-mails ;
- incidents ;
- SLO ;
- backups et restore drills ;
- runbooks signés ;
- mode dégradé.

### Phase 2 — Intelligence autonome

- Memory Fabric ;
- World Model ;
- planification multi-étapes ;
- hypothèses concurrentes réelles ;
- modèle sémantique ;
- calibration ;
- Model Gateway ;
- multi-fournisseurs ;
- critic mesh ;
- évaluations continues.

### Phase 3 — Outils et actions

- Capability Registry ;
- Action Gateway ;
- consentements par action ;
- preview ;
- idempotence ;
- vérification ;
- undo ;
- sandbox ;
- budgets ;
- première capacité faible risque.

### Phase 4 — Auto-réparation et évolution

- Incident Commander ;
- anomaly detection ;
- auto-remediation ;
- shadow ;
- canary ;
- promotion ;
- rollback ;
- registre d’évolution ;
- simulation continue ;
- red team automatique.

### Phase 5 — JARVIS émotionnel à grande échelle

- temps réel voix ;
- interruption ;
- multimodal ;
- continuité inter-appareils ;
- proactivité consentie ;
- intégrations personnelles ;
- environnement procédural ;
- adaptation par public ;
- multi-région ;
- fonctionnement dégradé local ;
- autonomie opérationnelle permanente.

---

## 30. Gates obligatoires avant qualification « autonome »

ATLAS ne pourra être qualifié d’autonome industriel que lorsque les preuves suivantes seront disponibles :

- aucune action sans politique ;
- chaque outil possède un contrat ;
- chaque workflow est durable ;
- chaque action est idempotente ou compensable ;
- toutes les opérations sont traçables ;
- aucune donnée émotionnelle brute dans la télémétrie ;
- mémoire inspectable et supprimable ;
- modèle secondaire testé ;
- failover prouvé ;
- restore drill réussi ;
- rollback de release réussi ;
- corpus d’évaluation versionné ;
- tests adversariaux passés ;
- dérive détectée ;
- promotion canari prouvée ;
- sécurité agentique évaluée ;
- accessibilité évaluée ;
- charge évaluée ;
- preuves RGPD ;
- conformité de transparence ;
- politique mineurs validée ;
- restrictions travail/éducation appliquées ;
- kill switch testé ;
- mode lecture seule testé ;
- Constitutional Kernel signé et indépendant.

---

## 31. Décision d’architecture

La prochaine version ne doit pas être une simple V4.1.

Elle doit être structurée comme :

> **ATLAS V5 — Autonomous Emotional Operating System**

Son cœur ne sera plus seulement la conversation. Il sera le **Control Plane autonome** qui coordonne :

```text
perception
→ mémoire
→ modèle du monde
→ délibération
→ décision
→ action
→ vérification
→ observation
→ réparation
→ évolution
```

---

## 32. Conclusion finale

Oui, la référence JARVIS est comprise.

Elle signifie qu’ATLAS doit devenir :

- une présence numérique continue ;
- une intelligence contextuelle ;
- un orchestrateur d’outils ;
- un système capable d’initiative ;
- un système qui se surveille ;
- un système qui se répare ;
- un système qui apprend sous contrôle ;
- une aide disponible sans opérateur caché ;
- une intelligence profondément émotionnelle, mais jamais manipulatrice.

ATLAS n’est pas encore à ce niveau. La V4 possède une partie du cerveau conversationnel. La V5 doit construire le système nerveux, la mémoire, les mains, les réflexes, l’observabilité, l’immunité et la gouvernance qui rendent cette intelligence réellement autonome.

La cible opérationnelle est :

```text
100 % autonome dans la conversation ordinaire
95 % autonome dans l’exploitation quotidienne
90 % autonome dans l’évolution réversible
100 % contrôlé pour les actions externes
0 % autonome pour modifier ses limites fondamentales
```

Cette répartition constitue la forme la plus ambitieuse, crédible et responsable d’un « JARVIS émotionnel ».

---

## 33. Références normatives et techniques

- [NIST AI Risk Management Framework 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)
- [NIST Generative AI Profile — NIST AI 600-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- [CNIL — IA agentique et données personnelles, 20 juillet 2026](https://www.cnil.fr/fr/ia-agentique-cnil-cianum-note)
- [Règlement européen sur l’IA — texte officiel](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/fra)
- [Commission européenne — article 50 et transparence](https://digital-strategy.ec.europa.eu/fr/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems)
- [OWASP — Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/)
- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Open Policy Agent](https://www.openpolicyagent.org/docs)
- [SLSA 1.2](https://slsa.dev/spec/v1.2/)
- [Sigstore](https://docs.sigstore.dev/)
- [OpenAI — Data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)
- [OpenAI — Evals API](https://platform.openai.com/docs/api-reference/evals)
- [OpenAI — Practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)
- [Kubernetes — Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
