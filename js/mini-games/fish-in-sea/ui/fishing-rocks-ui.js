// js/mini-games/fish-in-sea/ui/fishing-rocks-ui.js

const fishingRocksUi = {
    pickaxeIconElement: null,
    rocksContainerElement: null,

    /**
     * Initializes the Rock UI components and event listeners.
     * Should be called when the fishing game screen is set up.
     */
    initializeRockUI: function() {
        this.pickaxeIconElement = document.getElementById('pickaxe-icon');
        this.rocksContainerElement = document.getElementById('fishing-rocks-container');

        if (!this.pickaxeIconElement) {
            console.error("Pickaxe icon element (#pickaxe-icon) not found in HTML.");
        } else {
            this.pickaxeIconElement.addEventListener('click', () => {
                if (typeof pickaxeSelected !== 'undefined' && pickaxeSelected) {
                    if (typeof deselectPickaxeTool === 'function') deselectPickaxeTool();
                } else {
                    if (typeof selectPickaxeTool === 'function') selectPickaxeTool();
                }
            });
        }

        if (!this.rocksContainerElement) {
            console.error("Fishing rocks container (#fishing-rocks-container) not found in HTML.");
            return;
        }
        
        // Initial render. Assumes rock-mechanics.js has initialized its data.
        if (typeof getRockSlotsData === 'function') {
            this.renderRocks(getRockSlotsData());
        } else {
             console.warn("getRockSlotsData function not found during Rock UI init. Rocks may not render initially.");
             // Attempt to render empty slots if function is missing, using MAX_ROCKS from rock-mechanics if available
             const numSlots = typeof MAX_ROCKS !== 'undefined' ? MAX_ROCKS : 3;
             this.renderRocks(new Array(numSlots).fill(null));
        }
        console.log("Fishing Rocks UI initialized.");
    },

    /**
     * Renders the rocks in their container based on rockSlotsData.
     * @param {Array<object|null>} rockSlotsData - Array of rock data.
     */
    renderRocks: function(rockSlotsData) {
        if (!this.rocksContainerElement) {
            return; // Container not available
        }
        this.rocksContainerElement.innerHTML = '';

        const numSlots = typeof MAX_ROCKS !== 'undefined' ? MAX_ROCKS : 3;
        if (!rockSlotsData || !Array.isArray(rockSlotsData) || rockSlotsData.length !== numSlots) {
            console.warn("Invalid or incomplete rockSlotsData for renderRocks. Rendering default empty slots.", rockSlotsData);
            rockSlotsData = new Array(numSlots).fill(null);
        }

        rockSlotsData.forEach((rockData, index) => {
            const rockDiv = document.createElement('div');
            rockDiv.classList.add('rock-instance');
            rockDiv.dataset.slotIndex = index;

            if (rockData && !rockData.isRespawning) {
                rockDiv.classList.add(`rock-rarity-${rockData.rarity || 'common'}`);
                rockDiv.dataset.rockType = `${rockData.rarity || 'common'} Rock`; // For CSS ::before content

                const definition = rockData.definition || rockDefinitions[rockData.rarity];
                if (!definition) {
                    console.error(`Rock definition missing for rarity: ${rockData.rarity}`);
                    rockDiv.classList.add('rock-error');
                    // rockDiv.textContent = 'Error'; // Text content now handled by ::before
                    rockDiv.dataset.rockType = 'Error';
                    this.rocksContainerElement.appendChild(rockDiv);
                    return; // continue to next rock
                }

                let rockImage = `gui/fishing_game/${definition.image || 'rock_common.png'}`;
                if (rockData.cracks > 0 && definition.crackImages && definition.crackImages.length > 0) {
                    const crackImageIndex = Math.min(rockData.cracks, definition.crackImages.length) - 1;
                    if (crackImageIndex >= 0) {
                         rockImage = `gui/fishing_game/${definition.crackImages[crackImageIndex]}`;
                    }
                }
                rockDiv.style.backgroundImage = `url('${rockImage}')`;

                const hpDisplay = document.createElement('div');
                hpDisplay.classList.add('rock-hp-display');
                hpDisplay.textContent = `${rockData.hp}/${rockData.maxHp}`;
                rockDiv.appendChild(hpDisplay);

                rockDiv.onclick = () => {
                    if (typeof hitRock === 'function') {
                        hitRock(index);
                    } else {
                        console.error('hitRock function not found.');
                    }
                };
            } else if (rockData && rockData.isRespawning) {
                rockDiv.classList.add('rock-respawning');
                const respawnTime = (rockData.definition && rockData.definition.respawnTime) || BASE_ROCK_RESPAWN_TIME;
                const timerPercentage = Math.max(0, 100 - (rockData.respawnTimer / respawnTime) * 100);
                rockDiv.innerHTML = `<div class="rock-respawn-timer-text">Respawning</div>
                                     <div class="rock-respawn-bar-container">
                                         <div class="rock-respawn-bar" style="width:${timerPercentage}%"></div>
                                     </div>`;
            } else {
                rockDiv.classList.add('rock-empty-slot');
            }
            this.rocksContainerElement.appendChild(rockDiv);
        });
    },

    /**
     * Updates the main game cursor and pickaxe icon style.
     * @param {boolean} isSelected - True if pickaxe is selected.
     */
    updatePickaxeCursor: function(isSelected) {
        const gameScreen = document.getElementById('fish-in-sea-screen'); // More specific target

        if (isSelected) {
            if (gameScreen) gameScreen.classList.add('pickaxe-active');
            else document.body.classList.add('pickaxe-active'); // Fallback to body

            if (this.pickaxeIconElement) this.pickaxeIconElement.classList.add('selected');
        } else {
            if (gameScreen) gameScreen.classList.remove('pickaxe-active');
            else document.body.classList.remove('pickaxe-active');

            if (this.pickaxeIconElement) this.pickaxeIconElement.classList.remove('selected');
        }
    }
};

window.fishingRocksUi = fishingRocksUi;
console.log("fishing-rocks-ui.js loaded and attached to window.");
