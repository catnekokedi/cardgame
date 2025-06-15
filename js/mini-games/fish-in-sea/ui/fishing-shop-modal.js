// js/mini-games/fish-in-sea/ui/fishing-shop-modal.js

const ITEMS_PER_PAGE_SHOP = 64;

function setupFishingShopModal() {
    const shopModal = fishingGameState.ui.shopModal;
    if (!shopModal) return;

    renderFishingShopTicketBalances(); // Restored call
    renderFishingShopItems('all', 1); // Initial render

    const firstTab = shopModal.querySelector('.fishing-shop-tabs button[data-tab-type="all"]');
    if (firstTab) {
        shopModal.querySelectorAll('.fishing-shop-tabs button').forEach(btn => btn.classList.remove('active'));
        firstTab.classList.add('active');
    }

    // Remove event listeners for new basket buttons (if they were added here - they are in fishing-ui.js)
    // Ensure event listener for the original exchange button is correctly set up if it's managed here.
    // Based on previous steps, this listener is in fishing-ui.js's addEventListeners.
    // If fishingGameState.ui.shopSellAllBtn is populated by fishing-ui.js, that listener will handle it.
    // No direct listener addition/removal for the main action button here, assuming it's handled by fishing-ui.js.
}

function toggleFishingShopModal(show) {
    const shopModal = fishingGameState.ui.shopModal;
    if (shopModal) {
        if (show) {
            setupFishingShopModal();
            shopModal.style.display = 'flex';
            playSound('sfx_modal_open.mp3');
        } else {
            shopModal.style.display = 'none';
            playSound('sfx_modal_close.mp3');
        }
    }
}

// Restored function
function renderFishingShopTicketBalances() {
    const balancesArea = fishingGameState.ui.shopTicketBalances; // Relies on fishingGameState.ui
    if (!balancesArea) {
        // console.warn("Ticket balances area not found in fishingGameState.ui for shop modal.");
        return;
    }
    balancesArea.innerHTML = 'Your Tickets: ';
    let balancesHTML = "";
    // Assuming summonTicketRarities is globally available or defined in fishingGameState or FISHING_CONFIG
    const ticketRarities = (typeof summonTicketRarities !== 'undefined') ? summonTicketRarities :
                           (FISHING_CONFIG && FISHING_CONFIG.SUMMON_TICKET_RARITIES ? FISHING_CONFIG.SUMMON_TICKET_RARITIES : []);

    ticketRarities.forEach(rarityKey => {
        const count = typeof getSummonTicketBalance === 'function' ? getSummonTicketBalance(rarityKey) : 0;
        if (count > 0) {
            const rarityInfo = typeof getRarityTierInfo === 'function' ? getRarityTierInfo(rarityKey) : { name: rarityKey };
            balancesHTML += `<span class="rarity-text-${rarityKey}">${rarityInfo ? rarityInfo.name : rarityKey}: ${count}</span> `;
        }
    });
    if (balancesHTML === "") balancesHTML = "None";
    balancesArea.innerHTML += balancesHTML.trim();
}


