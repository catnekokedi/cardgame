
// js/core/card-utils.js

function getActiveSetDefinitions() {
    if (typeof window.ALL_SET_DEFINITIONS === 'undefined' || typeof window.currentActiveSetVersion === 'undefined') {
        console.error("getActiveSetDefinitions: Core dependencies (window.ALL_SET_DEFINITIONS or window.currentActiveSetVersion) missing.");
        return [];
    }
    return window.ALL_SET_DEFINITIONS.filter(set => set.version === window.currentActiveSetVersion);
}

function getAllSetDefinitionsForCurrentVersion() { // Alias for clarity in some contexts
    return getActiveSetDefinitions(); // Use local getActiveSetDefinitions
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

function getCardImagePath(setAbbrIdentifier, cardId, imageType = 'standard', cardDefinition = null) { // Added unused params for signature consistency if ever needed
    const errorSets = ['fish_in_sea_error', 'error_card_generation', 'error_card_missing_data', 'error_card_save_load'];
    if (!setAbbrIdentifier || typeof cardId !== 'number' || cardId < 1 || errorSets.includes(setAbbrIdentifier)) {
        // console.warn(`[getCardImagePath] Invalid cardId (${cardId}) or error/missing set (${setAbbrIdentifier}). Returning default placeholder.`); // INFO
        return 'gui/fishing_game/tree-back.png'; // Default placeholder for errors
    }

    const meta = getSetMetadata(setAbbrIdentifier);
    if (!meta || meta.name.startsWith("Unknown Set")) {
        // console.warn(`[getCardImagePath] No set metadata for ${setAbbrIdentifier}. Returning default placeholder.`); // INFO
        return 'gui/fishing_game/tree-back.png'; // Default placeholder if set info is missing
    }

    // Use the specific cardImageFolder from the metadata
    // Version and extension are now implicitly handled by meta.cardImageFolder and meta.folderName structure
    // Assuming cardId is numeric and needs padding.
    // TODO: Consider if cardId can be non-numeric or not need padding based on set version (meta.version)
    let extension = '.jpg'; // Default
    if (meta.version === 'v2') { // Example: v2 might use .png
        extension = '.png';
    }
    if (setAbbrIdentifier === "PRE") extension = '.png'; // Specific set using png
    // More specific image types or extensions could be handled here if needed via imageType or cardDefinition

    return `${meta.cardImageFolder}/${meta.folderName}/${String(cardId).padStart(3, '0')}${extension}`;
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
};

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

    if (typeof getFixedGradeAndPrice !== 'function') { // Check local/global getFixedGradeAndPrice
        console.error("updateCollectionSingleCard: getFixedGradeAndPrice is not available.");
        return;
    }
    const meta = getSetMetadata(setAbbrIdentifier); // Use local getSetMetadata
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
            : getFixedGradeAndPrice(setAbbrIdentifier, cardIdNum); // Use local/global getFixedGradeAndPrice

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
