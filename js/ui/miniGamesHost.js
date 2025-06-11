// js/ui/miniGamesHost.js

let cachedPredictionGameHTML = null; // Module-scoped cache

function loadMiniGame(gameId) {
    currentMiniGame = gameId;
    const gameSelectionDiv = document.getElementById('game-selection');
    const miniGameAreaDiv = document.getElementById('mini-game-area');
    const gamesScreenTitle = document.querySelector('#games-screen > h2');

    if (!gameSelectionDiv || !miniGameAreaDiv || !gamesScreenTitle) {
        console.error("Mini-game UI structure not found. Cannot load game:", gameId);
        return;
    }

    gameSelectionDiv.style.display = 'none';
    
    // --- Try to cache Prediction Game Template ONCE if it exists in miniGameAreaDiv ---
    if (cachedPredictionGameHTML === null) {
        const templateInArea = miniGameAreaDiv.querySelector('#prediction-game-wrapper');
        if (templateInArea) {
            cachedPredictionGameHTML = templateInArea.innerHTML;
            // console.log("Prediction Game template cached successfully from within #mini-game-area.");
        } else {
            // This warning is useful if the template is expected to always be in miniGameAreaDiv initially.
            // If miniGameAreaDiv might be empty on first load for other reasons, this might be too noisy.
            console.warn("Initial cache attempt: Prediction Game template '#prediction-game-wrapper' not found within '#mini-game-area'.");
        }
    }
    
    miniGameAreaDiv.innerHTML = ''; // Clear ALL previous content (header, game area)
    miniGameAreaDiv.style.display = 'flex';
    gamesScreenTitle.style.display = 'none';

    // --- Create Standard Header ---
    const navDiv = document.createElement('div');
    navDiv.className = 'mini-game-header-bar'; 

    const gameTitle = document.createElement('h3');
    gameTitle.className = 'mini-game-title';
    navDiv.appendChild(gameTitle); 

    miniGameAreaDiv.appendChild(navDiv); 

    let specificGameTitleText = "Mini Game";
    let mainContentHost; 

    if (gameId === SCREENS.PREDICTION_GAME) {
        specificGameTitleText = "Prediction Challenge";
        mainContentHost = document.createElement('div');
        mainContentHost.id = 'prediction-game-wrapper'; // This will be the new active wrapper
        mainContentHost.style.display = 'flex';
        mainContentHost.style.width = '100%';
        mainContentHost.style.height = '100%';
        mainContentHost.style.flexDirection = 'column';

        if (cachedPredictionGameHTML !== null) { // Use the module-scoped cache
            mainContentHost.innerHTML = cachedPredictionGameHTML; 
        } else {
            // This means the template was never found, even on initial caching attempts.
            console.error("Prediction Game template content was not cached. Rendering error message.");
            mainContentHost.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Prediction Game template missing (failed to cache).</p>";
        }
        miniGameAreaDiv.appendChild(mainContentHost); // Add the new wrapper with content to the DOM
        
        if (typeof startPredictionGame === 'function') {
            startPredictionGame(mainContentHost, null); // Pass the NEWLY created and populated mainContentHost
        } else {
            console.error("startPredictionGame function not found");
        }
    } else {
        const gameHostDiv = document.createElement('div');
        gameHostDiv.id = 'mini-game-content-active'; 
        gameHostDiv.className = `mini-game-content-active-wrapper ${gameId}-wrapper`;
        gameHostDiv.style.display = 'flex';
        gameHostDiv.style.flexDirection = 'column';
        gameHostDiv.style.width = '100%';
        gameHostDiv.style.height = '100%';
        gameHostDiv.style.position = 'relative';
        gameHostDiv.style.overflowY = 'auto';

        const actualGameContentDiv = document.createElement('div');
        actualGameContentDiv.className = 'mini-game-main-content';
        actualGameContentDiv.style.flexGrow = '1';
        actualGameContentDiv.style.overflowY = 'auto';
        actualGameContentDiv.style.width = '100%';
        actualGameContentDiv.style.position = 'relative';

        gameHostDiv.appendChild(actualGameContentDiv);
        miniGameAreaDiv.appendChild(gameHostDiv);
        mainContentHost = actualGameContentDiv;
        let gameResultEl; // To be passed to games that need it

        switch(gameId) {
            case SCREENS.TRADE_UP_GAME:
                specificGameTitleText = "Anvil Game";
                if (typeof startAnvilGame === 'function') startAnvilGame(mainContentHost, null);
                break;
            case SCREENS.DIRECT_OFFER_GAME:
                specificGameTitleText = "Direct Offer";
                if (typeof startDirectOfferGame === 'function') startDirectOfferGame(mainContentHost, null);
                break;
            case SCREENS.HIGHER_OR_LOWER:
                specificGameTitleText = "Higher or Lower?";
                gameResultEl = document.createElement('p');
                gameResultEl.className = 'mini-game-result-text'; // Added class
                if (typeof startHigherOrLower === 'function') startHigherOrLower(mainContentHost, gameResultEl);
                break;
            case SCREENS.SILHOUETTE_QUIZ:
                specificGameTitleText = "Silhouette Quiz";
                gameResultEl = document.createElement('p');
                gameResultEl.className = 'mini-game-result-text'; // Added class
                if (typeof startSilhouetteQuiz === 'function') startSilhouetteQuiz(mainContentHost, gameResultEl);
                break;
            case SCREENS.SUMMON_GAME:
                specificGameTitleText = "Summon Game";
                if (typeof startSummonGame === 'function') startSummonGame(mainContentHost, null);
                break;
            case SCREENS.IDLE_EXHIBITION:
                specificGameTitleText = "Idle Exhibition";
                if (typeof idleExhibition !== 'undefined' && typeof idleExhibition.startIdleExhibitionGame === 'function') {
                     idleExhibition.startIdleExhibitionGame(mainContentHost, null);
                }
                break;
            case SCREENS.FISHING_GAME: // Updated Case
                specificGameTitleText = "Fish in Sea"; // Updated Title
                if (typeof startFishingGame === 'function') startFishingGame(mainContentHost, null);
                else console.error("startFishingGame function not found");
                break;
            default:
                console.error(`Unknown mini-game ID: ${gameId}`);
                showScreen(SCREENS.GAMES);
                return;
        }
    }
    gameTitle.textContent = specificGameTitleText;
    if (typeof playSound === 'function') playSound('sfx_minigame_start.mp3');

}


