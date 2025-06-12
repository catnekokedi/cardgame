// js/mini-games/fish-in-sea/fishing-basket.js

const fishingBasket = {
    basketContents: [], // Array of { cardData, quantity, isLocked, instanceId }
    // cardData: { set (e.g., 'fish_in_sea_fish', 'fish_in_sea_mineral'), id (unique within set), rarity, price, name, imagePath }
    // instanceId is unique for each item stack in the basket for locking/selling specific stacks if needed, or can be cardData.id if we stack strictly by card type.

    /**
     * Initializes the basket, loading from save or starting empty.
     */
    initializeBasket: function() {
        // This will be called after fishingGameState is potentially loaded.
        // If fishingGameState.basketData exists, loadBasketData would have been called by fish-in-sea-state.js
        // So, this function might just ensure the basket is ready or log its state.
        if (!this.basketContents || this.basketContents.length === 0) {
            console.log("Fishing basket initialized empty or from fresh state.");
        }
        // Initial UI render if UI is ready
        if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.renderBasket === 'function') {
            fishingBasketUi.renderBasket(this.getBasketContentsForDisplay());
        }
    },

    /**
     * Adds a card to the basket. Stacks with existing identical & unlocked cards.
     * @param {object} cardData - The data of the card to add.
     * @param {number} quantity - The number of cards to add.
     */
    addCardToBasket: function(cardData, quantity = 1) {
        if (!cardData || !cardData.id || !cardData.set) {
            console.error("Invalid cardData provided to addCardToBasket:", cardData);
            return;
        }
        // For simplicity, assume cardData.id is unique enough for type identification.
        // If cards can have same ID but different grades/versions from fishing, instanceId becomes more important.
        const existingItemIndex = this.basketContents.findIndex(
            item => item.cardData.id === cardData.id &&
                    item.cardData.set === cardData.set &&
                    !item.isLocked // Only stack with unlocked items
        );

        if (existingItemIndex !== -1) {
            this.basketContents[existingItemIndex].quantity += quantity;
        } else {
            this.basketContents.push({
                cardData: { ...cardData }, // Store a copy
                quantity: quantity,
                isLocked: false,
                instanceId: `basket_${cardData.set}_${cardData.id}_${Date.now()}` // Unique ID for this stack
            });
        }
        console.log(`Added ${quantity} of ${cardData.name} to basket. Basket:`, this.basketContents);
        if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.renderBasket === 'function') {
            fishingBasketUi.renderBasket(this.getBasketContentsForDisplay());
        }
         if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateBasketCount === 'function') {
            fishingUi.updateBasketCount(this.getTotalItemCount());
        }
    },

    /**
     * Removes a specific quantity of a card from the basket.
     * Uses instanceId to target a specific stack.
     * @param {string} instanceId - The unique ID of the basket item stack.
     * @param {number} quantity - The number of cards to remove.
     */
    removeCardFromBasket: function(instanceId, quantity = 1) {
        const itemIndex = this.basketContents.findIndex(item => item.instanceId === instanceId);
        if (itemIndex === -1) {
            console.error(`Card with instanceId ${instanceId} not found in basket.`);
            return false;
        }

        if (this.basketContents[itemIndex].quantity > quantity) {
            this.basketContents[itemIndex].quantity -= quantity;
        } else {
            this.basketContents.splice(itemIndex, 1); // Remove item if quantity is met or exceeded
        }
        console.log(`Removed ${quantity} of item ${instanceId} from basket.`);
        if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.renderBasket === 'function') {
            fishingBasketUi.renderBasket(this.getBasketContentsForDisplay());
        }
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateBasketCount === 'function') {
            fishingUi.updateBasketCount(this.getTotalItemCount());
        }
        return true;
    },

    /**
     * Toggles the lock state of a card stack in the basket.
     * @param {string} instanceId - The unique ID of the basket item stack.
     */
    toggleLockCardInBasket: function(instanceId) {
        const item = this.basketContents.find(item => item.instanceId === instanceId);
        if (item) {
            item.isLocked = !item.isLocked;
            console.log(`Item ${instanceId} lock state: ${item.isLocked}`);
            if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.renderBasket === 'function') {
                fishingBasketUi.renderBasket(this.getBasketContentsForDisplay());
            }
        } else {
            console.error(`Cannot toggle lock: Item ${instanceId} not found.`);
        }
    },

    /**
     * Sells a specific quantity of a card stack from the basket.
     * @param {string} instanceId - The unique ID of the basket item stack.
     * @param {number} quantity - Number to sell. If more than available, sells all.
     */
    sellCardFromBasket: function(instanceId, quantity) {
        const itemIndex = this.basketContents.findIndex(item => item.instanceId === instanceId);
        if (itemIndex === -1) {
            console.error(`Cannot sell: Item ${instanceId} not found.`);
            return;
        }
        const itemToSell = this.basketContents[itemIndex];
        if (itemToSell.isLocked) {
            if(typeof showCustomModal === 'function') showCustomModal("Cannot sell locked items!", "error");
            console.log(`Item ${instanceId} is locked, cannot sell.`);
            return;
        }

        const sellQuantity = Math.min(quantity, itemToSell.quantity);
        const totalPrice = (itemToSell.cardData.price || 1) * sellQuantity; // Use default price if undefined

        // Placeholder for updating player balance
        if (typeof playerData !== 'undefined' && typeof playerData.toki !== 'undefined') {
            playerData.toki += totalPrice;
            if(typeof updateTokiDisplay === 'function') updateTokiDisplay();
            console.log(`Sold ${sellQuantity} of ${itemToSell.cardData.name} for ${totalPrice} Toki. Current Toki: ${playerData.toki}`);
        } else {
            console.warn("Player data or Toki not found. Cannot update balance.");
        }

        this.removeCardFromBasket(instanceId, sellQuantity); // This will re-render and update count
        if(typeof showCustomModal === 'function') showCustomModal(`Sold ${sellQuantity} ${itemToSell.cardData.name} for ${totalPrice} Toki.`, "success");
        if (typeof saveGame === 'function') saveGame();
    },

    /**
     * Moves a card from the basket to the main game collection.
     * @param {string} instanceId - The unique ID of the basket item stack.
     * @param {number} quantity - Number to collect. If more than available, collects all.
     */
    collectCardToMainCollection: function(instanceId, quantity) {
        const itemIndex = this.basketContents.findIndex(item => item.instanceId === instanceId);
        if (itemIndex === -1) {
            console.error(`Cannot collect: Item ${instanceId} not found.`);
            return;
        }
        const itemToCollect = this.basketContents[itemIndex];
        const collectQuantity = Math.min(quantity, itemToCollect.quantity);

        // Call global updateCollectionSingleCard or similar
        if (typeof updateCollectionSingleCard === 'function') {
            for (let i = 0; i < collectQuantity; i++) {
                // Assuming updateCollectionSingleCard takes set, cardId, and optionally other details like grade.
                // The cardData from fishing might not have all details like 'grade'.
                // For now, pass essential info. Grade might default in main collection.
                updateCollectionSingleCard(itemToCollect.cardData.set, itemToCollect.cardData.id, itemToCollect.cardData);
            }
            console.log(`Collected ${collectQuantity} of ${itemToCollect.cardData.name} to main collection.`);
            if(typeof showCustomModal === 'function') showCustomModal(`Collected ${collectQuantity} ${itemToCollect.cardData.name}!`, "success");
        } else {
            console.warn("updateCollectionSingleCard function not found. Cannot add to main collection.");
            return; // Don't remove if not collected
        }

        this.removeCardFromBasket(instanceId, collectQuantity); // This will re-render and update count
        if (typeof saveGame === 'function') saveGame();
    },

    /**
     * Sells all unlocked cards in the basket.
     */
    sellAllUnlockedCards: function() {
        let totalSoldValue = 0;
        let itemsSoldCount = 0;
        // Iterate backwards as we might be removing items
        for (let i = this.basketContents.length - 1; i >= 0; i--) {
            const item = this.basketContents[i];
            if (!item.isLocked) {
                const itemPrice = (item.cardData.price || 1) * item.quantity;
                totalSoldValue += itemPrice;
                itemsSoldCount += item.quantity;
                this.removeCardFromBasket(item.instanceId, item.quantity); // Sell entire stack
            }
        }
        if (itemsSoldCount > 0) {
            if (typeof playerData !== 'undefined' && typeof playerData.toki !== 'undefined') {
                playerData.toki += totalSoldValue;
                 if(typeof updateTokiDisplay === 'function') updateTokiDisplay();
                console.log(`Sold all unlocked items (${itemsSoldCount}) for ${totalSoldValue} Toki. Current Toki: ${playerData.toki}`);
            }
            if(typeof showCustomModal === 'function') showCustomModal(`Sold ${itemsSoldCount} items for ${totalSoldValue} Toki!`, "success");
            if (typeof saveGame === 'function') saveGame();
        } else {
            if(typeof showCustomModal === 'function') showCustomModal("No unlocked items to sell.", "info");
        }
    },

    /**
     * Collects all unlocked cards from the basket to the main collection.
     */
    collectAllUnlockedCards: function() {
        let itemsCollectedCount = 0;
        if (typeof updateCollectionSingleCard !== 'function') {
            console.warn("updateCollectionSingleCard function not found. Cannot collect all.");
            if(typeof showCustomModal === 'function') showCustomModal("Error: Collection function not available.", "error");
            return;
        }
        for (let i = this.basketContents.length - 1; i >= 0; i--) {
            const item = this.basketContents[i];
            if (!item.isLocked) {
                for (let j = 0; j < item.quantity; j++) {
                    updateCollectionSingleCard(item.cardData.set, item.cardData.id, item.cardData);
                }
                itemsCollectedCount += item.quantity;
                this.removeCardFromBasket(item.instanceId, item.quantity); // Collect entire stack
            }
        }
        if (itemsCollectedCount > 0) {
            console.log(`Collected all unlocked items (${itemsCollectedCount}) to main collection.`);
            if(typeof showCustomModal === 'function') showCustomModal(`Collected ${itemsCollectedCount} items to your main collection!`, "success");
            if (typeof saveGame === 'function') saveGame();
        } else {
             if(typeof showCustomModal === 'function') showCustomModal("No unlocked items to collect.", "info");
        }
    },

    /**
     * Gets basket contents for UI rendering, possibly with filters applied.
     * @param {object} [filters] - Optional filters (e.g., rarity).
     * @returns {Array<object>} Filtered and sorted basket contents.
     */
    getBasketContentsForDisplay: function(filters = {}) {
        let displayData = [...this.basketContents];
        if (filters.rarity && filters.rarity !== 'all') {
            displayData = displayData.filter(item => item.cardData.rarity === filters.rarity);
        }
        // Add sorting if needed
        return displayData;
    },

    getTotalItemCount: function() {
        return this.basketContents.reduce((sum, item) => sum + item.quantity, 0);
    },


    /**
     * Gets basket data for saving.
     * @returns {Array} The basket contents.
     */
    getBasketDataForSave: function() {
        return this.basketContents;
    },

    /**
     * Loads basket data from a saved state.
     * @param {Array} data - The saved basket contents.
     */
    loadBasketData: function(data) {
        if (data && Array.isArray(data)) {
            this.basketContents = data;
            console.log("Fishing basket data loaded:", this.basketContents);
        } else {
            this.basketContents = [];
            console.log("No fishing basket data found or data invalid, starting with empty basket.");
        }
        // Initial UI render after load
        if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.renderBasket === 'function') {
            fishingBasketUi.renderBasket(this.getBasketContentsForDisplay());
        }
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateBasketCount === 'function') {
            fishingUi.updateBasketCount(this.getTotalItemCount());
        }
    }
};

// Make globally available
// window.fishingBasket = fishingBasket;
// Expose addItemToBasket globally for other mechanics modules to use directly
function addItemToBasket(cardData, quantity = 1) {
    fishingBasket.addCardToBasket(cardData, quantity);
}


console.log("fishing-basket.js loaded");
