
// js/ui/screens/packOpening.js

var openingpack = openingpack || {};

openingpack.currentSet = null;
openingpack.currentSetPackPrice = 100;
openingpack.currentPack = []; // Stores { set, cardId, rarityKey, grade, price, revealed, isNew, packIndex }
openingpack.revealedCardIndices = new Set(); // Tracks indices of cards *manually* revealed by click
openingpack.packOpeningSource = 'standard'; // 'standard', 'anvil', 'summon', 'fishing'

openingpack.areAllCardsInPackRevealed = function() {
    return openingpack.currentPack.length === 0 || openingpack.currentPack.every(card => card.revealed);
};

// Removed openingpack.getGradeIcon function as icons are now CSS-driven

openingpack.openPack = function(setAbbrIdentifier, price) {
    if (!this.areAllCardsInPackRevealed() && this.currentPack.length > 0) {
        showCustomAlert("Please reveal all cards in the current pack before opening a new one.");
        return;
    }
    if (balance < price) {
        showCustomAlert('Not enough Toki to buy this pack!');
        return;
    }
    balance -= price;
    moneySpent += price;
    packsOpened++;
    this.currentSet = setAbbrIdentifier;
    this.currentSetPackPrice = price;
    updateBalance();
    if (typeof updateStats === 'function') updateStats(); // Update stats (and save) once when pack is bought
    if (typeof playSound === 'function') playSound('sfx_toki_spend.mp3');


    const newCards = this.generatePack(setAbbrIdentifier);
    this.currentPack = newCards;
    this.revealedCardIndices.clear();
    this.packOpeningSource = 'standard'; // Set source for standard pack opening
    this.showCorrectPackOpeningUI();
    if (typeof playSound === 'function') playSound('sfx_pack_open_start.mp3');
};

openingpack.generatePack = function(setAbbrIdentifier) {
    const packCards = [];
    const setMeta = getSetMetadata(setAbbrIdentifier);
    if (!setMeta || setMeta.name.startsWith("Unknown Set") || setMeta.count === 0) {
        console.error(`generatePack: Invalid set or 0 cards for setAbbr: ${setAbbrIdentifier}.`);
        return [];
    }
    if (typeof getCardIntrinsicRarity !== 'function' || typeof getFixedGradeAndPrice !== 'function' || typeof liveRarityPackPullDistribution === 'undefined') {
        console.error("generatePack: Missing critical functions or data.");
        return [];
    }

    for (let i = 0; i < 8; i++) { // Standard 8 cards per pack
        let targetPullRarityKey = 'base';
        const randomPackProb = Math.random();
        let cumulativePackProb = 0;
        for (const tier of liveRarityPackPullDistribution) {
            cumulativePackProb += tier.packProb;
            if (randomPackProb < cumulativePackProb) {
                targetPullRarityKey = tier.key;
                break;
            }
        }
        if (randomPackProb >= cumulativePackProb && cumulativePackProb < (1.0 - 0.00001) && liveRarityPackPullDistribution.length > 0) {
            targetPullRarityKey = liveRarityPackPullDistribution[0].key;
        }

        let selectedCardId = -1;
        let potentialCardIds = Array.from({ length: setMeta.count }, (_, k) => k + 1);
        let eligibleCardIds = potentialCardIds.filter(id => getCardIntrinsicRarity(setAbbrIdentifier, id) === targetPullRarityKey);
        if (eligibleCardIds.length === 0) eligibleCardIds = potentialCardIds; 
        if (eligibleCardIds.length === 0) { console.error(`generatePack: No eligible cards found for set ${setAbbrIdentifier}.`); continue; }
        selectedCardId = eligibleCardIds[Math.floor(Math.random() * eligibleCardIds.length)];

        const fixedProps = getFixedGradeAndPrice(setAbbrIdentifier, selectedCardId);
        const isNew = !collection[setAbbrIdentifier]?.[selectedCardId] || collection[setAbbrIdentifier][selectedCardId].count === 0;

        packCards.push({
            set: setAbbrIdentifier, cardId: selectedCardId, rarityKey: fixedProps.rarityKey,
            grade: fixedProps.grade, price: fixedProps.price, revealed: false, isNew, packIndex: i
        });
    }
    return packCards;
};

