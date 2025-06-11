// js/mini-games/fishing-game/fishing-config.js

const FISHING_CONFIG = {
    BITE_WINDOW_MS: 4000,
    BASE_TICKET_CHANCE: 0.10,
    REEL_TIME_BASE_MS: 1200,
    REEL_TIME_RANDOM_MS: 800,
    SELL_ALL_VALUE_MULTIPLIER: 0.15,

    ROD_TYPES: [
        { level: 1, name: "Basic Rod", catchSpeedFactor: 1.0, successRate: 0.65, rarityBonus: 0, ticketCatchBonus: 0, cost: 0, autoCatch: false },
        { level: 2, name: "Sturdy Rod", catchSpeedFactor: 1.2, successRate: 0.75, rarityBonus: 0.02, ticketCatchBonus: 0.01, cost: 5000, autoCatch: false },
        { level: 3, name: "Advanced Rod", catchSpeedFactor: 1.5, successRate: 0.85, rarityBonus: 0.04, ticketCatchBonus: 0.02, cost: 25000, autoCatch: false },
        { level: 4, name: "Pro Angler Rod", catchSpeedFactor: 1.8, successRate: 0.90, rarityBonus: 0.06, ticketCatchBonus: 0.03, cost: 100000, autoCatch: false },
        { level: 5, name: "Master Caster 3000", catchSpeedFactor: 2.2, successRate: 0.95, rarityBonus: 0.08, ticketCatchBonus: 0.05, cost: 500000, autoCatch: true }
    ],

    BAIT_TYPES: [
        { id: "none", name: "None", cost: 0, uses: Infinity, rarityBoost: 0, ticketBoost: 0, description: "Just your charming personality." },
        { id: "simple_lure", name: "Simple Lure", cost: 500, uses: 10, rarityBoost: 0.01, ticketBoost: 0.005, description: "A basic lure. Might attract slightly better fish." },
        { id: "quality_bait", name: "Quality Bait", cost: 2000, uses: 8, rarityBoost: 0.03, ticketBoost: 0.01, description: "Good quality bait. Increases chances of rarer catches." },
        { id: "shiny_bits", name: "Shiny Bits", cost: 10000, uses: 5, rarityBoost: 0.05, ticketBoost: 0.02, description: "Sparkly! Attracts rarer fish and more tickets." },
        { id: "ticket_magnet", name: "Ticket Magnet", cost: 15000, uses: 5, rarityBoost: 0.01, ticketBoost: 0.15, description: "Strongly attracts summon tickets." }
    ],

    CAT_SPRITES: { // Kept for reference, but cat is now SVG
        idle: "gui/fishing_game/cat_fishing_idle.png",
        casting: "gui/fishing_game/cat_fishing_cast.png",
        reeling: "gui/fishing_game/cat_fishing_reel.png"
    },

    TREE_CONFIG: {
        MAX_MOISTURE_LEVEL: 100,
        WATER_PER_SECOND_DRAG: 10,
        FRUIT_SLOTS: 8,
        GROW_TIME_FACTORS_BY_RARITY: {
            'base':   1 * (3 * 60 * 1000),
            'rare':   5 * (3 * 60 * 1000),
            'foil':   15 * (3 * 60 * 1000),
            'holo':   40 * (3 * 60 * 1000),
            'star':   100 * (3 * 60 * 1000),
            'rainy':  200 * (3 * 60 * 1000),
            'gold':   360 * (3 * 60 * 1000),
            'shiny':  480 * (3 * 60 * 1000)
        },
        MOISTURE_CONSUMPTION_RATE_PER_SECOND: 0.25, // Increased from 0.05
        FRUIT_CARD_TYPES: [ // Mature fruits will still use these images
            { id: "base_fruit_card", name: "Base Fruit Card", rarityKey: "base", image: "gui/fishing_game/fruit_apple.png", value: 10 },
            { id: "rare_fruit_card", name: "Rare Fruit Card", rarityKey: "rare", image: "gui/fishing_game/fruit_berries.png", value: 50 },
            { id: "foil_fruit_card", name: "Foil Fruit Card", rarityKey: "foil", image: "gui/fishing_game/fruit_star.png", value: 150 },
        ],
        FRUIT_GROWTH_SPRITES: { // Sprite paths for non-SVG fallback (if needed) or reference
            sprout: 'gui/fishing_game/fruit_sprout.png',
            bud: 'gui/fishing_game/fruit_bud.png'
        }
    },

    ROCK_DEFINITIONS: [ 
        { id: 'common_rock', name: 'Gri Kaya', color: '#A9A9A9', clicksToBreak: 1, cardDropPool: ['base', 'rare'] },
        { id: 'uncommon_rock', name: 'Kırmızı Kaya', color: '#8B0000', clicksToBreak: 2, cardDropPool: ['rare', 'foil', 'holo'] },
        { id: 'unique_rock', name: 'Turuncu Kaya', color: '#FFA500', clicksToBreak: 3, cardDropPool: ['foil', 'holo', 'star'] },
        { id: 'legendary_rock', name: 'Elmas Kaya', color: '#B9F2FF', clicksToBreak: 4, cardDropPool: ['star', 'rainy', 'gold', 'shiny'] }
    ],

    MAX_VISIBLE_ROCKS: 3, // Updated from 2 to 3 to match image
    ROCK_RESPAWN_TIME_MS: 30 * 1000, 
    
    WATERING_CAN_CONFIG: {
        CAPACITY: 100,
        FILL_RATE_PER_SECOND_DRAG: 20,
        DRAG_WATER_RATE_PER_SECOND: 15,
    },

    CARD_EXCHANGE_RATES: {
        "base": { "rare_ticket": 50 },
        "rare": { "foil_ticket": 20 },
        "foil": { "holo_ticket": 15 },
        "holo": { "star_ticket": 10 },
        "star": { "rainy_ticket": 8 },
        "rainy": { "gold_ticket": 5 },
        "gold": { "shiny_ticket": 3 }
    },
    FRUIT_EXCHANGE_RATES: {
        "base":   { "rare_ticket": 80 },
        "rare":   { "foil_ticket": 30 },
        "foil":   { "holo_ticket": 20 },
        "holo":   { "star_ticket": 12 },
        "star":   { "rainy_ticket": 9 },
        "rainy":  { "gold_ticket": 6 },
        "gold":   { "shiny_ticket": 4 },
        "shiny":  { "shiny_ticket": 2 }
    },
    MINERAL_EXCHANGE_RATES: {
        "base":   { "rare_ticket": 120 },
        "rare":   { "foil_ticket": 50 },
        "foil":   { "holo_ticket": 25 },
        "holo":   { "star_ticket": 15 },
        "star":   { "rainy_ticket": 10 },
        "rainy":  { "gold_ticket": 7 },
        "gold":   { "shiny_ticket": 5 },
        "shiny":  { "shiny_ticket": 3 }
    },
    SVG_COLORS: { 
        treeTrunk: '#6F4E37', 
        treeTrunkStroke: '#4A3B31',
        treeLeaves: '#2E8B57', // SeaGreen - matches image better
        treeLeavesStroke: '#1E5638',
        fruitSprout: '#90EE90', 
        fruitBud: '#FFB6C1',    
        fruitMaturing: '#FFA07A', 
        fruitStroke: '#404040', 
        rockNormal: '#A9A9A9',  // Grey for base rock
        rockDarkRed: '#8B0000', // Dark Red
        rockOrange: '#FFA500',  // Orange
        rockCrackedFill: '#777777', 
        rockCrackStroke: '#505050', 
        rockCooldown: '#777777',
        rockCooldownStroke: '#555555',
        rockStroke: '#333333',  
        catBody: '#D2B48C',     
        catOutline: '#000000',  
        catEyes: '#000000',     
        rod: '#8B4513',         
        rodTip: '#502F1E',
        boatFill: '#A0522D', // Sienna
        boatStroke: '#5F3A1F' // Darker Sienna
    }
};