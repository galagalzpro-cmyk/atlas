# ATLAS — Contrat de complétude 100 %

**Statut : exigence fondatrice et bloquante**  
**Applicable à : ATLAS V5 Autonomous Emotional Operating System et versions suivantes**

## 1. Principe

ATLAS doit atteindre **100 % de couverture dans chaque domaine critique** avant toute déclaration de préparation publique.

Cette exigence signifie :

- 100 % des exigences identifiées sont spécifiées ;
- 100 % des contrôles obligatoires sont implémentés ;
- 100 % des tests requis sont exécutés ;
- 100 % des preuves attendues sont présentes et valides ;
- 100 % des défauts critiques et élevés sont fermés ;
- 100 % des zones du système sont rattachées à un propriétaire, une politique et un mécanisme de contrôle ;
- 0 angle mort accepté ;
- 0 affirmation non démontrée ;
- 0 dépendance cachée à une intervention humaine quotidienne ;
- 0 capacité externe sans gouvernance.

## 2. Limite de vérité

« 100 % » ne signifie jamais :

- infaillibilité absolue ;
- impossibilité physique d’une panne ;
- absence éternelle de vulnérabilité ;
- omniscience ;
- conformité universelle et permanente ;
- certitude parfaite sur l’état émotionnel d’une personne.

La formulation correcte est :

> **100 % du périmètre défini, mesuré et vérifié est couvert par des exigences, des contrôles, des tests, des preuves, une observabilité et un mécanisme de récupération.**

Le périmètre, la version, l’environnement, la date et la durée de validité doivent toujours être indiqués.

## 3. Interdiction de la moyenne

ATLAS ne sera jamais évalué uniquement par une moyenne globale.

```text
100 % design + 92 % sécurité = non prêt
100 % autonomie + 95 % confidentialité = non prêt
100 % conversation + 90 % résilience = non prêt
```

Chaque domaine critique possède un veto indépendant.

## 4. Unité de preuve

Chaque exigence doit être représentée par un enregistrement contenant :

- identifiant unique ;
- domaine ;
- criticité ;
- description ;
- menace ou besoin couvert ;
- contrôle associé ;
- code ou configuration concerné ;
- tests ;
- résultat ;
- artefact de preuve ;
- commit ;
- environnement ;
- date ;
- expiration ;
- responsable ;
- statut ;
- mécanisme de rollback ;
- risque résiduel.

Une exigence sans preuve vaut **0 %**, même si le code semble correct.

## 5. Formule de complétude

Pour chaque domaine :

```text
Complétude =
min(
  couverture des exigences,
  couverture des contrôles,
  couverture des tests,
  couverture des preuves,
  couverture opérationnelle,
  couverture de récupération
)
```

Le score du domaine est donc déterminé par son élément le plus faible.

Le score global d’ATLAS est :

```text
Score ATLAS = minimum de tous les domaines critiques
```

ATLAS n’atteint 100 % que lorsque **chaque domaine** atteint 100 %.

## 6. États autorisés

Chaque exigence possède l’un des états suivants :

- `unmapped` — non rattachée à un contrôle ;
- `specified` — définie mais non implémentée ;
- `implemented` — code présent ;
- `tested` — tests exécutés ;
- `adversarially_tested` — attaques et cas limites exécutés ;
- `observed` — comportement mesuré ;
- `proven` — preuve complète et valide ;
- `expired` — preuve devenue invalide ;
- `regressed` — régression détectée ;
- `blocked` — défaut ou dépendance ouverte.

Seul l’état `proven` contribue à 100 %.

## 7. Domaines du programme 100 %

Le programme couvre au minimum :

1. intelligence émotionnelle ;
2. sécurité émotionnelle ;
3. qualité conversationnelle ;
4. autonomie décisionnelle ;
5. planification multi-étapes ;
6. mémoire ;
7. modèle du monde ;
8. sécurité agentique ;
9. outils et actions ;
10. consentement ;
11. confidentialité ;
12. gouvernance des données ;
13. identité et accès ;
14. chiffrement et secrets ;
15. modèles et fournisseurs ;
16. résilience ;
17. auto-réparation ;
18. observabilité ;
19. workflows durables ;
20. auto-évolution ;
21. évaluations ;
22. red teaming ;
23. accessibilité ;
24. performance ;
25. voix et multimodal ;
26. design et immersion ;
27. paiements et commerce ;
28. support et opérations ;
29. CI/CD et supply chain ;
30. sauvegarde et restauration ;
31. continuité d’activité ;
32. juridique et conformité ;
33. mineurs ;
34. internationalisation ;
35. documentation et vérité opérationnelle ;
36. gouvernance du Constitutional Kernel.

Cette liste peut être étendue. Elle ne peut pas être réduite pour améliorer artificiellement le score.

## 8. Criticités

### Critique

Défaut pouvant produire :

- préjudice humain ;
- fuite de données sensibles ;
- action extérieure non autorisée ;
- contournement du Constitutional Kernel ;
- perte d’intégrité ;
- erreur de sécurité grave ;
- indisponibilité générale ;
- engagement financier ou juridique incorrect.

**Tolérance : 0 défaut ouvert.**

### Élevée

Défaut pouvant produire :

- incompréhension significative ;
- perte de continuité ;
- violation de consentement ;
- mauvaise mémoire ;
- perte de résilience ;
- incapacité de rollback ;
- dérive non détectée.

**Tolérance avant lancement : 0 défaut ouvert.**

### Moyenne et faible

Elles peuvent être acceptées uniquement si :

