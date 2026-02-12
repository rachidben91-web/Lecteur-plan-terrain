/* ============================================================
   UI.JS - Gestion des éléments d'interface
   v3.4.2
   ✅ NEW : la palette recolore aussi le texte sélectionné
   ============================================================ */

// Sélecteurs rapides
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Références UI
const UI = {
  // Canvas
  wrapper: $('#canvasWrapper'),

  // Inputs
  fileInput: $('#fileInput'),

  // Status
  statusBubble: $('#statusBubble'),

  // Scale badge
  scaleBadge: $('#scaleBadge'),
  scaleValue: $('#scaleValue'),
  scaleMini: $('#scaleMini'),

  // Color picker
  colorPicker: $('#colorPicker'),

  // Touch elements
  touchCursor: $('#touchCursor'),
  confirmPad: $('#confirmPad'),
  btnConfirmStart: $('#btnConfirmStart'),
  btnConfirmEnd: $('#btnConfirmEnd'),
  btnConfirmCancel: $('#btnConfirmCancel'),

  // Pager
  pager: {
    prev: $('#btnPrevPage'),
    next: $('#btnNextPage'),
    label: $('#pageLabel'),
    jump: $('#pageJump'),
    go: $('#btnGoPage')
  },

  // Buttons
  btn: {
    pan: $('#btnPan'),
    home: $('#btnHome'),
    scale: $('#btnScale'),
    measure: $('#btnMeasure'),
    annotation: $('#btnAnnotation'),
    text: $('#btnText'),
    zoomIn: $('#btnZoomIn'),
    zoomOut: $('#btnZoomOut'),
    undo: $('#btnUndo'),
    del: $('#btnDelete'),
    clear: $('#btnClear'),
    save: $('#btnSave'),
    savePDF: $('#btnSavePDF'),
    fullscreen: $('#btnFullscreen')
  },

  // Modal
  modal: {
    overlay: $('#modalOverlay'),
    input: $('#modalInput'),
    confirm: $('#modalConfirm'),
    cancel: $('#modalCancel'),
    title: $('#modalTitle'),
    label: $('#modalLabel')
  },

  // Version labels
  brandVersion: $('#brandVersion'),
  versionLabel: $('#versionLabel')
};

/* ===== STATUS BUBBLE ===== */
const Status = (() => {
  let timer = null;

  function show(message, type = 'normal') {
    UI.statusBubble.textContent = message;
    UI.statusBubble.className = 'status-bubble status-bubble--visible';

    if (type === 'success') UI.statusBubble.classList.add('status-bubble--success');
    if (type === 'warning') UI.statusBubble.classList.add('status-bubble--warning');
    if (type === 'error') UI.statusBubble.classList.add('status-bubble--error');

    clearTimeout(timer);
    timer = setTimeout(() => {
      UI.statusBubble.classList.remove('status-bubble--visible');
    }, CONFIG.STATUS_DURATION);
  }

  function hide() {
    clearTimeout(timer);
    UI.statusBubble.classList.remove('status-bubble--visible');
  }

  return { show, hide };
})();

/* ===== SCALE BADGE ===== */
function updateScaleBadge(scaleVal) {
  if (!scaleVal) {
    UI.scaleBadge.classList.remove('scale-badge--ok');
    UI.scaleBadge.classList.remove('scale-badge--compact');
    UI.scaleValue.textContent = 'Non détectée';
    UI.scaleMini.textContent = '—';
  } else {
    UI.scaleBadge.classList.add('scale-badge--ok');
    UI.scaleBadge.classList.add('scale-badge--compact');
    UI.scaleValue.textContent = `1:${scaleVal}`;
    UI.scaleMini.textContent = `1:${scaleVal}`;
  }
}

// Clic sur le scale badge pour modifier l'échelle
UI.scaleBadge.addEventListener('click', () => {
  if (State.hasScale()) {
    setMode(MODES.SCALE);
    Status.show('Redéfinir l\'échelle', 'warning');
  }
});

/* ===== BUTTON STATES ===== */
function setAllButtonsDisabled(disabled) {
  Object.values(UI.btn).forEach(btn => {
    if (btn) btn.disabled = disabled;
  });
  // Ces boutons restent toujours actifs
  UI.btn.clear.disabled = false;
  UI.btn.fullscreen.disabled = false;
}

function updateButtonStates() {
  const hasPdf = !!State.pdfDoc;
  const hasScale = State.hasScale();

  UI.btn.measure.disabled = !hasScale;
  UI.btn.annotation.disabled = !hasPdf;
  UI.btn.text.disabled = !hasPdf;
  UI.btn.save.disabled = !hasPdf;
  UI.btn.savePDF.disabled = !hasPdf;
  UI.btn.zoomIn.disabled = !hasPdf;
  UI.btn.zoomOut.disabled = !hasPdf;
  UI.btn.scale.disabled = !hasPdf;
  UI.btn.undo.disabled = !hasPdf;
  UI.btn.del.disabled = !hasPdf;
}

