// js/mini-games/fish-in-sea/bird-mechanics.js

const birdMechanics = {
    birds: [], // Array to hold bird objects { id, x, y, speedX, speedY, element, state, type }
    nextBirdId: 0,
    skyBoundaries: { xMin: 0, xMax: 800, yMin: 0, yMax: 200 }, // Example, will need adjustment
    maxBirds: 5,
    spawnInterval: 5000, // ms
    timeSinceLastSpawn: 0,

    // Reward probabilities (placeholders, to be refined)
    dropChance: 0.3, // 30% chance to drop something (was 0.75)
    ticketChance: 0.2, // Of the drops, 20% are tickets, 80% are cards
    rarityWeights: { // For cards and tickets
        common: 60,
        uncommon: 25,
        rare: 10,
        epic: 4,
        legendary: 1
    },

    initialize: function(skyBoundaries) {
        this.birds = [];
        this.nextBirdId = 0;
        this.timeSinceLastSpawn = 0;
        if (skyBoundaries) {
            this.skyBoundaries = skyBoundaries;
        }
        console.log("Bird Mechanics Initialized");
        // Potentially spawn initial birds
        for (let i = 0; i < this.maxBirds / 2; i++) {
            this.spawnBird();
        }
    },

    update: function(deltaTime) {
        this.timeSinceLastSpawn += deltaTime;
        if (this.birds.length < this.maxBirds && this.timeSinceLastSpawn >= this.spawnInterval) {
            this.spawnBird();
            this.timeSinceLastSpawn = 0;
        }

        this.birds.forEach(bird => {
            bird.x += bird.speedX * (deltaTime / 1000);
            bird.y += bird.speedY * (deltaTime / 1000);

            // Simple boundary check: reverse direction if out of bounds
            if (bird.x < this.skyBoundaries.xMin || bird.x > this.skyBoundaries.xMax) {
                bird.speedX *= -1;
                bird.x = Math.max(this.skyBoundaries.xMin, Math.min(bird.x, this.skyBoundaries.xMax)); // Clamp
            }
            if (bird.y < this.skyBoundaries.yMin || bird.y > this.skyBoundaries.yMax) {
                bird.speedY *= -1;
                bird.y = Math.max(this.skyBoundaries.yMin, Math.min(bird.y, this.skyBoundaries.yMax)); // Clamp
            }
        });
    },

    spawnBird: function() {
        if (this.birds.length >= this.maxBirds) return;

        const id = this.nextBirdId++;
        const yPosition = this.skyBoundaries.yMin + Math.random() * (this.skyBoundaries.yMax - this.skyBoundaries.yMin);
        const speedX = (Math.random() > 0.5 ? 1 : -1) * (50 + Math.random() * 50); // pixels/sec
        const xPosition = speedX > 0 ? this.skyBoundaries.xMin - 20 : this.skyBoundaries.xMax + 20; // Start off-screen

        const bird = {
            id: id,
            x: xPosition,
            y: yPosition,
            speedX: speedX,
            speedY: (Math.random() - 0.5) * 20, // Slight vertical movement
            state: 'flying', // 'flying', 'clicked', 'rewarded'
            type: 'standard', // Could have different bird types later
        };
        this.birds.push(bird);
        // console.log("Spawned bird:", bird); // REMOVE - Aggressive cleanup

        // Notify UI to create a bird element
        if (window.birdUi && typeof window.birdUi.createBirdElement === 'function') {
            window.birdUi.createBirdElement(bird);
        }
    },

    handleBirdClick: function(birdId) {
        const bird = this.birds.find(b => b.id === birdId);
        if (!bird || bird.state !== 'flying') {
            if (bird) {
                console.log(`[BirdClick] Bird ${birdId} already clicked or not in 'flying' state. Current state: ${bird.state}`);
            }
            return;
        }

        // console.log("Bird clicked:", birdId); // REMOVED INFO
        bird.state = 'clicked'; // Prevent multi-click, can be used for animation

        if (Math.random() < this.dropChance) {
            const isTicket = Math.random() < this.ticketChance;
            const reward = this.generateReward(isTicket);

            if (reward) {
                // console.log("Bird drops:", reward); // INFO - Event driven, this is okay for now, as [BirdGenFinal] is more specific.
                if (window.fishingBasket && typeof window.fishingBasket.addCardToBasket === 'function') {
                    // Adapt reward structure if necessary for addCardToBasket
                    // addCardToBasket expects (cardData, quantity)
                    // cardData needs: id, set, name, rarity, price, imagePath, type, source
                    const basketItem = this.formatRewardForBasket(reward);
                    window.fishingBasket.addCardToBasket(basketItem, 1);
                } else {
                    console.warn("fishingBasket.addCardToBasket not found!");
                }
                // Notify UI about the reward
                if (window.birdUi && typeof window.birdUi.showRewardDropped === 'function') {
                    window.birdUi.showRewardDropped(bird, reward);
                }
                 // Show temporary display using existing fishing UI
                if (window.fishingUi && typeof window.fishingUi.showCaughtItemDisplay === 'function') {
                    const displayData = this.formatRewardForDisplay(reward);
                    window.fishingUi.showCaughtItemDisplay(displayData);
                }


            } else {
                // console.log("Bird dropped nothing."); // INFO - Event driven, okay
                 if (window.birdUi && typeof window.birdUi.showRewardDropped === 'function') {
                    window.birdUi.showRewardDropped(bird, null); // Indicate nothing dropped
                }
            }
        } else {
            // console.log("Bird dropped nothing (failed dropChance)."); // INFO - Event driven, okay
            if (window.birdUi && typeof window.birdUi.showRewardDropped === 'function') {
                window.birdUi.showRewardDropped(bird, null);
            }
        }

        // Remove bird after a delay or animation
        setTimeout(() => {
            this.removeBird(birdId);
        }, 1000); // Example delay
    },

    formatRewardForBasket: function(reward) {
        // generateReward now includes most necessary fields, including imagePath.
        // This function primarily ensures structure and defaults.
        return {
            id: reward.id,
            set: reward.set || (reward.type === 'summon_ticket' ? 'summon_tickets' : 'unknown_set'),
            name: reward.name || `${reward.rarityKey || 'Unknown'} ${reward.type}`,
            rarity: reward.rarityKey || reward.rarity || 'common', // Ensure rarity field exists
            rarityKey: reward.rarityKey || reward.rarity || 'common',
            price: reward.price || 0,
            grade: reward.grade, // Mostly for cards
            imagePath: reward.imagePath || 'gui/items/placeholder_icon.png', // Fallback image
            type: reward.type, // 'collectible_card' or 'summon_ticket'
            source: reward.source || 'bird' // Ensure source is passed
        };
    },

    formatRewardForDisplay: function(reward) {
        // generateReward now includes most necessary fields.
        // This adapts primarily for showCaughtItemDisplay which might have slightly different key expectations.
        return {
            id: reward.id, // Expected by showCaughtItemDisplay as cardId sometimes
            cardId: reward.id, // Explicitly for showCaughtItemDisplay
            set: reward.set || (reward.type === 'summon_ticket' ? 'summon_tickets' : 'unknown_set'),
            name: reward.name || `${reward.rarityKey || 'Unknown'} ${reward.type}`,
            rarityKey: reward.rarityKey || reward.rarity || 'common',
            grade: reward.grade, // Mostly for cards
            imagePath: reward.imagePath || 'gui/items/placeholder_icon.png',
            type: reward.type === 'collectible_card' ? 'card' : reward.type // showCaughtItemDisplay might expect 'card'
            // details: reward // if using showCatchPreview, pass the whole reward as details
        };
    },

    removeBird: function(birdId) {
        this.birds = this.birds.filter(b => b.id !== birdId);
        if (window.birdUi && typeof window.birdUi.removeBirdElement === 'function') {
            window.birdUi.removeBirdElement(birdId);
        }
    },

    generateReward: function(isTicket) {
        const targetPullRarityKey = this.getRandomRarity();
        if (!targetPullRarityKey) {
            console.error("BirdMechanics: Could not determine target rarity from weights.");
            return null;
        }

        if (isTicket) {
            if (typeof summonTicketDefinitions !== 'undefined' && typeof getSummonTicketImagePath === 'function') {
                const ticketsOfTargetRarity = Object.values(summonTicketDefinitions).filter(t => t.rarityKey === targetPullRarityKey);
                if (ticketsOfTargetRarity.length > 0) {
                    const chosenTicketDef = ticketsOfTargetRarity[Math.floor(Math.random() * ticketsOfTargetRarity.length)];
                    const reward = {
                        type: 'summon_ticket',
                        id: chosenTicketDef.id,
                        name: chosenTicketDef.name,
                        rarity: targetPullRarityKey, // The determined rarity
                        rarityKey: targetPullRarityKey,
                        imagePath: getSummonTicketImagePath(targetPullRarityKey), // Use helper for path
                        source: 'bird'
                    };
                    console.log(`[BirdGenFinal] Generated Ticket: ID=${reward.id}, Name="${reward.name}", Rarity=${reward.rarity}, Image=${reward.imagePath}`);
                    return reward;
                } else {
                    // console.warn(`BirdMechanics: No summon tickets found for rarity '${targetPullRarityKey}'. Falling back.`); // REMOVED INFO
                    // Fallback: try any ticket or a default one if main logic fails
                    const allTickets = Object.values(summonTicketDefinitions);
                    if (allTickets.length > 0) {
                        const fallbackTicket = allTickets[Math.floor(Math.random() * allTickets.length)];
                        const reward = {
                            type: 'summon_ticket', id: fallbackTicket.id, name: fallbackTicket.name,
                            rarity: fallbackTicket.rarityKey, rarityKey: fallbackTicket.rarityKey,
                            imagePath: getSummonTicketImagePath(fallbackTicket.rarityKey), source: 'bird'
                        };
                        console.log(`[BirdGenFinal] Generated Ticket: ID=${reward.id}, Name="${reward.name}", Rarity=${reward.rarity}, Image=${reward.imagePath}`);
                        return reward;
                    }
                }
            }
            console.error("BirdMechanics: summonTicketDefinitions or getSummonTicketImagePath not available.");
            return null;
        } else {
            // Card generation logic - REWRITTEN to align with tree-mechanics (Turn 65)
            if (typeof getActiveSetDefinitions !== 'function' ||
                typeof getCardIntrinsicRarity !== 'function' ||
                typeof getFixedGradeAndPrice !== 'function' ||
                typeof getCardImagePath !== 'function' ||
                typeof window.ALL_SET_DEFINITIONS === 'undefined') { // Used by getActiveSetDefinitions
                console.error("BirdMechanics: Missing critical global functions or ALL_SET_DEFINITIONS for card generation.");
                return null;
            }

            const activeSets = getActiveSetDefinitions();
            if (!activeSets || activeSets.length === 0) {
                console.error("BirdMechanics: No active sets available for card generation.");
                return null;
            }

            let possibleCards = [];
            activeSets.forEach(setDef => {
                if (!setDef || typeof setDef.abbr === 'undefined' || typeof setDef.count !== 'number') {
                    // console.warn(`[BirdGen] Skipping set due to missing abbr or count:`, setDef); // INFO
                    return;
                }
                for (let cardIdNum = 1; cardIdNum <= setDef.count; cardIdNum++) {
                    try {
                        const intrinsicRarity = getCardIntrinsicRarity(setDef.abbr, cardIdNum);
                        if (intrinsicRarity === targetPullRarityKey) {
                            const fixedProps = getFixedGradeAndPrice(setDef.abbr, cardIdNum);
                            if (fixedProps) {
                                possibleCards.push({
                                    set: setDef.abbr,
                                    id: cardIdNum,
                                    name: fixedProps.name || `${setDef.name} Card #${cardIdNum}`, // Fallback name
                                    rarity: fixedProps.rarityKey,
                                    price: fixedProps.price,
                                    grade: fixedProps.grade,
                                    imagePath: getCardImagePath(setDef.abbr, cardIdNum, fixedProps.imageType || 'standard', fixedProps),
                                    type: 'bird_reward_card',
                                    source: 'bird'
                                });
                            }
                        }
                    } catch (e) { /* ignore errors during iteration */ }
                }
            });

            // console.log(`[BirdGen] Found ${possibleCards.length} cards for target rarity '${targetPullRarityKey}'.`); // DEBUG

            if (possibleCards.length > 0) {
                const reward = possibleCards[Math.floor(Math.random() * possibleCards.length)];
                console.log(`[BirdGenFinal] Generated Card: ID=${reward.id}, Set=${reward.set}, Name="${reward.name}", Rarity=${reward.rarity}, Image=${reward.imagePath}`);
                return reward;
            } else if (targetPullRarityKey !== 'base') { // Fallback to 'base' if no cards found for target and target wasn't already 'base'
                // console.warn(`BirdMechanics: No cards found for target rarity '${targetPullRarityKey}'. Trying fallback to 'base'.`); // REMOVED INFO
                possibleCards = []; // Reset for fallback search
                activeSets.forEach(setDef => {
                    if (!setDef || typeof setDef.abbr === 'undefined' || typeof setDef.count !== 'number') return;
                    for (let cardIdNum = 1; cardIdNum <= setDef.count; cardIdNum++) {
                        try {
                            if (getCardIntrinsicRarity(setDef.abbr, cardIdNum) === 'base') {
                                const fixedProps = getFixedGradeAndPrice(setDef.abbr, cardIdNum);
                                if (fixedProps) {
                                    possibleCards.push({
                                        set: setDef.abbr, id: cardIdNum, name: fixedProps.name || `${setDef.name} Card #${cardIdNum}`,
                                        rarity: fixedProps.rarityKey, price: fixedProps.price, grade: fixedProps.grade,
                                        imagePath: getCardImagePath(setDef.abbr, cardIdNum, fixedProps.imageType || 'standard', fixedProps),
                                        type: 'bird_reward_card', source: 'bird'
                                    });
                                }
                            }
                        } catch (e) { /* ignore */ }
                    }
                });
                // console.log(`[BirdGen] Fallback: Found ${possibleCards.length} 'base' rarity cards.`); // REMOVED DEBUG
                if (possibleCards.length > 0) {
                    const reward = possibleCards[Math.floor(Math.random() * possibleCards.length)];
                    console.log(`[BirdGenFinal] Generated Card: ID=${reward.id}, Set=${reward.set}, Name="${reward.name}", Rarity=${reward.rarity}, Image=${reward.imagePath}`);
                    return reward;
                }
            }

            console.error("BirdMechanics: Failed to generate any card, even fallback 'base' card.");
            return null;
        }
    },

    getRandomRarity: function() {
        let totalWeight = 0;
        for (const rarity in this.rarityWeights) {
            totalWeight += this.rarityWeights[rarity];
        }

        let randomNum = Math.random() * totalWeight;
        for (const rarity in this.rarityWeights) {
            if (randomNum < this.rarityWeights[rarity]) {
                return rarity;
            }
            randomNum -= this.rarityWeights[rarity];
        }
        return null; // Should not be reached
    }
    // The final reward object is constructed by the end of the main if/else (isTicket).
    // The logging should occur just before the final 'return reward;' statement of the generateReward function.
    // The previous diffs were trying to modify inside the card generation logic, which is not the final point.
    // Let's assume the 'generateReward' function structure is like:
    // generateReward: function(isTicket) {
    //   let reward = null;
    //   if (isTicket) { /* ... sets reward ... */ }
    //   else { /* ... sets reward (by returning chosenCard/chosenFallbackCard which gets assigned to reward) ... */ }
    //   // <<< THE LOG SHOULD GO HERE >>>
    //   return reward;
    // }
    // The provided read_file output does not show the full generateReward function structure up to its final return.
    // I will need to re-read and place the log correctly based on the full function structure.
    // For now, I will assume the log is added at the very end of the function in the next step after reading again.
};

// Expose to global scope for other modules
window.birdMechanics = birdMechanics;

console.log("bird-mechanics.js loaded");
