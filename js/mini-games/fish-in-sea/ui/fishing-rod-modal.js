
// js/mini-games/fish-in-sea/ui/fishing-rod-modal.js

function toggleFishingRodUpgradeModal(show) {
    const ui = fishingGameState.ui;
    if (ui.rodUpgradeModal) {
        if (show) {
            const contentDiv = ui.rodUpgradeContent;
            if (!contentDiv) return;
            contentDiv.innerHTML = '';
            FISHING_CONFIG.ROD_TYPES.forEach(rod => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'fishing-upgrade-item';
                
                let statusText = "";
                if (rod.level === fishingGameState.currentRodLevel) {
                    itemDiv.classList.add('current');
                    statusText = " (Current)";
                } else if (rod.level < fishingGameState.currentRodLevel) {
                    itemDiv.classList.add('owned');
                    statusText = " (Owned)";
                }

                itemDiv.innerHTML = `
                    <h4>${rod.name} (Level ${rod.level})${statusText}</h4>
                    <p>Catch Speed: x${rod.catchSpeedFactor.toFixed(1)}, Success: ${(rod.successRate * 100).toFixed(0)}%</p>
                    <p>Rarity Bonus: +${(rod.rarityBonus * 100).toFixed(1)}%, Ticket Bonus: +${(rod.ticketCatchBonus * 100).toFixed(1)}%</p>
                    ${rod.autoCatch ? '<p style="color:var(--material-primary);">Features Auto-Catch!</p>' : ''}
                `;
                if (rod.level > fishingGameState.currentRodLevel) {
                    const purchaseButton = document.createElement('button');
                    purchaseButton.className = 'game-button';
                    purchaseButton.textContent = `Upgrade (${formatCurrency(rod.cost)})`;
                    purchaseButton.disabled = balance < rod.cost;
                    purchaseButton.onclick = () => purchaseFishingRodUpgrade(rod.level);
                    itemDiv.appendChild(purchaseButton);
                } else if (rod.level < fishingGameState.currentRodLevel) {
                    // No button for already owned lower-level rods
                }
                contentDiv.appendChild(itemDiv);
            });
            ui.rodUpgradeModal.style.display = 'flex';
        } else {
            ui.rodUpgradeModal.style.display = 'none';
        }
    }
}


function showFishingRodUpgradeModal() { 
    toggleFishingRodUpgradeModal(true);
}

function purchaseFishingRodUpgrade(levelToPurchase) { 
    const rodToBuy = FISHING_CONFIG.ROD_TYPES.find(r => r.level === levelToPurchase);
    if (!rodToBuy || rodToBuy.level <= fishingGameState.currentRodLevel) return;
    if (balance >= rodToBuy.cost) {
        balance -= rodToBuy.cost;
        fishingGameState.currentRodLevel = rodToBuy.level;
        fishingGameState.currentRod = rodToBuy;
        updateBalance();
        fishingUi.updateRodAndBaitDisplay(); 
        toggleFishingRodUpgradeModal(true); 
        showCustomAlert(`Rod upgraded to ${rodToBuy.name}!`, null, 1500);
        playSound('sfx_upgrade.mp3');
        if (typeof saveGame === 'function') saveGame();
    } else {
        showCustomAlert("Not enough Toki to upgrade rod.", null, 2000);
    }
}
