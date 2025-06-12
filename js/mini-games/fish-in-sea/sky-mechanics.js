// js/mini-games/fish-in-sea/sky-mechanics.js

window.skyMechanics = { // Ensure it's explicitly on window
    activeBirds: [],
    maxActiveBirds: 5, // Max birds on screen at once
    skyBoundaries: { minY: 10, maxY: 100, spawnMargin: 50 }, // Y boundaries for birds, and off-screen margin for spawn/despawn
    birdTypes: {
        type1: { speedBase: 50, image: 'bird_type1.png', clickRewardChance: 0.25 }, // pixels per second
        type2: { speedBase: 70, image: 'bird_type2.png', clickRewardChance: 0.35 }
    },

    /**
     * Initializes the sky mechanics and spawns initial birds.
     */
    initializeSkyMechanics: function() {
        this.activeBirds = [];
        // Spawn a few initial birds
        for (let i = 0; i < Math.floor(this.maxActiveBirds / 2); i++) {
            this.spawnBird();
        }
        if (typeof skyUi !== 'undefined' && typeof skyUi.renderBirds === 'function') {
            skyUi.renderBirds(this.activeBirds);
        }
        console.log("Sky mechanics initialized.");
    },

    /**
     * Updates bird movement, despawns off-screen birds, and spawns new birds.
     * @param {number} deltaTime - Time since the last update in seconds.
     */
    updateBirdMovementAndSpawns: function(deltaTime) {
        if (!fishingGameState.isGameActive) return;

        let birdsChanged = false;

        // Move existing birds
        for (let i = this.activeBirds.length - 1; i >= 0; i--) {
            const bird = this.activeBirds[i];
            bird.x += bird.speedX * deltaTime;
            // bird.y might also change slightly if desired (e.g., gentle sine wave)

            // Despawn if off-screen (consider game screen width dynamically)
            const gameScreenWidth = document.getElementById('fish-in-sea-screen')?.offsetWidth || 600; // Fallback width
            if ((bird.speedX > 0 && bird.x > gameScreenWidth + this.skyBoundaries.spawnMargin) ||
                (bird.speedX < 0 && bird.x < -this.skyBoundaries.spawnMargin)) {
                this.activeBirds.splice(i, 1);
                birdsChanged = true;
                // console.log("Despawned bird:", bird.id);
            }
        }

        // Randomly spawn new birds if below max count
        if (this.activeBirds.length < this.maxActiveBirds) {
            const BIRD_SPAWN_CHANCE_PER_FRAME = 0.2; // Increased for testing (was 0.02)
            if (Math.random() < BIRD_SPAWN_CHANCE_PER_FRAME) {
                this.spawnBird();
                birdsChanged = true;
            }
        }

        if (birdsChanged && typeof skyUi !== 'undefined' && typeof skyUi.renderBirds === 'function') {
            skyUi.renderBirds(this.activeBirds);
        }
    },

    /**
     * Spawns a new bird.
     */
    spawnBird: function() {
        const gameScreenWidth = document.getElementById('fish-in-sea-screen')?.offsetWidth || 600;
        const typeKeys = Object.keys(this.birdTypes);
        const randomTypeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const type = this.birdTypes[randomTypeKey];

        const fliesLeftToRight = Math.random() < 0.5;
        const startX = fliesLeftToRight ? -this.skyBoundaries.spawnMargin : gameScreenWidth + this.skyBoundaries.spawnMargin;
        const startY = this.skyBoundaries.minY + Math.random() * (this.skyBoundaries.maxY - this.skyBoundaries.minY);

        const newBird = {
            id: `bird_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            x: startX,
            y: startY,
            speedX: (type.speedBase + (Math.random() * 20 - 10)) * (fliesLeftToRight ? 1 : -1),
            type: randomTypeKey,
            imagePath: `gui/fishing_game/${type.image}`
        };
        this.activeBirds.push(newBird);
        // console.log("Spawned bird:", newBird.id, "Type:", newBird.type, "Direction:", fliesLeftToRight ? "R" : "L");
    },

    /**
     * Handles a bird click event.
     * @param {string} birdId - The ID of the clicked bird.
     */
    clickBird: function(birdId) {
        const birdIndex = this.activeBirds.findIndex(b => b.id === birdId);
        if (birdIndex === -1) return; // Bird already removed or invalid ID

        const bird = this.activeBirds[birdIndex];
        const birdTypeData = this.birdTypes[bird.type];

        // Remove the clicked bird immediately
        this.activeBirds.splice(birdIndex, 1);
        if (typeof skyUi !== 'undefined' && typeof skyUi.renderBirds === 'function') {
            skyUi.renderBirds(this.activeBirds); // Update UI to show bird removed
        }
        if (typeof playSound === 'function') playSound('sfx_bird_click.mp3'); // Placeholder sound

        console.log(`Bird ${birdId} clicked.`);

        // Chance-based reward
        if (Math.random() < birdTypeData.clickRewardChance) {
            this.grantBirdClickReward(bird);
        } else {
            // Optional: feedback for no reward
            // if(typeof showCustomModal === 'function') showCustomModal("The bird flew off!", "info");
        }
    },

    /**
     * Grants rewards for clicking a bird.
     * @param {object} bird - The bird object that was clicked.
     */
    grantBirdClickReward: function(bird) {
        console.log("Granting reward for bird click:", bird.type);
        // Placeholder: Add a generic "feather" card or a chance for a summon ticket

        const rewardType = Math.random() < 0.7 ? "card" : "ticket"; // 70% chance for card, 30% for ticket

        if (rewardType === "card") {
            const cardData = {
                id: `feather_${bird.type}`, // More consistent ID
                set: 'fish_in_sea_sky', // New set for sky items
                name: `${bird.type.charAt(0).toUpperCase() + bird.type.slice(1)} Feather`,
                type: "material",
                rarity: (bird.type === 'type2' ? 'uncommon' : 'common'), // Example rarity based on bird type
                price: (bird.type === 'type2' ? 10 : 5), // Example price
                imagePath: `gui/fishing_game/feather_${bird.type}.png`, // e.g. feather_type1.png
                source: "bird_click"
            };
            if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
                window.fishingBasket.addCardToBasket(cardData, 1);
                if (typeof showCustomModal === 'function') showCustomModal(`You found a ${cardData.name}!`, "success");
            } else {
                console.warn("fishingBasket.addCardToBasket function not found. Feather card not added.");
            }
        } else { // Ticket reward
            const ticketType = "common_summon_ticket"; // Example, could be rarer
            if (typeof gainSummonTicket === 'function') {
                gainSummonTicket(ticketType.replace('_summon_ticket',''), 1); // Assuming gainSummonTicket handles key correctly
                if (typeof showCustomModal === 'function') showCustomModal(`A bird dropped a ${ticketType.replace(/_/g, ' ')}!`, "success");
            } else {
                console.warn("gainSummonTicket function not found. Ticket not granted.");
            }
        }
         if (typeof saveGame === 'function') saveGame(); // Save after getting a reward
    }
};

// Make globally available
// window.skyMechanics = skyMechanics; // Already done by window.skyMechanics = { ... }

console.log("sky-mechanics.js loaded and attached to window.skyMechanics. Initializing loggers within module.");

// Add detailed logs inside methods for testing
const originalInitializeSkyMechanics = window.skyMechanics.initializeSkyMechanics;
window.skyMechanics.initializeSkyMechanics = function() {
    console.log('[SkyMechanics] Initializing/Re-initializing...');
    originalInitializeSkyMechanics.call(this);
    console.log('[SkyMechanics] Initialized. Birds:', this.activeBirds);
};

let skyUpdateCounter = 0;
const originalUpdateBirdMovementAndSpawns = window.skyMechanics.updateBirdMovementAndSpawns;
window.skyMechanics.updateBirdMovementAndSpawns = function(deltaTime) {
    skyUpdateCounter++;
    if (skyUpdateCounter % 60 === 0) { // Log approx every second if 60fps (loop is 100ms, so every 6s)
         // Let's log more frequently for testing, e.g. every 10 calls (every 1 second)
        // console.log(`[SkyMechanics] updateBirdMovementAndSpawns #${skyUpdateCounter}, deltaTime: ${deltaTime}, Active birds: ${this.activeBirds.length}`);
    }
    // For more frequent logging during debug:
    if (skyUpdateCounter < 30 || skyUpdateCounter % 10 === 0) { // Log first few calls, then every second
         console.log(`[SkyMechanics] updateBirdMovementAndSpawns #${skyUpdateCounter}, deltaTime: ${deltaTime}, Active birds: ${this.activeBirds.length}, First bird x: ${this.activeBirds[0]?.x}`);
    }
    originalUpdateBirdMovementAndSpawns.call(this, deltaTime);
};

const originalClickBird = window.skyMechanics.clickBird;
window.skyMechanics.clickBird = function(birdId) {
    console.log('[SkyMechanics] clickBird called for birdId:', birdId);
    originalClickBird.call(this, birdId);
};

const originalGrantBirdClickReward = window.skyMechanics.grantBirdClickReward;
window.skyMechanics.grantBirdClickReward = function(bird) {
    console.log('[SkyMechanics] grantBirdClickReward called for bird:', bird);
    originalGrantBirdClickReward.call(this, bird);
};
