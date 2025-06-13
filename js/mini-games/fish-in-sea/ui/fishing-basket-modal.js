// js/mini-games/fish-in-sea/ui/fishing-basket-modal.js

function toggleFishingBasketModal(show) {
    const ui = fishingGameState.ui;
    if (ui.basketModal) {
        if (show) {
            fishingGameState.selectedItemInBasket = null; 
            if (ui.basketLockModeCheckbox) { // Set checkbox based on persisted state
                ui.basketLockModeCheckbox.checked = fishingGameState.isBasketLockModeActive;
            }
            populateFishingBasketFilters(); 
            renderFishingBasket();
            ui.basketModal.style.display = 'flex';
        } else {
            ui.basketModal.style.display = 'none';
        }
    }
}

function showFishingBasketModal() { 
    toggleFishingBasketModal(true);
}

function renderFishingBasket() { 
    const ui = fishingGameState.ui;
    const grid = ui.basketGrid;
    const rarityFilterValue = ui.basketRarityFilter.value;
    const sortFilterValue = ui.basketSortFilter.value;
    const searchTerm = ui.basketSearchInput.value.toLowerCase().trim();
    const activeTabButton = ui.basketModal.querySelector('.fishing-basket-tabs button.active');
    const activeTab = activeTabButton ? activeTabButton.dataset.tabType : 'all_caught';
    const isLockMode = ui.basketLockModeCheckbox ? ui.basketLockModeCheckbox.checked : false;
    fishingGameState.isBasketLockModeActive = isLockMode; // Persist this

    if (!grid) return;
    grid.innerHTML = '';

    const sourceBasketItems = (window.fishingBasket && Array.isArray(window.fishingBasket.basketContents)) ? window.fishingBasket.basketContents : [];
    let filteredItems = sourceBasketItems.filter(item => {
        if (!item || !item.cardData) return false; // Ensure item and cardData exist
        const itemDetails = item.cardData; // cardData from basketContents is the 'details'
        const itemType = itemDetails.type || 'card'; // Get type from cardData, default to 'card' if not present

        const itemMatchesTab = activeTab === 'all_caught' || itemType === activeTab;
        const itemMatchesRarity = rarityFilterValue === 'all' || (itemDetails && itemDetails.rarityKey === rarityFilterValue);
        const itemMatchesSearch = searchTerm === '' ||
                                  (itemDetails && itemDetails.set && `${itemDetails.set.toLowerCase()} c${itemDetails.cardId}`.includes(searchTerm)) ||
                                  (itemDetails && itemDetails.name && itemDetails.name.toLowerCase().includes(searchTerm));
        return itemMatchesTab && itemMatchesRarity && itemMatchesSearch;
    });

    if (sortFilterValue === 'value_high_low') {
        filteredItems.sort((a, b) => {
            const bPrice = (b.cardData && b.cardData.price) || 0;
            const aPrice = (a.cardData && a.cardData.price) || 0;
            return bPrice - aPrice;
        });
    } else if (sortFilterValue === 'value_low_high') {
        filteredItems.sort((a, b) => {
            const aPrice = (a.cardData && a.cardData.price) || 0;
            const bPrice = (b.cardData && b.cardData.price) || 0;
            return aPrice - bPrice;
        });
    }
    // Add more sort options if needed, e.g., quantity (though basket items are usually quantity 1)

    if (filteredItems.length === 0) {
        grid.innerHTML = '<p class="text-center text-xs text-gray-500" style="grid-column: 1 / -1;">Basket is empty or no items match filter.</p>';
        return;
    }

    filteredItems.forEach(item => {
        if (!item || !item.cardData) return; // Ensure item and cardData exist
        const itemDetails = item.cardData; // cardData from basketContents is the 'details'

        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'basket-item-wrapper';

        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${itemDetails.rarityKey || 'base'}`;
        if (itemDetails.type === 'ticket') cardDiv.classList.add('ticket-image-container');
        if (item.locked) cardDiv.classList.add('locked-basket-item'); // item.locked is from the basketContents structure
        
        // Assuming item.instanceId is the unique identifier in basketContents
        if (fishingGameState.selectedItemInBasket && fishingGameState.selectedItemInBasket.instanceId === item.instanceId) {
            cardDiv.classList.add('selected-basket-item');
        }

        cardDiv.addEventListener('click', () => {
            if (isLockMode) {
                // item.locked is part of the item in basketContents, directly modify if safe,
                // or call a method on window.fishingBasket if available e.g. window.fishingBasket.toggleLock(item.instanceId)
                item.locked = !item.locked;
                playSound(item.locked ? 'sfx_item_lock.mp3' : 'sfx_item_unlock.mp3');
            } else {
                 showFishingBasketDetailModal(item); // Pass the whole item from basketContents
            }
            renderFishingBasket(); 
        });


        const img = document.createElement('img');
        if (itemDetails.type === 'ticket') {
            img.src = `gui/summon_tickets/ticket_${itemDetails.rarityKey}.png`;
            img.alt = itemDetails.name;
        } else {
            img.src = getCardImagePath(itemDetails.set, itemDetails.cardId);
            img.alt = `${itemDetails.set}C${itemDetails.cardId}`;
        }
        img.onerror = function() { this.src = 'https://placehold.co/100x140/cccccc/000000?text=Error'; this.onerror = null; };
        cardDiv.appendChild(img);
        itemWrapper.appendChild(cardDiv);

        const infoP = document.createElement('p');
        infoP.className = 'fishing-basket-card-info';
        let infoText = "";
        if (itemDetails.type === 'ticket') {
            infoText = itemDetails.name;
        } else {
             const rarityInfo = getRarityTierInfo(itemDetails.rarityKey);
             infoText = `${itemDetails.set}C${itemDetails.cardId} (G${itemDetails.grade || '?'})<br><span class="value">${formatCurrency(itemDetails.price || 0)}</span>`;
        }
        if (item.locked) { // item.locked is from the basketContents structure
            infoText += ` <span class="lock-indicator">🔒</span>`;
        }
        infoP.innerHTML = infoText;
        itemWrapper.appendChild(infoP);

        grid.appendChild(itemWrapper);
    });
}

function showFishingBasketDetailModal(item) {
    const modal = fishingGameState.ui.cardDetailFishingBasketModal;
    const imgElement = modal.querySelector('#detail-image-fishingbasket');
    const infoElement = modal.querySelector('#detail-info-fishingbasket');
    const collectButton = modal.querySelector('.fishing-basket-detail-collect-button');
    const sellButton = modal.querySelector('.fishing-basket-detail-sell-button');

    if (!modal || !imgElement || !infoElement || !collectButton || !sellButton) {
        console.error("Fishing Basket Detail Modal elements not found.");
        return;
    }
    if (!item || !item.cardData) {
        console.error("Invalid item data for detail modal.");
        closeFishingBasketDetailModal(); // Close if item is bad
        return;
    }
    const itemDetails = item.cardData; // cardData from basketContents is the 'details'
    playSound('sfx_modal_open.mp3');

    if (itemDetails.type === 'ticket') {
        imgElement.src = `gui/summon_tickets/ticket_${itemDetails.rarityKey}.png`;
        imgElement.classList.add('ticket-image');
        infoElement.innerHTML = `<p><strong>Item:</strong> ${itemDetails.name}</p><p>This is a summon ticket. Collect it to use it in the Summon Game.</p>`;
        collectButton.textContent = "Collect Ticket";
        sellButton.style.display = 'none';
    } else {
        imgElement.src = getCardImagePath(itemDetails.set, itemDetails.cardId);
        imgElement.classList.remove('ticket-image');
        imgElement.className = `detail-image card ${itemDetails.rarityKey}`;
        const rarityInfo = getRarityTierInfo(itemDetails.rarityKey);
        infoElement.innerHTML = `
            <p><strong>Card:</strong> ${itemDetails.set}C${itemDetails.cardId}</p>
            <p><strong>Rarity:</strong> <span class="rarity-text-${itemDetails.rarityKey}">${rarityInfo ? rarityInfo.name : itemDetails.rarityKey}</span></p>
            <p><strong>Grade:</strong> ${itemDetails.grade}</p>
            <p><strong>Base Value:</strong> ${formatCurrency(itemDetails.price)}</p>
            <p><strong>Sell Value (from basket):</strong> ${formatCurrency(Math.floor(itemDetails.price * FISHING_CONFIG.SELL_ALL_VALUE_MULTIPLIER))}</p>
        `;
        collectButton.textContent = "Collect Card";
        sellButton.style.display = 'block';
        sellButton.disabled = item.locked; // item.locked is from basketContents
        sellButton.title = item.locked ? "Unlock in basket to sell" : "Sell this item";
    }
    collectButton.disabled = item.locked; // item.locked is from basketContents
    collectButton.title = item.locked ? "Unlock in basket to collect" : "Collect this item";


    collectButton.onclick = () => {
        if (item.locked) { showCustomAlert("Item is locked. Unlock it in the basket first."); return; }
        // item and itemDetails are from the outer scope of showFishingBasketDetailModal
        if (itemDetails.type === 'ticket') {
            addSummonTickets(itemDetails.rarityKey, 1);
        } else {
            updateCollectionSingleCard(itemDetails); // Pass itemDetails (which is item.cardData)
            checkAllAchievements(itemDetails.set);
        }
        // Remove item from window.fishingBasket.basketContents using item.instanceId
        if (window.fishingBasket && typeof window.fishingBasket.removeCardFromBasketByInstanceId === 'function') {
            window.fishingBasket.removeCardFromBasketByInstanceId(item.instanceId);
        } else {
            // Fallback if specific removal function isn't available - this is less safe
            const sourceBasketItems = (window.fishingBasket && Array.isArray(window.fishingBasket.basketContents)) ? window.fishingBasket.basketContents : [];
            const itemIndex = sourceBasketItems.findIndex(basketItem => basketItem.instanceId === item.instanceId);
            if (itemIndex > -1) sourceBasketItems.splice(itemIndex, 1);
        }

        // Original logic for fishingGameState.selectedItemInBasket - adapt if this modal still uses it
        // This might need to be cleared or re-evaluated based on instanceId
        if (fishingGameState.selectedItemInBasket && fishingGameState.selectedItemInBasket.instanceId === item.instanceId) {
            fishingGameState.selectedItemInBasket = null;
        }
        showCustomAlert(`${itemDetails.name || `${itemDetails.set}C${itemDetails.cardId}`} collected!`, null, 1500);
        playSound('sfx_item_pickup.mp3');
        closeFishingBasketDetailModal();
        renderFishingBasket(); // This will re-read from window.fishingBasket.basketContents
        if (typeof saveGame === 'function') saveGame();
    };

    sellButton.onclick = () => {
        if (item.locked) { showCustomAlert("Item is locked. Unlock it in the basket first."); return; }
        // item and itemDetails are from the outer scope
        if (itemDetails.type === 'ticket') { showCustomAlert("Tickets cannot be sold."); return; }
        const sellValue = Math.floor(itemDetails.price * FISHING_CONFIG.SELL_ALL_VALUE_MULTIPLIER);
        balance += sellValue; // Assuming 'balance' is global player currency
        updateBalance(); // Assuming global function to update currency display

        // Remove item from window.fishingBasket.basketContents
        if (window.fishingBasket && typeof window.fishingBasket.removeCardFromBasketByInstanceId === 'function') {
            window.fishingBasket.removeCardFromBasketByInstanceId(item.instanceId);
        } else {
            const sourceBasketItems = (window.fishingBasket && Array.isArray(window.fishingBasket.basketContents)) ? window.fishingBasket.basketContents : [];
            const itemIndex = sourceBasketItems.findIndex(basketItem => basketItem.instanceId === item.instanceId);
            if (itemIndex > -1) sourceBasketItems.splice(itemIndex, 1);
        }

        if (fishingGameState.selectedItemInBasket && fishingGameState.selectedItemInBasket.instanceId === item.instanceId) {
            fishingGameState.selectedItemInBasket = null;
        }
        showCustomAlert(`Sold ${itemDetails.set}C${itemDetails.cardId} for ${formatCurrency(sellValue)} Toki.`, null, 1500);
        playSound('sfx_toki_gain.mp3');
        closeFishingBasketDetailModal();
        renderFishingBasket();
        if (typeof saveGame === 'function') saveGame();
    };

    modal.style.display = 'flex';
}

function closeFishingBasketDetailModal() {
    const modal = fishingGameState.ui.cardDetailFishingBasketModal;
    if (modal) {
        modal.style.display = 'none';
    }
}


function collectAllFishingBasketItems() { 
    let itemsCollectedCount = 0;
    const ticketsSummary = {};

    const sourceBasketItems = (window.fishingBasket && Array.isArray(window.fishingBasket.basketContents)) ? [...window.fishingBasket.basketContents] : []; // Clone for iteration if modifying source
    const itemsToKeep = [];
    const itemsToProcess = [];

    sourceBasketItems.forEach(item => {
        if (item.locked) {
            itemsToKeep.push(item);
        } else {
            itemsToProcess.push(item);
        }
    });

    itemsToProcess.forEach(item => {
        if (!item || !item.cardData) return;
        const itemDetails = item.cardData;
        const itemType = itemDetails.type || 'card';

        if (itemType === 'card' || itemType === 'fruit_card' || itemType === 'mineral_card' || itemType === 'fish') { // Assuming 'fish' is another card type
            updateCollectionSingleCard(itemDetails, 1, false); // Pass itemDetails (item.cardData)
            checkAllAchievements(itemDetails.set);
            itemsCollectedCount++;
        } else if (itemType === 'ticket') {
            addSummonTickets(itemDetails.rarityKey, 1);
            ticketsSummary[itemDetails.rarityKey] = (ticketsSummary[itemDetails.rarityKey] || 0) + 1;
            itemsCollectedCount++;
        }
    });

    if (window.fishingBasket) {
        // If a method like clearUnlockedAndKeepLocked() exists, use it.
        // Otherwise, directly set basketContents to only locked items.
        window.fishingBasket.basketContents = itemsToKeep;
        // Or, if fishingBasket has a more robust clear for unlocked:
        // window.fishingBasket.clearUnlockedItems(); (hypothetical)
    }
    fishingGameState.selectedItemInBasket = null; // This might be using a different item structure/ID system
    renderFishingBasket(); // This will re-read from window.fishingBasket.basketContents
    
    let message = "";
    if (itemsCollectedCount > 0) {
        message = `${itemsCollectedCount} unlocked item(s) processed: `;
        let cardPart = itemsToProcess.filter(item => {
            const itemDetails = item.cardData;
            const itemType = itemDetails ? (itemDetails.type || 'card') : 'card';
            return itemType !== 'ticket';
        }).length;
        if (cardPart > 0) message += `${cardPart} card(s) added to collection. `;
        
        let ticketMessages = [];
        Object.keys(ticketsSummary).forEach(rarityKey => {
            const rarityInfo = getRarityTierInfo(rarityKey);
            ticketMessages.push(`${ticketsSummary[rarityKey]} ${rarityInfo ? rarityInfo.name : rarityKey} Ticket(s)`);
        });
        if (ticketMessages.length > 0) message += ticketMessages.join(', ') + " added.";
    } else {
        message = "No unlocked items to collect.";
    }
    showCustomAlert(message.trim(), null, 2500);
    if (typeof saveGame === 'function') saveGame(); // saveGame should ideally use window.fishingBasket.getBasketContentsForSave()
}

function sellAllUnlockedFishingBasketItems() {
    let totalSellValue = 0;
    let itemsSoldCount = 0;

    const sourceBasketItems = (window.fishingBasket && Array.isArray(window.fishingBasket.basketContents)) ? [...window.fishingBasket.basketContents] : [];
    const itemsToKeep = [];
    const itemsToSell = [];
    const unlockedNonSellableToKeep = [];

    sourceBasketItems.forEach(item => {
        if (!item || !item.cardData) return;
        const itemDetails = item.cardData;
        const itemType = itemDetails.type || 'card';

        if (item.locked) {
            itemsToKeep.push(item);
        } else {
            if (itemType !== 'ticket') { // Only non-tickets are sellable from this function
                itemsToSell.push(item);
            } else {
                unlockedNonSellableToKeep.push(item); // Keep unlocked tickets
            }
        }
    });

    itemsToSell.forEach(item => {
        // item.cardData should exist due to the check above
        totalSellValue += Math.floor(item.cardData.price * FISHING_CONFIG.SELL_ALL_VALUE_MULTIPLIER);
        itemsSoldCount++;
    });

    if (itemsSoldCount > 0) {
        balance += totalSellValue; // Global player balance
        updateBalance(); // Global function to update UI

        if (window.fishingBasket) {
            window.fishingBasket.basketContents = [...itemsToKeep, ...unlockedNonSellableToKeep];
        }
        fishingGameState.selectedItemInBasket = null;
        showCustomAlert(`Sold ${itemsSoldCount} unlocked item(s) for ${formatCurrency(totalSellValue)} Toki.`, null, 2000);
        playSound('sfx_toki_gain.mp3');
    } else {
        showCustomAlert("No unlocked, sellable items (cards/fruits/minerals) to sell.", null, 1500);
    }
    renderFishingBasket(); // Re-renders from window.fishingBasket
    if (typeof saveGame === 'function') saveGame();
}


function populateFishingBasketFilters() { 
    const rarityFilterEl = fishingGameState.ui.basketRarityFilter;
    if (!rarityFilterEl) return;
    
    if (rarityFilterEl.options.length <= 1) { 
        RARITY_PACK_PULL_DISTRIBUTION.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.key;
            opt.textContent = r.name;
            rarityFilterEl.appendChild(opt);
        });
    }
}