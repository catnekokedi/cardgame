// js/mini-games/fishing-game/fishing-mechanics.js

const fishingMechanicsInstance = { // Changed to const instance
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
        fishingGameState.biteTimer = 0; // Will be used for the time to react to a bite
        fishingGameState.biteTimeoutId = null; // Timer for when the bite will occur
        fishingGameState.biteReactionTimeoutId = null; // Timer for player to react to the bite

        // if (typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.renderFish === 'function') {
        //     fishingGameUi.renderFish(this.activeFish);
        // } // Removed as per task
        // console.log("Fishing mechanics initialized with fish."); // One-time init, keep if desired, but removing for aggressive pass
        // console.log("[Mechanics] fishingMechanics.initializeFishingMechanics called and executed."); // REMOVE as per prompt
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
            imagePath: 'gui/fishing_game/fish-back.png' // User request: use fish-back.png for in-sea visual
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
        // let fishChanged = false; // fishChanged can be removed if renderFish is not called here

        this.activeFish.forEach(fish => {
            // If a specific fish is hooked, make it stick to the hook visually.
            if (fishingGameState.hasHookedFish && fish.id === fishingGameState.bitingFishId) {
                fish.x = this.hookPosition.x;
                fish.y = this.hookPosition.y;
                // fishChanged = true;
                return; // No other movement logic for this hooked fish
            }

            // Normal movement logic
            const dx = fish.targetX - fish.x;
            const dy = fish.targetY - fish.y;
            const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

            if (distanceToTarget < 5) { // Reached current target
                // If rod is cast (but no specific fish hooked yet), fish might target the hook area visually.
                if (fishingGameState.isRodCast && !fishingGameState.hasHookedFish) {
                    // Fish swim towards the hook area, but not directly onto it, just nearby.
                    fish.targetX = this.hookPosition.x + (Math.random() - 0.5) * 50; // Target area around hook
                    fish.targetY = this.hookPosition.y + (Math.random() - 0.5) * 50;
                } else {
                    // Default random movement if rod is not cast or if a fish is already hooked (but not this one)
                    fish.targetX = this.seaBoundaries.minX + Math.random() * (this.seaBoundaries.maxX - this.seaBoundaries.minX);
                    fish.targetY = this.seaBoundaries.minY + Math.random() * (this.seaBoundaries.maxY - this.seaBoundaries.minY);
                }
                // Adjust speed for variety when choosing a new target
                fish.speedX = (Math.random() - 0.5) * 20 + (dx / distanceToTarget * 10 || 0);
                fish.speedY = (Math.random() - 0.5) * 20 + (dy / distanceToTarget * 10 || 0);
            } else {
                // Move towards target
                fish.x += (fish.speedX * deltaTime);
                fish.y += (fish.speedY * deltaTime);
            }

            // Boundary checks to keep fish within the sea
            fish.x = Math.max(this.seaBoundaries.minX, Math.min(this.seaBoundaries.maxX, fish.x));
            fish.y = Math.max(this.seaBoundaries.minY, Math.min(this.seaBoundaries.maxY, fish.y));
            // fishChanged = true;
        });

        // The direct call to renderFish from here is removed as per previous tasks.
        // The game loop or UI layer should handle rendering based on the updated activeFish array.
        // if (fishChanged && typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.renderFish === 'function') {
        //     fishingGameUi.renderFish(this.activeFish);
        // }
    },

    // Old castRod() is removed as its functionality is now in castRodAndWaitForBite()
    // castRod() { ... }

    // NOTE: The empty object '},' was likely a typo in the original file or a merge artifact.
    // It should be removed if it's not part of a valid structure.
    // Assuming it's a typo and removing it. If it was intentional, this might break something.
    // For safety, I will comment it out if it's just an empty object, or remove if it's a clear syntax issue.
    // Based on the context, it appears to be an extraneous comma after the castRod method,
    // and the following 'checkForBite' is correctly part of the main fishingMechanics object.
    // The diff will show if it's a simple comma or an actual empty object.
    // It was just an extra comma.

    castRodAndWaitForBite() {
        if (fishingGameState.isRodCast || fishingGameState.isReeling || fishingGameState.hasHookedFish) {
            return;
        }

        // Assuming this.hookPosition is set and valid (e.g. center of water)
        // As per issue: "Kedi oltasını suda hep aynı yere attığı için, fiziksel olarak hesaplamalara gerek yok"
        // this.hookPosition = { x: calculatedCenterX, y: calculatedCenterY }; // Update if dynamic calculation needed

        fishingGameState.isRodCast = true;
        fishingGameState.isReeling = false;
        fishingGameState.bitingFishId = null;
        fishingGameState.hasHookedFish = false;

        if (typeof playSound === 'function') playSound('sfx_fishing_cast.mp3');
        if (typeof window.fishingUi !== 'undefined') {
            window.fishingUi.setCatState('casting');
            window.fishingUi.showBobber(); // showBobber should use this.hookPosition or receive it
            window.fishingUi.drawRodLine(); // drawRodLine should use this.hookPosition or receive it
            if (window.fishingUi.resetBobberAnimation) window.fishingUi.resetBobberAnimation();
            if (window.fishingUi.updateStatusText) window.fishingUi.updateStatusText("Waiting for a bite...");
            if (window.fishingUi.hideCatchPreview) window.fishingUi.hideCatchPreview();
        }

        setTimeout(() => {
            // Check if still in casting state, not reeled in or bite occurred prematurely
            if (fishingGameState.isRodCast && !fishingGameState.isReeling && !fishingGameState.hasHookedFish) {
                if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.setCatState === 'function') {
                    window.fishingUi.setCatState('idle'); // Or 'waiting'
                }
            }
        }, 700); // Duration of casting animation

        // Initiate waiting logic
        // Random delay for bite, influenced by rod and bait
        const baseBiteTime = FISHING_CONFIG?.BASE_BITE_TIME_MS || 5000; // e.g., 5 seconds base
        const catchSpeedFactor = fishingGameState.currentRod?.catchSpeedFactor || 1.0;
        const biteBoost = fishingGameState.currentBait?.biteBoost || 1.0; // Assuming biteBoost is a multiplier like 1.1 for 10% faster

        // Higher factor/boost means shorter time
        let waitDuration = baseBiteTime / (catchSpeedFactor * biteBoost);
        // Add some randomness: e.g., +/- 20% of the calculated duration
        waitDuration = waitDuration * (0.8 + Math.random() * 0.4);
        waitDuration = Math.max(500, waitDuration); // Minimum wait time

        if (fishingGameState.biteTimeoutId) {
            clearTimeout(fishingGameState.biteTimeoutId);
        }
        fishingGameState.biteTimeoutId = setTimeout(() => {
            this.triggerBiteDisplay();
        }, waitDuration);
    },

    triggerBiteDisplay() {
        // Check if rod is still cast and no fish hooked (player might have reeled in early)
        if (!fishingGameState.isRodCast || fishingGameState.hasHookedFish || fishingGameState.isReeling) {
            return;
        }

        // Determine which fish is biting (can be random or the closest one if fish visuals are implemented)
        // For now, let's assume any fish can "bite" conceptually, and we pick one if needed for visuals.
        if (this.activeFish.length > 0) {
            fishingGameState.bitingFishId = this.activeFish[Math.floor(Math.random() * this.activeFish.length)].id;
        } else {
            // No visual fish available, but bite can still occur
            fishingGameState.bitingFishId = null;
        }

        fishingGameState.hasHookedFish = true;
        fishingGameState.isRodCast = false; // Now in "hooked" phase
        fishingGameState.biteTimer = FISHING_CONFIG?.BITE_TIMER_DURATION_MS || 3000; // Resetting the definition of biteTimer to mean reaction time

        if (typeof playSound === 'function') playSound('sfx_fishing_bite.mp3');
        if (typeof window.fishingUi !== 'undefined') {
            if (window.fishingUi.setCatState) window.fishingUi.setCatState('alert'); // Or 'bite'
            if (window.fishingUi.animateBobberBite) window.fishingUi.animateBobberBite(); // Shows "Bite!" on bobber
            if (window.fishingUi.updateStatusText) window.fishingUi.updateStatusText("BITE! Reel it in!");
        }

        // Start timer for player to react
        if (fishingGameState.biteReactionTimeoutId) {
            clearTimeout(fishingGameState.biteReactionTimeoutId);
        }
        fishingGameState.biteReactionTimeoutId = setTimeout(() => {
            this.handleFishEscape("Too slow!"); // Pass reason for escape
        }, fishingGameState.biteTimer); // Use the biteTimer value for the countdown
    },

    // Old checkForBite is to be deprecated/removed.
    // Its logic for detecting bite is now in castRodAndWaitForBite -> triggerBiteDisplay.
    // The part of checkForBite that managed the biteTimer countdown after a bite is now implicitly
    // handled by the biteReactionTimeoutId set in triggerBiteDisplay.

    // Old checkForBite() is removed. Its bite detection logic is replaced by the new timer-based system.
    // checkForBite(deltaTime) { ... }


    handleFishEscape(reason = "The fish got away!") { // Added reason parameter
        // console.log("[Mechanics] handleFishEscape: Called. Biting fish ID: " + fishingGameState.bitingFishId); // REMOVE
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.showTemporaryResultMessage === 'function') {
            // The issue mentioned "balık kaçtı yazacak oltanın ucunda"
            // This might require a new UI function like fishingUi.showBobberMessage("Fish escaped!")
            // For now, using existing temporary message.
            fishingUi.showTemporaryResultMessage(reason);
        }
        if (typeof playSound === 'function') playSound('sfx_fishing_lose.mp3');

        const escapedFishId = fishingGameState.bitingFishId; // Store before resetting
        if(escapedFishId) {
            const escapedFishInstance = this.activeFish.find(f => f.id === escapedFishId);
            if(escapedFishInstance) {
                // Make the fish dart away quickly
                escapedFishInstance.targetX = Math.random() < 0.5 ? this.seaBoundaries.minX - 50 : this.seaBoundaries.maxX + 50;
                escapedFishInstance.targetY = Math.random() < 0.5 ? this.seaBoundaries.minY - 50 : this.seaBoundaries.maxY + 50;
                escapedFishInstance.speedX = (escapedFishInstance.speedX || 10) * 3; // Increase speed, ensure speedX is not 0
                escapedFishInstance.speedY = (escapedFishInstance.speedY || 10) * 3;
            }
            // It's important that spawnFish is called with the ID of the fish to be replaced.
            // If the fish instance itself was modified and then we call spawnFish without an ID,
            // it would add a new fish instead of replacing.
            this.spawnFish(escapedFishId); // Replace the escaped fish visually by its ID.
        }

        this.resetFishingState(); // Resets most states including timers
        // Specific UI updates for escape are handled by resetFishingState or directly by fishingUi.showTemporaryResultMessage
        if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.resetBobberAnimation === 'function') {
            window.fishingUi.resetBobberAnimation(); // Ensure "Bite!" animation stops
        }
    },

    reelRod() {
        // Clear any active bite countdown timer
        if (fishingGameState.biteReactionTimeoutId) {
            clearTimeout(fishingGameState.biteReactionTimeoutId);
            fishingGameState.biteReactionTimeoutId = null;
        }

        if (fishingGameState.isReeling) return; // Already reeling

        if (fishingGameState.hasHookedFish) {
            // Player is reeling in a hooked fish
            fishingGameState.isReeling = true;
            // fishingGameState.hasHookedFish remains true during the reel attempt
            // fishingGameState.isRodCast remains false

            if (typeof window.fishingUi !== 'undefined') {
                if (window.fishingUi.setCatState) window.fishingUi.setCatState('reeling');
                if (window.fishingUi.updateStatusText) window.fishingUi.updateStatusText("Reeling it in...");
                if (window.fishingUi.resetBobberAnimation) window.fishingUi.resetBobberAnimation(); // Clear "Bite!"
            }
            if (typeof playSound === 'function') playSound('sfx_fishing_reel.mp3');

            setTimeout(() => {
                const successChance = (fishingGameState.currentRod?.successRate || 0.7) + (fishingGameState.currentBait?.successBoost || 0);
                const success = Math.random() < successChance;

                if (success) {
                    const caughtItem = this.determineCatch(fishingGameState.bitingFishId); // bitingFishId should still be set
                    let itemForDisplay; // This will hold the object for showTemporaryCollectedItem

                    if (caughtItem.type === 'card') {
                        const cardDef = (typeof cardData !== 'undefined' && cardData[caughtItem.details.set] && cardData[caughtItem.details.set][caughtItem.details.cardId])
                                            ? cardData[caughtItem.details.set][caughtItem.details.cardId]
                                            : null;
                        const cardName = cardDef ? cardDef.name : `${caughtItem.details.set} Card #${caughtItem.details.cardId}`;
                        const cardDataForBasket = { // This object is suitable for display and basket
                            id: caughtItem.details.cardId,
                            set: caughtItem.details.set,
                            name: cardName,
                            rarityKey: caughtItem.details.rarityKey,
                            price: caughtItem.details.price,
                            grade: caughtItem.details.grade,
                            imagePath: typeof getCardImagePath === 'function' ? getCardImagePath(caughtItem.details.set, caughtItem.details.cardId) : `gui/cards/${caughtItem.details.set}/${caughtItem.details.cardId}.png`,
                            type: 'fish_card', // Specific type for fishing context if needed by basket
                            source: 'fishing'
                        };
                        if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
                            window.fishingBasket.addCardToBasket(cardDataForBasket, 1);
                        }
                        itemForDisplay = cardDataForBasket;
                    } else if (caughtItem.type === 'ticket') {
                        // Tickets are added in determineCatch. Prepare data for display.
                        const ticketDataForDisplay = {
                            name: caughtItem.details.name, // Should be like "Rare Ticket"
                            imagePath: typeof getSummonTicketImagePath === 'function' ? getSummonTicketImagePath(caughtItem.details.rarityKey) : `gui/summon_tickets/ticket_${caughtItem.details.rarityKey}.png`,
                            id: caughtItem.details.rarityKey, // Use rarityKey as a form of ID for tickets
                            set: 'Summon Tickets', // Generic set name for tickets
                            rarityKey: caughtItem.details.rarityKey, // Include rarity for potential display styling
                            type: 'ticket',
                            source: 'fishing'
                        };
                        itemForDisplay = ticketDataForDisplay;
                         if (typeof addSummonTickets !== 'function') {
                            console.warn("addSummonTickets function not found during reelRod success for ticket.");
                         }
                    }

                    // New unified display logic
                    if (itemForDisplay) {
                        if (typeof window.showTemporaryCollectedItem === 'function') {
                            window.showTemporaryCollectedItem(itemForDisplay);
                        } else if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.showCatchPreview === 'function') {
                            // Fallback to old preview if global function isn't implemented yet
                            // showCatchPreview expects { type: 'card'/'ticket', details: {...} }
                            const previewWrapper = {
                                type: caughtItem.type, // 'card' or 'ticket'
                                details: { ...itemForDisplay, cardId: itemForDisplay.id } // ensure cardId for card type if showCatchPreview expects it
                            };
                            window.fishingUi.showCatchPreview(previewWrapper);
                        }
                    }

                    if (typeof playSound === 'function') playSound('sfx_fishing_win.mp3');
                    if (fishingGameState.bitingFishId) { // If a visual fish was hooked
                        this.spawnFish(fishingGameState.bitingFishId); // Replace the caught fish
                    }

                    // Handle bait consumption
                    if (fishingGameState.currentBait && fishingGameState.currentBait.id !== "none") {
                        fishingGameState.currentBaitUsesLeft--;
                        if (fishingGameState.currentBaitUsesLeft <= 0) {
                            if (typeof fishingUi !== 'undefined' && typeof fishingUi.showTemporaryResultMessage === 'function') {
                                fishingUi.showTemporaryResultMessage(`Your ${fishingGameState.currentBait.name} ran out!`);
                            }
                            fishingGameState.currentBaitId = "none";
                            fishingGameState.currentBait = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === "none");
                            fishingGameState.currentBaitUsesLeft = Infinity; // Or specific uses for "none" if any
                            if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateRodAndBaitDisplay === 'function') {
                                fishingUi.updateRodAndBaitDisplay();
                            }
                        }
                    }
                    if (typeof saveGame === 'function') saveGame();

                } else {
                    // Failed to reel in
                    this.handleFishEscape("The fish got away!"); // Call with specific message
                }
                this.resetFishingState(); // This will set isReeling to false among other things.
            }, (FISHING_CONFIG?.REEL_TIME_BASE_MS || 1000) + Math.random() * (FISHING_CONFIG?.REEL_TIME_RANDOM_MS || 500));

        } else if (fishingGameState.isRodCast && !fishingGameState.hasHookedFish) {
            // Player reeled in before a bite
            if (typeof playSound === 'function') playSound('sfx_fishing_reel_empty.mp3');
            if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.updateStatusText === 'function') {
                fishingUi.updateStatusText("Reeled in too early!");
            }
            this.resetFishingState();
        }
        // If neither rod cast nor fish hooked, reelRod does nothing.
    },

    determineCatch(caughtFishId) { // caughtFishId might be null if no visual fish was assigned
        // const fishData = this.activeFish.find(f => f.id === caughtFishId);
        // For now, use existing determineCatch logic which doesn't depend on specific fish from sea
        const rod = fishingGameState.currentRod;
        const bait = fishingGameState.currentBait;

        const ticketChance = FISHING_CONFIG.BASE_TICKET_CHANCE + (rod.ticketCatchBonus || 0) + (bait?.ticketBoost || 0);
        const isTicket = Math.random() < ticketChance;

        if (isTicket) {
            let chosenTicketRarityKey = 'rare'; // Default
            const ticketDistribution = FISHING_CONFIG?.SUMMON_TICKET_RARITY_DISTRIBUTION;

            if (ticketDistribution && ticketDistribution.length > 0) {
                let randomTicketProb = Math.random();
                let cumulativeTicketProb = 0;
                for (const tier of ticketDistribution) {
                    cumulativeTicketProb += tier.packProb;
                    if (randomTicketProb < cumulativeTicketProb) {
                        chosenTicketRarityKey = tier.key;
                        break;
                    }
                }
                // Fallback if probabilities don't sum to 1 or other issues
                if (randomTicketProb >= cumulativeTicketProb && ticketDistribution.length > 0) {
                     chosenTicketRarityKey = ticketDistribution[0].key;
                }
            } else {
                // Fallback to original random selection if no distribution in config
                const ticketRarities = ['rare', 'foil', 'holo'];
                chosenTicketRarityKey = ticketRarities[Math.floor(Math.random() * ticketRarities.length)];
            }

            const ticketRarityInfo = typeof getRarityTierInfo !== 'undefined' ? getRarityTierInfo(chosenTicketRarityKey) : {name: chosenTicketRarityKey};
            if (typeof addSummonTickets === 'function') addSummonTickets(chosenTicketRarityKey, 1);
            else console.warn("addSummonTickets function not found.");
            return { type: 'ticket', details: { rarityKey: chosenTicketRarityKey, name: `${ticketRarityInfo.name} Ticket`, source: 'fishing' }};
        } else {
            // ... (existing card logic remains the same)
            // The card object returned by determineCatch will have type: 'card'
            // The source: 'fishing' and specific type: 'fish_card' will be set in reelRod when preparing cardDataForBasket.
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
            return { type: 'card', details: cardDetails, name: "Fish Card" }; // Removed isCardPlaceholder, name is generic here
        }
    },

    resetFishingState() {
        // console.log("[Mechanics] resetFishingState: Called. Resetting fishing states."); // REMOVE
        fishingGameState.isRodCast = false;
        fishingGameState.isReeling = false;
        fishingGameState.bitingFishId = null;
        fishingGameState.hasHookedFish = false;
        fishingGameState.biteTimer = 0; // This was reaction time, reset it.

        // Clear all fishing related timers
        if (fishingGameState.biteTimeoutId) { // Timer for bite to occur
            clearTimeout(fishingGameState.biteTimeoutId);
            fishingGameState.biteTimeoutId = null;
        }
        if (fishingGameState.biteReactionTimeoutId) { // Timer for player to react
            clearTimeout(fishingGameState.biteReactionTimeoutId);
            fishingGameState.biteReactionTimeoutId = null;
        }

        if (typeof window.fishingUi !== 'undefined') {
            if (window.fishingUi.hideBobber) window.fishingUi.hideBobber();
            if (window.fishingUi.hideRodLine) window.fishingUi.hideRodLine();
            if (window.fishingUi.resetBobberAnimation) window.fishingUi.resetBobberAnimation(); // Hides "Bite!"
            if (window.fishingUi.setCatState) window.fishingUi.setCatState('idle');
            if (window.fishingUi.updateStatusText) window.fishingUi.updateStatusText(); // Reset to default like "Press Space to Cast"
            // Hide any "Fish escaped!" or caught item messages - this might need specific UI calls
            // e.g., fishingUi.hideTemporaryResultMessage(), fishingUi.hideCaughtItemDisplay()
            if (window.fishingUi.hideCatchPreview) window.fishingUi.hideCatchPreview(); // Assuming this hides any displayed item
        } else {
            console.warn("window.fishingUi not available for resetFishingState visuals."); // Keep warn
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
window.fishingMechanics = fishingMechanicsInstance; // Assign to window
// console.log("[Fixed] fish-in-sea-mechanics.js loaded, window.fishingMechanics assigned."); // Minimal log, commented out