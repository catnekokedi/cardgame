
// js/ui/screens/stats.js (Originally menu-js/stats.js)

var stats = stats || {};

// Removed:
// stats.summonTicketsCheatActive = false; 
// stats.originalSummonTicketsSnapshot = null;

stats.updateSetVersionButton = function() {
    const toggleButton = document.getElementById('toggle-set-version-button');
    if (toggleButton) {
        toggleButton.textContent = currentActiveSetVersion === 'v1' ? 'V1' : 'V2';
        toggleButton.title = `Toggle Card Set Version (Current: ${currentActiveSetVersion.toUpperCase()})`;
    }
};

stats.toggleActiveSetVersion = function() {
    if (typeof currentActiveSetVersion === 'undefined' || typeof showScreen !== 'function' ||
        typeof populatePackList !== 'function' || typeof populateSetSelectors !== 'function' ||
        typeof saveGame !== 'function' || typeof updateActiveSetDependentGlobals !== 'function' ||
        typeof ALL_SET_DEFINITIONS === 'undefined' || typeof unlockedSets === 'undefined' ||
        typeof showCustomAlert !== 'function' || typeof getSetMetadata !== 'function' ||
        typeof anvilgame === 'undefined' || typeof anvilgame.stagedCards === 'undefined' || 
        typeof updateCollectionSingleCard !== 'function' ) { 
        console.error("toggleActiveSetVersion: Missing core dependencies.");
        return;
    }

    const previousVersion = currentActiveSetVersion;

    // Check Anvil state BEFORE changing version
    if (anvilgame.stagedCards.length > 0) {
        
        if (typeof anvilgame.clearAnvilForVersionChange === 'function') {
            anvilgame.clearAnvilForVersionChange(previousVersion);
        } else {
            // Fallback if the specific clear function isn't available (shouldn't happen with new code)
            console.warn("Anvil game state might be inconsistent: clearAnvilForVersionChange function missing.");
            anvilgame.stagedCards.forEach(card => {
                updateCollectionSingleCard({
                    set: card.setIdentifier,
                    cardId: card.cardId,
                    rarityKey: card.rarityKey,
                    grade: card.grade,
                    price: card.price
                }, 1); // Add one back
            });
            anvilgame.stagedCards = [];
            if (typeof anvilUiFilterRarity !== 'undefined') anvilUiFilterRarity = 'all';
            if (typeof anvilPackReadyRarityKey !== 'undefined') anvilPackReadyRarityKey = null;
            if (typeof anvilIsProcessing !== 'undefined') anvilIsProcessing = false;
            showCustomAlert("Anvil staging area cleared due to version change. Cards returned to Gallery (fallback).", null, 3000);
        }
    }

    currentActiveSetVersion = currentActiveSetVersion === 'v1' ? 'v2' : 'v1';
    
    if (currentActiveSetVersion === 'v2') {
        const v2Sets = ALL_SET_DEFINITIONS.filter(set => set.version === 'v2');
        if (v2Sets.length > 0) {
            const anyV2SetUnlocked = v2Sets.some(v2Set => unlockedSets.includes(v2Set.abbr));
            if (!anyV2SetUnlocked) {
                const firstV2SetAbbr = v2Sets[0].abbr;
                if (!unlockedSets.includes(firstV2SetAbbr)) {
                    unlockedSets.push(firstV2SetAbbr);
                    const firstV2SetMeta = getSetMetadata(firstV2SetAbbr);
                    showCustomAlert(`Unlocked the first V2 set: ${firstV2SetMeta?.name || firstV2SetAbbr}!`, null, 2000);
                }
            }
        }
    }
    
    stats.updateSetVersionButton();
    updateActiveSetDependentGlobals(); 
    showCustomAlert(`Switched to ${currentActiveSetVersion.toUpperCase()} card sets.`, null, 1500);

    populatePackList();
    populateSetSelectors(); 

    updateStats(); 

    if (currentScreen === SCREENS.PACK_SELECTION) {
        showScreen(SCREENS.PACK_SELECTION, false); 
    } else if (currentScreen === SCREENS.COLLECTION) {
        showSetCollection(1);
    } else if (currentScreen === SCREENS.GALLERY) {
        showGallery(1);
    } else if (currentScreen === SCREENS.JUNK) {
        showDuplicates(1);
    } else if (currentScreen === SCREENS.ACHIEVEMENTS) {
        updateAchievementsDisplay();
    } else if (currentScreen === SCREENS.RARITY_ODDS) {
        // Rarity odds are global
    }
    
    saveGame();
};