- le risque résiduel est documenté ;
- aucune sécurité ou liberté humaine n’est affectée ;
- une échéance est fixée ;
- une mitigation existe ;
- elles n’empêchent pas l’usage prévu.

Elles empêchent néanmoins l’usage du terme « 100 % » tant qu’elles concernent le périmètre évalué.

## 9. Tests obligatoires

Le programme 100 % exige :

- tests unitaires ;
- tests d’intégration ;
- tests de contrat ;
- tests end-to-end ;
- tests de propriété ;
- fuzzing ;
- tests adversariaux ;
- tests de sécurité agentique ;
- tests d’injection directe et indirecte ;
- tests de mémoire empoisonnée ;
- tests de conversations longues ;
- tests multilingues ;
- tests par public ;
- tests d’accessibilité automatiques et manuels ;
- tests de charge ;
- tests de saturation ;
- tests chaos ;
- tests de failover ;
- tests de restauration ;
- tests de rollback ;
- tests de perte de fournisseur ;
- tests de perte de réseau ;
- tests de corruption de données ;
- tests de coûts et budgets ;
- évaluations humaines consenties ;
- audit externe lorsque le domaine l’exige.

Un test non exécuté est un blocker, pas une hypothèse de réussite.

## 10. Preuves obligatoires

Le statut 100 % nécessite :

- rapport de tests ;
- couverture ;
- rapport adversarial ;
- SBOM ;
- résultats SAST et dépendances ;
- provenance de build ;
- signature d’artefact ;
- attestation de politique ;
- rapport de restauration ;
- rapport de rollback ;
- résultats de charge ;
- résultats d’accessibilité ;
- rapport de confidentialité ;
- rapport de sécurité ;
- rapport juridique ;
- rapport mineurs lorsque concerné ;
- preuves d’observabilité ;
- preuve de rétention et suppression ;
- résultats d’évaluations conversationnelles ;
- version des ressources d’urgence ;
- preuve de configuration du pays ;
- preuve du modèle et des fournisseurs actifs.

## 11. Maintien du 100 %

Le score n’est pas permanent.

Une preuve peut expirer à cause :

- d’un changement de code ;
- d’un nouveau modèle ;
- d’un changement de fournisseur ;
- d’une nouvelle réglementation ;
- d’une nouvelle menace ;
- d’une dérive observée ;
- d’une modification d’infrastructure ;
- d’un nouveau pays ou public ;
- d’un changement de politique ;
- d’un incident.

Le système doit automatiquement faire repasser le domaine sous 100 % jusqu’à revalidation.

## 12. Readiness fondée sur les preuves

La préparation publique doit être calculée depuis un registre de preuves et non depuis des variables déclaratives.

```text
ready =
all_domains == 100
AND critical_open == 0
AND high_open == 0
AND evidence_expired == 0
AND rollback_tested == true
AND restore_tested == true
AND policy_attested == true
```

Toute autre logique est insuffisante.

## 13. Interdictions de communication

Sans preuve valide, ATLAS ne doit jamais être décrit comme :

- parfait ;
- infaillible ;
- totalement sécurisé ;
- sans risque ;
- entièrement autonome ;
- conforme ;
- validé cliniquement ;
- prêt pour tous les publics ;
- prêt pour tous les pays.

Les communications doivent refléter exactement le niveau prouvé.

## 14. Discipline de construction

Chaque composant suit obligatoirement :

```text
cartographie
→ menace et besoin
→ spécification
→ architecture
→ implémentation
→ tests
→ adversarial
→ observabilité
→ récupération
→ preuve
→ maintien
```

Aucune fonctionnalité ne sera considérée terminée après la seule implémentation.

## 15. Programme d’exécution

### Étape A — Cartographie exhaustive

- inventorier le code, les données, les modèles, les fournisseurs, les routes, les tâches et les privilèges ;
- identifier toutes les dépendances ;
- créer le registre des exigences ;
- attribuer criticité et preuves.

### Étape B — Fermeture des fondations

- Constitutional Kernel indépendant ;
- Control Plane ;
- Event Bus ;
- workflows durables ;
- observabilité ;
- registres de modèles, outils, politiques et releases ;
- Evidence Registry.

### Étape C — Intelligence et mémoire

- Memory Fabric ;
- World Model ;
- multi-hypothèses ;
- calibration ;
- Model Gateway ;
- critic mesh ;
- évaluation continue.

### Étape D — Autonomie d’action

- Capability Registry ;
- Action Gateway ;
- sandbox ;
- budgets ;
- idempotence ;
- preview ;
- confirmation ;
- vérification ;
- undo.

### Étape E — Résilience et auto-réparation

- failover ;
- circuit breakers ;
- queues ;
- incidents ;
- runbooks signés ;
- chaos tests ;
- rollback ;
- restore drills.

### Étape F — Validation complète

- évaluations longues ;
- red team ;
- audits indépendants ;
- accessibilité ;
- performance ;
- juridique ;
- confidentialité ;
- mineurs ;
- production contrôlée ;
- preuve finale.

## 16. Décision finale

ATLAS ne cherchera pas à paraître complet.

Il devra être **démontrablement complet dans le périmètre annoncé**.

La cible officielle devient :

```text
100 % des domaines
100 % des exigences
100 % des contrôles
100 % des tests obligatoires
100 % des preuves valides
0 blocker critique
0 blocker élevé
0 angle mort accepté
```

Ce contrat prime sur la vitesse, la communication, la date de lancement et la pression commerciale.
