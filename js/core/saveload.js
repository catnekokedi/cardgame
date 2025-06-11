
// js/core/saveload.js (Originally menu-js/saveload.js)

function resetGameVariables() {
    console.log("[RESET] Resetting game variables...");
    balance = 10000;

    if (typeof collection === 'object' && collection !== null) {
        for (const key in collection) {
            if (collection.hasOwnProperty(key)) {
                delete collection[key];
            }
        }
    }
    collection = {}; 
    console.log("[RESET] Collection reset to empty object.");

    achievements = {
        masterCollectorProgressV1: 0,
        masterCollectorProgressV2: 0,
        allV1SetsComplete: false,
        allV2SetsComplete: false
    }; 
    packsOpened = 0;
    moneySpent = 0;
    gameEpochStartTime = Date.now(); 
    accumulatedActiveTimeMs = 0;     
    currentScreen = SCREENS.STATS; 
    console.log("[RESET] currentScreen set to STATS.");
    currentMiniGame = null; 
    miniGameData = {};
    currentActiveSetVersion = 'v1'; 
    isOpeningAnvilPack = false; anvilPackSource = null;
    isOpeningSummonPack = false; summonPackSource = [];
    fixedCardProperties = {}; 
    lastSelectedSummonRarityKey = (typeof summonTicketRarities !== 'undefined' && summonTicketRarities.length > 0 && typeof getRarityTierInfo === 'function' && getRarityTierInfo(summonTicketRarities[0])) ? summonTicketRarities[0] : null;
    
    if (typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined') {
        initialDefaultRarityPackPullDistribution = JSON.parse(JSON.stringify(RARITY_PACK_PULL_DISTRIBUTION));
        liveRarityPackPullDistribution = JSON.parse(JSON.stringify(initialDefaultRarityPackPullDistribution));
         normalizeProbabilities(initialDefaultRarityPackPullDistribution, 'packProb');
         normalizeProbabilities(liveRarityPackPullDistribution, 'packProb');
    } else {
        console.error("[RESET] RARITY_PACK_PULL_DISTRIBUTION not defined. Cannot reset rarity odds.");
        initialDefaultRarityPackPullDistribution = []; 
        liveRarityPackPullDistribution = [];
    }
    initialDefaultGradeDistribution = JSON.parse(JSON.stringify(originalHardcodedGradeDistribution));
    gradeDistribution = JSON.parse(JSON.stringify(initialDefaultGradeDistribution));
    
    if(typeof updateRarityMappings === 'function') updateRarityMappings(); 
    normalizeProbabilities(gradeDistribution, 'prob');
    normalizeProbabilities(initialDefaultGradeDistribution, 'prob');


    if (typeof anvilgame !== 'undefined' && anvilgame.resetState) {
        anvilgame.resetState(true); 
    }
    if (typeof offergame !== 'undefined' && offergame.resetState) {
        offergame.resetState();
    }
    if (typeof idleExhibition !== 'undefined' && idleExhibition.resetState) { 
        idleExhibition.resetState();
    }
    
    if (typeof fishingGameState !== 'undefined' && typeof initializeFishingGameState === 'function') {
        initializeFishingGameState(); 
        if(typeof miniGameData === 'object' && miniGameData !== null && typeof getPersistentFishingState === 'function') {
            miniGameData.fishingGame = getPersistentFishingState(); 
        }
    }
    
    if (typeof stats !== 'undefined' && typeof stats.relockCheats === 'function') {
        stats.relockCheats(); 
    }
    isDebugModeActive = false;
    unlockAllPacksCheatActive = false;
    anvilSuccessCheatActive = false;
    
     if (typeof originalPackProbsSnapshotDebug !== 'undefined') originalPackProbsSnapshotDebug = null; 


    rarityOddsConfigUnlocked = false;
    unlockedSets = (typeof ALL_SET_DEFINITIONS !== 'undefined' && ALL_SET_DEFINITIONS.length > 0) 
                   ? [ALL_SET_DEFINITIONS.find(set => set.version === 'v1')?.abbr || ALL_SET_DEFINITIONS[0].abbr] 
                   : [];
    if (unlockedSets[0] === undefined && ALL_SET_DEFINITIONS.length > 0) { 
        unlockedSets = [ALL_SET_DEFINITIONS[0].abbr];
    }


    initializeSummonTickets();
    
    lastTicketRewardTimes = {}; 
    if (typeof summonTicketRarities !== 'undefined') {
        summonTicketRarities.forEach(rarityKey => {
            lastTicketRewardTimes[rarityKey] = 0; 
        });
    }
    
    if (typeof openingpack !== 'undefined') {
        openingpack.currentSet = null;
        openingpack.currentPack = [];
        openingpack.revealedCardIndices = new Set();
        openingpack.currentSetPackPrice = 100;
    }

    console.log("[RESET] Game variables reset complete.");
}

