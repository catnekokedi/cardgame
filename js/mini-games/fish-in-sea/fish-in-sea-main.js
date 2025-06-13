// js/mini-games/fishing-game/fishing-main.js

function startFishingGame(gameContentEl, gameResultEl) {
    // Removed lastFishingReward processing block

    if (!gameContentEl) {
        console.error("Fishing Game: gameContentEl is null.");
        return;
    }

    initializeFishingGameState(); // From fishing-state.js

    if (typeof initializeTree === 'function') initializeTree(); else console.warn("initializeTree function not found.");

    // Initialize main fishing UI (assumed to be always available, e.g., window.fishingUi)
    if (typeof fishingUi !== 'undefined' && typeof fishingUi.init === 'function') {
        fishingUi.init(gameContentEl);
    } else {
        console.error("CRITICAL: Main fishingUi.init function not found.");
        // Potentially stop further initialization if main UI can't load
    }

    if (typeof window.fishingTreeUi !== 'undefined' && typeof window.fishingTreeUi.initialize === 'function') window.fishingTreeUi.initialize(); else console.warn("fishingTreeUi.initialize function not found.");
    if (typeof initializeWateringCan === 'function') initializeWateringCan(); else console.warn("initializeWateringCan function not found.");
    if (typeof initializeRocks === 'function') initializeRocks(); else console.warn("initializeRocks function not found.");
    if (typeof window.fishingRocksUi !== 'undefined' && typeof window.fishingRocksUi.initializeRockUI === 'function') window.fishingRocksUi.initializeRockUI(); else console.warn("fishingRocksUi.initializeRockUI function not found.");

    // Core fishing mechanics (fish movement, bite logic)
    if (typeof window.fishingMechanics !== 'undefined' && typeof window.fishingMechanics.initializeFishingMechanics === 'function') window.fishingMechanics.initializeFishingMechanics(); else console.warn("fishingMechanics.initializeFishingMechanics function not found.");
    // UI for new core fishing game elements (sea container, fish rendering)
    // if (typeof window.fishingGameUi !== 'undefined' && typeof window.fishingGameUi.initializeFishingUIElements === 'function') window.fishingGameUi.initializeFishingUIElements(); else console.warn("fishingGameUi.initializeFishingUIElements function not found."); // Commented out as per task

    // Sky Mechanics and UI
    if (typeof window.skyMechanics !== 'undefined' && typeof window.skyMechanics.initializeSkyMechanics === 'function') window.skyMechanics.initializeSkyMechanics(); else console.warn("skyMechanics.initializeSkyMechanics function not found.");
    if (typeof window.skyUi !== 'undefined' && typeof window.skyUi.initializeSkyUI === 'function') window.skyUi.initializeSkyUI(); else console.warn("skyUi.initializeSkyUI function not found.");

    // Fishing Basket logic and UI
    if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.initializeBasket === 'function') window.fishingBasket.initializeBasket(); else console.warn("fishingBasket.initializeBasket function not found.");
    if (typeof window.fishingBasketUi !== 'undefined' && typeof window.fishingBasketUi.initializeBasketUI === 'function') window.fishingBasketUi.initializeBasketUI(); else console.warn("fishingBasketUi.initializeBasketUI function not found.");

    // Load persistent state AFTER all initializations
    if (typeof miniGameData === 'object' && miniGameData.fishingGame) {
        if (typeof loadPersistentFishingState === 'function') {
            loadPersistentFishingState(miniGameData.fishingGame); // From fishing-state.js
        } else {
            console.error("loadPersistentFishingState function not found.");
        }

        // After loading, UI components need refreshing based on the now-loaded state
        if (typeof window.fishingTreeUi !== 'undefined' && typeof window.fishingTreeUi.initialize === 'function') window.fishingTreeUi.initialize();
        if (typeof updateWateringCanUI === 'function') updateWateringCanUI();
        if (typeof window.fishingRocksUi !== 'undefined' && typeof window.fishingRocksUi.renderRocks === 'function' && typeof getRockSlotsData === 'function') window.fishingRocksUi.renderRocks(getRockSlotsData());
        if (typeof window.fishingRocksUi !== 'undefined' && typeof window.fishingRocksUi.updatePickaxeCursor === 'function' && typeof pickaxeSelected !== 'undefined') window.fishingRocksUi.updatePickaxeCursor(pickaxeSelected);

        if (typeof window.fishingGameUi !== 'undefined' && typeof window.fishingMechanics !== 'undefined') {
            if (typeof window.fishingGameUi.renderFish === 'function' && window.fishingMechanics.activeFish) window.fishingGameUi.renderFish(window.fishingMechanics.activeFish);
            // Calls to renderFishingRod and showBiteIndicator were moved to fishingMechanics to use fishingUi
        }
        if (typeof window.fishingBasketUi !== 'undefined' && typeof window.fishingBasket !== 'undefined') {
            if (typeof window.fishingBasketUi.renderBasket === 'function') window.fishingBasketUi.renderBasket(window.fishingBasket.getBasketContentsForDisplay(window.fishingBasketUi.currentFilters));
            if (typeof window.fishingBasketUi.updateBasketCountDisplay === 'function') window.fishingBasketUi.updateBasketCountDisplay(window.fishingBasket.getTotalItemCount());
        }
        // Ensure existing fishingUi (for bobber, line etc.) is also updated after load
        if (typeof fishingUi !== 'undefined') {
            if (fishingGameState.isRodCast || fishingGameState.hasHookedFish) {
                if (typeof fishingUi.showBobber === 'function') fishingUi.showBobber(fishingMechanics.hookPosition);
                if (typeof fishingUi.drawRodLine === 'function') fishingUi.drawRodLine(fishingMechanics.hookPosition);
                if (typeof fishingUi.showExclamationOnBobber === 'function') fishingUi.showExclamationOnBobber(fishingGameState.hasHookedFish && !fishingGameState.isReeling);
            } else {
                if (typeof fishingUi.hideBobber === 'function') fishingUi.hideBobber();
                if (typeof fishingUi.hideRodLine === 'function') fishingUi.hideRodLine();
            }
        }
    }

    fishingUi.updateRodAndBaitDisplay(); // General UI updates
    fishingUi.updateStatusText(); // General UI updates


    document.addEventListener('keydown', handleFishingKeyPress);

    if (fishingGameState.gameLoopIntervalId) clearInterval(fishingGameState.gameLoopIntervalId);
    fishingGameState.gameLoopIntervalId = setInterval(updateFishingGameLoop, 100); // Game loop interval

    if (gameResultEl) gameResultEl.innerHTML = '';
    fishingGameState.isGameActive = true; // Explicitly set game active on start
    console.log("Fishing game started. Loop active.");
}

