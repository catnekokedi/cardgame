
// offergame.js

const MAX_PLAYER_OFFER_CARDS = 5;
var directOfferPlayerItems = [];
var directOfferOpponentOfferItems = [];
var directOfferLockedPlayerCardCount = 0;
var directOfferOpponentOfferGenerated = false;
var directOfferRequestsMade = 0;

function startDirectOfferGame(gameContentEl, gameResultEl) {
    if (!gameContentEl) return;
    gameContentEl.innerHTML = `
        <div class="direct-offer-game-content-wrapper">
            <div class="active-trade-section">
                <div class="direct-offer-interface" id="main-offer-interface">
                    <div class="offer-pool" id="direct-offer-player-pool-container">
                        <h4>Your Offer (Max ${MAX_PLAYER_OFFER_CARDS} cards)</h4>
                        <div id="direct-offer-player-pool" class="offer-pool-cards"></div>
                        <p class="text-xs text-center mt-2">Click non-locked card to remove (if no requests made).</p>
                    </div>
                    <div class="offer-pool" id="direct-offer-opponent-pool-container">
                        <h4>Opponent's Offer</h4>
                        <div id="direct-offer-opponent-pool" class="offer-pool-cards"></div>
                        <p class="text-xs text-center mt-2">Click card to view details.</p>
                    </div>
                </div>
                <div class="direct-offer-actions">
                    <button id="get-opponent-offer-btn" class="game-button" onclick="generateAndLockOpponentOffer()">Get Opponent Offer</button>
                    <button id="make-direct-offer-btn" class="game-button" onclick="attemptDirectOfferTrade()">Make Offer</button>
                </div>
            </div>

            <div id="direct-offer-reveal-area" style="display:none;">
                <h4>Trade Result!</h4>
                <p id="direct-offer-result-message"></p>
                <div class="direct-offer-interface" id="revealed-cards-interface">
                    <div class="offer-pool" id="direct-offer-revealed-player-container">
                        <h5 style="text-align:center; margin-bottom:5px;">You Gave:</h5>
                        <div id="direct-offer-revealed-card-player" class="offer-pool-cards"></div>
                    </div>
                    <div class="offer-pool" id="direct-offer-revealed-opponent-container">
                        <h5 style="text-align:center; margin-bottom:5px;">You Received:</h5>
                        <div id="direct-offer-revealed-card-opponent" class="offer-pool-cards"></div>
                    </div>
                </div>
            </div>
            <p class="direct-offer-instructions text-center mt-4 text-sm">Go to Gallery, click a card, then "ADD TO OFFER" to build your offer (only excess copies can be offered).</p>
        </div>
    `;

    const activeTradeSection = gameContentEl.querySelector('.active-trade-section');
    const revealArea = gameContentEl.querySelector('#direct-offer-reveal-area');
    if (activeTradeSection) activeTradeSection.style.display = 'flex';
    if (revealArea) revealArea.style.display = 'none';

    const returnToGalleryBtnOffer = document.getElementById('directOfferGame-return-to-gallery-btn'); // ID set by loadMiniGame
    if (returnToGalleryBtnOffer) {
        returnToGalleryBtnOffer.onclick = () => showScreen(SCREENS.GALLERY); // Always enabled
        returnToGalleryBtnOffer.disabled = false; // Explicitly ensure it's enabled
    }


    renderDirectOfferPlayerPool();
    renderDirectOfferOpponentPool();
    updateDirectOfferButtonStates();
    if (gameResultEl) gameResultEl.textContent = '';
    if (typeof saveGame === 'function') saveGame();
}

