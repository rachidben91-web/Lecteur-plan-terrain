/* ============================================================
   APP.JS - Point d'entrée principal
   Mesures Terrain v3.5.0 - GRDF Boucles de Seine Nord
   ============================================================ */

/* ===== SET MODE ===== */
function setMode(mode) {
  if (State.mode !== mode) {
    resetPicking();
  }

  State.mode = mode;
  setActiveButton(mode);

  // Palette couleurs visible uniquement pour les modes de tracé
  showColorPicker(mode === MODES.MEASURE || mode === MODES.ANNOTATION || mode === MODES.TEXT);

  // Pad tactile visible uniquement pour les modes nécessitant 2 points
  const showPick = (mode === MODES.SCALE || mode === MODES.MEASURE || mode === MODES.ANNOTATION);
  showConfirmPad(showPick);

  if (mode === MODES.PAN) {
    setSelectionMode(true);
    if (State.pdfDoc) Status.show('Mode Déplacement', 'normal');
  } else {
    setSelectionMode(false);

    const messages = {
      [MODES.SCALE]:      'Étalonnage : visez → Départ OK → visez → Arrivée OK',
      [MODES.MEASURE]:    'Mesure : visez → Départ OK → visez → Arrivée OK',
      [MODES.ANNOTATION]: 'Plan Minute : visez → Départ OK → visez → Arrivée OK → saisir cotation',
      [MODES.TEXT]:       'Mode Texte : cliquez pour placer du texte'
    };

    const types = {
      [MODES.SCALE]:      'warning',
      [MODES.MEASURE]:    'success',
      [MODES.ANNOTATION]: 'normal',
      [MODES.TEXT]:       'normal'
    };

    if (messages[mode]) Status.show(messages[mode], types[mode]);
  }

  updateButtonStates();
}

/* ===== MOUSE EVENTS (PC) ===== */
function initMouseEvents() {
  canvas.on('mouse:down', (o) => {
    if (!State.pdfDoc) return;
    if (State.isTouch) return;

    const evt = o.e;

    if (State.mode === MODES.PAN) {
      if (o.target) return;
      State.isDragging = true;
      State.lastClientX = evt.clientX;
      State.lastClientY = evt.clientY;
      canvas.setCursor('grabbing');
      return;
    }

    if (State.mode === MODES.TEXT) {
      const point = canvas.getPointer(evt);
      placeText(point);
      return;
    }

    State._drawStart = canvas.getPointer(evt);
    State._drawLine = createPreviewLine(State._drawStart, State._drawStart, State.mode);
    addObject(State._drawLine);
  });

  canvas.on('mouse:move', (o) => {
    if (!State.pdfDoc) return;
    if (State.isTouch) return;

    const evt = o.e;

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

    if (State._drawLine && State._drawStart) {
      const p = canvas.getPointer(evt);
      State._drawLine.set({ x2: p.x, y2: p.y });
      canvas.requestRenderAll();
    }
  });

  canvas.on('mouse:up', async (o) => {
    if (!State.pdfDoc) return;
    if (State.isTouch) return;

    if (State.isDragging) {
      State.isDragging = false;
      canvas.setCursor('grab');
      clampViewportToBackground();
      canvas.requestRenderAll();
      return;
    }

    if (!State._drawLine || !State._drawStart) return;

    const p2 = canvas.getPointer(o.e);
    const p1 = State._drawStart;
    const distPx = getDistance(p1, p2);

    removeObject(State._drawLine);
    State._drawLine = null;
    State._drawStart = null;

    if (isTooSmall(distPx)) return;

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

  UI.btn.annotation.addEventListener('click', () => setMode(MODES.ANNOTATION));

  UI.btn.text.addEventListener('click', () => setMode(MODES.TEXT));

  UI.btn.zoomIn.addEventListener('click', () => applyZoom(1.25));
  UI.btn.zoomOut.addEventListener('click', () => applyZoom(0.8));
  UI.btn.home.addEventListener('click', () => resetViewToCenter());

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

  UI.btn.save.addEventListener('click', exportToPNG);
  UI.btn.savePDF.addEventListener('click', exportToPDF);

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
    if (Number.isFinite(n)) goToPage(n);
  });

  UI.pager.jump.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') UI.pager.go.click();
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
      console.error('Erreur chargement fichier :', error);
    } finally {
      UI.fileInput.value = '';
    }
  });
}

/* ===== BOOT ===== */
function boot() {
  setVersion(CONFIG.VERSION);

  window.canvas = initCanvas();

  initColorPicker();
  initModal();
  initButtonEvents();
  initPagerEvents();
  initFileInput();
  initMouseEvents();
  initConfirmPad();

  if (isTouchDevice()) {
    enableTouchMode();
  }

  setAllButtonsDisabled(true);
  updateScaleBadge(null);
  updatePagerUI();
  setMode(MODES.PAN);

  Status.show('Bienvenue — Ouvrez un PDF', 'success');
}

document.addEventListener('DOMContentLoaded', boot);

window.setMode = setMode;
