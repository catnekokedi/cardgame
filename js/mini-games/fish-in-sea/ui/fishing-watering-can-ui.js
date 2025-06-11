// js/mini-games/fish-in-sea/ui/fishing-watering-can-ui.js

const fishingWateringCanUi = {
    init(parentElement) {
        fishingGameState.ui.wateringCanIcon = parentElement.querySelector('#fishing-ui-panel-right #fishing-tool-watering-can');
        fishingGameState.ui.waterDropArea = parentElement.querySelector('#fishing-water-panel'); 
        
        if (fishingGameState.ui.wateringCanIcon) {
            fishingGameState.ui.wateringCanIcon.addEventListener('dragstart', (e) => this.handleDragStart(e));
            fishingGameState.ui.wateringCanIcon.addEventListener('dragend', (e) => this.handleDragEnd(e));
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