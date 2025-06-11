
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
        basket: [], // Items here should now include a 'locked' property
        gameLoopIntervalId: null,
        isReeling: false,
        bobberPosition: { x: 0, y: 0 },
        rodLineElement: null,
        ui: {},

        treeMoistureLevel: FISHING_CONFIG.TREE_CONFIG.MAX_MOISTURE_LEVEL / 2,
        fruitSlots: Array(FISHING_CONFIG.TREE_CONFIG.FRUIT_SLOTS).fill(null).map(() => ({
            item: null,
            targetRarityKey: null, 
            growthProgress: 0,
            isMature: false,
            ripeningTime: 0
        })),
        lastTreeUpdateTime: Date.now(),

        rocks: [],
        nextRockSpawnTime: Date.now() + Math.random() * 5000 + 5000,

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
        basket: fishingGameState.basket.map(item => ({ ...item, locked: item.locked || false })), // Ensure 'locked' is saved
        treeMoistureLevel: fishingGameState.treeMoistureLevel,
        fruitSlots: fishingGameState.fruitSlots.map(slot => ({
            item: slot.item,
            targetRarityKey: slot.targetRarityKey,
            growthProgress: slot.growthProgress,
            isMature: slot.isMature,
            ripeningTime: slot.ripeningTime
        })),
        rocks: fishingGameState.rocks.map(rock => ({
            instanceId: rock.instanceId,
            rockTypeId: rock.rockTypeId,
            currentClicks: rock.currentClicks,
            lastMinedTime: rock.lastMinedTime,
            isReadyToMine: rock.isReadyToMine,
            position: rock.position
        })),
        nextRockSpawnTime: fishingGameState.nextRockSpawnTime,
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
    fishingGameState.basket = Array.isArray(savedState.basket) ? savedState.basket.map(item => ({ ...item, locked: item.locked || false })) : [];
    fishingGameState.treeMoistureLevel = typeof savedState.treeMoistureLevel === 'number' ? savedState.treeMoistureLevel : (FISHING_CONFIG.TREE_CONFIG.MAX_MOISTURE_LEVEL / 2);


    if (Array.isArray(savedState.fruitSlots) && savedState.fruitSlots.length <= FISHING_CONFIG.TREE_CONFIG.FRUIT_SLOTS) {
        fishingGameState.fruitSlots = Array(FISHING_CONFIG.TREE_CONFIG.FRUIT_SLOTS).fill(null).map((_, index) => {
            const savedSlot = savedState.fruitSlots[index];
            return savedSlot ? {
                item: savedSlot.item || null,
                targetRarityKey: savedSlot.targetRarityKey || null,
                growthProgress: savedSlot.growthProgress || 0,
                isMature: savedSlot.isMature || false,
                ripeningTime: savedSlot.ripeningTime || 0
            } : { item: null, targetRarityKey: null, growthProgress: 0, isMature: false, ripeningTime: 0 };
        });
    } else {
        fishingGameState.fruitSlots = Array(FISHING_CONFIG.TREE_CONFIG.FRUIT_SLOTS).fill(null).map(() => ({ item: null, targetRarityKey: null, growthProgress: 0, isMature: false, ripeningTime: 0 }));
    }


    fishingGameState.rocks = [];
    if (Array.isArray(savedState.rocks)) {
        savedState.rocks.forEach(sr => {
            const rockDef = FISHING_CONFIG.ROCK_DEFINITIONS.find(def => def.id === sr.rockTypeId);
            if (rockDef) {
                fishingGameState.rocks.push({
                    instanceId: sr.instanceId,
                    rockTypeId: sr.rockTypeId,
                    definition: rockDef,
                    currentClicks: sr.currentClicks || 0,
                    lastMinedTime: sr.lastMinedTime || 0,
                    isReadyToMine: sr.isReadyToMine === undefined ? true : sr.isReadyToMine,
                    isBeingMined: false,
                    miningProgress: 0,
                    position: sr.position || { x: Math.random() * 70 + 15, y: Math.random() * 30 + 5 }
                });
            }
        });
    }
    fishingGameState.nextRockSpawnTime = savedState.nextRockSpawnTime || (Date.now() + Math.random() * 5000 + 5000);
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
    fishingGameState.lastTreeUpdateTime = Date.now();
}

// Initialize on load
initializeFishingGameState();
