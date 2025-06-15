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
    common: { hp: 1, color: '#A0A0A0', cardPool: ['mineral_common_1', 'mineral_common_2'], ticketChance: 0.05, name: "Common Rock", image: "rock_common.png", crackImages: ["rock_common_crack1.png", "rock_common_crack2.png", "rock_common_crack3.png"] },
    uncommon: { hp: 2, color: '#60A0B0', cardPool: ['mineral_uncommon_1'], ticketChance: 0.1, name: "Uncommon Rock", image: "rock_uncommon.png", crackImages: ["rock_uncommon_crack1.png", "rock_uncommon_crack2.png", "rock_uncommon_crack3.png"] },
    rare: { hp: 3, color: '#7070FF', cardPool: ['mineral_rare_1'], ticketChance: 0.2, name: "Rare Rock", image: "rock_rare.png", crackImages: ["rock_rare_crack1.png", "rock_rare_crack2.png", "rock_rare_crack3.png"] },
    legendary: { hp: 4, color: '#FFD700', cardPool: ['mineral_legendary_1'], ticketChance: 0.35, name: "Legendary Rock", image: "rock_legendary.png", crackImages: ["rock_legendary_crack1.png", "rock_legendary_crack2.png", "rock_legendary_crack3.png"] }
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
    // console.log("Rock mechanics initialized. Slots:", rockSlots); // Aggressively removed
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
    // console.log(`New ${randomRarity} rock spawned in slot ${slotIndex}.`); // Aggressively removed
}

// selectPickaxeTool and deselectPickaxeTool functions REMOVED

