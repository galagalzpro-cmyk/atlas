# ATLAS V4 — Audit d’autonomie et architecture cible

## Conclusion exécutive

La V3 pose des fondations pertinentes, mais ne constitue pas encore une intelligence émotionnelle autonome unifiée.

Le système actuel dispose de moteurs séparés pour la sécurité, l’émotion, l’autonomie, la mémoire, la présence, la relation et l’état cognitif. Cependant, la route conversationnelle réelle continue principalement d’exécuter l’ancienne chaîne :

```text
sécurité
→ émotion heuristique
→ autonomie heuristique
→ réponse locale ou génération externe
→ deux validations lexicales
→ acceptation ou fallback
```

Le noyau relationnel et l’état cognitif V3 ne gouvernent pas encore la réponse envoyée. L’auto-évolution existe comme politique de promotion de versions, mais pas comme boucle opérationnelle complète.

La V4 doit donc transformer ATLAS en **système d’exploitation émotionnel autonome** : un système qui perçoit, délibère, choisit une stratégie, exécute, critique, révise, mémorise et apprend sous contraintes.

---

## Audit de la V3

### 1. Orchestration : critique

**État actuel**

- La route construit sécurité, état émotionnel et décision d’autonomie.
- Elle ne construit ni `AtlasRelationalState` ni `AtlasCognitiveState`.
- Le générateur reçoit l’ancienne structure émotion/autonomie/mémoire.
- Le système ne choisit pas entre plusieurs stratégies de réponse.

**Conséquence**

La V3 contient une architecture plus avancée que celle réellement utilisée. La sophistication est déclarative, mais pas encore opérationnelle.

**Priorité**

Créer un orchestrateur unique responsable du cycle complet d’un tour.

---

### 2. Intelligence émotionnelle : insuffisante pour la cible

**Forces**

- intensité ;
- ouverture ;
- trajectoire ;
- tolérance aux questions ;
- préparation à l’action ;
- signal de rupture ;
- prudence sur l’incertitude.

**Limites**

- détection principalement lexicale ;
- faible compréhension des formulations indirectes ;
- absence de modèle explicite de contexte social ;
- absence de distinction claire entre état momentané, disposition durable et réaction à ATLAS ;
- risque de double comptage du dernier message dans certains historiques ;
- confiance dérivée de scores internes non calibrés sur des données réelles.

**Décision V4**

Utiliser une inférence en trois couches :

1. signaux déterministes locaux ;
2. inférence sémantique structurée ;
3. arbitre de cohérence et d’incertitude.

Aucune couche ne devient seule la vérité.

---

### 3. Multi-hypothèses : partiel

**État actuel**

Les hypothèses utilisent plusieurs émotions possibles, mais conservent souvent le même objectif et le même besoin.

**Limite**

Ce n’est pas encore une véritable comparaison de lectures concurrentes.

**Exemple cible**

Pour « Je n’arrive plus à répondre à ses messages » :

- hypothèse A : épuisement et besoin de repos ;
- hypothèse B : peur du conflit et besoin de sécurité ;
- hypothèse C : volonté de poser une limite ;
- hypothèse D : désengagement relationnel et besoin de clarification.

Chaque hypothèse doit proposer une stratégie différente et être affaiblie par des contre-signaux.

---

### 4. Mémoire : trop fragile

**État actuel**

La mémoire extrait des phrases entières comme faits, corrections, refus et préférences.

**Risques**

- un fait temporaire peut devenir durable ;
- une hypothèse de l’utilisateur peut être stockée comme fait ;
- une correction n’invalide pas formellement l’élément précédent ;
- aucune provenance ni date d’expiration ;
- pas de séparation entre mémoire de travail, mémoire épisodique et profil contrôlé ;
- pas de politique d’écriture ou d’oubli par sensibilité.

**Décision V4**

Chaque souvenir doit posséder :

- identifiant ;
- type ;
- contenu structuré ;
- provenance ;
- date ;
- confiance ;
- sensibilité ;
- durée de vie ;
- statut actif, contesté, remplacé ou supprimé ;
- base de consentement.