function updateDirectOfferButtonStates() {
    const getOfferBtn = document.getElementById('get-opponent-offer-btn');
    const makeOfferBtn = document.getElementById('make-direct-offer-btn');
    const returnToGalleryBtn = document.getElementById('directOfferGame-return-to-gallery-btn'); // ID from loadMiniGame

    if (!getOfferBtn || !makeOfferBtn) return;
    if (typeof directOfferPlayerItems === 'undefined' || typeof directOfferRequestsMade === 'undefined' || typeof directOfferOpponentOfferGenerated === 'undefined' || typeof directOfferLockedPlayerCardCount === 'undefined') return;


    const maxRequestsPossible = Math.min(MAX_PLAYER_OFFER_CARDS, directOfferPlayerItems.length);
    // Can request a new offer if:
    // 1. Player has items in their offer pool.
    // 2. Number of requests made is less than the maximum allowed requests.
    // 3. Not all player items are currently locked (i.e., there's at least one more card that can be locked for a new request).
    const canRequestNewOffer = directOfferPlayerItems.length > 0 &&
                               directOfferRequestsMade < maxRequestsPossible &&
                               directOfferLockedPlayerCardCount < directOfferPlayerItems.length;

    getOfferBtn.disabled = !canRequestNewOffer;
    getOfferBtn.textContent = `Get Opponent Offer (${Math.max(0, maxRequestsPossible - directOfferRequestsMade)} left)`;

    const canMakeOffer = directOfferOpponentOfferGenerated && directOfferLockedPlayerCardCount > 0;
    makeOfferBtn.disabled = !canMakeOffer;

    if (directOfferRequestsMade >= maxRequestsPossible && directOfferPlayerItems.length > 0 && directOfferOpponentOfferGenerated) {
        makeOfferBtn.textContent = "Accept Offer (Forced)";
        getOfferBtn.disabled = true;
    } else {
        makeOfferBtn.textContent = "Make Offer";
    }

    if (returnToGalleryBtn) {
        returnToGalleryBtn.disabled = false; // "To Gallery" button is always enabled
    }
}


function addCardToDirectOfferPlayerItems(setIdentifier, cardId, rarityKey, price, instanceId, grade) {
    if (typeof directOfferLockedPlayerCardCount === 'undefined' || typeof directOfferPlayerItems === 'undefined' || typeof collection === 'undefined' || typeof getCardImagePath !== 'function' || typeof getRarityTierInfo !== 'function') {
        console.error("Offer game or collection state not available.");
        showCustomAlert("Error: Offer system not ready.");
        return;
    }

    if (directOfferLockedPlayerCardCount > 0) {
        showCustomAlert("Cannot change your offer once opponent offers have started or cards are locked. Conclude the current trade first.", null, 3000);
        return;
    }
    if (directOfferPlayerItems.length >= MAX_PLAYER_OFFER_CARDS) {
        showCustomAlert(`You can add a maximum of ${MAX_PLAYER_OFFER_CARDS} cards to your offer.`);
        return;
    }
    const uniqueCardIdentifier = instanceId || `${setIdentifier}-${cardId}-${rarityKey}-${grade}-${Date.now()}`;
    if (directOfferPlayerItems.some(item => item.instanceId === uniqueCardIdentifier)) {
        showCustomAlert("This specific card instance is already in your offer."); return;
    }

    const collectionCard = collection[setIdentifier]?.[cardId];
    if (!collectionCard || collectionCard.rarityKey !== rarityKey || collectionCard.grade !== grade) {
        showCustomAlert("Card mismatch or not found in collection for the offer."); return;
    }
    if (collectionCard.count <= 1) {
        showCustomAlert("You must have more than one copy of a card to offer it (i.e., an excess card)."); return;
    }

    collectionCard.count--;
    const rarityInfo = getRarityTierInfo(rarityKey);
    const displayRarityName = rarityInfo ? rarityInfo.name : rarityKey;

    directOfferPlayerItems.push({ setIdentifier, cardId:parseInt(cardId), rarityKey, price, instanceId: uniqueCardIdentifier, grade });
    showCustomAlert(`${setIdentifier}-C${cardId} (${displayRarityName}, Grade ${grade}) added to offer.`, null, 1000);

    if (typeof saveGame === 'function') saveGame();
    if (currentScreen === SCREENS.GALLERY && typeof showGallery === 'function' && typeof galleryCurrentPage !== 'undefined') {
        showGallery(galleryCurrentPage);
    }

    if (currentMiniGame === SCREENS.DIRECT_OFFER_GAME) {
        renderDirectOfferPlayerPool();
        updateDirectOfferButtonStates();
    }
}