openingpack.prepareForAnvilPack = function() {
    if (isOpeningAnvilPack && anvilPackSource && anvilPackSource.length > 0) {
        this.currentPack = [...anvilPackSource];
        this.currentSet = 'anvil_result'; 
        this.currentSetPackPrice = 0;
        this.revealedCardIndices.clear();
        this.packOpeningSource = 'anvil'; // Set source for Anvil pack
        this.showCorrectPackOpeningUI();
        isOpeningAnvilPack = false; 
        anvilPackSource = null;
    } else {
        this.handleNextAfterResults('anvil');
    }
};

openingpack.prepareForSummonGamePack = function() {
    if (isOpeningSummonPack && summonPackSource && summonPackSource.length > 0) {
        this.currentPack = [...summonPackSource];
        this.currentSet = 'summon_result'; 
        this.currentSetPackPrice = 0;
        this.revealedCardIndices.clear();
        this.packOpeningSource = 'summon'; // Set source for Summon pack
        this.showCorrectPackOpeningUI();
        isOpeningSummonPack = false; 
        summonPackSource = [];
    } else {
        this.handleNextAfterResults('summon'); 
    }
};

openingpack.prepareForFishingRewardPack = function() {
    // Access global variables directly
    if (isOpeningFishingReward && fishingRewardPackSource && fishingRewardPackSource.length > 0) {
        this.currentPack = [...fishingRewardPackSource];
        this.currentSet = 'fishing_reward';
        this.currentSetPackPrice = 0; // No price for reward packs
        this.revealedCardIndices.clear();
        this.packOpeningSource = 'fishing'; // Set source for fishing reward
        this.showCorrectPackOpeningUI();
        isOpeningFishingReward = false;
        // fishingRewardPackSource is cleared in fish-in-sea-main.js after processing lastFishingReward
    } else {
        // If called incorrectly, navigate back to fishing game or a safe default
        console.warn("prepareForFishingRewardPack called without valid fishing reward state.");
        this.handleNextAfterResults('fishing');
    }
};

openingpack.getAnimationDurationByRarity = function(rarityKey) { 
    switch (rarityKey) {
        case 'base': return 800; 
        case 'rare': return 1100;
        case 'foil': return 1000;
        case 'holo': return 1400;
        case 'star': return 1700;
        case 'rainy': return 2000;
        case 'gold': return 2200;
        case 'shiny': return 2500;
        default: return 900;     
    }
};

openingpack.showCorrectPackOpeningUI = function() {
    const packSelectionScreen = document.getElementById('pack-selection');
    if (packSelectionScreen) {
        const title = packSelectionScreen.querySelector('h2');
        if (title) title.style.display = 'none';
        const packListEl = document.getElementById('pack-list');
        if (packListEl) packListEl.style.display = 'none';
        const filterControls = packSelectionScreen.querySelector('.collection-controls');
        if (filterControls) filterControls.style.display = 'none';
        const paginationControls = document.getElementById('pack-selection-pagination');
        if (paginationControls) paginationControls.style.display = 'none'; // Hide pagination
    }
    // Always show desktop UI now
    this.showPackOpeningUI_Desktop();
    if (typeof saveGame === 'function') saveGame();
};

