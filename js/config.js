/* ============================================================
   CONFIG.JS - Configuration globale V3.4.2
   ============================================================ */

const CONFIG = Object.freeze({
  VERSION: '3.4.2',
  APP_NAME: 'Mesures Terrain',
  
  PDF_RENDER_SCALE: 3.0,
  EXPORT_MULTIPLIER: 3,
  
  MAX_ZOOM: 20,
  MIN_ZOOM_FACTOR: 0.98,
  
  MIN_DRAW_PX: 5,
  MEASURE_STROKE: 3,
  SCALE_STROKE: 3,
  SCALE_DASH: [10, 5],
  ARROW_SIZE_BASE: 12,
  
  STATUS_DURATION: 3500,  // ✅ CHANGÉ : 2500 → 3500 (+40%)
  CURSOR_OFFSET_Y: -70,
  CURSOR_OFFSET_X: 0,
  
  OCR: {
    LANG: 'eng',
    CROP_LEFT_W: 0.52,
    CROP_TOP_H: 0.60,
    SCALE_REGEX: /1\s*[:\/.,]\s*([0-9]{2,5})\b/,
    MIN_SCALE: 10,
    MAX_SCALE: 5000
  },
  
  COLORS: {
    ELEC: '#ff5252',
    GAZ: '#ffab00',
    EAU: '#00b0ff',
    TELECOM: '#00e676',
    FIBRE: '#e040fb'
  },
  
  DEFAULT_COLOR: '#ff5252',
  
  CUSTOM_PROPS: [
    'isMeasure', 'isScale', 'measureValue',
    'isAnnotation', 'annotationValue'
  ]
});

const MODES = Object.freeze({
  PAN: 'pan',
  SCALE: 'scale',
  MEASURE: 'measure',
  ANNOTATION: 'annotation',
  TEXT: 'text'
});

window.CONFIG = CONFIG;
window.MODES = MODES;
