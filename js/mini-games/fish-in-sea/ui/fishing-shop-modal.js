
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

    const itemsToDisplay = fishingGameState.basket.filter(item => item.type === itemFilterType && !item.locked); // Exclude locked items
    if (itemsToDisplay.length === 0) {
        itemsGrid.innerHTML = `<p class="text-center text-xs text-gray-500" style="grid-column: 1 / -1;">No unlocked ${tabType.replace('_',' ')} items in basket for exchange.</p>`;
        return;
    }
    itemsToDisplay.forEach(item => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${item.details.rarityKey || 'base'}`;
        const img = document.createElement('img');
        img.src = getCardImagePath(item.details.set, item.details.cardId);
        img.alt = `${item.details.set}C${item.details.cardId}`;
        img.onerror = function() { this.src = 'https://placehold.co/100x140/cccccc/000000?text=Error'; this.onerror = null; };
        cardDiv.appendChild(img);
        itemsGrid.appendChild(cardDiv);
    });
}

function handleFishingShopExchangeAll() { // Renamed from handleShopExchangeAll
    const activeTabType = fishingGameState.ui.shopModal.querySelector('.fishing-shop-tabs button.active')?.dataset.tabType || 'fish';
    let exchangeRatesConfig;
    let itemFilterType;

    switch (activeTabType) {
        case 'fruit': exchangeRatesConfig = FISHING_CONFIG.FRUIT_EXCHANGE_RATES; itemFilterType = 'fruit_card'; break;
        case 'minerals': exchangeRatesConfig = FISHING_CONFIG.MINERAL_EXCHANGE_RATES; itemFilterType = 'mineral_card'; break;
        default: exchangeRatesConfig = FISHING_CONFIG.CARD_EXCHANGE_RATES; itemFilterType = 'card'; break;
    }

    let itemsExchangedCount = 0;
    const ticketsAwardedSummary = {};
    const itemsKeptInBasket = [];

    Object.keys(exchangeRatesConfig).forEach(itemRarityKey => {
        const itemsOfThisRarityInBasket = fishingGameState.basket.filter(item => 
            item.type === itemFilterType && item.details.rarityKey === itemRarityKey && !item.locked // Exclude locked items
        );
        
        let consumedFromBasketCount = 0;

        Object.keys(exchangeRatesConfig[itemRarityKey]).forEach(targetTicketType => {
            const { ticketType, count, itemsConsumedCount } = fishingMechanics.processShopExchange(
                activeTabType, // Pass category
                itemRarityKey, 
                itemsOfThisRarityInBasket.slice(consumedFromBasketCount), 
                exchangeRatesConfig, 
                targetTicketType
            );
            
            if (count > 0) {
                ticketsAwardedSummary[ticketType] = (ticketsAwardedSummary[ticketType] || 0) + count;
            }
            consumedFromBasketCount += itemsConsumedCount; 
        });
        
        // Add back to itemsKeptInBasket only those NOT consumed
        const nonConsumedItemsOfThisRarity = itemsOfThisRarityInBasket.slice(consumedFromBasketCount);
        nonConsumedItemsOfThisRarity.forEach(item => itemsKeptInBasket.push(item));
        itemsExchangedCount += consumedFromBasketCount; 
    });

    // Add back items of other types or locked items
    fishingGameState.basket.forEach(item => {
        if (item.type !== itemFilterType || item.locked) {
            itemsKeptInBasket.push(item);
        }
    });
    
    fishingGameState.basket = itemsKeptInBasket;

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
