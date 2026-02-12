/* ============================================================
   APP.JS - Point d'entrée principal de l'application
   v3.4.2
   ============================================================ */

/* ===== SET MODE ===== */
function setMode(mode) {
  // Reset picking si on change de mode
  if (State.mode !== mode) {
    resetPicking();
  }

  State.mode = mode;
  setActiveButton(mode);

  // Afficher/masquer la palette de couleurs
  showColorPicker(mode === MODES.MEASURE || mode === MODES.ANNOTATION || mode === MODES.TEXT);

  // Afficher/masquer le pad de confirmation tactile (pas pour TEXT = simple clic)
  const showPick = (mode === MODES.SCALE || mode === MODES.MEASURE || mode === MODES.ANNOTATION);
  showConfirmPad(showPick);

  // Configurer le canvas
  if (mode === MODES.PAN) {
    setSelectionMode(true);
    if (State.pdfDoc) Status.show('Mode Déplacement', 'normal');
  } else {
    setSelectionMode(false);

    if (mode === MODES.SCALE) {
      Status.show('Étalonnage : visez → Départ OK → visez → Arrivée OK', 'warning');
    } else if (mode === MODES.MEASURE) {
      Status.show('Mesure : visez → Départ OK → visez → Arrivée OK', 'success');
    } else if (mode === MODES.ANNOTATION) {
      Status.show('Plan Minute : visez → Départ OK → visez → Arrivée OK → saisir cotation', 'normal');
    } else if (mode === MODES.TEXT) {
      Status.show('Mode Texte : cliquez pour placer du texte', 'normal');
    }
  }

  updateButtonStates();
}

/* ===== MOUSE EVENTS (PC) ===== */
function initMouseEvents() {
  canvas.on('mouse:down', (o) => {
    if (!State.pdfDoc) return;
    if (State.isTouch) return;

    const evt = o.e;

    // Mode PAN : drag
    if (State.mode === MODES.PAN) {
      if (o.target) return; // Clic sur objet
      State.isDragging = true;
      State.lastClientX = evt.clientX;
      State.lastClientY = evt.clientY;
      canvas.setCursor('grabbing');
      return;
    }

    // Mode TEXT : placement direct (pas de tracé)
    if (State.mode === MODES.TEXT) {
      const point = canvas.getPointer(evt);
      placeText(point);
      return;
    }

    // Mode SCALE/MEASURE/ANNOTATION : début tracé
    State._drawStart = canvas.getPointer(evt);
    State._drawLine = createPreviewLine(State._drawStart, State._drawStart, State.mode);
    addObject(State._drawLine);
  });

  canvas.on('mouse:move', (o) => {
    if (!State.pdfDoc) return;
    if (State.isTouch) return;

    const evt = o.e;

    // Drag pan
    if (State.isDragging) {
      const vpt = canvas.viewportTransform;
      vpt[4] += evt.clientX - State.lastClientX;
      vpt[5] += evt.clientY - State.lastClientY;
      State.lastClientX = evt.clientX;
      State.lastClientY = evt.clientY;
      clampViewportToBackground();
      canvas.requestRenderAll();
      return;
    }

    // Tracé en cours
    if (State._drawLine && State._drawStart) {
      const p = canvas.getPointer(evt);
      State._drawLine.set({ x2: p.x, y2: p.y });
      canvas.requestRenderAll();
    }
  });

  canvas.on('mouse:up', async (o) => {
    if (!State.pdfDoc) return;
    if (State.isTouch) return;

    // Fin drag pan
    if (State.isDragging) {
      State.isDragging = false;
      canvas.setCursor('grab');
      clampViewportToBackground();
      canvas.requestRenderAll();
      return;
    }

    // Fin tracé
    if (!State._drawLine || !State._drawStart) return;

    const p2 = canvas.getPointer(o.e);
    const p1 = State._drawStart;
    const distPx = getDistance(p1, p2);

    // Supprimer la preview
    removeObject(State._drawLine);
    State._drawLine = null;
    State._drawStart = null;

    if (isTooSmall(distPx)) {
      return;
    }

    // Finaliser selon le mode
    if (State.mode === MODES.SCALE) {
      await finalizeScale(p1, p2);
    } else if (State.mode === MODES.MEASURE) {
      finalizeMeasure(p1, p2);
    } else if (State.mode === MODES.ANNOTATION) {
      await finalizeAnnotation(p1, p2);
    }
  });
}