function renderDirectOfferPlayerPool() {
    const poolDiv = document.getElementById('direct-offer-player-pool');
    if (!poolDiv) return;
    if (typeof directOfferPlayerItems === 'undefined' || typeof directOfferLockedPlayerCardCount === 'undefined' || typeof getCardImagePath !== 'function' || typeof getRarityTierInfo !== 'function') return;


    poolDiv.innerHTML = '';
    if (directOfferPlayerItems.length === 0) {
        poolDiv.innerHTML = '<p class="text-xs text-gray-500 p-2">Your offer is empty.</p>';
    } else {
        directOfferPlayerItems.forEach((item, index) => {
            const rarityInfo = getRarityTierInfo(item.rarityKey);
            const displayRarityName = rarityInfo ? rarityInfo.name : item.rarityKey;
            const cardElement = document.createElement('div');
            const isLocked = index < directOfferLockedPlayerCardCount;
            const cardImgSrc = getCardImagePath(item.setIdentifier, item.cardId);

            cardElement.className = `card ${item.rarityKey} ${isLocked ? 'locked-in-offer' : 'player-removable-offer'}`;
            cardElement.title = `${item.setIdentifier}-C${item.cardId} (${displayRarityName})\nValue: ${formatCurrency(item.price)}, Grade: ${item.grade}${isLocked ? '\n(Locked)' : '\n(Click to remove if offer not started)'}`;
            cardElement.innerHTML = `<img src="${cardImgSrc}" alt="${item.setIdentifier}-C${item.cardId}" onerror="this.src='https://placehold.co/100x140/cccccc/000000?text=${item.setIdentifier}C${item.cardId}'">`;

            if (!isLocked && directOfferLockedPlayerCardCount === 0) {
                cardElement.style.cursor = 'pointer';
                cardElement.onclick = (e) => { e.stopPropagation(); removeCardFromDirectOfferPlayerPool(item.instanceId); };
            }
            poolDiv.appendChild(cardElement);
        });
    }
}

function removeCardFromDirectOfferPlayerPool(instanceIdToRemove) {
     if (typeof directOfferLockedPlayerCardCount === 'undefined' || typeof directOfferPlayerItems === 'undefined' || typeof collection === 'undefined') {
        console.error("Offer game or collection state not available for removal.");
        return;
    }
    if (directOfferLockedPlayerCardCount > 0) {
        showCustomAlert("Cannot remove cards once opponent offers have started or cards are locked. Conclude the current trade first.", null, 3000);
        return;
    }
    const cardIndex = directOfferPlayerItems.findIndex(item => item.instanceId === instanceIdToRemove);
    if (cardIndex > -1) {
        const removedItem = directOfferPlayerItems.splice(cardIndex, 1)[0];
        const collectionCard = collection[removedItem.setIdentifier]?.[removedItem.cardId];
        if (collectionCard && collectionCard.rarityKey === removedItem.rarityKey && collectionCard.grade === removedItem.grade) {
            collectionCard.count++;
        } else {
             console.warn("OfferGame: Card being removed from offer not found in collection or properties mismatch. Adding as new.");
             if (!collection[removedItem.setIdentifier]) collection[removedItem.setIdentifier] = {};
             collection[removedItem.setIdentifier][removedItem.cardId] = {
                count: 1,
                price: removedItem.price,
                grade: removedItem.grade,
                rarityKey: removedItem.rarityKey
             };
        }

        showCustomAlert(`Card ${removedItem.setIdentifier}-C${removedItem.cardId} returned to collection.`, null, 1000);
        if (typeof saveGame === 'function') saveGame();
        if (currentMiniGame === SCREENS.DIRECT_OFFER_GAME) {
             renderDirectOfferPlayerPool();
             updateDirectOfferButtonStates();
        }
        if (currentScreen === SCREENS.GALLERY && typeof showGallery === 'function' && typeof galleryCurrentPage !== 'undefined') {
            showGallery(galleryCurrentPage);
        }
    }
}

