// js/mini-games/fishing-game/fishing-main.js

function startFishingGame(gameContentEl, gameResultEl) {
    if (!gameContentEl) {
        console.error("Fishing Game: gameContentEl is null.");
        return;
    }

    initializeFishingGameState(); // From fishing-state.js
    if (typeof initializeTree === 'function') {
        initializeTree(); // From tree-mechanics.js
    } else {
        console.warn("initializeTree function not found. Ensure tree-mechanics.js is loaded.");
    }
    // Initialize main fishing UI first
    fishingUi.init(gameContentEl); // From fishing-ui.js

    // Then initialize specific UI components like the tree
    if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.initialize === 'function') {
        fishingTreeUi.initialize();
    } else {
        console.warn("fishingTreeUi.initialize function not found.");
    }

    // Initialize watering can mechanics (which might depend on UI elements being ready)
    if (typeof initializeWateringCan === 'function') {
        initializeWateringCan(); // From watering-can.js
    } else {
        console.warn("initializeWateringCan function not found. Ensure watering-can.js is loaded.");
    }

    // Initialize Rock Mechanics and UI
    if (typeof initializeRocks === 'function') {
        initializeRocks(); // From rock-mechanics.js
    } else {
        console.warn("initializeRocks function not found. Ensure rock-mechanics.js is loaded.");
    }
    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.initializeRockUI === 'function') {
        fishingRocksUi.initializeRockUI();
    } else {
        console.warn("fishingRocksUi.initializeRockUI function not found.");
    }

    // Initialize core fishing mechanics (like fish in sea)
    if (typeof fishingMechanics !== 'undefined' && typeof fishingMechanics.initializeFishingMechanics === 'function') {
        fishingMechanics.initializeFishingMechanics();
    } else {
        console.warn("fishingMechanics.initializeFishingMechanics function not found.");
    }
    // Initialize UI for the core fishing game elements (sea, fish, float)
    if (typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.initializeFishingUIElements === 'function') {
        fishingGameUi.initializeFishingUIElements();
    } else {
        console.warn("fishingGameUi.initializeFishingUIElements function not found.");
    }

    // Initialize Sky Mechanics and UI
    if (typeof skyMechanics !== 'undefined' && typeof skyMechanics.initializeSkyMechanics === 'function') {
        skyMechanics.initializeSkyMechanics();
    } else {
        console.warn("skyMechanics.initializeSkyMechanics function not found.");
    }
    if (typeof skyUi !== 'undefined' && typeof skyUi.initializeSkyUI === 'function') {
        skyUi.initializeSkyUI();
    } else {
        console.warn("skyUi.initializeSkyUI function not found.");
    }

    // Initialize Fishing Basket logic and UI
    if (typeof fishingBasket !== 'undefined' && typeof fishingBasket.initializeBasket === 'function') {
        fishingBasket.initializeBasket(); // Initializes data logic
    } else {
        console.warn("fishingBasket.initializeBasket function not found.");
    }
    if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasketUi.initializeBasketUI === 'function') {
        fishingBasketUi.initializeBasketUI(); // Initializes UI elements and listeners
    } else {
        console.warn("fishingBasketUi.initializeBasketUI function not found.");
    }

    // Load persistent state AFTER all initializations
    if (typeof miniGameData === 'object' && miniGameData.fishingGame) {
        loadPersistentFishingState(miniGameData.fishingGame); // From fishing-state.js
        // After loading, UI components need refreshing based on the now-loaded state
        if (typeof fishingTreeUi !== 'undefined' && typeof fishingTreeUi.initialize === 'function') {
            fishingTreeUi.initialize();
        }
        if (typeof updateWateringCanUI === 'function') { // From watering-can.js
            updateWateringCanUI();
        }
        if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function' && typeof getRockSlotsData === 'function') {
            fishingRocksUi.renderRocks(getRockSlotsData());
        }
        if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.updatePickaxeCursor === 'function' && typeof pickaxeSelected !== 'undefined') {
            fishingRocksUi.updatePickaxeCursor(pickaxeSelected);
        }
        if (typeof fishingGameUi !== 'undefined' && typeof fishingMechanics !== 'undefined') {
            if (typeof fishingGameUi.renderFish === 'function' && fishingMechanics.activeFish) {
                 fishingGameUi.renderFish(fishingMechanics.activeFish);
            }
            if (typeof fishingGameUi.renderFishingRod === 'function' && fishingMechanics.hookPosition) {
                fishingGameUi.renderFishingRod(fishingGameState.isRodCast || fishingGameState.hasHookedFish, fishingMechanics.hookPosition);
            }
            if (typeof fishingGameUi.showBiteIndicator === 'function') {
                fishingGameUi.showBiteIndicator(fishingGameState.hasHookedFish && !fishingGameState.isReeling);
            }
        }
        // Refresh basket UI after loading state
        if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasket !== 'undefined' && typeof fishingBasketUi.renderBasket === 'function') {
            fishingBasketUi.renderBasket(fishingBasket.getBasketContentsForDisplay(fishingBasketUi.currentFilters));
        }
         if (typeof fishingBasketUi !== 'undefined' && typeof fishingBasket !== 'undefined' && typeof fishingBasketUi.updateBasketCountDisplay === 'function') {
            fishingBasketUi.updateBasketCountDisplay(fishingBasket.getTotalItemCount());
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
    
    // Convert ms to seconds for physics/movement calculations
    const deltaTimeInSeconds = 100 / 1000.0;

    if (typeof fishingMechanics !== 'undefined') {
        if (typeof fishingMechanics.updateFishMovement === 'function') {
            fishingMechanics.updateFishMovement(deltaTimeInSeconds);
        }
        if (typeof fishingMechanics.checkForBite === 'function') {
            fishingMechanics.checkForBite(deltaTimeInSeconds);
        }
        // fishingMechanics.updateBiteTimer(); // This was from the old system, replaced by checkForBite
    }


    // Call other modularized mechanics
    const deltaTimeMs = 100;
    if (typeof updateTreeFruitGrowth === 'function') {
        updateTreeFruitGrowth(deltaTimeMs);
    }
    if (typeof manageRockSpawnsAndRespawns === 'function') {
        manageRockSpawnsAndRespawns(deltaTimeMs);
    }
    if (typeof wateringCanMechanics !== 'undefined' && typeof wateringCanMechanics.updateWateringCanDragAction === 'function') {
        // This function might need deltaTimeMs if it involves timed actions
        wateringCanMechanics.updateWateringCanDragAction();
    }
    if (typeof skyMechanics !== 'undefined' && typeof skyMechanics.updateBirdMovementAndSpawns === 'function') {
        skyMechanics.updateBirdMovementAndSpawns(deltaTimeInSeconds);
    }
}


