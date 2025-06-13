
// anvilgame.js

const ANVIL_CONSUME_REQUIREMENT = 5;
// anvilSuccessRates are defined based on RARITY_PACK_PULL_DISTRIBUTION keys
const anvilSuccessRates = {
    // Input Rarity Key: [successChance (0-1), successOutputRarityKey, failureOutputRarityKey]
    'base':  [0.95, 'rare',  'base'], 
    'rare':  [0.80, 'foil',  'rare'],
    'foil':  [0.70, 'holo',  'foil'],
    'holo':  [0.60, 'star',  'holo'],
    'star':  [0.40, 'rainy', 'star'],
    'rainy': [0.25, 'gold',  'rainy'],
    'gold':  [0.75, 'shiny', 'gold'] // Standard upgrade for Gold (e.g., 75% to Shiny, 25% Gold back)
                                       // The 5-gold-card special forge will bypass this for outcome.
};


var anvilgame = anvilgame || {}; // Ensure anvilgame object exists for global properties
anvilgame.stagedCards = []; // Stores { setIdentifier, cardId, rarityKey, grade, price, instanceId (unique for anvil), gallerySourceInstanceId }
anvilgame.lastAnvilOutputRarityKey = null; // To store the actual output rarity key for the pack opening screen
anvilgame.lastAnvilInputRarityKey = null; // To store the input rarity key for the pack opening screen (description)

let anvilUiFilterRarity = 'all'; // Rarity key string or 'all'
let anvilPackReadyRarityKey = null; // Rarity key string of the ready pack
let anvilIsProcessing = false; 


function isAnvilGloballyAnimating() {
    return anvilIsProcessing;
}

anvilgame.clearAnvilForVersionChange = function(versionBeingLeft) {
    if (anvilgame.stagedCards && anvilgame.stagedCards.length > 0) {
        let cardsReturnedCount = 0;
        
        anvilgame.stagedCards.forEach(card => {
            if (typeof updateCollectionSingleCard === 'function') {
                updateCollectionSingleCard({
                    set: card.setIdentifier,
                    cardId: card.cardId,
                    rarityKey: card.rarityKey,
                    grade: card.grade,
                    price: card.price
                }, 1); // Add one back to collection
                cardsReturnedCount++;
            } else {
                console.error("clearAnvilForVersionChange: updateCollectionSingleCard function is missing. Cannot return card:", card);
            }
        });

        const oldStagedCardsCount = anvilgame.stagedCards.length;
        anvilgame.stagedCards = [];
        anvilUiFilterRarity = 'all';
        anvilPackReadyRarityKey = null;
        
        if (anvilIsProcessing) {
            console.warn("Anvil was processing during version change clear. This might be unexpected. Resetting processing state.");
            anvilIsProcessing = false;
        }

        if (oldStagedCardsCount > 0) {
            showCustomAlert(`Anvil staging area cleared due to switching from ${versionBeingLeft.toUpperCase()}. ${cardsReturnedCount} card(s) returned to your Gallery.`, null, 3500);
        }

        if (currentMiniGame === SCREENS.TRADE_UP_GAME && typeof renderAnvilScreen === 'function' && document.getElementById('anvil-staging-area')) {
            renderAnvilScreen();
        }
        if (typeof saveGame === 'function') saveGame();
    }
};


