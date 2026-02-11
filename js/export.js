/* ============================================================
   EXPORT.JS - Export PNG/PDF V3.4
   ✅ NOUVEAU : Vérification complète du background
   ============================================================ */

function _getBgInfo() {
  const bg = canvas?.backgroundImage;
  const el = bg?._element || null;
  if (!bg || !el) return null;

  // ✅ NOUVEAU : Vérifier que l'image est complètement chargée
  if (!el.complete || el.naturalWidth === 0) {
    console.warn('⚠️ Background pas complètement chargé');
    return null;
  }

  const w = el.naturalWidth || bg.width || 0;
  const h = el.naturalHeight || bg.height || 0;
  
  if (!w || !h) {
    console.warn('⚠️ Dimensions background invalides');
    return null;
  }

  console.log(`✅ Background OK: ${w}x${h}px`);
  return { el, w, h };
}

function _objectsJSONOnly() {
  const json = canvas.toDatalessJSON(CONFIG.CUSTOM_PROPS);
  delete json.backgroundImage;
  delete json.background;
  return json;
}

async function _buildCompositeDataURL(multiplier = CONFIG.EXPORT_MULTIPLIER) {
  const info = _getBgInfo();
  
  // ✅ NOUVEAU : Message d'erreur clair
  if (!info) {
    throw new Error('BACKGROUND_MISSING - Impossible d\'exporter sans fond');
  }

  const { el, w, h } = info;

  const base = document.createElement('canvas');
  base.width = Math.round(w * multiplier);
  base.height = Math.round(h * multiplier);
  const bctx = base.getContext('2d');
  bctx.imageSmoothingEnabled = true;

  bctx.drawImage(el, 0, 0, base.width, base.height);

  const off = new fabric.StaticCanvas(null, {
    width: w,
    height: h,
    backgroundColor: 'transparent',
    renderOnAddRemove: false
  });

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
    console.error('❌ Erreur export PNG:', e);
    Status.show('Erreur export PNG - ' + e.message, 'error');
  }
}

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
      compress: false
    });

    pdf.addImage(dataURL, 'PNG', 0, 0, pdfW, pdfH, '', 'FAST');
    pdf.save(`mesures-terrain-page-${State.currentPage}.pdf`);

    Status.show('PDF OK (plan + cotes)', 'success');
  } catch (e) {
    console.error('❌ Erreur export PDF:', e);
    Status.show('Erreur export PDF - ' + e.message, 'error');
  }
}

window.exportToPNG = exportToPNG;
window.exportToPDF = exportToPDF;