---

### 5. Sécurité : couverture insuffisante

**État actuel**

La sécurité détecte surtout des formulations explicites.

**Lacunes majeures**

- idéation indirecte ;
- planification ;
- temporalité ;
- accès à un moyen ;
- intention envers autrui ;
- négation et citation ;
- récit passé contre danger actuel ;
- risque médical ;
- désorientation ;
- mineurs ;
- manipulation du classificateur ;
- contexte multilingue.

**Décision V4**

Créer un noyau de sécurité séparé, versionné et non modifiable par l’auto-évolution ordinaire. Il combine :

- règles déterministes ;
- classificateur sémantique ;
- questions minimales de clarification seulement lorsque nécessaires ;
- ressources locales validées ;
- impossibilité d’action externe automatique.

---

### 6. Génération et critique : trop simples

**État actuel**

- une génération ;
- validation de présence ;
- validation émotionnelle ;
- fallback local en cas d’échec.

**Limites**

- pas de plan explicite ;
- pas de candidats concurrents ;
- pas de critique de dépendance ;
- pas de vérification de fidélité à la mémoire ;
- pas de vérification des contraintes du tour ;
- pas de révision ;
- fallback parfois moins adapté que la réponse rejetée ;
- métadonnées `nextStep` et `labels` encore présentes dans la réponse publique.

**Décision V4**

Exécuter :

```text
plan
→ génération candidate
→ critique multicritère
→ révision bornée
→ nouvelle critique
→ acceptation ou fallback contextuel
```

Une seule révision par défaut, deux uniquement pour les tâches complexes non sensibles.

---

### 7. Entrées et confiance : insuffisamment sécurisées

**État actuel**

L’historique reçu du client est utilisé comme contexte.

**Risques**

- historique falsifié ;
- injection par faux messages ATLAS ;
- perte de continuité entre appareils ;
- aucune signature de session ;
- absence de provenance des tours.

**Décision V4**

Le serveur devient l’autorité de l’historique. Le client transmet un identifiant de session et le nouveau message, pas une mémoire considérée comme fiable.

---

### 8. Évaluation : nettement insuffisante

**État actuel**

Quelques assertions couvrent mémoire, répétition, surcharge, réparation, écoute et sécurité explicite.

**Manques**

- aucun test du noyau relationnel ;
- aucun test de l’état cognitif ;
- aucune conversation longue ;
- aucune mesure statistique ;
- aucun jeu adversarial ;
- aucun test de dépendance ;
- aucun test par population ;
- aucune preuve de calibration.

**Décision V4**

Créer un banc d’évaluation versionné avec scénarios, conversations longues, rubriques, seuils, résultats comparatifs et blocage automatique des régressions.

---

## Architecture cible : ATLAS Emotional OS V4

```text
1. Entrée fiable
   ↓
2. Noyau de sécurité immuable
   ↓
3. Extraction de signaux multimodaux
   ↓
4. Mémoire de travail + mémoire consentie
   ↓
5. Ensemble d’interprétations concurrentes
   ↓
6. État émotionnel, relationnel et situationnel
   ↓
7. Délibération sous incertitude
   ↓
8. Sélection autonome de stratégie
   ↓
9. Plan conversationnel invisible
   ↓
10. Routage du modèle, outil ou réponse locale
   ↓
11. Génération candidate
   ↓
12. Critique multicritère
   ↓
13. Révision bornée
   ↓
14. Réponse publique minimale
   ↓
15. Curation de mémoire
   ↓
16. Trace technique sans contenu sensible
   ↓
17. Évaluation différée et évolution gouvernée
```

---

## Les sept noyaux de la V4

### Policy Kernel

Contraintes non négociables : sécurité, autonomie, confidentialité, non-dépendance, honnêteté, absence de diagnostic et absence d’action externe automatique.

### Perception Ensemble

Combine signaux lexicaux, sémantiques, conversationnels, temporels et vocaux. Produit des observations, jamais des certitudes.

### World and Human State

Sépare :