function startAnvilGame(gameContentEl, gameResultEl) {
    if (!gameContentEl) return;
    
    gameContentEl.innerHTML = `
        <div id="anvil-controls-container">
            <div id="anvil-staging-filter-container">
                <label for="anvil-staging-filter-rarity" class="text-sm">Filter Staged Cards:</label>
                <select id="anvil-staging-filter-rarity"></select>
            </div>
        </div>
        <div id="anvil-main-area">
            <div id="anvil-staging-area-container">
                <h4>Your Staged Cards (Click to Return to Gallery)</h4>
                <div id="anvil-staging-area" class="gallery-grid"></div>
                <p id="anvil-staging-area-status" class="text-xs text-center mt-2"></p>
            </div>
            <div id="anvil-pack-container">
                <div id="anvil-pack-slot" title="Requires ${ANVIL_CONSUME_REQUIREMENT} cards of the same non-Shiny rarity in Staging Area">
                    <img src="gui/anvil_covers/anvilpack.png" alt="Anvil Pack" id="anvil-pack-image">
                </div>
                <p id="anvil-pack-status-text" class="text-xs text-center mt-1">Forge your cards!</p>
            </div>
        </div>
        <p class="text-center mt-4 text-sm">Add cards from your Gallery. If ${ANVIL_CONSUME_REQUIREMENT} cards of the same non-Shiny rarity are staged, the Anvil Pack (above) activates. Click it to consume the cards and open your upgraded result in the Pack Opening screen!</p>
    `;

    const filterSelector = document.getElementById('anvil-staging-filter-rarity');
    if (!filterSelector || typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined') {
        console.error("Anvil: Critical data missing for filter selector setup.");
        gameContentEl.innerHTML = "<p>Error: Anvil cannot be initialized due to missing rarity configuration.</p>";
        return;
    }

    filterSelector.innerHTML = '<option value="all">All Rarities</option>';
    RARITY_PACK_PULL_DISTRIBUTION.forEach(tier => {
        if (tier.key === 'shiny') return; 
        const option = document.createElement('option');
        option.value = tier.key;
        option.textContent = tier.name;
        filterSelector.appendChild(option);
    });
    filterSelector.value = anvilUiFilterRarity;
    filterSelector.onchange = function() {
        if (anvilIsProcessing) return;
        anvilUiFilterRarity = this.value;
        if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3');
        renderAnvilScreen();
    };

    const packSlot = document.getElementById('anvil-pack-slot');
    if (packSlot) packSlot.onclick = handleAnvilPackClick;

    const returnToGalleryBtn = document.getElementById('tradeUpGame-return-to-gallery-btn'); // ID is set by loadMiniGame
    if (returnToGalleryBtn) {
        returnToGalleryBtn.onclick = () => { showScreen(SCREENS.GALLERY); if (typeof playSound === 'function') playSound('sfx_button_click.mp3'); };
        returnToGalleryBtn.disabled = false; // Explicitly ensure it's enabled
    }
    
    renderAnvilScreen();
    if (gameResultEl) gameResultEl.textContent = '';
    if (typeof saveGame === 'function') saveGame();
}

