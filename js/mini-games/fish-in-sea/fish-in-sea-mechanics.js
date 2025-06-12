// js/mini-games/fishing-game/fishing-mechanics.js

const fishingMechanics = {
    activeFish: [],
    maxActiveFish: 4, // Can be adjusted
    seaBoundaries: { minX: 50, maxX: 350, minY: 50, maxY: 250 }, // Example, adjust based on UI
    hookPosition: { x: 200, y: 100 }, // Example, can be dynamic
    biteDistance: 25, // How close fish needs to be to bite
    biteChancePerSecond: 0.6,
    biteTimerDuration: 3000, // 3 seconds to react to a bite

    initializeFishingMechanics() {
        this.activeFish = [];
        for (let i = 0; i < this.maxActiveFish; i++) {
            this.spawnFish();
        }
        // Reset relevant fishingGameState properties
        fishingGameState.isRodCast = false;
        fishingGameState.isReeling = false;
        fishingGameState.bitingFishId = null;
        fishingGameState.hasHookedFish = false; // New state for when fish is on the hook but not yet reeled
        fishingGameState.biteTimer = 0;

        if (typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.renderFish === 'function') {
            fishingGameUi.renderFish(this.activeFish);
        }
        console.log("Fishing mechanics initialized with fish.");
    },

    spawnFish(replaceFishId = null) {
        const newFish = {
            id: `fish_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            x: this.seaBoundaries.minX + Math.random() * (this.seaBoundaries.maxX - this.seaBoundaries.minX),
            y: this.seaBoundaries.minY + Math.random() * (this.seaBoundaries.maxY - this.seaBoundaries.minY),
            speedX: (Math.random() - 0.5) * 20, // pixels per second
            speedY: (Math.random() - 0.5) * 20,
            targetX: this.seaBoundaries.minX + Math.random() * (this.seaBoundaries.maxX - this.seaBoundaries.minX),
            targetY: this.seaBoundaries.minY + Math.random() * (this.seaBoundaries.maxY - this.seaBoundaries.minY),
            rarity: "common", // Placeholder
            isCardPlaceholder: true, // All fish are placeholders for now
            // Add visual properties like image path if needed by UI
            imagePath: 'gui/fishing_game/fish_card_placeholder.png' // Default placeholder
        };

        if (replaceFishId) {
            const index = this.activeFish.findIndex(f => f.id === replaceFishId);
            if (index !== -1) {
                this.activeFish[index] = newFish;
            } else {
                this.activeFish.push(newFish); // Should not happen if replacing
            }
        } else if (this.activeFish.length < this.maxActiveFish) {
            this.activeFish.push(newFish);
        }
        // console.log("Spawned fish:", newFish.id);
    },

    updateFishMovement(deltaTime) { // deltaTime in seconds
        if (!fishingGameState.isGameActive) return;
        let fishChanged = false;
        this.activeFish.forEach(fish => {
            if (fish.id === fishingGameState.bitingFishId && fishingGameState.hasHookedFish) {
                // Fish is hooked, it shouldn't move on its own.
                // Its position might follow the hook/float if that moves.
                fish.x = this.hookPosition.x; // Stay at hook
                fish.y = this.hookPosition.y;
                fishChanged = true;
                return;
            }

            const dx = fish.targetX - fish.x;
            const dy = fish.targetY - fish.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) { // Reached target
                fish.targetX = this.seaBoundaries.minX + Math.random() * (this.seaBoundaries.maxX - this.seaBoundaries.minX);
                fish.targetY = this.seaBoundaries.minY + Math.random() * (this.seaBoundaries.maxY - this.seaBoundaries.minY);
                // Update speed as well for variety
                fish.speedX = (Math.random() - 0.5) * 20 + (dx / distance * 10); // Add some momentum bias
                fish.speedY = (Math.random() - 0.5) * 20 + (dy / distance * 10);
            } else {
                fish.x += (fish.speedX * deltaTime);
                fish.y += (fish.speedY * deltaTime);
            }

            // Boundary checks
            fish.x = Math.max(this.seaBoundaries.minX, Math.min(this.seaBoundaries.maxX, fish.x));
            fish.y = Math.max(this.seaBoundaries.minY, Math.min(this.seaBoundaries.maxY, fish.y));
            fishChanged = true;
        });

        if (fishChanged && typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.renderFish === 'function') {
            fishingGameUi.renderFish(this.activeFish);
        }
    },

    castRod() {
        if (fishingGameState.isRodCast || fishingGameState.isReeling || fishingGameState.hasHookedFish) return;

        // For now, hook position is fixed or uses the default this.hookPosition
        // Later, this could be player controlled.
        // this.hookPosition = { x: ..., y: ... };

        if (typeof playSound === 'function') playSound('sfx_fishing_cast.mp3');
        if (typeof fishingUi !== 'undefined') fishingUi.setCatState('casting'); // Existing UI call

        fishingGameState.isRodCast = true; // Means line is in water, waiting for bite
        fishingGameState.isReeling = false;
        fishingGameState.bitingFishId = null;
        fishingGameState.hasHookedFish = false;

        if (typeof fishingGameUi !== 'undefined') {
            fishingGameUi.renderFishingRod(true, this.hookPosition); // Show rod/line/float
            if (typeof fishingGameUi.showBiteIndicator === 'function') fishingGameUi.showBiteIndicator(false);
        }
        if (typeof fishingUi !== 'undefined') { // Keep old UI calls if they exist and are separate
             fishingUi.showBobber(); // This might be part of renderFishingRod now
             fishingUi.drawRodLine();
             fishingUi.updateStatusText("Waiting for a bite...");
             fishingUi.hideCatchPreview();
        }


        setTimeout(() => { // Existing timeout for cat animation
            if (fishingGameState.isRodCast && !fishingGameState.isReeling && !fishingGameState.hasHookedFish) {
                if (typeof fishingUi !== 'undefined') fishingUi.setCatState('idle');
            }
        }, 700);
        console.log("Rod cast at", this.hookPosition);
    },

    checkForBite(deltaTime) { // deltaTime in seconds
        if (!fishingGameState.isRodCast || fishingGameState.isReeling || fishingGameState.hasHookedFish) {
            return;
        }

        this.activeFish.forEach(fish => {
            if (fishingGameState.hasHookedFish) return; // Already a fish on the hook

            const dx = fish.x - this.hookPosition.x;
            const dy = fish.y - this.hookPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.biteDistance) {
                if (Math.random() < (this.biteChancePerSecond * deltaTime)) {
                    fishingGameState.bitingFishId = fish.id;
                    fishingGameState.hasHookedFish = true; // Fish is on the hook!
                    fishingGameState.isRodCast = false; // No longer just "cast", now it's "hooked"
                    fishingGameState.biteTimer = this.biteTimerDuration;

                    if (typeof playSound === 'function') playSound('sfx_fishing_bite.mp3');
                    if (typeof fishingUi !== 'undefined') fishingUi.setCatState('idle'); // Cat is alert
                    if (typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.showBiteIndicator === 'function') {
                        fishingGameUi.showBiteIndicator(true); // Visual cue: float bobs
                    }
                     if (typeof fishingUi !== 'undefined') { // Legacy UI calls
                        fishingUi.showExclamationOnBobber(true);
                        fishingUi.animateBobberBite();
                        fishingUi.updateStatusText("BITE! Reel it in!");
                    }
                    console.log(`Fish ${fish.id} is biting!`);

                    // Auto-catch logic from old system (optional)
                    // if (fishingGameState.currentRod && fishingGameState.currentRod.autoCatch) { ... }
                    return; // Stop checking other fish
                }
            }
        });

        // If a fish is hooked, manage the bite timer
        if (fishingGameState.hasHookedFish && fishingGameState.biteTimer > 0) {
            fishingGameState.biteTimer -= (deltaTime * 1000); // Convert deltaTime to ms for timer
            if (fishingGameState.biteTimer <= 0) {
                this.handleFishEscape();
            }
        }
    },

    handleFishEscape() {
        if (typeof fishingUi !== 'undefined') fishingUi.showTemporaryResultMessage("Too slow! The fish got away.");
        if (typeof playSound === 'function') playSound('sfx_fishing_lose.mp3');

        const escapedFish = this.activeFish.find(f => f.id === fishingGameState.bitingFishId);
        if(escapedFish) {
            // Make the fish dart away quickly
            escapedFish.targetX = Math.random() < 0.5 ? this.seaBoundaries.minX - 50 : this.seaBoundaries.maxX + 50;
            escapedFish.targetY = Math.random() < 0.5 ? this.seaBoundaries.minY - 50 : this.seaBoundaries.maxY + 50;
            escapedFish.speedX *= 3; // Increase speed
            escapedFish.speedY *= 3;
        }

        this.resetFishingState(); // Resets most states
        // Specific UI updates for escape
        if (typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.showBiteIndicator === 'function') {
            fishingGameUi.showBiteIndicator(false);
        }
    },

    reelRod() {
        if (fishingGameState.isReeling || !fishingGameState.hasHookedFish) {
            // If rod is cast but no fish hooked, reeling just brings it back
            if (fishingGameState.isRodCast && !fishingGameState.hasHookedFish) {
                 if (typeof playSound === 'function') playSound('sfx_fishing_reel_empty.mp3'); // Different sound
                 console.log("Reeling empty hook.");
                 this.resetFishingState();
                 if (typeof fishingGameUi !== 'undefined') fishingGameUi.renderFishingRod(false, this.hookPosition);
            }
            return;
        }

        fishingGameState.isReeling = true;
        // fishingGameState.hasHookedFish remains true until catch/fail

        if (typeof fishingUi !== 'undefined') {
            fishingUi.showExclamationOnBobber(false); // Remove exclamation if it was from old system
            fishingUi.updateStatusText("Reeling it in...");
            fishingUi.setCatState('reeling');
        }
        if (typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.updateReelingState === 'function') {
            fishingGameUi.updateReelingState(true);
            fishingGameUi.showBiteIndicator(false); // Stop bite animation
        }
        if (typeof playSound === 'function') playSound('sfx_fishing_reel.mp3');

        setTimeout(() => {
            const success = Math.random() < (fishingGameState.currentRod?.successRate || 0.7); // Use default if rod undefined
            if (success) {
                const caughtItem = this.determineCatch(fishingGameState.bitingFishId); // Pass fish ID

                if (caughtItem.type === 'card') {
                    // Construct cardData for the basket
                    const cardDataForBasket = {
                        id: caughtItem.details.cardId, // Assuming cardId is unique enough for basket ID
                        set: caughtItem.details.set,
                        name: caughtItem.name || `${caughtItem.details.set} ${caughtItem.details.cardId}`, // Use provided name or generate
                        rarity: caughtItem.details.rarityKey,
                        price: caughtItem.details.price,
                        // imagePath should be determined by getCardImagePath or similar if not directly on details
                        imagePath: `img/cards/${caughtItem.details.set}/${caughtItem.details.cardId}.png`, // Example path
                        type: 'fish', // Explicitly type it for basket filtering perhaps
                        source: 'fishing'
                        // grade: caughtItem.details.grade, // if grade is part of details
                    };
                    if (typeof addItemToBasket === 'function') {
                        addItemToBasket(cardDataForBasket, 1);
                    } else {
                        console.error("addItemToBasket function is undefined!");
                    }
                } else if (caughtItem.type === 'ticket') {
                    // Ticket is handled by determineCatch (calls addSummonTickets)
                    // No need to add to fishing basket.
                }

                if (typeof fishingUi !== 'undefined') fishingUi.showCatchPreview(caughtItem); // Show preview of what was caught
                if (typeof playSound === 'function') playSound('sfx_fishing_win.mp3');

                // Remove caught fish and spawn a new one
                this.spawnFish(fishingGameState.bitingFishId);

                // Handle bait consumption (from old system)
                if (fishingGameState.currentBait && fishingGameState.currentBait.id !== "none") {
                    fishingGameState.currentBaitUsesLeft--;
                    if (fishingGameState.currentBaitUsesLeft <= 0) {
                        if (typeof fishingUi !== 'undefined') fishingUi.showTemporaryResultMessage(`Your ${fishingGameState.currentBait.name} ran out!`);
                        fishingGameState.currentBaitId = "none";
                        fishingGameState.currentBait = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === "none");
                        fishingGameState.currentBaitUsesLeft = Infinity;
                        if (typeof fishingUi !== 'undefined') fishingUi.updateRodAndBaitDisplay();
                    }
                }
                if (typeof saveGame === 'function') saveGame();
            } else {
                if (typeof fishingUi !== 'undefined') fishingUi.showTemporaryResultMessage("Aww, it got away!");
                if (typeof playSound === 'function') playSound('sfx_fishing_lose.mp3');
                // Fish that got away might just resume normal behavior or despawn
                 const escapedFish = this.activeFish.find(f => f.id === fishingGameState.bitingFishId);
                 if(escapedFish) this.spawnFish(escapedFish.id); // Replace escaped fish
            }
            this.resetFishingState();
            if (typeof fishingGameUi !== 'undefined') {
                fishingGameUi.updateReelingState(false);
                fishingGameUi.renderFishingRod(false, this.hookPosition); // Hide rod
            }
        }, (FISHING_CONFIG?.REEL_TIME_BASE_MS || 1000) + Math.random() * (FISHING_CONFIG?.REEL_TIME_RANDOM_MS || 500));
    },

    determineCatch(caughtFishId) {
        // const fishData = this.activeFish.find(f => f.id === caughtFishId);
        // For now, use existing determineCatch logic which doesn't depend on specific fish from sea
        const rod = fishingGameState.currentRod;
        const bait = fishingGameState.currentBait;

        const ticketChance = FISHING_CONFIG.BASE_TICKET_CHANCE + (rod.ticketCatchBonus || 0) + (bait?.ticketBoost || 0);
        const isTicket = Math.random() < ticketChance;

        if (isTicket) {
            // ... (existing ticket logic remains the same)
            const ticketRarities = ['rare', 'foil', 'holo']; // Example, use FISHING_CONFIG if defined
            const randomTicketRarityKey = ticketRarities[Math.floor(Math.random() * ticketRarities.length)];
            const ticketRarityInfo = typeof getRarityTierInfo !== 'undefined' ? getRarityTierInfo(randomTicketRarityKey) : {name: randomTicketRarityKey};
            if (typeof addSummonTickets === 'function') addSummonTickets(randomTicketRarityKey, 1);
            else console.warn("addSummonTickets function not found.");
            return { type: 'ticket', details: { rarityKey: randomTicketRarityKey, name: `${ticketRarityInfo.name} Ticket` }};
        } else {
            // ... (existing card logic remains the same)
            // This part is complex and seems to rely on many external functions (getRarityTierInfo, getActiveSetDefinitions etc.)
            // Assuming these functions are globally available and part of the broader game context.
            let pullRarityKey = 'base'; // Default or determine by fishData.rarity if available
            const baseProbabilities = (typeof liveRarityPackPullDistribution !== 'undefined' && liveRarityPackPullDistribution) ? liveRarityPackPullDistribution : (FISHING_CONFIG?.RARITY_DISTRIBUTION || [{key:'base', packProb:1}]);
            let randomPackProb = Math.random();
            randomPackProb -= (rod?.rarityBonus || 0); // Use optional chaining for safety
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
                 pullRarityKey = baseProbabilities[0].key; // Fallback to lowest if something odd happens
            }

            const activeSets = typeof getActiveSetDefinitions === 'function' ? getActiveSetDefinitions() : [{abbr: 'V1', count: 100}]; // Fallback
            let cardDetails = null;
            let attempts = 0;
            while (!cardDetails && attempts < 50 && activeSets.length > 0) {
                // ... (rest of the card determination logic)
                attempts++;
                const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
                if (randomSetDef.count > 0) {
                    const potentialCardIds = Array.from({ length: randomSetDef.count }, (_, k) => k + 1);
                    const eligibleCards = potentialCardIds.filter(id => (typeof getCardIntrinsicRarity === 'function' ? getCardIntrinsicRarity(randomSetDef.abbr, id) : 'base') === pullRarityKey);
                    if (eligibleCards.length > 0) {
                        const cardId = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
                        const fixedProps = typeof getFixedGradeAndPrice === 'function' ? getFixedGradeAndPrice(randomSetDef.abbr, cardId) : {rarityKey: pullRarityKey, grade:'S', price:100};
                        cardDetails = { set: randomSetDef.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price };
                    }
                }
            }
             if (!cardDetails) { // Fallback if no card found after attempts
                const fallbackSet = activeSets.find(s => s.count > 0) || (typeof ALL_SET_DEFINITIONS !== 'undefined' ? ALL_SET_DEFINITIONS[0] : {abbr:'V1', count:1});
                const cardId = (fallbackSet.count > 0) ? Math.floor(Math.random() * fallbackSet.count) + 1 : 1;
                const fixedProps = typeof getFixedGradeAndPrice === 'function' ? getFixedGradeAndPrice(fallbackSet.abbr, cardId) : {rarityKey: 'base', grade:'S', price:10};
                cardDetails = {set: fallbackSet.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price};
            }
            return { type: 'card', details: cardDetails, isCardPlaceholder: true, name: "Fish Card" }; // Mark as placeholder
        }
    },

    resetFishingState() {
        fishingGameState.isRodCast = false;
        fishingGameState.isReeling = false;
        fishingGameState.bitingFishId = null;
        fishingGameState.hasHookedFish = false;
        fishingGameState.biteTimer = 0;

        if (typeof fishingUi !== 'undefined') { // Legacy UI
            fishingUi.hideBobber();
            fishingUi.hideRodLine();
            fishingUi.showExclamationOnBobber(false);
            fishingUi.resetBobberAnimation();
            fishingUi.updateStatusText(); // Update to default
            fishingUi.setCatState('idle');
        }
        if (typeof fishingGameUi !== 'undefined') { // New UI
            fishingGameUi.renderFishingRod(false, this.hookPosition);
            if (typeof fishingGameUi.showBiteIndicator === 'function') fishingGameUi.showBiteIndicator(false);
            if (typeof fishingGameUi.updateReelingState === 'function') fishingGameUi.updateReelingState(false);
        }

        if (fishingGameState.biteTimeoutId) { // Clear any pending bite timeout from old system
            clearTimeout(fishingGameState.biteTimeoutId);
            fishingGameState.biteTimeoutId = null;
        }
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