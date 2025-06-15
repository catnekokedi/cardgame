// js/mini-games/fish-in-sea/ui/fishing-shop-modal.js

const ITEMS_PER_PAGE_SHOP = 64; // Renamed to avoid conflict if ITEMS_PER_PAGE is global

// Function to populate the new rarity filter
function populateNewRarityFilter() {
    const rarityFilterElement = fishingGameState.ui.basketRarityFilter;
    if (!rarityFilterElement) {
        console.error("New Rarity filter element not found in fishingGameState.ui");
        return;
    }

    rarityFilterElement.innerHTML = '';

    const allRaritiesOption = document.createElement('option');
    allRaritiesOption.value = 'all';
    allRaritiesOption.textContent = 'All Rarities';
    allRaritiesOption.selected = true;
    rarityFilterElement.appendChild(allRaritiesOption);

    if (typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined' && Array.isArray(RARITY_PACK_PULL_DISTRIBUTION)) {
        RARITY_PACK_PULL_DISTRIBUTION.forEach(rarityTier => {
            const option = document.createElement('option');
            option.value = rarityTier.key;
            option.textContent = rarityTier.name;
            rarityFilterElement.appendChild(option);
        });
    } else {
        console.warn("RARITY_PACK_PULL_DISTRIBUTION is not defined. Rarity filter for basket will be incomplete.");
    }
}