function updateFishingGameLoop() {
    if (!fishingGameState.isGameActive || currentMiniGame !== SCREENS.FISHING_GAME) {
        // console.log("Fishing loop skipped. Active:", fishingGameState.isGameActive, "Current Game:", currentMiniGame);
        return;
    }
    // console.log("Fishing game loop running...");
    
    const deltaTimeMs = 100; // Game loop interval in milliseconds
    const deltaTimeInSeconds = deltaTimeMs / 1000.0;

    if (typeof window.fishingMechanics !== 'undefined') {
        if (typeof window.fishingMechanics.updateFishMovement === 'function') window.fishingMechanics.updateFishMovement(deltaTimeInSeconds);
        if (typeof window.fishingMechanics.checkForBite === 'function') window.fishingMechanics.checkForBite(deltaTimeInSeconds);
    }

    if (typeof updateTreeFruitGrowth === 'function') updateTreeFruitGrowth(deltaTimeMs);
    if (typeof manageRockSpawnsAndRespawns === 'function') manageRockSpawnsAndRespawns(deltaTimeMs);

    // Assuming wateringCanMechanics is an object on window if it exists
    if (typeof window.wateringCanMechanics !== 'undefined' && typeof window.wateringCanMechanics.updateWateringCanDragAction === 'function') {
        window.wateringCanMechanics.updateWateringCanDragAction();
    }
    if (typeof window.skyMechanics !== 'undefined' && typeof window.skyMechanics.updateBirdMovementAndSpawns === 'function') {
        window.skyMechanics.updateBirdMovementAndSpawns(deltaTimeInSeconds);
    }
}


function handleFishingKeyPress(event) {
    if (currentMiniGame !== SCREENS.FISHING_GAME || document.querySelector('.custom-modal-overlay[style*="display: flex"]')) return;
    
    const isModalOpen = document.getElementById('fishing-basket-modal')?.style.display === 'flex' ||
                        document.getElementById('fishing-rod-upgrade-modal')?.style.display === 'flex' ||
                        document.getElementById('fishing-bait-select-modal')?.style.display === 'flex' ||
                        document.getElementById('fishing-shop-modal')?.style.display === 'flex' ||
                        document.getElementById('watering-can-upgrade-modal')?.style.display === 'flex';

    if (isModalOpen) return;
    // Assuming fishingUi.isToolSelected is a global function or on a global object
    if (typeof fishingUi !== 'undefined' && typeof fishingUi.isToolSelected === 'function' && fishingUi.isToolSelected()) return;

    if (event.code === 'Space') {
        event.preventDefault();
        if (fishingGameState.isReeling) return;

        if (fishingGameState.hasHookedFish) {
            if (typeof window.fishingMechanics !== 'undefined' && typeof window.fishingMechanics.reelRod === 'function') window.fishingMechanics.reelRod();
        } else if (fishingGameState.isRodCast) {
            if (typeof window.fishingMechanics !== 'undefined' && typeof window.fishingMechanics.reelRod === 'function') window.fishingMechanics.reelRod();
        } else {
            if (typeof window.fishingMechanics !== 'undefined' && typeof window.fishingMechanics.castRod === 'function') window.fishingMechanics.castRod();
        }
    }
}

function stopFishingGame() {
    if (fishingGameState.gameLoopIntervalId) {
        clearInterval(fishingGameState.gameLoopIntervalId);
        fishingGameState.gameLoopIntervalId = null;
    }
    if (fishingGameState.biteTimeoutId) {
        clearTimeout(fishingGameState.biteTimeoutId);
        fishingGameState.biteTimeoutId = null;
    }
    document.removeEventListener('keydown', handleFishingKeyPress);
    
    fishingGameState.isGameActive = false; // Mark as inactive

    if (typeof miniGameData === 'object' && miniGameData !== null) {
        miniGameData.fishingGame = getPersistentFishingState(); 
    }
    if (typeof saveGame === 'function') saveGame();
    console.log("Fishing game stopped and state saved.");
}