- état actuel ;
- contexte de vie ;
- relation avec ATLAS ;
- préférences ;
- ressources et contraintes ;
- événements ;
- incertitudes.

### Deliberation Engine

Génère plusieurs interprétations et plusieurs stratégies possibles. Évalue le coût d’une erreur avant d’agir.

### Executive Planner

Choisit la prochaine action : silence, reflet, clarification, apaisement, exploration, options, exercice, ressource, réparation ou clôture.

### Response Critic

Évalue :

- sécurité ;
- adéquation émotionnelle ;
- continuité ;
- fidélité à la mémoire ;
- respect de l’autonomie ;
- naturel ;
- pression ;
- dépendance ;
- honnêteté ;
- longueur ;
- répétition ;
- pertinence de la question.

### Evolution Governor

Observe les résultats agrégés, propose des candidats, les teste hors production et refuse toute régression d’une métrique protégée.

---

## Autonomie maximale autorisée

ATLAS V4 peut décider seul :

- sa posture ;
- la profondeur ;
- le rythme ;
- l’usage d’une question ;
- le modèle ;
- le besoin d’un outil ;
- la stratégie de fallback ;
- la nécessité d’une révision ;
- ce qui mérite une proposition de mémoire ;
- le niveau de calcul alloué ;
- le passage en mode de sécurité ;
- l’arrêt d’une exploration devenue inadaptée.

ATLAS V4 ne peut pas décider seul :

- de contacter une autorité ou une personne ;
- de transmettre une conversation ;
- de modifier le Policy Kernel ;
- de déployer une évolution non évaluée ;
- de conserver une donnée sensible sans base autorisée ;
- de se présenter comme humain ;
- de maximiser la dépendance ou le temps passé.

---

## Principe de décision sous incertitude

- **Faible incertitude, faible conséquence** : agir directement.
- **Incertitude moyenne, faible conséquence** : répondre avec prudence et laisser une porte de correction.
- **Forte incertitude, conséquence significative** : poser au maximum une question ciblée.
- **Forte incertitude, personne surchargée** : ne pas questionner ; soutenir et rester minimal.
- **Risque élevé** : le noyau de sécurité prend la priorité.

---

## Plan d’implémentation

### V4.1 — Orchestrateur autonome

- brancher tous les moteurs ;
- créer l’état complet ;
- produire un plan ;
- définir les contraintes ;
- choisir budget, modèle et stratégie ;
- exposer uniquement la réponse publique.

### V4.2 — Critique et révision

- critique multicritère ;
- verdict accepter, réviser ou fallback ;
- révision bornée ;
- fallback construit depuis l’état cognitif.

### V4.3 — Mémoire gouvernée

- mémoire structurée ;
- contradictions ;
- provenance ;
- expiration ;
- consentement ;
- visualisation et suppression.

### V4.4 — Sécurité V2

- couverture sémantique ;
- contexte ;
- signaux indirects ;
- ressources France ;
- tests adversariaux.

### V4.5 — Évaluation industrielle

- corpus versionné ;
- rubriques ;
- comparaison de versions ;
- tests longs ;
- seuils de lancement.

### V4.6 — Multimodal temps réel

- streaming ;
- voix interruptible ;
- état prosodique prudent ;
- environnement adaptatif ;
- modes dégradés.

### V4.7 — Évolution opérationnelle

- collecte de métriques agrégées ;
- mode fantôme ;
- canari ;
- rollback ;
- registre des décisions.

---

## Verdict

La V3 constitue une bonne base de recherche et de structuration. Elle n’est pas encore une intelligence émotionnelle autonome de nouvelle génération.

La V4 proposée est nettement plus poussée parce qu’elle ne se contente plus de détecter et répondre. Elle organise une boucle cognitive complète :

```text
percevoir
→ interpréter plusieurs possibilités
→ mesurer l’incertitude
→ choisir
→ agir
→ critiquer
→ corriger
→ mémoriser
→ apprendre sous gouvernance
```

C’est cette boucle, et non l’accumulation de fonctions, qui doit devenir le cœur d’ATLAS.
