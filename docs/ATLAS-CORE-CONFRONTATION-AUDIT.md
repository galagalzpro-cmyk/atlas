# ATLAS Core — Audit de confrontation

Date : 5 août 2026
Branche auditée : `core/atlas-conversation-v1`

## Verdict exécutif

ATLAS possède désormais une direction produit forte et plusieurs briques importantes : contrat de présence, mémoire conversationnelle courte, sécurité locale, décision autonome, lecture émotionnelle, contrôle des réponses et adaptation par public.

Cependant, le système ne peut pas encore être qualifié d’intelligence émotionnelle extrême ni de moteur conversationnel verrouillable.

La principale raison est simple : la qualité actuelle repose encore largement sur des règles lexicales, des expressions régulières et des réponses locales prédéfinies. La page de test désactive en plus explicitement le moteur génératif externe. Le comportement réellement testé n’est donc pas encore le comportement cible.

ATLAS est aujourd’hui une architecture prometteuse, mais pas encore un cœur validé.

---

## 1. Ce qui est solide

### 1.1 Vision humaine claire

Le besoin humain est placé avant la démonstration technologique. ATLAS doit estimer si la personne a besoin d’être écoutée, soutenue, clarifiée, orientée, protégée ou laissée libre de continuer sans agir.

### 1.2 Contrat de présence explicite

Le moteur interdit les comportements les plus mécaniques : répétition, questions multiples, formulations robotiques, conseil prématuré, reprise de questions déjà posées et dépendance artificielle.

### 1.3 Orchestration en plusieurs couches

Le flux actuel suit une logique cohérente :

1. sécurité ;
2. lecture émotionnelle ;
3. besoin humain ;
4. décision autonome ;
5. génération ;
6. contrôle de présence ;
7. contrôle émotionnel ;
8. réponse ou repli local.

### 1.4 Déploiement fonctionnel

La dernière version du cœur compile et est déployée sur Vercel.

---

## 2. Les faiblesses critiques

## P0 — Bloquants avant toute validation du cœur

### 2.1 Le moteur puissant n’est pas testé dans l’interface

La page `/conversation` envoie actuellement `externalAiConsent: false` à chaque requête.

Conséquence : le moteur externe n’est jamais utilisé pendant le test standard, même lorsqu’une clé et un modèle sont disponibles. Les essais évaluent principalement le moteur local à règles.

**Correction exigée :**

- ajouter un consentement explicite visible ;
- permettre un mode `local`, un mode `génératif gouverné` et un mode `comparaison` ;
- afficher uniquement aux testeurs la source réelle de la réponse ;
- ne jamais présenter le moteur local comme l’intelligence complète d’ATLAS.

### 2.2 L’intelligence émotionnelle est encore principalement lexicale

La détection émotionnelle repose largement sur des listes de mots, expressions régulières, pondérations et seuils fixes.

Cela fonctionne pour des formulations explicites, mais échoue ou devient fragile avec :

- l’ironie ;
- le sous-entendu ;
- la négation ;
- les contradictions ;
- la honte indirecte ;
- la colère froide ;
- le détachement défensif ;
- les expressions culturelles ;
- les fautes de transcription vocale ;
- les messages très courts dépendant du contexte ;
- les émotions mélangées ou masquées.

**Correction exigée :** conserver les heuristiques comme garde-fou déterministe, mais ajouter une interprétation sémantique structurée, calibrée et révisable par le contexte.

### 2.3 Aucune évaluation conversationnelle sérieuse

Les tests actuels couvrent surtout la sécurité de base, les rôles, l’état du runtime et la gouvernance technique. Ils ne mesurent pas la conversation.

Il manque notamment :

- des conversations de 20 à 50 tours ;
- des tests de non-répétition ;
- des tests de mémoire ;
- des changements de sujet ;
- des corrections d’incompréhension ;
- des refus de répondre ;
- des émotions implicites ;
- des contradictions ;
- des réponses adolescentes, adultes et seniors ;
- des faux positifs de sécurité ;
- des faux négatifs de sécurité ;
- des tests de pression, manipulation et dépendance ;
- des comparaisons entre versions du moteur.

**Correction exigée :** créer une suite d’évaluation dédiée au cœur ATLAS, avec scénarios, critères, notes, régressions et validation humaine.

### 2.4 Les inférences émotionnelles sont renvoyées au client

L’API retourne actuellement les objets internes `autonomy` et `emotional` avec la réponse.

