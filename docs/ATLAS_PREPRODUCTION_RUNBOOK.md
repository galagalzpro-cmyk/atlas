# ATLAS — Runbook de préproduction

## 1. Statut

Cette branche constitue une version candidate de préproduction. Elle ne doit pas être fusionnée ni promue publiquement avant validation de chaque porte de sortie ci-dessous.

## 2. Ordre d’activation

1. Provisionner une base PostgreSQL dédiée à la préproduction.
2. Configurer `DATABASE_URL` sur l’environnement Preview uniquement.
3. Exécuter `npm run db:migrate` depuis un poste d’administration sécurisé.
4. Définir les variables bootstrap temporaires et exécuter `npm run db:bootstrap-admin` une seule fois.
5. Supprimer immédiatement les variables bootstrap.
6. Configurer `ATLAS_APP_URL`, `CRON_SECRET`, le fournisseur d’e-mail et, facultativement, OpenAI.
7. Configurer Stripe et PayPal uniquement avec des identifiants sandbox.
8. Enregistrer les endpoints `/api/webhooks/stripe` et `/api/webhooks/paypal` auprès des fournisseurs.
9. Planifier l’appel authentifié de `/api/maintenance`.
10. Vérifier `/api/readiness` jusqu’à obtenir `preproduction-ready`.

## 3. Tests d’acceptation

### Identité
- Connexion valide et invalide.
- Révocation à la déconnexion.
- Réinitialisation du mot de passe et fermeture des anciennes sessions.
- Refus de `/administration` pour tout rôle autre que `atlas_admin`.
- Invitation à usage unique, expiration et rattachement à la bonne organisation.

### Conversation
- Réponse locale sans consentement IA externe.
- Réponse locale obligatoire pour un signal urgent.
- Repli local lorsque le fournisseur IA dépasse le délai ou échoue.
- Absence de texte de session dans PostgreSQL, analytics et audit.

### Paiements
- Création d’une session Stripe test et d’une commande PayPal sandbox.
- Refus des clés Stripe live lorsque le mode sandbox est actif.
- Rejet d’un webhook dont la signature est invalide.
- Idempotence lors de la répétition d’un même événement.
- Mise à jour d’abonnement uniquement après webhook vérifié.

### Exploitation
- Readiness retourne 503 lorsqu’une dépendance obligatoire manque.
- Maintenance refuse un secret incorrect.
- La console admin affiche les agrégats, jamais les contenus.
- Les alertes webhook et IA apparaissent dans les métriques opérationnelles.

## 4. Portes de mise en production

La production reste bloquée tant que les points suivants ne sont pas tous documentés :
- entité juridique et coordonnées de contact ;
- conditions, confidentialité, remboursement et fiscalité validés ;
- analyse d’impact et registre des traitements ;
- procédure de gestion des incidents et des demandes de droits ;
- revue clinique/sécurité des messages urgents ;
- tests d’accessibilité sur clavier, lecteur d’écran, contraste et mouvement réduit ;
- sauvegardes PostgreSQL, restauration testée et rotation des secrets ;
- monitoring, alertes, astreinte et propriétaire de chaque alerte ;
- revue indépendante des contrôles d’authentification et des webhooks ;
- validation sandbox complète Stripe/PayPal.

## 5. Réponse aux incidents

### Niveau 1 — dégradation
Désactiver l’intégration concernée, maintenir le moteur local, vérifier les logs techniques et documenter l’heure de début.

### Niveau 2 — paiement ou accès
Bloquer les checkouts, révoquer les sessions concernées, suspendre les comptes suspects et préserver les événements d’audit.

### Niveau 3 — exposition potentielle de données
Couper les intégrations externes, révoquer les secrets, isoler la base, préserver les preuves, identifier les catégories et personnes concernées, puis déclencher l’évaluation juridique de notification.

## 6. Retour arrière

- Ne jamais modifier directement `main` pendant la préproduction.
- Conserver le dernier déploiement Vercel `READY` comme candidat de retour arrière.
- Les migrations sont additives ; toute migration destructive devra disposer d’un script inverse et d’une sauvegarde vérifiée.
- Les paiements de production restent derrière `ATLAS_ENABLE_PRODUCTION_CHECKOUT=false` jusqu’à décision formelle.

## 7. Propriétaires à nommer avant lancement

- produit ;
- sécurité ;
- données et conformité ;
- clinique/sûreté émotionnelle ;
- exploitation ;
- facturation et support client.
