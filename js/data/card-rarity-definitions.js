
// js/data/card-rarity-definitions.js

// SINGLE SOURCE OF TRUTH FOR RARITY TIERS, PACK ODDS, AND BASE PRICES
const RARITY_PACK_PULL_DISTRIBUTION = [
    { key: 'base',   name: 'Base',   packProb: 0.9695625, basePrice: [1, 250],       level: 0, color: 'var(--base-color)' },
    { key: 'rare',   name: 'Rare',   packProb: 0.01875,   basePrice: [25, 750],      level: 1, color: 'var(--rare-color)' },
    { key: 'foil',   name: 'Foil',   packProb: 0.00625,   basePrice: [100, 2000],    level: 2, color: 'var(--foil-color)' },
    { key: 'holo',   name: 'Holo',   packProb: 0.003125,  basePrice: [250, 5000],    level: 3, color: 'var(--holo-color)' },
    { key: 'star',   name: 'Star',   packProb: 0.00125,   basePrice: [500, 10000],   level: 4, color: 'var(--star-color)' },
    { key: 'rainy',  name: 'Rainy',  packProb: 0.000625,  basePrice: [1000, 25000],  level: 5, color: 'var(--rainy-color-1)' },
    { key: 'gold',   name: 'Gold',   packProb: 0.0003125, basePrice: [2500, 50000],  level: 6, color: 'var(--gold-color)' },
    { key: 'shiny',  name: 'Shiny',  packProb: 0.000125,  basePrice: [10000, 1000000],level: 7, color: 'var(--shiny-color)' }
];

// NEW: Distribution for determining how many cards of each rarity exist within a set.
// Percentages should sum to 1.0 (or 100%).
const RARITY_SET_COMPOSITION_DISTRIBUTION = [
    { key: 'base',  percentage: 0.595 }, // 59.5%
    { key: 'rare',  percentage: 0.125 }, // 12.5%
    { key: 'foil',  percentage: 0.100 }, // 10.0%
    { key: 'holo',  percentage: 0.075 }, // 7.5%
    { key: 'star',  percentage: 0.050 }, // 5.0%
    { key: 'rainy', percentage: 0.025 }, // 2.5%
    { key: 'gold',  percentage: 0.020 }, // 2.0%
    { key: 'shiny', percentage: 0.010 }  // 1.0%
];


// Normalization function previously in setcardrarity.js, now here to ensure data integrity.
// This should be called once after this data is defined, or if this data can be modified at runtime (which it isn't currently).
// For safety, it's included here. js/core/rarity-grade-manager.js will use this normalized data.
(function normalizeRarityData() {
    if (typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined' || !Array.isArray(RARITY_PACK_PULL_DISTRIBUTION) || RARITY_PACK_PULL_DISTRIBUTION.length === 0) return;

    const targetSum = 1.0;
    let currentTotalProb = RARITY_PACK_PULL_DISTRIBUTION.reduce((sum, item) => sum + parseFloat(item.packProb || 0), 0);
    const epsilon = 0.00001; // A small tolerance for floating point inaccuracies

    if (Math.abs(currentTotalProb - targetSum) > epsilon && currentTotalProb > 0) {
        const scaleFactor = targetSum / currentTotalProb;
        let cumulativeNormalizedProb = 0;
        for (let i = 0; i < RARITY_PACK_PULL_DISTRIBUTION.length; i++) {
            let newProb = parseFloat((RARITY_PACK_PULL_DISTRIBUTION[i].packProb * scaleFactor).toPrecision(7)); // Use toPrecision for consistent significant figures
            if (i === RARITY_PACK_PULL_DISTRIBUTION.length - 1) {
                // Assign the remainder to the last element to ensure the sum is exactly targetSum
                newProb = parseFloat((targetSum - cumulativeNormalizedProb).toPrecision(7));
            }
            RARITY_PACK_PULL_DISTRIBUTION[i].packProb = parseFloat(newProb); // Convert back to float after precision adjustment
            cumulativeNormalizedProb += RARITY_PACK_PULL_DISTRIBUTION[i].packProb;
        }
    } else if (currentTotalProb === 0 && RARITY_PACK_PULL_DISTRIBUTION.length > 0) {
        const equalShare = parseFloat((targetSum / RARITY_PACK_PULL_DISTRIBUTION.length).toPrecision(7));
        let sum = 0;
        for(let i=0; i < RARITY_PACK_PULL_DISTRIBUTION.length -1; i++) {
            RARITY_PACK_PULL_DISTRIBUTION[i].packProb = equalShare;
            sum += equalShare;
        }
        RARITY_PACK_PULL_DISTRIBUTION[RARITY_PACK_PULL_DISTRIBUTION.length-1].packProb = parseFloat((targetSum - sum).toPrecision(7));
    }

    // Ensure no negative probabilities due to floating point math
    RARITY_PACK_PULL_DISTRIBUTION.forEach(item => {
        if (item.packProb < 0) item.packProb = 0;
    });

    // Final check and adjustment if sum is still slightly off
    let finalSumCheck = RARITY_PACK_PULL_DISTRIBUTION.reduce((sum, item) => sum + item.packProb, 0);
    if (Math.abs(finalSumCheck - targetSum) > epsilon && finalSumCheck > 0 && RARITY_PACK_PULL_DISTRIBUTION.length > 0) {
        const diff = targetSum - finalSumCheck;
        // Attempt to adjust the largest probability tier to minimize relative impact
        let tierToAdjust = RARITY_PACK_PULL_DISTRIBUTION.reduce((prev, current) => (prev.packProb > current.packProb) ? prev : current);
        
        if (tierToAdjust) {
            tierToAdjust.packProb = parseFloat((tierToAdjust.packProb + diff).toPrecision(7));
            if(tierToAdjust.packProb < 0) tierToAdjust.packProb = 0; // Safety check
        }
    }
})();
