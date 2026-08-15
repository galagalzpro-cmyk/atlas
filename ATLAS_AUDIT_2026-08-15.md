# Audit complet ATLAS — 15 août 2026

## Conclusion exécutive

Le lien audité, `https://atlas-i2mc7pnvi-atlas-france.vercel.app/`, correspond bien au projet Vercel **ATLAS** et au dépôt GitHub public `galagalzpro-cmyk/atlas`. Codex a donc pu retrouver ATLAS, identifier son déploiement, récupérer sa source et reproduire le défaut conversationnel signalé.

Le verdict se décompose en deux états distincts :

- **version actuellement en ligne : non prête pour un lancement public** ; sa conversation perd son historique car le secret de continuité n’est pas configuré, l’IA externe et la base sont absentes, et aucune des portes formelles de lancement observées n’était validée ;
- **candidate corrigée ATLAS 1.1.0-rc.2 : validée localement pour une preview privée configurée**, avec la chaîne complète de contrôles au vert et un test réel à plusieurs tours réussi.

La candidate ne doit pas être présentée comme un dispositif médical, un service d’urgence ou une production commerciale achevée. Les validations juridique, clinique, RGPD, sécurité indépendante, accessibilité humaine, exploitation et appareils physiques restent des responsabilités externes impossibles à inventer par du code.

## Périmètre et preuves

| Élément | Observation |
|---|---|
| Projet Vercel | `atlas`, équipe `atlas-france` |
| URL transmise | déploiement `dpl_8ga6kFNMchUK5uSb4RkPJQ9vPyK4` |
| Commit de l’URL transmise | `8a69d37d53b1285a386e680046e6b13adf7befff` |
| Branche source | `build/atlas-v5-web-experience` |
| Source récupérée pour correction | commit `ec0a5115adc89223bb415d74b0ee11bca237274e` |
| Version créée | `1.1.0-rc.2` |
| Cadre technique | Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, Node.js 24 |

L’audit a couvert le site public, le salon conversationnel, le moteur de présence visuelle, les routes serveur, les mécanismes de sécurité, les comptes de test, la configuration Vercel visible, les portes de lancement, les tests et la construction de production.

## Résultats prioritaires