function renderFishingShopItems(tabType = 'all', currentPage = 1) {
    const itemsGrid = fishingGameState.ui.shopItemsGrid;
    fishingGameState.ui.shopPagination = fishingGameState.ui.shopPagination || document.getElementById('fishing-shop-pagination');
    const paginationContainer = fishingGameState.ui.shopPagination;
    const exchangeInfoArea = fishingGameState.ui.shopCurrentTabExchangeInfo; // This should point to #fishing-shop-current-tab-exchange-info

    if (!itemsGrid || !paginationContainer) {
        console.error("Shop items grid or pagination container not found.");
        return;
    }

    if(exchangeInfoArea) exchangeInfoArea.innerHTML = ''; // Clear previous exchange info
    itemsGrid.innerHTML = '';
    if(paginationContainer) paginationContainer.innerHTML = '';

    // Restore Exchange Rate/Progress Display Logic
    if (exchangeInfoArea) {
        if (tabType === 'all') {
            exchangeInfoArea.innerHTML = '<p class="text-center text-sm text-gray-500" style="padding: 10px 0;">Select a specific category tab to see detailed exchange progress.</p>';
        } else {
            let exchangeRatesConfig;
            // itemCategoryTitle is not used in the provided old structure, so removed.
            switch (tabType) {
                case 'fruit_card': exchangeRatesConfig = FISHING_CONFIG.FRUIT_EXCHANGE_RATES || {}; break;
                case 'mineral_card': exchangeRatesConfig = FISHING_CONFIG.MINERAL_EXCHANGE_RATES || {}; break;
                case 'bird_reward_card': exchangeRatesConfig = FISHING_CONFIG.BIRD_REWARD_EXCHANGE_RATES || FISHING_CONFIG.CARD_EXCHANGE_RATES || {}; break;
                case 'fish_card': default: exchangeRatesConfig = FISHING_CONFIG.CARD_EXCHANGE_RATES || {}; break;
            }

            const progressDiv = document.createElement('div');
            progressDiv.className = 'fishing-shop-item-group'; // Or other appropriate class
            let hasProgressToShow = false;
            const categoryProgress = fishingGameState.shopProgress[tabType] || {};

            Object.keys(exchangeRatesConfig).forEach(itemRarityKey => {
                if (!exchangeRatesConfig[itemRarityKey]) return;
                Object.keys(exchangeRatesConfig[itemRarityKey]).forEach(ticketRarityKey => {
                    const progressKey = `${itemRarityKey}_for_${ticketRarityKey}`;
                    const currentProgress = categoryProgress[progressKey] || 0;
                    const rate = exchangeRatesConfig[itemRarityKey][ticketRarityKey];
                    const itemRarityInfo = typeof getRarityTierInfo === 'function' ? getRarityTierInfo(itemRarityKey) : { name: itemRarityKey };
                    const ticketRarityInfo = typeof getRarityTierInfo === 'function' ? getRarityTierInfo(ticketRarityKey.replace('_ticket','')) : { name: ticketRarityKey.replace('_ticket','') };

                    const progressP = document.createElement('p');
                    progressP.className = 'exchange-progress-entry'; // Class for styling
                    progressP.innerHTML = `For <span class="rarity-text-${ticketRarityKey.replace('_ticket','')}">${ticketRarityInfo ? ticketRarityInfo.name : ticketRarityKey} Ticket</span> (from ${itemRarityInfo ? itemRarityInfo.name : itemRarityKey} items): <strong>${currentProgress}/${rate}</strong>`;
                    progressDiv.appendChild(progressP);
                    hasProgressToShow = true;
                });
            });
            if (!hasProgressToShow) {
                const noProgressP = document.createElement('p');
                noProgressP.textContent = "No exchange options defined for this category yet.";
                progressDiv.appendChild(noProgressP);
            }
            exchangeInfoArea.appendChild(progressDiv);
        }
    }

    // Item display logic (filtering for exchange, no sorting, no card detail click)
    let itemsToDisplay = (typeof fishingBasket !== 'undefined' && Array.isArray(fishingBasket.basketContents)) ? [...fishingBasket.basketContents] : [];
    const validExchangeTypes = ['fish_card', 'fruit_card', 'mineral_card', 'bird_reward_card']; // Original valid types for exchange

    if (tabType === 'all') {
        itemsToDisplay = itemsToDisplay.filter(item => item && item.cardData && validExchangeTypes.includes(item.cardData.type) && !item.isLocked);
    } else {
        itemsToDisplay = itemsToDisplay.filter(item => item && item.cardData && item.cardData.type === tabType && !item.isLocked);
    }
    // No rarity or sort filtering here for the original shop

    const totalPages = Math.ceil(itemsToDisplay.length / ITEMS_PER_PAGE_SHOP);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE_SHOP;
    const endIndex = startIndex + ITEMS_PER_PAGE_SHOP;
    const paginatedItems = itemsToDisplay.slice(startIndex, endIndex);

    if (paginatedItems.length === 0) {
        let message = "No items of this type in your basket for exchange.";
        if (tabType === 'all' && fishingBasket.basketContents.length > 0 && itemsToDisplay.length === 0) {
             message = "No items eligible for exchange in your basket (Fish, Fruit, Rock, Bird types, unlocked).";
        } else if (tabType !== 'all' && fishingBasket.basketContents.filter(i => i.cardData.type === tabType).length > 0 && itemsToDisplay.length === 0) {
             message = `All ${tabType.replace('_card','')} items are locked. Unlock them in the basket to exchange.`;
        }
        itemsGrid.innerHTML = `<p class="text-center text-xs text-gray-500" style="grid-column: 1 / -1;">${message}</p>`;
    } else {
        paginatedItems.forEach(item => {
            const card = item.cardData;
            if (!card) return;

            const cardDiv = document.createElement('div');
            cardDiv.className = 'basket-card-item';
            const rarityInfo = typeof getRarityTierInfo === 'function' ? getRarityTierInfo(card.rarityKey || card.rarity) : null;
            const rarityClass = rarityInfo ? `rarity-bg-${rarityInfo.key}` : 'rarity-bg-common';
            cardDiv.classList.add(rarityClass);
            // No .locked-item-visual needed as locked items are filtered out for exchange view

            const imgElement = document.createElement('img');
            imgElement.src = getCardImagePath(card.set, card.id, card);
            imgElement.alt = card.name || 'Unknown Item';
            imgElement.className = 'basket-card-image';
            imgElement.onerror = function() { this.src = 'gui/images/card_back_tree.png'; this.onerror = null; };

            cardDiv.appendChild(imgElement);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'basket-card-name';
            nameDiv.textContent = card.name || `${card.set || 'N/A'}C${card.id || 'N/A'}`;
            cardDiv.appendChild(nameDiv);

            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'basket-card-quantity';
            quantityDiv.textContent = `Qty: ${item.quantity}`;
            cardDiv.appendChild(quantityDiv);

            const rarityTextDiv = document.createElement('div');
            rarityTextDiv.className = 'basket-card-rarity';
            rarityTextDiv.textContent = rarityInfo ? rarityInfo.name : (card.rarityKey || card.rarity || 'N/A');
            cardDiv.appendChild(rarityTextDiv);

            // No click listener for card detail modal
            itemsGrid.appendChild(cardDiv);
        });
    }

    renderShopPaginationControls(currentPage, totalPages, tabType);
}

