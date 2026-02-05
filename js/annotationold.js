/* ============================================================
   ANNOTATION.JS - Fonction Plan Minute (Cotation terrain)
   ============================================================ */

/* ===== CREATE ANNOTATION LINE ===== */
function createAnnotationLine(p1, p2, labelText) {
  const zoom = canvas.getZoom();
  const strokeWidth = CONFIG.MEASURE_STROKE / zoom;
  const color = State.currentColor;
  
  // Ligne principale
  const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
    strokeWidth: strokeWidth * 1.5,
    stroke: color,
    selectable: false,
    evented: false
  });
  
  // Calcul angle
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  
  // Taille flèches
  const arrowSize = Math.max(CONFIG.ARROW_SIZE_BASE / zoom, 6);
  
  // Flèche début
  const arrowStart = new fabric.Triangle({
    width: arrowSize,
    height: arrowSize,
    fill: color,
    originX: 'center',
    originY: 'center',
    left: p1.x,
    top: p1.y,
    angle: angle + 180,
    selectable: false,
    evented: false
  });
  
  // Flèche fin
  const arrowEnd = new fabric.Triangle({
    width: arrowSize,
    height: arrowSize,
    fill: color,
    originX: 'center',
    originY: 'center',
    left: p2.x,
    top: p2.y,
    angle: angle,
    selectable: false,
    evented: false
  });
  
  // Label au milieu
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2 - (18 / zoom);
  
  const label = new fabric.Text(labelText, {
    fontSize: 14 / zoom,
    fill: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    left: midX,
    top: midY,
    originX: 'center',
    originY: 'bottom',
    fontFamily: 'Plus Jakarta Sans, Segoe UI, sans-serif',
    fontWeight: '700',
    padding: 4,
    selectable: false,
    evented: false
  });
  
  // Grouper
  const group = new fabric.Group([line, arrowStart, arrowEnd, label], {
    selectable: true
  });
  
  // Métadonnées
  group.isAnnotation = true;
  group.annotationValue = labelText;
  
  return group;
}

/* ===== FINALIZE ANNOTATION ===== */
async function finalizeAnnotation(p1, p2) {
  const distPx = getDistance(p1, p2);
  
  if (isTooSmall(distPx)) {
    Status.show('Distance trop courte', 'warning');
    return false;
  }
  
  // Demander la valeur de cotation via modal
  const value = await showModal('Plan Minute', 'Entrez la cotation (en mètres)', '');
  
  if (!value || value <= 0) {
    Status.show('Cotation annulée', 'warning');
    return false;
  }
  
  // Créer la ligne de cotation
  const labelText = `${value.toFixed(2)} m`;
  const group = createAnnotationLine(p1, p2, labelText);
  
  addObject(group);
  setActiveObject(group);
  
  saveCurrentPage();
  Status.show(`Cotation ajoutée : ${labelText}`, 'success');
  
  return true;
}

// Export
window.createAnnotationLine = createAnnotationLine;
window.finalizeAnnotation = finalizeAnnotation;
