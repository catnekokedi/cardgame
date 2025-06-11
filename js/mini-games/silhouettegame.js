
// silhouettegame.js

function startSilhouetteQuiz(gameContent, gameResultElement) {
    if (typeof getActiveSetDefinitions !== 'function' || typeof miniGameData === 'undefined' || 
        typeof getCardImagePath !== 'function' || typeof getSetMetadata !== 'function') {
        console.error("Core game data not available for Silhouette Quiz.");
        if(gameContent) gameContent.innerHTML = "<p class='text-center' style='color:red;'>Error starting quiz. Core data missing.</p>";
        return;
    }

    const playableSets = getActiveSetDefinitions().filter(setDef => setDef && typeof setDef.abbr === 'string' && setDef.abbr.trim() !== '' && setDef.count > 0);

    if (playableSets.length === 0) {
        console.error("Silhouette Quiz: No valid sets with cards available in the current version to pick from.");
        if(gameContent) gameContent.innerHTML = `<p class='text-center' style='color:red;'>Error: No playable card sets found for the quiz in the current ${currentActiveSetVersion.toUpperCase()} version.</p>`;
        if(gameResultElement) gameResultElement.innerHTML = '';
        return;
    }

    const randomSetDefCorrect = playableSets[Math.floor(Math.random() * playableSets.length)];
    const randomSetIdentifierCorrect = randomSetDefCorrect.abbr;
    const maxCardsInSelectedSetCorrect = randomSetDefCorrect.count;
    const randomCardIdCorrect = Math.floor(Math.random() * maxCardsInSelectedSetCorrect) + 1;
    miniGameData.correctAnswer = `${randomSetIdentifierCorrect}C${randomCardIdCorrect}`;

    let options = [miniGameData.correctAnswer];
    let attempts = 0;
    const MAX_OPTION_GENERATION_ATTEMPTS = playableSets.length * 20 + 50;

    while (options.length < 2 && attempts < MAX_OPTION_GENERATION_ATTEMPTS) {
        attempts++;
        const tempSetDef = playableSets[Math.floor(Math.random() * playableSets.length)];
        const tempSetIdentifier = tempSetDef.abbr;
        const tempMaxCards = tempSetDef.count;
        const tempCardId = Math.floor(Math.random() * tempMaxCards) + 1;
        const optionKey = `${tempSetIdentifier}C${tempCardId}`;

        if (!options.includes(optionKey)) {
            options.push(optionKey);
        }
    }

    if (options.length < 2) {
        console.warn("Silhouette Quiz: Could not generate enough unique options from active sets.");
        if (playableSets.length === 1 && playableSets[0].count < 2) {
             if(gameContent) gameContent.innerHTML = "<p class='text-center' style='color:red;'>Error: Not enough unique cards in available active sets to create quiz options.</p>";
             if(gameResultElement) gameResultElement.innerHTML = '';
             return;
        }
        // If still not enough options, try to pick from any set as a last resort (though this breaks V1/V2 intent for options)
        // This fallback might be removed if strict versioning is required for all options.
        const allSetsWithCards = ALL_SET_DEFINITIONS.filter(s => s.count > 0);
        while (options.length < 2 && attempts < MAX_OPTION_GENERATION_ATTEMPTS + 50 && allSetsWithCards.length > 0) {
            attempts++;
            const tempSetDef = allSetsWithCards[Math.floor(Math.random() * allSetsWithCards.length)];
            const tempSetIdentifier = tempSetDef.abbr;
            const tempMaxCards = tempSetDef.count;
            const tempCardId = Math.floor(Math.random() * tempMaxCards) + 1;
            const optionKey = `${tempSetIdentifier}C${tempCardId}`;
            if (!options.includes(optionKey)) options.push(optionKey);
        }
         if (options.length < 2) { // Final check after fallback
            if(gameContent) gameContent.innerHTML = "<p class='text-center' style='color:red;'>Error: Could not generate enough unique quiz options even with fallback. Please ensure there are at least two distinct cards available across all sets.</p>";
            if(gameResultElement) gameResultElement.innerHTML = '';
            return;
        }
    }


    options = options.sort(() => 0.5 - Math.random());

    let optionsHTML = '';
    options.forEach(optionKey => {
        const parts = optionKey.match(/^([A-Z0-9_]+)C(\d+)$/); // Adjusted regex for V2_XXX abbr
        if (!parts || parts.length < 3) {
            console.error(`Silhouette Quiz: Invalid optionKey format: ${optionKey}`);
            return;
        }
        const sIdent = parts[1];
        const cId = parts[2];
        const meta = getSetMetadata(sIdent); // getSetMetadata is version aware through ALL_SET_DEFINITIONS

        if (!meta || meta.name.startsWith("Unknown Set")) {
            console.warn(`Silhouette Quiz: getSetMetadata for option key '${sIdent}' returned 'Unknown Set (${sIdent})'. Skipping this option.`);
            return;
        }
        const displaySetText = meta.name;
        optionsHTML += `<button class="game-button" data-option-key="${optionKey}" onclick="submitMiniGameAnswer('${optionKey}','${SCREENS.SILHOUETTE_QUIZ}')">${displaySetText} - Card ${cId}</button>`;
    });
    
    if (optionsHTML.trim() === '' || (options.length > 0 && optionsHTML.match(/<button/g)?.length !== options.length)) {
         console.error("Silhouette Quiz: Failed to generate valid options HTML. Aborting quiz display.");
        if(gameContent) gameContent.innerHTML = "<p class='text-center' style='color:red;'>Error: Could not generate valid quiz options this time. Please try again.</p>";
        if(gameResultElement) gameResultElement.innerHTML = '';
        return;
    }


    const cardImgSrc = getCardImagePath(randomSetIdentifierCorrect, randomCardIdCorrect);

    gameContent.innerHTML = ''; // Clear the host div

    const silhouetteImageContainer = document.createElement('div');
    silhouetteImageContainer.className = 'silhouette-image-container';
    silhouetteImageContainer.innerHTML = `
        <img src="${cardImgSrc}" class="silhouette-image" alt="Guess the Silhouette" onerror="this.parentElement.innerHTML='<p style=\\'color:red; font-size:0.8em;\\'>Image load error.</p>'; this.onerror=null;">
    `;
    gameContent.appendChild(silhouetteImageContainer);

    const questionP = document.createElement('p');
    questionP.className = 'silhouette-question-text';
    questionP.textContent = 'Which card is this?';
    gameContent.appendChild(questionP);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'silhouette-options-container';
    optionsContainer.innerHTML = optionsHTML;
    gameContent.appendChild(optionsContainer);


    if (gameResultElement) {
        gameResultElement.textContent = '';
        gameResultElement.className = 'mini-game-result-text silhouette-result-text'; // Added specific class
        gameContent.appendChild(gameResultElement); // Append directly to gameContent
    }
}
