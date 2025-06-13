
// js/mini-games/fishing-game/fishing-state.js

let fishingGameState = {}; // Will be populated by initializeFishingGameState

function initializeFishingGameState() {
    fishingGameState = {
        isGameActive: false,
        isRodCast: false,
        timeToNextBite: 0,
        biteWindowMs: FISHING_CONFIG.BITE_WINDOW_MS,
        biteTimeoutId: null,
        currentRodLevel: 1,
        currentBaitId: "none",
        currentBaitUsesLeft: Infinity,
        // basket: [], // Replaced by basketData below
        gameLoopIntervalId: null,
        isReeling: false,
        bobberPosition: { x: 0, y: 0 },
        rodLineElement: null,
        ui: {},

        treeData: null, // Managed by tree-mechanics.js
        wateringCanUpgradeData: null, // Managed by watering-can.js for upgrades
        rockData: null, // Managed by rock-mechanics.js
        basketData: null, // Managed by fishing-basket.js

        // Old rock properties below are removed as rockData will handle them
        // rocks: [],
        // nextRockSpawnTime: Date.now() + Math.random() * 5000 + 5000,

        wateringCan: {
            waterLevel: 0,
            isIconBeingDragged: false,    
            currentTarget: null,         
            operationStartTime: 0,       
            originalPosition: { x:0, y:0 }
        },
        pickaxeSelected: false,
        shopProgress: { // Updated structure
            fish: {},
            fruit: {},
            minerals: {}
        },
        selectedItemInBasket: null, // For single item selection in basket
        isBasketLockModeActive: false // Added for the lock checkbox
    };
    fishingGameState.currentRod = FISHING_CONFIG.ROD_TYPES.find(r => r.level === fishingGameState.currentRodLevel) || FISHING_CONFIG.ROD_TYPES[0];
    fishingGameState.currentBait = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === fishingGameState.currentBaitId) || FISHING_CONFIG.BAIT_TYPES.find(b => b.id === "none");
    if (fishingGameState.currentBait && fishingGameState.currentBait.id === "none") {
        fishingGameState.currentBaitUsesLeft = Infinity;
    }
}

function getPersistentFishingState() {
    return {
        currentRodLevel: fishingGameState.currentRodLevel,
        currentBaitId: fishingGameState.currentBaitId,
        currentBaitUsesLeft: fishingGameState.currentBaitUsesLeft,
        // basket: fishingGameState.basket.map(item => ({ ...item, locked: item.locked || false })), // Replaced by basketData
        // Tree data is now handled by tree-mechanics.js
        treeData: typeof getTreeDataForSave === 'function' ? getTreeDataForSave() : null,
        wateringCanUpgradeData: typeof getWateringCanDataForSave === 'function' ? getWateringCanDataForSave() : null,
        rockData: typeof getRockDataForSave === 'function' ? getRockDataForSave() : null,
        basketData: typeof fishingBasket !== 'undefined' && typeof fishingBasket.getBasketDataForSave === 'function' ? fishingBasket.getBasketDataForSave() : null,
        // Old rock properties below are removed
        // rocks: fishingGameState.rocks.map(rock => ({...})),
        // nextRockSpawnTime: fishingGameState.nextRockSpawnTime,
        wateringCanWaterLevel: fishingGameState.wateringCan.waterLevel,
        shopProgress: fishingGameState.shopProgress || { fish: {}, fruit: {}, minerals: {} }, // Save new structure
        selectedItemInBasket: fishingGameState.selectedItemInBasket,
        isBasketLockModeActive: fishingGameState.isBasketLockModeActive // Persist lock mode state
    };
}

