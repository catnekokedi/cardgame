// js/idle-exhibition/ie-economic-balance.js
// This file centralizes all numeric and array/object-based configurations
// for the Idle Exhibition mini-game to allow easier economic balancing.

// --- Core Game Structure ---
const IE_INITIAL_SLOTS = 1;
const IE_MAX_SLOTS = 10;

// --- Costs ---
// Slot Unlocks: Costs for unlocking slots 2 through MAX_SLOTS. Slot 1 (index 0) is free.
const IE_SLOT_UNLOCK_COSTS = [
    0,       // Slot 1 (Initial)
    3000,    // Slot 2 (Was 5000)
    10000,   // Slot 3 (Was 15000)
    35000,   // Slot 4 (Was 50000)
    70000,   // Slot 5 (Was 100000)
    175000,  // Slot 6 (Was 250000)
    350000,  // Slot 7 (Was 500000)
    700000,  // Slot 8 (Was 1000000)
    1750000, // Slot 9 (Was 2500000)
    3500000  // Slot 10 (Was 5000000)
];

// Visual Upgrades for Slots: { name, cost, incomeBoost, securityBoost (optional) }
const IE_SLOT_VISUAL_UPGRADES = [
    { name: "Basic Display", cost: 0, incomeBoost: 1.0 },
    { name: "Velvet Cushion", cost: 7500, incomeBoost: 1.04 },      // Was 10k, 1.05
    { name: "Spotlight", cost: 35000, incomeBoost: 1.08 },         // Was 50k, 1.10
    { name: "Laser Grid", cost: 150000, incomeBoost: 1.12, securityBoost: 0.05 } // Was 200k, 1.15, sec boost 0.1
];

// Security System Upgrades: { name, cost, theftReduction }
const IE_SECURITY_SYSTEM_UPGRADES = [
    { name: "Basic Lock", cost: 18000, theftReduction: 0.08 },    // Was 25k, 0.1
    { name: "Alarm System", cost: 75000, theftReduction: 0.20 },  // Was 100k, 0.25
    { name: "Night Guard", cost: 375000, theftReduction: 0.40 }  // Was 500k, 0.5
];

// --- Maintenance Tool Upgrades ---
const IE_BROOM_UPGRADES = [
    // Level 0 is implicit (base cleaning amount in idleExhibition.cleanCardInSlot)
    { level: 0, cost: 0, cleanEffectiveness: 1.0 }, // Base effectiveness
    { level: 1, cost: 5000, cleanEffectiveness: 1.25 },  // 25% more effective
    { level: 2, cost: 12000, cleanEffectiveness: 1.50 },  // 50% more effective
    { level: 3, cost: 25000, cleanEffectiveness: 1.75 },
    { level: 4, cost: 50000, cleanEffectiveness: 2.00 },  // 100% more effective (double)
    { level: 5, cost: 100000, cleanEffectiveness: 2.50 } 
];

const IE_AUTO_CLEAN_UPGRADES = [
    // Level 0: Not unlocked
    { level: 0, cost: 0, unlocked: false },
    // Level 1: Unlock
    { level: 1, cost: 75000, unlocked: true, cleanAmountPerTick: 5, cleanFrequencyMinutes: 20 }, // Cleans 5% every 20 in-game minutes
    // Level 2: Improve
    { level: 2, cost: 150000, unlocked: true, cleanAmountPerTick: 8, cleanFrequencyMinutes: 15 },
    // Level 3: Further Improve
    { level: 3, cost: 300000, unlocked: true, cleanAmountPerTick: 12, cleanFrequencyMinutes: 10 }
];


// --- Income Calculation ---
const IE_INCOME_BASE_PER_MINUTE = 0.08; // Base income if no other factors, was 0.1
const IE_RARITY_INCOME_BONUS = { // Additive bonus based on rarity
    'base':  0.04,   // Was 0.05
    'rare':  0.12,   // Was 0.15
    'foil':  0.25,   // Was 0.3
    'holo':  0.60,   // Was 0.75
    'star':  1.20,   // Was 1.5
    'rainy': 2.50,   // Was 3.0
    'gold':  6.00,   // Was 7.5
    'shiny': 12.00   // Was 15.0
};
const IE_GRADE_INCOME_MULTIPLIER = { // Multiplier based on grade
    1: 0.4,  // Was 0.5
    2: 0.6,  // Was 0.7
    3: 0.9,  // Was 1.0
    4: 1.2,  // Was 1.3
    5: 1.5,  // Was 1.7
    6: 2.0,  // Was 2.2
    7: 3.0   // Was 3.5
};
const IE_PRICE_INCOME_FACTOR = 0.00004; // Factor of card's base price added to income, was 0.00005
const IE_SET_SIZE_INCOME_FACTOR = (setCardCount) => { // Multiplier based on the size of the card's set
    if (setCardCount > 200) return 1.25; // Was 1.3
    if (setCardCount > 100) return 1.12; // Was 1.15
    return 1.0;
};

// --- Time and Degradation ---
const IE_REAL_MINUTES_PER_GAME_DAY = 10; // How many real-world minutes constitute one in-game day
const IE_CLEANLINESS_DEGRADATION_RATE_PER_GAME_DAY = 10; // Percentage points cleanliness drops per game day
const IE_INCOME_REDUCTION_DIRTY_FACTOR = 0.5; // Max income reduction if cleanliness is 0% (e.g., 0.5 means 50% reduction)

// --- Security and Theft (Example values, can be tuned) ---
const IE_THEFT_CHANCE_PER_NIGHT_BASE = 0.01; // Base chance (1%) for a theft attempt IF conditions met
const IE_NIGHT_START_HOUR = 0;  // 00:00 (midnight)
const IE_NIGHT_END_HOUR = 6;    // up to 05:59 (6 AM)