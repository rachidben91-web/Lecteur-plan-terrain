/* ============================================================
   STATE.JS - Gestion de l'état global de l'application
   ============================================================ */

const State = {
  // Mode actuel
  mode: MODES.PAN,
  
  // Échelle de la page
  pixelsPerMeter: 0,
  detectedScale: null,
  
  // Zoom
  initialZoom: 0.05,
  
  // Couleur de mesure active
  currentColor: CONFIG.DEFAULT_COLOR,
  
  // PDF
  pdfDoc: null,
  pageCount: 0,
  currentPage: 1,
  perPage: new Map(),       // Stockage par page {json, pixelsPerMeter, detectedScale, ocrTried}
  
  // Pan (déplacement)
  isDragging: false,
  lastClientX: 0,
  lastClientY: 0,
  
  // Touch
  isTouch: false,
  cursorClientX: 0,
  cursorClientY: 0,
  
  // Picking (sélection points)
  picking: false,
  pickStartCanvas: null,
  
  // Preview line
  previewLine: null,
  
  // Desktop draw
  _drawStart: null,
  _drawLine: null,
  
  // Reset state for new page
  resetForNewPage() {
    this.pixelsPerMeter = 0;
    this.detectedScale = null;
  },
  
  // Save current page state
  savePageState(pageNumber, canvasJson) {
    const prev = this.perPage.get(pageNumber) || {};
    this.perPage.set(pageNumber, {
      ...prev,
      json: canvasJson,
      pixelsPerMeter: this.pixelsPerMeter || 0,
      detectedScale: this.detectedScale || null
    });
  },
  
  // Load page state
  loadPageState(pageNumber) {
    const saved = this.perPage.get(pageNumber);
    if (saved) {
      this.pixelsPerMeter = saved.pixelsPerMeter || 0;
      this.detectedScale = saved.detectedScale || null;
      return saved;
    }
    return null;
  },
  
  // Mark OCR as tried for page
  markOcrTried(pageNumber) {
    const saved = this.perPage.get(pageNumber) || {};
    saved.ocrTried = true;
    this.perPage.set(pageNumber, saved);
  },
  
  // Check if OCR was tried
  wasOcrTried(pageNumber) {
    const saved = this.perPage.get(pageNumber);
    return saved?.ocrTried === true;
  },
  
  // Has valid scale
  hasScale() {
    return this.pixelsPerMeter > 0;
  }
};

// Export
window.State = State;
