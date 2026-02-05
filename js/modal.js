/* ============================================================
   MODAL.JS - Modal custom pour saisie (remplace prompt())
   ============================================================ */

let modalResolve = null;
let modalType = 'number'; // 'number' ou 'text'

/* ===== INIT MODAL ===== */
function initModal() {
  // Bouton Valider
  UI.modal.confirm.addEventListener('click', () => {
    let value;
    
    if (modalType === 'text') {
      // Mode texte : retourner la chaîne brute
      value = UI.modal.input.value.trim();
    } else {
      // Mode nombre : parser le nombre
      value = parseFloat(UI.modal.input.value.replace(',', '.'));
      value = (value > 0) ? value : null;
    }
    
    closeModal();
    if (modalResolve) {
      modalResolve(value);
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

/* ===== SHOW MODAL (pour nombres) ===== */
function showModal(title, label, defaultValue = '1.00') {
  return new Promise((resolve) => {
    modalResolve = resolve;
    modalType = 'number';
    
    // Configurer le modal
    UI.modal.title.textContent = title;
    UI.modal.input.type = 'number';
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

/* ===== SHOW TEXT MODAL (pour texte libre) ===== */
function showTextModal(title, placeholder = '') {
  return new Promise((resolve) => {
    modalResolve = resolve;
    modalType = 'text';
    
    // Configurer le modal
    UI.modal.title.textContent = title;
    UI.modal.input.type = 'text';
    UI.modal.input.value = '';
    UI.modal.input.placeholder = placeholder;
    
    // Afficher
    UI.modal.overlay.classList.add('modal-overlay--visible');
    
    // Focus sur l'input après animation
    setTimeout(() => {
      UI.modal.input.focus();
    }, 100);
  });
}

/* ===== CLOSE MODAL ===== */
function closeModal() {
  UI.modal.overlay.classList.remove('modal-overlay--visible');
  UI.modal.input.value = '';
  UI.modal.input.type = 'number';
  modalType = 'number';
}

/* ===== CHECK OPEN ===== */
function isModalOpen() {
  return UI.modal.overlay.classList.contains('modal-overlay--visible');
}

// Export
window.initModal = initModal;
window.showModal = showModal;
window.showTextModal = showTextModal;
window.closeModal = closeModal;
window.isModalOpen = isModalOpen;