function addCardToAnvil(setIdentifier, cardId, rarityKey, price, grade, galleryInstanceId) {
    if (anvilIsProcessing) {
        showCustomAlert("Anvil is currently busy. Please wait."); return;
    }
     if (rarityKey === 'shiny') {
        showCustomAlert("Shiny cards cannot be used in the Anvil."); return;
    }

    const collectionCard = collection[setIdentifier]?.[cardId];
    if (!collectionCard || collectionCard.count <= 0 || collectionCard.rarityKey !== rarityKey || collectionCard.grade !== grade) {
        showCustomAlert("You don't have this specific card available in your collection for Anvil."); return;
    }
    
    collectionCard.count--; 
    
    const anvilItemUniqueId = `anvil-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    anvilgame.stagedCards.push({ 
        setIdentifier, 
        cardId: parseInt(cardId), 
        rarityKey, 
        price, 
        grade, 
        instanceId: anvilItemUniqueId, 
        gallerySourceInstanceId: galleryInstanceId 
    });

    const rarityTierInfo = getRarityTierInfo(rarityKey);
    const displayNameRarity = rarityTierInfo ? rarityTierInfo.name : rarityKey;
    showCustomAlert(`${setIdentifier}-C${cardId} (${displayNameRarity}, G${grade}) added to Anvil.`, null, 1000);
    if (typeof playSound === 'function') playSound('sfx_anvil_add_card.mp3');

    
    if (typeof saveGame === 'function') saveGame();
    if (currentScreen === SCREENS.GALLERY && typeof showGallery === 'function' && typeof galleryCurrentPage !== 'undefined') {
        showGallery(galleryCurrentPage);
    }

    if (currentMiniGame === SCREENS.TRADE_UP_GAME) {
        renderAnvilScreen();
    }
}

function removeCardFromAnvil(instanceIdToRemove) {
    if (anvilIsProcessing) {
        showCustomAlert("Anvil is currently busy. Please wait."); return;
    }

    const cardIndex = anvilgame.stagedCards.findIndex(item => item.instanceId === instanceIdToRemove);
    if (cardIndex > -1) {
        const removedItem = anvilgame.stagedCards.splice(cardIndex, 1)[0];
        
        if (typeof updateCollectionSingleCard === 'function') {
            updateCollectionSingleCard({
                set: removedItem.setIdentifier,
                cardId: removedItem.cardId,
                rarityKey: removedItem.rarityKey,
                grade: removedItem.grade,
                price: removedItem.price
            }, 1); // Add one back
        } else {
            // Fallback direct manipulation if updateCollectionSingleCard is missing (should not happen)
            const collKey = removedItem.setIdentifier;
            const cardIdKey = removedItem.cardId;
            if (collection[collKey] && collection[collKey][cardIdKey]) {
                const collCard = collection[collKey][cardIdKey];
                if (collCard.rarityKey === removedItem.rarityKey && collCard.grade === removedItem.grade) {
                     collCard.count++;
                } else { 
                     collection[collKey][cardIdKey] = { count: (collCard.count || 0) + 1, rarityKey: removedItem.rarityKey, grade: removedItem.grade, price: removedItem.price };
                }
            } else { 
                if (!collection[collKey]) collection[collKey] = {};
                collection[collKey][cardIdKey] = { count: 1, rarityKey: removedItem.rarityKey, grade: removedItem.grade, price: removedItem.price };
            }
        }

        if (typeof playSound === 'function') playSound('sfx_card_remove.mp3');
        showCustomAlert(`Card ${removedItem.setIdentifier}-C${removedItem.cardId} returned to gallery.`, null, 1000);
        if (typeof saveGame === 'function') saveGame();
        if (currentMiniGame === SCREENS.TRADE_UP_GAME) {
            renderAnvilScreen();
        }
        if (currentScreen === SCREENS.GALLERY && typeof showGallery === 'function' && typeof galleryCurrentPage !== 'undefined') {
            showGallery(galleryCurrentPage);
        }
    }
}

function renderAnvilScreen() {
    const stagingArea = document.getElementById('anvil-staging-area');
    const stagingStatus = document.getElementById('anvil-staging-area-status');
    const packSlot = document.getElementById('anvil-pack-slot');
    const packImage = document.getElementById('anvil-pack-image');
    const packStatusText = document.getElementById('anvil-pack-status-text');
    const returnToGalleryBtn = document.getElementById('tradeUpGame-return-to-gallery-btn');


    if (!stagingArea || !stagingStatus || !packSlot || !packImage || !packStatusText) return;

    if (returnToGalleryBtn) {
        returnToGalleryBtn.disabled = false; // Always enabled
    }

    stagingArea.innerHTML = '';
    const filteredStagedCards = anvilUiFilterRarity === 'all' 
        ? anvilgame.stagedCards 
        : anvilgame.stagedCards.filter(c => c.rarityKey === anvilUiFilterRarity);

    if (filteredStagedCards.length === 0) {
        stagingArea.innerHTML = `<p class="text-xs text-gray-500 p-2 text-center" style="grid-column: 1 / -1;">No cards staged matching filter.</p>`;
    } else {
        filteredStagedCards.forEach(card => {
            const cardElement = document.createElement('div');
            const cardImgSrc = getCardImagePath(card.setIdentifier, card.cardId);
            const rarityTierInfo = getRarityTierInfo(card.rarityKey);
            const displayNameRarity = rarityTierInfo ? rarityTierInfo.name : card.rarityKey;

            cardElement.className = `card ${card.rarityKey}`;
            cardElement.style.cursor = anvilIsProcessing ? 'not-allowed' : 'pointer';
            const altText = `${card.setIdentifier}-C${card.cardId}`;
            cardElement.title = `${altText} (${displayNameRarity}, G${card.grade})\nValue: ${formatCurrency(card.price)}\nClick to return to Gallery`;
            // Standardized onerror logic, using specific default dimensions 60x84 for anvil cards
            cardElement.innerHTML = `<img src="${cardImgSrc}" alt="${altText}" onerror="this.src='https://placehold.co/' + (this.naturalWidth||this.width||60) + 'x' + (this.naturalHeight||this.height||84) + '/333333/cccccc?text=' + encodeURIComponent(this.alt || 'Missing'); this.onerror=null;">`;
            if (!anvilIsProcessing) { 
                cardElement.onclick = (e) => { e.stopPropagation(); removeCardFromAnvil(card.instanceId); };
            }
            stagingArea.appendChild(cardElement);
        });
    }
    stagingStatus.textContent = `Total Staged: ${anvilgame.stagedCards.length}. Filtered: ${filteredStagedCards.length}.`;

    let tempAnvilPackReadyRarityKey = null;
    const rarityCounts = {};
    anvilgame.stagedCards.forEach(card => {
        if (card.rarityKey !== 'shiny') { 
            rarityCounts[card.rarityKey] = (rarityCounts[card.rarityKey] || 0) + 1;
        }
    });

    if (typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined') {
        for (const rarityTier of RARITY_PACK_PULL_DISTRIBUTION) { 
            const inputRarityKey = rarityTier.key;
            if (inputRarityKey === 'shiny') continue; 
            if (anvilSuccessRates.hasOwnProperty(inputRarityKey) && rarityCounts[inputRarityKey] && rarityCounts[inputRarityKey] >= ANVIL_CONSUME_REQUIREMENT) {
                tempAnvilPackReadyRarityKey = inputRarityKey;
                break; 
            }
        }
    }
    anvilPackReadyRarityKey = tempAnvilPackReadyRarityKey; 

    const inputRarityInfo = anvilPackReadyRarityKey ? getRarityTierInfo(anvilPackReadyRarityKey) : null;
    let customPackTitle = `Forge ${ANVIL_CONSUME_REQUIREMENT} cards of the same non-Shiny rarity.`;
    let customPackStatusText = 'Forge your cards!';

    if (inputRarityInfo) {
        if (anvilPackReadyRarityKey === 'gold') {
            packImage.src = `gui/anvil_covers/shiny_pack.png`; // Show Shiny pack visual
            packImage.alt = `Shiny Anvil Pack (from 5 ${inputRarityInfo.name})`;
            // Text updated to reflect 'chance'
            customPackTitle = `Click to forge 5 ${inputRarityInfo.name} cards for a *chance* at a Shiny card!`;
            customPackStatusText = `Forge 5 ${inputRarityInfo.name} for a CHANCE at a Shiny Card!`;
        } else if (anvilSuccessRates[anvilPackReadyRarityKey]) {
            const outputRarityDisplayKey = anvilSuccessRates[anvilPackReadyRarityKey][1]; // Success output key
            const outputRarityInfo = getRarityTierInfo(outputRarityDisplayKey);
            if (outputRarityInfo) {
                packImage.src = `gui/anvil_covers/${outputRarityDisplayKey}_pack.png`;
                packImage.alt = `${outputRarityInfo.name} Anvil Pack (from ${inputRarityInfo.name})`;
                customPackTitle = `Click to forge ${ANVIL_CONSUME_REQUIREMENT} ${inputRarityInfo.name} cards for a chance at a ${outputRarityInfo.name} card!`;
                customPackStatusText = `Forge ${ANVIL_CONSUME_REQUIREMENT} ${inputRarityInfo.name} for a chance at a ${outputRarityInfo.name} card!`;
            }
        }
    }
    
    if (anvilPackReadyRarityKey && inputRarityInfo) {
        packImage.onerror = function() { this.src = 'gui/anvil_covers/anvilpack.png'; this.alt = 'Anvil Pack (Default)'; this.onerror = null; };
        packSlot.classList.add('active');
        packSlot.title = customPackTitle;
        packStatusText.textContent = customPackStatusText;
        packStatusText.style.color = 'var(--material-primary)';
    } else {
        packImage.src = 'gui/anvil_covers/anvilpack.png';
        packImage.alt = 'Anvil Pack';
        packSlot.classList.remove('active');
        packSlot.title = `Requires ${ANVIL_CONSUME_REQUIREMENT} cards of the same non-Shiny rarity.`;
        packStatusText.textContent = 'Forge your cards!';
        packStatusText.style.color = 'var(--material-text-secondary-dark)';
    }
}


function handleAnvilPackClick() {
    if (anvilIsProcessing || !anvilPackReadyRarityKey) return;
    
    anvilIsProcessing = true;
    anvilgame.lastAnvilInputRarityKey = anvilPackReadyRarityKey; // Store the input rarity
    if (typeof playSound === 'function') playSound('sfx_anvil_forge.mp3');

    
    const packSlot = document.getElementById('anvil-pack-slot');
    if (packSlot) packSlot.classList.remove('active'); 
    const returnToGalleryBtn = document.getElementById('tradeUpGame-return-to-gallery-btn');
    if (returnToGalleryBtn) returnToGalleryBtn.disabled = true; 
    
    let resultRarityKeyTargetForPack; // This is the *actual* rarity of the card generated
    let transitionMessage;
    const inputRarityInfo = getRarityTierInfo(anvilPackReadyRarityKey);
    let packThemeRarityKeyForTransition; 
    let aimingForRarityName;

    if (anvilPackReadyRarityKey === 'gold') {
        packThemeRarityKeyForTransition = 'shiny'; 
        aimingForRarityName = "a special"; 

        const outcomeDistribution = SUMMON_OUTCOME_RATES['shiny'];
        if (!outcomeDistribution || Object.keys(outcomeDistribution).length === 0) {
            console.error(`Anvil: SUMMON_OUTCOME_RATES['shiny'] not defined or empty!`);
            showCustomAlert("Error: Special pack odds missing. Process aborted.", null, 3000);
            anvilIsProcessing = false;
            if (returnToGalleryBtn) returnToGalleryBtn.disabled = false;
            renderAnvilScreen();
            return;
        }
        const roll = Math.random();
        let cumulativeProb = 0;
        let foundOutcome = false;
        for (const rarityKey in outcomeDistribution) {
            if (outcomeDistribution.hasOwnProperty(rarityKey)) {
                cumulativeProb += outcomeDistribution[rarityKey];
                if (roll < cumulativeProb) {
                    resultRarityKeyTargetForPack = rarityKey;
                    foundOutcome = true;
                    break;
                }
            }
        }
        if (!foundOutcome) { 
            console.warn(`Anvil Gold Forge: Probability issue. Roll: ${roll}, Cumulative: ${cumulativeProb}. Defaulting result.`);
            const possibleKeys = Object.keys(outcomeDistribution);
            resultRarityKeyTargetForPack = possibleKeys.length > 0 ? possibleKeys[possibleKeys.length-1] : 'gold';
        }
        transitionMessage = `Forging 5 ${inputRarityInfo ? inputRarityInfo.name : 'Gold'} cards... Unveiling ${aimingForRarityName} pack!`;
    } else {
        const outcomeConfig = anvilSuccessRates[anvilPackReadyRarityKey];
        if (!outcomeConfig) {
            console.error(`Anvil: No success rate config for rarity key ${anvilPackReadyRarityKey}.`);
            showCustomAlert("Error: Anvil configuration missing. Process aborted.", null, 3000);
            anvilIsProcessing = false;
            if (returnToGalleryBtn) returnToGalleryBtn.disabled = false;
            renderAnvilScreen();
            if (typeof saveGame === 'function') saveGame();
            return;
        }
        
        let successChance = outcomeConfig[0];
        if (anvilSuccessCheatActive) successChance = Math.max(successChance, 0.50); 

        const successOutputKey = outcomeConfig[1]; 
        const failureOutputKey = outcomeConfig[2];
        
        resultRarityKeyTargetForPack = Math.random() < successChance ? successOutputKey : failureOutputKey;
        packThemeRarityKeyForTransition = successOutputKey; 
        
        const aimingForRarityInfo = getRarityTierInfo(successOutputKey);
        aimingForRarityName = aimingForRarityInfo ? aimingForRarityInfo.name : "a better";
        transitionMessage = `Forging ${ANVIL_CONSUME_REQUIREMENT} ${inputRarityInfo ? inputRarityInfo.name : 'cards'}... Aiming for ${aimingForRarityName} card!`;
    }
    
    anvilgame.lastAnvilOutputRarityKey = resultRarityKeyTargetForPack; 

    showPackTransition(transitionMessage, 2500, packThemeRarityKeyForTransition, () => {
        const cardsToConsumeIndices = [];
        for (let i = 0; i < anvilgame.stagedCards.length; i++) {
            if (anvilgame.stagedCards[i].rarityKey === anvilgame.lastAnvilInputRarityKey) { 
                cardsToConsumeIndices.push(i);
                if (cardsToConsumeIndices.length >= ANVIL_CONSUME_REQUIREMENT) break;
            }
        }
        
        cardsToConsumeIndices.sort((a,b) => b-a).forEach(index => anvilgame.stagedCards.splice(index,1));

        let resultCardSetIdentifier, resultCardId;
        let attempts = 0;
        const activeSetDefinitions = getActiveSetDefinitions(); 

        do { 
            attempts++;
            if (activeSetDefinitions.length === 0) { console.error("Anvil: No sets available in the active version to pick result card from."); break; }
            const randomSetIndex = Math.floor(Math.random() * activeSetDefinitions.length);
            const tempSetAbbr = activeSetDefinitions[randomSetIndex].abbr;
            const setMeta = getSetMetadata(tempSetAbbr); 
            if (!setMeta || setMeta.count === 0) continue;

            let potentialCardIdsInSet = Array.from({ length: setMeta.count }, (_, k) => k + 1);
            let eligibleCardIdsForResult = potentialCardIdsInSet.filter(id => getCardIntrinsicRarity(tempSetAbbr, id) === resultRarityKeyTargetForPack);
            
            if (eligibleCardIdsForResult.length > 0) {
                resultCardSetIdentifier = tempSetAbbr;
                resultCardId = eligibleCardIdsForResult[Math.floor(Math.random() * eligibleCardIdsForResult.length)];
                break;
            }
        } while (attempts < 200); 

        if (!resultCardSetIdentifier || !resultCardId) {
            console.warn(`Anvil: Could not find card with intrinsic rarity ${resultRarityKeyTargetForPack} in active sets. Picking random card as fallback.`);
            if (activeSetDefinitions.length > 0) {
                const randomSetIndexFallback = Math.floor(Math.random() * activeSetDefinitions.length);
                resultCardSetIdentifier = activeSetDefinitions[randomSetIndexFallback].abbr;
                const setMetaFallback = getSetMetadata(resultCardSetIdentifier);
                if (setMetaFallback && setMetaFallback.count > 0) {
                     resultCardId = Math.floor(Math.random() * setMetaFallback.count) + 1;
                } else { 
                     resultCardSetIdentifier = activeSetDefinitions[0].abbr; resultCardId = 1; 
                }
            } else { 
                console.error("Anvil: No active sets found for fallback card generation!");
                const emergencySet = ALL_SET_DEFINITIONS[0];
                resultCardSetIdentifier = emergencySet.abbr;
                resultCardId = 1; 
            }
        }

        const fixedProps = getFixedGradeAndPrice(resultCardSetIdentifier, resultCardId);
        
        anvilPackSource = [{
            set: resultCardSetIdentifier,
            cardId: resultCardId,
            rarityKey: fixedProps.rarityKey, 
            grade: fixedProps.grade,
            price: fixedProps.price,
            revealed: false,
            isNew: !collection[resultCardSetIdentifier]?.[resultCardId] || collection[resultCardSetIdentifier][resultCardId].count === 0,
            packIndex: 0
        }];

        isOpeningAnvilPack = true;
        anvilIsProcessing = false;
        if (returnToGalleryBtn) returnToGalleryBtn.disabled = false; 
        
        showScreen(SCREENS.PACK_SELECTION); 
        if (typeof openingpack !== 'undefined' && typeof openingpack.prepareForAnvilPack === 'function') {
            openingpack.prepareForAnvilPack();
        } else {
            console.error("openingpack.prepareForAnvilPack function is not defined!");
            isOpeningAnvilPack = false; 
            anvilPackSource = null;
            showScreen(SCREENS.GAMES); 
            loadMiniGame(SCREENS.TRADE_UP_GAME);
        }
        renderAnvilScreen(); 
        if (typeof saveGame === 'function') saveGame();
    });
}


function goToAnvilGameFromGallery() {
    if (typeof showScreen === 'function' && typeof loadMiniGame === 'function') {
        showScreen(SCREENS.GAMES);
        loadMiniGame(SCREENS.TRADE_UP_GAME);
    }
}

anvilgame.loadState = function(stagedCards, filterRarity, packReadyRarity, isProcessingState) {
    anvilgame.stagedCards = stagedCards || [];
    anvilUiFilterRarity = filterRarity || 'all';
    anvilPackReadyRarityKey = packReadyRarity || null; 
    anvilIsProcessing = isProcessingState || false;
};

anvilgame.resetState = function(returnCardsToCollection = false) {
    if (returnCardsToCollection && anvilgame.stagedCards && anvilgame.stagedCards.length > 0) {
        anvilgame.stagedCards.forEach(card => {
            if (typeof updateCollectionSingleCard === 'function') {
                 updateCollectionSingleCard({
                    set: card.setIdentifier,
                    cardId: card.cardId,
                    rarityKey: card.rarityKey,
                    grade: card.grade,
                    price: card.price
                }, 1);
            } else {
                // Fallback direct manipulation
                const collKey = card.setIdentifier;
                const cardIdKey = card.cardId;
                if (collection[collKey] && collection[collKey][cardIdKey]) {
                     const collCard = collection[collKey][cardIdKey];
                     if(collCard.rarityKey === card.rarityKey && collCard.grade === card.grade){ 
                        collCard.count++;
                     } else { 
                        collection[collKey][cardIdKey] = { count: (collCard.count || 0) + 1, rarityKey: card.rarityKey, grade: card.grade, price: card.price };
                     }
                } else { 
                    if (!collection[collKey]) collection[collKey] = {};
                    collection[collKey][cardIdKey] = { count: 1, rarityKey: card.rarityKey, grade: card.grade, price: card.price };
                }
            }
        });
    }

    anvilgame.stagedCards = []; 
    anvilUiFilterRarity = 'all';
    anvilPackReadyRarityKey = null;
    anvilIsProcessing = false;
    anvilgame.lastAnvilOutputRarityKey = null;
    anvilgame.lastAnvilInputRarityKey = null;
    if (currentMiniGame === SCREENS.TRADE_UP_GAME && document.getElementById('anvil-staging-area')) { 
        renderAnvilScreen();
    }
};

anvilgame.clearAnvilStateOnLeave = function() { 
    if (!anvilIsProcessing) { 
        // Only return cards if Anvil is not processing to avoid interrupting a forge
        // For this specific function, we are leaving the game, so returning cards is appropriate.
        anvilgame.resetState(true); // Return cards to collection
        if(typeof saveGame === 'function') saveGame();
    }
};
