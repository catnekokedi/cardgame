
// js/mini-games/summongame.js (Formerly js/ui/screens/summonGameScreen.js)

var currentSelectedSummonRarity = null; 
var currentSelectedSummonQuantity = 1;

function startSummonGame(gameContentEl, gameResultEl) {
    if (!gameContentEl) {
        console.error("Summon Game FATAL: gameContentEl not provided. Cannot render UI.");
        return;
    }
    gameContentEl.innerHTML = ''; // Clear the container first

    const templateScreen = document.getElementById('summon-game-screen');
    if (!templateScreen) {
        console.error("Summon Game FATAL: Template #summon-game-screen NOT FOUND in DOM. Bailing.");
        gameContentEl.innerHTML = "<p style='color: red; text-align: center; padding: 20px;'>Error: Summon Game UI template missing.</p>";
        return;
    }

    // Clone the children of the template and append them to gameContentEl
    // Skip the .summon-game-header as it's handled by miniGamesHost.js
    Array.from(templateScreen.children).forEach(childNode => {
        if (!childNode.classList.contains('summon-game-header')) {
            const clonedChild = childNode.cloneNode(true);
            gameContentEl.appendChild(clonedChild);
        }
    });


    if (typeof summonTicketRarities === 'undefined' || typeof getRarityTierInfo !== 'function' || 
        typeof SUMMON_OUTCOME_RATES === 'undefined' || 
        typeof getFixedGradeAndPrice !== 'function' || typeof stringToRarityInt === 'undefined' || 
        typeof getActiveSetDefinitions !== 'function') { // Changed from ALL_SET_DEFINITIONS
        gameContentEl.innerHTML = "<p style='color: red; text-align: center; padding: 20px;'>Error: Summon Game cannot be initialized due to missing core data components.</p>";
        console.error("Summon Game: Critical data missing for initialization (SUMMON_OUTCOME_RATES or other).");
        return;
    }

    // Now get references to the cloned elements within gameContentEl
    const summonRaritySelect = gameContentEl.querySelector('#summon-rarity-select');
    const summonQuantityInput = gameContentEl.querySelector('#summon-quantity-input');

    if (!summonRaritySelect || !summonQuantityInput ) {
        console.error("Summon Game: UI control elements not found in the cloned content. Ensure IDs are correct: summon-rarity-select, summon-quantity-input.");
        gameContentEl.innerHTML = "<p style='color: red; text-align: center; padding: 20px;'>Error: Summon Game UI controls are missing from template.</p>";
        return;
    }

    summonRaritySelect.innerHTML = '';
    let defaultRarityForSelect = null;

    summonTicketRarities.forEach(rarityKey => {
        const rarityInfo = getRarityTierInfo(rarityKey);
        if (rarityInfo) {
            const option = document.createElement('option');
            option.value = rarityKey;
            option.textContent = rarityInfo.name;
            summonRaritySelect.appendChild(option);
            if (defaultRarityForSelect === null) {
                defaultRarityForSelect = rarityKey;
            }
        }
    });

    if (typeof lastSelectedSummonRarityKey === 'string' &&
        summonTicketRarities.includes(lastSelectedSummonRarityKey) &&
        summonRaritySelect.querySelector('option[value="' + lastSelectedSummonRarityKey + '"]')) { 
        currentSelectedSummonRarity = lastSelectedSummonRarityKey;
    } else if (defaultRarityForSelect) { 
        currentSelectedSummonRarity = defaultRarityForSelect; 
    } else { 
        currentSelectedSummonRarity = null; 
    }

    if (currentSelectedSummonRarity) {
        summonRaritySelect.value = currentSelectedSummonRarity;
    } else if (summonRaritySelect.options.length > 0) {
        currentSelectedSummonRarity = summonRaritySelect.options[0].value;
        summonRaritySelect.value = currentSelectedSummonRarity;
    }

    currentSelectedSummonQuantity = parseInt(summonQuantityInput.value) || 1;
    if (isNaN(currentSelectedSummonQuantity) || currentSelectedSummonQuantity < 1) {
        currentSelectedSummonQuantity = 1;
        summonQuantityInput.value = 1;
    }
    if (currentSelectedSummonQuantity > 8) {
        currentSelectedSummonQuantity = 8;
        summonQuantityInput.value = 8;
    }

    summonRaritySelect.onchange = handleSummonGameSelectionChange;
    summonQuantityInput.onchange = handleSummonGameSelectionChange;
    summonQuantityInput.oninput = handleSummonGameSelectionChange;

    const packSlot = gameContentEl.querySelector('#summon-pack-slot'); // Get from cloned content
    if (packSlot) {
        packSlot.onclick = handleSummonNowButtonClick;
    }

    renderSummonGameScreen(gameContentEl); // Pass gameContentEl to render function
}

