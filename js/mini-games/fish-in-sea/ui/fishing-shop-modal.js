
// js/mini-games/fish-in-sea/ui/fishing-shop-modal.js

function setupFishingShopModal() { // Renamed from setupShopModal for clarity
    const shopModal = fishingGameState.ui.shopModal;
    if (!shopModal) return;
    // Event listeners for tabs and close button are set in fishingUi.addEventListeners
    // Initial render of ticket balances and items:
    renderFishingShopTicketBalances();
    renderFishingShopItems('fish'); // Default to fish tab
     // Activate the first tab if not already
    const firstTab = shopModal.querySelector('.fishing-shop-tabs button[data-tab-type="fish"]');
    if (firstTab) {
        shopModal.querySelectorAll('.fishing-shop-tabs button').forEach(btn => btn.classList.remove('active'));
        firstTab.classList.add('active');
    }
}

function toggleFishingShopModal(show) { // Renamed from toggleShopModal
    const shopModal = fishingGameState.ui.shopModal;
    if (shopModal) {
        if (show) {
            setupFishingShopModal(); // Ensure modal is set up before showing
            shopModal.style.display = 'flex';
        } else {
            shopModal.style.display = 'none';
            playSound('sfx_modal_close.mp3');
        }
    }
}

function renderFishingShopTicketBalances() { // Renamed from renderShopTicketBalances
    const balancesArea = fishingGameState.ui.shopTicketBalances;
    if (!balancesArea) return;
    balancesArea.innerHTML = 'Your Tickets: ';
    let balancesHTML = "";
    summonTicketRarities.forEach(rarityKey => {
        const count = getSummonTicketBalance(rarityKey);
        if (count > 0) { 
             const rarityInfo = getRarityTierInfo(rarityKey);
             balancesHTML += `<span class="rarity-text-${rarityKey}">${rarityInfo ? rarityInfo.name : rarityKey}: ${count}</span> `;
        }
    });
    if(balancesHTML === "") balancesHTML = "None";
    balancesArea.innerHTML += balancesHTML.trim();
}

function renderFishingShopItems(tabType = 'fish') { // Renamed from renderShopItems
    const itemsGrid = fishingGameState.ui.shopItemsGrid;
    const exchangeInfoArea = fishingGameState.ui.shopExchangeInfo;
    if (!itemsGrid || !exchangeInfoArea) return;

    itemsGrid.innerHTML = '';
    exchangeInfoArea.innerHTML = '';

    let exchangeRatesConfig;
    let itemFilterType;
    let itemCategoryTitle = "";

    switch (tabType) {
        case 'fruit':
            exchangeRatesConfig = FISHING_CONFIG.FRUIT_EXCHANGE_RATES;
            itemFilterType = 'fruit_card';
            itemCategoryTitle = "Fruit Exchange Progress";
            break;
        case 'minerals':
            exchangeRatesConfig = FISHING_CONFIG.MINERAL_EXCHANGE_RATES;
            itemFilterType = 'mineral_card';
            itemCategoryTitle = "Mineral Exchange Progress";
            break;
        default: // 'fish' or cards
            exchangeRatesConfig = FISHING_CONFIG.CARD_EXCHANGE_RATES;
            itemFilterType = 'card';
            itemCategoryTitle = "Card Exchange Progress";
            break;
    }
    
    const progressDiv = document.createElement('div');
    progressDiv.className = 'fishing-shop-item-group';
    const progressTitle = document.createElement('h4');
    progressTitle.textContent = itemCategoryTitle;
    progressDiv.appendChild(progressTitle);
    
    let hasProgress = false;
    const categoryProgress = fishingGameState.shopProgress[tabType] || {}; // Get category specific progress

    Object.keys(exchangeRatesConfig).forEach(itemRarityKey => {
        Object.keys(exchangeRatesConfig[itemRarityKey]).forEach(ticketRarityKey => {
            const progressKey = `${itemRarityKey}_for_${ticketRarityKey}`;
            const currentProgress = categoryProgress[progressKey] || 0; // Use categoryProgress
            const rate = exchangeRatesConfig[itemRarityKey][ticketRarityKey];
            if (currentProgress > 0) {
                const itemRarityInfo = getRarityTierInfo(itemRarityKey);
                const ticketRarityInfo = getRarityTierInfo(ticketRarityKey.replace('_ticket',''));
                const progressP = document.createElement('p');
                progressP.innerHTML = `Progress for <span class="rarity-text-${ticketRarityKey.replace('_ticket','')}">${ticketRarityInfo ? ticketRarityInfo.name : ticketRarityKey} Ticket</span> (from ${itemRarityInfo ? itemRarityInfo.name : itemRarityKey} items): <strong>${currentProgress}/${rate}</strong>`;
                progressDiv.appendChild(progressP);
                hasProgress = true;
            }
        });
    });
    if (!hasProgress) {
        const noProgressP = document.createElement('p');
        noProgressP.textContent = "No exchange progress yet for this category.";
        progressDiv.appendChild(noProgressP);
    }
    exchangeInfoArea.appendChild(progressDiv);

    const currentBasketItems = (typeof fishingBasket !== 'undefined' && Array.isArray(fishingBasket.basketContents)) ? fishingBasket.basketContents : [];
    const itemsToDisplay = currentBasketItems.filter(item => item && item.cardData && item.cardData.type === itemFilterType && !item.isLocked);

    if (itemsToDisplay.length === 0) {
        itemsGrid.innerHTML = `<p class="text-center text-xs text-gray-500" style="grid-column: 1 / -1;">No unlocked ${tabType.replace('_',' ')} items in basket for exchange.</p>`;
        return;
    }
    itemsToDisplay.forEach(item => {
        const cardDiv = document.createElement('div');
        // Assuming cardData has rarity, set, id for styling and image path
        cardDiv.className = `card ${item.cardData.rarity || 'base'}`;
        const img = document.createElement('img');
        img.src = getCardImagePath(item.cardData.set, item.cardData.id, item.cardData.imagePath); // Use imagePath from cardData if available
        img.alt = `${item.cardData.name || (item.cardData.set + "C" + item.cardData.id)}`;
        img.onerror = function() { this.src = 'https://placehold.co/100x140/cccccc/000000?text=Error'; this.onerror = null; };
        cardDiv.appendChild(img);
        itemsGrid.appendChild(cardDiv);
    });
}

