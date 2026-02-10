/* ============================================================
   CONFIG.JS - Configuration globale de l'application
   ============================================================ */

const CONFIG = Object.freeze({
  // App
  VERSION: '3.3.0',
  APP_NAME: 'Mesures Terrain',
  
  // PDF Rendering
  PDF_RENDER_SCALE: 3.0,      // Qualité du rendu PDF (ne pas réduire)
  EXPORT_MULTIPLIER: 3,       // Qualité de l'export PNG
  
  // Zoom
  MAX_ZOOM: 20,
  MIN_ZOOM_FACTOR: 0.98,      // % de l'écran au zoom initial
  
  // Drawing
  MIN_DRAW_PX: 5,             // Distance min en pixels pour valider un tracé
  MEASURE_STROKE: 3,          // Épaisseur trait mesure
  SCALE_STROKE: 3,            // Épaisseur trait étalonnage
  SCALE_DASH: [10, 5],        // Pointillés étalonnage
  ARROW_SIZE_BASE: 12,        // Taille flèches (ajustée au zoom)
  
  // UI
  STATUS_DURATION: 2500,      // Durée affichage status (ms)
  CURSOR_OFFSET_Y: -70,       // Décalage mire tactile (au-dessus du doigt)
  CURSOR_OFFSET_X: 0,
  
  // OCR
  OCR: {
    LANG: 'eng',
    CROP_LEFT_W: 0.52,        // 52% largeur à gauche
    CROP_TOP_H: 0.60,         // 60% hauteur en haut
    
    // Regex pour détecter l'échelle (1:50 à 1:5000)
    SCALE_REGEX: /1\s*[:\/.,]\s*([0-9]{2,5})\b/,
    
    // Valeurs d'échelle acceptées
    MIN_SCALE: 10,
    MAX_SCALE: 5000
  },
  
  // Colors (réseaux)
  COLORS: {
    ELEC: '#ff5252',
    GAZ: '#ffab00',
    EAU: '#00b0ff',
    TELECOM: '#00e676',
    FIBRE: '#e040fb'
  },
  
  // Default color
  DEFAULT_COLOR: '#ff5252',
  
  // Custom properties to serialize (centralisé)
  CUSTOM_PROPS: [
    'isMeasure', 'isScale', 'measureValue',
    'isAnnotation', 'annotationValue'
  ]
});

// Modes de l'application
const MODES = Object.freeze({
  PAN: 'pan',
  SCALE: 'scale',
  MEASURE: 'measure',
  ANNOTATION: 'annotation',  // Plan Minute - Cotation
  TEXT: 'text'               // Plan Minute - Texte libre
});

// Export pour utilisation globale
window.CONFIG = CONFIG;
window.MODES = MODES;
