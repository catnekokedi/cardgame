
// js/core/time-rewards.js

const TICKET_REWARD_INTERVALS_MS = {
    // RarityKey: milliseconds
    'rare':  10 * 60 * 1000,      // Every 10 minutes
    'foil':  30 * 60 * 1000,      // Every 30 minutes 
    'holo':  60 * 60 * 1000,      // Every 1 hour
    'star':  5 * 60 * 60 * 1000,  // Every 5 hours
    'rainy': 10 * 60 * 60 * 1000, // Every 10 hours
    'gold':  25 * 60 * 60 * 1000, // Every 25 hours
    'shiny': 50 * 60 * 60 * 1000  // Every 50 hours
};

// lastTicketRewardTimes (state from js/core/state.js) now stores accumulated active playtime in ms
// e.g., { 'rare': 120000 (meaning last rare ticket was at 120s of active play) }

function checkTimeBasedRewards() {
    if (typeof accumulatedActiveTimeMs === 'undefined' || typeof sessionStartTime === 'undefined' ||
        typeof isGameActive === 'undefined' || typeof summonTicketRarities === 'undefined' ||
        typeof lastTicketRewardTimes === 'undefined' || typeof addSummonTickets !== 'function' ||
        typeof showCustomAlert !== 'function' || typeof getRarityTierInfo !== 'function') {
        console.warn("checkTimeBasedRewards: Core dependencies not available. Skipping reward check.");
        return;
    }

    let currentTotalActiveTimeMs = accumulatedActiveTimeMs;
    if (isGameActive) {
        currentTotalActiveTimeMs += (Date.now() - sessionStartTime);
    }

    let rewardsGrantedThisCheck = false;

    summonTicketRarities.forEach(rarityKey => {
        if (TICKET_REWARD_INTERVALS_MS[rarityKey]) {
            const intervalMs = TICKET_REWARD_INTERVALS_MS[rarityKey];
            const lastRewardActiveTime = lastTicketRewardTimes[rarityKey] || 0; // Default to 0 if not set

            const activeTimeSinceLastRewardMs = currentTotalActiveTimeMs - lastRewardActiveTime;
            
            if (activeTimeSinceLastRewardMs >= 0) { // Ensure no negative time due to potential inconsistencies
                const intervalsPassed = Math.floor(activeTimeSinceLastRewardMs / intervalMs);

                if (intervalsPassed > 0) {
                    const ticketsToGrant = intervalsPassed;
                    addSummonTickets(rarityKey, ticketsToGrant);
                    // Update the last reward time to the point in active time this reward batch covers
                    lastTicketRewardTimes[rarityKey] = lastRewardActiveTime + (intervalsPassed * intervalMs);

                    const rarityInfo = getRarityTierInfo(rarityKey);
                    const rarityName = rarityInfo ? rarityInfo.name : rarityKey;
                    showCustomAlert(`You earned ${ticketsToGrant} ${rarityName} Summon Ticket(s) for active playtime!`, null, 2500);
                    console.log(`Granted ${ticketsToGrant} ${rarityKey} ticket(s). New last reward active time for ${rarityKey}: ${lastTicketRewardTimes[rarityKey]}ms`);
                    rewardsGrantedThisCheck = true;
                }
            }
        }
    });

    if (rewardsGrantedThisCheck && typeof saveGame === 'function') {
        saveGame();
    }
    if (rewardsGrantedThisCheck && currentScreen === SCREENS.SUMMON_GAME && typeof renderSummonGameScreen === 'function') {
        renderSummonGameScreen();
    }
}

function initializeLastTicketRewardTimesState() {
    if (typeof lastTicketRewardTimes === 'undefined') {
        lastTicketRewardTimes = {};
    }
    if (typeof summonTicketRarities !== 'undefined') {
        summonTicketRarities.forEach(rarityKey => {
            // Only initialize if the property doesn't exist (e.g., new game or new ticket type added)
            // Loading an existing game should populate lastTicketRewardTimes from the save file first.
            if (!lastTicketRewardTimes.hasOwnProperty(rarityKey)) {
                lastTicketRewardTimes[rarityKey] = 0; // Default to 0 active playtime ms
            }
        });
    }
}