function handleGameOutcome(win, gameResultElement, gameType) {
    if(!gameResultElement) return;

    let reward = 0;
    let message = "";

    if (win) {
        switch(gameType) {
            case SCREENS.SILHOUETTE_QUIZ: reward = 50; break;
            case SCREENS.HIGHER_OR_LOWER: reward = 25; break;
            default: reward = 10;
        }
        message = `Correct! You win ${formatCurrency(reward)}!`;
        gameResultElement.style.color = 'var(--material-primary)';
        balance += reward;
        updateBalance();
        if (typeof playSound === 'function') playSound('sfx_minigame_win.mp3');
        if (reward > 0 && typeof playSound === 'function') playSound('sfx_toki_gain.mp3');
    } else {
         switch(gameType) {
            case SCREENS.SILHOUETTE_QUIZ: reward = -20; break;
            case SCREENS.HIGHER_OR_LOWER: reward = -10; break;
            default: reward = -5;
        }
        const cost = Math.abs(reward);
        message = `Incorrect. You lose ${formatCurrency(cost)}.`;
        gameResultElement.style.color = 'var(--material-error)';
        balance = Math.max(0, balance + reward);
        updateBalance();
        if (typeof playSound === 'function') playSound('sfx_minigame_lose.mp3');
    }
    gameResultElement.textContent = message;
    if (typeof saveGame === 'function') saveGame();
}

function submitMiniGameAnswer(answer, gameType) {
    // The gameResultElement might need to be sourced more dynamically if the structure changed.
    // Assuming for now that the game-specific start function appends it appropriately.
    const miniGameMainContent = document.querySelector('#mini-game-area .mini-game-main-content') || document.getElementById('prediction-game-wrapper');
    let gameResultElement = miniGameMainContent ? miniGameMainContent.querySelector('.mini-game-result-text') : null;

    if (!gameResultElement && miniGameMainContent) { // If not found, create and append it.
        gameResultElement = document.createElement('p');
        gameResultElement.className = 'mini-game-result-text';
        const buttonsContainer = miniGameMainContent.querySelector('.quiz-options-container') || miniGameMainContent.querySelector('#hol-buttons') || miniGameMainContent.querySelector('#prediction-controls');
        if (buttonsContainer) {
             buttonsContainer.insertAdjacentElement('afterend', gameResultElement);
        } else {
            miniGameMainContent.appendChild(gameResultElement);
        }
    } else if (!gameResultElement) {
        console.error("submitMiniGameAnswer: Could not find or create gameResultElement.");
        return;
    }
    if (typeof playSound === 'function') playSound('sfx_button_click.mp3');


    let win = false;

    if (gameType === SCREENS.SILHOUETTE_QUIZ) {
        win = (answer === miniGameData.correctAnswer);
        const buttons = document.querySelectorAll('.silhouette-options-container button'); // Target specific container
        buttons.forEach(button => {
            button.disabled = true;
            const buttonOptionKey = button.dataset.optionKey;
            if (buttonOptionKey === answer) {
                button.style.backgroundColor = win ? 'var(--material-primary)' : 'var(--material-error)';
            }
            if (buttonOptionKey === miniGameData.correctAnswer && !win) {
                 button.style.backgroundColor = 'var(--material-primary-variant)';
            }
        });
    } else if (gameType === SCREENS.HIGHER_OR_LOWER) {
        // HoL handles its own DOM for revealing card 2 and result message via submitHigherOrLowerAnswer
        // This function is mainly for Silhouette Quiz currently.
        // For HoL, the result is directly in its own logic.
        return; // HoL handles its own result display
    }


    handleGameOutcome(win, gameResultElement, gameType);

    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.className = 'game-button mt-3 play-again-button-class';
    playAgainButton.onclick = () => { loadMiniGame(gameType); playSound('sfx_button_click.mp3'); };


    const questionArea = gameResultElement.closest('.mini-game-question-area') || gameResultElement.closest('.mini-game-main-content') || gameResultElement.closest('#prediction-game-wrapper');
    if(questionArea) {
         const oldPlayAgainBtn = questionArea.querySelector('.play-again-button-class');
         if(oldPlayAgainBtn) oldPlayAgainBtn.remove();
         // Ensure there's some space if it's appended after the result text
         if (gameResultElement.nextSibling && gameResultElement.nextSibling !== playAgainButton) {
            gameResultElement.insertAdjacentElement('afterend', playAgainButton);
         } else if (!gameResultElement.nextSibling) {
            questionArea.appendChild(playAgainButton);
         }
    } else {
        gameResultElement.insertAdjacentElement('afterend', playAgainButton);
    }
}