function saveGame() {
    let effectiveAccumulatedActiveTimeMs = accumulatedActiveTimeMs;
    if (isGameActive) {
        effectiveAccumulatedActiveTimeMs += (Date.now() - sessionStartTime);
    }
    
    if (typeof fishingGameState !== 'undefined' && typeof miniGameData === 'object' && typeof getPersistentFishingState === 'function') {
        miniGameData.fishingGame = getPersistentFishingState(); // This now includes shopProgress
    }


    const gameState = {
        balance,
        collection,
        achievements, 
        packsOpened,
        moneySpent,
        gameEpochStartTime, 
        accumulatedActiveTimeMs: effectiveAccumulatedActiveTimeMs, 
        currentScreen,
        currentMiniGame,
        currentActiveSetVersion, 
        miniGameData, 
        unlockedSets,
        cheatsPasswordEntered, 
        isDebugModeActive,
        unlockAllPacksCheatActive,
        anvilSuccessCheatActive,
        rarityOddsConfigUnlocked,
        fixedCardProperties, 
        lastSelectedSummonRarityKey: typeof lastSelectedSummonRarityKey !== 'undefined' ? lastSelectedSummonRarityKey : null,
        lastTicketRewardTimes: typeof lastTicketRewardTimes !== 'undefined' ? lastTicketRewardTimes : {},
        anvilState: {
            staged: (typeof anvilgame !== 'undefined' && typeof anvilgame.stagedCards !== 'undefined') ? anvilgame.stagedCards : [],
            filterRarity: typeof anvilUiFilterRarity !== 'undefined' ? anvilUiFilterRarity : 'all',
            packReadyRarity: typeof anvilPackReadyRarityKey !== 'undefined' ? anvilPackReadyRarityKey : null,
            isProcessing: typeof anvilIsProcessing !== 'undefined' ? anvilIsProcessing : false 
        },
        offerState: {
            playerItems: typeof directOfferPlayerItems !== 'undefined' ? directOfferPlayerItems : [],
            opponentItems: typeof directOfferOpponentOfferItems !== 'undefined' ? directOfferOpponentOfferItems : [],
            lockedCount: typeof directOfferLockedPlayerCardCount !== 'undefined' ? directOfferLockedPlayerCardCount : 0,
            opponentGenerated: typeof directOfferOpponentOfferGenerated !== 'undefined' ? directOfferOpponentOfferGenerated : false,
            requestsMade: typeof directOfferRequestsMade !== 'undefined' ? directOfferRequestsMade : 0
        },
        idleExhibitionState: (typeof idleExhibitionState !== 'undefined' ? {
            ...idleExhibitionState, 
            lastTrueGameTimeUpdateTimestamp: idleExhibitionState.lastTrueGameTimeUpdateTimestamp,
            inGameTimeHoursAtLastTrueUpdate: idleExhibitionState.inGameTimeHoursAtLastTrueUpdate,
            inGameDayAtLastTrueUpdate: idleExhibitionState.inGameDayAtLastTrueUpdate
        } : {}),
        openingPackState: typeof openingpack !== 'undefined' ? {
            currentSet: openingpack.currentSet,
            currentPack: openingpack.currentPack,
            revealedCardIndices: Array.from(openingpack.revealedCardIndices || new Set()),
            currentSetPackPrice: openingpack.currentSetPackPrice
        } : {},
        isOpeningAnvilPackState: typeof isOpeningAnvilPack !== 'undefined' ? isOpeningAnvilPack : false,
        anvilPackSourceState: typeof anvilPackSource !== 'undefined' ? anvilPackSource : null,
        isOpeningSummonPackState: typeof isOpeningSummonPack !== 'undefined' ? isOpeningSummonPack : false,
        summonPackSourceState: typeof summonPackSource !== 'undefined' ? summonPackSource : [],
        summonTicketsState: typeof summonTickets !== 'undefined' ? { tickets: summonTickets } : { tickets: {} },
        
        initialDefaultRarityPackPullDistributionState: typeof initialDefaultRarityPackPullDistribution !== 'undefined' ? initialDefaultRarityPackPullDistribution : null,
        initialDefaultGradeDistributionState: typeof initialDefaultGradeDistribution !== 'undefined' ? initialDefaultGradeDistribution : JSON.parse(JSON.stringify(originalHardcodedGradeDistribution)),
        liveRarityPackPullDistributionState: typeof liveRarityPackPullDistribution !== 'undefined' ? liveRarityPackPullDistribution : null,
        liveGradeDistributionState: typeof gradeDistribution !== 'undefined' ? gradeDistribution : JSON.parse(JSON.stringify(originalHardcodedGradeDistribution))
    }; // Correctly close the gameState object literal
    try {
        const stringifiedState = JSON.stringify(gameState);
        localStorage.setItem(LOCAL_STORAGE_KEY, stringifiedState);
    } catch (error) {
        console.error("[SAVEGAME] Error stringifying or saving game state to localStorage:", error);
        for (const key in gameState) {
            try {
                JSON.stringify(gameState[key]);
            } catch (e) {
                console.error(`[SAVEGAME] Error stringifying gameState.${key}:`, e, gameState[key]);
            }
        }
    }
}

