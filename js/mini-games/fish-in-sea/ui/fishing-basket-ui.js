// js/mini-games/fish-in-sea/ui/fishing-basket-ui.js

window.fishingBasketUi = {
    modalElement: null,
    basketIconElement: null,
    cardsContainerElement: null,
    closeButtonElement: null,
    sellAllButtonElement: null,
    collectAllButtonElement: null,

    // Filter elements
    typeFilterElement: null, // Changed from custom select parts
    newRarityFilterElement: null,
    sortFilterElement: null,

    currentFilters: { type: 'all_caught', rarity: 'all', sort: 'default' }, // Default filters

    /**
     * Initializes basket UI elements and event listeners.
     */
    initializeBasketUI: function() {
        this.modalElement = document.getElementById('fishing-basket-modal');
        this.basketIconElement = document.getElementById('fishing-tool-basket');
        this.cardsContainerElement = document.getElementById('basket-cards-container');
        this.closeButtonElement = document.getElementById('close-fishing-basket-modal');

        // Standard select for type filter
        this.typeFilterElement = document.getElementById('fishing-basket-type-filter');
        this.newRarityFilterElement = document.getElementById('fishing-basket-rarity-filter-new');
        this.sortFilterElement = document.getElementById('fishing-basket-sort-filter');

        this.sellAllButtonElement = document.getElementById('fishing-basket-sell-all');
        this.collectAllButtonElement = document.getElementById('fishing-basket-collect-all');

        const elementsToCheck = {
            modalElement: 'fishing-basket-modal',
            basketIconElement: 'fishing-tool-basket',
            cardsContainerElement: 'basket-cards-container',
            closeButtonElement: 'close-fishing-basket-modal',
            typeFilterElement: 'fishing-basket-type-filter', // Updated
            newRarityFilterElement: 'fishing-basket-rarity-filter-new',
            sortFilterElement: 'fishing-basket-sort-filter',
            sellAllButtonElement: 'fishing-basket-sell-all',
            collectAllButtonElement: 'fishing-basket-collect-all'
        };

        let missingElementIds = [];
        for (const key in elementsToCheck) {
            if (this[key] === null) {
                missingElementIds.push(elementsToCheck[key]);
            }
        }

        if (missingElementIds.length > 0) {
            console.error("Fishing Basket UI Initialization Error: The following crucial DOM elements could not be found: " + missingElementIds.join(', ') + ". Please ensure index.html is up to date and these elements exist.");
            if (this.basketIconElement) {
                 this.basketIconElement.style.opacity = '0.5';
                 this.basketIconElement.title = 'Fishing basket is currently unavailable due to an error.';
                 this.basketIconElement.onclick = () => {
                    if(typeof showCustomModal === 'function') showCustomModal("Fishing basket is currently unavailable due to a setup error. Please check console (F12) for details.", "error");
                    console.error("Fishing basket icon clicked, but UI is not properly initialized due to missing elements: " + missingElementIds.join(', '));
                 };
            }
            return;
        }

        this.basketIconElement.addEventListener('click', () => this.openBasketModal());
        this.closeButtonElement.addEventListener('click', () => this.closeBasketModal());
        this.modalElement.addEventListener('click', (event) => {
            if (event.target === this.modalElement) {
                this.closeBasketModal();
            }
        });

        // Event listeners for new filters
        this.typeFilterElement.addEventListener('change', () => this.updateBasketFilters()); // Added
        this.newRarityFilterElement.addEventListener('change', () => this.updateBasketFilters());
        this.sortFilterElement.addEventListener('change', () => this.updateBasketFilters());

        this.sellAllButtonElement.addEventListener('click', () => {
            if (typeof fishingBasket !== 'undefined' && typeof fishingBasket.sellAllUnlockedCards === 'function') {
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

        this.populateRarityFilter();
        this.populateTypeFilter();
    },

    populateRarityFilter: function() {
        if (!this.newRarityFilterElement) return;

        this.newRarityFilterElement.innerHTML = '';

        const allRaritiesOption = document.createElement('option');
        allRaritiesOption.value = 'all';
        allRaritiesOption.textContent = 'All Rarities';
        allRaritiesOption.selected = true;
        this.newRarityFilterElement.appendChild(allRaritiesOption);

        if (typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined' && Array.isArray(RARITY_PACK_PULL_DISTRIBUTION)) {
            RARITY_PACK_PULL_DISTRIBUTION.forEach(rarityTier => {
                const option = document.createElement('option');
                option.value = rarityTier.key;
                option.textContent = rarityTier.name;
                this.newRarityFilterElement.appendChild(option);
            });
        } else {
            console.warn("RARITY_PACK_PULL_DISTRIBUTION is not defined or not an array. Rarity filter will be incomplete.");
        }
    },

    /**
     * Populates the type filter (standard select).
     */
    populateTypeFilter: function() {
        if (!this.typeFilterElement) { // Check the new element
            console.error("Type filter element (fishing-basket-type-filter) not found for population.");
            return;
        }

        this.typeFilterElement.innerHTML = ''; // Clear existing options

        const itemTypes = [
            { value: 'all_caught', text: 'All Types' },
            { value: 'fish_card', text: 'Fish' },
            { value: 'mineral_card', text: 'Minerals' },
            { value: 'treasure_card', text: 'Treasures' },
            { value: 'fruit_card', text: 'Fruit' },
            { value: 'bird_reward_card', text: 'Bird Rewards'},
            { value: 'summon_ticket', text: 'Summon Tickets'}
        ];

        itemTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.text;
            if (type.value === 'all_caught') {
                option.selected = true;
            }
            this.typeFilterElement.appendChild(option);
        });
    },

    openBasketModal: function() {
        if (!this.modalElement) return;
        this.modalElement.style.display = 'flex';
        this.updateBasketFilters();
        if(typeof playSound === 'function') playSound('sfx_modal_open.mp3');
    },

    closeBasketModal: function() {
        if (!this.modalElement) return;
        this.modalElement.style.display = 'none';
        if(typeof playSound === 'function') playSound('sfx_modal_close.mp3');
    },

    renderBasket: function(basketItems) {
        if (!this.cardsContainerElement) return;
        this.cardsContainerElement.innerHTML = '';

        if (!basketItems || basketItems.length === 0) {
            this.cardsContainerElement.innerHTML = '<p class="basket-empty-message">Your basket is empty or no items match your filters.</p>';
            return;
        }

        basketItems.forEach(item => {
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

            cardWrapper.appendChild(cardElement);
            cardWrapper.appendChild(cardDetailsDiv);

            cardWrapper.dataset.instanceId = item.instanceId;
            cardWrapper.addEventListener('click', () => this.showCardDetailForBasketItem(item));
            this.cardsContainerElement.appendChild(cardWrapper);
        });
    },

    showCardDetailForBasketItem: function(basketItem) {
        if (typeof showCardDetail !== 'function') {
            console.error("Global showCardDetail function not found.");
            return;
        }

        const basketActions = [
            {
                label: "Sell Item",
                callback: () => {
                    if (typeof fishingBasket !== 'undefined') fishingBasket.sellCardFromBasket(basketItem.instanceId, basketItem.quantity);
                    this.closeCardDetailModalIfOpen();
                    this.updateBasketFilters();
                },
                disabled: basketItem.isLocked
            },
            {
                label: "Add to Collection",
                callback: () => {
                    if (typeof fishingBasket !== 'undefined') fishingBasket.collectCardToMainCollection(basketItem.instanceId, basketItem.quantity);
                    this.closeCardDetailModalIfOpen();
                    this.updateBasketFilters();
                }
            }
        ];

        showCardDetail(
            basketItem.cardData.set,
            basketItem.cardData.id,
            basketItem.cardData.rarity,
            'fishingbasket',
            basketItem.instanceId,
            null,
            {
                actions: basketActions,
                currentQuantity: basketItem.quantity,
                isLocked: basketItem.isLocked,
                basePrice: basketItem.cardData.price,
                cardData: basketItem.cardData
            }
        );
    },

    closeCardDetailModalIfOpen: function() {
        if (typeof closeDetail === 'function') {
             closeDetail('fishingbasket');
        } else {
            const detailModal = document.getElementById('card-detail-fishingbasket-modal');
            if(detailModal) detailModal.style.display = 'none';
        }
    },

    updateBasketFilters: function() {
        // Read values from all filter elements
        this.currentFilters.type = this.typeFilterElement.value || 'all_caught'; // Changed
        this.currentFilters.rarity = this.newRarityFilterElement.value || 'all';
        this.currentFilters.sort = this.sortFilterElement.value || 'default';

        if (typeof fishingBasket !== 'undefined') {
            const itemsToDisplay = fishingBasket.getBasketContentsForDisplay(this.currentFilters);
            this.renderBasket(itemsToDisplay);
        }
    },

    updateBasketCountDisplay: function(count) {
        if (!this.basketIconElement) return;
        let countDisplay = this.basketIconElement.querySelector('.basket-count-badge');
        if (!countDisplay) {
            countDisplay = document.createElement('span');
            countDisplay.classList.add('basket-count-badge');
            this.basketIconElement.appendChild(countDisplay);
        }

        countDisplay.textContent = count > 0 ? count : '';
        if (count > 0) {
            this.basketIconElement.classList.add('has-items');
        } else {
             this.basketIconElement.classList.remove('has-items');
        }
    }
};

window.fishingBasketUi = fishingBasketUi;
