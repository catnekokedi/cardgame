// js/mini-games/fishing-game/fishing-mechanics.js

window.fishingMechanics = {
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

        // if (typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.renderFish === 'function') {
        //     fishingGameUi.renderFish(this.activeFish);
        // } // Removed as per task
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
                if (fishingGameState.isRodCast && !fishingGameState.hasHookedFish && fish.id !== fishingGameState.bitingFishId) {
                    // If rod is cast and this fish isn't already the one biting/hooked, it targets the hook
                    fish.targetX = this.hookPosition.x + (Math.random() - 0.5) * 15; // Target hook, with slight jitter
                    fish.targetY = this.hookPosition.y + (Math.random() - 0.5) * 15;
                    // console.log(`Fish ${fish.id} is now targeting the hook area.`);
                } else {
                    // Original random target logic if rod not cast or fish is already hooked
                    fish.targetX = this.seaBoundaries.minX + Math.random() * (this.seaBoundaries.maxX - this.seaBoundaries.minX);
                    fish.targetY = this.seaBoundaries.minY + Math.random() * (this.seaBoundaries.maxY - this.seaBoundaries.minY);
                }
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

        // if (fishChanged && typeof fishingGameUi !== 'undefined' && typeof fishingGameUi.renderFish === 'function') {
        //     fishingGameUi.renderFish(this.activeFish);
        // } // Removed as per task
    },

    castRod() {
        console.log("[Mechanics] castRod: Called. Current state: isRodCast=" + fishingGameState.isRodCast + ", isReeling=" + fishingGameState.isReeling + ", hasHookedFish=" + fishingGameState.hasHookedFish);
        if (fishingGameState.isRodCast || fishingGameState.isReeling || fishingGameState.hasHookedFish) {
            console.log("[Mechanics] castRod: Conditions not met, returning.");
            return;
        }

        // For now, hook position is fixed or uses the default this.hookPosition
        // Later, this could be player controlled.
        // this.hookPosition = { x: ..., y: ... };

        if (typeof playSound === 'function') playSound('sfx_fishing_cast.mp3');
        if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.setCatState === 'function') {
            window.fishingUi.setCatState('casting');
        }

        fishingGameState.isRodCast = true;
        fishingGameState.isReeling = false;
        fishingGameState.bitingFishId = null;
        fishingGameState.hasHookedFish = false;
        console.log("[Mechanics] castRod: State updated: isRodCast=true, hasHookedFish=false");
        // Note: fishingGameState.bobberPosition is not strictly needed by fishingGameUi if hookPosition is passed directly

        if (typeof window.fishingUi !== 'undefined') {
            if (window.fishingUi.showBobber) window.fishingUi.showBobber(); // showBobber now handles its own position
            if (window.fishingUi.drawRodLine) window.fishingUi.drawRodLine();
            if (window.fishingUi.resetBobberAnimation) window.fishingUi.resetBobberAnimation(); // Ensure not biting
        } else {
            console.warn("window.fishingUi not available for castRod visuals.");
        }
        // Replace fishingUi.updateStatusText and fishingUi.hideCatchPreview if those are to be self-contained
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateStatusText === 'function') fishingUi.updateStatusText("Waiting for a bite...");
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.hideCatchPreview === 'function') fishingUi.hideCatchPreview();


        setTimeout(() => {
            if (fishingGameState.isRodCast && !fishingGameState.isReeling && !fishingGameState.hasHookedFish) {
                if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.setCatState === 'function') {
                    window.fishingUi.setCatState('idle');
                }
            }
        }, 700); // Assuming cat animation duration
        console.log("Rod cast at", this.hookPosition);
    },

    checkForBite(deltaTime) { // deltaTime in seconds
        console.log(`%c[Mechanics] checkForBite: ENTERED. deltaTime: ${deltaTime}`, 'color: blue; font-weight: bold;');
        console.log(`%c[Mechanics] checkForBite: Initial State - isRodCast: ${fishingGameState.isRodCast}, isReeling: ${fishingGameState.isReeling}, hasHookedFish: ${fishingGameState.hasHookedFish}, biteTimer: ${fishingGameState.biteTimer}`, 'color: blue;');

        if (!fishingGameState.isRodCast || fishingGameState.isReeling || fishingGameState.hasHookedFish) {
            console.log(`%c[Mechanics] checkForBite: Entered initial 'if' block. Condition was true. (!isRodCast=${!fishingGameState.isRodCast}, isReeling=${fishingGameState.isReeling}, hasHookedFish=${fishingGameState.hasHookedFish})`, 'color: orange;');
            // This is the path taken if a fish is already hooked (hasHookedFish = true)
            // or if rod is not cast, or if currently reeling.
            // The biteTimer management should only happen if a fish is ALREADY hooked.
            if (fishingGameState.hasHookedFish && fishingGameState.biteTimer > 0) {
                console.log(`%c[Mechanics] checkForBite: Managing bite timer: ${fishingGameState.biteTimer}`, 'color: orange;');
                fishingGameState.biteTimer -= (deltaTime * 1000); // Ensure deltaTime is valid
                if (fishingGameState.biteTimer <= 0) {
                    console.log(`%c[Mechanics] checkForBite: Bite timer expired. Escaping.`, 'color: red; font-weight: bold;');
                    this.handleFishEscape();
                }
            }
            // Only log EXITING EARLY if not managing an active bite timer that just led to escape
            if (fishingGameState.biteTimer > 0 || !fishingGameState.hasHookedFish) { // if timer still running, or if we exited for other reasons
                 console.log(`%c[Mechanics] checkForBite: EXITING EARLY due to initial 'if' condition.`, 'color: orange; font-weight: bold;');
            }
            return;
        }

        console.log(`%c[Mechanics] checkForBite: Proceeding to check activeFish for new bites. Active fish count: ${this.activeFish.length}`, 'color: green;');
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
                    console.log(`[Mechanics] checkForBite: Fish ${fish.id} hooked! hasHookedFish=true. biteTimer initialized to ${fishingGameState.biteTimer}`);

                    if (typeof playSound === 'function') playSound('sfx_fishing_bite.mp3');
                    if (typeof window.fishingUi !== 'undefined') {
                        if (window.fishingUi.setCatState) window.fishingUi.setCatState('idle'); // Cat is alert
                        if (window.fishingUi.animateBobberBite) window.fishingUi.animateBobberBite();
                    } else {
                        console.warn("window.fishingUi not available for bite indication.");
                    }
                     // Replace fishingUi.updateStatusText if that is to be self-contained
                    if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateStatusText === 'function') fishingUi.updateStatusText("BITE! Reel it in!");
                    console.log(`Fish ${fish.id} is biting!`);

                    // Auto-catch logic from old system (optional)
                    // if (fishingGameState.currentRod && fishingGameState.currentRod.autoCatch) { ... }
                    return; // Stop checking other fish
                }
            }
        });

        // If a fish is hooked (hasHookedFish became true in the loop above), manage the bite timer.
        // This block is actually redundant because the initial 'if' condition at the start of the function
        // now handles the bite timer management if hasHookedFish is true upon entry.
        // If a fish gets hooked within the forEach loop, the biteTimer is initialized,
        // and its countdown will be handled in subsequent calls to checkForBite by the logic in the initial 'if'.

        // Original bite timer management (now effectively handled by the top 'if' block):
        /*
        if (fishingGameState.hasHookedFish && fishingGameState.biteTimer > 0) {
            // This specific log might be noisy if placed here, better handled by the top block's logic.
            // console.log(`%c[Mechanics] checkForBite: (Post-loop) Fish hooked. biteTimer remaining: ${fishingGameState.biteTimer}`, 'color: purple;');
            fishingGameState.biteTimer -= (deltaTime * 1000);
            if (fishingGameState.biteTimer <= 0) {
                console.log("%c[Mechanics] checkForBite: (Post-loop) Bite timer expired. Escaping.", 'color: red; font-weight: bold;');
                this.handleFishEscape();
            }
        }
        */
    },

    handleFishEscape() {
        console.log("[Mechanics] handleFishEscape: Called. Biting fish ID: " + fishingGameState.bitingFishId);
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
        this.spawnFish(fishingGameState.bitingFishId); // Replace the escaped fish

        this.resetFishingState(); // Resets most states
        // Specific UI updates for escape
        if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.resetBobberAnimation === 'function') {
            window.fishingUi.resetBobberAnimation();
        }
         // Replace fishingUi.showTemporaryResultMessage if that is to be self-contained
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.showTemporaryResultMessage === 'function') fishingUi.showTemporaryResultMessage("Too slow! The fish got away.");
    },

    reelRod() {
        console.log("[Mechanics] reelRod: Called. Current state: isReeling=" + fishingGameState.isReeling + ", hasHookedFish=" + fishingGameState.hasHookedFish + ", isRodCast=" + fishingGameState.isRodCast);
        if (fishingGameState.isReeling || !fishingGameState.hasHookedFish) {
            if (fishingGameState.isRodCast && !fishingGameState.hasHookedFish) {
                 if (typeof playSound === 'function') playSound('sfx_fishing_reel_empty.mp3');
                 console.log("[Mechanics] reelRod: Reeling empty hook.");
                 this.resetFishingState();
            } else {
                console.log("[Mechanics] reelRod: Conditions not met (already reeling or no hooked fish), returning.");
            }
            return;
        }

        console.log("[Mechanics] reelRod: Proceeding with reeling hooked fish.");
        fishingGameState.isReeling = true;

        if (typeof window.fishingUi !== 'undefined') {
            if (window.fishingUi.resetBobberAnimation) window.fishingUi.resetBobberAnimation();
            if (window.fishingUi.setCatState) window.fishingUi.setCatState('reeling');
        } else {
            console.warn("window.fishingUi not available for reelRod visuals.");
        }
         // Replace fishingUi.updateStatusText if that is to be self-contained
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateStatusText === 'function') fishingUi.updateStatusText("Reeling it in...");
        if (typeof playSound === 'function') playSound('sfx_fishing_reel.mp3');

        setTimeout(() => {
            const success = Math.random() < (fishingGameState.currentRod?.successRate || 0.7);
            if (success) {
                const caughtItem = this.determineCatch(fishingGameState.bitingFishId);

                if (caughtItem.type === 'card') {
                    // Prepare for pack opening screen
                    const isNew = !collection[caughtItem.details.set]?.[caughtItem.details.cardId] || collection[caughtItem.details.set][caughtItem.details.cardId].count === 0;
                    const formattedCard = {
                        set: caughtItem.details.set,
                        cardId: caughtItem.details.cardId,
                        rarityKey: caughtItem.details.rarityKey,
                        grade: caughtItem.details.grade,
                        price: caughtItem.details.price,
                        revealed: false, // Pack opening screen will handle reveal
                        isNew: isNew,
                        packIndex: 0 // Single card pack
                    };

                    // Reinstate direct basket addition and temporary display for cards
                    const cardDef = (typeof cardData !== 'undefined' && cardData[caughtItem.details.set] && cardData[caughtItem.details.set][caughtItem.details.cardId])
                                        ? cardData[caughtItem.details.set][caughtItem.details.cardId]
                                        : null;
                    const cardName = cardDef ? cardDef.name : `${caughtItem.details.set} Card #${caughtItem.details.cardId}`;

                    const cardDataForBasket = {
                        id: caughtItem.details.cardId,
                        set: caughtItem.details.set,
                        name: cardName, // Use fetched name
                        rarity: caughtItem.details.rarityKey, // Using 'rarity' as some basket functions might expect this key
                        rarityKey: caughtItem.details.rarityKey, // Also include rarityKey for consistency
                        price: caughtItem.details.price,
                        grade: caughtItem.details.grade,
                        imagePath: getCardImagePath(caughtItem.details.set, caughtItem.details.cardId), // Ensure getCardImagePath is available
                        type: 'fish_card', // Standardized type
                        source: 'fishing'
                    };
                    console.log(`[FishMechanics] Item for basket from fishing: Name=${cardDataForBasket.name}, Type=${cardDataForBasket.type}, Source=${cardDataForBasket.source}`);

                    if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
                        window.fishingBasket.addCardToBasket(cardDataForBasket, 1);
                    } else {
                        console.error("fishingBasket.addCardToBasket function is undefined!");
                    }

                    // Standardized display call
                    if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.showCatchPreview === 'function') {
                        if (caughtItem.type === 'card') {
                            const previewDetails = {
                                set: cardDataForBasket.set, // Use data from cardDataForBasket which has resolved name
                                cardId: cardDataForBasket.id,
                                rarityKey: cardDataForBasket.rarityKey,
                                grade: cardDataForBasket.grade,
                                name: cardDataForBasket.name,
                                imagePath: cardDataForBasket.imagePath
                            };
                            window.fishingUi.showCatchPreview({ type: 'card', details: previewDetails });
                        } else if (caughtItem.type === 'ticket') {
                            const ticketPreviewDetails = {
                                ...caughtItem.details, // rarityKey, name
                                source: 'fishing', // Add source for display consistency
                                // imagePath will be derived by showCatchPreview or its fallback
                            };
                            window.fishingUi.showCatchPreview({ type: 'ticket', details: ticketPreviewDetails });
                            console.log(`[FishMechanics] Ticket from fishing for display: Name=${ticketPreviewDetails.name}, Type=ticket, Source=${ticketPreviewDetails.source}`);
                        }
                    } else if (typeof showTemporaryCollectedItem === 'function') {
                        // Fallback if showCatchPreview is not available
                        if (caughtItem.type === 'card') { // Note: caughtItem.type is 'card', cardDataForBasket.type is 'fish_card'
                            showTemporaryCollectedItem(cardDataForBasket);
                        } else if (caughtItem.type === 'ticket') {
                            showTemporaryCollectedItem({
                                name: caughtItem.details.name,
                                imagePath: (typeof getSummonTicketImagePath === 'function' ? getSummonTicketImagePath(caughtItem.details.rarityKey) : ''),
                                type: 'ticket',
                                rarityKey: caughtItem.details.rarityKey,
                                source: 'fishing'
                            });
                        }
                    }
                } else { // Not a card or ticket, but determineCatch should always return one of these
                    console.warn("[FishMechanics] determineCatch returned an unknown item type:", caughtItem);
                }
                // Common success sounds and spawning new fish
                if (typeof playSound === 'function') playSound('sfx_fishing_win.mp3');
                this.spawnFish(fishingGameState.bitingFishId);

                // Handle bait consumption (from old system)
                if (fishingGameState.currentBait && fishingGameState.currentBait.id !== "none") {
                    fishingGameState.currentBaitUsesLeft--;
                    if (fishingGameState.currentBaitUsesLeft <= 0) {
                         // Replace fishingUi.showTemporaryResultMessage if that is to be self-contained
                        if (typeof fishingUi !== 'undefined' && typeof fishingUi.showTemporaryResultMessage === 'function') fishingUi.showTemporaryResultMessage(`Your ${fishingGameState.currentBait.name} ran out!`);
                        fishingGameState.currentBaitId = "none";
                        fishingGameState.currentBait = FISHING_CONFIG.BAIT_TYPES.find(b => b.id === "none");
                        fishingGameState.currentBaitUsesLeft = Infinity;
                        if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateRodAndBaitDisplay === 'function') fishingUi.updateRodAndBaitDisplay();
                    }
                }
                if (typeof saveGame === 'function') saveGame();
            } else {
                // Replace fishingUi.showTemporaryResultMessage if that is to be self-contained
                if (typeof fishingUi !== 'undefined' && typeof fishingUi.showTemporaryResultMessage === 'function') fishingUi.showTemporaryResultMessage("Aww, it got away!");
                if (typeof playSound === 'function') playSound('sfx_fishing_lose.mp3');
                 const escapedFish = this.activeFish.find(f => f.id === fishingGameState.bitingFishId);
                 if(escapedFish) this.spawnFish(escapedFish.id);
            }
            this.resetFishingState();
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
            return { type: 'ticket', details: { rarityKey: randomTicketRarityKey, name: `${ticketRarityInfo.name} Ticket`, source: 'fishing' }};
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
        console.log("[Mechanics] resetFishingState: Called. Resetting fishing states.");
        fishingGameState.isRodCast = false;
        fishingGameState.isReeling = false;
        fishingGameState.bitingFishId = null;
        fishingGameState.hasHookedFish = false;
        fishingGameState.biteTimer = 0;

        if (typeof window.fishingUi !== 'undefined') {
            if (window.fishingUi.hideBobber) window.fishingUi.hideBobber();
            if (window.fishingUi.hideRodLine) window.fishingUi.hideRodLine();
            if (window.fishingUi.resetBobberAnimation) window.fishingUi.resetBobberAnimation();
            if (window.fishingUi.setCatState) window.fishingUi.setCatState('idle');
        } else {
            console.warn("window.fishingUi not available for resetFishingState visuals.");
        }
         // Replace fishingUi.updateStatusText if that is to be self-contained
        if (typeof fishingUi !== 'undefined' && typeof fishingUi.updateStatusText === 'function') fishingUi.updateStatusText();

        // Clear any old system bite timeout if it exists
        if (fishingGameState.biteTimeoutId) {
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