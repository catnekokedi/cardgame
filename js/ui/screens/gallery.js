

// js/ui/screens/gallery.js (Originally menu-js/gallery.js)

function showGallery(page = 1) {
    if (!isGameInitialized) {
        console.warn("showGallery called before game is fully initialized.");
        return;
    }

    const dependencies = {
        getActiveSetDefinitions: typeof getActiveSetDefinitions === 'function', // Use this
        collection: typeof collection !== 'undefined',
        stringToRarityInt: typeof stringToRarityInt !== 'undefined',
        getRarityTierInfo: typeof getRarityTierInfo === 'function',
        CARDS_PER_PAGE: typeof CARDS_PER_PAGE !== 'undefined',
        formatCurrency: typeof formatCurrency === 'function',
        showCardDetail: typeof showCardDetail === 'function',
        renderPaginationControls: typeof renderPaginationControls === 'function',
        getSetMetadata: typeof getSetMetadata === 'function',
        getCardImagePath: typeof getCardImagePath === 'function'
    };

    let missingDeps = [];
    for (const depName in dependencies) {
        if (!dependencies[depName]) {
            missingDeps.push(depName);
        }
    }
    if (missingDeps.length > 0) {
        console.error("Gallery: Missing dependencies:", missingDeps.join(', '));
        const galleryGridErr = document.getElementById('gallery-grid');
        if(galleryGridErr) galleryGridErr.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color:red;">Error: Gallery cannot load due to missing components.</p>';
        return;
    }

    galleryCurrentPage = page;
    const galleryGrid = document.getElementById('gallery-grid');
    if(!galleryGrid) return;
    galleryGrid.innerHTML = '';

    const setSelectorDisplay = document.getElementById('gallery-set-selector-display'); // Updated
    const raritySelector = document.getElementById('gallery-rarity-selector');
    const sortSelector = document.getElementById('gallery-sort');
    if(!setSelectorDisplay || !raritySelector || !sortSelector) {
        console.error("Gallery screen: Set selector display, rarity selector, or sort selector not found.");
        return;
    }

    const selectedSetIdentifier = setSelectorDisplay.dataset.value; // Get value from data attribute
    const selectedRarityString = raritySelector.value;
    const sortBy = sortSelector.value;

    let displayCards = [];
    const activeSetsForGallery = getActiveSetDefinitions(); // Get sets for current version

    activeSetsForGallery.forEach(setDef => { // Iterate only over active sets
        const setAbbr = setDef.abbr;
        if (collection[setAbbr] && (selectedSetIdentifier === 'all' || selectedSetIdentifier === setAbbr)) {
            Object.keys(collection[setAbbr]).forEach(cardIdStr => {
                const cardIdNum = parseInt(cardIdStr);
                const cardData = collection[setAbbr][cardIdNum];

                if (cardData.count > 0) {
                    if (selectedRarityString === 'all' || cardData.rarityKey === selectedRarityString) {
                        displayCards.push({
                            setIdentifier: setAbbr,
                            id: cardIdNum,
                            rarityKey: cardData.rarityKey,
                            displayCount: cardData.count,
                            price: cardData.price,
                            grade: cardData.grade,
                            instanceId: `${setAbbr}-${cardIdNum}-${cardData.rarityKey}-${cardData.grade}-galleryItem`
                        });
                    }
                }
            });
        }
    });

    // Get the numeric ID for sorting if 'default' (by set ID, then card ID)
    const setOrderMap = new Map();
    activeSetsForGallery.forEach((set, index) => setOrderMap.set(set.abbr, set.id));


    switch (sortBy) {
        case 'price-desc': displayCards.sort((a,b)=>b.price-a.price); break;
        case 'price-asc': displayCards.sort((a,b)=>a.price-b.price); break;
        case 'count-desc': displayCards.sort((a,b)=>b.displayCount-a.displayCount); break;
        case 'count-asc': displayCards.sort((a,b)=>a.displayCount-b.displayCount); break;
        default: // Default sort: by set's numeric ID (from active definitions), then card's numeric ID
            displayCards.sort((a,b)=>{
                const aSetNumericId = setOrderMap.get(a.setIdentifier) || Infinity;
                const bSetNumericId = setOrderMap.get(b.setIdentifier) || Infinity;
                if(aSetNumericId !== bSetNumericId) return aSetNumericId - bSetNumericId;
                if(a.id !== b.id) return a.id - b.id;
                return 0;
            });
            break;
    }

    const totalPages = Math.ceil(displayCards.length / CARDS_PER_PAGE);
    const startIndex = (page - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const paginatedCards = displayCards.slice(startIndex, endIndex);

    if (paginatedCards.length === 0) {
        galleryGrid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">No cards found in gallery matching your criteria.</p>';
        renderPaginationControls('gallery-pagination',0,1,showGallery); return;
    }

    paginatedCards.forEach(card => {
        const cardDivContainer = document.createElement('div');
        cardDivContainer.className = 'text-center';

        const img = document.createElement('img');
        img.src = getCardImagePath(card.setIdentifier, card.id); // getCardImagePath uses version-aware getSetMetadata
        const rarityTierInfo = getRarityTierInfo(card.rarityKey);
        const displayNameRarity = rarityTierInfo ? rarityTierInfo.name : card.rarityKey;

        img.alt = `Card ${card.setIdentifier}-C${card.id} (${displayNameRarity})`;
        // Standardized onerror logic
        img.onerror=function(){this.src=`https://placehold.co/${this.naturalWidth||this.width||130}x${this.naturalHeight||this.height||182}/333333/cccccc?text=${encodeURIComponent(this.alt || 'Missing Image')}`; this.onerror=null;};
        img.className = 'gallery-grid-card-image'; // New class for just the image

        const cardWrapper = document.createElement('div');
        cardWrapper.className = `card ${card.rarityKey}`; // This div gets the 'card' and rarity class for effects

        cardWrapper.onclick = () => {
            console.log(`[Gallery] Clicked card: Set=${card.setIdentifier}, ID=${card.id}, Rarity=${card.rarityKey}, Grade=${card.grade}, InstanceID=${card.instanceId}. Attempting to show detail.`);
            if (typeof showCardDetail === 'function') {
                showCardDetail(card.setIdentifier, card.id, card.rarityKey, 'gallery', card.instanceId, card.grade);
            } else {
                console.error("[Gallery] showCardDetail function is not defined!");
            }
        };

        cardWrapper.appendChild(img);
        cardDivContainer.appendChild(cardWrapper); // Append wrapper to the container

        const pInfo = document.createElement('div');
        pInfo.className = 'gallery-card-details';
        const rarityTextClass = `rarity-text-${card.rarityKey}`;
        const cardNameText = `${card.setIdentifier}-C${card.id} <span class="${rarityTextClass}">${displayNameRarity}</span> x${card.displayCount}`;
        pInfo.innerHTML = `${cardNameText}<br><span class="value">${formatCurrency(card.price)}</span>`;
        cardDivContainer.appendChild(pInfo);
        galleryGrid.appendChild(cardDivContainer);
    });
    renderPaginationControls('gallery-pagination', totalPages, page, showGallery);
}
