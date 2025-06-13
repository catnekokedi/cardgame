

// js/ui/screens/collection.js (Originally menu-js/collection.js)

function showSetCollection(page = 1) {
    if (!isGameInitialized) {
        console.warn("showSetCollection called before game is fully initialized.");
        return;
    }
    const dependencies = {
        collection: typeof collection !== 'undefined',
        getActiveSetDefinitions: typeof getActiveSetDefinitions === 'function', // Use this
        getCardIntrinsicRarity: typeof getCardIntrinsicRarity === 'function',
        getRarityTierInfo: typeof getRarityTierInfo === 'function',
        renderPaginationControls: typeof renderPaginationControls === 'function',
        showCardDetail: typeof showCardDetail === 'function',
        getSetMetadata: typeof getSetMetadata === 'function',
        getCardImagePath: typeof getCardImagePath === 'function',
        CARDS_PER_PAGE: typeof CARDS_PER_PAGE !== 'undefined',
        getFixedGradeAndPrice: typeof getFixedGradeAndPrice === 'function'
    };
    for (const dep in dependencies) {
        if (!dependencies[dep]) {
            console.error(`showSetCollection: Missing dependency: ${dep}`);
            return;
        }
    }

    collectionCurrentPage = page;
    const setSelectorDisplay = document.getElementById('set-selector-display'); // Updated
    const raritySelector = document.getElementById('rarity-selector');
    if (!setSelectorDisplay || !raritySelector) {
        console.error("Collection screen: Set selector display or rarity selector not found.");
        return;
    }

    const selectedSetIdentifier = setSelectorDisplay.dataset.value; // Get value from data attribute
    const selectedRarityString = raritySelector.value;
    const collectionGrid = document.getElementById('collection-grid');
    if (!collectionGrid) return;
    collectionGrid.innerHTML = '';

    let displayableCards = [];
    const activeSetsForDisplay = getActiveSetDefinitions(); // Get sets for current version

    const processSet = (setAbbr) => {
        const setDef = activeSetsForDisplay.find(s => s.abbr === setAbbr); // Ensure we are processing an active set
        if (!setDef) return; 

        const setMeta = getSetMetadata(setAbbr); // getSetMetadata is version aware via ALL_SET_DEFINITIONS
        if (!setMeta || setMeta.name.startsWith("Unknown Set") || setMeta.count === 0) {
            return;
        }
        for (let cardId = 1; cardId <= setMeta.count; cardId++) {
            const cardDataFromCollection = collection[setAbbr]?.[cardId];
            const isOwned = cardDataFromCollection && cardDataFromCollection.count > 0;

            const fixedProps = getFixedGradeAndPrice(setAbbr, cardId);
            const intrinsicRarityKey = fixedProps.rarityKey;

            let displayThisCard = false;
            if (selectedRarityString === 'all' || intrinsicRarityKey === selectedRarityString) {
                displayThisCard = true;
            }

            if (displayThisCard) {
                displayableCards.push({
                    setIdentifier: setAbbr,
                    cardId: cardId,
                    isOwned,
                    rarityKey: intrinsicRarityKey,
                    grade: isOwned ? cardDataFromCollection.grade : fixedProps.grade,
                });
            }
        }
    };

    if (selectedSetIdentifier === 'all') {
        activeSetsForDisplay.forEach(setDef => processSet(setDef.abbr)); // Iterate over active sets
    } else {
        processSet(selectedSetIdentifier); // Process only the selected set (if it's active)
    }

    const totalPages = Math.ceil(displayableCards.length / CARDS_PER_PAGE);
    const startIndex = (page - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const paginatedCards = displayableCards.slice(startIndex, endIndex);

    paginatedCards.forEach(cardInfo => {
        const cardDivContainer = document.createElement('div');
        cardDivContainer.className = 'text-center';
        const rarityTierDisplayInfo = getRarityTierInfo(cardInfo.rarityKey);
        const displayRarityName = rarityTierDisplayInfo ? rarityTierDisplayInfo.name : cardInfo.rarityKey;

        if (cardInfo.isOwned) {
            const img = document.createElement('img');
            img.src = getCardImagePath(cardInfo.setIdentifier, cardInfo.cardId);
            img.alt = `Card ${cardInfo.setIdentifier}-C${cardInfo.cardId} (${displayRarityName})`; // Added rarity to alt
            // Standardized onerror logic
            img.onerror = function(){this.src=`https://placehold.co/${this.naturalWidth||this.width||130}x${this.naturalHeight||this.height||182}/333333/cccccc?text=${encodeURIComponent(this.alt || 'Missing Image')}`; this.onerror=null;};
            img.className = 'collection-grid-card-image'; // New class for just the image

            const cardWrapper = document.createElement('div');
            cardWrapper.className = `card ${cardInfo.rarityKey}`; // This div gets the 'card' and rarity class for effects
            cardWrapper.onclick = () => showCardDetail(cardInfo.setIdentifier, cardInfo.cardId, cardInfo.rarityKey, 'collection', null, cardInfo.grade);

            cardWrapper.appendChild(img);
            cardDivContainer.appendChild(cardWrapper); // Append wrapper to the container

            const p = document.createElement('p');
            const rarityTextClass = `rarity-text-${cardInfo.rarityKey}`;
            p.innerHTML = `${cardInfo.setIdentifier}-C${cardInfo.cardId} (<span class="${rarityTextClass}">${displayRarityName}</span>)`;
            p.style.fontSize="0.8em";
            p.style.marginTop="3px";
            cardDivContainer.appendChild(p);
        } else {
            const placeholderDiv = document.createElement('div');
            placeholderDiv.className = `card card-placeholder ${cardInfo.rarityKey}`;

            const placeholderTextMain = document.createElement('span');
            placeholderTextMain.textContent = `${cardInfo.setIdentifier}-C${cardInfo.cardId}`;
            placeholderTextMain.style.display = 'block';
            placeholderTextMain.style.fontWeight = '500';

            const placeholderTextSub = document.createElement('span');
            placeholderTextSub.textContent = `(${displayRarityName})`;
            placeholderTextSub.style.display = 'block';
            placeholderTextSub.style.fontSize = '0.8em';
            placeholderTextSub.style.marginTop = '4px';
            const rarityColor = rarityTierDisplayInfo ? rarityTierDisplayInfo.color : 'var(--material-text-disabled-dark)';
            placeholderTextSub.style.color = rarityColor;

            placeholderDiv.appendChild(placeholderTextMain);
            placeholderDiv.appendChild(placeholderTextSub);

            cardDivContainer.appendChild(placeholderDiv);

            const pSpacing = document.createElement('p');
            pSpacing.innerHTML = `&nbsp;`;
            pSpacing.style.fontSize="0.8em";
            pSpacing.style.marginTop="3px";
            pSpacing.style.visibility="hidden";
            cardDivContainer.appendChild(pSpacing);
        }
        collectionGrid.appendChild(cardDivContainer);
    });
    renderPaginationControls('collection-pagination', totalPages, page, showSetCollection);
    updateCollectionStats(selectedSetIdentifier, selectedRarityString);
}

function updateCollectionStats(selectedSetIdentifier, selectedRarityString) {
    if (!isGameInitialized || typeof getSetMetadata !== 'function' || 
        typeof getCardIntrinsicRarity !== 'function' || typeof getRarityTierInfo !== 'function' || 
        typeof collection === 'undefined' || typeof getActiveSetDefinitions !== 'function') {
        console.error("updateCollectionStats: Missing dependencies.");
        return;
    }
    const totalOwnedEl = document.getElementById('total-owned');
    const totalCompletionEl = document.getElementById('total-completion');
    const setOwnedEl = document.getElementById('set-owned');
    const setTotalCardsEl = document.getElementById('set-total-cards');
    const setCompletionEl = document.getElementById('set-completion');
    const setCompletionParentEl = document.getElementById('set-completion-stats');

    const rarityStatsPEl = document.getElementById('rarity-completion-stats');
    const rarityCompletionLabelEl = document.getElementById('rarity-completion-label');
    const rarityOwnedCountEl = document.getElementById('rarity-owned-count');
    const rarityTotalInSetEl = document.getElementById('rarity-total-in-set');
    const rarityCompletionPercentageEl = document.getElementById('rarity-completion-percentage');

    if (!totalOwnedEl || !totalCompletionEl || !setOwnedEl || !setTotalCardsEl || !setCompletionEl || !setCompletionParentEl || !rarityStatsPEl || !rarityCompletionLabelEl || !rarityOwnedCountEl || !rarityTotalInSetEl || !rarityCompletionPercentageEl) {
        console.error("updateCollectionStats: One or more stat display elements not found.");
        return;
    }

    const activeSetsForStats = getActiveSetDefinitions();
    let totalUniqueCardsOwnedOverallActiveVersion = 0;
    activeSetsForStats.forEach(setDef => {
        if (collection[setDef.abbr]) {
            Object.keys(collection[setDef.abbr]).forEach(cardId => {
                if (collection[setDef.abbr][cardId].count > 0) totalUniqueCardsOwnedOverallActiveVersion++;
            });
        }
    });
    totalOwnedEl.textContent = totalUniqueCardsOwnedOverallActiveVersion;
    
    const totalDbCountActiveVersion = activeSetsForStats.reduce((sum, setDef) => sum + setDef.count, 0);
    const totalCompletionPercentage = totalDbCountActiveVersion > 0 ? (totalUniqueCardsOwnedOverallActiveVersion / totalDbCountActiveVersion * 100).toFixed(1) : 0;
    totalCompletionEl.textContent = `${totalCompletionPercentage}%`;
    
    // This element is actually on the Stats screen, updated by updateStats() in stats.js
    // However, if collection screen needs this info independently, it can update a local var or recalc.
    // For now, assume total-cards-in-db is correctly updated by stats.js when version changes.
    // document.getElementById('total-cards-in-db').textContent = totalDbCountActiveVersion; 


    if (selectedSetIdentifier !== 'all') {
        const setMetaForStats = getSetMetadata(selectedSetIdentifier);
        // Ensure the selected set is part of the current active version
        const isSelectedSetActive = activeSetsForStats.some(s => s.abbr === selectedSetIdentifier);

        if (!setMetaForStats || setMetaForStats.name.startsWith("Unknown Set") || !isSelectedSetActive) {
            setCompletionParentEl.style.display = 'none';
        } else {
            const cardsInCurrentSet = setMetaForStats.count;
            let ownedInSet = 0;
            if (collection[selectedSetIdentifier]) {
                Object.keys(collection[selectedSetIdentifier]).forEach(cardId => {
                    if (collection[selectedSetIdentifier][cardId].count > 0) ownedInSet++;
                });
            }
            setOwnedEl.textContent = ownedInSet;
            setTotalCardsEl.textContent = cardsInCurrentSet;
            const setCompletionPercentageVal = cardsInCurrentSet > 0 ? (ownedInSet / cardsInCurrentSet * 100).toFixed(1) : 0;
            setCompletionEl.textContent = `${setCompletionPercentageVal}%`;
            setCompletionParentEl.style.display = 'block';
        }
    } else {
        setCompletionParentEl.style.display = 'none';
    }

    // Logic for rarity-specific completion
    if ((selectedSetIdentifier !== 'all' && selectedRarityString !== 'all') || (selectedSetIdentifier === 'all' && selectedRarityString !== 'all')) {
        const rarityInfo = getRarityTierInfo(selectedRarityString);
        if (!rarityInfo) {
            rarityStatsPEl.style.display = 'none';
        } else {
            let totalOwnedForSelectedRarity = 0;
            let totalInDbForSelectedRarity = 0;

            if (selectedSetIdentifier === 'all') {
                // Rarity completion across ALL ACTIVE sets
                activeSetsForStats.forEach(setDef => {
                    for (let cardId = 1; cardId <= setDef.count; cardId++) {
                        const intrinsicRarity = getCardIntrinsicRarity(setDef.abbr, cardId);
                        if (intrinsicRarity === selectedRarityString) {
                            totalInDbForSelectedRarity++;
                            if (collection[setDef.abbr]?.[cardId]?.count > 0) {
                                totalOwnedForSelectedRarity++;
                            }
                        }
                    }
                });
            } else {
                // Rarity completion for a specific set (must be an active set)
                const setMetaForRarityStats = getSetMetadata(selectedSetIdentifier);
                 const isSelectedSetActiveForRarity = activeSetsForStats.some(s => s.abbr === selectedSetIdentifier);

                if (!setMetaForRarityStats || setMetaForRarityStats.name.startsWith("Unknown Set") || !isSelectedSetActiveForRarity) {
                    rarityStatsPEl.style.display = 'none';
                    return; 
                }
                for (let cardId = 1; cardId <= setMetaForRarityStats.count; cardId++) {
                    if (getCardIntrinsicRarity(selectedSetIdentifier, cardId) === selectedRarityString) {
                        totalInDbForSelectedRarity++;
                    }
                }
                if (collection[selectedSetIdentifier]) {
                     Object.keys(collection[selectedSetIdentifier]).forEach(cardIdKey => {
                        const cardData = collection[selectedSetIdentifier][cardIdKey];
                        if (cardData.count > 0 && cardData.rarityKey === selectedRarityString) {
                           totalOwnedForSelectedRarity++;
                        }
                    });
                }
            }

            rarityOwnedCountEl.textContent = totalOwnedForSelectedRarity;
            rarityTotalInSetEl.textContent = totalInDbForSelectedRarity;
            const percentage = totalInDbForSelectedRarity > 0 ? (totalOwnedForSelectedRarity / totalInDbForSelectedRarity * 100).toFixed(1) : 0;
            rarityCompletionPercentageEl.textContent = `${percentage}%`;
            rarityCompletionLabelEl.textContent = `${rarityInfo.name} Completion:`;
            rarityStatsPEl.style.display = 'block';
        }
    } else {
        rarityStatsPEl.style.display = 'none';
    }
}