/* ===== BUTTON EVENTS ===== */
function initButtonEvents() {
  // Mode buttons
  UI.btn.pan.addEventListener('click', () => setMode(MODES.PAN));

  UI.btn.scale.addEventListener('click', () => setMode(MODES.SCALE));

  UI.btn.measure.addEventListener('click', () => {
    if (!State.hasScale()) {
      Status.show('Définissez d\'abord une échelle', 'warning');
      setMode(MODES.SCALE);
      return;
    }
    setMode(MODES.MEASURE);
  });

  UI.btn.annotation.addEventListener('click', () => {
    setMode(MODES.ANNOTATION);
  });

  UI.btn.text.addEventListener('click', () => {
    setMode(MODES.TEXT);
  });

  // Zoom
  UI.btn.zoomIn.addEventListener('click', () => applyZoom(1.25));
  UI.btn.zoomOut.addEventListener('click', () => applyZoom(0.8));
  UI.btn.home.addEventListener('click', () => resetViewToCenter());

  // Actions
  UI.btn.undo.addEventListener('click', () => {
    if (removeLastObject()) {
      Status.show('Annulé', 'normal');
      saveCurrentPage();
    }
  });

  UI.btn.del.addEventListener('click', () => {
    if (removeActiveObjects()) {
      Status.show('Supprimé', 'normal');
      saveCurrentPage();
    }
  });

  UI.btn.clear.addEventListener('click', () => {
    if (!confirm('Tout effacer sur cette page ?')) return;
    clearAllObjects();
    Status.show('Page nettoyée', 'success');
    saveCurrentPage();
  });

  UI.btn.save.addEventListener('click', () => {
    exportToPNG();
  });

  UI.btn.savePDF.addEventListener('click', () => {
    exportToPDF();
  });

  // Fullscreen
  UI.btn.fullscreen.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (e) {
      Status.show('Plein écran indisponible', 'warning');
    }
  });
}

/* ===== PAGER EVENTS ===== */
function initPagerEvents() {
  UI.pager.prev.addEventListener('click', goToPreviousPage);
  UI.pager.next.addEventListener('click', goToNextPage);

  UI.pager.go.addEventListener('click', () => {
    const n = parseInt(UI.pager.jump.value, 10);
    if (Number.isFinite(n)) {
      goToPage(n);
    }
  });

  UI.pager.jump.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      UI.pager.go.click();
    }
  });
}

/* ===== FILE INPUT ===== */
function initFileInput() {
  UI.fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await loadPdfFile(file);
    } catch (error) {
      console.error(error);
    } finally {
      UI.fileInput.value = '';
    }
  });
}

/* ===== BOOT ===== */
function boot() {
  console.log(`🚀 Mesures Terrain v${CONFIG.VERSION}`);

  // Version
  setVersion(CONFIG.VERSION);

  // Canvas
  window.canvas = initCanvas();

  // UI
  initColorPicker();
  initModal();
  initButtonEvents();
  initPagerEvents();
  initFileInput();
  initMouseEvents();
  initConfirmPad();

  // Touch detection
  if (isTouchDevice()) {
    enableTouchMode();
  }

  // État initial
  setAllButtonsDisabled(true);
  updateScaleBadge(null);
  updatePagerUI();
  setMode(MODES.PAN);

  Status.show('Bienvenue — Ouvrez un PDF', 'success');
}

// Lancer au chargement
document.addEventListener('DOMContentLoaded', boot);

// Export
window.setMode = setMode;