function setupFishingShopModal() {
    const shopModal = fishingGameState.ui.shopModal;
    if (!shopModal) return;

    populateNewRarityFilter();

    // Event listeners for filters
    if (fishingGameState.ui.basketRarityFilter) {
        fishingGameState.ui.basketRarityFilter.addEventListener('change', () => {
            const currentTabType = shopModal.querySelector('.fishing-shop-tabs button.active')?.dataset.tabType || 'all';
            renderFishingShopItems(currentTabType, 1);
        });
    }
    if (fishingGameState.ui.basketSortFilter) {
        fishingGameState.ui.basketSortFilter.addEventListener('change', () => {
            const currentTabType = shopModal.querySelector('.fishing-shop-tabs button.active')?.dataset.tabType || 'all';
            renderFishingShopItems(currentTabType, 1);
        });
    }

    // New button event listeners
    const sellAllBtn = fishingGameState.ui.newBasketSellAllBtn;
    const collectAllBtn = fishingGameState.ui.newBasketCollectAllBtn;

    if (sellAllBtn) {
        // Remove old listener if any (important if setupFishingShopModal can be called multiple times)
        // However, with current structure, listeners are added once in fishing-ui.js's addEventListeners
        // This setup function might be better placed within fishing-ui.js or be very careful about re-adding.
        // For now, assuming this setup is called once per modal instance effectively.
        sellAllBtn.onclick = null; // Clear previous listener before adding new one
        sellAllBtn.addEventListener('click', () => {
            if (typeof fishingBasket !== 'undefined' && typeof fishingBasket.sellAllUnlockedCards === 'function') {
                showConfirmationModal("Are you sure you want to sell ALL unlocked items in your basket?", () => {
                    fishingBasket.sellAllUnlockedCards();
                    const currentTab = shopModal.querySelector('.fishing-shop-tabs button.active')?.dataset.tabType || 'all';
                    renderFishingShopItems(currentTab, 1); // Refresh view
                    playSound('sfx_button_click.mp3');
                });
            } else {
                console.error("fishingBasket.sellAllUnlockedCards function not found!");
            }
        });
    }

    if (collectAllBtn) {
        collectAllBtn.onclick = null; // Clear previous listener
        collectAllBtn.addEventListener('click', () => {
            if (typeof fishingBasket !== 'undefined' && typeof fishingBasket.collectAllUnlockedCards === 'function') {
                showConfirmationModal("Are you sure you want to collect ALL unlocked items to your main collection?", () => {
                    fishingBasket.collectAllUnlockedCards();
                    const currentTab = shopModal.querySelector('.fishing-shop-tabs button.active')?.dataset.tabType || 'all';
                    renderFishingShopItems(currentTab, 1); // Refresh view
                    playSound('sfx_button_click.mp3');
                });
            } else {
                console.error("fishingBasket.collectAllUnlockedCards function not found!");
            }
        });
    }

    renderFishingShopItems('all', 1);

    const firstTab = shopModal.querySelector('.fishing-shop-tabs button[data-tab-type="all"]');
    if (firstTab) {
        shopModal.querySelectorAll('.fishing-shop-tabs button').forEach(btn => btn.classList.remove('active'));
        firstTab.classList.add('active');
    }
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

/* // renderFishingShopTicketBalances function removed */

function renderFishingShopItems(tabType = 'all', currentPage = 1) {
    const itemsGrid = fishingGameState.ui.shopItemsGrid;
    fishingGameState.ui.shopPagination = fishingGameState.ui.shopPagination || document.getElementById('fishing-shop-pagination');
    const paginationContainer = fishingGameState.ui.shopPagination;
    // const filtersContainer = fishingGameState.ui.shopCurrentTabExchangeInfo; // This is #fishing-basket-new-filters-container

    if (!itemsGrid || !paginationContainer) {
        console.error("Shop items grid or pagination container not found.");
        return;
    }

    itemsGrid.innerHTML = '';
    if(paginationContainer) paginationContainer.innerHTML = '';

    const rarityFilterValue = fishingGameState.ui.basketRarityFilter ? fishingGameState.ui.basketRarityFilter.value : 'all';
    const sortFilterValue = fishingGameState.ui.basketSortFilter ? fishingGameState.ui.basketSortFilter.value : 'default';

    let itemsToDisplay = (typeof fishingBasket !== 'undefined' && Array.isArray(fishingBasket.basketContents)) ? [...fishingBasket.basketContents] : [];

    if (tabType !== 'all') {
        itemsToDisplay = itemsToDisplay.filter(item => item && item.cardData && item.cardData.type === tabType);
    }

    if (rarityFilterValue !== 'all') {
        itemsToDisplay = itemsToDisplay.filter(item => item && item.cardData && (item.cardData.rarity === rarityFilterValue || item.cardData.rarityKey === rarityFilterValue));
    }

    if (sortFilterValue && sortFilterValue !== 'default') {
        switch (sortFilterValue) {
            case 'name_asc':
                itemsToDisplay.sort((a, b) => (a.cardData.name || '').localeCompare(b.cardData.name || ''));
                break;
            case 'name_desc':
                itemsToDisplay.sort((a, b) => (b.cardData.name || '').localeCompare(a.cardData.name || ''));
                break;
            case 'quantity_asc':
                itemsToDisplay.sort((a, b) => a.quantity - b.quantity);
                break;
            case 'quantity_desc':
                itemsToDisplay.sort((a, b) => b.quantity - a.quantity);
                break;
            case 'value_asc':
                itemsToDisplay.sort((a, b) => (a.cardData.price || 0) - (b.cardData.price || 0));
                break;
            case 'value_desc':
                itemsToDisplay.sort((a, b) => (b.cardData.price || 0) - (a.cardData.price || 0));
                break;
        }
    }

    const totalPages = Math.ceil(itemsToDisplay.length / ITEMS_PER_PAGE_SHOP);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE_SHOP;
    const endIndex = startIndex + ITEMS_PER_PAGE_SHOP;
    const paginatedItems = itemsToDisplay.slice(startIndex, endIndex);

    if (paginatedItems.length === 0) {
        let message = "Your basket is empty or no items match the current filters.";
         itemsGrid.innerHTML = `<p class="text-center text-xs text-gray-500" style="grid-column: 1 / -1;">${message}</p>`;
    } else {
        paginatedItems.forEach(item => {
            const card = item.cardData;
            if (!card) return;

            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'text-center basket-item-wrapper';

            const cardElement = document.createElement('div');
            const rarityKey = (card.rarityKey || card.rarity || 'unknown_rarity').toLowerCase().replace(/\s+/g, '_');
            cardElement.className = `card ${rarityKey}`;
             if (item.isLocked) {
                cardElement.classList.add('locked-item-visual');
            }

            const imgElement = document.createElement('img');
            let cardImageSrc = getCardImagePath(card.set, card.id, card);
            if (card.type === 'summon_ticket' && card.rarityKey && typeof getSummonTicketImagePath === 'function') {
                 cardImageSrc = getSummonTicketImagePath(card.rarityKey);
            }
            imgElement.src = cardImageSrc;
            imgElement.alt = card.name || 'Unknown Item';
            imgElement.className = 'basket-grid-card-image';
            imgElement.onerror = function() { this.src = 'gui/images/card_back_tree.png'; this.onerror = null; };

            cardElement.appendChild(imgElement);

            const cardDetailsDiv = document.createElement('div');
            cardDetailsDiv.className = 'basket-card-details';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'basket-card-name';
            nameDiv.textContent = card.name || 'Unknown Item';
            cardDetailsDiv.appendChild(nameDiv);

            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'basket-card-quantity';
            quantityDiv.textContent = `x ${item.quantity}`;
            cardDetailsDiv.appendChild(quantityDiv);

            cardWrapper.dataset.instanceId = item.instanceId;
            cardWrapper.addEventListener('click', () => {
                // Prefer calling the new basket UI's detail modal if it exists
                if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.showCardDetailForBasketItem === 'function') {
                    fishingBasketUi.showCardDetailForBasketItem(item);
                } else if (typeof showCardDetail === 'function' && item.cardData) {
                     showCardDetail(item.cardData.set, item.cardData.id, item.cardData.rarity, 'fishingbasket', item.instanceId, null, { currentQuantity: item.quantity, isLocked: item.isLocked, basePrice: item.cardData.price, cardData: item.cardData});
                }
            });

            cardWrapper.appendChild(cardElement);
            cardWrapper.appendChild(cardDetailsDiv);
            itemsGrid.appendChild(cardWrapper);
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

/* // handleFishingShopExchangeAll function removed */

// Global function to open the (now repurposed) fishing basket modal.
function openNewFishingBasketModal() {
    toggleFishingShopModal(true); // true to show
}
