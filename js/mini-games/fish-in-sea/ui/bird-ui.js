// js/mini-games/fish-in-sea/ui/bird-ui.js

const birdUi = {
    skyElement: null, // Will be the container for birds, e.g., #fishing-sky-area
    birdElements: {}, // Map of birdId to its DOM element
    birdImagePath: 'gui/fishing_game/bird_placeholder.png', // Placeholder asset

    initialize: function(skyElementSelector) {
        this.skyElement = document.querySelector(skyElementSelector);
        if (!this.skyElement) {
            console.error("Bird UI: Sky element not found with selector:", skyElementSelector);
            return;
        }
        this.birdElements = {};
        console.log("Bird UI Initialized with sky element:", this.skyElement);
    },

    createBirdElement: function(birdData) {
        if (!this.skyElement) return;

        const birdElement = document.createElement('img');
        birdElement.id = `bird-${birdData.id}`;
        birdElement.src = birdData.imagePath || this.birdImagePath; // Use birdData.imagePath if available
        birdElement.classList.add('bird-in-sky'); // Match existing CSS class

        // JS will set left and top for positioning. Other base styles from CSS.
        birdElement.style.left = birdData.x + 'px';
        birdElement.style.top = birdData.y + 'px';
        // Width/height can be from CSS or overridden by specific bird types in JS if needed later.
        // Example: birdElement.style.width = birdData.width || '40px';
        // z-index is in CSS, cursor is in CSS. Position:absolute is in CSS.

        birdElement.onclick = () => {
            if (window.birdMechanics && typeof window.birdMechanics.handleBirdClick === 'function') {
                window.birdMechanics.handleBirdClick(birdData.id);
            }
        };

        this.birdElements[birdData.id] = birdElement;
        this.skyElement.appendChild(birdElement);
    },

    update: function(birdsData) { // birdsData is an array from birdMechanics.birds
        if (!this.skyElement) return;

        birdsData.forEach(birdData => {
            const birdElement = this.birdElements[birdData.id];
            if (birdElement) {
                birdElement.style.left = birdData.x + 'px';
                birdElement.style.top = birdData.y + 'px';

                // Flip image based on horizontal direction
                if (birdData.speedX < 0) {
                    birdElement.style.transform = 'scaleX(-1)';
                } else {
                    birdElement.style.transform = 'scaleX(1)';
                }
            }
        });
    },

    removeBirdElement: function(birdId) {
        const birdElement = this.birdElements[birdId];
        if (birdElement && birdElement.parentNode) {
            birdElement.parentNode.removeChild(birdElement);
        }
        delete this.birdElements[birdId];
    },

    showRewardDropped: function(birdData, reward) {
        // Placeholder for visual feedback when a bird drops a reward (or nothing)
        // This could be a small animation or particle effect near the bird
        console.log(`Bird ${birdData.id} UI: Reward dropped - ${reward ? reward.name : 'nothing'}`);
        const birdElement = this.birdElements[birdData.id];
        if (birdElement) {
            // Example: make bird flash or change image briefly using opacity
            // The transition is defined in CSS for .bird-in-sky
            birdElement.style.opacity = '0.5';
            setTimeout(() => {
                if (birdElement) birdElement.style.opacity = '1'; // Reset opacity
            }, 200);
        }
    },

    reset: function() {
        if (this.skyElement) {
            for (const birdId in this.birdElements) {
                this.removeBirdElement(birdId);
            }
        }
        this.birdElements = {};
         console.log("Bird UI Reset");
    }
};

// Expose to global scope
window.birdUi = birdUi;

console.log("bird-ui.js loaded");
