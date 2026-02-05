/* ============================================================
   MEASURE.JS - Gestion des mesures et tracés
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

/* ===== SHAPES ===== */
function createPreviewLine(p1, p2, mode) {
  const zoom = canvas.getZoom();
  const strokeWidth = ((mode === MODES.SCALE) ? CONFIG.SCALE_STROKE : CONFIG.MEASURE_STROKE) / zoom;
  const color = (mode === MODES.MEASURE) ? State.currentColor : '#64748b';
  const dash = (mode === MODES.SCALE) ? CONFIG.SCALE_DASH : null;
  
  return new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
    strokeWidth,
    stroke: color,
    strokeDashArray: dash,
    selectable: false,
    evented: false
  });
}

function createArrowTriangle(size, fill) {
  return new fabric.Triangle({
    width: size,
    height: size,
    fill,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false
  });
}

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

/* ===== BUILD MEASURE ===== */
function buildArrowedMeasure(p1, p2, labelText, mode) {
  const zoom = canvas.getZoom();
  const strokeWidth = ((mode === MODES.SCALE) ? CONFIG.SCALE_STROKE : CONFIG.MEASURE_STROKE) / zoom;
  const color = (mode === MODES.MEASURE) ? State.currentColor : '#64748b';
  const dash = (mode === MODES.SCALE) ? CONFIG.SCALE_DASH : null;
  
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
  const arrowStart = createArrowTriangle(arrowSize, color);
  arrowStart.set({
    left: p1.x,
    top: p1.y,
    angle: angle + 180
  });
  
  // Flèche arrivée (pointe vers l'extérieur)
  const arrowEnd = createArrowTriangle(arrowSize, color);
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
  
  // Métadonnées
  group.isMeasure = (mode === MODES.MEASURE);
  group.isScale = (mode === MODES.SCALE);
  group.measureValue = group.isMeasure ? labelText.replace(' m', '') : null;
  
  return group;
}

/* ===== PREVIEW LINE ===== */
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
  State.detectedScale = null; // Manuel, pas de scale détectée
  
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
  
  // Créer la mesure
  const group = buildArrowedMeasure(p1, p2, labelText, MODES.MEASURE);
  addObject(group);
  setActiveObject(group);
  
  saveCurrentPage();
  Status.show(`Mesure : ${labelText}`, 'success');
  
  return true;
}

// Export
window.isTooSmall = isTooSmall;
window.getDistance = getDistance;
window.createPreviewLine = createPreviewLine;
window.buildArrowedMeasure = buildArrowedMeasure;
window.updatePreviewLine = updatePreviewLine;
window.clearPreviewLine = clearPreviewLine;
window.resetPicking = resetPicking;
window.finalizeScale = finalizeScale;
window.finalizeMeasure = finalizeMeasure;