function updateStats() {
  if (typeof document === 'undefined' || typeof packsOpened === 'undefined' ||
      typeof collection === 'undefined' || typeof moneySpent === 'undefined' ||
      typeof totalCardsInDb === 'undefined' || typeof achievements === 'undefined' ||
      typeof updateTimePlayed !== 'function' || typeof updateAchievementsDisplay !== 'function' ||
      typeof saveGame !== 'function' || typeof ALL_SET_DEFINITIONS === 'undefined' ||
      typeof getActiveSetDefinitions !== 'function' || 
      typeof anvilSuccessCheatActive === 'undefined' ||
      typeof isDebugModeActive === 'undefined' || typeof unlockAllPacksCheatActive === 'undefined') { 
    console.error("One or more dependencies for updateStats are missing.");
    return;
  }
  document.getElementById('packs-opened').textContent = packsOpened;
  
  const activeSets = getActiveSetDefinitions();
  let totalUniqueCardsOwnedInActiveVersion = 0;
  activeSets.forEach(setDef => {
    const setAbbr = setDef.abbr;
    if (collection[setAbbr]) {
      Object.keys(collection[setAbbr]).forEach(cardId => {
        if (collection[setAbbr][cardId] && collection[setAbbr][cardId].count > 0) {
          totalUniqueCardsOwnedInActiveVersion++;
        }
      });
    }
  });
  document.getElementById('total-cards-owned').textContent = totalUniqueCardsOwnedInActiveVersion;
  
  const totalCardsInActiveVersionDb = totalCardsInDb; 


  document.getElementById('money-spent').textContent = formatCurrency(moneySpent);
  updateTimePlayed();

  if (currentActiveSetVersion === 'v1') {
      achievements.masterCollectorProgressV1 = totalCardsInActiveVersionDb > 0 ? (totalUniqueCardsOwnedInActiveVersion / totalCardsInActiveVersionDb * 100) : 0;
  } else {
      achievements.masterCollectorProgressV2 = totalCardsInActiveVersionDb > 0 ? (totalUniqueCardsOwnedInActiveVersion / totalCardsInActiveVersionDb * 100) : 0;
  }


  if (currentScreen === SCREENS.ACHIEVEMENTS || document.getElementById('achievements')?.style.display === 'flex') {
    updateAchievementsDisplay();
  }

  const debugModeToggle = document.getElementById('debug-mode-toggle');
  if (debugModeToggle) {
    debugModeToggle.checked = isDebugModeActive;
  }

  const unlockAllPacksToggle = document.getElementById('unlock-all-packs-toggle');
  if (unlockAllPacksToggle) {
    unlockAllPacksToggle.checked = unlockAllPacksCheatActive;
  }

  const anvilCheatToggle = document.getElementById('anvil-50-percent-toggle');
  if (anvilCheatToggle) {
    anvilCheatToggle.checked = anvilSuccessCheatActive;
  }

  const summonTicketsCheatToggle = document.getElementById('grant-all-summon-tickets-toggle');
  if (summonTicketsCheatToggle) {
    // This checkbox now acts as a momentary button, so it should always start unchecked.
    summonTicketsCheatToggle.checked = false; 
  }

  const tokiCheatToggle = document.getElementById('add-10000-toki-toggle');
  if (tokiCheatToggle) {
    // This checkbox now acts as a momentary button, so it should always start unchecked.
    tokiCheatToggle.checked = false;
  }
  
  stats.updateSetVersionButton(); 

  saveGame();
}