function generateAndLockOpponentOffer() {
     if (typeof directOfferPlayerItems === 'undefined' || typeof directOfferRequestsMade === 'undefined' || 
         typeof directOfferLockedPlayerCardCount === 'undefined' || typeof directOfferOpponentOfferItems === 'undefined' || 
         typeof directOfferOpponentOfferGenerated === 'undefined' || typeof getActiveSetDefinitions !== 'function' || // Changed
         typeof getFixedGradeAndPrice !== 'function') {
        console.error("Offer game or core game data not fully available for generating opponent offer.");
        showCustomAlert("Error: Offer system encountered a problem.");
        return;
    }

    if (directOfferPlayerItems.length === 0) { showCustomAlert("You must offer at least one card."); return; }

    const maxRequestsPossible = Math.min(MAX_PLAYER_OFFER_CARDS, directOfferPlayerItems.length);
    if (directOfferRequestsMade >= maxRequestsPossible) {
        showCustomAlert("Maximum offer requests reached for this trade. You must Make/Accept the current offer."); return;
    }
     if (directOfferLockedPlayerCardCount >= directOfferPlayerItems.length) {
        showCustomAlert("All your offered cards are already locked in negotiations. Cannot request new offer without adding more cards to your side."); return;
    }

    if (directOfferLockedPlayerCardCount < directOfferPlayerItems.length) {
        directOfferLockedPlayerCardCount++;
    }

    directOfferOpponentOfferItems = [];
    const numCardsToOfferByOpponent = Math.floor(Math.random() * 3) + 1;
    const activeSetPool = getActiveSetDefinitions(); // Use sets from current active version

    if (activeSetPool.length === 0) {
        showCustomAlert("Error: No sets available in the current version for opponent's offer. Offer generation failed.", null, 3000);
        directOfferLockedPlayerCardCount = Math.max(0, directOfferLockedPlayerCardCount -1); // Revert lock if offer fails
        return;
    }

    for (let i = 0; i < numCardsToOfferByOpponent; i++) {
        const randomSetDef = activeSetPool[Math.floor(Math.random() * activeSetPool.length)];
        const opponentSetIdentifier = randomSetDef.abbr;
        const maxCardsInOpponentSet = randomSetDef.count;
        if (maxCardsInOpponentSet === 0) { i--; continue; } // Skip if chosen set has no cards (unlikely if activeSetPool is well-formed)
        const opponentCardId = Math.floor(Math.random() * maxCardsInOpponentSet) + 1;

        const { grade: opponentGrade, price: opponentCardPrice, rarityKey: opponentRarityKey } = getFixedGradeAndPrice(opponentSetIdentifier, opponentCardId);

        directOfferOpponentOfferItems.push({
            setIdentifier: opponentSetIdentifier,
            cardId: opponentCardId,
            rarityKey: opponentRarityKey,
            price: opponentCardPrice,
            grade: opponentGrade,
            instanceId: `opponent-${Date.now()}-${i}`
        });
    }
    directOfferOpponentOfferGenerated = true;
    directOfferRequestsMade++;

    renderDirectOfferPlayerPool();
    renderDirectOfferOpponentPool();
    updateDirectOfferButtonStates();
    const revealArea = document.getElementById('direct-offer-reveal-area');
    if (revealArea) revealArea.style.display = 'none';
    if (typeof saveGame === 'function') saveGame();
}