// --- Desktop Pack Opening UI (now the only UI) ---
openingpack.showPackOpeningUI_Desktop = function() {
    const uiContainer = document.getElementById('pack-opening-desktop');
    uiContainer.style.display = 'flex'; 
    const titleEl = document.getElementById('pack-opening-title-desktop');
    const cardsDisplayArea = document.getElementById('pack-cards-desktop');
    if (!cardsDisplayArea || !titleEl) return;

    let setName;
    if (this.currentSet === 'anvil_result') {
        setName = "Anvil Forge Result!";
    } else if (this.currentSet === 'summon_result') {
        const cardCount = this.currentPack.length;
        setName = `Summon Results (${cardCount} card${cardCount > 1 ? 's' : ''})`;
    } else if (this.currentSet === 'fishing_reward') {
        setName = "Treasure Uncovered!";
    } else {
        setName = `Opening: ${getSetMetadata(this.currentSet)?.name || 'Pack'}`;
    }
    titleEl.textContent = setName;
    cardsDisplayArea.innerHTML = '';

    const useSingleRowLayout = this.currentSet === 'anvil_result' || this.currentSet === 'summon_result' || this.currentPack.length !== 8;
    cardsDisplayArea.classList.toggle('single-row-layout', useSingleRowLayout);


    this.currentPack.forEach(card => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'desktop-booster-card-container';

        const cardVisualDiv = document.createElement('div');
        cardVisualDiv.className = 'desktop-booster-card';
        cardVisualDiv.id = `booster-card-container-desktop-${card.packIndex}`; // This is the one that gets animations

        const cardImageWrapper = document.createElement('div');
        // Apply .card and rarity class to this wrapper
        cardImageWrapper.className = `card ${card.revealed ? card.rarityKey : 'card-back-state'}`; // Use 'card-back-state' or similar for unrevealed
        cardImageWrapper.dataset.packIndex = card.packIndex; // Keep packIndex for potential click handling on wrapper

        const img = document.createElement('img');
        const cardBackSrc = currentActiveSetVersion === 'v2' ? 'gui/yuki-back.jpg' : 'gui/back.jpg';
        img.src = card.revealed ? getCardImagePath(card.set, card.cardId) : cardBackSrc;
        img.alt = card.revealed ? `${card.set}-C${card.cardId}` : 'Card Back';
        // img no longer needs .card or rarity class, but might need a class for specific img styling
        img.className = 'pack-opening-card-image';
        // Standardized onerror logic
        img.onerror = function(){this.src=`https://placehold.co/${this.naturalWidth||this.width||130}x${this.naturalHeight||this.height||182}/333333/cccccc?text=${encodeURIComponent(this.alt || 'Missing Image')}`; this.onerror=null;};

        // Click handler: can be on cardImageWrapper or img. If on wrapper, good. If on img, ensure wrapper doesn't block.
        // For now, let's make the wrapper clickable for reveal, and img clickable for detail after reveal.
        if (card.revealed) {
            cardImageWrapper.onclick = () => { showCardDetail(card.set, card.cardId, card.rarityKey, 'pack', null, card.grade, card); if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3'); };
        } else {
            cardImageWrapper.onclick = () => this.revealCardDesktop(card.packIndex);
        }
        
        const newIndicator = document.createElement('span');
        newIndicator.className = 'new-indicator';
        newIndicator.id = `new-indicator-desktop-${card.packIndex}`;
        newIndicator.style.display = (card.revealed && card.isNew) ? 'block' : 'none';
        if (card.revealed && card.isNew) newIndicator.innerHTML = "NEW <span class='new-star'>⭐</span>";

        cardImageWrapper.appendChild(img); // Image inside the new wrapper
        cardImageWrapper.appendChild(newIndicator); // New indicator also inside wrapper, above image via CSS z-index if needed
        cardVisualDiv.appendChild(cardImageWrapper); // Append wrapper to the animated container
        cardContainer.appendChild(cardVisualDiv);

        const infoPara = document.createElement('p');
        infoPara.id = `pack-card-info-desktop-${card.packIndex}`;
        infoPara.className = 'desktop-pack-card-info pack-card-info';
        if (card.revealed) {
            const rarityTierInfo = getRarityTierInfo(card.rarityKey);
            const displayNameRarity = rarityTierInfo?.name || card.rarityKey;
            // Grade icon content is now handled by CSS via the class grade-icon-X
            infoPara.innerHTML = `<span class="grade-icon grade-icon-${card.grade}" data-grade-level="${card.grade}"></span> <span class="rarity-text-${card.rarityKey}">${displayNameRarity}</span> <span class="grade-icon grade-icon-${card.grade}" data-grade-level="${card.grade}"></span><br><span class="value">${formatCurrency(card.price)}</span>`;
        } else {
            infoPara.classList.add('placeholder-info');
        }
        cardContainer.appendChild(infoPara);
        cardsDisplayArea.appendChild(cardContainer);
    });
    this.updateDesktopControls();
};

