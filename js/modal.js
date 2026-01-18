/* ============================================================
   MODAL.JS - Modal custom pour saisie (remplace prompt())
   ============================================================ */

let modalResolve = null;

/* ===== INIT MODAL ===== */
function initModal() {
  // Bouton Valider
  UI.modal.confirm.addEventListener('click', () => {
    const value = parseFloat(UI.modal.input.value.replace(',', '.'));
    closeModal();
    if (modalResolve) {
      modalResolve(value > 0 ? value : null);
      modalResolve = null;
    }
  });
  
  // Bouton Annuler
  UI.modal.cancel.addEventListener('click', () => {
    closeModal();
    if (modalResolve) {
      modalResolve(null);
      modalResolve = null;
    }
  });
  
  // Fermer avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen()) {
      closeModal();
      if (modalResolve) {
        modalResolve(null);
        modalResolve = null;
      }
    }
  });
  
  // Valider avec Enter
  UI.modal.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      UI.modal.confirm.click();
    }
  });
  
  // Clic sur overlay = fermer
  UI.modal.overlay.addEventListener('click', (e) => {
    if (e.target === UI.modal.overlay) {
      closeModal();
      if (modalResolve) {
        modalResolve(null);
        modalResolve = null;
      }
    }
  });
}

/* ===== SHOW MODAL ===== */
function showModal(title, label, defaultValue = '1.00') {
  return new Promise((resolve) => {
    modalResolve = resolve;
    
    // Configurer le modal
    UI.modal.title.textContent = title;
    UI.modal.input.value = defaultValue;
    UI.modal.input.placeholder = defaultValue;
    
    // Afficher
    UI.modal.overlay.classList.add('modal-overlay--visible');
    
    // Focus sur l'input après animation
    setTimeout(() => {
      UI.modal.input.focus();
      UI.modal.input.select();
    }, 100);
  });
}

/* ===== CLOSE MODAL ===== */
function closeModal() {
  UI.modal.overlay.classList.remove('modal-overlay--visible');
  UI.modal.input.value = '';
}

/* ===== CHECK OPEN ===== */
function isModalOpen() {
  return UI.modal.overlay.classList.contains('modal-overlay--visible');
}

// Export
window.initModal = initModal;
window.showModal = showModal;
window.closeModal = closeModal;
window.isModalOpen = isModalOpen;
