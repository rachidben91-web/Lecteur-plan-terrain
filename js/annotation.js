/* ============================================================
   ANNOTATION.JS - Fonction Plan Minute (Cotation terrain)
   ============================================================ */

/* ===== CREATE OPEN ARROW ===== */
function createOpenArrowAnnotation(size, color, strokeWidth) {
  // Créer une flèche ouverte en forme de V avec Polyline
  // pour un positionnement EXACT de la pointe
  const halfSize = size / 2;
  const armLength = size * 0.9;
  
  // Les points du V : branche haute → pointe (0,0) → branche basse
  return new fabric.Polyline([
    {x: -armLength, y: -halfSize},  // Début branche haute
    {x: 0, y: 0},                    // POINTE du V (point de référence)
    {x: -armLength, y: halfSize}     // Fin branche basse
  ], {
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    fill: null,  // Pas de remplissage
    originX: 'right',  // Origine à droite = la pointe à x=0
    originY: 'center',
    selectable: false,
    evented: false
  });
}

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
  
  // Flèche début (pointe vers l'EXTÉRIEUR = vers la gauche)
  const arrowStart = createOpenArrowAnnotation(arrowSize, color, strokeWidth * 1.5);
  arrowStart.set({
    left: p1.x,
    top: p1.y,
    angle: angle + 180  // Pointe vers l'extérieur (gauche)
  });
  
  // Flèche fin (pointe vers l'EXTÉRIEUR = vers la droite)
  const arrowEnd = createOpenArrowAnnotation(arrowSize, color, strokeWidth * 1.5);
  arrowEnd.set({
    left: p2.x,
    top: p2.y,
    angle: angle  // Pointe vers l'extérieur (droite)
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

/* ===== TEXTE LIBRE (MODE TEXT) ===== */
async function placeText(point) {
  // Demander le texte via modal texte
  const textContent = await showTextModal('Ajouter du texte', 'Entrez votre texte');
  
  if (!textContent || textContent.trim() === '') {
    Status.show('Texte annulé', 'warning');
    return false;
  }
  
  const zoom = canvas.getZoom();
  const color = State.currentColor;
  
  // Créer le texte
  const text = new fabric.Text(textContent.trim(), {
    left: point.x,
    top: point.y,
    fontSize: 16 / zoom,
    fill: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    fontFamily: 'Plus Jakarta Sans, Segoe UI, sans-serif',
    fontWeight: '600',
    padding: 6,
    originX: 'center',
    originY: 'center',
    stroke: color,
    strokeWidth: 0.5 / zoom,
    selectable: true,  // Le texte peut être déplacé
    evented: true,
    hasControls: false,  // Pas de redimensionnement
    hasBorders: true,
    borderColor: color,
    cornerColor: color,
    cornerSize: 8
  });
  
  addObject(text);
  setActiveObject(text);
  
  saveCurrentPage();
  Status.show('Texte ajouté', 'success');
  
  return true;
}

window.placeText = placeText;