function updateTimePlayed() {
  if (typeof document === 'undefined' || typeof Date === 'undefined' || 
      typeof accumulatedActiveTimeMs === 'undefined' || 
      typeof sessionStartTime === 'undefined' ||
      typeof isGameActive === 'undefined') {
    console.error("One or more dependencies for updateTimePlayed are missing.");
    const timePlayedEl = document.getElementById('time-played');
    if (timePlayedEl) timePlayedEl.textContent = 'Error';
    return;
  }

  let currentSessionActiveTimeMs = 0;
  if (isGameActive) {
      currentSessionActiveTimeMs = Date.now() - sessionStartTime;
  }
  
  const totalElapsedMs = accumulatedActiveTimeMs + currentSessionActiveTimeMs;
  const elapsedSeconds = Math.floor(totalElapsedMs / 1000);

  const h = Math.floor(elapsedSeconds / 3600);
  const m = Math.floor((elapsedSeconds % 3600) / 60);
  const s = elapsedSeconds % 60;
  document.getElementById('time-played').textContent = `${h}h ${m}m ${s}s`;
}

function confirmReset() {
  if (typeof showCustomConfirm !== 'function') {
    console.error("showCustomConfirm is not defined. Cannot proceed with reset confirmation.");
    alert("Error: Confirmation dialog is unavailable. Reset aborted.");
    return;
  }

  showCustomConfirm("Are you sure you want to reset all game progress? This cannot be undone.", () => {
    if (typeof resetGameVariables !== 'function') {
      console.error("Reset Game: resetGameVariables function is not defined!");
      showCustomAlert("Error: Reset function is missing. Cannot reset game.");
      return;
    }
    resetGameVariables(); 

    sessionStartTime = Date.now();
    isGameActive = true;
    currentActiveSetVersion = 'v1'; 
    if (typeof updateActiveSetDependentGlobals === 'function') updateActiveSetDependentGlobals(); 

    if (typeof saveGame !== 'function') {
      console.error("Reset Game: saveGame function is not defined!");
    } else {
      saveGame();
    }

    if (typeof updateBalance === 'function') updateBalance();
    if (typeof updateStats === 'function') updateStats(); 
    if (typeof populatePackList === 'function') populatePackList();

    if (typeof populateSetSelectors === 'function') populateSetSelectors();
    if (typeof populateRarityFilters === 'function') populateRarityFilters();
    if (typeof showRarityOddsScreen === 'function' && document.getElementById('rarity-odds')?.style.display === 'flex') {
        showRarityOddsScreen();
    }

    if (typeof showScreen === 'function') {
      showScreen(SCREENS.STATS);
    } else {
      console.error("showScreen function is not defined. Cannot navigate after reset.");
    }

    if (typeof stats.updateDebugSectionVisibility === 'function') stats.updateDebugSectionVisibility();


    showCustomAlert("Game has been reset.", null, 2000);
  });
}

stats.checkCheatPassword = function() { 
    const passwordInput = document.getElementById('cheat-password-input');
    if (!passwordInput) return;

    if (passwordInput.value === "aymon") { 
        cheatsPasswordEntered = true; 
        showCustomAlert("Cheats Unlocked!", null, 1500);
        stats.updateDebugSectionVisibility(); 
        updateStats();
        saveGame();
    } else {
        showCustomAlert("Incorrect password.", null, 2000);
    }
    passwordInput.value = '';
}

stats.updateDebugSectionVisibility = function() { 
    const debugSection = document.getElementById('debug-section-content');
    const passwordSection = document.getElementById('password-section');
    if (!debugSection || !passwordSection) return;

    if (cheatsPasswordEntered) { 
        debugSection.style.display = 'flex';
        passwordSection.style.display = 'none';
    } else {
        debugSection.style.display = 'none';
        passwordSection.style.display = 'flex';
    }
}

