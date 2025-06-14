
// js/core/main.js

// Global variable to store the current screen
let currentScreen = null;
let isGameInitialized = false;
let currentMiniGame = null; 
let statsScreenTimeUpdateInterval = null; // For live time updates on stats screen

function updateActiveSetDependentGlobals() {
    if (typeof getActiveSetDefinitions !== 'function' || 
        typeof sets === 'undefined' || typeof cardsPerSet === 'undefined' || typeof totalCardsInDb === 'undefined') {
        console.error("updateActiveSetDependentGlobals: Missing core dependencies (getActiveSetDefinitions or global set arrays).");
        return;
    }
    const activeDefs = getActiveSetDefinitions();
    sets = activeDefs.map(def => def.abbr);
    cardsPerSet = activeDefs.map(def => def.count);
    totalCardsInDb = cardsPerSet.reduce((sum, num) => sum + num, 0);

    const totalCardsInDbEl = document.getElementById('total-cards-in-db');
    if (totalCardsInDbEl) totalCardsInDbEl.textContent = totalCardsInDb;
}


function showScreen(screenId, performSave = true) {
    if (!isGameInitialized && screenId !== SCREENS.STATS && screenId !== currentScreen) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("Game is still initializing. Please wait a moment.", null, 1500);
        }
        return;
    }

    const isPackOpeningVisible = document.getElementById('pack-opening-desktop')?.style.display === 'flex';

    if (currentScreen === SCREENS.PACK_SELECTION && isPackOpeningVisible &&
        typeof openingpack !== 'undefined' && !openingpack.areAllCardsInPackRevealed() && !isOpeningAnvilPack && !isOpeningSummonPack) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("Please reveal all cards in the current pack before leaving or changing screens.");
        }
        return;
    }

    const anvilIsCurrentlyProcessingForge = typeof window.isAnvilGloballyAnimating === 'function' && window.isAnvilGloballyAnimating();
    if (currentMiniGame === SCREENS.TRADE_UP_GAME && anvilIsCurrentlyProcessingForge &&
        screenId !== SCREENS.GAMES && screenId !== SCREENS.PACK_SELECTION) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("Anvil is currently processing. Please wait.");
        }
        return;
    }
    
    // Handle stopping Idle Exhibition
    if (currentMiniGame === SCREENS.IDLE_EXHIBITION && screenId !== SCREENS.IDLE_EXHIBITION && screenId !== SCREENS.COLLECTION && screenId !== SCREENS.GAMES) {
        const miniGameAreaActive = document.getElementById('mini-game-content-active')?.style.display === 'flex';
        if (miniGameAreaActive || currentScreen === SCREENS.IDLE_EXHIBITION) { 
            if (typeof idleExhibition !== 'undefined' && idleExhibition.stopIdleExhibitionGame) {
                idleExhibition.stopIdleExhibitionGame();
            }
        }
    }
    // Handle stopping Fishing Game
    if (currentMiniGame === SCREENS.FISHING_GAME && screenId !== SCREENS.FISHING_GAME && screenId !== SCREENS.GAMES) {
        const miniGameAreaActive = document.getElementById('mini-game-content-active')?.style.display === 'flex';
         if (miniGameAreaActive || currentScreen === SCREENS.FISHING_GAME) { // currentScreen check might be redundant if miniGameAreaActive is reliable
            if (typeof stopFishingGame === 'function') { // stopFishingGame now in fishing-main.js
                stopFishingGame();
            }
        }
    }


    document.querySelectorAll('#main-screen-content-area > div.screen').forEach(el => el.style.display = 'none');
    const screenElement = document.getElementById(screenId);
    if (screenElement) screenElement.style.display = 'flex';
    

    const oldScreen = currentScreen; 
    currentScreen = screenId;
    if (oldScreen !== currentScreen && typeof playSound === 'function') {
        playSound('sfx_screen_transition.mp3');
    }


    if (currentMiniGame && 
        screenId !== currentMiniGame && // Not staying in the current mini-game
        screenId !== SCREENS.GAMES && // Not going to the main mini-games menu
        !(currentMiniGame === SCREENS.TRADE_UP_GAME && screenId === SCREENS.GALLERY) && // Anvil can go to Gallery
        !(currentMiniGame === SCREENS.TRADE_UP_GAME && screenId === SCREENS.PACK_SELECTION) && // Anvil can go to Pack Opening
        !(currentMiniGame === SCREENS.DIRECT_OFFER_GAME && screenId === SCREENS.GALLERY) && // Offer can go to Gallery
        !(currentMiniGame === SCREENS.IDLE_EXHIBITION && screenId === SCREENS.COLLECTION) // Idle Exhibition can go to Collection
        ) {
        
        // TEMP: Disabled automatic clearAnvilStateOnLeave to test persistence
        // if (currentMiniGame === SCREENS.TRADE_UP_GAME && typeof anvilgame !== 'undefined' && anvilgame.clearAnvilStateOnLeave) anvilgame.clearAnvilStateOnLeave();
        if (currentMiniGame === SCREENS.DIRECT_OFFER_GAME && typeof offergame !== 'undefined' && offergame.clearOfferStateOnLeave) offergame.clearOfferStateOnLeave();
        
        if (currentMiniGame !== SCREENS.IDLE_EXHIBITION && currentMiniGame !== SCREENS.FISHING_GAME) { // Keep Idle Ex and Fishing active if navigating to certain related screens
             currentMiniGame = null;
        }
    }
    
    if (screenId === SCREENS.GAMES) { // If navigating TO the main mini-games menu
         if (document.getElementById('game-selection')?.style.display === 'grid') { // And the selection grid is visible
            if (currentMiniGame === SCREENS.IDLE_EXHIBITION && typeof idleExhibition !== 'undefined' && idleExhibition.stopIdleExhibitionGame) {
                idleExhibition.stopIdleExhibitionGame(); 
            }
            if (currentMiniGame === SCREENS.FISHING_GAME && typeof stopFishingGame === 'function') {
                stopFishingGame();
            }
            currentMiniGame = null; // Clear any active mini-game
         }
    }


    if (screenId === SCREENS.PACK_SELECTION) {
        if (!isOpeningAnvilPack && !isOpeningSummonPack) {
            const packOpeningEl = document.getElementById('pack-opening-desktop');
            if (packOpeningEl) packOpeningEl.style.display = 'none';
            
            const packListEl = document.getElementById('pack-list');
            if (packListEl) packListEl.style.display = 'grid'; // Ensure grid display
            
            const packSelectionScreenEl = document.getElementById('pack-selection');
            if (packSelectionScreenEl) {
                const packSelectionTitle = packSelectionScreenEl.querySelector('h2');
                if (packSelectionTitle) packSelectionTitle.style.display = 'block';
                const filterControls = packSelectionScreenEl.querySelector('.collection-controls');
                if (filterControls) filterControls.style.display = 'flex'; // Ensure filter controls are visible
                const packSelectionPaginationEl = document.getElementById('pack-selection-pagination');
                if (packSelectionPaginationEl) {
                    packSelectionPaginationEl.style.display = 'flex'; // Ensure pagination is visible
                }
            }


            // Call populatePackList for the first page when navigating to pack selection
            if (typeof populatePackList === 'function') {
                populatePackList(1); // Default to page 1
            }
        }
    } else if (screenId === SCREENS.GAMES) {
        document.getElementById('game-selection').style.display = 'grid';
        const ma = document.getElementById('mini-game-area');
        if (ma) {
            const predWrapper = document.getElementById('prediction-game-wrapper');
            if (predWrapper) predWrapper.style.display = 'none';
            const generalContentActive = document.getElementById('mini-game-content-active');
            if (generalContentActive) generalContentActive.style.display = 'none';
            ma.style.display = 'none';
        }
        const gamesScreenMainTitle = document.querySelector('#games-screen > h2');
        if (gamesScreenMainTitle) gamesScreenMainTitle.style.display = 'block';
        
        const totalOwnedSpan = document.getElementById('total-cards-owned');
        const uniqueCards = totalOwnedSpan ? parseInt(totalOwnedSpan.textContent || '0') : 0;

        const holGameOption = document.getElementById('hol-game-option');
        if (holGameOption) {
            const holTitleH3 = holGameOption.querySelector('h3');
            if (uniqueCards < 100) {
                holGameOption.classList.add('disabled-game-option');
                holGameOption.onclick = () => { if (typeof showCustomAlert === 'function') showCustomAlert("You need to own at least 100 unique cards to play Higher or Lower.", null, 2500); };
                if (holTitleH3) holTitleH3.innerHTML = 'Higher or Lower? <span class="lock-icon">🔒</span> <span class="lock-message">(Need 100+ unique cards)</span>';
            } else {
                holGameOption.classList.remove('disabled-game-option');
                holGameOption.onclick = () => { if (typeof loadMiniGame === 'function') loadMiniGame(SCREENS.HIGHER_OR_LOWER); if (typeof playSound === 'function') playSound('sfx_minigame_start.mp3'); };
                if (holTitleH3) holTitleH3.textContent = 'Higher or Lower?';
            }
        }

        const silhouetteGameOption = document.getElementById('silhouette-quiz-game-option');
        if (silhouetteGameOption) {
            const silhouetteTitleH3 = silhouetteGameOption.querySelector('h3');
            if (uniqueCards < 100) {
                silhouetteGameOption.classList.add('disabled-game-option');
                silhouetteGameOption.onclick = () => { if (typeof showCustomAlert === 'function') showCustomAlert("You need to own at least 100 unique cards to play Silhouette Quiz.", null, 2500); };
                if (silhouetteTitleH3) silhouetteTitleH3.innerHTML = 'Silhouette Quiz <span class="lock-icon">🔒</span> <span class="lock-message">(Need 100+ unique cards)</span>';
            } else {
                silhouetteGameOption.classList.remove('disabled-game-option');
                silhouetteGameOption.onclick = () => { if (typeof loadMiniGame === 'function') loadMiniGame(SCREENS.SILHOUETTE_QUIZ); if (typeof playSound === 'function') playSound('sfx_minigame_start.mp3'); };
                if (silhouetteTitleH3) silhouetteTitleH3.textContent = 'Silhouette Quiz';
            }
        }
    }

    if (screenId === SCREENS.STATS) {
        if (typeof updateTimePlayed === 'function') updateTimePlayed(); 
        if (statsScreenTimeUpdateInterval === null && typeof updateTimePlayed === 'function') {
            statsScreenTimeUpdateInterval = setInterval(updateTimePlayed, 1000);
        }
    } else {
        if (statsScreenTimeUpdateInterval !== null) {
            clearInterval(statsScreenTimeUpdateInterval);
            statsScreenTimeUpdateInterval = null;
        }
    }

    if (screenId === SCREENS.COLLECTION && typeof showSetCollection === 'function') showSetCollection(1);
    if (screenId === SCREENS.GALLERY && typeof showGallery === 'function') showGallery(1);
    if (screenId === SCREENS.JUNK && typeof showDuplicates === 'function') showDuplicates(1);
    if (screenId === SCREENS.ACHIEVEMENTS && typeof updateAchievementsDisplay === 'function') updateAchievementsDisplay();
    if (screenId === SCREENS.STATS && typeof updateStats === 'function') updateStats();
    if (screenId === SCREENS.RARITY_ODDS && typeof showRarityOddsScreen === 'function') showRarityOddsScreen();
    // Summon Game, Fishing Game are loaded via loadMiniGame
    

    if (performSave && typeof saveGame === 'function') {
        saveGame();
    }
}


