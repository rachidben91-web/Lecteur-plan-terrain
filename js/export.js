/* ============================================================
   EXPORT.JS - Gestion des exports (PNG & PDF)
   ============================================================ */

/* ===== HELPER: Créer un canvas aux dimensions du PDF ===== */
async function createFullPageCanvas() {
  // Récupérer la page PDF actuelle
  const page = await State.pdfDoc.getPage(State.currentPage);
  
  // Dimensions réelles du PDF (à haute résolution)
  const viewport = page.getViewport({ scale: CONFIG.PDF_RENDER_SCALE });
  
  // Créer un canvas temporaire
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = viewport.width;
  exportCanvas.height = viewport.height;
  const ctx = exportCanvas.getContext('2d');
  
  // Rendre le PDF sur le canvas
  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;
  
  // Créer un canvas Fabric temporaire
  const fabricCanvas = new fabric.Canvas(exportCanvas, {
    width: viewport.width,
    height: viewport.height,
    backgroundColor: null,
    renderOnAddRemove: false,
    enableRetinaScaling: false
  });
  
  // Copier tous les objets du canvas principal
  const objects = canvas.getObjects();
  
  // Calculer le ratio de mise à l'échelle
  const bgImage = canvas.backgroundImage;
  if (bgImage) {
    const scaleX = viewport.width / bgImage.width;
    const scaleY = viewport.height / bgImage.height;
    
    // Copier chaque objet avec la bonne échelle
    for (const obj of objects) {
      const clonedObj = await new Promise(resolve => {
        obj.clone(resolve);
      });
      
      // Ajuster position et échelle
      clonedObj.left = clonedObj.left * scaleX;
      clonedObj.top = clonedObj.top * scaleY;
      clonedObj.scaleX = (clonedObj.scaleX || 1) * scaleX;
      clonedObj.scaleY = (clonedObj.scaleY || 1) * scaleY;
      
      // Ajuster aussi les propriétés de trait
      if (clonedObj.strokeWidth) {
        clonedObj.strokeWidth = clonedObj.strokeWidth * Math.min(scaleX, scaleY);
      }
      
      fabricCanvas.add(clonedObj);
    }
    
    fabricCanvas.requestRenderAll();
  }
  
  return fabricCanvas;
}

/* ===== EXPORT PNG ===== */
async function exportToPNG() {
  if (!State.currentPage) {
    Status.show('Aucune page chargée', 'error');
    return;
  }
  
  Status.show('Export PNG en cours...', 'info');
  
  try {
    // Désélectionner tous les objets
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    
    // Créer un canvas aux dimensions réelles du PDF
    const exportCanvas = await createFullPageCanvas();
    
    // Export avec haute résolution
    const dataURL = exportCanvas.toDataURL({
      format: 'png',
      quality: 1
    });
    
    // Nettoyer
    exportCanvas.dispose();
    
    // Télécharger
    const link = document.createElement('a');
    link.download = `mesures-terrain-page-${State.currentPage}.png`;
    link.href = dataURL;
    link.click();
    
    Status.show('Export PNG réussi (format document)', 'success');
  } catch (err) {
    console.error('Erreur export PNG:', err);
    Status.show('Erreur lors de l\'export PNG', 'error');
  }
}

/* ===== EXPORT PDF ===== */
async function exportToPDF() {
  if (!State.currentPage) {
    Status.show('Aucune page chargée', 'error');
    return;
  }
  
  Status.show('Export PDF en cours...', 'info');
  
  try {
    // Désélectionner tous les objets
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    
    // Créer un canvas aux dimensions réelles du PDF
    const exportCanvas = await createFullPageCanvas();
    
    // Convertir en image
    const dataURL = exportCanvas.toDataURL({
      format: 'png',
      quality: 1
    });
    
    // Nettoyer
    exportCanvas.dispose();
    
    // Récupérer les dimensions en pixels
    const imgWidth = exportCanvas.width;
    const imgHeight = exportCanvas.height;
    
    // Initialiser jsPDF
    const { jsPDF } = window.jspdf;
    
    // Convertir les dimensions en mm (à 72 DPI)
    // 1 inch = 25.4 mm, 72 DPI = 72 pixels/inch
    const dpi = 72;
    const mmPerPixel = 25.4 / dpi;
    
    const pdfWidth = imgWidth * mmPerPixel;
    const pdfHeight = imgHeight * mmPerPixel;
    
    // Déterminer l'orientation
    const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
    
    // Créer le PDF aux dimensions exactes
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: false  // Haute qualité
    });
    
    // Ajouter l'image (couvre toute la page)
    pdf.addImage(dataURL, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
    
    // Télécharger
    pdf.save(`mesures-terrain-page-${State.currentPage}.pdf`);
    
    Status.show('Export PDF réussi (format document)', 'success');
  } catch (err) {
    console.error('Erreur export PDF:', err);
    Status.show('Erreur lors de l\'export PDF', 'error');
  }
}

// Export
window.exportToPNG = exportToPNG;
window.exportToPDF = exportToPDF;
