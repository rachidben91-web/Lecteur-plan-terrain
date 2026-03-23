/* ============================================================
   OCR.JS - Détection automatique de l'échelle via OCR (Tesseract)
   Mesures Terrain v3.5.0 - GRDF Boucles de Seine Nord
   ============================================================ */

/* ===== PREPROCESSING ===== */
function preprocessForOCR(srcCanvas) {
  const c = document.createElement('canvas');
  c.width = srcCanvas.width;
  c.height = srcCanvas.height;

  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(srcCanvas, 0, 0);

  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];

    // Conversion en niveaux de gris
    let v = (0.2126 * r + 0.7152 * g + 0.0722 * b);

    // Boost contraste + seuillage
    v = (v - 128) * 1.25 + 128;
    v = v > 160 ? 255 : (v > 120 ? 220 : 0);

    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

/* ===== PARSE SCALE ===== */
function parseScaleString(text) {
  const clean = String(text || '')
    .replace(/O/g, '0')   // Confusion OCR fréquente : O → 0
    .replace(/o/g, '0')
    .replace(/\s+/g, ' ');

  const match = clean.match(CONFIG.OCR.SCALE_REGEX);
  if (!match || !match[1]) return null;

  const val = parseInt(match[1], 10);
  if (!Number.isFinite(val)) return null;
  if (val < CONFIG.OCR.MIN_SCALE || val > CONFIG.OCR.MAX_SCALE) return null;

  return val;
}

/* ===== PERFORM OCR ===== */
async function performOCR(fullCanvas) {
  Status.show('Détection échelle (OCR)...', 'normal');

  try {
    // Crop sur la zone cartouche (coin supérieur gauche)
    const w = Math.floor(fullCanvas.width * CONFIG.OCR.CROP_LEFT_W);
    const h = Math.floor(fullCanvas.height * CONFIG.OCR.CROP_TOP_H);

    const crop = document.createElement('canvas');
    crop.width = w;
    crop.height = h;

    const ctx = crop.getContext('2d');
    ctx.drawImage(fullCanvas, 0, 0, w, h, 0, 0, w, h);

    const prep = preprocessForOCR(crop);

    const result = await Tesseract.recognize(prep, CONFIG.OCR.LANG);
    const scaleVal = parseScaleString(result?.data?.text);

    if (scaleVal) {
      State.detectedScale = scaleVal;
      State.pixelsPerMeter = (72 * CONFIG.PDF_RENDER_SCALE * 39.3701) / scaleVal;

      updateScaleBadge(scaleVal);
      updateButtonStates();
      saveCurrentPage();

      Status.show(`Échelle détectée : 1:${scaleVal}`, 'success');

      setMode(MODES.MEASURE);

      return true;
    } else {
      updateScaleBadge(null);
      Status.show('Échelle non trouvée (OCR)', 'warning');
      saveCurrentPage();
      return false;
    }

  } catch (error) {
    console.error('Erreur OCR :', error);
    Status.show('Erreur OCR', 'error');
    return false;
  }
}

// Export
window.performOCR = performOCR;
window.parseScaleString = parseScaleString;
