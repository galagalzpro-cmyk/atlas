# ATLAS — Services connectés OAuth

## Objectif

ATLAS connecte Google Workspace, Slack, GitHub et Linear sans exposer les identifiants des applications ni les jetons utilisateurs au navigateur. La base fonctionnelle conserve les métadonnées de connexion et une référence opaque ; les valeurs sensibles sont chiffrées séparément avec AES-256-GCM.

## Parcours commun

1. L’utilisateur authentifié lance la connexion depuis `/compte` par une requête POST de même origine.
2. ATLAS crée une transaction de dix minutes avec un `state` aléatoire haché, une liaison navigateur dans un cookie HttpOnly et un vérificateur PKCE chiffré lorsqu’il est pris en charge.
3. Le fournisseur affiche son propre écran de consentement.
4. Le callback valide l’utilisateur, le fournisseur, le `state`, la liaison navigateur, l’expiration et l’usage unique de la transaction.
5. ATLAS échange le code côté serveur, récupère un indice minimal sur le compte, chiffre les jetons et ne conserve qu’une référence dans `atlas_tool_connections`.
6. Le registre active uniquement les outils couverts par les permissions accordées.

Google, GitHub App et Linear utilisent PKCE S256. Slack utilise son parcours OAuth v2 documenté, avec `state` et jeton utilisateur.

## URLs de callback

Configurer exactement les URLs suivantes auprès des fournisseurs, avec l’origine de `ATLAS_APP_URL` :

- `/api/connections/google/callback`
- `/api/connections/slack/callback`
- `/api/connections/github/callback`
- `/api/connections/linear/callback`

HTTPS est obligatoire hors développement local.

## Permissions initiales

Les valeurs de `.env.example` sont des profils de lecture minimaux :

- Google : identité de base, Gmail en lecture, événements Calendar en lecture et métadonnées Drive en lecture ;
- Slack : recherche, listes et historique des conversations accessibles au compte connecté ;
- GitHub App : métadonnées, contenu, issues et pull requests en lecture ;
- Linear : lecture.

Les permissions d’écriture ne doivent être ajoutées qu’après validation produit et sécurité. Même accordées par le fournisseur, elles restent soumises aux politiques du registre ATLAS : confirmation explicite pour les écritures concernées et authentification forte pour les actions critiques.

Pour GitHub App, `ATLAS_GITHUB_PERMISSIONS` décrit les permissions configurées dans l’App ; un jeton utilisateur GitHub App n’emploie pas les scopes d’une OAuth App classique. Son accès effectif reste l’intersection entre les permissions de l’App, celles de l’utilisateur et les dépôts où l’App est installée.

## Stockage et rotation

- `ATLAS_CONNECTOR_KEY_ENCRYPTION_KEY` doit contenir exactement 32 octets, encodés en hexadécimal ou base64url, et être fourni par le gestionnaire de secrets de l’environnement.
- `ATLAS_CONNECTOR_KEY_VERSION` identifie la version active de la clé.
- Aucun secret réel ne doit être commis dans Git, copié dans un ticket ou transmis dans un chat.
- Les jetons expirants Google, GitHub et Linear sont actualisés sous verrou de connexion avant usage. La rotation Slack est prise en charge lorsqu’elle est activée par l’application Slack.
- Une déconnexion appelle d’abord la révocation distante. ATLAS supprime ensuite la référence et le secret chiffré uniquement après confirmation du fournisseur.

## Mise en service

1. Appliquer les migrations, notamment `database/004_oauth_connections.sql`.
2. Configurer l’origine publique et les identifiants OAuth directement dans le gestionnaire de secrets de l’environnement.
3. Enregistrer les quatre callbacks chez les fournisseurs concernés.
4. Aligner les scopes ou permissions configurés avec les valeurs autorisées par `lib/server/oauth-providers.ts`.
5. Se connecter avec un compte de test, vérifier l’indice de compte et les capacités affichées dans `/compte`.
6. Tester la révocation dans les quinze minutes suivant une authentification par mot de passe, puis confirmer côté fournisseur que l’accès a disparu.
7. Vérifier que les outils d’écriture restent bloqués sans confirmation et que les outils `strong_auth` restent bloqués sans authentification forte récente.

## Références fournisseurs

- Google : <https://developers.google.com/identity/protocols/oauth2/web-server>
- Slack : <https://docs.slack.dev/authentication/installing-with-oauth/>
- GitHub App : <https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app>
- Linear : <https://linear.app/developers/oauth-2-0-authentication>
