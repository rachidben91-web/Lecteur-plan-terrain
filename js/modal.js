/* ============================================================
   MODAL.JS - Modal de saisie (remplace prompt() natif)
   Mesures Terrain v3.5.0 - GRDF Boucles de Seine Nord
   ============================================================ */

let modalResolve = null;
let modalType = 'number'; // 'number' ou 'text'

/* ===== INIT MODAL ===== */
function initModal() {
  UI.modal.confirm.addEventListener('click', () => {
    let value;

    if (modalType === 'text') {
      value = UI.modal.input.value.trim();
    } else {
      value = parseFloat(UI.modal.input.value.replace(',', '.'));
      value = (value > 0) ? value : null;
    }

    closeModal();
    if (modalResolve) {
      modalResolve(value);
      modalResolve = null;
    }
  });

  UI.modal.cancel.addEventListener('click', () => {
    closeModal();
    if (modalResolve) {
      modalResolve(null);
      modalResolve = null;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen()) {
      closeModal();
      if (modalResolve) {
        modalResolve(null);
        modalResolve = null;
      }
    }
  });

  UI.modal.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      UI.modal.confirm.click();
    }
  });

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

/* ===== SHOW MODAL (saisie numérique) ===== */
function showModal(title, label, defaultValue = '1.00') {
  return new Promise((resolve) => {
    modalResolve = resolve;
    modalType = 'number';

    UI.modal.title.textContent = title;
    UI.modal.label.textContent = label;
    UI.modal.input.type = 'number';
    UI.modal.input.step = '0.01';
    UI.modal.input.min = '0.01';
    UI.modal.input.inputMode = 'decimal';
    UI.modal.input.value = defaultValue;
    UI.modal.input.placeholder = defaultValue || '1.00';

    UI.modal.overlay.classList.add('modal-overlay--visible');

    setTimeout(() => {
      UI.modal.input.focus();
      UI.modal.input.select();
    }, 100);
  });
}

/* ===== SHOW TEXT MODAL (saisie texte libre) ===== */
function showTextModal(title, placeholder = '') {
  return new Promise((resolve) => {
    modalResolve = resolve;
    modalType = 'text';

    UI.modal.title.textContent = title;
    UI.modal.label.textContent = 'Entrez votre texte';
    UI.modal.input.type = 'text';
    UI.modal.input.removeAttribute('step');
    UI.modal.input.removeAttribute('min');
    UI.modal.input.inputMode = 'text';
    UI.modal.input.value = '';
    UI.modal.input.placeholder = placeholder;

    UI.modal.overlay.classList.add('modal-overlay--visible');

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