function renderDirectOfferOpponentPool() {
    const poolDiv = document.getElementById('direct-offer-opponent-pool');
    if (!poolDiv) return;
    if (typeof directOfferOpponentOfferGenerated === 'undefined' || typeof directOfferOpponentOfferItems === 'undefined' || typeof getCardImagePath !== 'function' || typeof getRarityTierInfo !== 'function') return;


    poolDiv.innerHTML = '';

    if (!directOfferOpponentOfferGenerated || directOfferOpponentOfferItems.length === 0) {
        poolDiv.innerHTML = '<p class="text-xs text-gray-500 p-2">Opponent has not made an offer yet.</p>';
    } else {
        directOfferOpponentOfferItems.forEach(item => {
            const rarityInfo = getRarityTierInfo(item.rarityKey);
            const displayRarityName = rarityInfo ? rarityInfo.name : item.rarityKey;
            const cardElement = document.createElement('div');
            const cardImgSrc = getCardImagePath(item.setIdentifier, item.cardId);
            cardElement.className = `card ${item.rarityKey} opponent-clickable-offer`;
            cardElement.title = `${item.setIdentifier}-C${item.cardId} (${displayRarityName})\nValue: ${formatCurrency(item.price)}, Grade: ${item.grade}\n(Click to view details)`;
            cardElement.innerHTML = `<img src="${cardImgSrc}" alt="${item.setIdentifier}-C${item.cardId}" onerror="this.src='https://placehold.co/100x140/cccccc/000000?text=${item.setIdentifier}C${item.cardId}'">`;
            cardElement.onclick = () => showCardDetail(item.setIdentifier, item.cardId, item.rarityKey, 'offer-opponent', item.instanceId, item.grade);
            poolDiv.appendChild(cardElement);
        });
    }
}

