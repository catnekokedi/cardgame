// js/mini-games/fish-in-sea/rock-mechanics.js

const rockMechanics = {
    mineRock(rockInstanceId) {
        const rockInstance = fishingGameState.rocks.find(r => r.instanceId === rockInstanceId);
        if (!rockInstance || !rockInstance.isReadyToMine || !fishingGameState.pickaxeSelected) {
            if (!fishingGameState.pickaxeSelected) {
                fishingUi.showTemporaryResultMessage("Select the pickaxe first!");
                // console.log('[Rock Mechanics] Attempted to mine without pickaxe selected.');
            } else if (rockInstance && !rockInstance.isReadyToMine) {
                fishingUi.showTemporaryResultMessage("This rock needs time to recover.");
                // console.log('[Rock Mechanics] Attempted to mine rock not ready:', rockInstanceId);
            }
            return;
        }

        if (typeof playSound === 'function') playSound('sfx_fishing_mine_hit.mp3');
        rockInstance.currentClicks++;
        // console.log(`[Rock Mechanics] Mining rock: ${rockInstance.definition.name}, ID: ${rockInstanceId}, Clicks: ${rockInstance.currentClicks}/${rockInstance.definition.clicksToBreak}`);
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.updateVisual) fishingRocksUi.updateVisual(rockInstance.instanceId);

        if (rockInstance.currentClicks >= rockInstance.definition.clicksToBreak) {
            rockInstance.isReadyToMine = false;
            rockInstance.lastMinedTime = Date.now();
            rockInstance.currentClicks = 0;

            if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.playBreakAnimation) {
                fishingRocksUi.playBreakAnimation(rockInstance.instanceId, () => {
                    if (typeof playSound === 'function') playSound('sfx_fishing_mine_finish.mp3');
                    const dropPool = rockInstance.definition.cardDropPool;
                    const droppedRarityKey = dropPool[Math.floor(Math.random() * dropPool.length)];
                    // console.log(`[Rock Mechanics] Rock broken: ${rockInstance.definition.name}, Dropped Rarity Tier: ${droppedRarityKey}`);


                    const activeSets = getActiveSetDefinitions();
                    let mineralCardDetails = null;
                    let attempts = 0;
                    while(!mineralCardDetails && attempts < 50 && activeSets.length > 0) {
                        attempts++;
                        const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
                         if (randomSetDef.count > 0) {
                            const potentialCardIds = Array.from({ length: randomSetDef.count }, (_, k) => k + 1);
                            const eligibleCards = potentialCardIds.filter(id => getCardIntrinsicRarity(randomSetDef.abbr, id) === droppedRarityKey);
                            if (eligibleCards.length > 0) {
                                const cardId = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
                                const fixedProps = getFixedGradeAndPrice(randomSetDef.abbr, cardId);
                                mineralCardDetails = { set: randomSetDef.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price };
                            }
                        }
                    }
                     if (!mineralCardDetails && activeSets.length > 0) { 
                        const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
                        const cardId = (randomSetDef.count > 0) ? Math.floor(Math.random() * randomSetDef.count) + 1 : 1;
                        const fixedProps = getFixedGradeAndPrice(randomSetDef.abbr, cardId); 
                        mineralCardDetails = { set: randomSetDef.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price };
                     } else if (!mineralCardDetails) { 
                        const fallbackSet = ALL_SET_DEFINITIONS.find(s => s.count > 0) || ALL_SET_DEFINITIONS[0];
                        const cardId = (fallbackSet.count > 0) ? Math.floor(Math.random() * fallbackSet.count) + 1 : 1;
                        const fixedProps = getFixedGradeAndPrice(fallbackSet.abbr, cardId);
                        mineralCardDetails = {set: fallbackSet.abbr, cardId, rarityKey: fixedProps.rarityKey, grade: fixedProps.grade, price: fixedProps.price};
                     }
                    // console.log('[Rock Mechanics] Generated mineral card:', JSON.stringify(mineralCardDetails));

                    const mineralItem = { type: 'mineral_card', details: {...mineralCardDetails, name: `${mineralCardDetails.rarityKey} Mineral Card`}, id: Date.now() + `_mineral_${rockInstance.instanceId}`};
                    fishingGameState.basket.push(mineralItem);
                    if (typeof fishingUi !== 'undefined' && fishingUi.showCatchPreview) fishingUi.showCatchPreview(mineralItem);
                    if (typeof saveGame === 'function') saveGame();

                    fishingGameState.rocks = fishingGameState.rocks.filter(r => r.instanceId !== rockInstanceId);
                });
            }
        }
    },

    manageRockSpawnsAndRespawns() {
        if (!fishingGameState.isGameActive) return;
        const now = Date.now();
        
        if (fishingGameState.rocks.length < FISHING_CONFIG.MAX_VISIBLE_ROCKS && now >= fishingGameState.nextRockSpawnTime) {
            const randomRockDefIndex = Math.floor(Math.random() * FISHING_CONFIG.ROCK_DEFINITIONS.length);
            const rockDef = FISHING_CONFIG.ROCK_DEFINITIONS[randomRockDefIndex];
            const newRock = {
                instanceId: `rock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                rockTypeId: rockDef.id,
                definition: rockDef,
                currentClicks: 0,
                lastMinedTime: 0,
                isReadyToMine: true,
                isBeingMined: false,
                miningProgress: 0,
                position: {
                    x: Math.random() * 70 + 15, 
                    y: Math.random() * 20 + 5  
                }
            };
            fishingGameState.rocks.push(newRock);
            fishingGameState.nextRockSpawnTime = now + (Math.random() * (FISHING_CONFIG.ROCK_RESPAWN_TIME_MS / 2) + (FISHING_CONFIG.ROCK_RESPAWN_TIME_MS / 2) ); // More variability
            // console.log(`[Rock Mechanics] Spawning new rock: ${newRock.definition.name} at ${newRock.position.x.toFixed(1)}%, ${newRock.position.y.toFixed(1)}%. Next spawn around: ${new Date(fishingGameState.nextRockSpawnTime).toLocaleTimeString()}`);
            if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.addRockToDOM) fishingRocksUi.addRockToDOM(newRock);
        }
    }
};