| Priorité | Constat initial | Risque | Correction / statut |
|---|---|---|---|
| Critique | Le second message recevait la même question que le premier. | Faux sentiment de mémoire, conversation incohérente. | Cause reproduite : `ATLAS_CONVERSATION_STATE_SECRET` absent, donc historique systématiquement vide. La readiness, l’API et l’interface déclarent désormais honnêtement l’absence de continuité. Test réel corrigé : deux réponses distinctes avec état signé. Configuration Vercel encore requise. |
| Élevée | Le mode de test s’activait automatiquement sur une preview sans base et exposait des identifiants connus, dont un rôle administrateur de démonstration. | Accès trompeur ou abus d’une preview publique. | Le mode de test exige désormais `ATLAS_TEST_MODE=true` et reste limité à une preview ou au développement local. Les identifiants ne sont plus rendus quand le mode est inactif. |
| Élevée | « Je n’arrive plus à respirer » était traité comme une simple panique avec exercice respiratoire. | Retard potentiel de prise en charge d’une urgence médicale. | Nouvelle catégorie `medical_emergency`, génération externe interrompue et orientation immédiate vers le 15/112/114. |
| Élevée | Absence de catégorie dédiée pour une intention explicite de violence envers autrui. | Réponse conversationnelle ordinaire dans un contexte dangereux. | Nouvelle catégorie `violence_intent`, éloignement des armes/personnes et orientation 17/112/114. |
| Élevée | Détection suicidaire trop étroite. | Omission de formulations de désespoir ou d’idées suicidaires. | Couverture étendue, distinction entre signal urgent et signal d’attention, orientation 3114 et secours si danger immédiat. Un test limite aussi les faux positifs dans un contexte de prévention. |
| Élevée | Le déploiement déclarait être prêt aux tests fonctionnels malgré l’absence de continuité réelle. | Indicateur de santé trompeur. | `localConversation`, `conversationContinuity` et `externalAi` exigent maintenant une continuité signée réellement configurée. |
| Moyenne | Modèles par défaut anciens, budget de sortie trop court et délai externe de 18 s. | Réponses vides/incomplètes et replis locaux silencieux. | Routage proposé vers `gpt-5.6-luna`, `gpt-5.6-terra` et `gpt-5.6-sol`, budgets augmentés, verbosité pilotée, délai configurable à 45 s et identifiant de sécurité pseudonymisé. La disponibilité effective dépend du compte et de la clé OpenAI. |
| Moyenne | La voix était activée par défaut. | Lecture sonore inattendue, confidentialité et accessibilité. | Voix désactivée par défaut ; activation volontaire dans les réglages. |
| Moyenne | Le mode calme masquait les états écoute/réflexion/réponse. | Retour visuel contradictoire. | Les états fonctionnels ont priorité ; le calme agit seulement hors activité. |
| Moyenne | Une requête tardive pouvait réinjecter une réponse après remise à zéro ou changement de public. | Mélange de conversations. | Annulation des requêtes, génération de session et refus des réponses devenues obsolètes. |
| Moyenne | En cas d’erreur, le texte saisi disparaissait et le fil restait incohérent. | Perte de saisie et mauvaise récupération. | Le message est restauré et le tour optimiste est retiré proprement. |
| Moyenne | Entrée pouvait envoyer durant une composition IME. | Envoi involontaire pour certaines méthodes de saisie. | Prise en compte de `isComposing`. |
| Moyenne | « Conversation profonde » ouvrait seulement des réglages. | Promesse d’interface trompeuse. | Libellé remplacé par « Réglages de conversation ». |
| Moyenne | Le canevas recalculait inutilement, restait actif dans un onglet masqué et gérait mal le mouvement réduit. | CPU/GPU, batterie, lenteurs et accessibilité. | Fréquence plafonnée selon la qualité, pause en arrière-plan, redessin statique en mouvement réduit, suppression d’allocations par image et redimensionnement seulement lorsque nécessaire. |
| Faible | Absence de titre principal explicite dans le salon. | Navigation moins claire au lecteur d’écran. | Ajout d’un `h1` accessible. |

## Moteur conversationnel corrigé

Le moteur conserve maintenant un historique signé, limité à 20 tours et 1 800 caractères par tour, sans base de données obligatoire. Toute modification du jeton est rejetée et le changement de public invalide l’état. L’interface demande les capacités réelles au serveur et affiche un avertissement si la continuité manque.

Test réel exécuté contre la construction locale :

1. « Bonjour, je me sens stressé par mon travail. »
2. réponse : « Je vous suis. Qu’est-ce qui vous affecte le plus aujourd’hui ? »
3. « C’est surtout la charge, les réunions et les délais. » avec l’état signé du premier tour ;
4. réponse : « D’accord, continuons. Depuis quand cela prend-il autant de place ? »

La seconde réponse n’est plus répétée et la continuité est déclarée `signed` aux deux tours.

