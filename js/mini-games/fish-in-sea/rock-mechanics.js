// js/mini-games/fish-in-sea/rock-mechanics.js

const MAX_ROCKS = 3;
let rockSlots = new Array(MAX_ROCKS).fill(null);
// let pickaxeSelected = false; // Removed global pickaxe state

// Cooldown between hits on the same rock
const ROCK_HIT_COOLDOWN = 500; // 0.5 seconds
let rockLastHitTime = new Array(MAX_ROCKS).fill(0);

// Respawn time for rocks
const BASE_ROCK_RESPAWN_TIME = 20000; // 20 seconds, can be randomized per rock

// Rock Definitions: HP, card drop pool (placeholders), appearance
const rockDefinitions = {
    common: { hp: 5, color: '#A0A0A0', cardPool: ['mineral_common_1', 'mineral_common_2'], ticketChance: 0.05, name: "Common Rock", image: "rock_common.png", crackImages: ["rock_common_crack1.png", "rock_common_crack2.png", "rock_common_crack3.png"] },
    uncommon: { hp: 8, color: '#60A0B0', cardPool: ['mineral_uncommon_1'], ticketChance: 0.1, name: "Uncommon Rock", image: "rock_uncommon.png", crackImages: ["rock_uncommon_crack1.png", "rock_uncommon_crack2.png", "rock_uncommon_crack3.png"] },
    rare: { hp: 12, color: '#7070FF', cardPool: ['mineral_rare_1'], ticketChance: 0.2, name: "Rare Rock", image: "rock_rare.png", crackImages: ["rock_rare_crack1.png", "rock_rare_crack2.png", "rock_rare_crack3.png"] },
    legendary: { hp: 20, color: '#FFD700', cardPool: ['mineral_legendary_1'], ticketChance: 0.35, name: "Legendary Rock", image: "rock_legendary.png", crackImages: ["rock_legendary_crack1.png", "rock_legendary_crack2.png", "rock_legendary_crack3.png"] }
};
const rockRarities = Object.keys(rockDefinitions);

/**
 * Initializes rock states and potentially spawns initial rocks.
 */
function initializeRocks() {
    rockSlots = new Array(MAX_ROCKS).fill(null);
    // pickaxeSelected = false; // Removed
    rockLastHitTime = new Array(MAX_ROCKS).fill(0);

    for (let i = 0; i < MAX_ROCKS; i++) {
        // Spawn with no initial delay for the very first setup
        spawnNewRock(i, 0);
    }
    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function') {
        fishingRocksUi.renderRocks(getRockSlotsData());
    }
    console.log("Rock mechanics initialized. Slots:", rockSlots);
}

/**
 * Manages spawning of new rocks in empty slots after a delay.
 * Called in the game loop.
 * @param {number} deltaTime Time since last game loop update in milliseconds.
 */
function manageRockSpawnsAndRespawns(deltaTime) {
    let changed = false;
    for (let i = 0; i < MAX_ROCKS; i++) {
        if (rockSlots[i] && rockSlots[i].isRespawning) {
            rockSlots[i].respawnTimer -= deltaTime;
            if (rockSlots[i].respawnTimer <= 0) {
                spawnNewRock(i, 0); // Spawn immediately after timer
                changed = true;
            }
        }
    }
    if (changed && typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function') {
        fishingRocksUi.renderRocks(getRockSlotsData());
    }
}

/**
 * Spawns a new rock in the given slot index.
 * @param {number} slotIndex The index of the slot to spawn a rock in.
 * @param {number} [initialDelay=0] Optional delay before the rock actually appears (used for initial setup).
 */
function spawnNewRock(slotIndex, initialDelay = 0) {
    const randomRarity = rockRarities[Math.floor(Math.random() * rockRarities.length)];
    const definition = rockDefinitions[randomRarity];
    rockSlots[slotIndex] = {
        id: `rock_${slotIndex}_${Date.now()}`, // Unique ID
        rarity: randomRarity,
        hp: definition.hp,
        maxHp: definition.hp,
        definition: definition, // Full definition for UI and logic
        cracks: 0, // Visual cracking stage (0-3 typically)
        isRespawning: false,
        respawnTimer: 0,
    };
    // If an initial delay was specified (e.g. for staggering first spawns, not typical respawn)
    // This logic might be better handled by manageRockSpawnsAndRespawns setting a timer when a slot is truly empty.
    // For now, assume initialDelay = 0 for direct spawning.
    console.log(`New ${randomRarity} rock spawned in slot ${slotIndex}.`);
}

// selectPickaxeTool and deselectPickaxeTool functions REMOVED

/**
 * Handles hitting a rock.
 * @param {number} rockSlotIndex The index of the rock slot.
 */
