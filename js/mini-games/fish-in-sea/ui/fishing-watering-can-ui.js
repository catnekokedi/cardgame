// js/mini-games/fish-in-sea/ui/fishing-watering-can-ui.js

const fishingWateringCanUi = {
    init(parentElement) {
        fishingGameState.ui.wateringCanIcon = parentElement.querySelector('#fishing-ui-panel-right #fishing-tool-watering-can');
        fishingGameState.ui.waterDropArea = parentElement.querySelector('#fishing-water-panel'); 
        
        if (fishingGameState.ui.wateringCanIcon) {
            fishingGameState.ui.wateringCanIcon.addEventListener('dragstart', (e) => this.handleDragStart(e));
            fishingGameState.ui.wateringCanIcon.addEventListener('dragend', (e) => this.handleDragEnd(e));

            // Add click listener for the watering can icon to toggle the upgrade modal
            fishingGameState.ui.wateringCanIcon.addEventListener('click', () => {
                const modal = document.getElementById('watering-can-upgrade-modal');
                if (modal) {
                    const isHidden = modal.style.display === 'none' || modal.style.display === '';
                    modal.style.display = isHidden ? 'flex' : 'none';
                    if (isHidden && typeof playSound === 'function') playSound('sfx_modal_open.mp3');
                    else if (!isHidden && typeof playSound === 'function') playSound('sfx_modal_close.mp3');

                    // If opening, ensure UI inside modal is up-to-date
                    if (isHidden && typeof updateWateringCanUI === 'function') {
                        updateWateringCanUI();
                    }
                }
            });
        }

        // Add click listener for the modal's close button
        const closeModalButton = document.getElementById('close-watering-can-modal');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                const modal = document.getElementById('watering-can-upgrade-modal');
                if (modal) {
                    modal.style.display = 'none';
                    if (typeof playSound === 'function') playSound('sfx_modal_close.mp3');
                }
            });
        }
        // console.log('[WC UI] Initialized. Watering Can Icon Element:', fishingGameState.ui.wateringCanIcon);
    },

    handleDragStart(event) {
        if (event.target.id !== 'fishing-tool-watering-can') return;
        // console.log('[WC UI] Drag Start');
        event.dataTransfer.setData('text/plain', 'watering_can');
        event.dataTransfer.effectAllowed = 'move';
        event.target.style.opacity = '0.5';
        event.target.classList.add('dragging');

        fishingGameState.wateringCan.isIconBeingDragged = true;
        const rect = event.target.getBoundingClientRect();
        fishingGameState.wateringCan.originalPosition = { x: rect.left, y: rect.top };

        this.updateIcon(); 

        const fruitSlotsContainer = fishingGameState.ui.fruitSlotsContainer;
        if (fruitSlotsContainer) {
            Array.from(fruitSlotsContainer.children).forEach(slot => slot.style.pointerEvents = 'none');
        }
    },

    handleDragEnd(event) {
        if (event.target.id !== 'fishing-tool-watering-can') return;
        // console.log('[WC UI] Drag End');
        event.target.style.opacity = '1';
        event.target.classList.remove('dragging');

        if (fishingGameState.wateringCan.currentTarget) { 
            wateringCanMechanics.clearCurrentOperation(); 
        }
        
        fishingGameState.wateringCan.isIconBeingDragged = false;
        this.updateIcon(); 
        if (typeof fishingUi !== 'undefined' && fishingUi.updateStatusText) fishingUi.updateStatusText(); 

        const fruitSlotsContainer = fishingGameState.ui.fruitSlotsContainer;
        if (fruitSlotsContainer) {
            Array.from(fruitSlotsContainer.children).forEach(slot => slot.style.pointerEvents = 'all');
        }
        if(typeof saveGame === 'function') saveGame();
    },
    
    updateIcon() {
        const canIcon = fishingGameState.ui.wateringCanIcon;
        if (canIcon) {
            const waterLevel = fishingGameState.wateringCan.waterLevel;
            const capacity = FISHING_CONFIG.WATERING_CAN_CONFIG.CAPACITY;
            const fillPercent = capacity > 0 ? ((waterLevel / capacity) * 100).toFixed(0) : 0;

            let newInnerHTML = '🚰';
            // If actively dragging OVER a valid target, always show percentage
            if (fishingGameState.wateringCan.isIconBeingDragged && fishingGameState.wateringCan.currentTarget) {
                newInnerHTML = `🚰 ${fillPercent}%`;
            } else if (waterLevel > 0) { // If not dragging over target, but has water, show percentage
                newInnerHTML = `🚰 ${fillPercent}%`;
            } // Else (not dragging over target AND waterLevel is 0), it remains '🚰'


            canIcon.innerHTML = newInnerHTML;
            canIcon.title = `Watering Can (${Math.floor(waterLevel)}/${capacity})`;
            canIcon.classList.toggle('full', waterLevel >= capacity * 0.9);
            canIcon.classList.toggle('empty', waterLevel <= capacity * 0.1 && !(waterLevel >= capacity * 0.9));
            
            // console.log(`[WC UI] Update Icon. Dragging: ${fishingGameState.wateringCan.isIconBeingDragged}, Target: ${fishingGameState.wateringCan.currentTarget}, WaterLvl: ${waterLevel.toFixed(1)}, Fill%: ${fillPercent}, InnerHTML: "${newInnerHTML}"`);
        } else {
            // console.warn('[WC UI] Watering can icon element not found for updateIcon.');
        }
    }
};