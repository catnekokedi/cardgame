// js/data/summon-ticket-definitions.js

const summonTicketRarities = ['rare', 'foil', 'holo', 'star', 'rainy', 'gold', 'shiny'];

// SUMMON_OUTCOME_RATES defines the probability of getting each rarityKey when opening a pack/summon of a certain type.
// The keys of SUMMON_OUTCOME_RATES are the "summon type" or "pack theme" (e.g., 'rare' summon, 'shiny' pack from anvil).
// The values are objects where keys are the *output card rarities* and values are their probabilities.
// Probabilities for each summon type should sum to 1.0.
const SUMMON_OUTCOME_RATES = {
    'rare': {
        'rare': 0.60,
        'base': 0.40
    },
    'foil': {
        'foil': 0.50,
        'rare': 0.35,
        'base': 0.15
    },
    'holo': {
        'holo': 0.40,
        'foil': 0.30,
        'rare': 0.20,
        'base': 0.10
    },
    'star': {
        'star': 0.30,
        'holo': 0.30,
        'foil': 0.25,
        'rare': 0.15
    },
    'rainy': {
        'rainy': 0.25,
        'star': 0.30,
        'holo': 0.25,
        'foil': 0.20
    },
    'gold': {
        'gold': 0.20,
        'rainy': 0.30,
        'star': 0.30,
        'holo': 0.20
    },
    'shiny': { // For "Shiny" themed packs/summons (e.g., Anvil 5-gold forge, or a Shiny summon ticket)
        'shiny': 0.05,  // 5% chance of actual Shiny card
        'gold':  0.30,  // 30% chance of Gold
        'rainy': 0.45,  // 45% chance of Rainy (Adjusted from 0.45)
        'star':  0.20   // 20% chance of Star (Adjusted from 0.25)
        // Probabilities should sum to 1.0. Example: 0.05 + 0.20 + 0.70 + 0.05 = 1.0
    }
};

const summonTicketDefinitions = {
    "rare_ticket": {
        "id": "rare_ticket",
        "name": "Rare Summon Ticket",
        "rarityKey": "rare",
        "description": "A ticket that summons a Rare item or better."
    },
    "foil_ticket": {
        "id": "foil_ticket",
        "name": "Foil Summon Ticket",
        "rarityKey": "foil",
        "description": "A ticket that summons a Foil item or better."
    },
    "holo_ticket": {
        "id": "holo_ticket",
        "name": "Holo Summon Ticket",
        "rarityKey": "holo",
        "description": "A ticket that summons a Holo item or better."
    },
    "star_ticket": {
        "id": "star_ticket",
        "name": "Star Summon Ticket",
        "rarityKey": "star",
        "description": "A ticket that summons a Star item or better."
    },
    "rainy_ticket": {
        "id": "rainy_ticket",
        "name": "Rainy Summon Ticket",
        "rarityKey": "rainy",
        "description": "A ticket that summons a Rainy item or better."
    },
    "gold_ticket": {
        "id": "gold_ticket",
        "name": "Gold Summon Ticket",
        "rarityKey": "gold",
        "description": "A ticket that summons a Gold item or better."
    },
    "shiny_ticket": {
        "id": "shiny_ticket",
        "name": "Shiny Summon Ticket",
        "rarityKey": "shiny",
        "description": "A ticket that summons a Shiny item or better, with a higher chance for top rarities."
    }
};

// Make it globally accessible if not using modules
if (typeof window !== 'undefined') {
    window.summonTicketDefinitions = summonTicketDefinitions;
}

// Ensure all defined summonTicketRarities have an entry in SUMMON_OUTCOME_RATES
// and that probabilities sum to 1.0 for each.
(function validateSummonOutcomeRates() {
    if (typeof SUMMON_OUTCOME_RATES === 'undefined' || typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined') return;

    summonTicketRarities.forEach(summonType => {
        if (!SUMMON_OUTCOME_RATES[summonType]) {
            console.warn(`SUMMON_OUTCOME_RATES is missing an entry for summon type: '${summonType}'. Defaulting to 100% base.`);
            const baseKey = RARITY_PACK_PULL_DISTRIBUTION[0]?.key || 'base';
            SUMMON_OUTCOME_RATES[summonType] = { [baseKey]: 1.0 };
        } else {
            let sum = 0;
            let hasOwnProperties = false;
            for (const outputRarity in SUMMON_OUTCOME_RATES[summonType]) {
                if (SUMMON_OUTCOME_RATES[summonType].hasOwnProperty(outputRarity)) {
                    hasOwnProperties = true;
                    sum += SUMMON_OUTCOME_RATES[summonType][outputRarity];
                }
            }
            // Normalize if sum is not 1.0 and there are properties to normalize
            if (hasOwnProperties && Math.abs(sum - 1.0) > 0.001) {
                console.warn(`Probabilities for summon type '${summonType}' in SUMMON_OUTCOME_RATES do not sum to 1.0. Current sum: ${sum}. Normalizing...`);
                let currentTotalProb = 0;
                const keys = Object.keys(SUMMON_OUTCOME_RATES[summonType]);
                keys.forEach(key => currentTotalProb += SUMMON_OUTCOME_RATES[summonType][key]);

                if (currentTotalProb > 0) {
                    const scaleFactor = 1.0 / currentTotalProb;
                    let cumulativeNormalizedProb = 0;
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        let newProb = parseFloat((SUMMON_OUTCOME_RATES[summonType][key] * scaleFactor).toPrecision(5));
                        if (i === keys.length - 1) {
                            newProb = parseFloat((1.0 - cumulativeNormalizedProb).toPrecision(5));
                        }
                        SUMMON_OUTCOME_RATES[summonType][key] = parseFloat(newProb);
                         if(SUMMON_OUTCOME_RATES[summonType][key] < 0) SUMMON_OUTCOME_RATES[summonType][key] = 0; // Ensure no negative
                        cumulativeNormalizedProb += SUMMON_OUTCOME_RATES[summonType][key];
                    }
                } else if (keys.length > 0) { // If sum is 0 but keys exist, distribute equally
                    const equalShare = parseFloat((1.0 / keys.length).toPrecision(5));
                    let tempSum = 0;
                    for(let i=0; i < keys.length -1; i++) {
                        SUMMON_OUTCOME_RATES[summonType][keys[i]] = equalShare;
                        tempSum += equalShare;
                    }
                    SUMMON_OUTCOME_RATES[summonType][keys[keys.length-1]] = parseFloat((1.0 - tempSum).toPrecision(5));
                }

                 // Final check after normalization
                let finalSumCheck = 0;
                Object.values(SUMMON_OUTCOME_RATES[summonType]).forEach(prob => finalSumCheck += prob);
                if (Math.abs(finalSumCheck - 1.0) > 0.001 && keys.length > 0) {
                    console.error(`Normalization failed for ${summonType}. Sum is ${finalSumCheck}`);
                    // Last resort correction if still not 1.0
                    const diff = 1.0 - finalSumCheck;
                    SUMMON_OUTCOME_RATES[summonType][keys[0]] = parseFloat((SUMMON_OUTCOME_RATES[summonType][keys[0]] + diff).toPrecision(5));
                     if(SUMMON_OUTCOME_RATES[summonType][keys[0]] < 0) SUMMON_OUTCOME_RATES[summonType][keys[0]] = 0;
                }
            }
        }
    });
})();