function loadGame() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (savedData) {
        let loadedGameState;
        try {
            loadedGameState = JSON.parse(savedData);
            if (typeof loadedGameState !== 'object' || loadedGameState === null) {
                console.warn("[LOAD] Parsed data is not a valid object. Resetting game.");
                resetGameVariables(); return;
            }
        } catch (e) {
            console.error("[LOAD] Error parsing saved game data. Resetting game.", e);
            resetGameVariables(); return; 
        }

        balance = loadedGameState.balance !== undefined && typeof loadedGameState.balance === 'number' ? loadedGameState.balance : 10000;
        collection = (typeof loadedGameState.collection === 'object' && loadedGameState.collection !== null) ? loadedGameState.collection : {};
        
        achievements = (typeof loadedGameState.achievements === 'object' && loadedGameState.achievements !== null) ? loadedGameState.achievements : {};
        achievements.masterCollectorProgressV1 = achievements.masterCollectorProgressV1 || 0;
        achievements.masterCollectorProgressV2 = achievements.masterCollectorProgressV2 || 0;
        achievements.allV1SetsComplete = achievements.allV1SetsComplete || false;
        achievements.allV2SetsComplete = achievements.allV2SetsComplete || false;

        packsOpened = loadedGameState.packsOpened || 0;
        moneySpent = loadedGameState.moneySpent || 0;
        
        gameEpochStartTime = loadedGameState.gameEpochStartTime || loadedGameState.startTime || Date.now();
        accumulatedActiveTimeMs = loadedGameState.accumulatedActiveTimeMs || 0;
        sessionStartTime = Date.now(); 
        isGameActive = true;           

        currentActiveSetVersion = loadedGameState.currentActiveSetVersion || 'v1'; 

        fixedCardProperties = (typeof loadedGameState.fixedCardProperties === 'object' && loadedGameState.fixedCardProperties !== null) ? loadedGameState.fixedCardProperties : {};
        lastSelectedSummonRarityKey = loadedGameState.lastSelectedSummonRarityKey || ((typeof summonTicketRarities !== 'undefined' && summonTicketRarities.length > 0 && typeof getRarityTierInfo === 'function' && getRarityTierInfo(summonTicketRarities[0])) ? summonTicketRarities[0] : null);
        
        lastTicketRewardTimes = {}; 
        if (loadedGameState.lastTicketRewardTimes && typeof loadedGameState.lastTicketRewardTimes === 'object' && typeof summonTicketRarities !== 'undefined') {
            summonTicketRarities.forEach(rarityKey => {
                const loadedVal = loadedGameState.lastTicketRewardTimes[rarityKey];
                if (loadedVal === undefined || loadedVal >= (gameEpochStartTime - 1000)) {
                    lastTicketRewardTimes[rarityKey] = 0; 
                } else {
                    lastTicketRewardTimes[rarityKey] = loadedVal; 
                }
            });
        }

        const firstSetForActiveVersion = (typeof ALL_SET_DEFINITIONS !== 'undefined' && ALL_SET_DEFINITIONS.length > 0)
            ? [ALL_SET_DEFINITIONS.find(set => set.version === currentActiveSetVersion)?.abbr || ALL_SET_DEFINITIONS[0].abbr]
            : [];
        unlockedSets = (Array.isArray(loadedGameState.unlockedSets) && loadedGameState.unlockedSets.length > 0)
            ? loadedGameState.unlockedSets
            : firstSetForActiveVersion;
        if (unlockedSets.length === 0 && firstSetForActiveVersion.length > 0) {
             unlockedSets = firstSetForActiveVersion;
        }


        cheatsPasswordEntered = loadedGameState.cheatsPasswordEntered || false;
        isDebugModeActive = loadedGameState.isDebugModeActive || false;
        unlockAllPacksCheatActive = loadedGameState.unlockAllPacksCheatActive || false;
        anvilSuccessCheatActive = loadedGameState.anvilSuccessCheatActive || false;
        rarityOddsConfigUnlocked = loadedGameState.rarityOddsConfigUnlocked || false;
        
        initialDefaultRarityPackPullDistribution = loadedGameState.initialDefaultRarityPackPullDistributionState || JSON.parse(JSON.stringify(RARITY_PACK_PULL_DISTRIBUTION || []));
        initialDefaultGradeDistribution = loadedGameState.initialDefaultGradeDistributionState || JSON.parse(JSON.stringify(originalHardcodedGradeDistribution));
        liveRarityPackPullDistribution = loadedGameState.liveRarityPackPullDistributionState || JSON.parse(JSON.stringify(initialDefaultRarityPackPullDistribution));
        gradeDistribution = loadedGameState.liveGradeDistributionState || JSON.parse(JSON.stringify(initialDefaultGradeDistribution));

        if(typeof updateRarityMappings === 'function') updateRarityMappings();
        normalizeProbabilities(initialDefaultRarityPackPullDistribution, 'packProb');
        normalizeProbabilities(initialDefaultGradeDistribution, 'prob');
        normalizeProbabilities(liveRarityPackPullDistribution, 'packProb');
        normalizeProbabilities(gradeDistribution, 'prob');

        if (typeof anvilgame !== 'undefined' && anvilgame.loadState && loadedGameState.anvilState) {
            anvilgame.loadState(
                loadedGameState.anvilState.staged, 
                loadedGameState.anvilState.filterRarity, 
                loadedGameState.anvilState.packReadyRarity, 
                loadedGameState.anvilState.isProcessing
            );
        } else if (typeof anvilgame !== 'undefined' && anvilgame.resetState) {
            anvilgame.resetState(false); 
        }


        if (typeof offergame !== 'undefined' && offergame.loadState && loadedGameState.offerState) {
            offergame.loadState(loadedGameState.offerState.playerItems, loadedGameState.offerState.opponentItems, loadedGameState.offerState.lockedCount, loadedGameState.offerState.opponentGenerated, loadedGameState.offerState.requestsMade);
        } else if (typeof offergame !== 'undefined' && offergame.resetState) {
            offergame.resetState();
        }
        
        if (typeof idleExhibition !== 'undefined' && idleExhibition.loadState) {
            idleExhibition.loadState(loadedGameState.idleExhibitionState); 
        } else if (typeof initializeIdleExhibitionState === 'function') {
            initializeIdleExhibitionState();
        }


        if (loadedGameState.openingPackState && typeof openingpack !== 'undefined') {
            openingpack.currentSet = loadedGameState.openingPackState.currentSet;
            openingpack.currentPack = loadedGameState.openingPackState.currentPack || [];
            openingpack.revealedCardIndices = new Set(loadedGameState.openingPackState.revealedCardIndices || []);
            openingpack.currentSetPackPrice = loadedGameState.openingPackState.currentSetPackPrice || 100;
        } else if (typeof openingpack !== 'undefined') {
            openingpack.currentSet = null; openingpack.currentPack = []; openingpack.revealedCardIndices = new Set(); openingpack.currentSetPackPrice = 100;
        }
        
        isOpeningAnvilPack = loadedGameState.isOpeningAnvilPackState || false;
        anvilPackSource = loadedGameState.anvilPackSourceState || null;
        isOpeningSummonPack = loadedGameState.isOpeningSummonPackState || false;
        summonPackSource = loadedGameState.summonPackSourceState || [];
        
        if (loadedGameState.summonTicketsState && typeof loadedGameState.summonTicketsState.tickets === 'object' && loadedGameState.summonTicketsState.tickets !== null) {
            summonTickets = loadedGameState.summonTicketsState.tickets;
        } else {
            initializeSummonTickets();
        }

        currentMiniGame = loadedGameState.currentMiniGame || null;
        miniGameData = (typeof loadedGameState.miniGameData === 'object' && loadedGameState.miniGameData !== null) ? loadedGameState.miniGameData : {};
        
        // Load Fishing Game specific state (which includes shopProgress)
        if (typeof fishingGameState !== 'undefined' && typeof loadPersistentFishingState === 'function') {
            loadPersistentFishingState(miniGameData.fishingGame); 
        } else if (typeof fishingGameState !== 'undefined' && typeof initializeFishingGameState === 'function'){
             initializeFishingGameState();
        }


        currentScreen = loadedGameState.currentScreen;
        if (!currentScreen || !Object.values(SCREENS).includes(currentScreen)) {
            currentScreen = SCREENS.STATS;
        }
    } else {
        resetGameVariables(); 
        sessionStartTime = Date.now();
        isGameActive = true;
        if (typeof initializeIdleExhibitionState === 'function') {
            initializeIdleExhibitionState();
        }
        if (typeof fishingGameState !== 'undefined' && typeof initializeFishingGameState === 'function') { 
            initializeFishingGameState();
        }
    }
}

