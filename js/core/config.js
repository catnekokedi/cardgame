// js/core/config.js

const SCREENS = {
    STATS: 'stats',
    PACK_SELECTION: 'pack-selection',
    COLLECTION: 'collection',
    GALLERY: 'gallery',
    JUNK: 'junk',
    GAMES: 'games-screen',
    ACHIEVEMENTS: 'achievements',
    TRADE_UP_GAME: 'tradeUpGame',
    DIRECT_OFFER_GAME: 'directOfferGame',
    PREDICTION_GAME: 'predictionGame',
    HIGHER_OR_LOWER: 'higherOrLower',
    SILHOUETTE_QUIZ: 'silhouetteQuiz',
    RARITY_ODDS: 'rarity-odds',
    SUMMON_GAME: 'summon-game-screen',
    IDLE_EXHIBITION: 'idle-exhibition-screen', // New Screen
    FISHING_GAME: 'fish-in-sea-screen' // Updated Fishing Game Screen ID
};

const LOCAL_STORAGE_KEY = 'cardGameSaveData';

const CARDS_PER_PAGE = 64; // Moved from script.js
const PACKS_PER_PAGE = 64; // Added for pack selection screen pagination