openingpack.revealCardDesktop = function(packIndex) {
    const cardData = this.currentPack.find(c => c.packIndex === packIndex);
    if (!cardData || cardData.revealed) return;
    cardData.revealed = true;
    this.revealedCardIndices.add(packIndex); // Track manually revealed

    const cardVisualDiv = document.getElementById(`booster-card-container-desktop-${packIndex}`);
    const infoPara = document.getElementById(`pack-card-info-desktop-${packIndex}`);
    const newIndicator = document.getElementById(`new-indicator-desktop-${packIndex}`);

    if (cardVisualDiv) { // This is desktop-booster-card (the animated container)
        const cardImageWrapper = cardVisualDiv.querySelector('.card'); // Get the new wrapper
        const img = cardImageWrapper ? cardImageWrapper.querySelector('img.pack-opening-card-image') : null;

        if (cardImageWrapper && img) {
            img.src = getCardImagePath(cardData.set, cardData.cardId);
            img.alt = `${cardData.set}-C${cardData.cardId}`;
            
            // Update wrapper's class for rarity effect
            cardImageWrapper.className = `card ${cardData.rarityKey}`;
            // Update click handler on wrapper to show detail
            cardImageWrapper.onclick = () => { showCardDetail(cardData.set, cardData.cardId, cardData.rarityKey, 'pack', null, cardData.grade, cardData); if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3'); };

            // Animation is on cardVisualDiv (the parent of cardImageWrapper)
            cardVisualDiv.classList.remove(...Array.from(cardVisualDiv.classList).filter(c => c.startsWith('card-reveal-animation-')));
            cardVisualDiv.classList.add('card-reveal-animation', `card-reveal-animation-${cardData.rarityKey}`);
            setTimeout(() => cardVisualDiv.classList.remove('card-reveal-animation', `card-reveal-animation-${cardData.rarityKey}`), this.getAnimationDurationByRarity(cardData.rarityKey));
        
            // Play sound based on rarity
            if (typeof playSound === 'function') {
                const rarityLevel = stringToRarityInt[cardData.rarityKey] || 0;
                if (rarityLevel >= 3) playSound('sfx_card_reveal_epic.mp3');
                else if (rarityLevel >= 1) playSound('sfx_card_reveal_uncommon.mp3');
                else playSound('sfx_card_reveal_common.mp3');
            }
        }
    }
    if (newIndicator && cardData.isNew) { newIndicator.innerHTML = "NEW <span class='new-star'>⭐</span>"; newIndicator.style.display = 'block'; }
    if (infoPara) {
        const rarityTierInfo = getRarityTierInfo(cardData.rarityKey);
        const displayNameRarity = rarityTierInfo?.name || cardData.rarityKey;
        // Grade icon content is now handled by CSS via the class grade-icon-X
        infoPara.innerHTML = `<span class="grade-icon grade-icon-${cardData.grade}" data-grade-level="${cardData.grade}"></span> <span class="rarity-text-${cardData.rarityKey}">${displayNameRarity}</span> <span class="grade-icon grade-icon-${cardData.grade}" data-grade-level="${cardData.grade}"></span><br><span class="value">${formatCurrency(cardData.price)}</span>`;
        infoPara.classList.remove('placeholder-info');
    }
    
    this.processRevealedCard(cardData);
    this.updateDesktopControls();

    if (this.areAllCardsInPackRevealed()) {
        if (typeof updateStats === 'function') {
            updateStats(); // This will also call saveGame()
        } else if (typeof saveGame === 'function') {
            saveGame(); // Fallback if updateStats is somehow not available
        }
    }
};

openingpack.updateDesktopControls = function() {
    const allRevealed = this.areAllCardsInPackRevealed();
    const revealAllButton = document.getElementById('reveal-all-desktop-button');
    const openAnotherButton = document.getElementById('open-another-desktop-button');
    const backButton = document.getElementById('back-to-source-desktop-button');

    if (revealAllButton) revealAllButton.disabled = allRevealed;
    
    if (openAnotherButton) {
        if (this.packOpeningSource === 'anvil' || this.packOpeningSource === 'summon' || this.packOpeningSource === 'fishing') {
            openAnotherButton.style.display = 'none';
        } else {
            openAnotherButton.style.display = 'inline-flex';
            openAnotherButton.disabled = !allRevealed;
        }
    }

    if (backButton) {
        backButton.disabled = !allRevealed;
        if (this.packOpeningSource === 'anvil') {
            backButton.textContent = "Back to Anvil";
        } else if (this.packOpeningSource === 'summon') {
            backButton.textContent = "Back to Summon";
        } else if (this.packOpeningSource === 'fishing') {
            backButton.textContent = "Back to Fishing";
        } else {
            backButton.textContent = "Back to Selection";
        }
    }
};

openingpack.revealAllDesktop = async function() {
    const revealAllButton = document.getElementById('reveal-all-desktop-button');
    if (revealAllButton) revealAllButton.disabled = true; // Disable during reveal process
    if (typeof playSound === 'function') playSound('sfx_card_reveal_all.mp3');


    const unrevealedCards = this.currentPack.filter(card => !card.revealed);
    // Sort by rarity level (numeric) for reveal order, then by packIndex as a tie-breaker
    unrevealedCards.sort((a, b) => {
        const rarityA = stringToRarityInt[a.rarityKey] || 0;
        const rarityB = stringToRarityInt[b.rarityKey] || 0;
        if (rarityA !== rarityB) {
            return rarityA - rarityB;
        }
        return a.packIndex - b.packIndex;
    });
    
    for (const card of unrevealedCards) {
        if (!card.revealed) { 
            this.revealCardDesktop(card.packIndex); // This now handles the final saveGame via updateStats
            await new Promise(resolve => setTimeout(resolve, 150)); 
        }
    }
    // No explicit saveGame or updateStats here, as the last call to revealCardDesktop will handle it.
    // Ensure controls are updated finally if not already handled by the loop's last call
    if (this.areAllCardsInPackRevealed()) {
        this.updateDesktopControls();
    }
};

openingpack.openAnotherPackDesktop = function() {
    if (!this.currentSet || (!this.currentSetPackPrice && this.currentSetPackPrice !== 0)) { 
        console.error("openAnotherPackDesktop: currentSet or currentSetPackPrice is not set. Cannot open another pack. Returning to selection.");
        this.handleNextAfterResults(); 
        return;
    }
    this.openPack(this.currentSet, this.currentSetPackPrice); // openPack handles its own save & stats update
};

openingpack.backToSourceDesktop = function() { 
    this.handleNextAfterResults(this.packOpeningSource); 
};


// --- Common Logic for Pack Opening ---
openingpack.processRevealedCard = function(cardData) {
    if (this.packOpeningSource === 'fishing') {
        // Access global variable directly
        lastFishingReward = cardData; // Store the revealed card data
        // Do not add to collection here; it will be added to fishing basket later
        return;
    }

    if (!collection[cardData.set]) {
        collection[cardData.set] = {};
    }
    const fixedProps = getFixedGradeAndPrice(cardData.set, cardData.cardId);
    const inCollection = collection[cardData.set][cardData.cardId];
    if (inCollection) {
        inCollection.count++;
        if (inCollection.rarityKey !== fixedProps.rarityKey || inCollection.grade !== fixedProps.grade || inCollection.price !== fixedProps.price) {
            console.warn(`Mismatch for card ${cardData.set}-C${cardData.cardId}. Collection: R${inCollection.rarityKey}, G${inCollection.grade}, P${inCollection.price}. Pack: R${fixedProps.rarityKey}, G${fixedProps.grade}, P${fixedProps.price}. Using fixed properties.`);
            inCollection.rarityKey = fixedProps.rarityKey;
            inCollection.grade = fixedProps.grade;
            inCollection.price = fixedProps.price;
        }
    } else {
        collection[cardData.set][cardData.cardId] = { count: 1, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price };
    }
    checkAllAchievements(cardData.set); // Check achievements immediately for feedback
    // Removed saveGame() and updateStats() from here. They are called when the pack is fully revealed.
};

openingpack.handleNextAfterResults = function(context = 'standard') {
    this.currentPack = [];
    this.revealedCardIndices.clear();
    this.packOpeningSource = 'standard'; // Reset source after handling

    // Save game before navigating away from pack opening if it was active
    if (typeof saveGame === 'function') saveGame();


    if (context === 'anvil') {
        showScreen(SCREENS.GAMES);
        if (typeof loadMiniGame === 'function') loadMiniGame(SCREENS.TRADE_UP_GAME);
    } else if (context === 'summon') {
        showScreen(SCREENS.GAMES); 
        if (typeof loadMiniGame === 'function') loadMiniGame(SCREENS.SUMMON_GAME); 
    } else if (context === 'fishing') {
        // Navigate back to the fishing game
        if (typeof loadMiniGame === 'function') {
            loadMiniGame(SCREENS.FISHING_GAME); // This should handle showing SCREENS.GAMES first if needed
        } else {
            showScreen(SCREENS.FISHING_GAME); // Fallback if loadMiniGame is not available
        }
    } else { 
        showScreen(SCREENS.PACK_SELECTION);
    }
};
