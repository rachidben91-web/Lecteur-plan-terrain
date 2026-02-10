/* ============================================================
   ANNOTATION.JS - Fonction Plan Minute (Cotation terrain + Texte)
   Utilise buildLineMeasure() de measure.js (plus de duplication)
   ============================================================ */

/* ===== FINALIZE ANNOTATION (COTATION) ===== */
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
  
  // Créer la ligne de cotation via le builder unifié
  const labelText = `${value.toFixed(2)} m`;
  const group = buildLineMeasure(p1, p2, labelText, {
    color: State.currentColor,
    dash: null,
    strokeFactor: 1.5,
    meta: {
      isAnnotation: true,
      annotationValue: labelText
    }
  });
  
  addObject(group);
  setActiveObject(group);
  
  saveCurrentPage();
  Status.show(`Cotation ajoutée : ${labelText}`, 'success');
  
  return true;
}

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
    selectable: true,
    evented: true,
    hasControls: false,
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

// Export
window.finalizeAnnotation = finalizeAnnotation;
window.placeText = placeText;