stats.toggleUnlockAllPacks = function() { 
    if (typeof document === 'undefined' || typeof unlockAllPacksCheatActive === 'undefined' || typeof showCustomAlert !== 'function' || typeof populatePackList !== 'function' || typeof saveGame !== 'function') {
        console.error("One or more dependencies for toggleUnlockAllPacks are missing.");
        return;
    }
    const toggle = document.getElementById('unlock-all-packs-toggle');
    if (!toggle) return;

    unlockAllPacksCheatActive = toggle.checked; 
    if (unlockAllPacksCheatActive) {
        showCustomAlert(`All ${currentActiveSetVersion.toUpperCase()} booster packs unlocked via cheat!`, null, 2000);
    } else {
        showCustomAlert(`Unlock all ${currentActiveSetVersion.toUpperCase()} packs cheat deactivated. Pack availability reverts to normal.`, null, 2000);
    }
    populatePackList(); 
    saveGame();
}

stats.toggleDebugMode = function() { 
    if (typeof document === 'undefined' || typeof isDebugModeActive === 'undefined' || typeof adjustProbabilitiesAndPrices !== 'function' || typeof saveGame !== 'function' || typeof showCustomAlert !== 'function') {
        console.error("One or more dependencies for toggleDebugMode are missing.");
        return;
    }
    const toggle = document.getElementById('debug-mode-toggle');
    if (!toggle) return;

    isDebugModeActive = toggle.checked; 
    adjustProbabilitiesAndPrices();
    saveGame();
    showCustomAlert(`Debug mode ${isDebugModeActive ? 'activated' : 'deactivated'}. Rarity odds ${isDebugModeActive ? 'equalized' : 'reverted to normal'}.`, null, 2000);
    
    if (currentScreen === SCREENS.RARITY_ODDS && typeof showRarityOddsScreen === 'function') {
        showRarityOddsScreen();
    }
}

stats.toggleAnvilSuccessRateCheat = function() { 
    if (typeof document === 'undefined' || typeof anvilSuccessCheatActive === 'undefined' || typeof saveGame !== 'function' || typeof showCustomAlert !== 'function') {
        console.error("One or more dependencies for toggleAnvilSuccessRateCheat are missing.");
        return;
    }
    const toggle = document.getElementById('anvil-50-percent-toggle');
    if (!toggle) return;

    anvilSuccessCheatActive = toggle.checked; 
    saveGame();
    showCustomAlert(`Anvil 50% Success Rate cheat ${anvilSuccessCheatActive ? 'activated' : 'deactivated'}.`, null, 2000);

    if (currentMiniGame === SCREENS.TRADE_UP_GAME && typeof renderAnvilScreen === 'function') {
        renderAnvilScreen();
    }
}

stats.toggleGrantAllSummonTicketsCheat = function() {
    const toggle = document.getElementById('grant-all-summon-tickets-toggle');
    if (!toggle) return;

    if (typeof summonTickets === 'undefined' || typeof summonTicketRarities === 'undefined' || 
        typeof addSummonTickets !== 'function' || typeof saveGame !== 'function' || 
        typeof showCustomAlert !== 'function' ) {
        console.error("Summon ticket system or dependencies not fully initialized.");
        toggle.checked = false; // Uncheck if dependencies are missing
        return;
    }

    if (toggle.checked) { // Only act when the checkbox is checked
        summonTicketRarities.forEach(rarityKey => {
            addSummonTickets(rarityKey, 40); // Add 40 tickets of each type
        });
        showCustomAlert("Granted 40 of each Summon Ticket type!", null, 1500);
        if (typeof playSound === 'function') playSound('sfx_toki_gain.mp3'); // Using toki gain sound for now
        saveGame();
        
        if (typeof renderSummonGameScreen === 'function' && currentMiniGame === SCREENS.SUMMON_GAME && currentScreen === SCREENS.GAMES) { 
            const gameContentEl = document.querySelector('#mini-game-content-active > .mini-game-main-content');
            if(gameContentEl) renderSummonGameScreen(gameContentEl);
        }
        toggle.checked = false; // Immediately uncheck after adding tickets
    }
    // No action needed if toggle.checked is false (i.e., when it's unchecked by the user after being auto-unchecked)
};


