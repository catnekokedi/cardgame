
// js/ui/screens/duplicates.js (Originally menu-js/dublicates.js)

function showDuplicates(page = 1) {
    if (!isGameInitialized) {
        console.warn("showDuplicates called before game is fully initialized.");
        return;
    }
    const dependencies = {
        collection: typeof collection !== 'undefined',
        ALL_SET_DEFINITIONS: typeof ALL_SET_DEFINITIONS !== 'undefined',
        getRarityTierInfo: typeof getRarityTierInfo === 'function',
        formatCurrency: typeof formatCurrency === 'function',
        CARDS_PER_PAGE: typeof CARDS_PER_PAGE !== 'undefined',
        renderPaginationControls: typeof renderPaginationControls === 'function',
        getSetMetadata: typeof getSetMetadata === 'function'
    };
    for (const dep in dependencies) {
        if (!dependencies[dep]) {
            console.error(`showDuplicates: Missing dependency: ${dep}`);
            return;
        }
    }

    duplicatesCurrentPage = page; // Use global state variable

    const duplicateListDiv = document.getElementById('duplicate-list');
    const junkMessage = document.getElementById('junk-message');
    const paginationContainer = document.getElementById('duplicate-pagination');

    if (!duplicateListDiv || !junkMessage || !paginationContainer) {
        console.error("Duplicate list, junk message, or pagination container element not found.");
        return;
    }

    duplicateListDiv.innerHTML = '';
    let allDuplicateEntries = [];
    let totalOverallSellValue = 0;

    ALL_SET_DEFINITIONS.forEach(setDef => {
        const setAbbr = setDef.abbr;
        if (collection[setAbbr]) {
            Object.keys(collection[setAbbr]).forEach(cardIdStr => {
                const cardIdNum = parseInt(cardIdStr);
                const cardData = collection[setAbbr][cardIdNum];

                if (cardData.count > 1) {
                    const duplicateCount = cardData.count - 1;
                    const sellPricePerDuplicate = Math.floor(cardData.price * 0.25);
                    totalOverallSellValue += duplicateCount * sellPricePerDuplicate;
                    allDuplicateEntries.push({
                        setIdentifier: setAbbr,
                        cardId: cardIdNum,
                        rarityKey: cardData.rarityKey,
                        grade: cardData.grade,
                        duplicateCount,
                        sellValue: duplicateCount * sellPricePerDuplicate
                    });
                }
            });
        }
    });

    if (allDuplicateEntries.length === 0) {
        junkMessage.textContent = 'No duplicate cards to sell.';
        paginationContainer.innerHTML = '';
    } else {
        junkMessage.textContent = `Total potential sell value of all duplicates: ${formatCurrency(totalOverallSellValue)}`;

        const totalPages = Math.ceil(allDuplicateEntries.length / CARDS_PER_PAGE);
        const startIndex = (duplicatesCurrentPage - 1) * CARDS_PER_PAGE;
        const endIndex = startIndex + CARDS_PER_PAGE;
        const paginatedDuplicates = allDuplicateEntries.slice(startIndex, endIndex);

        paginatedDuplicates.forEach(item => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'achievement-item achieved';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'name';
            const setMeta = getSetMetadata(item.setIdentifier);
            const displaySetName = setMeta ? setMeta.name : `Set ${item.setIdentifier}`; // Corrected: meta.name to setMeta.name
            const rarityTierInfo = getRarityTierInfo(item.rarityKey);
            const displayRarityName = rarityTierInfo ? rarityTierInfo.name : item.rarityKey;

            nameDiv.textContent = `${item.setIdentifier}-C${item.cardId} (${displayRarityName}), Grade ${item.grade} - ${item.duplicateCount} excess`;
            itemContainer.appendChild(nameDiv);

            const statusDiv = document.createElement('div');
            statusDiv.className = 'status';
            statusDiv.textContent = `Sell value: ${formatCurrency(item.sellValue)}`;
            itemContainer.appendChild(statusDiv);

            duplicateListDiv.appendChild(itemContainer);
        });
        renderPaginationControls('duplicate-pagination', totalPages, duplicatesCurrentPage, showDuplicates);
    }
}

function sellDuplicates() {
    if (typeof collection === 'undefined' || typeof ALL_SET_DEFINITIONS === 'undefined' ||
        typeof balance === 'undefined' || typeof updateBalance !== 'function' ||
        typeof saveGame !== 'function' || typeof showCustomConfirm !== 'function' ||
        typeof showCustomAlert !== 'function' || typeof formatCurrency !== 'function') {
        console.error("One or more global dependencies for sellDuplicates are missing.");
        showCustomAlert("Error: Cannot perform sell operation due to missing game components.");
        return;
    }

    let totalSoldAmount = 0;
    let itemsSold = 0;
    let foundAnyDuplicates = false;

    ALL_SET_DEFINITIONS.forEach(setDef => {
        const setAbbr = setDef.abbr;
        if (collection[setAbbr]) {
            Object.keys(collection[setAbbr]).forEach(cardIdStr => {
                if (collection[setAbbr][cardIdStr].count > 1) {
                    foundAnyDuplicates = true;
                }
            });
        }
    });

    if (!foundAnyDuplicates) {
        showCustomAlert('No duplicate cards found to sell.');
        return;
    }

    showCustomConfirm("Are you sure you want to sell ALL duplicate cards (keeping one of each)?", () => {
        ALL_SET_DEFINITIONS.forEach(setDef => {
            const setAbbr = setDef.abbr;
            if (collection[setAbbr]) {
                Object.keys(collection[setAbbr]).forEach(cardIdStr => {
                    const cardData = collection[setAbbr][cardIdStr];
                    if (cardData.count > 1) {
                        const duplicatesToSell = cardData.count - 1;
                        const sellPrice = Math.floor(cardData.price * 0.25);
                        totalSoldAmount += duplicatesToSell * sellPrice;
                        itemsSold += duplicatesToSell;
                        cardData.count = 1;
                    }
                });
            }
        });
        if (itemsSold > 0) {
            balance += totalSoldAmount;
            updateBalance();
            saveGame();
            showDuplicates(1);
            showCustomAlert(`${itemsSold} duplicate cards sold for ${formatCurrency(totalSoldAmount)} Toki!`);
            if (typeof playSound === 'function') playSound('sfx_toki_gain.mp3');
        } else {
            showCustomAlert('No duplicate cards were eligible for selling after confirmation.');
            showDuplicates(1);
        }
    });
}
