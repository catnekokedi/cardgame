
// js/core/summon-ticket-manager.js
// summonTicketRarities is defined in js/data/summon-ticket-definitions.js
// summonTickets (state) is in js/core/state.js

function initializeSummonTickets() {
    summonTickets = {}; // Ensure it's reset from state.js
    if (typeof summonTicketRarities !== 'undefined') {
        summonTicketRarities.forEach(rarityKey => {
            summonTickets[rarityKey] = 0;
        });
    } else {
        console.error("initializeSummonTickets: summonTicketRarities (from data) is not defined.");
    }
}

function getSummonTicketBalance(rarityKey) {
    if (typeof summonTickets === 'undefined') {
        console.error("Summon tickets state not initialized.");
        return 0;
    }
    return summonTickets[rarityKey] || 0;
}

function updateSummonTicketBalance(rarityKey, amount) {
    if (typeof summonTickets === 'undefined') {
        console.error("Summon tickets state not initialized. Cannot update balance for", rarityKey);
        return false;
    }
    if (!summonTickets.hasOwnProperty(rarityKey)) {
        console.warn(`Attempted to update balance for unknown summon ticket rarity: ${rarityKey}`);
        return false;
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
        initializeSummonTickets();
    }
     if (!summonTickets.hasOwnProperty(rarityKey)) {
        console.warn(`Attempted to add tickets for unknown summon ticket rarity: ${rarityKey}`);
        return;
    }
    if (amount > 0) {
        summonTickets[rarityKey] += amount;
        if (typeof saveGame === 'function') saveGame();
    }
}
