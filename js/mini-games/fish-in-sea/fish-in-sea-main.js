// js/mini-games/fishing-game/fishing-main.js

function startFishingGame(gameContentEl, gameResultEl) {
    // Removed lastFishingReward processing block

    if (!gameContentEl) {
        console.error("Fishing Game: gameContentEl is null.");
        return;
    }

    initializeFishingGameState(); // From fishing-state.js

    // Reset and initialize bird systems early
    if (window.birdUi && typeof window.birdUi.reset === 'function') {
        window.birdUi.reset();
    }
    if (window.birdMechanics && typeof window.birdMechanics.initialize === 'function') {
        // Initialize with default boundaries first, will be refined after sky element is available
        window.birdMechanics.initialize();
    }

    // Initialize core systems like Summon Tickets
    if (typeof window.initializeSummonTickets === 'function') {
        window.initializeSummonTickets();
    } else {
        console.warn("initializeSummonTickets function not found. Summon ticket system may not be ready.");
    }

    if (typeof initializeTree === 'function') initializeTree(); else console.warn("initializeTree function not found.");

    // Initialize main fishing UI
    if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.init === 'function') {
        window.fishingUi.init(gameContentEl);
    } else {
        console.error("CRITICAL: Main fishingUi.init function not found.");
        // Potentially stop further initialization if main UI can't load
    }

    // Fishing Basket logic and UI - Initialized earlier as other modules depend on window.fishingBasket
    if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.initializeBasket === 'function') {
        window.fishingBasket.initializeBasket();
    } else {
        console.warn("fishingBasket.initializeBasket function not found during main initialization sequence. Dependent mechanics might fail.");
    }
    if (typeof window.fishingBasketUi !== 'undefined' && typeof window.fishingBasketUi.initializeBasketUI === 'function') {
        window.fishingBasketUi.initializeBasketUI();
    } else {
        console.warn("fishingBasketUi.initializeBasketUI function not found during main initialization sequence.");
    }

    if (typeof window.fishingTreeUi !== 'undefined' && typeof window.fishingTreeUi.initialize === 'function') window.fishingTreeUi.initialize(); else console.warn("fishingTreeUi.initialize function not found.");
    if (typeof initializeWateringCan === 'function') initializeWateringCan(); else console.warn("initializeWateringCan function not found.");
    if (typeof initializeRocks === 'function') initializeRocks(); else console.warn("initializeRocks function not found.");
    if (typeof window.fishingRocksUi !== 'undefined' && typeof window.fishingRocksUi.initializeRockUI === 'function') window.fishingRocksUi.initializeRockUI(); else console.warn("fishingRocksUi.initializeRockUI function not found.");

    // Core fishing mechanics (fish movement, bite logic)
    if (typeof window.fishingMechanics !== 'undefined' && typeof window.fishingMechanics.initializeFishingMechanics === 'function') window.fishingMechanics.initializeFishingMechanics(); else console.warn("fishingMechanics.initializeFishingMechanics function not found.");
    // UI for new core fishing game elements (sea container, fish rendering)
    // if (typeof window.fishingGameUi !== 'undefined' && typeof window.fishingGameUi.initializeFishingUIElements === 'function') window.fishingGameUi.initializeFishingUIElements(); else console.warn("fishingGameUi.initializeFishingUIElements function not found."); // Commented out as per task

    // Old Sky Mechanics and UI calls have been removed as they are replaced by the new bird system.

    // Initialize Bird Mechanics and UI
    const skyElementForBirds = document.getElementById('fishing-sky-container'); // This is the bird's movement canvas
    const waterPanelElement = fishingGameState.ui.waterDropArea; // Reference to the water panel

    let birdSkyBoundaries = { xMin: 0, xMax: 600, yMin: 0, yMax: 150 }; // Default fallback

    if (skyElementForBirds && waterPanelElement) {
        const skyRect = skyElementForBirds.getBoundingClientRect();
        const waterRect = waterPanelElement.getBoundingClientRect();

        // Calculate X boundaries for birds to be over the water, relative to the skyElement.
        // This assumes skyElementForBirds and waterPanelElement share a common positioning context
        // or that their absolute positions can be used to find relative positions.
        // For simplicity, let's assume skyRect.left is the 0 for bird X coordinates.
        birdSkyBoundaries.xMin = Math.max(0, waterRect.left - skyRect.left);
        birdSkyBoundaries.xMax = Math.min(skyRect.width, waterRect.right - skyRect.left);

        // Y boundaries: a band within the sky container, e.g., upper half or a fixed height.
        // This part of the logic makes birds fly in the upper part of their sky container.
        // To be "over the water", the sky container itself should be positioned appropriately,
        // or yMin/yMax should be calculated based on waterRect.top - skyRect.top.
        // For this subtask, let's keep yMin as 0 (top of sky container) and yMax as a portion of sky container height.
        birdSkyBoundaries.yMin = 0; // Top of the sky container
        birdSkyBoundaries.yMax = skyElementForBirds.offsetHeight * 0.75; // Fly in upper 75% of sky container

        console.log(`[BirdMechanics Init] Calculated bird boundaries: xMin=${birdSkyBoundaries.xMin}, xMax=${birdSkyBoundaries.xMax}, yMin=${birdSkyBoundaries.yMin}, yMax=${birdSkyBoundaries.yMax}`);
        console.log(`[BirdMechanics Init] SkyRect: L=${skyRect.left}, R=${skyRect.right}, T=${skyRect.top}, W=${skyRect.width}, H=${skyRect.height}`);
        console.log(`[BirdMechanics Init] WaterRect: L=${waterRect.left}, R=${waterRect.right}, T=${waterRect.top}, W=${waterRect.width}, H=${waterRect.height}`);

    } else {
        console.warn("Bird Mechanics: #fishing-sky-container or water panel element not found for precise boundary setup. Using defaults.", birdSkyBoundaries);
    }

    if (window.birdMechanics && typeof window.birdMechanics.initialize === 'function') {
        window.birdMechanics.initialize(birdSkyBoundaries);
        console.log("[BirdMechanics Init] Bird mechanics initialized with boundaries:", birdSkyBoundaries);
    }
    if (window.birdUi && typeof window.birdUi.initialize === 'function') {
        window.birdUi.initialize('#fishing-sky-container'); // UI uses selector
    }

    // Load persistent state AFTER all initializations
    if (typeof miniGameData === 'object' && miniGameData.fishingGame) {
        if (typeof loadPersistentFishingState === 'function') {
            loadPersistentFishingState(miniGameData.fishingGame); // From fishing-state.js
        } else {
            console.error("loadPersistentFishingState function not found.");
        }

        // After loading, UI components need refreshing based on the now-loaded state
        // Note: fishingTreeUi.initialize() is removed from here because loadTreeData() in tree-mechanics.js
        // already calls fishingTreeUi.renderTreeSlots() and fishingTreeUi.updateMoistureDisplay() after loading data.
        if (typeof updateWateringCanUI === 'function') updateWateringCanUI();
        // Note: fishingRocksUi.renderRocks() is removed from here because loadRockData() in rock-mechanics.js
        // already calls its own UI rendering function after loading data.
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
        if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.drawRodLine === 'function') { // Check specific functions needed
            if (fishingGameState.isRodCast || fishingGameState.hasHookedFish) {
                if (typeof window.fishingUi.showBobber === 'function') window.fishingUi.showBobber(); // Uses internal hookPosition
                window.fishingUi.drawRodLine(); // Uses internal hookPosition and bobberPosition
                if (typeof window.fishingUi.showExclamationOnBobber === 'function') window.fishingUi.showExclamationOnBobber(fishingGameState.hasHookedFish && !fishingGameState.isReeling);
            } else {
                if (typeof window.fishingUi.hideBobber === 'function') window.fishingUi.hideBobber();
                if (typeof window.fishingUi.hideRodLine === 'function') window.fishingUi.hideRodLine();
            }
        }
    }

    if (typeof window.fishingUi !== 'undefined') { // Ensure fishingUi is available before calling its methods
        if (typeof window.fishingUi.updateRodAndBaitDisplay === 'function') window.fishingUi.updateRodAndBaitDisplay();
        if (typeof window.fishingUi.updateStatusText === 'function') window.fishingUi.updateStatusText();
    }


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
    console.log("[MainLoop] updateFishingGameLoop called. RodCast:", fishingGameState.isRodCast, "HasHooked:", fishingGameState.hasHookedFish);
    
    const deltaTimeMs = 100; // Game loop interval in milliseconds
    const deltaTimeInSeconds = deltaTimeMs / 1000.0;

    if (typeof window.fishingMechanics !== 'undefined') {
        if (typeof window.fishingMechanics.updateFishMovement === 'function') window.fishingMechanics.updateFishMovement(deltaTimeInSeconds);

        // Condition for calling checkForBite is handled inside fishingMechanics.checkForBite
        // It will check fishingGameState.isRodCast && !fishingGameState.hasHookedFish etc.
        // Logging the call here to ensure loop is trying.
        if (fishingGameState.isRodCast && !fishingGameState.hasHookedFish) {
            console.log("[MainLoop] Conditions met for trying to check for bite. Calling fishingMechanics.checkForBite()");
        } else if (fishingGameState.hasHookedFish) {
            // This is when the bite timer should be active and counting down inside checkForBite
            console.log("[MainLoop] Fish is hooked. checkForBite will manage biteTimer.");
        }
        // Always call checkForBite if mechanics are available, it has internal checks.
        if (typeof window.fishingMechanics.checkForBite === 'function') {
            window.fishingMechanics.checkForBite(deltaTimeInSeconds);
        }
    }

    if (typeof updateTreeFruitGrowth === 'function') updateTreeFruitGrowth(deltaTimeMs);
    if (typeof manageRockSpawnsAndRespawns === 'function') manageRockSpawnsAndRespawns(deltaTimeMs);

    // Assuming wateringCanMechanics is an object on window if it exists
    if (typeof window.wateringCanMechanics !== 'undefined' && typeof window.wateringCanMechanics.updateWateringCanDragAction === 'function') {
        window.wateringCanMechanics.updateWateringCanDragAction();
    }
    // Old skyMechanics.updateBirdMovementAndSpawns call removed.

    // Update new Bird Mechanics
    if (window.birdMechanics && typeof window.birdMechanics.update === 'function') {
        window.birdMechanics.update(deltaTimeMs); // birdMechanics.update expects deltaTime in ms
    }
    if (window.birdUi && typeof window.birdMechanics !== 'undefined' && typeof window.birdUi.update === 'function') {
        window.birdUi.update(window.birdMechanics.birds);
    }

    // Continuously update fishing line if it should be visible
    if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.drawRodLine === 'function') {
        if (fishingGameState.isRodCast || fishingGameState.hasHookedFish) {
            window.fishingUi.drawRodLine();
        }
        // Hiding the line when not cast/hooked is handled by resetFishingState and castRod (hiding previous catch preview)
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

    // Reset bird systems when stopping the fishing game
    if (window.birdUi && typeof window.birdUi.reset === 'function') {
        window.birdUi.reset();
    }
    if (window.birdMechanics && typeof window.birdMechanics.initialize === 'function') {
        // Re-initialize to clear birds array and reset timers, effectively a reset
        window.birdMechanics.initialize();
    }

    if (typeof miniGameData === 'object' && miniGameData !== null) {
        miniGameData.fishingGame = getPersistentFishingState(); 
    }
    if (typeof saveGame === 'function') saveGame();
    console.log("Fishing game stopped and state saved.");
}