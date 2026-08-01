# Déploiement ATLAS sur Vercel

## Déploiement visuel
Le dépôt peut être importé directement dans Vercel avec le preset `Other`, sans commande de build et avec la racine du dépôt comme Root Directory.

## Activation du dialogue IA
La page `parler-a-atlas.html` fonctionne immédiatement en mode local de démonstration. Pour activer l’endpoint serveur `api/atlas-chat.js`, ajouter dans Vercel > Project Settings > Environment Variables :

- `OPENAI_API_KEY` : clé serveur, jamais exposée au navigateur.
- `OPENAI_MODEL` : identifiant du modèle autorisé pour le projet.
- `ATLAS_ALLOWED_ORIGINS` : domaines autorisés séparés par des virgules, par exemple `https://atlas-emotion.fr,https://www.atlas-emotion.fr`.

Redéployer ensuite le projet.

## Vérifications avant publication
- Parcourir toutes les pages sur ordinateur et mobile.
- Vérifier le formulaire, le dialogue et les boutons du relais humain.
- Contrôler les numéros d’urgence selon le pays réellement desservi.
- Remplacer le domaine `atlas-emotion.fr` dans `sitemap.xml` si nécessaire.
- Effectuer une revue sécurité, juridique, RGPD et accessibilité.
- Brancher un service d’e-mail ou CRM pour le formulaire professionnel.
- Relier le relais humain à un annuaire vérifié avant de présenter cette fonction comme opérationnelle.

## Limites du prototype
Le stockage utilisateur est local au navigateur. Il n’existe pas encore d’authentification, de base de données, de chiffrement applicatif de données de compte, de paiement ou de réseau humain opérationnel.
