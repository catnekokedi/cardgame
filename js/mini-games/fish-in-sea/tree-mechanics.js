// js/mini-games/fish-in-sea/tree-mechanics.js

const treeMechanics = {
    updateTreeFruitGrowth() {
        if (!fishingGameState.isGameActive) return;
        const now = Date.now();
        const elapsedSeconds = (now - fishingGameState.lastTreeUpdateTime) / 1000;

        if (elapsedSeconds <= 0) return;

        let moistureUpdated = false;
        const activeGrowingSlots = fishingGameState.fruitSlots.filter(s => s.targetRarityKey && !s.isMature).length;
        // console.log(`[Tree Mechanics] Update Fruit Growth. Elapsed(s): ${elapsedSeconds.toFixed(2)}, Moisture: ${fishingGameState.treeMoistureLevel.toFixed(1)}, Active Slots: ${activeGrowingSlots}`);


        if (fishingGameState.treeMoistureLevel > 0 && activeGrowingSlots > 0) {
            const moistureConsumed = FISHING_CONFIG.TREE_CONFIG.MOISTURE_CONSUMPTION_RATE_PER_SECOND * elapsedSeconds * activeGrowingSlots;
            const oldMoisture = fishingGameState.treeMoistureLevel;
            fishingGameState.treeMoistureLevel = Math.max(0, fishingGameState.treeMoistureLevel - moistureConsumed);
            if (Math.abs(oldMoisture - fishingGameState.treeMoistureLevel) > 0.01) {
                moistureUpdated = true;
                // console.log(`[Tree Mechanics] Moisture consumed: ${moistureConsumed.toFixed(3)}, New Moisture: ${fishingGameState.treeMoistureLevel.toFixed(1)}`);
            }
        }
        
        fishingGameState.lastTreeUpdateTime = now;


        let fruitsUpdatedThisTick = false;
        for (let i = 0; i < FISHING_CONFIG.TREE_CONFIG.FRUIT_SLOTS; i++) {
            const slot = fishingGameState.fruitSlots[i];
            if (!slot.isMature && fishingGameState.treeMoistureLevel > 0) { 
                if (!slot.targetRarityKey) { 
                    let randomPackProb = Math.random();
                    let cumulativePackProb = 0;
                    let determinedRarity = RARITY_PACK_PULL_DISTRIBUTION[0].key; 
                    for (const tier of (liveRarityPackPullDistribution || RARITY_PACK_PULL_DISTRIBUTION)) {
                        cumulativePackProb += tier.packProb;
                        if (randomPackProb < cumulativePackProb) { determinedRarity = tier.key; break; }
                    }
                    if (randomPackProb >= cumulativePackProb && cumulativePackProb < (1.0 - 0.00001) && (liveRarityPackPullDistribution || RARITY_PACK_PULL_DISTRIBUTION).length > 0) { 
                        determinedRarity = (liveRarityPackPullDistribution || RARITY_PACK_PULL_DISTRIBUTION)[0].key; 
                    }

                    slot.targetRarityKey = determinedRarity;
                    slot.ripeningTime = FISHING_CONFIG.TREE_CONFIG.GROW_TIME_FACTORS_BY_RARITY[slot.targetRarityKey] || FISHING_CONFIG.TREE_CONFIG.GROW_TIME_FACTORS_BY_RARITY.base;
                    slot.growthProgress = 0; 
                    fruitsUpdatedThisTick = true;
                    // console.log(`[Tree Mechanics] Slot ${i} starts growing: ${slot.targetRarityKey}, Ripening time (ms): ${slot.ripeningTime}`);
                }

                if (slot.targetRarityKey && !slot.isMature) { 
                    const moistureFactor = Math.max(0.1, fishingGameState.treeMoistureLevel / FISHING_CONFIG.TREE_CONFIG.MAX_MOISTURE_LEVEL);
                    const growthThisTick = (elapsedSeconds / (slot.ripeningTime / 1000)) * 100 * moistureFactor;
                    slot.growthProgress += growthThisTick;
                    fruitsUpdatedThisTick = true;
                    // console.log(`[Tree Mechanics] Slot ${i} (${slot.targetRarityKey}) progress: ${slot.growthProgress.toFixed(1)}%, Moisture factor: ${moistureFactor.toFixed(2)}, Growth this tick: ${growthThisTick.toFixed(3)}`);


                    if (slot.growthProgress >= 100) {
                        slot.growthProgress = 100;
                        slot.isMature = true;
                        const activeSets = getActiveSetDefinitions();
                        let cardGenerated = false;
                        let attempts = 0;
                        while(!cardGenerated && attempts < 50 && activeSets.length > 0) {
                            attempts++;
                            const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
                            if (randomSetDef.count > 0) {
                                const potentialCardIds = Array.from({ length: randomSetDef.count }, (_, k) => k + 1);
                                const eligibleCards = potentialCardIds.filter(id => getCardIntrinsicRarity(randomSetDef.abbr, id) === slot.targetRarityKey);
                                if (eligibleCards.length > 0) {
                                    const cardId = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
                                    const fixedProps = getFixedGradeAndPrice(randomSetDef.abbr, cardId);
                                    slot.item = { set: randomSetDef.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price };
                                    cardGenerated = true;
                                }
                            }
                        }
                        if (!cardGenerated) { 
                            const fallbackSet = activeSets.find(s => s.count > 0) || ALL_SET_DEFINITIONS.find(s => s.count > 0) || ALL_SET_DEFINITIONS[0];
                            const cardId = (fallbackSet.count > 0) ? Math.floor(Math.random() * fallbackSet.count) + 1 : 1;
                            const fixedProps = getFixedGradeAndPrice(fallbackSet.abbr, cardId); 
                            slot.item = {set: fallbackSet.abbr, cardId, rarityKey: slot.targetRarityKey, grade: fixedProps.grade, price: fixedProps.price};
                        }
                        // console.log(`[Tree Mechanics] Slot ${i} MATURED! Item: ${JSON.stringify(slot.item)}`);
                        if (typeof playSound === 'function') playSound('sfx_fishing_fruit_ready.mp3');
                    }
                }
            }
        }
        if ((fruitsUpdatedThisTick || moistureUpdated) && typeof fishingTreeUi !== 'undefined' && fishingTreeUi.updateVisuals) {
            fishingTreeUi.updateVisuals();
        }
    },

    collectFruit(slotIndex) {
        const slot = fishingGameState.fruitSlots[slotIndex];
        if (slot && slot.isMature && slot.item) {
            if (typeof playSound === 'function') playSound('sfx_fishing_collect.mp3');
            const fruitCardItem = {
                type: 'fruit_card',
                details: { ...slot.item, name: `${slot.item.rarityKey} Fruit Card` }, 
                id: Date.now() + `_fruit_${slotIndex}` 
            };
            fishingGameState.basket.push(fruitCardItem);
            if (typeof fishingUi !== 'undefined' && fishingUi.showCatchPreview) fishingUi.showCatchPreview(fruitCardItem); 
            // console.log(`[Tree Mechanics] Collected fruit from slot ${slotIndex}. Item: ${JSON.stringify(fruitCardItem)}`);


            slot.item = null;
            slot.targetRarityKey = null;
            slot.growthProgress = 0;
            slot.isMature = false;
            slot.ripeningTime = 0;
            if (typeof fishingTreeUi !== 'undefined' && fishingTreeUi.updateVisuals) fishingTreeUi.updateVisuals();
            if (typeof saveGame === 'function') saveGame();
        } else {
            // console.warn(`[Tree Mechanics] Attempted to collect from slot ${slotIndex}, but not ready or no item. Slot state:`, JSON.stringify(slot));
        }
    }
};