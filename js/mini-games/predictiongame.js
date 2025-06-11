
// mini-games/predictiongame.js (Chimpanzee Test - Reworked)

const PREDICTION_GAME_MAX_STRIKES = 3;
const PREDICTION_GAME_MAX_LEVEL = 50;
const PREDICTION_GAME_FEEDBACK_MS = 1200;
const PREDICTION_GAME_NEXT_LEVEL_DELAY_MS = 1000;

const PREDICTION_REWARDS = [
// Level: Reward (index is level - 1)
    0, 0, 0, 5, 10, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 750, 900, 1100,
    1300, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000, 4500, 5000, 6000, 7500, 10000,
    12500, 15000, 17500, 20000, 25000, 50000, 75000, 100000, 125000, 150000, 200000, 250000,
    500000, 750000, 1000000
];

let pgCurrentLevel;
let pgStrikes;
let pgCardSequence; // Array of {..., sequenceNumber, isVisible, isFaceUp, currentGridPosition }
let pgGamePhase; // 'INITIAL', 'REVEAL', 'RECALL', 'LEVEL_TRANSITION', 'GAME_OVER'
let pgExpectedClickSequenceNumber;
let pgGameElements = {};

function initializePredictionGameDomElements(wrapperElement) {
    pgGameElements.gameWrapper = wrapperElement;
    if (!pgGameElements.gameWrapper) {
        console.error("Prediction Game: Game wrapper element is null.");
        return false;
    }

    let missingElements = [];
    pgGameElements.statusArea = pgGameElements.gameWrapper.querySelector('#prediction-status-area');
    if (!pgGameElements.statusArea) missingElements.push('#prediction-status-area');

    pgGameElements.levelDisplay = pgGameElements.statusArea ? pgGameElements.statusArea.querySelector('#prediction-level-display') : null;
    if (pgGameElements.statusArea && !pgGameElements.levelDisplay) missingElements.push('#prediction-level-display (inside #prediction-status-area)');

    pgGameElements.strikesDisplay = pgGameElements.statusArea ? pgGameElements.statusArea.querySelector('#prediction-strikes-display') : null;
    if (pgGameElements.statusArea && !pgGameElements.strikesDisplay) missingElements.push('#prediction-strikes-display (inside #prediction-status-area)');
    
    pgGameElements.messageArea = pgGameElements.gameWrapper.querySelector('#prediction-message-area');
    if (!pgGameElements.messageArea) missingElements.push('#prediction-message-area');

    pgGameElements.cardGrid = pgGameElements.gameWrapper.querySelector('#prediction-card-grid');
    if (!pgGameElements.cardGrid) missingElements.push('#prediction-card-grid');

    pgGameElements.controls = pgGameElements.gameWrapper.querySelector('#prediction-controls');
    if (!pgGameElements.controls) missingElements.push('#prediction-controls');

    const allElementsPresent = missingElements.length === 0;
    if (!allElementsPresent) {
        console.error(`Prediction Game: One or more critical DOM sub-elements are missing from wrapper '${pgGameElements.gameWrapper.id}'. Missing: ${missingElements.join(', ')}`);
    }
    return allElementsPresent;
}

