// js/mini-games/fish-in-sea/watering-can.js

const wateringCanMechanics = {
    startOperationOnTarget(target) {
        fishingGameState.wateringCan.currentTarget = target;
        fishingGameState.wateringCan.operationStartTime = Date.now();
        // console.log('[WC Mechanics] Start operation on target:', target, 'IsDragging:', fishingGameState.wateringCan.isIconBeingDragged); 
        if (fishingGameState.wateringCan.isIconBeingDragged && typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIcon) {
            fishingWateringCanUi.updateIcon();
        }
        if (typeof fishingUi !== 'undefined' && fishingUi.updateStatusText) {
             fishingUi.updateStatusText(); 
        }
    },

    clearCurrentOperation() {
        const prevTarget = fishingGameState.wateringCan.currentTarget;
        fishingGameState.wateringCan.currentTarget = null;
        // console.log('[WC Mechanics] Clear operation, previous target was:', prevTarget, 'IsDragging:', fishingGameState.wateringCan.isIconBeingDragged); 
        if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIcon) {
            fishingWateringCanUi.updateIcon();
        }
        if (prevTarget && typeof fishingUi !== 'undefined' && fishingUi.updateStatusText) {
            fishingUi.updateStatusText();
        }
    },

    updateWateringCanDragAction() {
        if (!fishingGameState.wateringCan.isIconBeingDragged || !fishingGameState.wateringCan.currentTarget || !fishingGameState.isGameActive) {
            return;
        }
        
        const now = Date.now();
        const elapsedSeconds = (now - fishingGameState.wateringCan.operationStartTime) / 1000;
        let stateChanged = false;


        if (fishingGameState.wateringCan.currentTarget === 'water_area') {
            const fillAmount = FISHING_CONFIG.WATERING_CAN_CONFIG.FILL_RATE_PER_SECOND_DRAG * elapsedSeconds;
            const oldLevel = fishingGameState.wateringCan.waterLevel;
            fishingGameState.wateringCan.waterLevel = Math.min(FISHING_CONFIG.WATERING_CAN_CONFIG.CAPACITY, fishingGameState.wateringCan.waterLevel + fillAmount);
            if (Math.abs(oldLevel - fishingGameState.wateringCan.waterLevel) > 0.01) {
                stateChanged = true;
                // console.log(`[WC Mechanics Fill] Fill amount: ${fillAmount.toFixed(2)}, Old Level: ${oldLevel.toFixed(1)}, New Level: ${fishingGameState.wateringCan.waterLevel.toFixed(1)}`);
            }
        } else if (fishingGameState.wateringCan.currentTarget === 'tree_area') {
            if (fishingGameState.wateringCan.waterLevel > 0 && fishingGameState.treeMoistureLevel < FISHING_CONFIG.TREE_CONFIG.MAX_MOISTURE_LEVEL) {
                const waterAmount = FISHING_CONFIG.WATERING_CAN_CONFIG.DRAG_WATER_RATE_PER_SECOND * elapsedSeconds;
                const actualWaterUsed = Math.min(fishingGameState.wateringCan.waterLevel, waterAmount);
                const waterToFillTree = FISHING_CONFIG.TREE_CONFIG.MAX_MOISTURE_LEVEL - fishingGameState.treeMoistureLevel;
                const waterApplied = Math.min(actualWaterUsed, waterToFillTree);

                if (waterApplied > 0.01) { 
                    const oldTreeMoisture = fishingGameState.treeMoistureLevel;
                    const oldCanWater = fishingGameState.wateringCan.waterLevel;

                    fishingGameState.treeMoistureLevel += waterApplied;
                    fishingGameState.wateringCan.waterLevel -= waterApplied;
                    fishingGameState.lastTreeUpdateTime = now; 
                    
                    if (Math.abs(oldTreeMoisture - fishingGameState.treeMoistureLevel) > 0.01 || Math.abs(oldCanWater - fishingGameState.wateringCan.waterLevel) > 0.01) {
                        stateChanged = true;
                        // console.log(`[WC Mechanics Water Tree] Water applied: ${waterApplied.toFixed(2)}, Old CanLvl: ${oldCanWater.toFixed(1)}, New CanLvl: ${fishingGameState.wateringCan.waterLevel.toFixed(1)}, Old TreeM: ${oldTreeMoisture.toFixed(1)}, New TreeM: ${fishingGameState.treeMoistureLevel.toFixed(1)}`);
                    }
                }
            }
        }
        
        if (fishingGameState.wateringCan.currentTarget) {
            fishingGameState.wateringCan.operationStartTime = now;
        }

        if (stateChanged) {
            if (fishingGameState.wateringCan.currentTarget === 'tree_area' && typeof fishingTreeUi !== 'undefined' && fishingTreeUi.updateVisuals) {
                fishingTreeUi.updateVisuals(); 
            }
             if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIcon) fishingWateringCanUi.updateIcon();
        } else if (fishingGameState.wateringCan.isIconBeingDragged && fishingGameState.wateringCan.currentTarget) {
            if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIcon) fishingWateringCanUi.updateIcon();
        }
    }
};