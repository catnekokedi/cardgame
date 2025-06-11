// js/mini-games/fishing-game/fishing-main.js

function startFishingGame(gameContentEl, gameResultEl) {
    if (!gameContentEl) {
        console.error("Fishing Game: gameContentEl is null.");
        return;
    }

    initializeFishingGameState(); // From fishing-state.js
    fishingUi.init(gameContentEl); // From fishing-ui.js

    // Load saved state specific to fishing game if available
    if (typeof miniGameData === 'object' && miniGameData.fishingGame) {
        loadPersistentFishingState(miniGameData.fishingGame); // From fishing-state.js
    }
    fishingUi.updateRodAndBaitDisplay();
    fishingUi.updateStatusText();


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
    
    fishingMechanics.updateBiteTimer(); // Core fishing logic

    // Call modularized mechanics
    if (typeof treeMechanics !== 'undefined' && typeof treeMechanics.updateTreeFruitGrowth === 'function') {
        treeMechanics.updateTreeFruitGrowth();
    }
    if (typeof rockMechanics !== 'undefined' && typeof rockMechanics.manageRockSpawnsAndRespawns === 'function') {
        rockMechanics.manageRockSpawnsAndRespawns();
    }
    if (typeof wateringCanMechanics !== 'undefined' && typeof wateringCanMechanics.updateWateringCanDragAction === 'function') {
        wateringCanMechanics.updateWateringCanDragAction();
    }
}


function handleFishingKeyPress(event) {
    if (currentMiniGame !== SCREENS.FISHING_GAME || document.querySelector('.custom-modal-overlay[style*="display: flex"]')) return;
    // Prevent space action if any fishing game modal is open
    if (document.getElementById('fishing-basket-modal')?.style.display === 'flex' ||
        document.getElementById('fishing-rod-upgrade-modal')?.style.display === 'flex' ||
        document.getElementById('fishing-bait-select-modal')?.style.display === 'flex' ||
        document.getElementById('fishing-shop-modal')?.style.display === 'flex') {
        return;
    }
    
    if (event.code === 'Space' && !fishingGameState.isRodCast && !fishingGameState.isReeling && !fishingUi.isToolSelected()) {
        event.preventDefault();
        fishingMechanics.castRod();
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