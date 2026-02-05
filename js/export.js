/* ============================================================
   EXPORT.JS - Gestion des exports (PNG & PDF)
   ============================================================ */

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
    
    // Export avec haute résolution
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: CONFIG.EXPORT_MULTIPLIER
    });
    
    // Télécharger
    const link = document.createElement('a');
    link.download = `mesures-terrain-page-${State.currentPage}.png`;
    link.href = dataURL;
    link.click();
    
    Status.show('Export PNG réussi', 'success');
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
    
    // Récupérer les dimensions du canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Convertir le canvas en image haute résolution
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: CONFIG.EXPORT_MULTIPLIER  // Qualité x3
    });
    
    // Initialiser jsPDF
    const { jsPDF } = window.jspdf;
    
    // Déterminer l'orientation (portrait ou paysage)
    const orientation = canvasWidth > canvasHeight ? 'landscape' : 'portrait';
    
    // Créer le PDF avec les dimensions du canvas (en mm)
    // A4 = 210x297mm, on calcule pour préserver le ratio
    let pdfWidth, pdfHeight;
    
    if (orientation === 'landscape') {
      pdfWidth = 297;
      pdfHeight = 210;
    } else {
      pdfWidth = 210;
      pdfHeight = 297;
    }
    
    // Ajuster selon le ratio du canvas
    const canvasRatio = canvasWidth / canvasHeight;
    const pdfRatio = pdfWidth / pdfHeight;
    
    if (canvasRatio > pdfRatio) {
      // Canvas plus large : ajuster la hauteur
      pdfHeight = pdfWidth / canvasRatio;
    } else {
      // Canvas plus haut : ajuster la largeur
      pdfWidth = pdfHeight * canvasRatio;
    }
    
    // Créer le PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: false  // Pas de compression pour garder la qualité
    });
    
    // Ajouter l'image au PDF (couvre toute la page)
    pdf.addImage(dataURL, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
    
    // Télécharger le PDF
    pdf.save(`mesures-terrain-page-${State.currentPage}.pdf`);
    
    Status.show('Export PDF réussi (haute qualité)', 'success');
  } catch (err) {
    console.error('Erreur export PDF:', err);
    Status.show('Erreur lors de l\'export PDF', 'error');
  }
}

// Export
window.exportToPNG = exportToPNG;
window.exportToPDF = exportToPDF;
