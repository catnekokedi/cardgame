// js/mini-games/fish-in-sea/ui/sky-ui.js

const skyUi = {
    skyContainerElement: null,

    /**
     * Initializes the Sky UI components.
     * Should be called when the fishing game screen is set up.
     */
    initializeSkyUI: function() {
        this.skyContainerElement = document.getElementById('fishing-sky-container');

        if (!this.skyContainerElement) {
            console.error("#fishing-sky-container not found in HTML.");
            return;
        }

        // Initial render based on current sky-mechanics state (if available)
        if (typeof skyMechanics !== 'undefined' && typeof skyMechanics.activeBirds !== 'undefined') {
            this.renderBirds(skyMechanics.activeBirds);
        } else {
             console.warn("skyMechanics.activeBirds not found during Sky UI init. Birds may not render initially.");
             this.renderBirds([]); // Render empty if no data
        }
        console.log("Sky UI initialized.");
    },

    /**
     * Renders the birds in the sky container.
     * @param {Array<object>} activeBirdsData - Array of active bird objects from skyMechanics.
     */
    renderBirds: function(activeBirdsData) {
        if (!this.skyContainerElement) {
            // console.warn("Sky container not ready for rendering birds.");
            return;
        }

        // Simple pooling: reuse existing bird elements if possible by matching IDs
        const currentBirdElements = Array.from(this.skyContainerElement.children);
        const activeBirdIds = activeBirdsData.map(b => b.id);

        // Remove birds that are no longer active
        currentBirdElements.forEach(el => {
            if (!activeBirdIds.includes(el.id)) {
                el.remove();
            }
        });

        // Add new birds or update existing ones
        activeBirdsData.forEach(birdData => {
            let birdEl = document.getElementById(birdData.id);
            if (!birdEl) { // Bird doesn't exist, create it
                birdEl = document.createElement('div');
                birdEl.id = birdData.id;
                birdEl.classList.add('bird-in-sky');
                // Add type class for specific styling if needed: birdEl.classList.add(`bird-${birdData.type}`);
                this.skyContainerElement.appendChild(birdEl);

                birdEl.onclick = (event) => {
                    event.stopPropagation(); // Prevent click from bubbling to parent elements
                    if (typeof skyMechanics !== 'undefined' && typeof skyMechanics.clickBird === 'function') {
                        skyMechanics.clickBird(birdData.id);
                    } else {
                        console.error('skyMechanics.clickBird function not found.');
                    }
                };
            }

            // Update position and appearance
            birdEl.style.left = `${birdData.x}px`;
            birdEl.style.top = `${birdData.y}px`;
            birdEl.style.backgroundImage = `url('${birdData.imagePath || 'gui/fishing_game/bird_type1.png'}')`;
            birdEl.dataset.birdType = birdData.type || 'Bird'; // For CSS ::before content

            // Flip bird image based on direction
            if (birdData.speedX < 0) {
                birdEl.style.transform = 'scaleX(-1)'; // Facing left
            } else {
                birdEl.style.transform = 'scaleX(1)';  // Facing right
            }
        });
    }
};

// Make it globally available
window.skyUi = skyUi;

console.log("sky-ui.js loaded and attached to window.");