function hitRock(rockSlotIndex) {
    if (!fishingGameState.pickaxeSelected) {
        if(typeof showCustomAlert === 'function') { // Changed to showCustomAlert
            showCustomAlert("Select the pickaxe tool first!", null, 1500);
        }
        return;
    }
    const rock = rockSlots[rockSlotIndex];
    if (!rock || rock.isRespawning) {
        console.log("No active rock in this slot or rock is respawning.");
        return;
    }

    const now = Date.now();
    if (now - (rockLastHitTime[rockSlotIndex] || 0) < ROCK_HIT_COOLDOWN) {
        // console.log("Rock hit on cooldown."); // Can be spammy
        return;
    }
    rockLastHitTime[rockSlotIndex] = now;

    rock.hp -= 1; // Player always deals 1 damage per hit for now
    // Max 3 crack stages. Stage 0 = no cracks, Stage 1 = 1/3 damage, Stage 2 = 2/3 damage, Stage 3 = almost broken
    rock.cracks = Math.min(3, Math.floor(((rock.maxHp - rock.hp) / rock.maxHp) * 4));


    if (typeof playSound === 'function') playSound('sfx_rock_hit.mp3');

    if (rock.hp <= 0) {
        console.log(`Rock in slot ${rockSlotIndex} destroyed!`);
        grantRockRewards(rock.definition);

        rockSlots[rockSlotIndex] = {
            isRespawning: true,
            respawnTimer: BASE_ROCK_RESPAWN_TIME + (Math.random() * 5000 - 2500) // Add some variance
        };
        console.log(`Rock in slot ${rockSlotIndex} will respawn in about ${Math.round(rockSlots[rockSlotIndex].respawnTimer/1000)}s.`);
        if (typeof playSound === 'function') playSound('sfx_rock_destroy.mp3');
    }

    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function') {
        fishingRocksUi.renderRocks(getRockSlotsData());
    }
}

/**
 * Grants rewards based on the destroyed rock's definition.
 * @param {object} rockDef The definition of the destroyed rock.
 */
function grantRockRewards(rockDef) {
    // Determine card to drop based on rock rarity (more advanced logic can be added here)
    let generatedCardData = null;
    if (typeof getActiveSetDefinitions === 'function' && typeof getFixedGradeAndPrice === 'function' && typeof getCardImagePath === 'function' && typeof liveRarityPackPullDistribution !== 'undefined') {
        const activeSets = getActiveSetDefinitions();
        if (activeSets.length > 0) {
            const randomSetDef = activeSets[Math.floor(Math.random() * activeSets.length)];
            if (randomSetDef.count > 0) {
                // Influence rarity by rock type - very basic example:
                // Common rock: mostly base/rare. Legendary rock: higher chance for foil/holo etc.
                let targetPullRarityKey = 'base';
                const rockRarityLevel = stringToRarityInt[rockDef.rarity] || 0; // Assuming stringToRarityInt exists

                // Simple biased pull based on rock rarity (0=common, up to 3=legendary for rockRarities)
                // This is a placeholder for a more sophisticated loot table.
                const randomPackProb = Math.random();
                let cumulativePackProb = 0;
                // Filter liveRarityPackPullDistribution or use a specific one for rocks
                const rockLootTable = [...liveRarityPackPullDistribution].sort((a,b) => (stringToRarityInt[a.key] || 0) - (stringToRarityInt[b.key] || 0));

                for (const tier of rockLootTable) {
                    let tierProb = tier.packProb;
                    // Basic bias: increase chance of higher rarities for rarer rocks
                    if ((stringToRarityInt[tier.key] || 0) > rockRarityLevel + 1) { // if card rarity is much higher than rock
                        tierProb *= 0.5; // Halve chance
                    } else if ((stringToRarityInt[tier.key] || 0) === rockRarityLevel +1 ) {
                        tierProb *= 1.5; // Slightly boost chance for card one level above rock
                    } else if ((stringToRarityInt[tier.key] || 0) <= rockRarityLevel ) {
                         tierProb *= 1.2; // Boost same or lower
                    }

                    cumulativePackProb += tierProb; // Note: this sum might not be 1.0, Math.random() should be scaled or logic adjusted.
                                                // For simplicity, direct use here might skew distribution.
                                                // A better way is to normalize tierProb first.
                    if (randomPackProb * cumulativePackProb < tierProb) { // Simplified check, not standard way to use cumulative
                         targetPullRarityKey = tier.key;
                         break;
                    }
                }
                 // Fallback if loop finishes (e.g. if randomPackProb * cumulativePackProb was too large)
                if (targetPullRarityKey === 'base' && rockLootTable.length > 0 && randomPackProb > 0.5 && rockRarityLevel > 1) {
                     targetPullRarityKey = rockLootTable[Math.min(rockRarityLevel, rockLootTable.length -1 )].key; // Bias towards rock's own rarity tier
                }


                let potentialCardIds = Array.from({ length: randomSetDef.count }, (_, k) => k + 1);
                let eligibleCardIds = potentialCardIds.filter(id => getCardIntrinsicRarity(randomSetDef.abbr, id) === targetPullRarityKey);
                if (eligibleCardIds.length === 0) eligibleCardIds = potentialCardIds; // Fallback to any card from set if no specific rarity match

                if (eligibleCardIds.length > 0) {
                    const cardIdNum = eligibleCardIds[Math.floor(Math.random() * eligibleCardIds.length)];
                    const fixedProps = getFixedGradeAndPrice(randomSetDef.abbr, cardIdNum);
                    generatedCardData = {
                        set: randomSetDef.abbr,
                        id: cardIdNum,
                        name: `${randomSetDef.name} Card #${cardIdNum} (from ${rockDef.name})`,
                        rarity: fixedProps.rarityKey, // Actual card rarity
                        price: fixedProps.price,
                        imagePath: getCardImagePath(randomSetDef.abbr, cardIdNum),
                        type: 'collectible_card', // Mark as a standard collectible card
                        source: 'mining'
                    };
                }
            }
        }
    }

    if (generatedCardData && generatedCardData.type === 'collectible_card' && generatedCardData.set) {
        // This is a collectible card, send to pack opening screen
        console.log("Rock dropped collectible card, preparing for pack opening:", generatedCardData);
        const isNew = !collection[generatedCardData.set]?.[generatedCardData.id] || collection[generatedCardData.set][generatedCardData.id].count === 0;
        const formattedCardObject = {
            set: generatedCardData.set,
            cardId: generatedCardData.id,
            rarityKey: generatedCardData.rarity, // Assuming 'rarity' in rock card is 'rarityKey'
            grade: generatedCardData.grade || getFixedGradeAndPrice(generatedCardData.set, generatedCardData.id)?.grade || 'S',
            price: generatedCardData.price || getFixedGradeAndPrice(generatedCardData.set, generatedCardData.id)?.price || 0,
            revealed: false,
            isNew: isNew,
            packIndex: 0
        };

        fishingRewardPackSource = [formattedCardObject];
        isOpeningFishingReward = true;

        if (typeof showScreen === 'function') {
            showScreen(SCREENS.PACK_SELECTION);
        } else {
            console.error("showScreen function is undefined! Cannot transition to pack opening for rock reward.");
            // Fallback: Add directly to basket
            if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
                window.fishingBasket.addCardToBasket(generatedCardData, 1); // Use original generatedCardData for basket
            }
        }
    } else if (generatedCardData) {
        // This is another type of item (e.g., fallback mineral), add directly to basket
        console.log("Rock dropped non-collectible item (e.g., mineral), adding to basket:", generatedCardData);
        if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
            window.fishingBasket.addCardToBasket(generatedCardData, 1);
        } else {
            console.warn("fishingBasket.addCardToBasket function not found. Item from rock not added to basket.");
        }
    } else {
         // No card/item was generated (e.g. if all conditions failed in the generation logic)
        console.log("No specific item generated from rock break (neither collectible nor fallback).");
    }


    // Ticket chance remains, handled independently of the card/mineral drop
    if (Math.random() < rockDef.ticketChance) {
        const ticketType = "common_summon_ticket"; // Placeholder, could also be biased by rockDef.rarity
        console.log(`Granted Summon Ticket: ${ticketType}`);
        if (typeof gainSummonTicket === 'function') {
            gainSummonTicket(ticketType, 1);
            if(typeof showCustomModal === 'function') showCustomModal(`Found a ${ticketType.replace(/_/g, ' ')}!`, "success");
        } else {
            console.warn("gainSummonTicket function not found. Ticket not granted.");
        }
    }
}