stats.toggleAdd10000Toki = function() {
    const toggle = document.getElementById('add-10000-toki-toggle');
    if (!toggle) return;

    if (toggle.checked) { // Only act when the checkbox is checked
        if (typeof balance === 'undefined' || typeof updateBalance !== 'function' || typeof saveGame !== 'function' || typeof showCustomAlert !== 'function') {
            console.error("One or more dependencies for toggleAdd10000Toki are missing.");
            toggle.checked = false; // Uncheck if dependencies are missing
            return;
        }
        balance += 10000;
        showCustomAlert("Added 10,000 Toki!", null, 1500);
        if (typeof playSound === 'function') playSound('sfx_toki_gain.mp3');
        updateBalance();
        saveGame();
        toggle.checked = false; // Immediately uncheck after adding Toki
    }
    // No action needed if toggle.checked is false (i.e., when it's unchecked)
};


stats.relockCheats = function() {
    cheatsPasswordEntered = false; 
    
    // Resetting cheat states for UI consistency
    isDebugModeActive = false;
    unlockAllPacksCheatActive = false;
    anvilSuccessCheatActive = false;
    // stats.summonTicketsCheatActive is no longer used for the grant cheat's new behavior.
    // The checkbox itself will be reset to unchecked.
    // No need to revert summon ticket amounts as the new cheat only adds.

    // Revert rarity odds if debug snapshot exists
    if(typeof originalPackProbsSnapshotDebug !== 'undefined' && originalPackProbsSnapshotDebug !== null) {
        if(typeof liveRarityPackPullDistribution !== 'undefined' && typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined') {
            if (Array.isArray(originalPackProbsSnapshotDebug)) {
                liveRarityPackPullDistribution = JSON.parse(JSON.stringify(originalPackProbsSnapshotDebug));
            } else {
                 console.warn("relockCheats: originalPackProbsSnapshotDebug is not an array. Defaulting liveRarityPackPullDistribution.");
                 if (Array.isArray(initialDefaultRarityPackPullDistribution)) {
                    liveRarityPackPullDistribution = JSON.parse(JSON.stringify(initialDefaultRarityPackPullDistribution));
                 } else {
                    liveRarityPackPullDistribution = []; 
                 }
            }
        }
         originalPackProbsSnapshotDebug = null;
    } else if (typeof initialDefaultRarityPackPullDistribution !== 'undefined' && initialDefaultRarityPackPullDistribution !== null && typeof liveRarityPackPullDistribution !== 'undefined') {
         if (Array.isArray(initialDefaultRarityPackPullDistribution)) {
             liveRarityPackPullDistribution = JSON.parse(JSON.stringify(initialDefaultRarityPackPullDistribution));
         } else {
             liveRarityPackPullDistribution = []; 
         }
    }
    
    if (typeof adjustProbabilitiesAndPrices === 'function') adjustProbabilitiesAndPrices();

    // Update UI toggles to unchecked state
    const debugModeToggle = document.getElementById('debug-mode-toggle');
    if (debugModeToggle) debugModeToggle.checked = false;
    const unlockPacksToggle = document.getElementById('unlock-all-packs-toggle');
    if (unlockPacksToggle) unlockPacksToggle.checked = false;
    const anvilCheatToggle = document.getElementById('anvil-50-percent-toggle');
    if (anvilCheatToggle) anvilCheatToggle.checked = false;
    const summonTicketsToggle = document.getElementById('grant-all-summon-tickets-toggle');
    if(summonTicketsToggle) summonTicketsToggle.checked = false; // Ensure it's unchecked
    const tokiCheatToggle = document.getElementById('add-10000-toki-toggle');
    if (tokiCheatToggle) tokiCheatToggle.checked = false; // Ensure it's unchecked
    
    // Update relevant game parts
    if (typeof populatePackList === 'function') populatePackList();
    if (typeof updateBalance === 'function') updateBalance(); 
    if (typeof renderSummonGameScreen === 'function' && currentMiniGame === SCREENS.SUMMON_GAME && currentScreen === SCREENS.GAMES) {
        const gameContentEl = document.querySelector('#mini-game-content-active > .mini-game-main-content');
        if(gameContentEl) renderSummonGameScreen(gameContentEl);
    }

    this.updateDebugSectionVisibility(); 
    showCustomAlert("Cheats have been re-locked and active cheats reverted.", null, 2000);
    saveGame();
};
