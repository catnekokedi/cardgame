// js/mini-games/fish-in-sea/ui/fishing-basket-ui.js

window.fishingBasketUi = {
    modalElement: null,
    basketIconElement: null,
    cardsContainerElement: null,
    closeButtonElement: null,
    rarityFilterElement: null,
    sellAllButtonElement: null,
    collectAllButtonElement: null,
    currentFilters: { rarity: 'all' }, // Default filter

    /**
     * Initializes basket UI elements and event listeners.
     */
    initializeBasketUI: function() {
        this.modalElement = document.getElementById('fishing-basket-modal');
        this.basketIconElement = document.getElementById('fishing-basket-icon');
        this.cardsContainerElement = document.getElementById('basket-cards-container');
        this.closeButtonElement = document.getElementById('close-fishing-basket-modal');
        this.rarityFilterElement = document.getElementById('fishing-basket-rarity-filter');
        this.sellAllButtonElement = document.getElementById('fishing-basket-sell-all');
        this.collectAllButtonElement = document.getElementById('fishing-basket-collect-all');

        if (!this.modalElement || !this.basketIconElement || !this.cardsContainerElement || !this.closeButtonElement ||
            !this.rarityFilterElement || !this.sellAllButtonElement || !this.collectAllButtonElement) {
            console.error("One or more fishing basket UI elements are missing from the DOM.");
            return;
        }

        this.basketIconElement.addEventListener('click', () => this.openBasketModal());
        this.closeButtonElement.addEventListener('click', () => this.closeBasketModal());
        this.modalElement.addEventListener('click', (event) => { // Close on overlay click
            if (event.target === this.modalElement) {
                this.closeBasketModal();
            }
        });

        this.rarityFilterElement.addEventListener('change', (event) => this.updateBasketFilters(event));

        this.sellAllButtonElement.addEventListener('click', () => {
            if (typeof fishingBasket !== 'undefined' && typeof fishingBasket.sellAllUnlockedCards === 'function') {
                // Confirmation might be good here
                showConfirmationModal("Are you sure you want to sell ALL unlocked items in your basket?", () => {
                    fishingBasket.sellAllUnlockedCards();
                });
            }
        });
        this.collectAllButtonElement.addEventListener('click', () => {
            if (typeof fishingBasket !== 'undefined' && typeof fishingBasket.collectAllUnlockedCards === 'function') {
                 showConfirmationModal("Are you sure you want to collect ALL unlocked items to your main collection?", () => {
                    fishingBasket.collectAllUnlockedCards();
                });
            }
        });

        console.log("Fishing Basket UI initialized.");
        this.populateRarityFilter(); // Populate filter options
    },

    /**
     * Populates the rarity filter dropdown.
     */
    populateRarityFilter: function() {
        if (!this.rarityFilterElement) return;
        const rarities = ['all', 'common', 'uncommon', 'rare', 'legendary', 'mythic', 'foil', 'holo', 'shiny', 'material', 'ticket']; // Add more as needed
        this.rarityFilterElement.innerHTML = ''; // Clear existing
        rarities.forEach(rarity => {
            const option = document.createElement('option');
            option.value = rarity;
            option.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            this.rarityFilterElement.appendChild(option);
        });
    },

    /**
     * Opens the basket modal.
     */
    openBasketModal: function() {
        if (!this.modalElement) return;
        this.modalElement.style.display = 'flex';
        // Re-render basket on open to ensure it's up-to-date with current filters
        if (typeof fishingBasket !== 'undefined') {
            this.renderBasket(fishingBasket.getBasketContentsForDisplay(this.currentFilters));
        }
        if(typeof playSound === 'function') playSound('sfx_modal_open.mp3');
    },

    /**
     * Closes the basket modal.
     */
    closeBasketModal: function() {
        if (!this.modalElement) return;
        this.modalElement.style.display = 'none';
        if(typeof playSound === 'function') playSound('sfx_modal_close.mp3');
    },

    /**
     * Renders the basket contents in the UI.
     * @param {Array<object>} basketItems - Array of items in the basket.
     */
    renderBasket: function(basketItems) {
        if (!this.cardsContainerElement) {
            // console.warn("Basket cards container not found, cannot render basket.");
            return;
        }
        this.cardsContainerElement.innerHTML = ''; // Clear existing cards

        if (!basketItems || basketItems.length === 0) {
            this.cardsContainerElement.innerHTML = '<p class="basket-empty-message">Your basket is empty.</p>';
            return;
        }

        basketItems.forEach(item => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('basket-card-item');
            if (item.isLocked) {
                cardDiv.classList.add('locked');
            }
            // cardData: { set, id, rarity, price, name, imagePath, type, source }
            console.log("[FishingBasketUI] Rendering item.cardData:", item.cardData, "Quantity:", item.quantity, "Source:", item.cardData.source);

            let cardImageSrc = 'gui/items/placeholder_icon.png'; // Default fallback
            if (item.cardData && item.cardData.imagePath) {
                cardImageSrc = item.cardData.imagePath; // Prioritize direct imagePath if available
            } else if (item.cardData && item.cardData.set && item.cardData.id && typeof getCardImagePath === 'function') {
                // This assumes getCardImagePath is a global function that takes set and id
                cardImageSrc = getCardImagePath(item.cardData.set, item.cardData.id);
            } else if (item.cardData && item.cardData.type === 'summon_ticket' && item.cardData.rarityKey && typeof getSummonTicketImagePath === 'function') {
                // Specific fallback for summon tickets if imagePath was missing but rarityKey exists
                cardImageSrc = getSummonTicketImagePath(item.cardData.rarityKey);
            }
            console.log("[FishingBasketUI] Determined cardImageSrc:", cardImageSrc, "for item name:", item.cardData.name);

            const cardName = item.cardData.name || (item.cardData.type ? `Unknown ${item.cardData.type.replace('_', ' ')}` : 'Unknown Item');
            const cardRarity = item.cardData.rarityKey || item.cardData.rarity || '';

            cardDiv.innerHTML = `
                <img src="${cardImageSrc}" alt="${cardName}" class="basket-card-image">
                <div class="basket-card-name">${cardName}</div>
                <div class="basket-card-quantity">x ${item.quantity}</div>
                <div class="basket-card-rarity ${cardRarity}">${cardRarity}</div>
                ${item.isLocked ? '<div class="basket-card-lock-icon">🔒</div>' : ''}
            `;
            cardDiv.dataset.instanceId = item.instanceId;

            cardDiv.addEventListener('click', () => this.showCardDetailForBasketItem(item));
            this.cardsContainerElement.appendChild(cardDiv);
        });
    },

    /**
     * Shows card detail modal for a basket item.
     * @param {object} basketItem - The item from basketContents.
     */
    showCardDetailForBasketItem: function(basketItem) {
        if (typeof showCardDetail !== 'function') {
            console.error("Global showCardDetail function not found.");
            return;
        }
        // cardData: { set, id, rarity, price, name, imagePath }
        // instanceId is from the basket item wrapper { cardData, quantity, isLocked, instanceId }

        // Prepare custom actions for the card detail modal
        const basketActions = [
            {
                label: basketItem.isLocked ? "Unlock Item" : "Lock Item",
                callback: () => {
                    if (typeof fishingBasket !== 'undefined') fishingBasket.toggleLockCardInBasket(basketItem.instanceId);
                    // Re-show detail modal or close it if needed, or it might auto-update if renderBasket is called
                    this.closeCardDetailModalIfOpen(); // Helper to close the main detail modal
                    this.renderBasket(fishingBasket.getBasketContentsForDisplay(this.currentFilters)); // Re-render basket
                }
            },
            {
                label: `Sell 1 (Value: ${basketItem.cardData.price || 1} Toki)`,
                callback: () => {
                    if (typeof fishingBasket !== 'undefined') fishingBasket.sellCardFromBasket(basketItem.instanceId, 1);
                    this.closeCardDetailModalIfOpen();
                },
                disabled: basketItem.isLocked
            },
            {
                label: "Sell All",
                callback: () => {
                    if (typeof fishingBasket !== 'undefined') fishingBasket.sellCardFromBasket(basketItem.instanceId, basketItem.quantity);
                    this.closeCardDetailModalIfOpen();
                },
                disabled: basketItem.isLocked
            },
            {
                label: "Collect 1",
                callback: () => {
                    if (typeof fishingBasket !== 'undefined') fishingBasket.collectCardToMainCollection(basketItem.instanceId, 1);
                    this.closeCardDetailModalIfOpen();
                }
            },
             {
                label: "Collect All",
                callback: () => {
                    if (typeof fishingBasket !== 'undefined') fishingBasket.collectCardToMainCollection(basketItem.instanceId, basketItem.quantity);
                    this.closeCardDetailModalIfOpen();
                }
            }
        ];

        // Call global showCardDetail
        // It needs to be adapted to accept 'actions' or have a specific context for 'fishingBasket'
        showCardDetail(
            basketItem.cardData.set,
            basketItem.cardData.id,
            basketItem.cardData.rarity,
            'fishingBasket', // context
            basketItem.instanceId, // Pass instanceId for context
            null, // grade - fishing items might not have grades yet
            { actions: basketActions, currentQuantity: basketItem.quantity, isLocked: basketItem.isLocked, basePrice: basketItem.cardData.price } // Pass additional details for the modal
        );
    },

    closeCardDetailModalIfOpen: function() {
        // Assuming the global card detail modal has a known ID or a global close function
        if (typeof closeDetail === 'function') {
             closeDetail('fishingbasket'); // Assuming a context name for the detail modal
        } else {
            const detailModal = document.getElementById('card-detail-fishingbasket-modal'); // This ID is from a previous subtask, might need adjustment
            if(detailModal) detailModal.style.display = 'none';
        }
    },

    /**
     * Handles filter changes and re-renders the basket.
     */
    updateBasketFilters: function(event) {
        if (event.target === this.rarityFilterElement) {
            this.currentFilters.rarity = this.rarityFilterElement.value;
        }
        // Add other filters here if any (e.g., sort)
        if (typeof fishingBasket !== 'undefined') {
            this.renderBasket(fishingBasket.getBasketContentsForDisplay(this.currentFilters));
        }
    },

    /**
     * Updates the displayed count on the basket icon.
     * @param {number} count - The total number of items in the basket.
     */
    updateBasketCountDisplay: function(count) {
        if (!this.basketIconElement) return;
        const countDisplay = this.basketIconElement.querySelector('.basket-count-badge') || document.createElement('span');
        countDisplay.classList.add('basket-count-badge');
        countDisplay.textContent = count > 0 ? count : '';
        if (count > 0 && !countDisplay.parentNode) {
            this.basketIconElement.appendChild(countDisplay);
            this.basketIconElement.classList.add('has-items');
        } else if (count === 0) {
             if (countDisplay.parentNode) this.basketIconElement.removeChild(countDisplay);
             this.basketIconElement.classList.remove('has-items');
        }
    }
};

// Make globally available
window.fishingBasketUi = fishingBasketUi;

console.log("fishing-basket-ui.js loaded");
