# ATLAS — Rapport de contrôle V1

## Référence visuelle
Le premier écran utilise le master validé comme composition adaptative 2K, 4K et 8K. Le rendu navigateur 1920 × 1080 a été comparé au master redimensionné : écart moyen de 2,16 niveaux par canal sur 255, principalement dû aux effets dynamiques ajoutés (champ neuronal, vignette et halo).

## Contrôles exécutés
- Validation syntaxique JavaScript avec `node --check` : réussie.
- Analyse HTML des pages principales : réussie.
- Test headless Chromium en 1920 × 1080 : réussi.
- Test headless Chromium en 390 × 844 : réussi.
- Aucune erreur JavaScript détectée pendant les scénarios testés.
- Aucune erreur console détectée pendant les scénarios testés.
- Aucun débordement horizontal en desktop : 1920 px / 1920 px.
- Aucun débordement horizontal en mobile : 390 px / 390 px.
- Loader : validé.
- Ouverture et fermeture du parcours : validées.
- Passage des trois étapes du parcours : validé.
- Sélection émotionnelle : validée.
- Séquence de respiration : validée.
- Rendu mobile spécifique : validé.
- Export navigateur 4K : généré.
- Master visuel 8K : 7680 × 4320.

## Architecture
- HTML, CSS et JavaScript natifs.
- Aucun framework et aucune dépendance réseau.
- Lancement local avec Python 3, sans Node.js ni npm.
- PWA avec cache du socle essentiel.
- Mode de réduction des mouvements automatique.
- Ressources 2K, 4K et 8K sélectionnées selon la définition d’écran.

## Limites honnêtes
Les contrôles automatisés ont été exécutés avec Chromium. Une recette de production devra encore être réalisée sur Safari/macOS, Safari/iOS, Firefox, Edge et plusieurs appareils physiques. Le prototype ne contient pas encore l’IA réelle, les comptes utilisateurs, les paiements, la base chiffrée ou le relais humain opérationnel.