function startPredictionGame(gameContentEl, gameResultEl) { // gameResultEl is passed as null by miniGamesHost
    if (!gameContentEl || !document.body.contains(gameContentEl) || gameContentEl.id !== 'prediction-game-wrapper') {
        console.error("Prediction Game FATAL: gameContentEl is invalid, not in DOM, or not 'prediction-game-wrapper'. Bailing.", gameContentEl);
        const miniArea = document.getElementById('mini-game-area');
        if (miniArea) {
            miniArea.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Prediction Game failed to load: Invalid container.</p>';
        }
        return;
    }
    gameContentEl.style.display = 'flex'; 

    if (!gameContentEl.querySelector('#prediction-status-area')) {
        console.error("Prediction Game FATAL: '#prediction-status-area' not found directly inside gameContentEl. Content:", gameContentEl.innerHTML);
        const miniArea = document.getElementById('mini-game-area');
        if (miniArea) {
             miniArea.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Prediction Game failed to load: Key UI element (#prediction-status-area) missing.</p>';
        }
        return;
    }


    if (!initializePredictionGameDomElements(gameContentEl)) {
        const errP = document.createElement('p');
        errP.textContent = "Error: Prediction Game UI components missing. Cannot start. Check console for details.";
        errP.style.color = "red";
        errP.style.textAlign = "center";
        errP.style.padding = "20px";
        
        try {
            gameContentEl.innerHTML = ''; 
            gameContentEl.appendChild(errP);
        } catch (e) {
            const miniAreaFallback = document.getElementById('mini-game-area');
            if (miniAreaFallback) {
                miniAreaFallback.innerHTML = '';
                miniAreaFallback.appendChild(errP);
            }
        }
        return;
    }
    
    pgGameElements.gameWrapper.style.display = 'flex';
    
    // miniGameData.predictionGameResultEl will be reliably created by pgShowInitialScreen.
    // Clear any stale reference from a previous game instance if it exists.
    if (miniGameData.predictionGameResultEl) {
        miniGameData.predictionGameResultEl = null;
    }

    pgShowInitialScreen();
}

function pgShowInitialScreen() {
    pgGamePhase = 'INITIAL';
    pgUpdateLevelDisplay(1);
    pgUpdateStrikesDisplay(0);
    pgGameElements.messageArea.textContent = "Memorize the sequence. Click card #1, then recall the rest as they disappear.";
    pgGameElements.cardGrid.innerHTML = '';
    pgGameElements.cardGrid.classList.remove('game-over', 'player-recall');
    
    pgGameElements.controls.innerHTML = ''; // Clear controls

    // Always create and assign a new result element
    const resultP = document.createElement('p');
    resultP.className = 'prediction-game-final-result';
    resultP.textContent = ''; // Initially empty
    miniGameData.predictionGameResultEl = resultP; // Store the reference to the NEW element
    pgGameElements.controls.appendChild(miniGameData.predictionGameResultEl); // Append the NEW element
    
    const startButton = document.createElement('button');
    startButton.id = 'prediction-start-button';
    startButton.className = 'game-button';
    startButton.textContent = "Start Game";
    startButton.onclick = pgSetupNewGame;
    pgGameElements.controls.appendChild(startButton);
    pgGameElements.startButton = startButton; 
}

function pgSetupNewGame() {
    pgCurrentLevel = 1;
    pgStrikes = 0;
    pgCardSequence = [];
    
    // Ensure the result element (created in pgShowInitialScreen or pgEndGame) is cleared
    if(miniGameData.predictionGameResultEl) {
        miniGameData.predictionGameResultEl.textContent = '';
    }

    pgUpdateLevelDisplay();
    pgUpdateStrikesDisplay();
    pgGameElements.controls.innerHTML = ''; 
    
    // Re-append the (cleared) result element if it exists and is part of miniGameData
    if (miniGameData.predictionGameResultEl && pgGameElements.controls) { 
        pgGameElements.controls.appendChild(miniGameData.predictionGameResultEl);
    }

    pgGameElements.cardGrid.classList.remove('game-over', 'player-recall');
    pgPrepareLevel();
}

function pgGetRandomCardForVisuals(sequenceNum) {
    // Use active sets for card selection
    const activeGameSets = typeof getActiveSetDefinitions === 'function' ? getActiveSetDefinitions() : [];
    if (activeGameSets.length === 0) {
        console.error("Prediction Game: No active sets available to pick cards from.");
        return { 
            setId: 'ERROR', cardId: 1, imageSrc: 'https://placehold.co/100x140/CF6679/FFFFFF?text=No+Sets', 
            sequenceNumber: sequenceNum, isVisible: true, isFaceUp: true, currentGridPosition: -1 
        };
    }

    const randomSetDef = activeGameSets[Math.floor(Math.random() * activeGameSets.length)];
    const setId = randomSetDef.abbr;
    const maxCardsInSet = randomSetDef.count;

    if (maxCardsInSet === 0) return pgGetRandomCardForVisuals(sequenceNum); // Recurse if set has no cards

    const cardId = Math.floor(Math.random() * maxCardsInSet) + 1;
    
    if (typeof getCardImagePath !== 'function') {
        console.error("pgGetRandomCardForVisuals: getCardImagePath function is not defined!");
        return {
            setId, cardId, imageSrc: `https://placehold.co/100x140/cccccc/000000?text=PathErr`, sequenceNumber: sequenceNum,
            isVisible: true, isFaceUp: true, currentGridPosition: -1
        };
    }

    return {
        setId, cardId, imageSrc: getCardImagePath(setId, cardId), sequenceNumber: sequenceNum,
        isVisible: true, isFaceUp: true, currentGridPosition: -1
    };
}

function pgPrepareLevel() {
    if (pgGamePhase === 'GAME_OVER') return;

    pgGamePhase = 'REVEAL';
    pgGameElements.cardGrid.innerHTML = '';
    pgGameElements.cardGrid.classList.remove('player-recall');
    pgGameElements.messageArea.textContent = `Level ${pgCurrentLevel}: Memorize! Click card #1 when ready.`;
    pgGameElements.controls.innerHTML = '';
    // Re-append the (cleared) result element if it exists and is part of miniGameData
    if (miniGameData.predictionGameResultEl && pgGameElements.controls) { 
        miniGameData.predictionGameResultEl.textContent = ''; // Ensure it's empty for new level
        pgGameElements.controls.appendChild(miniGameData.predictionGameResultEl);
    }


    if (pgCurrentLevel > pgCardSequence.length) {
        pgCardSequence.push(pgGetRandomCardForVisuals(pgCurrentLevel));
    }

    pgCardSequence.slice(0, pgCurrentLevel).forEach(card => {
        card.isVisible = true;
        card.isFaceUp = true;
    });

    let positions = Array.from({ length: pgCurrentLevel }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    pgCardSequence.slice(0, pgCurrentLevel).forEach((card, index) => {
        card.currentGridPosition = positions[index];
    });
    
    pgRenderBoard();
}

function pgRenderBoard() {
    if (!pgGameElements.cardGrid) return;
    pgGameElements.cardGrid.innerHTML = '';

    const cardsForLevel = pgCardSequence.slice(0, pgCurrentLevel)
                                       .sort((a, b) => a.currentGridPosition - b.currentGridPosition);

    cardsForLevel.forEach(cardData => {
        if (!cardData.isVisible) return;

        const cardDiv = document.createElement('div');
        cardDiv.className = 'prediction-card';
        
        const img = document.createElement('img');
        const numberOverlay = document.createElement('div');
        numberOverlay.className = 'prediction-card-number';
        numberOverlay.textContent = cardData.sequenceNumber;

        if (cardData.isFaceUp) {
            cardDiv.classList.add('face-up');
            img.src = cardData.imageSrc; // This now uses the corrected path from pgGetRandomCardForVisuals
            img.alt = `Card S${cardData.setId}-C${cardData.cardId}`;
            img.onerror = function() { this.src = `https://placehold.co/100x140/cccccc/000000?text=E${cardData.setId}C${cardData.cardId}`; this.onerror=null; };
        } else {
            cardDiv.classList.add('face-down'); 
        }
        
        cardDiv.appendChild(img);
        cardDiv.appendChild(numberOverlay); 

        cardDiv.onclick = () => pgHandleCardClick(cardData);
        pgGameElements.cardGrid.appendChild(cardDiv);
    });
}

function pgHandleCardClick(clickedCardData) {
    if (pgGamePhase === 'LEVEL_TRANSITION' || pgGamePhase === 'GAME_OVER' || !clickedCardData.isVisible) return;

    if (pgGamePhase === 'REVEAL') {
        if (clickedCardData.sequenceNumber === 1) {
            clickedCardData.isVisible = false; 
            pgGamePhase = 'RECALL';
            pgExpectedClickSequenceNumber = 2;
            pgCardSequence.slice(0, pgCurrentLevel).forEach(card => {
                if (card.sequenceNumber !== 1) card.isFaceUp = false; 
            });
            pgRenderBoard();
            if (pgCurrentLevel === 1) { 
                pgGamePhase = 'LEVEL_TRANSITION';
                pgHandleLevelCompleteVisuals();
            } else {
                pgGameElements.messageArea.textContent = "Recall! Click card #2.";
                pgGameElements.cardGrid.classList.add('player-recall');
            }
        } else {
            pgHandleIncorrectAttempt();
        }
    } else if (pgGamePhase === 'RECALL') {
        if (clickedCardData.sequenceNumber === pgExpectedClickSequenceNumber) {
            clickedCardData.isVisible = false; 
            pgRenderBoard();
            pgExpectedClickSequenceNumber++;
            if (pgExpectedClickSequenceNumber > pgCurrentLevel) {
                pgGamePhase = 'LEVEL_TRANSITION';
                pgHandleLevelCompleteVisuals();
            } else {
                pgGameElements.messageArea.textContent = `Correct! Click card #${pgExpectedClickSequenceNumber}.`;
            }
        } else {
            pgHandleIncorrectAttempt();
        }
    }
}

function pgHandleIncorrectAttempt() {
    pgStrikes++;
    pgUpdateStrikesDisplay();
    pgGameElements.cardGrid.classList.remove('player-recall');

    if (pgStrikes >= PREDICTION_GAME_MAX_STRIKES) {
        pgGameElements.messageArea.textContent = `Strike ${pgStrikes}! Game Over.`;
        pgHandleGameOver();
    } else {
        pgGameElements.messageArea.textContent = `Wrong! Strike ${pgStrikes}. Level restarting...`;
        pgGamePhase = 'LEVEL_TRANSITION'; 
        setTimeout(() => {
            if(pgGamePhase !== 'GAME_OVER') pgPrepareLevel();
        }, PREDICTION_GAME_FEEDBACK_MS);
    }
}

function pgHandleLevelCompleteVisuals() {
    pgGameElements.messageArea.textContent = `Level ${pgCurrentLevel} Complete!`;
    pgGameElements.cardGrid.classList.remove('player-recall');
    pgGameElements.controls.innerHTML = '';
    if (miniGameData.predictionGameResultEl && pgGameElements.controls) { 
        miniGameData.predictionGameResultEl.textContent = ''; // Clear text for continue screen
        pgGameElements.controls.appendChild(miniGameData.predictionGameResultEl);
    }


    if (pgCurrentLevel >= PREDICTION_GAME_MAX_LEVEL) {
        pgHandleWinGameAllLevels();
        return;
    }

    const continueButton = document.createElement('button');
    continueButton.className = 'game-button';
    continueButton.textContent = "Continue";
    continueButton.onclick = pgProceedToNextLevel;
    pgGameElements.controls.appendChild(continueButton);
}

function pgProceedToNextLevel() {
    pgCurrentLevel++;
    pgUpdateLevelDisplay();
    pgPrepareLevel();
}

function pgEndGame(isWinAllLevels) {
    pgGamePhase = 'GAME_OVER';
    pgGameElements.cardGrid.classList.add('game-over');
    pgGameElements.cardGrid.classList.remove('player-recall');
    pgGameElements.controls.innerHTML = ''; // Clear controls for final result and play again button

    const completedLevel = isWinAllLevels ? PREDICTION_GAME_MAX_LEVEL : pgCurrentLevel -1;
    const reward = (completedLevel > 0 && completedLevel <= PREDICTION_REWARDS.length) ? PREDICTION_REWARDS[completedLevel - 1] : 0;

    if (isWinAllLevels) {
        pgGameElements.messageArea.textContent = `INCREDIBLE! You completed all ${PREDICTION_GAME_MAX_LEVEL} levels!`;
    } else {
        pgGameElements.messageArea.textContent = `Game Over! You completed Level ${completedLevel}.`;
    }

    // Ensure miniGameData.predictionGameResultEl exists or create it
    if (!miniGameData.predictionGameResultEl) {
        const resultP = document.createElement('p');
        resultP.className = 'prediction-game-final-result';
        miniGameData.predictionGameResultEl = resultP;
    }
    
    miniGameData.predictionGameResultEl.innerHTML = `You earned ${formatCurrency(reward)} Toki!`;
    miniGameData.predictionGameResultEl.style.color = reward > 0 ? (isWinAllLevels ? 'var(--material-secondary)' : 'var(--material-primary)') : 'var(--material-text-secondary-dark)';
    
    if (pgGameElements.controls) { // Append it to controls
        pgGameElements.controls.appendChild(miniGameData.predictionGameResultEl);
    } else { // Fallback if controls somehow missing
        pgGameElements.gameWrapper.appendChild(miniGameData.predictionGameResultEl);
    }


    if (reward > 0) {
        balance += reward;
        updateBalance();
        if (typeof saveGame === 'function') saveGame();
    }

    const playAgainButton = document.createElement('button');
    playAgainButton.className = 'game-button';
    playAgainButton.textContent = "Play Again";
    playAgainButton.onclick = pgShowInitialScreen; 
    pgGameElements.controls.appendChild(playAgainButton);
}

function pgHandleGameOver() {
    pgEndGame(false);
}

function pgHandleWinGameAllLevels() {
    pgEndGame(true);
}


function pgUpdateLevelDisplay(levelOverride) {
    if (pgGameElements.levelDisplay) {
        pgGameElements.levelDisplay.textContent = `Level: ${levelOverride !== undefined ? levelOverride : pgCurrentLevel}`;
    }
}

function pgUpdateStrikesDisplay(strikesOverride) {
    if (pgGameElements.strikesDisplay) {
        pgGameElements.strikesDisplay.textContent = `Strikes: ${strikesOverride !== undefined ? strikesOverride : pgStrikes}/${PREDICTION_GAME_MAX_STRIKES}`;
    }
}

window.startPredictionGame = startPredictionGame;
