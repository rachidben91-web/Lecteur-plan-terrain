/* ============================================================
   ANNOTATION.JS - Fonction Plan Minute (Cotation terrain + Texte)
   v3.4.2
   ✅ Texte "ancienne version" : IText, édition immédiate, retour auto PAN
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

/* ===== TEXTE LIBRE (MODE TEXT) - OLD SCHOOL ===== */
function _attachTextAutoPanHandlers(textObj) {
  // Quand on sort de l'édition, on sauvegarde et on repasse en PAN
  const onExit = () => {
    try {
      // Si l'utilisateur n'a rien tapé, on supprime l'objet
      const val = (textObj.text || '').trim();
      if (!val) {
        removeObject(textObj);
        Status.show('Texte annulé', 'warning');
      } else {
        saveCurrentPage();
        Status.show('Texte ajouté', 'success');
      }
    } finally {
      // Retour en déplacement (comme tu veux)
      setMode(MODES.PAN);
      // Nettoyage listeners (évite doublons)
      textObj.off('editing:exited', onExit);
    }
  };

  textObj.on('editing:exited', onExit);
}

async function placeText(point) {
  const zoom = canvas.getZoom();
  const color = State.currentColor;

  // ✅ IText = éditable inline + double-clic pour rééditer plus tard
  const text = new fabric.IText('', {
    left: point.x,
    top: point.y,
    fontSize: 18 / zoom,
    fill: color, // ancienne version : texte couleur réseau (plus lisible que blanc)
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    fontFamily: 'Plus Jakarta Sans, Segoe UI, sans-serif',
    fontWeight: '700',
    padding: 6,
    originX: 'center',
    originY: 'center',

    // Confort d'édition / sélection
    selectable: true,
    evented: true,
    hasControls: false,
    hasBorders: true,
    borderColor: color,
    cornerColor: color,
    cornerSize: 8,

    // Curseur texte visible
    cursorColor: '#ffffff',
    editingBorderColor: color
  });

  addObject(text);
  setActiveObject(text);

  // Assurer la couleur du cadre cohérente
  text.set({
    borderColor: color,
    cornerColor: color,
    editingBorderColor: color
  });

  // Brancher le comportement "retour PAN" à la sortie d'édition
  _attachTextAutoPanHandlers(text);

  // ✅ Passer directement en édition (le truc que tu aimais)
  text.enterEditing();
  if (text.hiddenTextarea) {
    // Focus clavier direct (PC/tablette avec clavier)
    text.hiddenTextarea.focus();
  }
  text.selectAll();

  // Petite sauvegarde initiale (au cas où)
  saveCurrentPage();

  // Important : on NE repasse pas tout de suite en PAN ici,
  // sinon on coupe certains comportements d'édition selon navigateur.
  // On repasse en PAN proprement sur "editing:exited".
  return true;
}

// Export
window.finalizeAnnotation = finalizeAnnotation;
window.placeText = placeText;