function attemptDirectOfferTrade() {
    if (typeof directOfferOpponentOfferGenerated === 'undefined' || typeof directOfferLockedPlayerCardCount === 'undefined' || typeof getCardImagePath !== 'function' || typeof getRarityTierInfo !== 'function') {
         console.error("Offer game state not fully available for trade attempt.");
         showCustomAlert("Error: Offer system encountered a problem.");
        return;
    }

    if (!directOfferOpponentOfferGenerated || directOfferLockedPlayerCardCount === 0) {
        showCustomAlert("No valid offer to make. Ensure you have cards locked and have received an opponent's offer.");
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'trade-offer-image-display';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 0.3s ease-out';

    const img = document.createElement('img');
    img.src = 'gui/trade_offer.png';
    img.alt = 'Trade Offer';
    img.style.maxWidth = '70%';
    img.style.maxHeight = '70%';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '10px';
    img.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
    img.onerror = function() {
        this.alt = 'Trade Offer Image Missing';
        const errorText = document.createElement('p');
        errorText.textContent = 'Trading...';
        errorText.style.color = 'white';
        errorText.style.fontSize = '2em';
        errorText.style.fontFamily = 'var(--title-font)';
        overlay.innerHTML = '';
        overlay.appendChild(errorText);
    };

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    function proceedWithTradeLogic() {
        if (typeof directOfferPlayerItems === 'undefined' || typeof directOfferOpponentOfferItems === 'undefined' || typeof collection === 'undefined' || typeof updateCollectionSingleCard !== 'function' || typeof getRarityTierInfo !== 'function') {
             console.error("Offer game or collection state not available for trade logic.");
             showCustomAlert("Error: Offer system encountered a problem during trade processing.");
             if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            return;
        }

        const playerLockedItemsForTrade = directOfferPlayerItems.slice(0, directOfferLockedPlayerCardCount);
        const playerOfferValue = playerLockedItemsForTrade.reduce((sum, item) => sum + item.price, 0);
        const opponentOfferValue = directOfferOpponentOfferItems.reduce((sum, item) => sum + item.price, 0);

        const activeTradeSection = document.querySelector('.active-trade-section');
        const revealArea = document.getElementById('direct-offer-reveal-area');
        const resultMsg = document.getElementById('direct-offer-result-message');
        const playerRevealDiv = document.getElementById('direct-offer-revealed-card-player');
        const opponentRevealDiv = document.getElementById('direct-offer-revealed-card-opponent');

        if (!activeTradeSection || !revealArea || !resultMsg || !playerRevealDiv || !opponentRevealDiv) {
            console.error("Offer game UI elements not found for reveal.");
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            return;
        }

        activeTradeSection.style.display = 'none';
        revealArea.style.display = 'flex';

        playerRevealDiv.innerHTML = ''; opponentRevealDiv.innerHTML = '';

        const tradeSucceeded = playerOfferValue >= opponentOfferValue * 0.8;

        if (tradeSucceeded) {
            resultMsg.textContent = "Trade Successful!"; resultMsg.style.color = 'var(--material-primary)';
            playerLockedItemsForTrade.forEach(item => {
                const cardEl = document.createElement('div'); cardEl.className = `card ${item.rarityKey}`;
                const cardImgSrc = getCardImagePath(item.setIdentifier, item.cardId);
                cardEl.innerHTML = `<img src="${cardImgSrc}" alt="${item.setIdentifier}-C${item.cardId}" onerror="this.src='https://placehold.co/100x140/cccccc/000000?text=${item.setIdentifier}C${item.cardId}'">`; playerRevealDiv.appendChild(cardEl);
            });
            directOfferOpponentOfferItems.forEach(item => {
                updateCollectionSingleCard({
                    set: item.setIdentifier,
                    cardId: item.cardId,
                    rarityKey: item.rarityKey,
                    grade: item.grade,
                    price: item.price
                });
                if (typeof checkAllAchievements === 'function') checkAllAchievements(item.setIdentifier);

                if (typeof unlockedSets !== 'undefined' && !unlockedSets.includes(item.setIdentifier) &&
                    (typeof unlockAllPacksCheatActive !== 'undefined' && !unlockAllPacksCheatActive)) {
                    
                    const setMeta = getSetMetadata(item.setIdentifier);
                    if (setMeta && setMeta.version === currentActiveSetVersion) {
                        unlockedSets.push(item.setIdentifier);
                        if(setMeta && !setMeta.name.startsWith("Unknown Set")) { // Corrected: meta to setMeta
                           showCustomAlert(`New Set Unlocked: ${setMeta.name}! You can now find its booster packs.`, null, 2500); // Corrected: meta.name to setMeta.name
                        }
                        if (typeof populatePackList === 'function') populatePackList();
                    }
                }

                const cardEl = document.createElement('div'); cardEl.className = `card ${item.rarityKey}`;
                const cardImgSrcOpp = getCardImagePath(item.setIdentifier, item.cardId);
                cardEl.innerHTML = `<img src="${cardImgSrcOpp}" alt="${item.setIdentifier}-C${item.cardId}" onerror="this.src='https://placehold.co/100x140/cccccc/000000?text=${item.setIdentifier}C${item.cardId}'">`; opponentRevealDiv.appendChild(cardEl);
            });
            showCustomAlert("Trade successful! Cards have been exchanged.", null, 2000);

            const unLockedPlayerItemsExcess = directOfferPlayerItems.slice(directOfferLockedPlayerCardCount);
            unLockedPlayerItemsExcess.forEach(item => {
                 const collCard = collection[item.setIdentifier]?.[item.cardId];
                if (collCard && collCard.rarityKey === item.rarityKey && collCard.grade === item.grade) {
                    collCard.count++;
                } else {
                    if (!collection[item.setIdentifier]) collection[item.setIdentifier] = {};
                    collection[item.setIdentifier][item.cardId] = {count: 1, price: item.price, grade: item.grade, rarityKey: item.rarityKey};
                }
            });
            directOfferPlayerItems = []; 

        } else { 
            resultMsg.textContent = "Trade Failed. Opponent rejected your offer. Your LOCKED offered cards are LOST!"; resultMsg.style.color = 'var(--material-error)';
            playerLockedItemsForTrade.forEach(item => {
                const cardEl = document.createElement('div'); cardEl.className = `card ${item.rarityKey}`;
                const cardImgSrc = getCardImagePath(item.setIdentifier, item.cardId);
                cardEl.innerHTML = `<img src="${cardImgSrc}" alt="${item.setIdentifier}-C${item.cardId}" onerror="this.src='https://placehold.co/100x140/cccccc/000000?text=${item.setIdentifier}C${item.cardId}'">`; playerRevealDiv.appendChild(cardEl);
            });
            directOfferOpponentOfferItems.forEach(item => {
                const cardEl = document.createElement('div'); cardEl.className = `card ${item.rarityKey}`;
                const cardImgSrcOpp = getCardImagePath(item.setIdentifier, item.cardId);
                cardEl.innerHTML = `<img src="${cardImgSrcOpp}" alt="${item.setIdentifier}-C${item.cardId}" onerror="this.src='https://placehold.co/100x140/cccccc/000000?text=${item.setIdentifier}C${item.cardId}'">`; opponentRevealDiv.appendChild(cardEl);
            });
            showCustomAlert("Opponent rejected your offer. Your locked offered cards have been lost!", null, 2500);

            directOfferPlayerItems = directOfferPlayerItems.slice(directOfferLockedPlayerCardCount);
        }

        directOfferOpponentOfferItems = [];
        directOfferLockedPlayerCardCount = 0;
        directOfferOpponentOfferGenerated = false;
        directOfferRequestsMade = 0;

        updateDirectOfferButtonStates();
        if (typeof updateStats === 'function') updateStats();
        if (typeof saveGame === 'function') saveGame();
        if (currentScreen === SCREENS.GALLERY && typeof showGallery === 'function' && typeof galleryCurrentPage !== 'undefined') {
            showGallery(galleryCurrentPage);
        }
    }

    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            proceedWithTradeLogic();
        }, 300);
    }, 1000);
}

