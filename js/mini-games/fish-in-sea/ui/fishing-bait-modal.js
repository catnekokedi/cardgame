
// js/mini-games/fish-in-sea/ui/fishing-bait-modal.js

function toggleFishingBaitSelectModal(show) {
    const ui = fishingGameState.ui;
    if (ui.baitSelectModal) {
        if (show) {
            const contentDiv = ui.baitSelectContent;
            if (!contentDiv) return;
            contentDiv.innerHTML = '';
            FISHING_CONFIG.BAIT_TYPES.forEach(bait => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'fishing-upgrade-item';
                if (bait.id === fishingGameState.currentBaitId) {
                    itemDiv.classList.add('current');
                }

                itemDiv.innerHTML = `
                    <h4>${bait.name}</h4>
                    <p>${bait.description}</p>
                    <p>Rarity Boost: +${(bait.rarityBoost * 100).toFixed(1)}%, Ticket Boost: +${(bait.ticketBoost * 100).toFixed(1)}%</p>
                    <p>Uses: ${bait.uses === Infinity ? '∞' : bait.uses}, Cost: ${bait.id === "none" ? 'Free' : formatCurrency(bait.cost)}</p>
                `;
                if (bait.id !== fishingGameState.currentBaitId) {
                    const selectButton = document.createElement('button');
                    selectButton.className = 'game-button';
                    selectButton.textContent = bait.cost > 0 ? `Buy & Select (${formatCurrency(bait.cost)})` : 'Select';
                    selectButton.disabled = balance < bait.cost && bait.id !== "none";
                    selectButton.onclick = () => selectFishingBait(bait.id);
                    itemDiv.appendChild(selectButton);
                } else if (bait.id !== "none") { // Current bait and not "None"
                     const usesP = document.createElement('p');
                     usesP.textContent = `Uses Left: ${fishingGameState.currentBaitUsesLeft === Infinity ? '∞' : fishingGameState.currentBaitUsesLeft}`;
                     usesP.style.fontWeight = '500';
                     usesP.style.color = 'var(--material-primary-variant)';
                     itemDiv.appendChild(usesP);
                }
                contentDiv.appendChild(itemDiv);
            });
            ui.baitSelectModal.style.display = 'flex';
        } else {
            ui.baitSelectModal.style.display = 'none';
        }
    }
}


function showFishingBaitSelectModal() { 
   toggleFishingBaitSelectModal(true);
}

function selectFishingBait(baitId) { 
    const baitToSelect = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === baitId);
    if (!baitToSelect) return;

    // If selecting the same bait, do nothing (unless it's "None", which is always selectable)
    if (baitId === fishingGameState.currentBaitId && baitId !== "none") {
        toggleFishingBaitSelectModal(false); // Just close the modal
        return;
    }

    if (baitToSelect.id !== "none" && balance < baitToSelect.cost) {
        showCustomAlert("Not enough Toki for this bait.", null, 2000); return;
    }
    if (baitToSelect.id !== "none") { // Deduct cost only if buying new bait
        balance -= baitToSelect.cost;
    }
    
    fishingGameState.currentBaitId = baitToSelect.id;
    fishingGameState.currentBait = baitToSelect;
    fishingGameState.currentBaitUsesLeft = baitToSelect.uses;
    
    updateBalance();
    fishingUi.updateRodAndBaitDisplay(); 
    toggleFishingBaitSelectModal(true); 
    showCustomAlert(`${baitToSelect.name} selected!`, null, 1500);
    playSound('sfx_item_equip.mp3');
    if (typeof saveGame === 'function') saveGame();
}
