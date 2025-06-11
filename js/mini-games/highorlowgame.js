// highorlowgame.js

function getOwnedCardInstances() {
    const ownedInstances = [];
    if (typeof collection === 'undefined' || typeof ALL_SET_DEFINITIONS === 'undefined' || typeof getRarityTierInfo !== 'function' || typeof getFixedGradeAndPrice !== 'function') {
        console.error("getOwnedCardInstances: Core dependencies missing.");
        return ownedInstances;
    }

    ALL_SET_DEFINITIONS.forEach(setDef => {
        const setAbbr = setDef.abbr;
        if (collection[setAbbr]) {
            Object.keys(collection[setAbbr]).forEach(cardIdStr => {
                const cardIdNum = parseInt(cardIdStr);
                const cardData = collection[setAbbr][cardIdNum]; // { count, grade, price, rarityKey }
                if (cardData && cardData.count > 0) {
                    // Create an entry for each *type* of card owned.
                    // If multiple copies influenced the game, logic would need to expand cardData.count times.
                    // For H/L, we just need distinct card types and their properties.
                    ownedInstances.push({
                        setIdentifier: setAbbr,
                        cardId: cardIdNum,
                        rarityKey: cardData.rarityKey, 
                        grade: cardData.grade,       
                        price: cardData.price        
                    });
                }
            });
        }
    });
    return ownedInstances;
}


function startHigherOrLower(gameContent, gameResultElement) {
    if (typeof ALL_SET_DEFINITIONS === 'undefined' || typeof collection === 'undefined' || typeof miniGameData === 'undefined' || typeof getFixedGradeAndPrice !== 'function' || typeof getRarityTierInfo !== 'function' || typeof formatCurrency !== 'function' || typeof getCardImagePath !== 'function' || typeof getSetMetadata !== 'function') {
        console.error("Core game data or helper functions not available for Higher or Lower.");
        if(gameContent) gameContent.innerHTML = "<p>Error starting game. Core data missing.</p>";
        return;
    }

    const totalOwnedSpan = document.getElementById('total-cards-owned');
    const uniqueCardsStat = totalOwnedSpan ? parseInt(totalOwnedSpan.textContent || '0') : 0;
    if (uniqueCardsStat < 100) {
        gameContent.innerHTML = "<p class='text-center'>You need to own at least 100 unique cards in your collection to play this game. <br>Explore and collect more!</p>";
        if(gameResultElement) gameResultElement.innerHTML = '';
        return;
    }
    
    const ownedInstances = getOwnedCardInstances();
    if (ownedInstances.length < 2) { 
        gameContent.innerHTML = "<p class='text-center'>You need to own at least two different card types to play Higher or Lower.</p>";
        if(gameResultElement) gameResultElement.innerHTML = '';
        return;
    }

    const card1Data = ownedInstances[Math.floor(Math.random() * ownedInstances.length)];
    miniGameData.card1Price = card1Data.price; 
    const card1ImgSrc = getCardImagePath(card1Data.setIdentifier, card1Data.cardId);
    const card1SetMeta = getSetMetadata(card1Data.setIdentifier);
    const card1DisplayName = card1SetMeta ? card1SetMeta.name : `Set ${card1Data.setIdentifier}`;
    const card1RarityInfo = getRarityTierInfo(card1Data.rarityKey);
    const card1DisplayRarity = card1RarityInfo ? card1RarityInfo.name : card1Data.rarityKey;
    
    gameContent.innerHTML = `
        <div class="hol-layout">
            <div class="hol-card-presentation" id="hol-card1-presentation" data-set-id="${card1Data.setIdentifier}" data-card-id="${card1Data.cardId}" data-rarity-key="${card1Data.rarityKey}" data-grade="${card1Data.grade}">
                <p class="hol-card-identifier">${card1DisplayName} - ID ${card1Data.cardId}</p>
                <img src="${card1ImgSrc}" class="quiz-image card ${card1Data.rarityKey}" alt="Card 1" onerror="this.src='https://placehold.co/100x140/42A5F5/333333?text=Card+1'}">
                <p class="hol-card-details-text">Rarity: <span class="rarity-text-${card1Data.rarityKey}">${card1DisplayRarity}</span>, Grade: ${card1Data.grade}</p>
                <p class="hol-card-value-text">Value: ${formatCurrency(card1Data.price)}</p>
            </div>
            <div class="hol-interactive-area">
                <p class="hol-question-text">Will the next card's value be higher or lower?</p>
                <div id="hol-buttons">
                    <button class="game-button" onclick="submitHigherOrLowerAnswer('higher')">Higher</button>
                    <button class="game-button" onclick="submitHigherOrLowerAnswer('lower')">Lower</button>
                </div>
            </div>
            <div class="hol-card-presentation" id="hol-card2-presentation">
                <span class="hol-placeholder-text">Next card appears here</span>
            </div>
        </div>`;
    
    const interactiveAreaDiv = gameContent.querySelector('.hol-interactive-area');
    if (interactiveAreaDiv && gameResultElement) {
        gameResultElement.innerHTML = ''; 
        gameResultElement.className = 'mini-game-result-text'; 
        interactiveAreaDiv.appendChild(gameResultElement); // Append to the new interactive area
    } else if (gameResultElement) {
        gameResultElement.innerHTML = '';
        gameResultElement.className = 'mini-game-result-text';
        gameContent.appendChild(gameResultElement); 
    }
}

