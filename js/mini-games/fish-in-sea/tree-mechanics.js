// Initial state for the tree
let treeSlots = [null, null, null, null, null, null, null, null]; // 8 slots, null if empty
let treeMoisture = 100; // Percentage, affects growth speed
const MAX_MOISTURE = 100;
let constantMoistureActive = false;
const MATURATION_TIME = 10000; // 10 seconds to mature at 100% moisture
const SPAWN_TIME = 5000; // 5 seconds to spawn a new unmatured card

// Timers for each slot
let slotTimers = [0, 0, 0, 0, 0, 0, 0, 0];
let maturationProgress = [0, 0, 0, 0, 0, 0, 0, 0];


/**
 * Initializes the tree state.
 * Called when the fishing game starts.
 */
function initializeTree() {
    treeSlots = [null, null, null, null, null, null, null, null];
    treeMoisture = 100; // Default moisture
    constantMoistureActive = false; // Reset on new game init
    slotTimers = [0, 0, 0, 0, 0, 0, 0, 0];
    maturationProgress = [0, 0, 0, 0, 0, 0, 0, 0];

    if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.renderTreeSlots === 'function') {
        fishingTreeUi.renderTreeSlots(getTreeSlotsData());
    }
    if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.updateMoistureDisplay === 'function') {
        fishingTreeUi.updateMoistureDisplay(treeMoisture);
    }
    console.log("Tree initialized");
}

/**
 * Activates or deactivates the constant moisture supply.
 * @param {boolean} isActive True to activate, false to deactivate.
 */
function setConstantMoistureSupply(isActive) {
    constantMoistureActive = isActive;
    if (isActive) {
        treeMoisture = MAX_MOISTURE;
        if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.updateMoistureDisplay === 'function') {
            fishingTreeUi.updateMoistureDisplay(treeMoisture);
        }
        console.log("Constant moisture supply ACTIVE. Tree moisture set to max.");
    } else {
        console.log("Constant moisture supply DEACTIVATED.");
    }
}

/**
 * Updates the growth of fruit on the tree.
 * Called in the main game loop.
 * @param {number} deltaTime Time since the last update in milliseconds.
 */
function updateTreeFruitGrowth(deltaTime) {
    if (constantMoistureActive) {
        treeMoisture = MAX_MOISTURE;
        // No need to call fishingTreeUi.updateMoistureDisplay here as it's called if moisture changes.
        // Call it if you want to ensure it's updated every frame regardless of change.
    }

    let slotsChanged = false;
    for (let i = 0; i < treeSlots.length; i++) {
        if (treeSlots[i] === null) { // Slot is empty
            slotTimers[i] += deltaTime;
            if (slotTimers[i] >= SPAWN_TIME) {
                // Generate a real card
                let newCardData = null;
                if (typeof getActiveSetDefinitions === 'function' && typeof getFixedGradeAndPrice === 'function' && typeof getCardImagePath === 'function') {
                    const activeSets = getActiveSetDefinitions();
                    if (activeSets.length > 0) {
                        const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
                        if (randomSetDef.count > 0) {
                            const cardIdNum = Math.floor(Math.random() * randomSetDef.count) + 1;
                            const fixedProps = getFixedGradeAndPrice(randomSetDef.abbr, cardIdNum);
                            newCardData = {
                                set: randomSetDef.abbr,
                                id: cardIdNum, // cardId is the number
                                name: `${randomSetDef.name} Card #${cardIdNum}`, // Placeholder name
                                rarity: fixedProps.rarityKey,
                                price: fixedProps.price,
                                imagePath: getCardImagePath(randomSetDef.abbr, cardIdNum), // Actual image path
                                type: 'collectible_card' // Distinguish from generic fruit type if needed
                            };
                        }
                    }
                }

                if (newCardData) {
                    treeSlots[i] = {
                        state: "unmatured",
                        card: newCardData, // Store the actual card data
                        maturation: 0
                    };
                    console.log(`Slot ${i}: New collectible card [${newCardData.set}-${newCardData.id}] spawning.`);
                } else {
                    // Fallback to a generic placeholder if card generation fails
                    treeSlots[i] = { state: "unmatured", card: { type: "generic_fruit", name: "Generic Fruit", imagePath: "gui/fishing_game/fruit_placeholder.png", rarity:"common", price:5, set:"fish_in_sea_fruit", id:"generic_fruit" }, maturation: 0 };
                    console.log(`Slot ${i}: New GENERIC fruit spawning due to error.`);
                }

                maturationProgress[i] = 0; // Reset progress for new card
                slotTimers[i] = 0;
                slotsChanged = true;
            }
        } else if (treeSlots[i].state === "unmatured") {
            // Ensure card object exists, if not (e.g. loading old save), convert it
            if (!treeSlots[i].card) {
                treeSlots[i].card = { type: treeSlots[i].type || "generic_fruit", name: "Generic Fruit", imagePath: "gui/fishing_game/fruit_placeholder.png", rarity:"common", price:5, set:"fish_in_sea_fruit", id:"generic_fruit" };
            }

            const moistureFactor = treeMoisture / MAX_MOISTURE;
            // maturationProgress stores percentage, treeSlots[i].maturation also stores percentage
            let currentProgress = treeSlots[i].maturation || 0;
            currentProgress += (deltaTime / MATURATION_TIME) * 100 * moistureFactor;
            currentProgress = Math.min(currentProgress, 100); // Cap at 100%
            treeSlots[i].maturation = currentProgress;
            maturationProgress[i] = currentProgress; // Keep the separate array in sync for now

            if (currentProgress >= 100) {
                treeSlots[i].state = "revealed";
                slotsChanged = true;
                console.log(`Slot ${i}: Card matured and revealed!`);
            }
        }
    }

    if (slotsChanged && typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.renderTreeSlots === 'function') {
        fishingTreeUi.renderTreeSlots(getTreeSlotsData());
    }

    // Moisture display is updated by updateTreeMoisture when it's called,
    // or if constant moisture is active, it's set once.
    // If moisture can decrease naturally, this is where you'd handle that and then update display.
}