function loadPersistentFishingState(savedState) {
    if (!savedState) {
        initializeFishingGameState();
        return;
    }

    fishingGameState.currentRodLevel = savedState.currentRodLevel || 1;
    fishingGameState.currentBaitId = savedState.currentBaitId || "none";
    // fishingGameState.basket = Array.isArray(savedState.basket) ? savedState.basket.map(item => ({ ...item, locked: item.locked || false })) : []; // Replaced by basketData

    // Load tree data using tree-mechanics.js
    if (savedState.treeData && typeof loadTreeData === 'function') {
        loadTreeData(savedState.treeData);
    } else if (typeof initializeTree === 'function') {
        // If no saved tree data, or loadTreeData doesn't exist, initialize the tree
        console.log("No tree data in save or loadTreeData not found, initializing tree.");
        initializeTree();
    }

    // Load watering can upgrade data using watering-can.js
    if (savedState.wateringCanUpgradeData && typeof loadWateringCanData === 'function') {
        loadWateringCanData(savedState.wateringCanUpgradeData);
    } else {
        // If no saved data, wateringCanUpgrades in watering-can.js should retain its default values.
        // initializeWateringCan() called in fish-in-sea-main.js will set up defaults if no load data.
        console.log("No watering can upgrade data in save or loadWateringCanData not found. Defaults will be used.");
    }

    // Load rock data using rock-mechanics.js
    if (savedState.rockData && typeof loadRockData === 'function') {
        loadRockData(savedState.rockData);
    } else if (typeof initializeRocks === 'function') {
        // If no saved rock data, or loadRockData doesn't exist, initialize rocks.
        console.log("No rock data in save or loadRockData not found, initializing rocks.");
        initializeRocks();
    }
    // Old rock loading logic is removed.

    // Load basket data using fishing-basket.js
    if (savedState.basketData && typeof fishingBasket !== 'undefined' && typeof fishingBasket.loadBasketData === 'function') {
        fishingBasket.loadBasketData(savedState.basketData);
    } else if (typeof fishingBasket !== 'undefined' && typeof fishingBasket.initializeBasket === 'function') {
        // If no saved basket data, initialize an empty basket via its own logic (already called in main)
        console.log("No basket data in save or loadBasketData not found. fishingBasket.initializeBasket will ensure defaults.");
    }

    fishingGameState.wateringCan.waterLevel = savedState.wateringCanWaterLevel || 0;
    
    // Initialize transient drag states
    fishingGameState.wateringCan.isIconBeingDragged = false;
    fishingGameState.wateringCan.currentTarget = null;
    fishingGameState.wateringCan.operationStartTime = 0;

    // Load shopProgress with new structure
    if (savedState.shopProgress && 
        typeof savedState.shopProgress.fish === 'object' && 
        typeof savedState.shopProgress.fruit === 'object' &&
        typeof savedState.shopProgress.minerals === 'object') {
        fishingGameState.shopProgress = savedState.shopProgress;
    } else {
        // If old format or missing, initialize to new empty structure
        fishingGameState.shopProgress = { fish: {}, fruit: {}, minerals: {} };
        if (savedState.shopProgress && typeof savedState.shopProgress.fish === 'undefined') {
            console.warn("Old fishing shopProgress format detected. Progress might not be fully migrated if it wasn't implicitly for 'fish'. Initializing to new empty structure.");
            // Optionally, attempt to migrate if all old keys were for fish:
            // fishingGameState.shopProgress.fish = { ...savedState.shopProgress }; 
        }
    }

    fishingGameState.selectedItemInBasket = savedState.selectedItemInBasket || null;
    fishingGameState.isBasketLockModeActive = savedState.isBasketLockModeActive || false; // Load lock mode state

    fishingGameState.currentRod = FISHING_CONFIG.ROD_TYPES.find(r => r.level === fishingGameState.currentRodLevel) || FISHING_CONFIG.ROD_TYPES[0];
    fishingGameState.currentBait = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === fishingGameState.currentBaitId) || FISHING_CONFIG.BAIT_TYPES.find(b => b.id === 'none');
    fishingGameState.currentBaitUsesLeft = savedState.currentBaitUsesLeft === undefined ?
        (fishingGameState.currentBait.id === "none" ? Infinity : fishingGameState.currentBait.uses)
        : savedState.currentBaitUsesLeft;

    if (fishingGameState.currentBaitId !== "none" && fishingGameState.currentBaitUsesLeft <= 0) {
        fishingGameState.currentBaitId = "none";
        fishingGameState.currentBait = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === "none");
        fishingGameState.currentBaitUsesLeft = Infinity;
    }
    // lastTreeUpdateTime is removed as tree-mechanics.js handles its own state and timing
}

// Initialize on load
initializeFishingGameState();
