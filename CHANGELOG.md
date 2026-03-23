# Mesures Terrain — Changelog

## v3.5.0 (mars 2026) — Refactorisation & Light Mode

### Corrections de bugs
- Fix logo path : `assets/grdf-logo.png` → `assets/grdflogo.png`
- Fix version label HTML hardcodée `v3.4.0` → correctement gérée par `setVersion()`
- Fix `meta theme-color` : valeur sombre `#0a0e17` remplacée par `#f5f7fa` (cohérent thème clair)
- Fix `apple-mobile-web-app-status-bar-style` : `black-translucent` → `default`

### Nettoyage du code
- Suppression de tous les `console.log()` de debug (state.js, export.js, touch.js)
- Suppression des marqueurs internes `✅ NOUVEAU`, `✅ FIX`, `✅ CHANGÉ` dans les commentaires
- Suppression de la ligne redondante `window.canvas = null` dans canvas.js
- Nettoyage des en-têtes de fichiers (version unifiée, format cohérent)
- Refactorisation légère de `setMode()` dans app.js (table de messages/types)
- Suppression du double `.remove()` dans `updateScaleBadge()` (classes consolidées)

### Interface
- Thème clair Light Mode (introduit en v3.4.2, officialisé en v3.5.0)
- Accessibilité améliorée : `aria-label` enrichis sur les boutons du dock

## v3.4.2 — Light Mode "Clarity"
- Passage d'un thème sombre à un thème clair professionnel
- Refonte complète des variables CSS

## v3.4.0 — Autosave localStorage
- Sauvegarde automatique de l'état par page
- Restauration après rechargement de page
