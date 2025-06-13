// js/mini-games/fish-in-sea/ui/fishing-game-ui.js

const fishingGameUi = {
    seaContainerElement: null,
    catBoatElement: null,
    fishingLineElement: null,
    bobberElement: null, // Renamed from floatElement for consistency with #fishing-bobber ID often used
    rodTipPosition: { x: 0, y: 0 }, // Relative to catBoatElement or screen, updated on boat render

    /**
     * Initializes UI elements related to the fishing game view.
     */
    initializeFishingUIElements: function() {
        const gameScreen = document.getElementById('fish-in-sea-screen');
        if (!gameScreen) {
            console.error("CRITICAL: #fish-in-sea-screen not found. Cannot initialize Fishing UI.");
            return;
        }

        this.seaContainerElement = document.getElementById('fishing-sea-container');
        if (!this.seaContainerElement) {
            console.error("#fishing-sea-container not found. Fish will not be visible.");
            // Optionally create it if essential and not in HTML
            // this.seaContainerElement = document.createElement('div');
            // this.seaContainerElement.id = 'fishing-sea-container';
            // gameScreen.appendChild(this.seaContainerElement);
        }

        // Create Cat & Boat
        this.catBoatElement = document.getElementById('fishing-cat-boat');
        if (!this.catBoatElement) {
            this.catBoatElement = document.createElement('div');
            this.catBoatElement.id = 'fishing-cat-boat';
            // Add placeholder content or image tag if GUI files are expected
            const catImg = document.createElement('img');
            catImg.src = 'gui/fishing_game/cat_on_boat.png'; // Will use fallback CSS if missing
            catImg.alt = "Cat on Boat";
            this.catBoatElement.appendChild(catImg);
            gameScreen.appendChild(this.catBoatElement);
        }
        // Position catBoatElement (example, adjust in CSS)
        // this.catBoatElement.style.left = '50px';
        // this.catBoatElement.style.bottom = '60%'; // Above water line if sea is bottom 65%

        // Create Fishing Line
        this.fishingLineElement = document.getElementById('fishing-line-element'); // New ID
        if (!this.fishingLineElement) {
            this.fishingLineElement = document.createElement('div');
            this.fishingLineElement.id = 'fishing-line-element';
            gameScreen.appendChild(this.fishingLineElement);
        }
        this.fishingLineElement.style.display = 'none'; // Initially hidden

        // Create Bobber/Float
        this.bobberElement = document.getElementById('fishing-bobber-element'); // New ID
        if (!this.bobberElement) {
            this.bobberElement = document.createElement('div');
            this.bobberElement.id = 'fishing-bobber-element';
            // const bobberImg = document.createElement('img'); // If using image for bobber
            // bobberImg.src = 'gui/fishing_game/float.png';
            // this.bobberElement.appendChild(bobberImg);
            gameScreen.appendChild(this.bobberElement);
        }
        this.bobberElement.style.display = 'none'; // Initially hidden

        // Calculate initial rod tip position (example, refine this)
        // This needs to be called after catBoatElement is positioned by CSS
        setTimeout(() => this.updateRodTipPosition(), 0);


        // Initial render of fish if mechanics are ready
        if (typeof fishingMechanics !== 'undefined' && typeof fishingMechanics.activeFish !== 'undefined') {
            this.renderFish(fishingMechanics.activeFish);
        }
        console.log("Fishing Game UI elements (self-contained) initialized.");
    },

    updateRodTipPosition: function() {
        if (!this.catBoatElement) return;
        // Example: Rod tip is at 75% of boat width, and 20% of boat height from its top
        // These are approximations and should be tuned with actual cat/boat art.
        const rect = this.catBoatElement.getBoundingClientRect();
        const parentRect = this.catBoatElement.parentElement.getBoundingClientRect(); // Assumes parent is #fish-in-sea-screen or similar

        // Calculate position relative to the parent for absolute positioning of line/bobber
        this.rodTipPosition = {
            x: (rect.left - parentRect.left) + (rect.width * 0.85), // Tip of rod, 85% across the boat image
            y: (rect.top - parentRect.top) + (rect.height * 0.25)  // Tip of rod, 25% down from top of boat image
        };
         // console.log("Rod tip position updated:", this.rodTipPosition);
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
            fishEl.style.backgroundImage = `url('${fish.imagePath || 'gui/fishing_game/fish-back.png'}')`; // Fallback to fish-back.png
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
    updateCatState: function(state) { // 'idle', 'casting', 'reeling'
        if (!this.catBoatElement) return;
        this.catBoatElement.classList.remove('idle', 'casting', 'reeling'); // Remove old states
        this.catBoatElement.classList.add(`cat-${state}`);
        console.log(`[fishingGameUi] Cat state set to: ${state}`);
        // CSS will handle animations or different sprites based on these classes
    },

    showLineAndFloat: function(hookPosition) { // hookPosition is {x, y} relative to screen/gameArea
        if (!this.fishingLineElement || !this.bobberElement || !this.catBoatElement) return;

        this.updateRodTipPosition(); // Ensure rodTip is current before drawing

        this.bobberElement.style.display = 'block';
        this.bobberElement.style.left = `${hookPosition.x}px`;
        this.bobberElement.style.top = `${hookPosition.y}px`;

        this.fishingLineElement.style.display = 'block';
        const dx = hookPosition.x - this.rodTipPosition.x;
        const dy = hookPosition.y - this.rodTipPosition.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        this.fishingLineElement.style.width = `${length}px`;
        this.fishingLineElement.style.transform = `rotate(${angle}deg)`;
        this.fishingLineElement.style.left = `${this.rodTipPosition.x}px`;
        this.fishingLineElement.style.top = `${this.rodTipPosition.y}px`;
    },

    hideLineAndFloat: function() {
        if (this.fishingLineElement) this.fishingLineElement.style.display = 'none';
        if (this.bobberElement) this.bobberElement.style.display = 'none';
    },

    animateBobberBite: function(isBiting) {
        if (!this.bobberElement) return;
        if (isBiting) {
            this.bobberElement.classList.add('bobber-biting');
            // Assuming float_bite.png is handled by CSS or not used if bobber is pure CSS
        } else {
            this.bobberElement.classList.remove('bobber-biting');
        }
    }
    // updateReelingState can be part of updateCatState or separate if more visuals are needed
};

// Make it globally available
window.fishingGameUi = fishingGameUi;

console.log("fishing-game-ui.js (self-contained visuals) loaded and attached to window.");
