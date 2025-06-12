// js/mini-games/fish-in-sea/ui/fishing-game-ui.js

const fishingGameUi = {
    seaContainerElement: null,
    catBoatElement: null,
    floatElement: null,
    fishingLineElement: null, // For the line itself

    /**
     * Initializes UI elements related to the fishing game view.
     * Creates or gets references to DOM elements for fish, cat on boat, float, etc.
     */
    initializeFishingUIElements: function() {
        this.seaContainerElement = document.getElementById('fishing-sea-container');
        this.catBoatElement = document.getElementById('fishing-cat-boat');
        this.floatElement = document.getElementById('fishing-float');

        if (!this.seaContainerElement) console.error("#fishing-sea-container not found.");
        if (!this.catBoatElement) console.error("#fishing-cat-boat not found.");
        if (!this.floatElement) console.error("#fishing-float not found.");

        // Create a fishing line element if it doesn't exist, or get a reference
        this.fishingLineElement = document.getElementById('fishing-line');
        if (!this.fishingLineElement && this.seaContainerElement) { // Create if not found, append to sea container or specific parent
            this.fishingLineElement = document.createElement('div');
            this.fishingLineElement.id = 'fishing-line';
            // this.seaContainerElement.appendChild(this.fishingLineElement); // Or append to a more suitable parent
            // The line should probably be absolutely positioned relative to the game screen or cat.
            // For now, ensure it's in the DOM if created by script.
            const gameScreen = document.getElementById('fish-in-sea-screen');
            if(gameScreen) gameScreen.appendChild(this.fishingLineElement); else document.body.appendChild(this.fishingLineElement);

        }

        this.renderFishingRod(false, {x:0,y:0}); // Initially hide rod and float

        console.log("Fishing Game UI elements initialized.");
    },

    /**
     * Renders the fish in the sea container.
     * @param {Array<object>} activeFishData - Array of active fish objects from fishingMechanics.
     */
    renderFish: function(activeFishData) {
        if (!this.seaContainerElement) return;

        // Simple pooling: reuse existing fish elements if possible
        let existingFishElements = Array.from(this.seaContainerElement.querySelectorAll('.fish-card-in-sea'));

        activeFishData.forEach((fish, index) => {
            let fishEl;
            if (index < existingFishElements.length) {
                fishEl = existingFishElements[index];
            } else {
                fishEl = document.createElement('div');
                fishEl.classList.add('fish-card-in-sea');
                this.seaContainerElement.appendChild(fishEl);
            }
            fishEl.id = fish.id; // Assign ID for potential direct manipulation
            fishEl.style.left = `${fish.x}px`;
            fishEl.style.top = `${fish.y}px`;
            // Placeholder image, actual image could depend on fish.rarity or type
            fishEl.style.backgroundImage = `url('${fish.imagePath || 'gui/fishing_game/fish_card_placeholder.png'}')`;
            // Add class for rarity if needed: fishEl.className = `fish-card-in-sea fish-rarity-${fish.rarity}`;
        });

        // Remove surplus fish elements
        for (let i = activeFishData.length; i < existingFishElements.length; i++) {
            existingFishElements[i].remove();
        }
    },

    /**
     * Renders the fishing rod, line, and float.
     * @param {boolean} isCast - Is the rod currently cast?
     * @param {object} hookPosition - {x, y} position for the hook/float.
     */
    renderFishingRod: function(isCast, hookPosition) {
        if (!this.floatElement || !this.fishingLineElement) return;

        if (isCast) {
            this.floatElement.style.display = 'block';
            this.floatElement.style.left = `${hookPosition.x}px`;
            this.floatElement.style.top = `${hookPosition.y}px`;

            this.fishingLineElement.style.display = 'block';
            // Line drawing: from rod tip to float. Rod tip needs to be known.
            // Assuming cat/boat is at a fixed position for simplicity.
            const rodTip = { x: (this.catBoatElement?.offsetLeft || hookPosition.x - 20) + (this.catBoatElement?.offsetWidth || 0) /1.5 , y: (this.catBoatElement?.offsetTop || hookPosition.y - 100) + (this.catBoatElement?.offsetHeight || 0)/3 }; // Approximate

            const dx = hookPosition.x - rodTip.x;
            const dy = hookPosition.y - rodTip.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            this.fishingLineElement.style.width = `${length}px`;
            this.fishingLineElement.style.transform = `rotate(${angle}deg)`;
            this.fishingLineElement.style.left = `${rodTip.x}px`;
            this.fishingLineElement.style.top = `${rodTip.y}px`; // Midpoint of line height for rotation
        } else {
            this.floatElement.style.display = 'none';
            this.fishingLineElement.style.display = 'none';
        }
    },

    /**
     * Shows or hides a bite indicator on the float.
     * @param {boolean} isActive - True if a bite is active.
     */
    showBiteIndicator: function(isActive) {
        if (!this.floatElement) return;
        if (isActive) {
            this.floatElement.classList.add('bite');
            // Update float image if using different images
            const floatImg = this.floatElement.querySelector('img');
            if (floatImg) floatImg.src = 'gui/fishing_game/float_bite.png';
        } else {
            this.floatElement.classList.remove('bite');
            const floatImg = this.floatElement.querySelector('img');
            if (floatImg) floatImg.src = 'gui/fishing_game/float.png';
        }
    },

    /**
     * Provides visual feedback for the reeling state.
     * @param {boolean} isReeling - True if the player is currently reeling.
     */
    updateReelingState: function(isReeling) {
        // Example: could add a class to the cat/boat or player character
        if (this.catBoatElement) {
            if (isReeling) {
                this.catBoatElement.classList.add('reeling');
            } else {
                this.catBoatElement.classList.remove('reeling');
            }
        }
        // If the line or rod needs to animate during reeling, that logic would go here.
        console.log(`UI Reeling State: ${isReeling}`);
    }
};

// Make it globally available
window.fishingGameUi = fishingGameUi;

console.log("fishing-game-ui.js loaded and attached to window.");
