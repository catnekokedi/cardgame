// js/mini-games/fish-in-sea/ui/fishing-watering-can-ui.js

const fishingWateringCanUi = {
    init(parentElement) {
        fishingGameState.ui.wateringCanIcon = parentElement.querySelector('#fishing-ui-panel-right #fishing-tool-watering-can');
        fishingGameState.ui.waterDropArea = parentElement.querySelector('#fishing-water-panel'); 
        
        if (fishingGameState.ui.wateringCanIcon) {
            // Drag listeners remain
            fishingGameState.ui.wateringCanIcon.addEventListener('dragstart', (e) => this.handleDragStart(e));
            fishingGameState.ui.wateringCanIcon.addEventListener('dragend', (e) => this.handleDragEnd(e));

            // Click listener for opening modal is REMOVED from here (now in fishing-ui.js)
        }

        // Click listener for the modal's close button is REMOVED from here (now in fishing-ui.js)

        // console.log('[WC UI] Initialized. Drag listeners attached. Click listeners are now in fishing-ui.js.');
    },

    // handleDragStart(event) { // Drag functionality removed
    //     if (event.target.id !== 'fishing-tool-watering-can') return;
    //     event.dataTransfer.setData('text/plain', 'watering_can');
    //     event.dataTransfer.effectAllowed = 'move';
    //     event.target.style.opacity = '0.5';
    //     event.target.classList.add('dragging');
    //     if (fishingGameState.wateringCan) fishingGameState.wateringCan.isIconBeingDragged = true;
    //     this.updateIcon();
    //     const fruitSlotsContainer = fishingGameState.ui.fruitSlotsContainer;
    //     if (fruitSlotsContainer) {
    //         Array.from(fruitSlotsContainer.children).forEach(slot => slot.style.pointerEvents = 'none');
    //     }
    // },

    // handleDragEnd(event) { // Drag functionality removed
    //     if (event.target.id !== 'fishing-tool-watering-can') return;
    //     event.target.style.opacity = '1';
    //     event.target.classList.remove('dragging');
    //     if (fishingGameState.wateringCan && fishingGameState.wateringCan.currentTarget && typeof wateringCanMechanics !== 'undefined' && wateringCanMechanics.clearCurrentOperation) {
    //         wateringCanMechanics.clearCurrentOperation();
    //     }
    //     if (fishingGameState.wateringCan) fishingGameState.wateringCan.isIconBeingDragged = false;
    //     this.updateIcon();
    //     if (typeof fishingUi !== 'undefined' && fishingUi.updateStatusText) fishingUi.updateStatusText();
    //     const fruitSlotsContainer = fishingGameState.ui.fruitSlotsContainer;
    //     if (fruitSlotsContainer) {
    //         Array.from(fruitSlotsContainer.children).forEach(slot => slot.style.pointerEvents = 'all');
    //     }
    //     if(typeof saveGame === 'function') saveGame();
    // },
    
    updateIcon() {
        const canIcon = fishingGameState.ui.wateringCanIcon;
        if (canIcon) {
            // Water level / capacity logic removed. Icon is static.
            canIcon.innerHTML = '🚰';
            canIcon.title = 'Watering Can (Upgrades Available)'; // Updated title
            canIcon.classList.remove('full', 'empty'); // Remove classes related to water level
        } else {
            // console.warn('[WC UI] Watering can icon element not found for updateIcon.');
        }
    }
};