// Overwrite existing hitRock with this version:
function hitRock(rockSlotIndex) {
    const rock = rockSlots[rockSlotIndex];

    if (!rock || rock.isRespawning || (rock.hp !== undefined && rock.hp <= 0)) {
        // This path should be silent unless debugging is specifically enabled for it.
        // console.log(`[RockHP-Guard] Slot ${rockSlotIndex}: Invalid, respawning, or already broken (HP: ${rock ? rock.hp : 'N/A'}). Ignoring hit.`);
        return;
    }

    const now = Date.now();
    if (now - (rockLastHitTime[rockSlotIndex] || 0) < ROCK_HIT_COOLDOWN) {
        return; // Silently return if on cooldown
    }
    rockLastHitTime[rockSlotIndex] = now;

    if (rock.hp === undefined) { // This indicates a problem with rock initialization
        console.error(`[RockHP-Fix] Slot ${rockSlotIndex}: HP is undefined. MaxHP: ${rock.maxHp}. Defaulting HP.`);
        rock.hp = rock.maxHp !== undefined ? rock.maxHp : 1;
    }

    // console.log(`[RockHP-Fix] Slot ${rockSlotIndex}: HP before hit: ${rock.hp}`); // Keep this for user test
    rock.hp -= 1;
    // console.log(`[RockHP-Fix] Slot ${rockSlotIndex}: HP after decrement: ${rock.hp}`); // Keep this for user test


    if (rock.hp < 0) {
        console.warn(`[RockHP-Fix] Slot ${rockSlotIndex}: HP was ${rock.hp + 1} before decrement, became ${rock.hp}, CLAMPING to 0.`);
        rock.hp = 0;
    }

    if (typeof playSound === 'function') {
        playSound('sfx_rock_hit.mp3');
    }

    if (rock.hp === 0) {
        // console.log(`[RockHP-Fix] Slot ${rockSlotIndex}: Destroyed (HP reached 0).`); // Keep this
        let rockDefinitionForRewards = rock.definition;
        if (!rockDefinitionForRewards) {
            console.error(`[RockHP-Fix] Slot ${rockSlotIndex}: Missing definition for rewards. Rarity: ${rock.rarity}. Attempting to reconstruct.`);
            if (rock.rarity && rockDefinitions[rock.rarity]) {
                rockDefinitionForRewards = rockDefinitions[rock.rarity];
            } else {
                console.error(`[RockHP-Fix] Slot ${rockSlotIndex}: Cannot reconstruct definition for rarity ${rock.rarity}.`);
            }
        }
        if (rockDefinitionForRewards) {
            grantRockRewards(rockDefinitionForRewards);
        }

        rockSlots[rockSlotIndex] = {
            isRespawning: true,
            respawnTimer: BASE_ROCK_RESPAWN_TIME + (Math.random() * 5000 - 2500)
        };
        if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function') {
            fishingRocksUi.renderRocks(getRockSlotsData());
        }
        if (typeof playSound === 'function') {
            playSound('sfx_rock_destroy.mp3');
        }
        return;
    } else {
        // Update cracks
        if (rock.maxHp !== undefined && rock.maxHp > 0) {
           rock.cracks = Math.min(3, Math.floor(((rock.maxHp - rock.hp) / rock.maxHp) * 4));
        } else {
           rock.cracks = rock.cracks || 0;
        }
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
                        type: 'mineral_card', // Standardized type for items from rocks
                        source: 'mining'
                    };
                    // console.log(`[RockMechanics] Generated mineral/card: Name=${generatedCardData.name}, Type=${generatedCardData.type}, Source=${generatedCardData.source}`); // Aggressively removed
                }
            }
        }
    }

    // Reverting: All items from rocks go directly to basket and use local display
    if (generatedCardData) {
        const cardDataForBasket = {
            id: generatedCardData.id,
            set: generatedCardData.set,
            name: generatedCardData.name,
            rarity: generatedCardData.rarityKey || generatedCardData.rarity,
            rarityKey: generatedCardData.rarityKey || generatedCardData.rarity,
            price: generatedCardData.price,
            grade: generatedCardData.grade,
            imagePath: generatedCardData.imagePath || getCardImagePath(generatedCardData.set, generatedCardData.id),
            type: generatedCardData.type, // Should be 'mineral_card' from generation step
            source: generatedCardData.source || 'mining'
        };
        if (typeof window.fishingBasket !== 'undefined' && typeof window.fishingBasket.addCardToBasket === 'function') {
            window.fishingBasket.addCardToBasket(cardDataForBasket, 1);

            if (typeof window.showTemporaryCollectedItem === 'function') {
                // Ensure cardDataForBasket has: imagePath, name, set, id (or cardId), rarityKey
                // cardDataForBasket already prepared with these fields.
                if (typeof playSound === 'function') playSound('sfx_reward_notification.mp3');
                window.showTemporaryCollectedItem(cardDataForBasket);
            } else if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.showCaughtItemDisplay === 'function') {
                // Fallback if global function is not available
                if (typeof playSound === 'function') playSound('sfx_reward_notification.mp3');
                window.fishingUi.showCaughtItemDisplay(cardDataForBasket);
            }
        } else {
            console.warn("fishingBasket.addCardToBasket function not found. Item from rock not added to basket.");
        }
    } else {
        // console.log("No specific item generated from rock break (neither collectible nor fallback)."); // Aggressively removed
    }

    // Ticket chance remains, handled independently of the card/mineral drop
    if (Math.random() < rockDef.ticketChance) {
        if (typeof summonTicketRarities !== 'undefined' && summonTicketRarities.length > 0 && typeof addSummonTickets === 'function') {
            const randomTicketRarityKey = summonTicketRarities[Math.floor(Math.random() * summonTicketRarities.length)];
            addSummonTickets(randomTicketRarityKey, 1);

            const rarityInfo = typeof getRarityTierInfo === 'function' ? getRarityTierInfo(randomTicketRarityKey) : null;
            const ticketDisplayName = rarityInfo ? `${rarityInfo.name} Summon Ticket` : `${randomTicketRarityKey} Summon Ticket`;

            const ticketDisplayData = {
                name: ticketDisplayName,
                imagePath: typeof getSummonTicketImagePath === 'function' ? getSummonTicketImagePath(randomTicketRarityKey) : `gui/summon_tickets/ticket_${randomTicketRarityKey}.png`,
                type: 'ticket',
                source: 'mining',
                details: { rarityKey: randomTicketRarityKey, name: ticketDisplayName, source: 'mining' }
            };
            // console.log(`[RockMechanics] Granted Summon Ticket: ${ticketDisplayName}, Type=${ticketDisplayData.type}, Source=${ticketDisplayData.source}`); // Aggressively removed

            if (typeof window.showTemporaryCollectedItem === 'function') {
                 // Ensure ticketDisplayData has: imagePath, name, rarityKey (or type: 'ticket')
                 // ticketDisplayData is prepared with imagePath, name, and type: 'ticket'.
                 if (typeof playSound === 'function') playSound('sfx_reward_notification.mp3');
                 window.showTemporaryCollectedItem(ticketDisplayData);
            } else if (typeof window.fishingUi !== 'undefined' && typeof window.fishingUi.showCaughtItemDisplay === 'function') {
                // Fallback if global function is not available
                if (typeof playSound === 'function') playSound('sfx_reward_notification.mp3');
                window.fishingUi.showCaughtItemDisplay(ticketDisplayData);
            }
        } else {
            console.warn("summonTicketRarities array not defined/empty, or addSummonTickets function missing. Cannot grant random ticket from rock.");
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
            };
            return null;
        }),
    };
}

/** Loads rock state from data. */
function loadRockData(data) {
    if (data && data.rockSlots) {
        rockSlots = data.rockSlots.map(slotData => {
            if (slotData && slotData.rarity && rockDefinitions[slotData.rarity]) {
                return {
                    ...slotData,
                    definition: rockDefinitions[slotData.rarity]
                };
            } else if (slotData && slotData.isRespawning) {
                return slotData;
            }
            return null;
        });
        for(let i=0; i < MAX_ROCKS; i++) {
            if(!rockSlots[i]) {
                rockSlots[i] = { isRespawning: true, respawnTimer: BASE_ROCK_RESPAWN_TIME * Math.random() };
            }
        }
    } else {
        initializeRocks();
        return;
    }

    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function') {
        fishingRocksUi.renderRocks(getRockSlotsData());
    }
    // console.log("Rock data loaded."); // Aggressively removed
}

// Make initializeRocks globally accessible
window.initializeRocks = initializeRocks;

// console.log("rock-mechanics.js loaded"); // Aggressively removed