function initGame() {
  isGameInitialized = false;
  document.documentElement.lang = 'en';

  const loadingBarContainer = document.getElementById('loading-bar-container');
  const loadingBarProgress = document.getElementById('loading-bar-progress');

  if (loadingBarContainer && loadingBarProgress) {
    loadingBarContainer.style.display = 'block';
    loadingBarProgress.style.width = '10%';
  }

  if (typeof ALL_SET_DEFINITIONS === 'undefined') {
      console.error("FATAL: ALL_SET_DEFINITIONS not loaded from js/data/card-definitions.js. Game cannot initialize properly.");
      if (loadingBarContainer) loadingBarContainer.style.display = 'none';
      if (typeof showCustomAlert === 'function') showCustomAlert("Critical Error: Card definitions not loaded. Please refresh or check console.", null, 0);
      return;
  }
  if (typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined' || typeof getCardIntrinsicRarity !== 'function') {
      console.error("FATAL: Rarity system not loaded from js/data/card-rarity-definitions.js and js/core/rarity-grade-manager.js. Game cannot initialize properly.");
      if (loadingBarContainer) loadingBarContainer.style.display = 'none';
      if (typeof showCustomAlert === 'function') showCustomAlert("Critical Error: Rarity system not loaded. Please refresh or check console.", null, 0);
      return;
  }
   if (typeof initializeRarityAndGradeSystems !== 'function' || typeof getFixedGradeAndPrice !== 'function') {
      console.error("FATAL: Card odds system not loaded from js/core/rarity-grade-manager.js. Game cannot initialize properly.");
      if (loadingBarContainer) loadingBarContainer.style.display = 'none';
      if (typeof showCustomAlert === 'function') showCustomAlert("Critical Error: Card odds system not loaded. Please refresh or check console.", null, 0);
      return;
  }

  let screenToDisplayOnLoad = SCREENS.STATS;
  let miniGameToLoadOnLoad = null;

  if (typeof loadGame === 'function') {
      loadGame(); // This loads currentActiveSetVersion among other things
      if (typeof initializeLastTicketRewardTimesState === 'function') { 
          initializeLastTicketRewardTimesState(); 
      }
      
      screenToDisplayOnLoad = currentScreen || SCREENS.STATS;
      miniGameToLoadOnLoad = currentMiniGame || null; // Load currentMiniGame state
      
      // Ensure fishing game state is loaded if it exists in miniGameData
      if ( (typeof fishingGameState !== 'undefined' && typeof loadPersistentFishingState === 'function' && typeof miniGameData === 'object' && miniGameData.fishingGame) ) {
        loadPersistentFishingState(miniGameData.fishingGame);
      }


      if (miniGameToLoadOnLoad && (miniGameToLoadOnLoad === SCREENS.SUMMON_GAME || miniGameToLoadOnLoad === SCREENS.IDLE_EXHIBITION || miniGameToLoadOnLoad === SCREENS.FISHING_GAME || Object.values(SCREENS).includes(miniGameToLoadOnLoad))) {
          screenToDisplayOnLoad = SCREENS.GAMES; 
      } else if (screenToDisplayOnLoad === SCREENS.SUMMON_GAME || screenToDisplayOnLoad === SCREENS.IDLE_EXHIBITION || screenToDisplayOnLoad === SCREENS.FISHING_GAME) {
          miniGameToLoadOnLoad = screenToDisplayOnLoad;
          screenToDisplayOnLoad = SCREENS.GAMES;
      }
      if (loadingBarProgress) loadingBarProgress.style.width = '40%';
  } else {
      console.error("loadGame function not found! Resetting game variables.");
      if(typeof resetGameVariables === 'function') resetGameVariables(); 
      sessionStartTime = Date.now();
      isGameActive = true;
      if (loadingBarProgress) loadingBarProgress.style.width = '30%';
  }

  // Call this *after* loadGame() has potentially set currentActiveSetVersion
  updateActiveSetDependentGlobals(); 

  // unlockedSets should ideally filter by version if it's a new game or if not loaded.
  // resetGameVariables and loadGame handle initializing unlockedSets correctly for the active version.
  // The following is a fallback if somehow it's still empty after load/reset.
  if (!unlockedSets || unlockedSets.length === 0) {
    const firstActiveSet = getActiveSetDefinitions()[0];
    unlockedSets = firstActiveSet ? [firstActiveSet.abbr] : [];
  }

  initializeSetMappings();
  initializeRarityAndGradeSystems();
  // initializeSummonTickets(); // Removed: loadGame() or resetGameVariables() handles this
  if (typeof initializeLastTicketRewardTimesState === 'function') { 
    initializeLastTicketRewardTimesState();
  }
  // Idle Exhibition and Fishing Game states are loaded within loadGame, or initialized if no save.

  if (loadingBarProgress) loadingBarProgress.style.width = '20%';


  if (typeof updateBalance === 'function') updateBalance();
  if (typeof populatePackList === 'function') populatePackList(1); // Load page 1 on init
  if (loadingBarProgress) loadingBarProgress.style.width = '60%';

  if (typeof populateSetSelectors === 'function') populateSetSelectors(); 
  if (typeof populateRarityFilters === 'function') populateRarityFilters(); 
  if (loadingBarProgress) loadingBarProgress.style.width = '75%';

  if (typeof updateStats === 'function') updateStats(); 
  if (typeof stats !== 'undefined' && typeof stats.updateDebugSectionVisibility === 'function') stats.updateDebugSectionVisibility();

  const desktopMenuButtons = document.querySelectorAll('#menu .menu-buttons-group .menu-nav-button');
  desktopMenuButtons.forEach(button => {
      const buttonId = button.id;
      let icon = '?';
      let originalButtonText = button.dataset.text || button.textContent.trim() || "Menu";
      let labelText = originalButtonText;

      if (buttonId === 'toki-display') {
          icon = '💰'; 
          button.innerHTML = ''; 
          const iconSpan = document.createElement('span');
          iconSpan.className = 'menu-icon';
          iconSpan.textContent = icon;
          button.appendChild(iconSpan);
          const balanceSpan = document.createElement('span');
          balanceSpan.id = 'toki-value'; 
          balanceSpan.className = 'toki-balance-amount';
          const currentBalance = (typeof balance !== 'undefined') ? balance : 0;
          balanceSpan.textContent = currentBalance.toLocaleString();
          button.appendChild(balanceSpan);
          button.title = originalButtonText + ': ' + formatCurrency(currentBalance);
      } else {
          if (buttonId === 'stats-button') icon = '📊';
          else if (buttonId === 'pack-selection-button') {icon = '🎁'; labelText = "Packs";}
          else if (buttonId === 'collection-button') icon = '📚';
          else if (buttonId === 'gallery-button') icon = '🖼️';
          else if (buttonId === 'games-screen-button') {icon = '🎮'; labelText = "Games";}
          
          button.title = originalButtonText;
          button.innerHTML = `<span class="menu-icon">${icon}</span><span class="menu-text">${labelText}</span>`;
      }
      button.classList.add('desktop-icon-text'); 
  });
  if (typeof updateBalance === 'function') updateBalance(); 


  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (isGameActive) { 
            accumulatedActiveTimeMs += (Date.now() - sessionStartTime);
            isGameActive = false;
            if (currentMiniGame === SCREENS.FISHING_GAME && typeof fishingGameState !== 'undefined') fishingGameState.isGameActive = false;
        }
    } else {
        if (!isGameActive) { 
            sessionStartTime = Date.now();
            isGameActive = true;
             if (currentMiniGame === SCREENS.FISHING_GAME && typeof fishingGameState !== 'undefined') fishingGameState.isGameActive = true;
        }
    }
  });


  setInterval(() => {
    if (currentScreen !== SCREENS.STATS && typeof updateTimePlayed === 'function') {
      // Empty block from original code
    }
    if (typeof checkTimeBasedRewards === 'function') {
        checkTimeBasedRewards(); 
    }
    
  }, 1000 * 30); 
  if(typeof updateTimePlayed === 'function') updateTimePlayed(); 
  if (typeof checkTimeBasedRewards === 'function') { 
      checkTimeBasedRewards(); 
  }


  document.querySelectorAll('.detail-image-container-frameless').forEach(container => {
    container.addEventListener('mousemove', function(event) {
        if (typeof applyCardHoverEffects === 'function') applyCardHoverEffects(event, this);
    });
    container.addEventListener('mouseleave', function(event) {
        if (typeof resetCardHoverEffects === 'function') resetCardHoverEffects(this);
    });
  });

  if (loadingBarProgress) loadingBarProgress.style.width = '90%';
  isGameInitialized = true;
  console.log("Game initialized.");
  if (typeof playSound === 'function') playSound('sfx_game_start.mp3');


  setTimeout(() => {
    if (loadingBarProgress) loadingBarProgress.style.width = '100%';
    
    if (miniGameToLoadOnLoad) {
        if (typeof showScreen === 'function') showScreen(SCREENS.GAMES, false);
        else console.error("showScreen is not a function at initGame setTimeout for miniGameToLoadOnLoad");
        if (typeof loadMiniGame === 'function') loadMiniGame(miniGameToLoadOnLoad);
    } else if (screenToDisplayOnLoad === SCREENS.PACK_SELECTION && typeof openingpack !== 'undefined' && openingpack.currentPack && openingpack.currentPack.length > 0 && !openingpack.areAllCardsInPackRevealed()) {
        if (typeof showScreen === 'function') showScreen(SCREENS.PACK_SELECTION, false);
        else console.error("showScreen is not a function at initGame setTimeout for pack selection resume");
        if (typeof openingpack.showCorrectPackOpeningUI === 'function') {
            openingpack.showCorrectPackOpeningUI(); 
        }
    } else if (screenToDisplayOnLoad && document.getElementById(screenToDisplayOnLoad)) {
        if (typeof showScreen === 'function') showScreen(screenToDisplayOnLoad);
        else console.error("showScreen is not a function at initGame setTimeout for general screen load");
    } else {
        if (typeof showScreen === 'function') showScreen(SCREENS.STATS); 
        else console.error("showScreen is not a function at initGame setTimeout for fallback to STATS");
    }

    if (loadingBarContainer && loadingBarProgress) {
        setTimeout(() => {
            if (loadingBarContainer) loadingBarContainer.style.display = 'none';
            if (loadingBarProgress) loadingBarProgress.style.width = '0%';
        }, 500);
    }
  }, 0);
}

document.addEventListener('DOMContentLoaded', initGame);
