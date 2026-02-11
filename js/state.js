/* ============================================================
   STATE.JS - Gestion de l'état V3.4
   ✅ NOUVEAU : Autosave localStorage
   ============================================================ */

const State = {
  mode: MODES.PAN,
  pixelsPerMeter: 0,
  detectedScale: null,
  initialZoom: 0.05,
  currentColor: CONFIG.DEFAULT_COLOR,
  
  pdfDoc: null,
  pageCount: 0,
  currentPage: 1,
  perPage: new Map(),
  
  isDragging: false,
  lastClientX: 0,
  lastClientY: 0,
  
  isTouch: false,
  cursorClientX: 0,
  cursorClientY: 0,
  
  picking: false,
  pickStartCanvas: null,
  previewLine: null,
  
  _drawStart: null,
  _drawLine: null,
  
  resetForNewPage() {
    this.pixelsPerMeter = 0;
    this.detectedScale = null;
  },
  
  savePageState(pageNumber, canvasJson) {
    const prev = this.perPage.get(pageNumber) || {};
    const data = {
      ...prev,
      json: canvasJson,
      pixelsPerMeter: this.pixelsPerMeter || 0,
      detectedScale: this.detectedScale || null
    };
    
    this.perPage.set(pageNumber, data);
    
    // ✅ NOUVEAU : Autosave localStorage
    this._saveToLocalStorage(pageNumber, data);
  },
  
  // ✅ NOUVEAU : Sauvegarde localStorage
  _saveToLocalStorage(pageNumber, data) {
    if (!this.pdfDoc) return;
    
    try {
      const key = `mt_page_${pageNumber}`;
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ Page ${pageNumber} sauvegardée`);
    } catch (e) {
      console.warn('⚠️ LocalStorage plein:', e);
    }
  },
  
  loadPageState(pageNumber) {
    let saved = this.perPage.get(pageNumber);
    
    // ✅ NOUVEAU : Charger depuis localStorage si pas en mémoire
    if (!saved && this.pdfDoc) {
      try {
        const key = `mt_page_${pageNumber}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          saved = JSON.parse(stored);
          console.log(`✅ Page ${pageNumber} chargée depuis localStorage`);
        }
      } catch (e) {
        console.warn('⚠️ Erreur lecture localStorage:', e);
      }
    }
    
    if (saved) {
      this.pixelsPerMeter = saved.pixelsPerMeter || 0;
      this.detectedScale = saved.detectedScale || null;
      this.perPage.set(pageNumber, saved);
      return saved;
    }
    return null;
  },
  
  // ✅ NOUVEAU : Nettoyer localStorage
  clearLocalStorage() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('mt_page_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ LocalStorage nettoyé');
    } catch (e) {
      console.warn('⚠️ Erreur nettoyage:', e);
    }
  },
  
  markOcrTried(pageNumber) {
    const saved = this.perPage.get(pageNumber) || {};
    saved.ocrTried = true;
    this.perPage.set(pageNumber, saved);
  },
  
  wasOcrTried(pageNumber) {
    const saved = this.perPage.get(pageNumber);
    return saved?.ocrTried === true;
  },
  
  hasScale() {
    return this.pixelsPerMeter > 0;
  }
};

window.State = State;
