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

    let filteredItems = fishingGameState.basket.filter(item => {
        const itemMatchesTab = activeTab === 'all_caught' || item.type === activeTab;
        const itemMatchesRarity = rarityFilterValue === 'all' || (item.details && item.details.rarityKey === rarityFilterValue);
        const itemMatchesSearch = searchTerm === '' || 
                                  (item.details && item.details.set && `${item.details.set.toLowerCase()} c${item.details.cardId}`.includes(searchTerm)) ||
                                  (item.details && item.details.name && item.details.name.toLowerCase().includes(searchTerm));
        return itemMatchesTab && itemMatchesRarity && itemMatchesSearch;
    });

    if (sortFilterValue === 'value_high_low') {
        filteredItems.sort((a, b) => (b.details.price || 0) - (a.details.price || 0));
    } else if (sortFilterValue === 'value_low_high') {
        filteredItems.sort((a, b) => (a.details.price || 0) - (b.details.price || 0));
    }
    // Add more sort options if needed, e.g., quantity (though basket items are usually quantity 1)

    if (filteredItems.length === 0) {
        grid.innerHTML = '<p class="text-center text-xs text-gray-500" style="grid-column: 1 / -1;">Basket is empty or no items match filter.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'basket-item-wrapper';

        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${item.details.rarityKey || 'base'}`;
        if (item.type === 'ticket') cardDiv.classList.add('ticket-image-container');
        if (item.locked) cardDiv.classList.add('locked-basket-item');
        
        if (fishingGameState.selectedItemInBasket && fishingGameState.selectedItemInBasket.id === item.id) {
            cardDiv.classList.add('selected-basket-item');
        }

        cardDiv.addEventListener('click', () => {
            if (isLockMode) {
                item.locked = !item.locked;
                playSound(item.locked ? 'sfx_item_lock.mp3' : 'sfx_item_unlock.mp3');
            } else {
                 showFishingBasketDetailModal(item);
            }
            renderFishingBasket(); 
        });


        const img = document.createElement('img');
        if (item.type === 'ticket') {
            img.src = `gui/summon_tickets/ticket_${item.details.rarityKey}.png`;
            img.alt = item.details.name;
        } else {
            img.src = getCardImagePath(item.details.set, item.details.cardId);
            img.alt = `${item.details.set}C${item.details.cardId}`;
        }
        img.onerror = function() { this.src = 'https://placehold.co/100x140/cccccc/000000?text=Error'; this.onerror = null; };
        cardDiv.appendChild(img);
        itemWrapper.appendChild(cardDiv);

        const infoP = document.createElement('p');
        infoP.className = 'fishing-basket-card-info';
        let infoText = "";
        if (item.type === 'ticket') {
            infoText = item.details.name;
        } else {
             const rarityInfo = getRarityTierInfo(item.details.rarityKey);
             infoText = `${item.details.set}C${item.details.cardId} (G${item.details.grade || '?'})<br><span class="value">${formatCurrency(item.details.price || 0)}</span>`;
        }
        if (item.locked) {
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
    playSound('sfx_modal_open.mp3');

    if (item.type === 'ticket') {
        imgElement.src = `gui/summon_tickets/ticket_${item.details.rarityKey}.png`;
        imgElement.classList.add('ticket-image');
        infoElement.innerHTML = `<p><strong>Item:</strong> ${item.details.name}</p><p>This is a summon ticket. Collect it to use it in the Summon Game.</p>`;
        collectButton.textContent = "Collect Ticket";
        sellButton.style.display = 'none';
    } else {
        imgElement.src = getCardImagePath(item.details.set, item.details.cardId);
        imgElement.classList.remove('ticket-image');
        imgElement.className = `detail-image card ${item.details.rarityKey}`;
        const rarityInfo = getRarityTierInfo(item.details.rarityKey);
        infoElement.innerHTML = `
            <p><strong>Card:</strong> ${item.details.set}C${item.details.cardId}</p>
            <p><strong>Rarity:</strong> <span class="rarity-text-${item.details.rarityKey}">${rarityInfo ? rarityInfo.name : item.details.rarityKey}</span></p>
            <p><strong>Grade:</strong> ${item.details.grade}</p>
            <p><strong>Base Value:</strong> ${formatCurrency(item.details.price)}</p>
            <p><strong>Sell Value (from basket):</strong> ${formatCurrency(Math.floor(item.details.price * FISHING_CONFIG.SELL_ALL_VALUE_MULTIPLIER))}</p>
        `;
        collectButton.textContent = "Collect Card";
        sellButton.style.display = 'block';
        sellButton.disabled = item.locked;
        sellButton.title = item.locked ? "Unlock in basket to sell" : "Sell this item";
    }
    collectButton.disabled = item.locked;
    collectButton.title = item.locked ? "Unlock in basket to collect" : "Collect this item";


    collectButton.onclick = () => {
        if (item.locked) { showCustomAlert("Item is locked. Unlock it in the basket first."); return; }
        if (item.type === 'ticket') {
            addSummonTickets(item.details.rarityKey, 1);
        } else {
            updateCollectionSingleCard(item.details);
            checkAllAchievements(item.details.set);
        }
        fishingGameState.basket = fishingGameState.basket.filter(basketItem => basketItem.id !== item.id);
        if (fishingGameState.selectedItemInBasket && fishingGameState.selectedItemInBasket.id === item.id) {
            fishingGameState.selectedItemInBasket = null;
        }
        showCustomAlert(`${item.details.name || `${item.details.set}C${item.details.cardId}`} collected!`, null, 1500);
        playSound('sfx_item_pickup.mp3');
        closeFishingBasketDetailModal();
        renderFishingBasket();
        if (typeof saveGame === 'function') saveGame();
    };

    sellButton.onclick = () => {
        if (item.locked) { showCustomAlert("Item is locked. Unlock it in the basket first."); return; }
        if (item.type === 'ticket') { showCustomAlert("Tickets cannot be sold."); return; }
        const sellValue = Math.floor(item.details.price * FISHING_CONFIG.SELL_ALL_VALUE_MULTIPLIER);
        balance += sellValue;
        updateBalance();
        fishingGameState.basket = fishingGameState.basket.filter(basketItem => basketItem.id !== item.id);
        if (fishingGameState.selectedItemInBasket && fishingGameState.selectedItemInBasket.id === item.id) {
            fishingGameState.selectedItemInBasket = null;
        }
        showCustomAlert(`Sold ${item.details.set}C${item.details.cardId} for ${formatCurrency(sellValue)} Toki.`, null, 1500);
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

    const itemsToKeep = fishingGameState.basket.filter(item => item.locked);
    const itemsToProcess = fishingGameState.basket.filter(item => !item.locked);

    itemsToProcess.forEach(item => {
        if (item.type === 'card' || item.type === 'fruit_card' || item.type === 'mineral_card') {
            updateCollectionSingleCard(item.details);
            checkAllAchievements(item.details.set);
            itemsCollectedCount++;
        } else if (item.type === 'ticket') {
            addSummonTickets(item.details.rarityKey, 1);
            ticketsSummary[item.details.rarityKey] = (ticketsSummary[item.details.rarityKey] || 0) + 1;
            itemsCollectedCount++;
        }
    });
    fishingGameState.basket = itemsToKeep;
    fishingGameState.selectedItemInBasket = null;
    renderFishingBasket();
    
    let message = "";
    if (itemsCollectedCount > 0) {
        message = `${itemsCollectedCount} unlocked item(s) processed: `;
        let cardPart = itemsToProcess.filter(i => i.type !== 'ticket').length;
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
    if (typeof saveGame === 'function') saveGame();
}

function sellAllUnlockedFishingBasketItems() {
    let totalSellValue = 0;
    let itemsSoldCount = 0;
    const itemsToKeep = fishingGameState.basket.filter(item => item.locked);
    const itemsToSell = fishingGameState.basket.filter(item => !item.locked && item.type !== 'ticket');

    itemsToSell.forEach(item => {
        totalSellValue += Math.floor(item.details.price * FISHING_CONFIG.SELL_ALL_VALUE_MULTIPLIER);
        itemsSoldCount++;
    });

    if (itemsSoldCount > 0) {
        balance += totalSellValue;
        updateBalance();
        // Also keep non-card/fruit/mineral unlocked items (like tickets)
        const unlockedNonSellable = fishingGameState.basket.filter(item => !item.locked && item.type === 'ticket');
        fishingGameState.basket = [...itemsToKeep, ...unlockedNonSellable];
        fishingGameState.selectedItemInBasket = null;
        showCustomAlert(`Sold ${itemsSoldCount} unlocked item(s) for ${formatCurrency(totalSellValue)} Toki.`, null, 2000);
        playSound('sfx_toki_gain.mp3');
    } else {
        showCustomAlert("No unlocked items (cards/fruits/minerals) to sell.", null, 1500);
    }
    renderFishingBasket();
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