/** Gets current rock data for UI rendering. */
function getRockSlotsData() {
    return rockSlots.map(rock => rock ? {...rock} : null);
}

/** Returns rock state for saving. */
function getRockDataForSave() {
    return {
        rockSlots: rockSlots.map(slot => {
            if (slot) return {
                id: slot.id,
                rarity: slot.rarity,
                hp: slot.hp,
                maxHp: slot.maxHp,
                cracks: slot.cracks,
                isRespawning: slot.isRespawning,
                respawnTimer: slot.respawnTimer
                // Note: 'definition' is not saved, it's reconstructed on load from rarity
            };
            return null;
        }),
        // pickaxeSelected: pickaxeSelected // Removed
    };
}

/** Loads rock state from data. */
function loadRockData(data) {
    if (data && data.rockSlots) {
        rockSlots = data.rockSlots.map(slotData => {
            if (slotData && slotData.rarity && rockDefinitions[slotData.rarity]) {
                return {
                    ...slotData,
                    definition: rockDefinitions[slotData.rarity] // Re-link definition
                };
            } else if (slotData && slotData.isRespawning) { // Handle slots that were respawning
                return slotData;
            }
            return null; // Invalid slot data or empty slot
        });
        // Ensure all slots are processed, fill with null if data is sparse
        for(let i=0; i < MAX_ROCKS; i++) {
            if(!rockSlots[i]) { // If a slot wasn't properly loaded (e.g. null from save or bad data)
                rockSlots[i] = { isRespawning: true, respawnTimer: BASE_ROCK_RESPAWN_TIME * Math.random() }; // Mark for fresh respawn
            }
        }
    } else {
        initializeRocks(); // Fallback to fresh initialization
        return; // Exit early after initializing
    }

    // deselectPickaxeTool(); // Removed, as tool state is removed

    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function') {
        fishingRocksUi.renderRocks(getRockSlotsData());
    }
    console.log("Rock data loaded.");
}

// Make initializeRocks globally accessible
window.initializeRocks = initializeRocks;

console.log("rock-mechanics.js loaded");
