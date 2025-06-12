// js/mini-games/fish-in-sea/ui/fishing-tree-ui.js

const fishingTreeUi = {
    /**
     * Renders the tree slots in the UI.
     * @param {Array<object|null>} slotsData - Array of slot data from treeMechanics.getTreeSlotsData().
     * Each object can be null (empty) or { state: "unmatured|revealed", type: "...", maturation: 0-100 }.
     */
    renderTreeSlots: function(slotsData) {
        const treeContainer = document.getElementById('fishing-tree-container');
        if (!treeContainer) {
            // console.error("fishing-tree-container not found in HTML. Deferring render.");
            return; // Exit if container not ready
        }

        treeContainer.innerHTML = ''; // Clear existing slots

        if (!slotsData || !Array.isArray(slotsData)) {
            console.error("Invalid or missing slotsData for renderTreeSlots. Rendering empty slots.", slotsData);
            slotsData = Array(8).fill(null); // Default to 8 empty slots
        }
        
        // Ensure slotsData always has 8 items for rendering
        if (slotsData.length !== 8) {
            console.warn(`slotsData length is ${slotsData.length}, expected 8. Padding/truncating.`);
            const tempSlotsData = Array(8).fill(null);
            for(let i=0; i < 8; i++) {
                tempSlotsData[i] = slotsData[i] || null; // Use provided data or fill with null
            }
            slotsData = tempSlotsData;
        }

        slotsData.forEach((slot, index) => {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('tree-card-slot');
            slotDiv.dataset.slotIndex = index;
            // CSS variable for progress bar
            slotDiv.style.setProperty('--maturation-progress', `0%`);


            if (slot) {
                slotDiv.classList.remove('empty', 'closed', 'unmatured', 'revealed'); // Clear old states
                slotDiv.classList.add(slot.state); // "unmatured" or "revealed"
                
                if (slot.state === "unmatured") {
                    slotDiv.style.backgroundImage = `url('gui/fishing_game/tree-back.png')`;
                    slotDiv.style.setProperty('--maturation-progress', `${Math.floor(slot.maturation || 0)}%`);
                    // Simple text for progress, can be styled with CSS using the variable.
                    // This text won't be visible if card is face down unless styled to overlay.
                    // Consider adding a visible progress bar element if needed.
                    // slotDiv.textContent = `${Math.floor(slot.maturation || 0)}%`;
                } else if (slot.state === "revealed") {
                    // Ensure slot.card and slot.card.imagePath exist
                    if (slot.card && slot.card.imagePath) {
                        slotDiv.style.backgroundImage = `url('${slot.card.imagePath}')`;
                        // Add a class for general revealed card styling if needed, distinct from specific rarity image
                        slotDiv.classList.add('revealed-collectible');
                    } else {
                        // Fallback if card data or imagePath is missing for a revealed card
                        slotDiv.style.backgroundImage = `url('gui/fishing_game/fish-back.png')`; // Generic fallback
                        console.warn("Revealed tree card missing cardData or imagePath, using fallback.", slot);
                    }
                    slotDiv.onclick = () => {
                        if (typeof collectCardFromTree === 'function') {
                            collectCardFromTree(index);
                            if (typeof playSound === 'function') playSound('sfx_collect_fruit.mp3');
                        } else {
                            console.error('collectCardFromTree function not found.');
                        }
                    };
                } else { // Default to closed if unknown state for some reason
                    slotDiv.classList.add('closed');
                    slotDiv.style.backgroundImage = `url('gui/fishing_game/tree-back.png')`;
                }
            } else {
                slotDiv.classList.remove('closed', 'unmatured', 'revealed');
                slotDiv.classList.add('empty');
                // No background image for empty, or a specific one if desired
                slotDiv.style.backgroundImage = 'none';
            }
            treeContainer.appendChild(slotDiv);
        });
    },

    /**
     * Updates the tree moisture display in the UI.
     * @param {number} moistureLevel - The current moisture level (0-100).
     */
    updateMoistureDisplay: function(moistureLevel) {
        const moistureDisplayValue = document.getElementById('tree-moisture-display-value');
        if (moistureDisplayValue) {
            moistureDisplayValue.textContent = Math.round(moistureLevel);
        } else {
            // This can happen if called before DOM is fully ready.
            // console.warn("tree-moisture-display-value element not found at time of update.");
        }
    },

    /**
     * Initializes the tree UI components.
     * Should be called after the main DOM is loaded and treeMechanics state is available.
     */
    initialize: function() {
        // Attempt initial render. treeMechanics.initializeTree will also call these.
        if (typeof getTreeSlotsData === 'function' && typeof treeMoisture !== 'undefined') {
            this.renderTreeSlots(getTreeSlotsData());
            this.updateMoistureDisplay(treeMoisture);
        } else {
            // Fallback if treeMechanics isn't ready, render default empty state
            console.warn("fishingTreeUi.initialize: treeMechanics data not ready. Rendering default empty tree.");
            this.renderTreeSlots(Array(8).fill(null));
            this.updateMoistureDisplay(100); // Default moisture
        }
        console.log("Fishing Tree UI initialized or re-initialized.");
    }
};

// Make it globally available
window.fishingTreeUi = fishingTreeUi;

// The initialize call should ideally be managed by the main game script (e.g., in startFishingGame)
// after all necessary HTML and JS are loaded.
// For example, after fishingUi.init(gameContentEl); in fish-in-sea-main.js,
// you could add fishingTreeUi.initialize();
console.log("fishing-tree-ui.js loaded and attached to window.");