Cela expose des inférences sensibles sur l’état émotionnel, l’ouverture, l’intensité ou la disponibilité à agir. Même en environnement de test, cette structure ne doit pas devenir une habitude de production.

**Correction exigée :**

- garder ces données côté serveur ;
- ne renvoyer qu’un identifiant technique de trace en mode test autorisé ;
- limiter la journalisation ;
- ne jamais stocker une inférence émotionnelle durable sans finalité claire, consentement et gouvernance.

### 2.5 Le cœur est mélangé avec des modules hors périmètre

La branche `core/atlas-conversation-v1` contient aussi l’authentification de test, les organisations, les invitations et la récupération d’accès.

Cela empêche un verrouillage propre du cœur et rend les régressions difficiles à isoler.

**Correction exigée :** créer un noyau indépendant et testable :

- `atlas-core/conversation` ;
- `atlas-core/emotion` ;
- `atlas-core/safety` ;
- `atlas-core/memory` ;
- `atlas-core/evaluation` ;
- adaptateurs API et interface séparés.

---

## P1 — Optimisations indispensables

### 3.1 Mémoire insuffisante

La mémoire actuelle correspond essentiellement aux derniers tours envoyés par le navigateur. Elle n’est ni structurée, ni persistante, ni hiérarchisée.

Il faut distinguer :

- mémoire du tour courant ;
- mémoire de session ;
- faits stables consentis ;
- préférences conversationnelles ;
- éléments à ne pas redemander ;
- sujets laissés de côté ;
- corrections de l’utilisateur ;
- éléments à oublier ;
- mémoire sensible à expiration courte.

Le système doit être capable de répondre à :

- ce qui est certain ;
- ce qui est supposé ;
- ce qui a été corrigé ;
- ce qui ne doit plus être utilisé ;
- ce que la personne a refusé de préciser.

### 3.2 Modèles par âge trop rigides

Les catégories adolescent, adulte et senior sont utiles pour la sécurité et l’accessibilité, mais elles ne doivent pas déterminer à elles seules le ton.

L’adaptation doit surtout reposer sur :

- le vocabulaire réel de la personne ;
- son rythme ;
- sa longueur de message ;
- son besoin de structure ;
- ses préférences ;
- sa maîtrise numérique ;
- ses capacités visuelles, auditives ou cognitives ;
- son désir de tutoiement ou vouvoiement.

L’âge devient un signal parmi d’autres, jamais un scénario prédéfini.

### 3.3 Absence de planification conversationnelle interne

Le moteur possède une décision de posture, mais pas encore un véritable plan conversationnel dynamique.

Il faut introduire un état interne minimal :

- objectif actuel de la personne ;
- sujet principal ;
- sujets secondaires ;
- question déjà résolue ;
- tension non résolue ;
- niveau de confiance relationnelle ;
- progression perçue ;
- prochain mouvement possible ;
- raison de ne pas poser de question.

Ce plan doit rester invisible pour la personne et être recalculé à chaque tour.

### 3.4 Repli local trop générique

Lorsqu’une réponse générée est rejetée, ATLAS revient vers une réponse locale relativement standardisée.

Cela peut produire une rupture brutale de qualité et un retour à une conversation mécanique.

Il faut un repli à plusieurs niveaux :

1. régénération ciblée avec les raisons du rejet ;
2. modèle secondaire ou configuration plus contrainte ;
3. réponse locale contextualisée ;
4. réponse minimale de présence ;
5. sécurité ou relais humain si nécessaire.

### 3.5 Pas de boucle de critique contrôlée

Une seule génération suivie d’un filtre binaire est insuffisante.

Le moteur devrait pouvoir :

- générer une proposition ;
- l’évaluer selon des critères explicites ;
- corriger uniquement le défaut détecté ;
- limiter le nombre de tentatives ;
- basculer proprement vers un repli sûr.

La critique ne doit pas produire de raisonnement visible ni augmenter fortement la latence.

### 3.6 Latence et fluidité non optimisées

Le timeout actuel peut atteindre 14 secondes. Pour une conversation émotionnelle, ce délai peut casser la présence.

Il faut :

- réponse en flux continu ;
- premier fragment rapide ;
- annulation immédiate ;
- pré-calcul local de sécurité et de posture ;
- génération parallèle de certains contrôles ;
- objectifs de latence par percentile ;
- mode dégradé cohérent en cas de lenteur.

---

## P2 — Ce qui peut pousser ATLAS au niveau supérieur

### 4.1 Moteur de compréhension à hypothèses multiples