/**
 * Helper function to get a combined view of tree slots with their progress.
 * This is what fishingTreeUi.renderTreeSlots will use.
 */
function getTreeSlotsData() {
    return treeSlots.map((slot, index) => {
        if (slot) {
            return {
                ...slot,
                maturation: maturationProgress[index] // Ensure this is the most up-to-date
            };
        }
        return null;
    });
}

/**
 * Allows the player to collect a revealed card from the tree.
 * @param {number} slotIndex The index of the tree slot.
 */
function collectCardFromTree(slotIndex) {
    if (slotIndex < 0 || slotIndex >= treeSlots.length) {
        console.error(`Invalid slot index: ${slotIndex}`);
        return null;
    }

    const slot = treeSlots[slotIndex]; // Renamed for clarity from 'card' to 'slot'
    if (slot && slot.state === "revealed" && slot.card) {
        const collectedCardDetails = slot.card; // This is the object with set, id, rarity, price, type

        // Reverting: All items from tree go directly to basket and use local display
        const cardDataForBasket = {
            // Use properties from collectedCardDetails, ensure they match basket expectations
            id: collectedCardDetails.id || collectedCardDetails.type || `fruit_slot_${slotIndex}`,
            set: collectedCardDetails.set || (collectedCardDetails.type === 'collectible_card' ? 'unknown_set' : 'fish_in_sea_fruit'),
            name: collectedCardDetails.name || `${collectedCardDetails.type ? (collectedCardDetails.type.charAt(0).toUpperCase() + collectedCardDetails.type.slice(1)) : 'Mystic'} Item`,
            rarity: collectedCardDetails.rarityKey || collectedCardDetails.rarity || 'common', // Ensure basket gets 'rarity' or 'rarityKey'
            rarityKey: collectedCardDetails.rarityKey || collectedCardDetails.rarity || 'common',
            price: collectedCardDetails.price || (collectedCardDetails.type === 'collectible_card' ? 0 : 15),
            grade: collectedCardDetails.grade || (collectedCardDetails.type === 'collectible_card' ? 'S' : null),
            imagePath: collectedCardDetails.imagePath || getCardImagePath(collectedCardDetails.set, collectedCardDetails.id) || `gui/fishing_game/${collectedCardDetails.type || 'fruit_placeholder'}.png`,
            source: 'tree',
            type: collectedCardDetails.type || (collectedCardDetails.set ? 'card' : 'fruit_card') // Provide a type for basket filtering
        };

        console.log(`Collecting item from slot ${slotIndex} directly to basket:`, cardDataForBasket);

        if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
            window.fishingBasket.addCardToBasket(cardDataForBasket, 1);

            // Show temporary display
            // Ensure cardDataForDisplay has the right properties for showCaughtItemDisplay or showCatchPreview
            const displayData = {
                type: cardDataForBasket.type === 'collectible_card' ? 'card' : cardDataForBasket.type, // for showCatchPreview
                details: cardDataForBasket, // for showCatchPreview (if it expects details sub-object)
                // for showCaughtItemDisplay (direct properties)
                set: cardDataForBasket.set,
                id: cardDataForBasket.id, // or cardId if showCaughtItemDisplay expects that
                cardId: cardDataForBasket.id,
                name: cardDataForBasket.name,
                rarityKey: cardDataForBasket.rarityKey,
                grade: cardDataForBasket.grade,
                imagePath: cardDataForBasket.imagePath
            };

            if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.showCaughtItemDisplay === 'function') {
                 window.fishingUi.showCaughtItemDisplay(displayData);
            } else if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.showCatchPreview === 'function') {
                // showCatchPreview expects { type: 'card'/'ticket', details: {set, cardId, rarityKey, grade, name} }
                // or { type: 'material', details: {name, imagePath} }
                // Adapt displayData if necessary or ensure cardDataForBasket is suitable
                const previewItem = {
                    type: displayData.type === 'fruit_card' || displayData.type === 'collectible_card' ? 'card' : displayData.type, // map to 'card' if it's a card-like fruit
                    details: {
                        set: displayData.set,
                        cardId: displayData.cardId,
                        rarityKey: displayData.rarityKey,
                        grade: displayData.grade,
                        name: displayData.name,
                        imagePath: displayData.imagePath // if showCatchPreview uses this for non-cards
                    }
                };
                window.fishingUi.showCatchPreview(previewItem);
            } else if (typeof showTemporaryCollectedItem === 'function') {
                showTemporaryCollectedItem(displayData); // Fallback
            }

        } else {
            console.warn("fishingBasket.addCardToBasket function not found. Card not added to basket.");
        }
        /* Removed pack opening logic for tree items
        if (collectedCardDetails.type === 'collectible_card' && collectedCardDetails.set && collectedCardDetails.id) {
            const isNew = !collection[collectedCardDetails.set]?.[collectedCardDetails.id] || collection[collectedCardDetails.set][collectedCardDetails.id].count === 0;
            const formattedCardObject = {
                set: collectedCardDetails.set,
                cardId: collectedCardDetails.id,
                rarityKey: collectedCardDetails.rarity, // Assuming 'rarity' in tree card is 'rarityKey'
                grade: collectedCardDetails.grade || getFixedGradeAndPrice(collectedCardDetails.set, collectedCardDetails.id)?.grade || 'S', // Get grade or default
                price: collectedCardDetails.price || getFixedGradeAndPrice(collectedCardDetails.set, collectedCardDetails.id)?.price || 0, // Get price or default
                revealed: false,
                isNew: isNew,
                packIndex: 0
            };

            // Access global variables directly
            fishingRewardPackSource = [formattedCardObject];
            isOpeningFishingReward = true;

            if (typeof showScreen === 'function') {
                showScreen(SCREENS.PACK_SELECTION);
            } else {
                console.error("showScreen function is undefined! Cannot transition to pack opening for tree reward.");
                // Fallback: Add directly to basket if pack opening fails
                if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
                     // Need to adapt 'formattedCardObject' or 'collectedCardDetails' to basket format
                    const cardDataForBasketFallback = {
                        id: formattedCardObject.cardId,
                        set: formattedCardObject.set,
                        name: collectedCardDetails.name || `${formattedCardObject.set} C${formattedCardObject.cardId}`,
                        rarity: formattedCardObject.rarityKey,
                        price: formattedCardObject.price,
                        grade: formattedCardObject.grade,
                        imagePath: getCardImagePath(formattedCardObject.set, formattedCardObject.cardId),
                        type: 'card',
                        source: 'tree_fallback'
                    };
                    window.fishingBasket.addCardToBasket(cardDataForBasketFallback, 1);
                }
            }
        } else {
            // It's a generic fruit or other non-collectible card, add directly to basket
            const cardDataForBasket = {
                id: collectedCardDetails.id || collectedCardDetails.type || `fruit_slot_${slotIndex}`,
                set: collectedCardDetails.set || 'fish_in_sea_fruit',
                name: collectedCardDetails.name || `${collectedCardDetails.type ? (collectedCardDetails.type.charAt(0).toUpperCase() + collectedCardDetails.type.slice(1)) : 'Mystic'} Fruit`,
                rarity: collectedCardDetails.rarity || 'common',
                price: collectedCardDetails.price || 15,
                imagePath: collectedCardDetails.imagePath || `gui/fishing_game/${collectedCardDetails.type || 'fruit_placeholder'}.png`,
                source: 'tree_direct',
                type: collectedCardDetails.type || 'fruit_card' // ensure a type for basket
            };
            console.log(`Collecting generic item from slot ${slotIndex} directly to basket:`, cardDataForBasket);
            if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
                window.fishingBasket.addCardToBasket(cardDataForBasket, 1);
            } else {
                console.warn("fishingBasket.addCardToBasket function not found. Card not added to basket.");
            }
        }

        // Clear the slot regardless of how it was processed
        treeSlots[slotIndex] = null;
        maturationProgress[slotIndex] = 0; // Reset progress
        slotTimers[slotIndex] = 0;         // Reset spawn timer

        if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.renderTreeSlots === 'function') {
            fishingTreeUi.renderTreeSlots(getTreeSlotsData());
        }
        // Use collectedCardDetails for the name, as cardData might not be defined in all paths if generic fruit was collected directly.
        console.log(`Slot ${slotIndex} cleared after collecting ${collectedCardDetails.name || 'item'}.`);
        // Return the collected card details
        return { ...collectedCardDetails };
    } else {
        // Use 'slot' here to check its state
        console.log(`No revealed card to collect in slot ${slotIndex}. Current state: ${slot ? slot.state : 'empty'}`);
        return null;
    }
}

/**
 * Updates the tree's moisture level.
 * @param {number} newMoisture The new moisture level (0-100).
 */
