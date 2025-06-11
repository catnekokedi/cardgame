
// js/idle-exhibition/ie-config.js

// This file now assumes constants like IE_SLOT_UNLOCK_COSTS, etc.,
// are globally available from ie-economic-balance.js (loaded before this script).

const idleExhibitionConfig = {
    INITIAL_SLOTS: typeof IE_INITIAL_SLOTS !== 'undefined' ? IE_INITIAL_SLOTS : 1,
    MAX_SLOTS: typeof IE_MAX_SLOTS !== 'undefined' ? IE_MAX_SLOTS : 10,
    SLOT_UNLOCK_COSTS: typeof IE_SLOT_UNLOCK_COSTS !== 'undefined' ? IE_SLOT_UNLOCK_COSTS : [0, 5000, 15000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000], // Default fallback

    // Income Calculation Factors
    INCOME_BASE_PER_MINUTE: typeof IE_INCOME_BASE_PER_MINUTE !== 'undefined' ? IE_INCOME_BASE_PER_MINUTE : 0.1,
    RARITY_INCOME_BONUS: typeof IE_RARITY_INCOME_BONUS !== 'undefined' ? IE_RARITY_INCOME_BONUS : {
        'base': 0.05, 'rare': 0.15, 'foil': 0.3, 'holo': 0.75,
        'star': 1.5, 'rainy': 3.0, 'gold': 7.5, 'shiny': 15.0
    }, // Default fallback
    GRADE_INCOME_MULTIPLIER: typeof IE_GRADE_INCOME_MULTIPLIER !== 'undefined' ? IE_GRADE_INCOME_MULTIPLIER : {
        1: 0.5, 2: 0.7, 3: 1.0, 4: 1.3, 5: 1.7, 6: 2.2, 7: 3.5
    }, // Default fallback
    PRICE_INCOME_FACTOR: typeof IE_PRICE_INCOME_FACTOR !== 'undefined' ? IE_PRICE_INCOME_FACTOR : 0.00005,
    SET_SIZE_INCOME_FACTOR: typeof IE_SET_SIZE_INCOME_FACTOR !== 'undefined' ? IE_SET_SIZE_INCOME_FACTOR : (setCardCount) => {
        if (setCardCount > 200) return 1.3;
        if (setCardCount > 100) return 1.15;
        return 1.0;
    }, // Default fallback

    REAL_MINUTES_PER_GAME_DAY: typeof IE_REAL_MINUTES_PER_GAME_DAY !== 'undefined' ? IE_REAL_MINUTES_PER_GAME_DAY : 10,
    CLEANLINESS_DEGRADATION_RATE_PER_GAME_DAY: typeof IE_CLEANLINESS_DEGRADATION_RATE_PER_GAME_DAY !== 'undefined' ? IE_CLEANLINESS_DEGRADATION_RATE_PER_GAME_DAY : 10,
    INCOME_REDUCTION_DIRTY_FACTOR: typeof IE_INCOME_REDUCTION_DIRTY_FACTOR !== 'undefined' ? IE_INCOME_REDUCTION_DIRTY_FACTOR : 0.5,

    THEFT_CHANCE_PER_NIGHT_BASE: typeof IE_THEFT_CHANCE_PER_NIGHT_BASE !== 'undefined' ? IE_THEFT_CHANCE_PER_NIGHT_BASE : 0.01,
    NIGHT_START_HOUR: typeof IE_NIGHT_START_HOUR !== 'undefined' ? IE_NIGHT_START_HOUR : 0,
    NIGHT_END_HOUR: typeof IE_NIGHT_END_HOUR !== 'undefined' ? IE_NIGHT_END_HOUR : 6,

    SLOT_VISUAL_UPGRADES: typeof IE_SLOT_VISUAL_UPGRADES !== 'undefined' ? IE_SLOT_VISUAL_UPGRADES : [
        { name: "Basic Display", cost: 0, incomeBoost: 1.0 },
        { name: "Velvet Cushion", cost: 10000, incomeBoost: 1.05 },
        { name: "Spotlight", cost: 50000, incomeBoost: 1.10 },
        { name: "Laser Grid", cost: 200000, incomeBoost: 1.15, securityBoost: 0.1 }
    ], // Default fallback
    SECURITY_SYSTEM_UPGRADES: typeof IE_SECURITY_SYSTEM_UPGRADES !== 'undefined' ? IE_SECURITY_SYSTEM_UPGRADES : [
        { name: "Basic Lock", cost: 25000, theftReduction: 0.1 },
        { name: "Alarm System", cost: 100000, theftReduction: 0.25 },
        { name: "Night Guard", cost: 500000, theftReduction: 0.5 }
    ], // Default fallback
    IE_BROOM_UPGRADES: typeof IE_BROOM_UPGRADES !== 'undefined' ? IE_BROOM_UPGRADES : [], // Added
    IE_AUTO_CLEAN_UPGRADES: typeof IE_AUTO_CLEAN_UPGRADES !== 'undefined' ? IE_AUTO_CLEAN_UPGRADES : [] // Added
};
