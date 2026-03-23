/* ============================================================
   ANNOTATION.JS - Fonction Plan Minute (Cotation terrain + Texte)
   Mesures Terrain v3.5.0 - GRDF Boucles de Seine Nord
   ============================================================ */

/* ===== FINALIZE ANNOTATION (COTATION) ===== */
async function finalizeAnnotation(p1, p2) {
  const distPx = getDistance(p1, p2);

  if (isTooSmall(distPx)) {
    Status.show('Distance trop courte', 'warning');
    return false;
  }

  const value = await showModal('Plan Minute', 'Entrez la cotation (en mètres)', '');

  if (!value || value <= 0) {
    Status.show('Cotation annulée', 'warning');
    return false;
  }

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
function _attachTextAutoPanHandlers(textObj) {
  const onExit = () => {
    try {
      const val = (textObj.text || '').trim();
      if (!val) {
        removeObject(textObj);
        Status.show('Texte annulé', 'warning');
      } else {
        saveCurrentPage();
        Status.show('Texte ajouté', 'success');
      }
    } finally {
      setMode(MODES.PAN);
      textObj.off('editing:exited', onExit);
    }
  };

  textObj.on('editing:exited', onExit);
}

async function placeText(point) {
  const zoom = canvas.getZoom();
  const color = State.currentColor;

  const text = new fabric.IText('', {
    left: point.x,
    top: point.y,
    fontSize: 18 / zoom,
    fill: color,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    fontFamily: 'Plus Jakarta Sans, Segoe UI, sans-serif',
    fontWeight: '700',
    padding: 6,
    originX: 'center',
    originY: 'center',
    selectable: true,
    evented: true,
    hasControls: false,
    hasBorders: true,
    borderColor: color,
    cornerColor: color,
    cornerSize: 8,
    cursorColor: '#ffffff',
    editingBorderColor: color
  });

  addObject(text);
  setActiveObject(text);

  text.set({
    borderColor: color,
    cornerColor: color,
    editingBorderColor: color
  });

  _attachTextAutoPanHandlers(text);

  text.enterEditing();
  if (text.hiddenTextarea) {
    text.hiddenTextarea.focus();
  }
  text.selectAll();

  saveCurrentPage();

  return true;
}

// Export
window.finalizeAnnotation = finalizeAnnotation;
window.placeText = placeText;