/* ===== MODE MANAGEMENT ===== */
function setActiveButton(mode) {
  Object.values(UI.btn).forEach(btn => {
    if (btn) btn.classList.remove('btn--active');
  });

  const btnMap = {
    [MODES.PAN]: UI.btn.pan,
    [MODES.SCALE]: UI.btn.scale,
    [MODES.MEASURE]: UI.btn.measure,
    [MODES.ANNOTATION]: UI.btn.annotation,
    [MODES.TEXT]: UI.btn.text
  };

  if (btnMap[mode]) {
    btnMap[mode].classList.add('btn--active');
    btnMap[mode].setAttribute('aria-pressed', 'true');
  }
}

function showColorPicker(show) {
  UI.colorPicker.classList.toggle('color-palette--visible', show);
}

function showConfirmPad(show) {
  UI.confirmPad.classList.toggle('confirm-pad--visible', show && State.isTouch);
}

/* ===== PAGER ===== */
function updatePagerUI() {
  const hasPdf = !!State.pdfDoc;

  UI.pager.prev.disabled = !hasPdf || State.currentPage <= 1;
  UI.pager.next.disabled = !hasPdf || State.currentPage >= State.pageCount;
  UI.pager.jump.disabled = !hasPdf;
  UI.pager.go.disabled = !hasPdf;

  UI.pager.label.textContent = hasPdf
    ? `Page ${State.currentPage} / ${State.pageCount}`
    : 'Page — / —';

  UI.pager.jump.min = 1;
  UI.pager.jump.max = State.pageCount || 1;
  UI.pager.jump.value = hasPdf ? State.currentPage : '';
}

/* ===== TOUCH CURSOR ===== */
function showCursorAt(clientX, clientY) {
  const x = clientX + CONFIG.CURSOR_OFFSET_X;
  const y = clientY + CONFIG.CURSOR_OFFSET_Y;

  State.cursorClientX = x;
  State.cursorClientY = y;

  UI.touchCursor.classList.add('touch-cursor--visible');
  UI.touchCursor.style.left = `${x}px`;
  UI.touchCursor.style.top = `${y}px`;
}

function hideCursor() {
  UI.touchCursor.classList.remove('touch-cursor--visible');
  UI.touchCursor.style.left = '-9999px';
  UI.touchCursor.style.top = '-9999px';
}

/* ===== VERSION ===== */
function setVersion(version) {
  UI.brandVersion.textContent = `v${version}`;
  UI.versionLabel.textContent = `v${version}`;
}

/* ===== COLOR PICKER ===== */
function _isTextObject(obj) {
  if (!obj) return false;
  // Fabric v5 : IText/Text/Textbox ont un champ "text"
  if (typeof obj.text === 'string') return true;
  return false;
}

function _applyColorToActiveText(color) {
  try {
    if (!window.canvas) return false;

    const obj = canvas.getActiveObject?.();
    if (!_isTextObject(obj)) return false;

    obj.set({
      fill: color,
      // Pour garder le style "cadre couleur réseau" de la v3.4.1
      borderColor: color,
      cornerColor: color,
      editingBorderColor: color
    });

    canvas.requestRenderAll?.();

    // Sauvegarder si la fonction existe (PDF.js)
    if (typeof saveCurrentPage === 'function') {
      saveCurrentPage();
    }

    return true;
  } catch (e) {
    console.warn('applyColorToActiveText failed', e);
    return false;
  }
}

function initColorPicker() {
  $$('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      $$('.color-dot').forEach(d => {
        d.classList.remove('color-dot--selected');
        d.setAttribute('aria-checked', 'false');
      });

      dot.classList.add('color-dot--selected');
      dot.setAttribute('aria-checked', 'true');

      const newColor = dot.getAttribute('data-color');
      State.currentColor = newColor;

      // ✅ NEW : si un texte est sélectionné, on le recolore immédiatement
      const changed = _applyColorToActiveText(newColor);
      if (changed) {
        Status.show('Couleur appliquée au texte', 'success');
      }
    });
  });
}

// Export
window.UI = UI;
window.Status = Status;
window.updateScaleBadge = updateScaleBadge;
window.setAllButtonsDisabled = setAllButtonsDisabled;
window.updateButtonStates = updateButtonStates;
window.setActiveButton = setActiveButton;
window.showColorPicker = showColorPicker;
window.showConfirmPad = showConfirmPad;
window.updatePagerUI = updatePagerUI;
window.showCursorAt = showCursorAt;
window.hideCursor = hideCursor;
window.setVersion = setVersion;
window.initColorPicker = initColorPicker;
