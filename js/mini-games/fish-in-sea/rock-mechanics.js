// js/mini-games/fish-in-sea/rock-mechanics.js

const MAX_ROCKS = 3;
let rockSlots = new Array(MAX_ROCKS).fill(null);
let pickaxeSelected = false;

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
    pickaxeSelected = false;
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


/**
 * Called when the pickaxe icon is clicked. Sets state and cursor.
 */
function selectPickaxeTool() {
    pickaxeSelected = true;
    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.updatePickaxeCursor === 'function') {
        fishingRocksUi.updatePickaxeCursor(true);
    }
    // TODO: Deselect other tools (e.g., watering can if it had a selected state)
    console.log("Pickaxe selected.");
}

/**
 * Resets pickaxe selection and mouse cursor.
 */
function deselectPickaxeTool() {
    pickaxeSelected = false;
    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.updatePickaxeCursor === 'function') {
        fishingRocksUi.updatePickaxeCursor(false);
    }
    console.log("Pickaxe deselected.");
}

/**
 * Handles hitting a rock.
 * @param {number} rockSlotIndex The index of the rock slot.
 */
function hitRock(rockSlotIndex) {
    if (!pickaxeSelected) {
        if(typeof showCustomModal === 'function') showCustomModal("Select the pickaxe tool first!", "info");
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
    const cardData = {
        id: `mineral_${rockDef.name.toLowerCase().replace(/ /g, '_')}`, // More consistent ID if not unique stack
        set: 'fish_in_sea_mineral',
        name: `${rockDef.name} Fragment`,
        type: "mineral", // Could be a more general 'material' type
        rarity: rockDef.rarity, // This is rock rarity, map to card rarity if different (e.g. common rock -> common mineral)
        price: rockDef.hp * 2, // Example price based on HP
        imagePath: `gui/fishing_game/mineral_${rockDef.rarity}.png`, // e.g., mineral_common.png
        source: "mining"
    };
    console.log("Granted mineral card:", cardData);
    if (typeof addItemToBasket === 'function') {
        addItemToBasket(cardData, 1); // Pass cardData and quantity 1
    } else {
        console.warn("addItemToBasket function not found. Mineral card not added to basket.");
    }

    if (Math.random() < rockDef.ticketChance) {
        const ticketType = "common_summon_ticket"; // Placeholder, could be linked to rock rarity
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
        // pickaxeSelected: pickaxeSelected // Transient state, usually not saved
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

    deselectPickaxeTool(); // Ensure tools are reset on load

    if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.renderRocks === 'function') {
        fishingRocksUi.renderRocks(getRockSlotsData());
    }
    console.log("Rock data loaded.");
}

console.log("rock-mechanics.js loaded");