function backupGame() {
  saveGame();
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date();
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;
    a.download = `card_game_backup_${dateString}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showCustomAlert('Game data backed up successfully!', null, 2000);
    if(typeof playSound === 'function') playSound('sfx_save_load.mp3');
  } else {
    showCustomAlert('No game data found to back up.', null, 2000);
  }
}

function loadGameFromFile() {
  const fileInput = document.getElementById('load-game-input');
  if (!fileInput.files.length) {
    showCustomAlert('Please select a backup file to load.', null, 2000);
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const dataToLoad = event.target.result;
      JSON.parse(dataToLoad); // Validate JSON
      localStorage.setItem(LOCAL_STORAGE_KEY, dataToLoad);

      if (typeof initializeSetMappings === 'function') initializeSetMappings();
      if (typeof initializeRarityAndGradeSystems === 'function') initializeRarityAndGradeSystems();
      if (typeof initializeSummonTickets === 'function') initializeSummonTickets();
      if (typeof initializeIdleExhibitionState === 'function') initializeIdleExhibitionState(); 
      if (typeof fishingGameState !== 'undefined' && typeof initializeFishingGameState === 'function') initializeFishingGameState();


      loadGame(); 

      if (typeof updateBalance === 'function') updateBalance();
      if (typeof updateStats === 'function') updateStats(); 
      if (typeof populatePackList === 'function') populatePackList();
      if (typeof populateSetSelectors === 'function') populateSetSelectors();
      if (typeof populateRarityFilters === 'function') populateRarityFilters();
      if (typeof updateAchievementsDisplay === 'function') updateAchievementsDisplay();
      
      if (typeof stats !== 'undefined' && typeof stats.updateDebugSectionVisibility === 'function') { 
        stats.updateDebugSectionVisibility();
      }
      if (typeof initializeLastTicketRewardTimesState === 'function') initializeLastTicketRewardTimesState();


      let screenToDisplayAfterLoad = currentScreen;

        if (currentMiniGame && screenToDisplayAfterLoad === SCREENS.GAMES) {
            showScreen(SCREENS.GAMES, false);
            if (typeof loadMiniGame === 'function') loadMiniGame(currentMiniGame);
        } else if (screenToDisplayAfterLoad === SCREENS.PACK_SELECTION && typeof openingpack !== 'undefined' && openingpack.currentPack && openingpack.currentPack.length > 0 && !openingpack.areAllCardsRevealed()) {
            showScreen(SCREENS.PACK_SELECTION, false);
            if (typeof openingpack.showCorrectPackOpeningUI === 'function') { 
                 openingpack.showCorrectPackOpeningUI();
            }
        } else if (screenToDisplayAfterLoad && document.getElementById(screenToDisplayAfterLoad)) {
             if (screenToDisplayAfterLoad === SCREENS.SUMMON_GAME) {
                const summonTicketsAvailable = typeof summonTickets !== 'undefined' && Object.values(summonTickets).some(val => val > 0);
                if (!isOpeningSummonPack && !summonTicketsAvailable) {
                    showScreen(SCREENS.STATS);
                } else {
                    showScreen(SCREENS.SUMMON_GAME);
                }
            } else {
                 showScreen(screenToDisplayAfterLoad);
            }
        } else {
            showScreen(SCREENS.STATS);
        }

      showCustomAlert('Game data loaded successfully from backup!', null, 2000);
      if(typeof playSound === 'function') playSound('sfx_save_load.mp3');
    } catch (e) {
      console.error('Error loading game from file:', e);
      showCustomAlert('Failed to load game data. File may be corrupted or not a valid backup.', null, 3000);
    } finally {
      fileInput.value = '';
    }
  };
  reader.readAsText(file);
}

window.addEventListener('beforeunload', function(event) {
  if (typeof saveGame === 'function') {
    if (isGameActive) { 
        accumulatedActiveTimeMs += (Date.now() - sessionStartTime);
    }
    saveGame();
  }
});
