// js/idle-exhibition/ie-state.js

var idleExhibitionState = {
    exhibitedCards: [],
    unlockedSlotsCount: 1, // Default set by initialize function
    slotVisualTiers: {},
    securitySystemTier: 0,
    broomLevel: 0, // Added
    autoCleanLevel: 0, // Added
    lastUpdateTime: Date.now(),
    inGameTimeHours: 0,
    inGameDay: 1,
    totalAccruedIncome: 0,
    lastPlayerVisitTimestamp: Date.now(),
    // New state for smoother UI clock
    lastTrueGameTimeUpdateTimestamp: Date.now(),
    inGameTimeHoursAtLastTrueUpdate: 0,
    inGameDayAtLastTrueUpdate: 1,
    gameMinutesSinceLastAutoClean: 0 // Added for auto-cleaner timing
};

function initializeIdleExhibitionState() {
    idleExhibitionState.exhibitedCards = [];
    for (let i = 0; i < idleExhibitionConfig.MAX_SLOTS; i++) {
        idleExhibitionState.exhibitedCards.push(null);
        idleExhibitionState.slotVisualTiers[i] = 0;
    }
    idleExhibitionState.unlockedSlotsCount = idleExhibitionConfig.INITIAL_SLOTS;
    idleExhibitionState.securitySystemTier = 0;
    idleExhibitionState.broomLevel = 0; // Initialized
    idleExhibitionState.autoCleanLevel = 0; // Initialized
    idleExhibitionState.lastUpdateTime = Date.now();
    idleExhibitionState.inGameTimeHours = 0;
    idleExhibitionState.inGameDay = 1;
    idleExhibitionState.totalAccruedIncome = 0;
    idleExhibitionState.lastPlayerVisitTimestamp = Date.now();

    // Initialize new clock sync state variables
    idleExhibitionState.lastTrueGameTimeUpdateTimestamp = Date.now();
    idleExhibitionState.inGameTimeHoursAtLastTrueUpdate = idleExhibitionState.inGameTimeHours;
    idleExhibitionState.inGameDayAtLastTrueUpdate = idleExhibitionState.inGameDay;
    idleExhibitionState.gameMinutesSinceLastAutoClean = 0; // Initialized
}
// Call initialize on script load to set defaults based on config
initializeIdleExhibitionState();