function handleFishingKeyPress(event) {
    if (currentMiniGame !== SCREENS.FISHING_GAME || document.querySelector('.custom-modal-overlay[style*="display: flex"]')) return;
    
    // Prevent space action if any major fishing game modal is open or a tool is selected
    const isModalOpen = document.getElementById('fishing-basket-modal')?.style.display === 'flex' ||
                        document.getElementById('fishing-rod-upgrade-modal')?.style.display === 'flex' ||
                        document.getElementById('fishing-bait-select-modal')?.style.display === 'flex' ||
                        document.getElementById('fishing-shop-modal')?.style.display === 'flex' ||
                        document.getElementById('watering-can-upgrade-modal')?.style.display === 'flex';

    if (isModalOpen) return;
    if (typeof fishingUi !== 'undefined' && fishingUi.isToolSelected && fishingUi.isToolSelected()) return; // Check if a tool like pickaxe is active

    if (event.code === 'Space') {
        event.preventDefault();
        if (fishingGameState.isReeling) {
            // Already reeling, space might do nothing or speed it up in future
            return;
        }
        if (fishingGameState.hasHookedFish) { // A fish is on the line, reel it in!
            if (typeof fishingMechanics !== 'undefined' && typeof fishingMechanics.reelRod === 'function') {
                fishingMechanics.reelRod();
            }
        } else if (fishingGameState.isRodCast) { // Rod is cast, but no bite yet, reel it back
            if (typeof fishingMechanics !== 'undefined' && typeof fishingMechanics.reelRod === 'function') {
                fishingMechanics.reelRod(); // reelRod now handles empty hook retrieval
            }
        } else { // Rod is not cast, cast it
            if (typeof fishingMechanics !== 'undefined' && typeof fishingMechanics.castRod === 'function') {
                fishingMechanics.castRod();
            }
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