ATLAS ne devrait pas choisir une émotion unique trop tôt. Il devrait maintenir plusieurs hypothèses avec confiance :

- émotion possible ;
- besoin possible ;
- intention possible ;
- niveau d’ouverture ;
- risque d’erreur.

La réponse doit rester compatible avec plusieurs hypothèses tant que la personne n’a pas clarifié.

### 4.2 Méta-adaptation du style

ATLAS doit apprendre pendant la session :

- réponses courtes ou développées ;
- question directe ou progressive ;
- tutoiement ou vouvoiement ;
- langage émotionnel ou concret ;
- besoin de silence ;
- tolérance aux exercices ;
- préférence pour l’écrit ou la voix.

Cette adaptation doit être réversible et contrôlable.

### 4.3 Connaissances sociétales gouvernées

Les phénomènes sociaux et générationnels doivent être intégrés via une base de connaissances traçable, versionnée et actualisable.

ATLAS ne doit pas injecter automatiquement des explications sociologiques dans la conversation. Il doit les mobiliser seulement lorsqu’elles améliorent réellement la compréhension ou l’orientation.

### 4.4 Évaluation humaine structurée

La qualité émotionnelle ne peut pas être validée uniquement par des tests automatiques.

Il faut des évaluateurs formés :

- psychologues ;
- professionnels de l’écoute ;
- spécialistes adolescents ;
- gérontologues ou professionnels seniors ;
- experts en violences et harcèlement ;
- juristes et spécialistes de la protection des données ;
- personnes concernées par les parcours testés.

### 4.5 Indicateurs de qualité adaptés

Ne pas optimiser le temps passé ou le nombre de messages comme objectif principal.

Mesurer plutôt :

- sentiment d’être compris ;
- absence de répétition ;
- continuité du fil ;
- respect de l’autonomie ;
- pertinence de la question ;
- amélioration de la clarté ;
- réparation après erreur ;
- sécurité ;
- absence de dépendance artificielle ;
- capacité à terminer la conversation librement.

---

## 5. Architecture cible du cœur

```text
Entrée utilisateur
    ↓
Normalisation et contexte
    ↓
Sécurité déterministe indépendante
    ↓
Mémoire structurée et contradictions
    ↓
Interprétation sémantique multi-hypothèses
    ↓
État relationnel et émotionnel
    ↓
Décision de posture
    ↓
Plan conversationnel invisible
    ↓
Génération gouvernée
    ↓
Critique de présence / sécurité / continuité
    ↓
Correction limitée ou repli contextualisé
    ↓
Réponse en flux
    ↓
Mise à jour contrôlée de la mémoire et des métriques
```

---

## 6. Ordre de travail recommandé

### Verrou 1 — Vérité du test

- activer réellement le moteur génératif avec consentement ;
- afficher la source de réponse uniquement en mode laboratoire ;
- supprimer toute ambiguïté entre local et génératif.

### Verrou 2 — Évaluations

- créer au moins 100 scénarios déterministes ;
- créer 30 conversations longues ;
- mesurer les répétitions, ruptures, erreurs de sécurité et réponses mécaniques ;
- constituer un jeu de référence humain.

### Verrou 3 — Mémoire structurée

- faits ;
- préférences ;
- corrections ;
- refus ;
- incertitudes ;
- expiration ;
- consentement.

### Verrou 4 — Intelligence sémantique

- remplacer la dépendance centrale aux mots-clés par une interprétation multi-hypothèses ;
- conserver les règles locales comme garde-fous ;
- calibrer l’incertitude.

### Verrou 5 — Fluidité

- streaming ;
- latence ;
- annulation ;
- reprise ;
- stabilité multi-tour.

### Verrou 6 — Validation humaine

- tests par population ;
- revue sécurité ;
- revue clinique et éthique ;
- validation des critères de verrouillage.

---

## Conclusion

La vision d’ATLAS est plus avancée que son implémentation actuelle.

Le projet possède un bon squelette, mais il faut maintenant arrêter d’ajouter des concepts et commencer à prouver chaque capacité.

Le prochain progrès majeur ne viendra pas d’un nouveau module émotionnel. Il viendra de trois choses :

1. tester le vrai moteur ;
2. mesurer objectivement les conversations ;
3. remplacer progressivement les heuristiques fragiles par une compréhension sémantique gouvernée.

ATLAS ne doit être verrouillé que lorsque sa qualité est démontrée sur des conversations longues, variées, difficiles et évaluées humainement.
