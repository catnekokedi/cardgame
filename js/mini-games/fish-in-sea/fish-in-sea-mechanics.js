// js/mini-games/fishing-game/fishing-mechanics.js

const fishingMechanics = {
    castRod() {
        if (fishingGameState.isRodCast || fishingGameState.isReeling) return;
        playSound('sfx_fishing_cast.mp3');
        fishingUi.setCatState('casting'); 

        fishingGameState.isRodCast = true;
        fishingGameState.isReeling = false;
        const rod = fishingGameState.currentRod;
        fishingGameState.timeToNextBite = (Math.random() * 5000 + 2000) / rod.catchSpeedFactor;

        fishingUi.showBobber();
        fishingUi.drawRodLine();
        fishingUi.updateStatusText("Waiting for a bite...");
        fishingUi.hideCatchPreview();

        // Set a timeout to change cat state to idle after casting animation finishes
        // only if not already reeling or if rod hasn't been reset.
        setTimeout(() => {
            if (fishingGameState.isRodCast && !fishingGameState.isReeling) {
                fishingUi.setCatState('idle'); 
            }
        }, 700); // Duration of catRodCastAnimation is 0.7s
    },

    updateBiteTimer() {
        if (!fishingGameState.isGameActive || !fishingGameState.isRodCast || fishingGameState.isReeling) return;
        fishingGameState.timeToNextBite -= 100; // Assuming game loop runs every 100ms
        if (fishingGameState.timeToNextBite <= 0) {
            this.triggerBite();
        }
    },

    triggerBite() {
        if (!fishingGameState.isRodCast || fishingGameState.isReeling) return;
        playSound('sfx_fishing_bite.mp3');
        // If rod was in 'idle' or 'casting' (finished), it's fine to set to 'idle' before reeling starts.
        // This ensures if the bite happens very quickly after cast, it doesn't get stuck in 'casting'.
        fishingUi.setCatState('idle'); 
        fishingGameState.isRodCast = false;
        fishingUi.showExclamationOnBobber(true);
        fishingUi.animateBobberBite(); 
        fishingUi.updateStatusText("BITE! Click the bobber!");

        if (fishingGameState.biteTimeoutId) clearTimeout(fishingGameState.biteTimeoutId);

        if (fishingGameState.currentRod.autoCatch) {
            fishingUi.updateStatusText("Auto-Reeling...");
            // The 'reeling' state will be set in handleBobberClick when it's called by auto-catch.
            setTimeout(() => {
                if (fishingGameState.ui.exclamation && fishingGameState.ui.exclamation.style.display === 'block' && !fishingGameState.isReeling) {
                     this.handleBobberClick(true);
                }
            }, 500 + Math.random() * 500);
        } else {
            fishingGameState.biteTimeoutId = setTimeout(() => {
                if (fishingGameState.ui.exclamation && fishingGameState.ui.exclamation.style.display === 'block' && !fishingGameState.isReeling) {
                    fishingUi.showTemporaryResultMessage("Too slow! The fish got away.");
                    playSound('sfx_fishing_lose.mp3');
                    this.resetFishingState();
                }
            }, fishingGameState.biteWindowMs);
        }
    },

    handleBobberClick(isAutoCatch = false) {
        if (fishingGameState.isReeling || (!isAutoCatch && (!fishingGameState.ui.exclamation || fishingGameState.ui.exclamation.style.display === 'none'))) return;

        clearTimeout(fishingGameState.biteTimeoutId);
        fishingGameState.isReeling = true;
        fishingUi.showExclamationOnBobber(false);
        fishingUi.updateStatusText(isAutoCatch ? "Auto-Reeling..." : "Reeling it in...");
        fishingUi.setCatState('reeling'); 

        if(!isAutoCatch) playSound('sfx_fishing_reel.mp3');

        setTimeout(() => {
            const success = Math.random() < fishingGameState.currentRod.successRate;
            if (success) {
                const caughtItem = this.determineCatch();
                fishingGameState.basket.push({ ...caughtItem, id: Date.now() + Math.random().toString(16).slice(2), locked: false }); // Add locked property
                fishingUi.showCatchPreview(caughtItem);
                playSound('sfx_fishing_win.mp3');

                if (fishingGameState.currentBait && fishingGameState.currentBait.id !== "none") {
                    fishingGameState.currentBaitUsesLeft--;
                    if (fishingGameState.currentBaitUsesLeft <= 0) {
                        fishingUi.showTemporaryResultMessage(`Your ${fishingGameState.currentBait.name} ran out!`);
                        fishingGameState.currentBaitId = "none";
                        fishingGameState.currentBait = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === "none");
                        fishingGameState.currentBaitUsesLeft = Infinity;
                        fishingUi.updateRodAndBaitDisplay();
                    }
                }
                if (typeof saveGame === 'function') saveGame();
            } else {
                fishingUi.showTemporaryResultMessage("Aww, it got away!");
                playSound('sfx_fishing_lose.mp3');
            }
            this.resetFishingState(); // This will set cat state back to 'idle'
        }, FISHING_CONFIG.REEL_TIME_BASE_MS + Math.random() * FISHING_CONFIG.REEL_TIME_RANDOM_MS);
    },

    determineCatch() {
        const rod = fishingGameState.currentRod;
        const bait = fishingGameState.currentBait;

        const ticketChance = FISHING_CONFIG.BASE_TICKET_CHANCE + (rod.ticketCatchBonus || 0) + (bait?.ticketBoost || 0);
        const isTicket = Math.random() < ticketChance;

        if (isTicket) {
            const ticketRarities = ['rare', 'foil', 'holo'];
            const randomTicketRarityKey = ticketRarities[Math.floor(Math.random() * ticketRarities.length)];
            const ticketRarityInfo = getRarityTierInfo(randomTicketRarityKey);
            if (typeof addSummonTickets === 'function') addSummonTickets(randomTicketRarityKey, 1);
            return { type: 'ticket', details: { rarityKey: randomTicketRarityKey, name: `${ticketRarityInfo ? ticketRarityInfo.name : randomTicketRarityKey} Ticket` }};
        } else {
            let pullRarityKey = 'base';
            const baseProbabilities = liveRarityPackPullDistribution || RARITY_PACK_PULL_DISTRIBUTION;
            let randomPackProb = Math.random();
            randomPackProb -= (rod.rarityBonus || 0);
            randomPackProb -= (bait?.rarityBoost || 0);
            randomPackProb = Math.max(0, randomPackProb);

            let cumulativePackProb = 0;
            for (const tier of baseProbabilities) {
                cumulativePackProb += tier.packProb;
                if (randomPackProb < cumulativePackProb) {
                    pullRarityKey = tier.key;
                    break;
                }
            }
             if (randomPackProb >= cumulativePackProb && cumulativePackProb < (1.0 - 0.00001) && baseProbabilities.length > 0) {
                 pullRarityKey = baseProbabilities[0].key;
            }

            const activeSets = getActiveSetDefinitions();
            let cardDetails = null;
            let attempts = 0;
            while (!cardDetails && attempts < 50 && activeSets.length > 0) {
                attempts++;
                const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
                if (randomSetDef.count > 0) {
                    const potentialCardIds = Array.from({ length: randomSetDef.count }, (_, k) => k + 1);
                    const eligibleCards = potentialCardIds.filter(id => getCardIntrinsicRarity(randomSetDef.abbr, id) === pullRarityKey);
                    if (eligibleCards.length > 0) {
                        const cardId = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
                        const fixedProps = getFixedGradeAndPrice(randomSetDef.abbr, cardId);
                        cardDetails = { set: randomSetDef.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price };
                    }
                }
            }
            if (!cardDetails && activeSets.length > 0) {
                 const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
                 const cardId = (randomSetDef.count > 0) ? Math.floor(Math.random() * randomSetDef.count) + 1 : 1;
                 const fixedProps = getFixedGradeAndPrice(randomSetDef.abbr, cardId);
                 cardDetails = { set: randomSetDef.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price };
            } else if (!cardDetails) {
                const fallbackSet = ALL_SET_DEFINITIONS.find(s => s.count > 0) || ALL_SET_DEFINITIONS[0];
                const cardId = (fallbackSet.count > 0) ? Math.floor(Math.random() * fallbackSet.count) + 1 : 1;
                const fixedProps = getFixedGradeAndPrice(fallbackSet.abbr, cardId);
                cardDetails = {set: fallbackSet.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price};
            }
            return { type: 'card', details: cardDetails };
        }
    },

    resetFishingState() {
        fishingGameState.isRodCast = false;
        fishingGameState.isReeling = false;
        fishingUi.hideBobber();
        fishingUi.hideRodLine();
        fishingUi.showExclamationOnBobber(false);
        fishingUi.resetBobberAnimation(); 
        clearTimeout(fishingGameState.biteTimeoutId);
        fishingGameState.biteTimeoutId = null;
        fishingUi.updateStatusText();
        fishingUi.setCatState('idle'); 
    },

    processShopExchange(category, itemKey, itemsOfThisType, exchangeRatesConfig, targetTicketType) {
        if (!itemsOfThisType || itemsOfThisType.length === 0) return { ticketType: targetTicketType, count: 0, itemsConsumedCount: 0 };

        const rateConfig = exchangeRatesConfig[itemKey];
        if (!rateConfig || !rateConfig[targetTicketType]) return { ticketType: targetTicketType, count: 0, itemsConsumedCount: 0 };

        const rate = rateConfig[targetTicketType];
        const progressKey = `${itemKey}_for_${targetTicketType}`;

        // Ensure category exists in shopProgress
        if (!fishingGameState.shopProgress[category]) {
            fishingGameState.shopProgress[category] = {};
        }

        let currentProgress = fishingGameState.shopProgress[category][progressKey] || 0;
        let totalAvailableQuantity = currentProgress + itemsOfThisType.length;
        let ticketsAwardedThisRule = 0;
        let itemsConsumedFromBasketThisRule = 0;

        if (totalAvailableQuantity >= rate) {
            ticketsAwardedThisRule = Math.floor(totalAvailableQuantity / rate);
            if (ticketsAwardedThisRule > 0) {
                addSummonTickets(targetTicketType.replace('_ticket',''), ticketsAwardedThisRule);
                const itemsNeededForFullTickets = (ticketsAwardedThisRule * rate) - currentProgress;
                itemsConsumedFromBasketThisRule = Math.min(itemsOfThisType.length, itemsNeededForFullTickets);
                fishingGameState.shopProgress[category][progressKey] = totalAvailableQuantity % rate;
            } else { 
                fishingGameState.shopProgress[category][progressKey] = totalAvailableQuantity;
                itemsConsumedFromBasketThisRule = itemsOfThisType.length;
            }
        } else { 
            fishingGameState.shopProgress[category][progressKey] = totalAvailableQuantity;
            itemsConsumedFromBasketThisRule = itemsOfThisType.length;
        }
        return { ticketType: targetTicketType, count: ticketsAwardedThisRule, itemsConsumedCount: itemsConsumedFromBasketThisRule };
    }
};