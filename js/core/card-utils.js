
// js/core/card-utils.js

function getActiveSetDefinitions() {
    if (typeof window.ALL_SET_DEFINITIONS === 'undefined' || typeof window.currentActiveSetVersion === 'undefined') {
        console.error("getActiveSetDefinitions: Core dependencies (window.ALL_SET_DEFINITIONS or window.currentActiveSetVersion) missing.");
        return [];
    }
    return window.ALL_SET_DEFINITIONS.filter(set => set.version === window.currentActiveSetVersion);
}

function getAllSetDefinitionsForCurrentVersion() { // Alias for clarity in some contexts
    return getActiveSetDefinitions();
}


function getSetMetadata(setAbbrIdentifier) {
    if (typeof window.ALL_SET_DEFINITIONS === 'undefined') {
        console.error("getSetMetadata: window.ALL_SET_DEFINITIONS is not available.");
        return { 
            id: setAbbrIdentifier, numericId: -1, name: `Unknown Set (${setAbbrIdentifier})`, count: 0, 
            isNewFormat: true, boosterCoverPath: 'gui/booster_covers/boosterpack.png', cardDataPath: '',
            version: 'v1', boosterCoverFolder: 'gui/booster_orginal', cardImageFolder: 'cards-new'
        };
    }
    const setDefinition = window.ALL_SET_DEFINITIONS.find(s => s.abbr === setAbbrIdentifier);

    if (setDefinition) {
        let boosterCoverFolder;
        let cardImageFolder;

        if (setDefinition.version === 'v1') {
            boosterCoverFolder = 'gui/booster_orginal';
            cardImageFolder = 'cards-new';
        } else if (setDefinition.version === 'v2') {
            boosterCoverFolder = 'gui/booster_yuki';
            cardImageFolder = 'cards-yuki';
        } else {
            console.warn(`getSetMetadata: Unknown version '${setDefinition.version}' for set ${setAbbrIdentifier}. Falling back to v1 paths.`);
            boosterCoverFolder = 'gui/booster_orginal';
            cardImageFolder = 'cards-new';
        }

        return {
            id: setDefinition.abbr, // Using abbr as the primary textual id
            numericId: setDefinition.id,
            name: setDefinition.name,
            count: setDefinition.count,
            folderName: setDefinition.folderName,
            isNewFormat: true, // Defaulting to true as per optimization
            boosterCoverPath: `${boosterCoverFolder}/pack_${setDefinition.folderName}.png`,
            cardDataPath: `carddatajson/${setDefinition.name}.json`, // This path structure remains for now
            version: setDefinition.version,
            boosterCoverFolder: boosterCoverFolder, 
            cardImageFolder: cardImageFolder     
        };
    }
    // Fallback for unknown set
    return { 
        id: setAbbrIdentifier, numericId: -1, name: `Unknown Set (${setAbbrIdentifier})`, count: 0, 
        isNewFormat: true, boosterCoverPath: 'gui/booster_covers/boosterpack.png', cardDataPath: '',
        version: 'v1', 
        boosterCoverFolder: 'gui/booster_orginal', 
        cardImageFolder: 'cards-new'
    };
}

function getCardImagePath(setAbbrIdentifier, cardId, imageType = 'standard', cardDefinition = null) {
    // Robust checks for parameters
    if (typeof setAbbrIdentifier !== 'string' || !setAbbrIdentifier ||
        (typeof cardId !== 'number' && typeof cardId !== 'string') || // Allow string cardId for things like 'error_card' initially
        (typeof cardId === 'number' && (isNaN(cardId) || cardId < 1)) ||
        (typeof cardId === 'string' && isNaN(parseInt(cardId))) // Allow string that can be parsed to int
       ) {
        // console.warn(`[getCardImagePath] Invalid parameters: setAbbr=${setAbbrIdentifier}, cardId=${cardId}. Returning default placeholder.`);
        return 'gui/fishing_game/tree-back.png'; // Default placeholder
    }

    // Specific check for known error/placeholder card IDs that are strings
    if (typeof cardId === 'string' && cardId.includes('error')) {
         return 'gui/fishing_game/tree-back.png';
    }

    // Convert cardId to number for further processing if it was a string numeral
    const numericCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
    if (typeof numericCardId !== 'number' || isNaN(numericCardId) || numericCardId < 1) {
        // console.warn(`[getCardImagePath] cardId ${cardId} resulted in invalid numericId. Returning default placeholder.`);
        return 'gui/fishing_game/tree-back.png';
    }

    const meta = getSetMetadata(setAbbrIdentifier);
    if (!meta || meta.name.startsWith("Unknown Set") || !meta.folderName || !meta.cardImageFolder) {
        // console.warn(`[getCardImagePath] No valid metadata, folderName, or cardImageFolder for set ${setAbbrIdentifier}. Returning default placeholder.`);
        return 'gui/fishing_game/tree-back.png';
    }

    let extension = '.jpg'; // Default extension
    if (meta.version === 'v2') {
        extension = '.png';
    }
    // Allow specific sets to override if needed (example from previous versions)
    if (setAbbrIdentifier === "PRE" || (cardDefinition && cardDefinition.extension === '.png')) {
        extension = '.png';
    }

    // Path construction using metadata
    // Ensure cardId is padded correctly if it's numeric.
    return `${meta.cardImageFolder}/${meta.folderName}/${String(numericCardId).padStart(3, '0')}${extension}`;
}

