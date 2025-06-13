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

    const card = treeSlots[slotIndex];
    if (card && card.state === "revealed") {
        // Define cardData for the basket
        // The 'type' field in 'card' can determine the specific fruit.
        // For now, a generic fruit card.
        const cardData = {
            id: card.type || `fruit_slot_${slotIndex}`, // Use card.type or a fallback
            set: 'fish_in_sea_fruit', // A made-up set for these items
            name: `${card.type ? (card.type.charAt(0).toUpperCase() + card.type.slice(1)) : 'Mystic'} Fruit`,
            rarity: 'common', // Placeholder, could depend on fruit type
            price: 15,        // Placeholder price
            imagePath: `gui/fishing_game/${card.type || 'fruit_placeholder'}.png`, // Placeholder image path
            source: 'tree'
        };

        console.log(`Collecting card from slot ${slotIndex}:`, cardData);

        if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
            window.fishingBasket.addCardToBasket(cardData, 1);
        } else {
            console.warn("fishingBasket.addCardToBasket function not found. Card not added to basket.");
        }

        // Clear the slot
        treeSlots[slotIndex] = null;
        maturationProgress[slotIndex] = 0; // Reset progress
        slotTimers[slotIndex] = 0;         // Reset spawn timer

        if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.renderTreeSlots === 'function') {
            fishingTreeUi.renderTreeSlots(getTreeSlotsData());
        }
        console.log(`Slot ${slotIndex} cleared after collecting ${cardData.name}.`);
        // Return the collected card data (original card object from slot, not necessarily cardData for basket)
        return { ...card }; // Return a copy of what was in the slot
    } else {
        console.log(`No revealed card to collect in slot ${slotIndex}. Current state:`, card ? card.state : 'empty');
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
