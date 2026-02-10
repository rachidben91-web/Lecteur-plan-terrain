/* ============================================================
   MEASURE.JS - Gestion des mesures et tracés
   Contient les primitives partagées (flèches, labels, lignes)
   ============================================================ */

/* ===== HELPERS ===== */
function isTooSmall(distPx) {
  const zoom = canvas.getZoom();
  return distPx < (CONFIG.MIN_DRAW_PX / zoom);
}

function getDistance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function getAngle(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

/* ===== SHARED PRIMITIVES ===== */

/**
 * Crée une flèche ouverte en V (Polyline).
 * Utilisé par mesure, étalonnage ET cotation.
 */
function createOpenArrow(size, color, strokeWidth) {
  const halfSize = size / 2;
  const armLength = size * 0.9;
  
  return new fabric.Polyline([
    { x: -armLength, y: -halfSize },
    { x: 0, y: 0 },
    { x: -armLength, y: halfSize }
  ], {
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    fill: null,
    originX: 'right',
    originY: 'center',
    selectable: false,
    evented: false
  });
}

/**
 * Crée un label texte positionné au milieu d'une ligne.
 */
function createLabel(text, x, y) {
  const zoom = canvas.getZoom();
  
  return new fabric.Text(text, {
    fontSize: 14 / zoom,
    fill: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    left: x,
    top: y,
    originX: 'center',
    originY: 'bottom',
    fontFamily: 'Plus Jakarta Sans, Segoe UI, sans-serif',
    fontWeight: '700',
    padding: 4,
    selectable: false,
    evented: false
  });
}

/* ===== PREVIEW LINE ===== */
function createPreviewLine(p1, p2, mode) {
  const zoom = canvas.getZoom();
  const strokeWidth = ((mode === MODES.SCALE) ? CONFIG.SCALE_STROKE : CONFIG.MEASURE_STROKE) / zoom;
  const color = (mode === MODES.MEASURE || mode === MODES.ANNOTATION) ? State.currentColor : '#64748b';
  const dash = (mode === MODES.SCALE) ? CONFIG.SCALE_DASH : null;
  
  return new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
    strokeWidth,
    stroke: color,
    strokeDashArray: dash,
    selectable: false,
    evented: false
  });
}

/* ===== UNIFIED LINE BUILDER ===== */
/**
 * Construit une ligne fléchée avec label.
 * Utilisé pour étalonnage, mesure ET cotation.
 * 
 * @param {Object} p1 - Point de départ {x, y}
 * @param {Object} p2 - Point d'arrivée {x, y}
 * @param {string} labelText - Texte affiché
 * @param {Object} options - Configuration
 * @param {string} options.color - Couleur du tracé
 * @param {Array|null} options.dash - Pointillés (null = trait plein)
 * @param {number} options.strokeFactor - Multiplicateur d'épaisseur (défaut 1)
 * @param {Object} options.meta - Métadonnées à attacher au groupe
 */
function buildLineMeasure(p1, p2, labelText, options = {}) {
  const zoom = canvas.getZoom();
  const baseStroke = (options.dash ? CONFIG.SCALE_STROKE : CONFIG.MEASURE_STROKE);
  const strokeFactor = options.strokeFactor || 1;
  const strokeWidth = (baseStroke / zoom) * strokeFactor;
  const color = options.color || State.currentColor;
  const dash = options.dash || null;
  
  // Ligne principale
  const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
    strokeWidth,
    stroke: color,
    strokeDashArray: dash,
    selectable: false,
    evented: false
  });
  
  // Calcul angle
  const angle = getAngle(p1, p2);
  
  // Taille flèches (adaptée au zoom)
  const arrowSize = Math.max(CONFIG.ARROW_SIZE_BASE / zoom, 6);
  
  // Flèche départ (pointe vers l'extérieur)
  const arrowStart = createOpenArrow(arrowSize, color, strokeWidth);
  arrowStart.set({
    left: p1.x,
    top: p1.y,
    angle: angle + 180
  });
  
  // Flèche arrivée (pointe vers l'extérieur)
  const arrowEnd = createOpenArrow(arrowSize, color, strokeWidth);
  arrowEnd.set({
    left: p2.x,
    top: p2.y,
    angle: angle
  });
  
  // Label au milieu
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2 - (18 / zoom);
  const label = createLabel(labelText, midX, midY);
  
  // Grouper tous les éléments
  const group = new fabric.Group([line, arrowStart, arrowEnd, label], {
    selectable: true
  });
  
  // Attacher les métadonnées
  if (options.meta) {
    Object.assign(group, options.meta);
  }
  
  return group;
}