function goToOfferGameFromGallery() {
    if (typeof showScreen === 'function' && typeof loadMiniGame === 'function') {
        showScreen(SCREENS.GAMES);
        loadMiniGame(SCREENS.DIRECT_OFFER_GAME);
    }
}

var offergame = offergame || {};
offergame.loadState = function(playerItems, opponentItems, lockedCount, opponentGenerated, requestsMade) {
    directOfferPlayerItems = playerItems || [];
    directOfferOpponentOfferItems = opponentItems || [];
    directOfferLockedPlayerCardCount = lockedCount || 0;
    directOfferOpponentOfferGenerated = opponentGenerated || false;
    directOfferRequestsMade = requestsMade || 0;
};
offergame.resetState = function() {
    if (directOfferPlayerItems && directOfferPlayerItems.length > 0) {
        directOfferPlayerItems.forEach(item => {
            const collCard = collection[item.setIdentifier]?.[item.cardId];
            if (collCard && collCard.rarityKey === item.rarityKey && collCard.grade === item.grade) {
                collCard.count++;
            } else {
                if (!collection[item.setIdentifier]) collection[item.setIdentifier] = {};
                collection[item.setIdentifier][item.cardId] = {count: 1, price: item.price, grade: item.grade, rarityKey: item.rarityKey};
            }
        });
    }

    directOfferPlayerItems = [];
    directOfferOpponentOfferItems = [];
    directOfferLockedPlayerCardCount = 0;
    directOfferOpponentOfferGenerated = false;
    directOfferRequestsMade = 0;

    if (currentMiniGame === SCREENS.DIRECT_OFFER_GAME) {
        const activeTradeSection = document.querySelector('.active-trade-section');
        const revealArea = document.getElementById('direct-offer-reveal-area');
        if(activeTradeSection) activeTradeSection.style.display = 'flex';
        if(revealArea) revealArea.style.display = 'none';
        renderDirectOfferPlayerPool();
        renderDirectOfferOpponentPool();
        updateDirectOfferButtonStates();
    }
};

offergame.clearOfferStateOnLeave = function() {
    if (directOfferLockedPlayerCardCount > 0) {
        return;
    }

    if (directOfferOpponentOfferGenerated) {
        directOfferOpponentOfferItems = [];
        directOfferOpponentOfferGenerated = false;
        directOfferRequestsMade = 0; 
        if (typeof saveGame === 'function') saveGame();
    }
};