function handleSummonGameSelectionChange() {
    // Assuming this function is called when the active mini-game is Summon Game,
    // so gameContentEl would be the #mini-game-content-active > .mini-game-main-content
    const gameContentEl = document.querySelector('#mini-game-content-active > .mini-game-main-content');
    if (!gameContentEl) {
        console.error("handleSummonGameSelectionChange: Cannot find active game content element.");
        return;
    }

    const summonRaritySelect = gameContentEl.querySelector('#summon-rarity-select');
    const summonQuantityInput = gameContentEl.querySelector('#summon-quantity-input');

    if (!summonRaritySelect || !summonQuantityInput) {
        console.error("handleSummonGameSelectionChange: Select or input not found in current game content.");
        return;
    }
    if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3');

    currentSelectedSummonRarity = summonRaritySelect.value;
    lastSelectedSummonRarityKey = currentSelectedSummonRarity; 

    currentSelectedSummonQuantity = parseInt(summonQuantityInput.value);

    if (isNaN(currentSelectedSummonQuantity) || currentSelectedSummonQuantity < 1) {
        currentSelectedSummonQuantity = 1;
        summonQuantityInput.value = 1;
    }
    if (currentSelectedSummonQuantity > 8) {
        currentSelectedSummonQuantity = 8;
        summonQuantityInput.value = 8;
    }
    renderSummonGameScreen(gameContentEl);
}

function renderSummonGameScreen(containerElement) {
    if (!containerElement) {
        console.error("renderSummonGameScreen: containerElement is null or undefined.");
        return;
    }
    const ticketListItemsContainer = containerElement.querySelector('#summon-ticket-list-items');
    const packImageEl = containerElement.querySelector('#summon-pack-image');
    const packStatusTextEl = containerElement.querySelector('#summon-pack-status-text');
    const packSlotEl = containerElement.querySelector('#summon-pack-slot');
    const descriptionParagraph = containerElement.querySelector('p.text-center.mt-4.text-sm');


    if (!ticketListItemsContainer || !packImageEl || !packStatusTextEl || !packSlotEl || !descriptionParagraph || typeof summonTickets === 'undefined' || typeof getRarityTierInfo !== 'function') {
        console.error("Summon Game: Cannot render, UI elements or summonTickets/getRarityTierInfo missing from container.", containerElement);
        return;
    }

    ticketListItemsContainer.innerHTML = '';
    summonTicketRarities.forEach(rarityKey => {
        const rarityInfo = getRarityTierInfo(rarityKey);
        const ticketInfo = document.createElement('p');
        ticketInfo.className = 'summon-ticket-balance-item';

        ticketInfo.innerHTML = `
            <span class="ticket-rarity-info">
                <span class="ticket-dot ${rarityKey}"></span>
                <span class="rarity-text-${rarityKey}">${rarityInfo?.name || rarityKey}:</span>
            </span>
            <span class="ticket-count">${getSummonTicketBalance(rarityKey)}</span>`;
        ticketListItemsContainer.appendChild(ticketInfo);
    });

    const currentRarityInfo = currentSelectedSummonRarity ? getRarityTierInfo(currentSelectedSummonRarity) : null;

    if (currentRarityInfo) {
        packImageEl.src = `gui/anvil_covers/${currentSelectedSummonRarity}_pack.png`;
        packImageEl.alt = `${currentRarityInfo.name} Summon Pack`;
        packImageEl.onerror = function() {
            this.src = 'gui/anvil_covers/anvilpack.png';
            this.alt = 'Summon Pack (Default)';
            this.onerror = null;
        };

        const ticketsNeeded = currentSelectedSummonQuantity;
        const ticketsOwned = getSummonTicketBalance(currentSelectedSummonRarity);
        const ticketsOwned = getSummonTicketBalance(currentSelectedSummonRarity);
        const canSummon = ticketsOwned >= ticketsNeeded;

        packSlotEl.classList.toggle('active', canSummon);
        // packSlotEl.classList.toggle('summon-pack-unavailable', !canSummon); // Reverted this line
        packSlotEl.style.cursor = canSummon ? 'pointer' : 'not-allowed';

        if (canSummon) {
            packSlotEl.title = `Summon ${currentSelectedSummonQuantity} x ${currentRarityInfo.name} Pack(s)`;
            packStatusTextEl.textContent = `Ready! Costs ${ticketsNeeded} ${currentRarityInfo.name} Ticket(s). Click pack to summon.`;
            packStatusTextEl.style.color = 'var(--material-primary)';
        } else {
            packSlotEl.title = `Not enough ${currentRarityInfo.name} tickets.`;
            packStatusTextEl.textContent = `Need ${ticketsNeeded - ticketsOwned} more ${currentRarityInfo.name} Ticket(s).`;
            packStatusTextEl.style.color = 'var(--material-error)';
        }
        
        if (SUMMON_OUTCOME_RATES && SUMMON_OUTCOME_RATES[currentSelectedSummonRarity]) {
            const outcomeDistribution = SUMMON_OUTCOME_RATES[currentSelectedSummonRarity];
            const chanceForSelectedRarity = outcomeDistribution[currentSelectedSummonRarity] || 0;
            const percentageChance = (chanceForSelectedRarity * 100).toFixed(0);
            descriptionParagraph.textContent = `Use your Summon Tickets to summon cards. Summoning for a ${currentRarityInfo.name} card gives approximately a ${percentageChance}% chance to get a ${currentRarityInfo.name} card. You might also receive cards of other rarities based on the summon type.`;
        } else {
            descriptionParagraph.textContent = "Use your Summon Tickets to get specific rarity cards! Select a rarity to see specific chances.";
        }

    } else {
        packImageEl.src = 'gui/anvil_covers/anvilpack.png';
        packImageEl.alt = 'Summon Pack';
        packSlotEl.classList.remove('active');
        packSlotEl.style.cursor = 'not-allowed';
        packSlotEl.title = 'Select rarity and quantity to activate';
        packStatusTextEl.textContent = 'Select pack type and quantity.';
        packStatusTextEl.style.color = 'var(--material-text-secondary-dark)'; 
        descriptionParagraph.textContent = "Use your Summon Tickets to get specific rarity cards! Select a rarity to see specific chances.";
    }
}