/* ===== PREVIEW LINE MANAGEMENT ===== */
function updatePreviewLine() {
  if (!State.picking || !State.pickStartCanvas) return;
  
  const end = clientToCanvasPoint(State.cursorClientX, State.cursorClientY);
  
  if (!State.previewLine) {
    State.previewLine = createPreviewLine(State.pickStartCanvas, end, State.mode);
    addObject(State.previewLine);
  } else {
    State.previewLine.set({ x2: end.x, y2: end.y });
    canvas.requestRenderAll();
  }
}

function clearPreviewLine() {
  if (State.previewLine) {
    removeObject(State.previewLine);
    State.previewLine = null;
  }
}

/* ===== RESET PICKING ===== */
function resetPicking() {
  State.picking = false;
  State.pickStartCanvas = null;
  UI.btnConfirmEnd.disabled = true;
  clearPreviewLine();
  hideCursor();
}

/* ===== FINALIZE SCALE ===== */
async function finalizeScale(p1, p2) {
  const distPx = getDistance(p1, p2);
  
  if (isTooSmall(distPx)) {
    Status.show('Distance trop courte', 'warning');
    return false;
  }
  
  // Demander la distance réelle via modal
  const meters = await showModal('Étalonnage', 'Distance réelle en mètres ?', '1.00');
  
  if (!meters || meters <= 0) {
    Status.show('Étalonnage annulé', 'warning');
    return false;
  }
  
  // Calculer pixels/mètre
  State.pixelsPerMeter = distPx / meters;
  State.detectedScale = null;
  
  updateScaleBadge(`~${Math.round(1 / (meters / distPx * 0.0254 / 72 / CONFIG.PDF_RENDER_SCALE))}`);
  updateButtonStates();
  saveCurrentPage();
  
  Status.show(`Échelle définie : 1m = ${State.pixelsPerMeter.toFixed(0)} px`, 'success');
  
  // Passer en mode mesure
  setMode(MODES.MEASURE);
  
  return true;
}

/* ===== FINALIZE MEASURE ===== */
function finalizeMeasure(p1, p2) {
  const distPx = getDistance(p1, p2);
  
  if (isTooSmall(distPx)) {
    Status.show('Distance trop courte', 'warning');
    return false;
  }
  
  if (!State.hasScale()) {
    Status.show('Pas d\'échelle définie', 'error');
    setMode(MODES.SCALE);
    return false;
  }
  
  // Calculer distance en mètres
  const meters = distPx / State.pixelsPerMeter;
  const labelText = `${meters.toFixed(2)} m`;
  
  // Créer la mesure via le builder unifié
  const group = buildLineMeasure(p1, p2, labelText, {
    color: State.currentColor,
    dash: null,
    meta: {
      isMeasure: true,
      isScale: false,
      measureValue: meters.toFixed(2)
    }
  });
  
  addObject(group);
  setActiveObject(group);
  
  saveCurrentPage();
  Status.show(`Mesure : ${labelText}`, 'success');
  
  return true;
}

// Export
window.isTooSmall = isTooSmall;
window.getDistance = getDistance;
window.getAngle = getAngle;
window.createOpenArrow = createOpenArrow;
window.createLabel = createLabel;
window.createPreviewLine = createPreviewLine;
window.buildLineMeasure = buildLineMeasure;
window.updatePreviewLine = updatePreviewLine;
window.clearPreviewLine = clearPreviewLine;
window.resetPicking = resetPicking;
window.finalizeScale = finalizeScale;
window.finalizeMeasure = finalizeMeasure;