function renderShopPaginationControls(currentPage, totalPages, tabType) {
    const paginationContainer = fishingGameState.ui.shopPagination;
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = 'game-button';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            renderFishingShopItems(tabType, currentPage - 1);
            playSound('sfx_button_click_subtle.mp3');
        }
    });

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfo.className = 'pagination-info';

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'game-button';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderFishingShopItems(tabType, currentPage + 1);
            playSound('sfx_button_click_subtle.mp3');
        }
    });

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
}

// Restored function
function handleFishingShopExchangeAll() {
    const activeTabButton = fishingGameState.ui.shopModal.querySelector('.fishing-shop-tabs button.active');
    const activeTabType = activeTabButton ? activeTabButton.dataset.tabType : 'all';

    if (activeTabType === 'all') {
        showCustomAlert("Please select a specific category (Fish, Fruit, Rock, Bird) to use the 'Exchange All in Tab' feature.", "info", 3000);
        return;
    }

    let exchangeRatesConfig;
    let itemFilterType = activeTabType;

    switch (activeTabType) {
        case 'fruit_card': exchangeRatesConfig = FISHING_CONFIG.FRUIT_EXCHANGE_RATES; break;
        case 'mineral_card': exchangeRatesConfig = FISHING_CONFIG.MINERAL_EXCHANGE_RATES; break;
        case 'bird_reward_card': exchangeRatesConfig = FISHING_CONFIG.BIRD_REWARD_EXCHANGE_RATES || FISHING_CONFIG.CARD_EXCHANGE_RATES; break;
        case 'fish_card': default: exchangeRatesConfig = FISHING_CONFIG.CARD_EXCHANGE_RATES; itemFilterType = 'fish_card'; break;
    }
     if (!exchangeRatesConfig) {
        showCustomAlert(`Exchange rates for ${activeTabType.replace('_card','')} are not configured.`, "error", 3000);
        return;
    }

    let itemsExchangedCountOverall = 0;
    const ticketsAwardedSummary = {};

    // Iterate through each rarity defined in the exchange config for the current tab type
    Object.keys(exchangeRatesConfig).forEach(itemRarityKey => {
        // For each item rarity, iterate through the ticket types it can be exchanged for
        Object.keys(exchangeRatesConfig[itemRarityKey]).forEach(targetTicketRarityKey => {
            const itemsAvailableForThisSpecificExchange = fishingBasket.basketContents.filter(
                item => item.cardData.type === itemFilterType &&
                        item.cardData.rarity === itemRarityKey &&
                        !item.isLocked
            );

            if (itemsAvailableForThisSpecificExchange.length > 0) {
                 // Call processShopExchange for this specific item type, item rarity, and target ticket type
                const { ticketType, count, itemsConsumedCount } = fishingMechanics.processShopExchange(
                    itemFilterType,
                    itemRarityKey,
                    itemsAvailableForThisSpecificExchange, // Pass only items matching this rule
                    exchangeRatesConfig, // Pass the full config for lookup
                    targetTicketRarityKey // Specify which ticket we are aiming for
                );

                if (count > 0) {
                    ticketsAwardedSummary[ticketType] = (ticketsAwardedSummary[ticketType] || 0) + count;
                }
                itemsExchangedCountOverall += itemsConsumedCount;
            }
        });
    });


    if (itemsExchangedCountOverall > 0 || Object.keys(ticketsAwardedSummary).length > 0) {
        let summaryMessage = "Exchange successful! ";
        if (Object.keys(ticketsAwardedSummary).length > 0) {
            summaryMessage += "You received: ";
            Object.entries(ticketsAwardedSummary).forEach(([ticketRarity, count]) => {
                const ticketRarityInfo = getRarityTierInfo(ticketRarity.replace('_ticket', ''));
                summaryMessage += `${count} ${ticketRarityInfo ? ticketRarityInfo.name : ticketRarity} Ticket(s), `;
            });
            summaryMessage = summaryMessage.slice(0, -2) + ". ";
        }
        if (itemsExchangedCountOverall > 0 && Object.keys(ticketsAwardedSummary).length === 0) {
             summaryMessage = "Some items contributed to exchange progress, but no tickets awarded yet.";
        }
        showCustomAlert(summaryMessage, null, 3500);
        playSound('sfx_toki_gain.mp3'); // Or a more appropriate sound
        if (typeof saveGame === 'function') saveGame();
    } else {
        showCustomAlert("No eligible items found for exchange in this tab, or items did not meet exchange criteria.", "info", 3000);
    }

    renderFishingShopTicketBalances(); // Refresh ticket display
    renderFishingShopItems(activeTabType, 1); // Refresh current tab
    // If fishingBasketUi is the main basket display, refresh it too
    if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.updateBasketFilters === 'function') {
        fishingBasketUi.updateBasketFilters();
    }
}


// Global function to open the (now repurposed) fishing basket modal.
// This should ideally be renamed if this file is solely for the shop modal again.
function openNewFishingBasketModal() {
    toggleFishingShopModal(true);
}
