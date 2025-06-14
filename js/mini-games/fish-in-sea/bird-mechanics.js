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
        console.log("Spawned bird:", bird);

        // Notify UI to create a bird element
        if (window.birdUi && typeof window.birdUi.createBirdElement === 'function') {
            window.birdUi.createBirdElement(bird);
        }
    },

    handleBirdClick: function(birdId) {
        const bird = this.birds.find(b => b.id === birdId);
        if (!bird || bird.state !== 'flying') return;

        console.log("Bird clicked:", birdId);
        bird.state = 'clicked'; // Prevent multi-click, can be used for animation

        if (Math.random() < this.dropChance) {
            const isTicket = Math.random() < this.ticketChance;
            const reward = this.generateReward(isTicket);

            if (reward) {
                console.log("Bird drops:", reward);
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
                console.log("Bird dropped nothing.");
                 if (window.birdUi && typeof window.birdUi.showRewardDropped === 'function') {
                    window.birdUi.showRewardDropped(bird, null); // Indicate nothing dropped
                }
            }
        } else {
            console.log("Bird dropped nothing (failed dropChance).");
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
        // This function needs to ensure the reward object matches what fishingBasket.addCardToBasket expects.
        // Example: { id, set, name, rarity, price, imagePath, type, source }
        // For summon tickets, 'set' might be 'summon_tickets', 'id' the ticket type.
        // Price might be 0 or a configured value.
        let imagePath = reward.imagePath;
        if (reward.type === 'card' && (!imagePath && typeof getCardImagePath === 'function')) {
            imagePath = getCardImagePath(reward.set, reward.id);
        } else if (reward.type === 'summon_ticket' && (!imagePath && typeof getSummonTicketImagePath === 'function')) {
            // Assuming a getSummonTicketImagePath function might exist or be needed
            imagePath = getSummonTicketImagePath(reward.id);
        }

        return {
            id: reward.id,
            set: reward.set || (reward.type === 'summon_ticket' ? 'summon_tickets' : 'unknown_cards'),
            name: reward.name || `${reward.rarity} ${reward.type}`,
            rarity: reward.rarityKey || reward.rarity,
            rarityKey: reward.rarityKey || reward.rarity,
            price: reward.price || 0, // Determine price based on rarity/type if needed
            grade: reward.grade, // Mostly for cards
            imagePath: imagePath || 'gui/items/placeholder_icon.png',
            type: reward.type, // 'card' or 'summon_ticket'
            source: 'bird'
        };
    },

    formatRewardForDisplay: function(reward) {
        // Adapts reward for showCaughtItemDisplay or showCatchPreview
        let imagePath = reward.imagePath;
        if (reward.type === 'card' && (!imagePath && typeof getCardImagePath === 'function')) {
            imagePath = getCardImagePath(reward.set, reward.id);
        } else if (reward.type === 'summon_ticket' && (!imagePath && typeof getSummonTicketImagePath === 'function')) {
             imagePath = getSummonTicketImagePath(reward.id);
        }

        return {
            id: reward.id, // cardId for showCaughtItemDisplay
            cardId: reward.id, // for showCaughtItemDisplay
            set: reward.set || (reward.type === 'summon_ticket' ? 'summon_tickets' : 'unknown_cards'),
            name: reward.name || `${reward.rarity} ${reward.type}`,
            rarityKey: reward.rarityKey || reward.rarity,
            grade: reward.grade, // Mostly for cards
            imagePath: imagePath || 'gui/items/placeholder_icon.png',
            type: reward.type // 'card' or 'summon_ticket'
            // details: { ... } // if using showCatchPreview
        };
    },

    removeBird: function(birdId) {
        this.birds = this.birds.filter(b => b.id !== birdId);
        if (window.birdUi && typeof window.birdUi.removeBirdElement === 'function') {
            window.birdUi.removeBirdElement(birdId);
        }
    },

    generateReward: function(isTicket) {
        const selectedRarity = this.getRandomRarity();
        if (!selectedRarity) return null; // Should not happen if weights are correct

        if (isTicket) {
            // Find a summon ticket of that rarity
            // This assumes summonTicketDefinitions is available and structured appropriately
            if (typeof summonTicketDefinitions !== 'undefined') {
                const availableTickets = Object.values(summonTicketDefinitions).filter(t => t.rarityKey === selectedRarity);
                if (availableTickets.length > 0) {
                    const chosenTicket = availableTickets[Math.floor(Math.random() * availableTickets.length)];
                    return {
                        type: 'summon_ticket',
                        id: chosenTicket.id,
                        name: chosenTicket.name,
                        rarity: selectedRarity,
                        rarityKey: selectedRarity,
                        // imagePath: chosenTicket.imagePath (if defined in summonTicketDefinitions)
                    };
                }
            }
            console.warn(`No summon ticket found for rarity: ${selectedRarity}`);
            return null; // Or fallback to a card
        } else {
            // Find a card of that rarity from active sets
            // This assumes getActiveSetDefinitions and cardData are available
            if (typeof getActiveSetDefinitions === 'function' && typeof cardData !== 'undefined') {
                const activeSets = getActiveSetDefinitions();
                const possibleCards = [];
                activeSets.forEach(setDef => {
                    if (cardData[setDef.abbr]) {
                        for (const cardId in cardData[setDef.abbr]) {
                            // Assuming cardData[setDef.abbr][cardId] has rarityKey
                            // And getFixedGradeAndPrice exists to get full card details
                            if (cardData[setDef.abbr][cardId].rarityKey === selectedRarity) {
                                if (typeof getFixedGradeAndPrice === 'function') {
                                     const cardDetails = getFixedGradeAndPrice(setDef.abbr, parseInt(cardId));
                                     possibleCards.push({
                                        type: 'card',
                                        id: parseInt(cardId),
                                        set: setDef.abbr,
                                        name: cardData[setDef.abbr][cardId].name || `${setDef.name} Card #${cardId}`,
                                        rarity: selectedRarity,
                                        rarityKey: selectedRarity,
                                        price: cardDetails.price,
                                        grade: cardDetails.grade,
                                        // imagePath will be set by formatRewardForBasket/Display
                                    });
                                }
                            }
                        }
                    }
                });

                if (possibleCards.length > 0) {
                    return possibleCards[Math.floor(Math.random() * possibleCards.length)];
                }
            }
            console.warn(`No card found for rarity: ${selectedRarity}`);
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
};

// Expose to global scope for other modules
window.birdMechanics = birdMechanics;

console.log("bird-mechanics.js loaded");
