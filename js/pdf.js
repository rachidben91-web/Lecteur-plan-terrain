/* ============================================================
   PDF.JS - Chargement et rendu des pages PDF
   Mesures Terrain v3.5.1 - GRDF Boucles de Seine Nord
   ============================================================ */

// Fallback local si CDN inaccessible (réseau terrain coupé)
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
}

/* ===== LOAD PDF ===== */
async function loadPdfFile(file) {
  Status.show('Chargement du PDF...', 'normal');

  try {
    const buffer = await file.arrayBuffer();
    const typed = new Uint8Array(buffer);

    // Détruire l'ancien document avant d'en charger un nouveau (évite les fuites mémoire)
    if (State.pdfDoc) {
      try { await State.pdfDoc.destroy(); } catch (_) {}
      State.pdfDoc = null;
    }

    State.pdfDoc = await pdfjsLib.getDocument(typed).promise;

    State.pageCount = State.pdfDoc.numPages;
    State.currentPage = 1;
    State.perPage.clear();

    // Purge des données de l'ancien document
    State.clearLocalStorage();
    resetPicking();

    State.resetForNewPage();
    updateScaleBadge(null);
    updatePagerUI();
    updateButtonStates();

    Status.show(`PDF chargé (${State.pageCount} page${State.pageCount > 1 ? 's' : ''})`, 'success');

    await renderPage(1, true);

  } catch (error) {
    console.error('Erreur chargement PDF :', error);
    Status.show('Erreur de chargement du PDF', 'error');
    throw error;
  }
}

/* ===== RENDER PAGE ===== */
async function renderPage(pageNumber, restore = true) {
  if (!State.pdfDoc) return;

  if (State.currentPage && State.currentPage !== pageNumber) {
    saveCurrentPage();
  }

  State.currentPage = pageNumber;
  updatePagerUI();
  Status.show(`Rendu page ${pageNumber}...`, 'normal');

  try {
    const page = await State.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: CONFIG.PDF_RENDER_SCALE });

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = tempCanvas.toDataURL('image/png');

    await new Promise((resolve) => {
      fabric.Image.fromURL(dataUrl, (img) => {
        setCanvasBackground(img);

        if (restore) {
          restoreCurrentPage();
        }

        resolve();
      }, { crossOrigin: 'anonymous' });
    });

    if (!State.wasOcrTried(pageNumber)) {
      await performOCR(tempCanvas).catch(() => {});
      State.markOcrTried(pageNumber);
    }

    setAllButtonsDisabled(false);
    updateButtonStates();
    setMode(MODES.PAN);

    Status.show(`Page ${pageNumber} prête`, 'success');

  } catch (error) {
    console.error('Erreur rendu page :', error);
    Status.show('Erreur de rendu', 'error');
  }
}

/* ===== SAVE / RESTORE PAGE ===== */
function saveCurrentPage() {
  if (!State.pdfDoc || !State.currentPage) return;

  const json = saveCanvasState();
  State.savePageState(State.currentPage, json);
}

function restoreCurrentPage() {
  const saved = State.loadPageState(State.currentPage);

  updateScaleBadge(State.detectedScale);
  updateButtonStates();

  if (saved?.json) {
    restoreCanvasState(saved.json);
  }
}

/* ===== NAVIGATION ===== */
function goToPreviousPage() {
  if (State.currentPage > 1) {
    renderPage(State.currentPage - 1, true);
  }
}

function goToNextPage() {
  if (State.currentPage < State.pageCount) {
    renderPage(State.currentPage + 1, true);
  }
}

function goToPage(pageNumber) {
  const target = Math.max(1, Math.min(State.pageCount, pageNumber));
  if (target !== State.currentPage) {
    renderPage(target, true);
  }
}

// Export
window.loadPdfFile = loadPdfFile;
window.renderPage = renderPage;
window.saveCurrentPage = saveCurrentPage;
window.restoreCurrentPage = restoreCurrentPage;
window.goToPreviousPage = goToPreviousPage;
window.goToNextPage = goToNextPage;
window.goToPage = goToPage;
