/* ============================================================
   EXPORT.JS - Export PNG/PDF (FIX fond manquant)
   - Base (plan) rendu en 2D
   - Overlay (objets) rendu via Fabric offscreen (transparent)
   - Fusion en haute résolution
   ============================================================ */

function _getBgInfo() {
  const bg = canvas?.backgroundImage;
  const el = bg?._element || null;
  if (!bg || !el) return null;

  const w = el.naturalWidth || bg.width || 0;
  const h = el.naturalHeight || bg.height || 0;
  if (!w || !h) return null;

  return { el, w, h };
}

function _objectsJSONOnly() {
  const json = canvas.toDatalessJSON([
    'isMeasure',
    'isScale',
    'measureValue',
    'isAnnotation',
    'annotationValue'
  ]);

  // On force : pas de background dans l’overlay
  delete json.backgroundImage;
  delete json.background;
  return json;
}

async function _buildCompositeDataURL(multiplier = CONFIG.EXPORT_MULTIPLIER) {
  const info = _getBgInfo();
  if (!info) throw new Error('BACKGROUND_MISSING');

  const { el, w, h } = info;

  // --- 1) Base canvas 2D : plan en haute résolution
  const base = document.createElement('canvas');
  base.width = Math.round(w * multiplier);
  base.height = Math.round(h * multiplier);
  const bctx = base.getContext('2d');
  bctx.imageSmoothingEnabled = true;

  // Dessiner le fond (plan PDF)
  bctx.drawImage(el, 0, 0, base.width, base.height);

  // --- 2) Overlay Fabric offscreen : objets seulement (transparent)
  const off = new fabric.StaticCanvas(null, {
    width: w,
    height: h,
    backgroundColor: 'transparent',
    renderOnAddRemove: false
  });

  // Neutraliser vue (zoom/pan)
  off.setViewportTransform([1, 0, 0, 1, 0, 0]);

  const json = _objectsJSONOnly();

  await new Promise((resolve) => {
    off.loadFromJSON(json, () => {
      off.requestRenderAll();
      resolve();
    });
  });

  const overlayURL = off.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: multiplier,
    enableRetinaScaling: false
  });

  off.dispose();

  // --- 3) Fusion : draw overlay par-dessus la base
  const overlayImg = new Image();
  overlayImg.decoding = 'async';
  overlayImg.src = overlayURL;

  await new Promise((resolve, reject) => {
    overlayImg.onload = resolve;
    overlayImg.onerror = reject;
  });

  bctx.drawImage(overlayImg, 0, 0, base.width, base.height);

  return { dataURL: base.toDataURL('image/png', 1.0), baseW: w, baseH: h };
}

/* ===== EXPORT PNG ===== */
async function exportToPNG() {
  if (!State.pdfDoc || !State.currentPage) {
    Status.show('Aucune page chargée', 'error');
    return;
  }

  try {
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    Status.show('Export PNG...', 'normal');

    const { dataURL } = await _buildCompositeDataURL(CONFIG.EXPORT_MULTIPLIER);

    const a = document.createElement('a');
    a.download = `mesures-terrain-page-${State.currentPage}.png`;
    a.href = dataURL;
    a.click();

    Status.show('PNG OK (plan + cotes)', 'success');
  } catch (e) {
    console.error(e);
    Status.show('Erreur export PNG', 'error');
  }
}

/* ===== EXPORT PDF ===== */
async function exportToPDF() {
  if (!State.pdfDoc || !State.currentPage) {
    Status.show('Aucune page chargée', 'error');
    return;
  }

  try {
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    Status.show('Export PDF...', 'normal');

    const { dataURL, baseW, baseH } = await _buildCompositeDataURL(CONFIG.EXPORT_MULTIPLIER);

    const { jsPDF } = window.jspdf;

    const orientation = baseW > baseH ? 'landscape' : 'portrait';

    let pdfW = orientation === 'landscape' ? 297 : 210;
    let pdfH = orientation === 'landscape' ? 210 : 297;

    const imgRatio = baseW / baseH;
    const pdfRatio = pdfW / pdfH;

    if (imgRatio > pdfRatio) pdfH = pdfW / imgRatio;
    else pdfW = pdfH * imgRatio;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [pdfW, pdfH],
      compress: false // ✅ qualité conservée
    });

    pdf.addImage(dataURL, 'PNG', 0, 0, pdfW, pdfH, '', 'FAST');
    pdf.save(`mesures-terrain-page-${State.currentPage}.pdf`);

    Status.show('PDF OK (plan + cotes)', 'success');
  } catch (e) {
    console.error(e);
    Status.show('Erreur export PDF', 'error');
  }
}

// Export
window.exportToPNG = exportToPNG;
window.exportToPDF = exportToPDF;
