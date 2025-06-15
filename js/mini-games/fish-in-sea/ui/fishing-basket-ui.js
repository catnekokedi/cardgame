// js/mini-games/fish-in-sea/ui/fishing-basket-ui.js

window.fishingBasketUi = {
    modalElement: null,
    basketIconElement: null,
    cardsContainerElement: null,
    closeButtonElement: null,
    // Old rarity filter: rarityFilterElement: null,
    sellAllButtonElement: null,
    collectAllButtonElement: null,

    // New filter elements
    typeFilterContainerElement: null,
    typeFilterDisplayElement: null,
    typeFilterPanelElement: null,
    typeFilterSearchElement: null,
    typeFilterOptionsElement: null,
    newRarityFilterElement: null, // Replaces old rarityFilterElement
    sortFilterElement: null,

    currentFilters: { type: 'all_caught', rarity: 'all', sort: 'default' }, // Default filters

    /**
     * Initializes basket UI elements and event listeners.
     */
    initializeBasketUI: function() {
        this.modalElement = document.getElementById('fishing-basket-modal');
        this.basketIconElement = document.getElementById('fishing-basket-icon');
        this.cardsContainerElement = document.getElementById('basket-cards-container');
        this.closeButtonElement = document.getElementById('close-fishing-basket-modal');

        // New selectors
        this.typeFilterContainerElement = document.getElementById('fishing-basket-type-filter-container');
        this.typeFilterDisplayElement = document.getElementById('fishing-basket-type-filter-display');
        this.typeFilterPanelElement = document.getElementById('fishing-basket-type-filter-panel');
        this.typeFilterSearchElement = document.getElementById('fishing-basket-type-filter-search');
        this.typeFilterOptionsElement = document.getElementById('fishing-basket-type-filter-options');
        this.newRarityFilterElement = document.getElementById('fishing-basket-rarity-filter-new');
        this.sortFilterElement = document.getElementById('fishing-basket-sort-filter');

        this.sellAllButtonElement = document.getElementById('fishing-basket-sell-all');
        this.collectAllButtonElement = document.getElementById('fishing-basket-collect-all');

        if (!this.modalElement || !this.basketIconElement || !this.cardsContainerElement || !this.closeButtonElement ||
            !this.newRarityFilterElement || !this.sortFilterElement || !this.typeFilterContainerElement ||
            !this.sellAllButtonElement || !this.collectAllButtonElement) {
            console.error("One or more fishing basket UI elements are missing from the DOM.");
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
        this.newRarityFilterElement.addEventListener('change', () => this.updateBasketFilters());
        this.sortFilterElement.addEventListener('change', () => this.updateBasketFilters());
        // Custom type filter selection change is handled by its setup in populateTypeFilter

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

    /**
     * Populates the new rarity filter dropdown.
     * Uses RARITY_PACK_PULL_DISTRIBUTION for rarity definitions.
     */
    populateRarityFilter: function() {
        if (!this.newRarityFilterElement) return;

        this.newRarityFilterElement.innerHTML = ''; // Clear existing

        const allRaritiesOption = document.createElement('option');
        allRaritiesOption.value = 'all';
        allRaritiesOption.textContent = 'All Rarities';
        allRaritiesOption.selected = true;
        this.newRarityFilterElement.appendChild(allRaritiesOption);

        if (typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined' && Array.isArray(RARITY_PACK_PULL_DISTRIBUTION)) {
            RARITY_PACK_PULL_DISTRIBUTION.forEach(rarityTier => {
                // It's possible that not all rarities in RARITY_PACK_PULL_DISTRIBUTION are relevant for fishing items.
                // For now, include all. Could be refined later if needed.
                const option = document.createElement('option');
                option.value = rarityTier.key; // e.g., 'common', 'rare'
                option.textContent = rarityTier.name; // e.g., 'Common', 'Rare'
                this.newRarityFilterElement.appendChild(option);
            });
        } else {
            console.warn("RARITY_PACK_PULL_DISTRIBUTION is not defined or not an array. Rarity filter will be incomplete.");
            // Fallback: could add a few common known rarities if absolutely necessary
            // For now, it will just have "All Rarities" if the main definition is missing.
        }
    },

    /**
     * Populates the custom type filter.
     */
    populateTypeFilter: function() {
        if (!this.typeFilterOptionsElement || !this.typeFilterDisplayElement || !this.typeFilterPanelElement || !this.typeFilterSearchElement) return;

        const itemTypes = [
            { value: 'all_caught', text: 'All Types' },
            { value: 'fish_card', text: 'Fish' },
            { value: 'mineral_card', text: 'Minerals' },
            { value: 'treasure_card', text: 'Treasures' },
            { value: 'fruit_card', text: 'Fruit' },
            { value: 'bird_reward_card', text: 'Bird Rewards'},
            { value: 'summon_ticket', text: 'Summon Tickets'}
            // Consider if 'material' or other specific card types used in fishing rewards need to be here.
            // This depends on how `cardData.type` is set for items in fishingBasket.
        ];

        if (typeof setupCustomSelect === 'function') {
            setupCustomSelect(
                this.typeFilterDisplayElement,
                this.typeFilterPanelElement,
                this.typeFilterSearchElement,
                this.typeFilterOptionsElement,
                itemTypes,
                'all_caught', // Default value
                (selectedValue) => { // onSelectCallback
                    this.currentFilters.type = selectedValue;
                    this.updateBasketFilters();
                }
            );
        } else {
            console.warn("setupCustomSelect function not found. Type filter will not be fully functional.");
            // Basic population
            this.typeFilterOptionsElement.innerHTML = '';
            itemTypes.forEach(type => {
                const li = document.createElement('li');
                li.dataset.value = type.value;
                li.textContent = type.text;
                li.addEventListener('click', () => {
                    this.typeFilterDisplayElement.textContent = type.text;
                    this.typeFilterDisplayElement.dataset.value = type.value;
                    this.currentFilters.type = type.value;
                    this.typeFilterPanelElement.style.display = 'none';
                    this.updateBasketFilters();
                });
                this.typeFilterOptionsElement.appendChild(li);
            });
            this.typeFilterDisplayElement.addEventListener('click', () => {
                this.typeFilterPanelElement.style.display = this.typeFilterPanelElement.style.display === 'none' ? 'block' : 'none';
            });
        }
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
        this.currentFilters.type = this.typeFilterDisplayElement.dataset.value || 'all_caught';
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