function handleFishingShopExchangeAll() { // Renamed from handleShopExchangeAll
    const activeTabType = fishingGameState.ui.shopModal.querySelector('.fishing-shop-tabs button.active')?.dataset.tabType || 'fish';
    let exchangeRatesConfig;
    let itemFilterType; // This will be the value of cardData.type

    switch (activeTabType) {
        case 'fruit': exchangeRatesConfig = FISHING_CONFIG.FRUIT_EXCHANGE_RATES; itemFilterType = 'fruit'; break; // e.g. if cardData.type = 'fruit'
        case 'minerals': exchangeRatesConfig = FISHING_CONFIG.MINERAL_EXCHANGE_RATES; itemFilterType = 'mineral'; break;
        default: exchangeRatesConfig = FISHING_CONFIG.CARD_EXCHANGE_RATES; itemFilterType = 'fish'; break; // Assuming caught fish cards have type 'fish'
    }

    let itemsExchangedCount = 0;
    const ticketsAwardedSummary = {};
    const itemsToKeep = []; // Build a new list of items to keep

    const currentBasketItems = (typeof fishingBasket !== 'undefined' && Array.isArray(fishingBasket.basketContents)) ? fishingBasket.basketContents : [];

    // Segregate items that are not eligible for this tab's exchange or are locked
    currentBasketItems.forEach(item => {
        if (item.cardData.type !== itemFilterType || item.isLocked) {
            itemsToKeep.push(item);
        }
    });

    // Process eligible items
    Object.keys(exchangeRatesConfig).forEach(itemRarityKey => {
        // Filter for current rarity among eligible (unlocked, correct type) items
        const itemsOfThisRarityForExchange = currentBasketItems.filter(item =>
            item && item.cardData && item.cardData.type === itemFilterType && item.cardData.rarity === itemRarityKey && !item.isLocked
        );
        
        let consumedFromBasketCount = 0; // How many of itemsOfThisRarityForExchange are consumed

        Object.keys(exchangeRatesConfig[itemRarityKey]).forEach(targetTicketType => {
            const itemsAvailableForThisRule = itemsOfThisRarityForExchange.slice(consumedFromBasketCount);
            if(itemsAvailableForThisRule.length === 0) return; // No more items of this rarity to process

            // processShopExchange expects an array of card objects, but fishingMechanics.processShopExchange might be expecting the old format.
            // For now, let's adapt by passing the count of items.
            // This part needs careful review of how fishingMechanics.processShopExchange actually works with the new basket structure.
            // Assuming processShopExchange is updated or can handle item counts + types.
            // For simplicity here, we'll simulate its logic based on item quantities.

            const { ticketType, count, itemsConsumedCount: actualItemsConsumedForThisRule } = fishingMechanics.processShopExchange(
                activeTabType,
                itemRarityKey, 
                itemsAvailableForThisRule, // Pass the actual items
                exchangeRatesConfig, 
                targetTicketType
            );
            
            if (count > 0) {
                ticketsAwardedSummary[ticketType] = (ticketsAwardedSummary[ticketType] || 0) + count;
            }
            consumedFromBasketCount += actualItemsConsumedForThisRule;
        });
        
        // Add unconsumed items of this rarity back to itemsToKeep
        const nonConsumedItemsOfThisRarity = itemsOfThisRarityForExchange.slice(consumedFromBasketCount);
        nonConsumedItemsOfThisRarity.forEach(item => itemsToKeep.push(item));
        itemsExchangedCount += consumedFromBasketCount;
    });
    
    // Update the main basket
    if (typeof fishingBasket !== 'undefined') {
        fishingBasket.basketContents = itemsToKeep;
        // Trigger UI update for the main basket display
        if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.renderBasket === 'function') {
            fishingBasketUi.renderBasket(fishingBasket.getBasketContentsForDisplay(fishingBasketUi.currentFilters));
        }
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateBasketCount === 'function') {
            fishingUi.updateBasketCount(fishingBasket.getTotalItemCount());
        }
    }


    let summaryMessage = "";
    if (Object.keys(ticketsAwardedSummary).length > 0) {
        summaryMessage = "Exchanged items for: ";
        Object.entries(ticketsAwardedSummary).forEach(([ticketRarity, count]) => {
            const ticketRarityInfo = getRarityTierInfo(ticketRarity.replace('_ticket',''));
            summaryMessage += `${count} ${ticketRarityInfo ? ticketRarityInfo.name : ticketRarity} Ticket(s), `;
        });
        summaryMessage = summaryMessage.slice(0, -2) + "."; 
        playSound('sfx_toki_gain.mp3'); 
    } else if (itemsExchangedCount > 0) {
        summaryMessage = "Some items contributed to exchange progress, but no tickets awarded yet.";
    } else {
        summaryMessage = "No eligible items found for exchange in this tab.";
    }

    showCustomAlert(summaryMessage, null, 2500);
    renderFishingShopTicketBalances();
    renderFishingShopItems(activeTabType);
    if(typeof renderFishingBasket === 'function') renderFishingBasket(); 
    if (typeof saveGame === 'function') saveGame();
}
