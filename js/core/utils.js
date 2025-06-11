
// js/core/utils.js

function formatCurrency(amount) { return `$${amount.toLocaleString()}`; }

function showCustomAlert(message, callback, autoCloseDelay = 0) {
    const modal = document.getElementById('customModal');
    document.getElementById('customModalMessage').textContent = message;
    const buttonsDiv = document.getElementById('customModalButtons');
    buttonsDiv.innerHTML = '';
    if (typeof playSound === 'function') playSound('sfx_notification.mp3');

    if (autoCloseDelay > 0) {
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.display = 'none'; if (callback) callback(); }, autoCloseDelay);
    } else {
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.className = 'custom-modal-confirm-button game-button';
        okButton.onclick = () => { modal.style.display = 'none'; if (callback) callback(); playSound('sfx_modal_close.mp3'); };
        buttonsDiv.appendChild(okButton);
        modal.style.display = 'flex';
        if (typeof playSound === 'function') playSound('sfx_modal_open.mp3');
    }
}

function showCustomConfirm(message, onConfirm, onCancel) {
    const modal = document.getElementById('customModal');
    document.getElementById('customModalMessage').textContent = message;
    const buttonsDiv = document.getElementById('customModalButtons');
    buttonsDiv.innerHTML = '';
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.className = 'custom-modal-confirm-button game-button';
    confirmButton.onclick = () => { modal.style.display = 'none'; if (onConfirm) onConfirm(); playSound('sfx_button_click.mp3'); };
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'custom-modal-cancel-button game-button';
    cancelButton.onclick = () => { modal.style.display = 'none'; if (onCancel) onCancel(); playSound('sfx_modal_close.mp3'); };
    buttonsDiv.appendChild(cancelButton);
    buttonsDiv.appendChild(confirmButton);
    modal.style.display = 'flex';
    if (typeof playSound === 'function') playSound('sfx_modal_open.mp3');
}

function renderPaginationControls(containerId, totalPages, currentPage, callbackFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const createButton = (text, pageNum, isDisabled = false, isCurrent = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'game-button pagination-button';
        if (isCurrent) button.classList.add('current-page');
        button.disabled = isDisabled;
        button.onclick = () => { callbackFunction(pageNum); playSound('sfx_button_click_subtle.mp3'); };
        return button;
    };

    container.appendChild(createButton('<< First', 1, currentPage === 1));
    container.appendChild(createButton('< Prev', currentPage - 1, currentPage === 1));

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    container.appendChild(pageInfo);

    container.appendChild(createButton('Next >', currentPage + 1, currentPage === totalPages));
    container.appendChild(createButton('Last >>', totalPages, currentPage === totalPages));
}