function submitHigherOrLowerAnswer(userGuess) {
    const interactiveArea = document.querySelector('.hol-interactive-area'); 
    let gameResultElement = interactiveArea ? interactiveArea.querySelector('.mini-game-result-text') : null;

    const card2PresentationArea = document.getElementById('hol-card2-presentation');
    const buttonsContainer = document.getElementById('hol-buttons');
    const card1PresentationArea = document.getElementById('hol-card1-presentation');

    if (!card2PresentationArea || !buttonsContainer || !interactiveArea || !card1PresentationArea) {
        console.error("Higher or Lower UI elements (card presentations, buttons, or interactive area) missing for answer submission.");
        if (gameResultElement) gameResultElement.textContent = "Error: Critical UI elements missing.";
        else console.error("HoL: gameResultElement is also missing or could not be found despite interactiveArea existing:", interactiveArea);
        return;
    }
    
    if (!gameResultElement && interactiveArea) {
        console.warn("Higher or Lower: gameResultElement (.mini-game-result-text) not found within .hol-interactive-area. Creating fallback.");
        gameResultElement = document.createElement('p');
        gameResultElement.className = 'mini-game-result-text';
        interactiveArea.appendChild(gameResultElement); // Append to interactive area
    } else if (!gameResultElement) {
        console.error("HoL: Critical error - .hol-interactive-area is missing or gameResultElement cannot be established.");
        return;
    }
    
    if (typeof ALL_SET_DEFINITIONS === 'undefined' || typeof collection === 'undefined' || typeof miniGameData === 'undefined' || typeof getFixedGradeAndPrice !== 'function' || typeof getCardImagePath !== 'function' || typeof getSetMetadata !== 'function' || typeof getRarityTierInfo !== 'function' || typeof formatCurrency !== 'function') {
        console.error("Core game data or helper functions not available for Higher or Lower answer.");
        if (gameResultElement) gameResultElement.textContent = "Error processing answer: Core data missing.";
        return;
    }

    if(buttonsContainer) buttonsContainer.innerHTML = ''; // Disable buttons

    const ownedInstances = getOwnedCardInstances();
    if (ownedInstances.length === 0) {
        gameResultElement.textContent = "Error: No owned cards available to pick a second card.";
        return;
    }

    let card2Data;
    let attempts = 0;
    const card1SetId = card1PresentationArea.dataset.setId;
    const card1CardId = parseInt(card1PresentationArea.dataset.cardId);
    const card1RarityKey = card1PresentationArea.dataset.rarityKey;
    const card1Grade = parseInt(card1PresentationArea.dataset.grade);

    do {
        card2Data = ownedInstances[Math.floor(Math.random() * ownedInstances.length)];
        attempts++;
    } while (
        ownedInstances.length > 1 && 
        card2Data.setIdentifier === card1SetId && 
        card2Data.cardId === card1CardId &&
        card2Data.rarityKey === card1RarityKey && 
        card2Data.grade === card1Grade &&        
        attempts < ownedInstances.length * 2 + 5 
    );
    
    const card2Price = card2Data.price;
    const card2ImgSrc = getCardImagePath(card2Data.setIdentifier, card2Data.cardId);
    const card2SetMeta = getSetMetadata(card2Data.setIdentifier);
    const card2DisplayName = card2SetMeta ? card2SetMeta.name : `Set ${card2Data.setIdentifier}`;
    const card2RarityInfo = getRarityTierInfo(card2Data.rarityKey);
    const card2DisplayRarity = card2RarityInfo ? card2RarityInfo.name : card2Data.rarityKey;

    card2PresentationArea.innerHTML = `
        <p class="hol-card-identifier">${card2DisplayName} - ID ${card2Data.cardId}</p>
        <img src="${card2ImgSrc}" class="quiz-image card ${card2Data.rarityKey}" alt="Card 2" onerror="this.src='https://placehold.co/100x140/CF6679/FFFFFF?text=Card+2'}">
        <p class="hol-card-details-text">Rarity: <span class="rarity-text-${card2Data.rarityKey}">${card2DisplayRarity}</span>, Grade: ${card2Data.grade}</p>
        <p class="hol-card-value-text">Value: ${formatCurrency(card2Price)}</p>
    `;
    
    const questionTextP = interactiveArea.querySelector('.hol-question-text');
    if (questionTextP) {
        questionTextP.textContent = `Card 1 Value: ${formatCurrency(miniGameData.card1Price)}, Card 2 Value: ${formatCurrency(card2Price)}`;
    }

    let win = false;
    if (userGuess === 'higher' && card2Price > miniGameData.card1Price) {
        win = true;
    } else if (userGuess === 'lower' && card2Price < miniGameData.card1Price) {
        win = true;
    } else if (card2Price === miniGameData.card1Price) {
        gameResultElement.textContent = "It's a tie! No win, no loss.";
        gameResultElement.style.color = 'var(--material-text-secondary-dark)';
        
        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Play Again';
        playAgainButton.className = 'game-button play-again-button-class'; // Removed mt-3, handled by CSS gap
        playAgainButton.onclick = () => loadMiniGame(SCREENS.HIGHER_OR_LOWER);
        
        const oldPlayAgainBtn = interactiveArea.querySelector('.play-again-button-class');
        if(oldPlayAgainBtn) oldPlayAgainBtn.remove();
        interactiveArea.appendChild(playAgainButton);
        
        if (typeof saveGame === 'function') saveGame();
        return;
    }
    
    handleGameOutcome(win, gameResultElement, SCREENS.HIGHER_OR_LOWER);

    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.className = 'game-button play-again-button-class'; // Removed mt-3
    playAgainButton.onclick = () => loadMiniGame(SCREENS.HIGHER_OR_LOWER);
    
    const oldPlayAgainBtn = interactiveArea.querySelector('.play-again-button-class');
    if(oldPlayAgainBtn) oldPlayAgainBtn.remove(); 
    interactiveArea.appendChild(playAgainButton);
}