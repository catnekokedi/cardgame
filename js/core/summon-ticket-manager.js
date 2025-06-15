// js/core/summon-ticket-manager.js
// summonTicketRarities is defined in js/data/summon-ticket-definitions.js
// summonTickets (state) is in js/core/state.js

function initializeSummonTickets() {
    // Ensure summonTickets is an object. If it was loaded from localStorage, preserve it.
    // If it's undefined (e.g., first ever load and state.js hasn't run, or it's truly not set), initialize to {}.
    if (typeof summonTickets === 'undefined' || summonTickets === null) {
        summonTickets = {};
        console.log("initializeSummonTickets: summonTickets was undefined, initialized to {}.");
    }

    if (typeof summonTicketRarities !== 'undefined' && Array.isArray(summonTicketRarities)) {
        summonTicketRarities.forEach(rarityKey => {
            if (!summonTickets.hasOwnProperty(rarityKey)) { // Only initialize if not already present
                summonTickets[rarityKey] = 0;
            }
        });
        // console.log("initializeSummonTickets: Ensured all defined rarities exist in summonTickets.", summonTickets);
    } else {
        console.error("initializeSummonTickets: summonTicketRarities (from data) is not defined or not an array. Cannot ensure all ticket types are initialized. Current tickets:", summonTickets);
    }
}

function getSummonTicketBalance(rarityKey) {
    if (typeof summonTickets === 'undefined') {
        // Fallback initialization if accessed before explicitly initialized
        console.warn("getSummonTicketBalance: summonTickets was undefined. Attempting to initialize.");
        initializeSummonTickets();
    }
    return summonTickets[rarityKey] || 0;
}

function updateSummonTicketBalance(rarityKey, amount) {
    if (typeof summonTickets === 'undefined') {
        // Fallback initialization
        console.warn("updateSummonTicketBalance: summonTickets was undefined. Attempting to initialize.");
        initializeSummonTickets();
    }

    // Robustness for add/update if rarityKey is valid but not in summonTickets yet
    if (!summonTickets.hasOwnProperty(rarityKey)) {
        if (typeof summonTicketRarities !== 'undefined' && Array.isArray(summonTicketRarities) && summonTicketRarities.includes(rarityKey)) {
            summonTickets[rarityKey] = 0;
            console.log(`Initialized summonTickets[${rarityKey}] on-the-fly in updateSummonTicketBalance.`);
        } else {
            console.warn(`Attempted to update balance for unknown or uninitialized summon ticket rarity: ${rarityKey}`);
            return false; // Exit if rarityKey is truly unknown
        }
    }

    if (summonTickets[rarityKey] + amount < 0) {
        console.warn(`Cannot reduce ${rarityKey} tickets below zero.`);
        return false;
    }
    summonTickets[rarityKey] += amount;
    if (typeof saveGame === 'function') saveGame();
    return true;
}

function addSummonTickets(rarityKey, amount) {
    if (typeof summonTickets === 'undefined') {
        // Fallback initialization
        console.warn("addSummonTickets: summonTickets was undefined. Attempting to initialize.");
        initializeSummonTickets(); // Ensures summonTickets is an object
    }

    // New robustness addition:
    // If the specific rarityKey is not yet a property of summonTickets (e.g. due to initial load issues or new rarity)
    // but it's a valid rarity defined in the master list, initialize it.
    if (!summonTickets.hasOwnProperty(rarityKey)) {
        if (typeof summonTicketRarities !== 'undefined' && Array.isArray(summonTicketRarities) && summonTicketRarities.includes(rarityKey)) {
            summonTickets[rarityKey] = 0; // Initialize this specific rarity
            console.log(`Initialized summonTickets[${rarityKey}] on-the-fly in addSummonTickets.`);
        } else {
            // If rarityKey is not in the master list either, then it's truly unknown or uninitialized.
            console.warn(`Attempted to add tickets for unknown or uninitialized summon ticket rarity: ${rarityKey}`);
            return; // Exit if rarityKey is not valid
        }
    }

    // Proceed to add amount if valid and positive
    if (amount > 0) {
        summonTickets[rarityKey] += amount;
        if (typeof saveGame === 'function') saveGame();
    } else if (amount < 0) {
        // While this function is 'add', prevent accidental negative usage here.
        // updateSummonTicketBalance should be used for decrementing with safety checks.
        console.warn(`addSummonTickets called with negative amount for ${rarityKey}. Use updateSummonTicketBalance for subtraction.`);
    }
}

function getSummonTicketImagePath(rarityKey) {
    if (!rarityKey) {
        console.warn("getSummonTicketImagePath: rarityKey is undefined or null. Returning placeholder.");
        return 'gui/items/placeholder_icon.png'; // Or a specific placeholder for tickets
    }
    // Assuming a naming convention for ticket images: gui/items/summon_ticket_RAREKEY.png
    // Example: gui/items/summon_ticket_rare.png, gui/items/summon_ticket_foil.png
    return `gui/items/summon_ticket_${rarityKey.toLowerCase()}.png`;
}

// Expose functions to global scope if they are intended to be used by other modules directly
window.addSummonTickets = addSummonTickets;
window.initializeSummonTickets = initializeSummonTickets;
window.getSummonTicketBalance = getSummonTicketBalance;
window.updateSummonTicketBalance = updateSummonTicketBalance;
window.getSummonTicketImagePath = getSummonTicketImagePath;

console.log("summon-ticket-manager.js loaded with robust add/update functions.");