L’IA externe reste facultative, soumise au consentement de session, désactivée si la clé ou la continuité manque, appelée avec `store: false`, sortie structurée et identifiant de sécurité pseudonymisé. Les modèles proposés suivent la famille GPT-5.6 documentée par OpenAI : [catalogue des modèles](https://developers.openai.com/api/docs/models) et [guide du modèle courant](https://developers.openai.com/api/docs/guides/latest-model).

## Sécurité émotionnelle et urgences

Les messages urgents restent générés localement : ils ne sont pas envoyés au fournisseur d’IA. Les ressources françaises ont été vérifiées le 15 août 2026 : [3114](https://3114.fr/), [119](https://www.service-public.fr/particuliers/vosdroits/F781?lang=fr), [15/17/112/114](https://www.service-public.fr/particuliers/actualites/A17758?lang=fr), [3018](https://www.service-public.fr/particuliers/vosdroits/F32239?lang=fr) et [3919](https://arretonslesviolences.gouv.fr/associations-de-lutte-contre-les-violences-sexistes-et-sexuelles).

Cette détection par motifs reste une barrière conservatrice, pas un diagnostic. Elle doit être évaluée sur un corpus français diversifié par des professionnels indépendants avant ouverture au public, avec mesure des faux négatifs et faux positifs.

## Moteur visuel et accessibilité

Le rendu public initial était cohérent et aucune erreur de console n’a été observée lors de la première inspection. La candidate corrige les transitions de présence, l’adaptation de qualité, le mouvement réduit, la pause d’animation hors écran et le risque de redimensionnement répétitif.

La construction de production et l’inspection initiale sont réussies. La capture automatisée finale du salon corrigé a toutefois expiré dans le contrôleur de navigateur local ; elle ne remplace donc pas la recette humaine exigée sur appareils physiques. Les contrôles clavier, lecteur d’écran, contrastes, zoom, Safari/iOS, Chrome/Android, performances GPU faibles et autorisations micro doivent rester une porte formelle de lancement.

## Contrôles automatisés finaux

`npm run check` est entièrement réussi sur ATLAS 1.1.0-rc.2 :

- architecture visuelle : **61 fichiers validés** ;
- sécurité serveur : **34 contrôles validés** ;
- tests runtime, gouvernance et sécurité : réussis ;
- tests conversation, mémoire et émotion : réussis ;
- autonomie V4 et critique de réponse : réussies ;
- routage de modèles V5 : réussi ;
- contrôle de lancement, profil juridique et ressources d’urgence : réussis ;
- nouveau test de continuité signée, altération et public : réussi ;
- TypeScript : aucune erreur ;
- build Next.js de production : **28 routes compilées**, aucune erreur.

## État réel de mise en service

Au moment de l’audit, la readiness du déploiement transmis indiquait notamment : base, authentification, espace professionnel, administration, secret de conversation, IA externe, e-mail transactionnel et maintenance planifiée non configurés. Le contrôle de lancement public observé était à **0/27**.

La candidate peut être testée en preview privée après configuration minimale de `ATLAS_CONVERSATION_STATE_SECRET`. Pour tester l’IA avancée, il faut aussi une clé OpenAI valide et confirmer l’accès aux modèles configurés. Pour les comptes réels, il faut PostgreSQL et les migrations. Les variables doivent être saisies directement dans Vercel ; aucune valeur secrète ne doit entrer dans GitHub.

## Portes restantes avant lancement public

1. identité juridique, coordonnées, hébergeur et versions contractuelles définitives ;
2. domaine public final et décision formelle du fondateur ;
3. PostgreSQL, e-mail, maintenance, observabilité, alertes et retour arrière testés ;
4. revue juridique/RGPD, analyse d’impact, rétention et effacement de bout en bout ;
5. audit de sécurité externe et fermeture des constats élevés ;
6. évaluation clinique indépendante des réponses, notamment urgences et mineurs ;
7. évaluation conversationnelle sur corpus et tests de charge ;
8. recette accessibilité et visuelle humaine multi-appareils ;
9. relais humain et exploitation réellement joignables ;
10. paiements réels maintenus désactivés jusqu’à validation commerciale complète.

## Fichiers principaux modifiés

- `app/conversation/page.tsx` : états, consentement, reprise sur erreur, annulation, accessibilité et transparence des moteurs ;
- `components/atlas/lounge/AtlasNeuralCanvas.tsx` : performance, visibilité et mouvement réduit ;
- `app/api/conversation/route.ts` et `app/api/readiness/route.ts` : capacités réelles, continuité et confidentialité ;
- `lib/server/ai.ts` : routage GPT-5.6, budgets et `safety_identifier` ;
- `lib/atlas/safety.ts`, `safety-response.ts` et `autonomy.ts` : urgences et gouvernance ;
- `lib/server/test-mode.ts` et `app/connexion/*` : fermeture du mode de test implicite ;
- `tests/*`, `.env.example`, `README.md`, `package.json` et `package-lock.json` : validation et version 1.1.0-rc.2.

## Décision recommandée

Publier la candidate sur une **branche et une preview privée**, y configurer le secret de continuité, refaire la recette visuelle humaine, puis exécuter une évaluation conversationnelle documentée. Ne promouvoir vers la production publique qu’après fermeture des portes indépendantes et opérationnelles ci-dessus.
