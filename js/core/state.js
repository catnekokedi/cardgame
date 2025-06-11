
// js/core/state.js

// From script.js
window.sets = [];
window.cardsPerSet = [];
window.totalCardsInDb = 0;

window.balance = 10000;
window.collection = {};
window.achievements = {
    // Structure will be: achievements[setAbbr] = {first:false, p10:false, ...}
    // Add version-specific master collector progress
    masterCollectorProgressV1: 0,
    masterCollectorProgressV2: 0,
    allV1SetsComplete: false,
    allV2SetsComplete: false
};
window.packsOpened = 0;
window.moneySpent = 0;
window.gameEpochStartTime = Date.now(); // Renamed from startTime
window.accumulatedActiveTimeMs = 0; // New: Stores total active play time from previous sessions
window.sessionStartTime = Date.now(); // New: Timestamp for when the current session/visibility started
window.isGameActive = true; // New: Tracks if the game tab is currently active and accumulating time

window.currentActiveSetVersion = 'v1'; // 'v1' or 'v2'

window.isDebugModeActive = false;
window.cheatsPasswordEntered = false; // Used by stats.js, but fundamentally state
window.unlockedSets = [];
window.unlockAllPacksCheatActive = false;
window.anvilSuccessCheatActive = false;

window.rarityOddsConfigUnlocked = false; // Used by rarityodds.js

window.isOpeningAnvilPack = false;
window.anvilPackSource = null;
window.isOpeningSummonPack = false;
window.summonPackSource = [];
window.lastSelectedSummonRarityKey = null;

window.setIdentifierToName = {};
window.setNameToIdentifier = {};

window.miniGameData = {}; // General store for mini-game specific data

window.galleryCurrentPage = 1;
window.collectionCurrentPage = 1;
window.duplicatesCurrentPage = 1;
window.packSelectionCurrentPage = 1; // Added for pack selection screen

// Removed isMobileViewActive state variable

// From other-js/changerarityodds.js
// Cache for fixed properties of each card (intrinsic rarity, grade, price)
// Structure: fixedCardProperties[setAbbrIdentifier][cardIdNum] = { grade, price, rarityKey }
window.fixedCardProperties = {};

// Snapshot for debug mode to toggle pack probabilities - state related to debug features
window.originalPackProbsSnapshotDebug = null;

// These are effectively configurations that can change, so stateful.
// Original hardcoded grade distribution - game's "factory settings" for grades.
const originalHardcodedGradeDistribution = [ // Defined here as it's a base state for odds.
    { grade: 1, prob: 0.7500, priceMinMult: 0.01, priceMaxMult: 0.02 },
    { grade: 2, prob: 0.1200, priceMinMult: 0.04, priceMaxMult: 0.08 },
    { grade: 3, prob: 0.0750, priceMinMult: 0.10, priceMaxMult: 0.18 },
    { grade: 4, prob: 0.0250, priceMinMult: 0.20, priceMaxMult: 0.36 },
    { grade: 5, prob: 0.0150, priceMinMult: 0.40, priceMaxMult: 0.60 },
    { grade: 6, prob: 0.0100, priceMinMult: 0.70, priceMaxMult: 0.85 },
    { grade: 7, prob: 0.0050, priceMinMult: 0.90, priceMaxMult: 1.00 }
];

// initialDefault... variables store the user's chosen defaults (or factory settings if never changed)
window.initialDefaultGradeDistribution = JSON.parse(JSON.stringify(originalHardcodedGradeDistribution));
window.initialDefaultRarityPackPullDistribution = null; // Will be populated from RARITY_PACK_PULL_DISTRIBUTION

// live... variables are what the game currently uses, can be changed by settings panel
window.gradeDistribution = JSON.parse(JSON.stringify(initialDefaultGradeDistribution));
window.liveRarityPackPullDistribution = null; // Will be populated from RARITY_PACK_PULL_DISTRIBUTION

// From other-js/summonticket.js
window.summonTickets = {}; // This is state. The definition of rarities is data.

// For time-based ticket rewards
// Stores the accumulated active playtime (in ms) at which the last reward for a given ticket type was granted.
window.lastTicketRewardTimes = {}; // e.g., { 'rare': 120000, 'foil': 300000, ... }