function updateTreeMoisture(newMoisture) {
    const oldMoisture = treeMoisture;
    if (!constantMoistureActive) { // Only allow manual changes if constant supply isn't active
        treeMoisture = Math.max(0, Math.min(newMoisture, MAX_MOISTURE));
    } else {
        treeMoisture = MAX_MOISTURE; // Constant supply keeps it at max
    }

    if (treeMoisture !== oldMoisture || constantMoistureActive) { // Update display if value changed or forced by constant supply
        if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.updateMoistureDisplay === 'function') {
            fishingTreeUi.updateMoistureDisplay(treeMoisture);
        }
    }
    console.log(`Tree moisture updated to: ${treeMoisture}% (Constant moisture: ${constantMoistureActive})`);
}

/**
 * Returns the current state of the tree for saving.
 */
function getTreeDataForSave() {
    return {
        treeSlots: treeSlots.map(slot => slot ? { ...slot } : null),
        treeMoisture,
        slotTimers: [...slotTimers],
        maturationProgress: [...maturationProgress],
        constantMoistureActive, // Save this new state
    };
}

/**
 * Loads tree state from saved data.
 * @param {object} data The saved tree data.
 */
function loadTreeData(data) {
    if (!data) {
        console.error("No data provided to loadTreeData.");
        initializeTree(); // Initialize to default if no data
        return;
    }

    treeSlots = data.treeSlots ? data.treeSlots.map(slot => slot ? { ...slot } : null) : Array(8).fill(null);
    treeMoisture = data.treeMoisture !== undefined ? data.treeMoisture : 100;
    slotTimers = data.slotTimers || Array(8).fill(0);
    maturationProgress = data.maturationProgress || Array(8).fill(0);
    constantMoistureActive = data.constantMoistureActive || false;

    if (constantMoistureActive) {
        treeMoisture = MAX_MOISTURE; // Ensure moisture is max if upgrade was active
    }

    // Update visuals after loading data
    if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.renderTreeSlots === 'function') {
        fishingTreeUi.renderTreeSlots(getTreeSlotsData());
    }
    if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.updateMoistureDisplay === 'function') {
        fishingTreeUi.updateMoistureDisplay(treeMoisture);
    }
    console.log("Tree data loaded:", getTreeDataForSave());
}

// Export functions if using modules, otherwise they are global.
// For this project structure, they are likely global.
window.initializeTree = initializeTree;
// window.setConstantMoistureSupply = setConstantMoistureSupply;
// window.updateTreeFruitGrowth = updateTreeFruitGrowth;
// window.getTreeSlotsData = getTreeSlotsData;
// window.collectCardFromTree = collectCardFromTree;
// window.updateTreeMoisture = updateTreeMoisture;
// window.getTreeDataForSave = getTreeDataForSave;
// window.loadTreeData = loadTreeData;

console.log("tree-mechanics.js loaded with UI integration points.");