function handleSummonNowButtonClick() {
    const currentRarityInfo = currentSelectedSummonRarity ? getRarityTierInfo(currentSelectedSummonRarity) : null;
    if (!currentRarityInfo) {
        showCustomAlert("Please select a valid rarity to summon.");
        return;
    }
    if (currentSelectedSummonQuantity < 1 || currentSelectedSummonQuantity > 8) {
        showCustomAlert("Please select a quantity between 1 and 8.");
        return;
    }

    const ticketsNeeded = currentSelectedSummonQuantity;
    const ticketsOwned = getSummonTicketBalance(currentSelectedSummonRarity);

    if (ticketsOwned < ticketsNeeded) {
        showCustomAlert(`Not enough ${currentRarityInfo.name} tickets. You need ${ticketsNeeded}, but have ${ticketsOwned}.`);
        return;
    }

    if (!updateSummonTicketBalance(currentSelectedSummonRarity, -ticketsNeeded)) {
        showCustomAlert("Failed to update ticket balance. Please try again.");
        return;
    }
    if (typeof playSound === 'function') playSound('sfx_summon_use_ticket.mp3');


    const summonedCardsOutput = [];
    const outcomeDistribution = SUMMON_OUTCOME_RATES[currentSelectedSummonRarity];

    if (!outcomeDistribution || Object.keys(outcomeDistribution).length === 0) {
        showCustomAlert(`Error: No summon outcome configuration found for ${currentRarityInfo.name}. Cannot generate cards. Tickets refunded.`, null, 3000);
        updateSummonTicketBalance(currentSelectedSummonRarity, ticketsNeeded); // Refund tickets
        return;
    }
    
    const defaultOutputRarityOnError = RARITY_PACK_PULL_DISTRIBUTION[0]?.key || 'base';
    const activeSetPool = getActiveSetDefinitions(); // Get sets for current active version

    if (activeSetPool.length === 0) {
        showCustomAlert("Error: No card sets available for the current version. Cannot summon cards.", null, 3000);
        updateSummonTicketBalance(currentSelectedSummonRarity, ticketsNeeded); // Refund
        return;
    }

    for (let i = 0; i < currentSelectedSummonQuantity; i++) {
        let actualOutputRarityString = defaultOutputRarityOnError;
        const roll = Math.random();
        let cumulativeProb = 0;
        let foundOutcome = false;
        for (const rarityKey in outcomeDistribution) {
            if (outcomeDistribution.hasOwnProperty(rarityKey)) {
                cumulativeProb += outcomeDistribution[rarityKey];
                if (roll < cumulativeProb) {
                    actualOutputRarityString = rarityKey;
                    foundOutcome = true;
                    break;
                }
            }
        }
        if (!foundOutcome) { 
             console.warn(`Summon Game: Probability issue for ${currentSelectedSummonRarity} summon. Roll: ${roll}, Cumulative: ${cumulativeProb}. Defaulting result.`);
             const possibleKeys = Object.keys(outcomeDistribution);
             if (possibleKeys.length > 0) actualOutputRarityString = possibleKeys[possibleKeys.length-1];
        }


        const outputRarityInfo = getRarityTierInfo(actualOutputRarityString);
        if (!outputRarityInfo) {
            console.error(`Summon Game: Could not determine a valid output rarity for a card. Key: ${actualOutputRarityString}. Defaulting to base.`);
            actualOutputRarityString = defaultOutputRarityOnError; 
        }

        let resultSetIdentifier, randomResultCardId;
        let attempts = 0; const MAX_ATTEMPTS = 200;
        do {
            attempts++;
            // Pick from activeSetPool instead of ALL_SET_DEFINITIONS
            const randomSetDef = activeSetPool[Math.floor(Math.random() * activeSetPool.length)];
            const tempSetIdentifier = randomSetDef.abbr;

            if (randomSetDef.count <= 0) continue;

            let potentialCardIdsInSet = Array.from({ length: randomSetDef.count }, (_, k) => k + 1);
            let eligibleCardIdsForResult = potentialCardIdsInSet.filter(id => getCardIntrinsicRarity(tempSetIdentifier, id) === actualOutputRarityString);
            
            if (eligibleCardIdsForResult.length > 0) {
                resultSetIdentifier = tempSetIdentifier;
                randomResultCardId = eligibleCardIdsForResult[Math.floor(Math.random() * eligibleCardIdsForResult.length)];
                break;
            }
        } while (attempts < MAX_ATTEMPTS); 

        if (!resultSetIdentifier || !randomResultCardId) {
            console.warn(`Summon: Could not find card with intrinsic rarity ${actualOutputRarityString} in active sets. Picking random card as fallback from active sets.`);
            const randomSetDefFallback = activeSetPool[Math.floor(Math.random() * activeSetPool.length)];
            resultSetIdentifier = randomSetDefFallback.abbr;
            if (randomSetDefFallback.count > 0) {
                 randomResultCardId = Math.floor(Math.random() * randomSetDefFallback.count) + 1;
            } else { 
                 // This case should be rare if activeSetPool is filtered for sets with count > 0
                 // but as a last resort:
                 resultSetIdentifier = activeSetPool[0].abbr; 
                 randomResultCardId = 1; 
            }
        }

        const fixedProps = getFixedGradeAndPrice(resultSetIdentifier, randomResultCardId);
        
        summonedCardsOutput.push({
            set: resultSetIdentifier,
            cardId: randomResultCardId,
            rarityKey: fixedProps.rarityKey, 
            grade: fixedProps.grade,
            price: fixedProps.price,
            revealed: false,
            isNew: !collection[resultSetIdentifier]?.[randomResultCardId] || collection[resultSetIdentifier][randomResultCardId].count === 0,
            packIndex: i 
        });
    }

    if (summonedCardsOutput.length === 0 && currentSelectedSummonQuantity > 0) {
        showCustomAlert("No cards were generated from the summon. This might be an error. Tickets may have been refunded if possible.", null, 3000);
        const gameContentElForRender = document.querySelector('#mini-game-content-active > .mini-game-main-content');
        if (gameContentElForRender) renderSummonGameScreen(gameContentElForRender);
        return;
    }

    isOpeningSummonPack = true;
    summonPackSource = [...summonedCardsOutput];

    const transitionMessage = `Summoning ${currentSelectedSummonQuantity} ${currentRarityInfo.name} card(s)!`;
    showPackTransition(transitionMessage, 2500, currentSelectedSummonRarity, () => {
        showScreen(SCREENS.PACK_SELECTION); 
        if (typeof openingpack !== 'undefined' && typeof openingpack.prepareForSummonGamePack === 'function') {
            openingpack.prepareForSummonGamePack();
        } else {
            console.error("openingpack.prepareForSummonGamePack function is not defined!");
            isOpeningSummonPack = false; 
            summonPackSource = [];
            loadMiniGame(SCREENS.SUMMON_GAME); // Go back to summon game via loadMiniGame
        }
        // renderSummonGameScreen will be called if user navigates back to Summon Game via loadMiniGame
        if (typeof saveGame === 'function') saveGame();
    });
}