function initializeSetMappings() {
    if (typeof window.ALL_SET_DEFINITIONS === 'undefined') {
        console.error("initializeSetMappings: window.ALL_SET_DEFINITIONS is not available.");
        return;
    }
    window.setIdentifierToName = {}; // Ensure it's on window object
    window.setNameToIdentifier = {};   // Ensure it's on window object

    window.ALL_SET_DEFINITIONS.forEach(def => {
        window.setIdentifierToName[def.abbr] = def.name;
        window.setNameToIdentifier[def.name.toLowerCase().trim()] = def.abbr;
    });
}

/**
 * Updates the collection for a single card.
 * @param {{set: string, cardId: number, rarityKey?: string, grade?: number, price?: number}} cardDetails
 *        - set: set abbreviation, cardId: 1-based numeric ID.
 *        - rarityKey, grade, price are provided for new cards (e.g. from pack opening).
 *          If not provided, they should have been determined and cached by getFixedGradeAndPrice already.
 * @param {number} [countAdjustment=1] - How much to adjust the count by.
 */
function updateCollectionSingleCard(cardDetails, countAdjustment = 1) {
    const { set: setAbbrIdentifier, cardId: cardIdNum } = cardDetails;

    if (typeof getFixedGradeAndPrice !== 'function') {
        console.error("updateCollectionSingleCard: getFixedGradeAndPrice is not available.");
        return;
    }
    const meta = getSetMetadata(setAbbrIdentifier);
    if (!meta || meta.name.startsWith("Unknown Set") || meta.count === 0) {
        console.error("updateCollectionSingleCard: Invalid set or set has 0 cards:", setAbbrIdentifier);
        return;
    }
    if (isNaN(cardIdNum) || cardIdNum <= 0 || cardIdNum > meta.count) {
        console.error(`updateCollectionSingleCard: Invalid card ID ${cardIdNum} for set ${setAbbrIdentifier}.`);
        return;
    }

    if (!window.collection[setAbbrIdentifier]) { // Access via window
        window.collection[setAbbrIdentifier] = {};
    }

    let cardEntry = window.collection[setAbbrIdentifier][cardIdNum]; // Access via window

    if (!cardEntry) {
        const { rarityKey, grade, price } = (cardDetails.rarityKey && cardDetails.grade !== undefined && cardDetails.price !== undefined)
            ? { rarityKey: cardDetails.rarityKey, grade: cardDetails.grade, price: cardDetails.price }
            : getFixedGradeAndPrice(setAbbrIdentifier, cardIdNum);

        window.collection[setAbbrIdentifier][cardIdNum] = { // Access via window
            count: Math.max(0, countAdjustment),
            grade: grade,
            price: price,
            rarityKey: rarityKey
        };
    } else {
        cardEntry.count = Math.max(0, cardEntry.count + countAdjustment);
    }
}

function updateBalance() {
    const numericBalanceStr = window.balance.toLocaleString(); // e.g., "10,000"

    const desktopTokiValue = document.getElementById('toki-value');
    if (desktopTokiValue) {
        desktopTokiValue.textContent = numericBalanceStr;
    }

    const mobileTokiValue = document.getElementById('mobile-toki-value');
    if (mobileTokiValue) {
        mobileTokiValue.textContent = numericBalanceStr;
    }

    const statsCoinsValue = document.getElementById('current-coins');
    if (statsCoinsValue) {
        statsCoinsValue.textContent = formatCurrency(window.balance); // Stats screen still uses $ symbol
    }
}
