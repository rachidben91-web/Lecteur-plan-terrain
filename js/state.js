/* ============================================================
   STATE.JS - Gestion de l'état applicatif
   Mesures Terrain v3.5.1 - GRDF Boucles de Seine Nord
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
    this._saveToLocalStorage(pageNumber, data);
  },

  _saveToLocalStorage(pageNumber, data) {
    if (!this.pdfDoc) return;

    const key = `mt_page_${pageNumber}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // Gestion QuotaExceededError : nettoyage auto + 2e tentative
      if (e instanceof DOMException && (
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        console.warn('LocalStorage plein — nettoyage automatique');
        this.clearLocalStorage();
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e2) {
          console.warn('LocalStorage toujours plein après nettoyage :', e2);
          if (typeof Status !== 'undefined') {
            Status.show('Espace insuffisant — sauvegarde impossible', 'error');
          }
        }
      } else {
        console.warn('LocalStorage erreur :', e);
      }
    }
  },

  loadPageState(pageNumber) {
    let saved = this.perPage.get(pageNumber);

    if (!saved && this.pdfDoc) {
      try {
        const key = `mt_page_${pageNumber}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          saved = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Erreur lecture localStorage :', e);
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

  clearLocalStorage() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('mt_page_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Erreur nettoyage localStorage :', e);
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
