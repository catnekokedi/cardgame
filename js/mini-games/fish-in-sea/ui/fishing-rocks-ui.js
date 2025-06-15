// js/mini-games/fish-in-sea/ui/fishing-rocks-ui.js

window.fishingRocksUi = {
    // pickaxeIconElement: null, // Removed
    rocksContainerElement: null,

    /**
     * Initializes the Rock UI components and event listeners.
     * Should be called when the fishing game screen is set up.
     */
    initializeRockUI: function() {
        // this.pickaxeIconElement = document.getElementById('pickaxe-icon'); // Removed
        this.rocksContainerElement = document.getElementById('fishing-rocks-container');

        /* Removed event listener for global pickaxe icon
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
        */

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
    },

    /**
     * Renders the rocks in their container based on rockSlotsData.
     * @param {Array<object|null>} rockSlotsData - Array of rock data.
     */
    renderRocks: function(rockSlotsData) {
    if (!this.rocksContainerElement) {
        return;
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

        const hoverIcon = document.createElement('div');
        hoverIcon.className = 'rock-hover-pickaxe';
        rockDiv.appendChild(hoverIcon);
        rockDiv.onmouseenter = () => { hoverIcon.style.display = 'flex'; };
        rockDiv.onmouseleave = () => { hoverIcon.style.display = 'none'; };

        if (rockData && !rockData.isRespawning) {
            const definition = rockData.definition || (typeof rockDefinitions !== 'undefined' ? rockDefinitions[rockData.rarity] : null);
            if (!definition) {
                console.error(`Rock definition missing for rarity: ${rockData.rarity} in slot ${index}.`);
                rockDiv.classList.add('rock-error');
                rockDiv.dataset.rockType = 'Error';
                this.rocksContainerElement.appendChild(rockDiv);
                return; // continue to next rock
            }

            if (rockData.hp <= 0) {
                // STATE: HP is 0 or less, but not 'isRespawning'
                rockDiv.classList.add('rock-destroyed');
                rockDiv.classList.add(`rock-rarity-${rockData.rarity || 'common'}`);
                rockDiv.dataset.rockType = `${rockData.rarity || 'common'} Rock (Destroyed)`;

                // Set base image, CSS class '.rock-destroyed' should visually alter it
                rockDiv.style.backgroundImage = `url('gui/fishing_game/${definition.image || 'rock_common.png'}')`;

                const hpDisplay = document.createElement('div');
                hpDisplay.classList.add('rock-hp-display');
                hpDisplay.textContent = `0/${rockData.maxHp}`;
                rockDiv.appendChild(hpDisplay);
                // No onclick handler for destroyed rocks
            } else {
                // STATE: HP > 0, normal active rock
                rockDiv.classList.add(`rock-rarity-${rockData.rarity || 'common'}`);
                rockDiv.dataset.rockType = `${rockData.rarity || 'common'} Rock`;

                let rockImageSrc = `gui/fishing_game/${definition.image || 'rock_common.png'}`;
                // rockData.hp > 0 is true here.
                if (rockData.hp < rockData.maxHp) {
                    if (definition.crackImages && definition.crackImages.length > 0) {
                        // Use the first crack image for any damage level for simplicity,
                        // or implement more stages if definition.crackImages has multiple and logic is added
                        rockImageSrc = `gui/fishing_game/${definition.crackImages[0]}`;
                    }
                }
                rockDiv.style.backgroundImage = `url('${rockImageSrc}')`;

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
            }
        } else if (rockData && rockData.isRespawning) {
            rockDiv.classList.add('rock-respawning');
            // Ensure BASE_ROCK_RESPAWN_TIME is accessible or use a default
            const baseRespawnTime = (typeof BASE_ROCK_RESPAWN_TIME !== 'undefined') ? BASE_ROCK_RESPAWN_TIME : 20000;
            const respawnTime = (rockData.definition && rockData.definition.respawnTime) || baseRespawnTime;
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
    // updatePickaxeCursor function removed as global cursor change is no longer used.
    // Hover effects will be handled by CSS on individual rocks if needed,
    // or a small pickaxe icon will appear on the rock itself.

    /**
     * Updates the visual state of the pickaxe icon.
     */
    updatePickaxeIconState: function() {
        const pickaxeIcon = fishingGameState.ui.pickaxeIcon; // Assumes pickaxeIcon is stored in fishingGameState.ui
        if (pickaxeIcon) {
            if (fishingGameState.pickaxeSelected) {
                pickaxeIcon.classList.add('active-tool');
            } else {
                pickaxeIcon.classList.remove('active-tool');
            }
        } else {
            console.warn("updatePickaxeIconState: Pickaxe icon element not found in fishingGameState.ui.");
        }
    }
};

window.fishingRocksUi = fishingRocksUi;
