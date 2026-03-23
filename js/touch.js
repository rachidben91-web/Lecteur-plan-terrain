/* ============================================================
   TOUCH.JS - Gestion des interactions tactiles (tablette)
   Mesures Terrain v3.5.0 - GRDF Boucles de Seine Nord
   ============================================================ */

/* ===== DETECTION TOUCH ===== */
function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

/* ===== ENABLE TOUCH MODE ===== */
function enableTouchMode() {
  State.isTouch = true;

  UI.wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
  UI.wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
  UI.wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });

  initPinchZoom();
}

/* ===== TOUCH HANDLERS ===== */
function handleTouchStart(e) {
  if (!State.pdfDoc) return;
  if (e.touches.length >= 2) return;

  const t = e.touches[0];

  if (State.mode === MODES.TEXT) {
    showCursorAt(t.clientX, t.clientY);
    const point = clientToCanvasPoint(
      t.clientX + CONFIG.CURSOR_OFFSET_X,
      t.clientY + CONFIG.CURSOR_OFFSET_Y
    );
    placeText(point);
    e.preventDefault();
    return;
  }

  showCursorAt(t.clientX, t.clientY);

  if (State.mode === MODES.SCALE || State.mode === MODES.MEASURE || State.mode === MODES.ANNOTATION) {
    showConfirmPad(true);
    updatePreviewLine();
  }

  e.preventDefault();
}

function handleTouchMove(e) {
  if (!State.pdfDoc) return;
  if (e.touches.length >= 2) return;

  if (State.mode === MODES.TEXT) {
    e.preventDefault();
    return;
  }

  const t = e.touches[0];
  showCursorAt(t.clientX, t.clientY);
  updatePreviewLine();

  e.preventDefault();
}

function handleTouchEnd(e) {
  // Le curseur reste visible après relâchement
  // L'utilisateur peut retoucher pour repositionner
}

/* ===== PINCH ZOOM ===== */
function initPinchZoom() {
  let isPinching = false;
  let startDist = 0;
  let startZoom = 1;
  let lastMid = null;

  function dist(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  function midpoint(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  function onTouchStart(e) {
    if (!State.pdfDoc) return;

    if (e.touches.length === 2) {
      isPinching = true;
      startDist = dist(e.touches[0], e.touches[1]);
      startZoom = canvas.getZoom();
      lastMid = midpoint(e.touches[0], e.touches[1]);
      e.preventDefault();
    }
  }

  function onTouchMove(e) {
    if (!State.pdfDoc || !isPinching) return;
    if (e.touches.length !== 2) return;

    const d = dist(e.touches[0], e.touches[1]);
    const ratio = d / (startDist || 1);
    const newZoom = clampZoom(startZoom * ratio);

    const mid = midpoint(e.touches[0], e.touches[1]);
    const rect = UI.wrapper.getBoundingClientRect();
    const canvasMid = { x: mid.x - rect.left, y: mid.y - rect.top };

    canvas.zoomToPoint(canvasMid, newZoom);

    if (lastMid) {
      const dx = mid.x - lastMid.x;
      const dy = mid.y - lastMid.y;
      const vpt = canvas.viewportTransform;
      vpt[4] += dx;
      vpt[5] += dy;
    }

    clampViewportToBackground();
    lastMid = mid;
    canvas.requestRenderAll();
    e.preventDefault();
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) {
      isPinching = false;
      startDist = 0;
      lastMid = null;
    }
  }

  UI.wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
  UI.wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
  UI.wrapper.addEventListener('touchend', onTouchEnd, { passive: true });
  UI.wrapper.addEventListener('touchcancel', onTouchEnd, { passive: true });
}

/* ===== CONFIRM PAD HANDLERS ===== */
function initConfirmPad() {
  UI.btnConfirmStart.addEventListener('click', () => {
    if (!State.pdfDoc) return;

    const p = clientToCanvasPoint(State.cursorClientX, State.cursorClientY);
    State.pickStartCanvas = p;
    State.picking = true;
    UI.btnConfirmEnd.disabled = false;

    Status.show('Départ validé — visez l\'arrivée', 'success');
    updatePreviewLine();
  });

  UI.btnConfirmEnd.addEventListener('click', async () => {
    if (!State.pdfDoc) return;
    if (!State.picking || !State.pickStartCanvas) return;

    const p1 = State.pickStartCanvas;
    const p2 = clientToCanvasPoint(State.cursorClientX, State.cursorClientY);
    const distPx = getDistance(p1, p2);

    if (isTooSmall(distPx)) {
      Status.show('Distance trop courte', 'warning');
      return;
    }

    clearPreviewLine();

    if (State.mode === MODES.SCALE) {
      await finalizeScale(p1, p2);
      resetPicking();
    } else if (State.mode === MODES.MEASURE) {
      finalizeMeasure(p1, p2);
      resetPicking();
    } else if (State.mode === MODES.ANNOTATION) {
      await finalizeAnnotation(p1, p2);
      resetPicking();
    }
  });

  UI.btnConfirmCancel.addEventListener('click', () => {
    resetPicking();
    Status.show('Annulé', 'warning');
  });
}

// Export
window.isTouchDevice = isTouchDevice;
window.enableTouchMode = enableTouchMode;
window.initConfirmPad = initConfirmPad;
