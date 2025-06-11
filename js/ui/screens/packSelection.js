
// js/ui/screens/packSelection.js (Originally menu-js/selectbooster.js)

function getPackPrice(setAbbrIdentifier) {
    if (typeof getActiveSetDefinitions !== 'function' || typeof ALL_SET_DEFINITIONS === 'undefined' || typeof currentActiveSetVersion === 'undefined') {
        console.warn("getPackPrice: Core dependencies missing. Defaulting to 100.");
        return 100;
    }

    const activeSets = getActiveSetDefinitions(); // Gets sets for currentActiveSetVersion, sorted by ID
    if (activeSets.length === 0) {
        console.warn(`getPackPrice: No active sets found for version ${currentActiveSetVersion}. Defaulting to 100.`);
        return 100;
    }

    const setIndex = activeSets.findIndex(setDef => setDef.abbr === setAbbrIdentifier);

    if (setIndex === -1) {
        // Fallback for a set not in the current active list (shouldn't happen if UI is correct)
        // or if a V2 set was somehow requested while V1 is active, etc.
        const globalSetDef = ALL_SET_DEFINITIONS.find(s => s.abbr === setAbbrIdentifier);
        if (globalSetDef && globalSetDef.version !== currentActiveSetVersion) {
            // If it's a V2 set and V1 is active, or vice-versa, handle with V2 specific logic (or a default)
            // For now, apply general tiering logic or a default if mis-versioned
            console.warn(`getPackPrice: Set ${setAbbrIdentifier} version mismatch with active version ${currentActiveSetVersion}. Applying default tiering logic for safety.`);
             // Re-fetch ALL sets of the specific version of the card for accurate tiering if needed
            const specificVersionSets = ALL_SET_DEFINITIONS.filter(s => s.version === globalSetDef.version).sort((a,b) => a.id - b.id);
            const specificIndex = specificVersionSets.findIndex(s => s.abbr === setAbbrIdentifier);
            const totalSetsInItsVersion = specificVersionSets.length;
            if (specificIndex !== -1 && totalSetsInItsVersion > 0) {
                const segment1End = Math.ceil(totalSetsInItsVersion / 3);
                const segment2End = Math.ceil(2 * totalSetsInItsVersion / 3);
                if (specificIndex < segment1End) return 100;
                if (specificIndex < segment2End) return 250;
                return 500;
            }
        }
        console.warn(`getPackPrice: Set abbreviation ${setAbbrIdentifier} not found in active version ${currentActiveSetVersion}. Defaulting to 100.`);
        return 100; // Default price if set not found in active list
    }

    const totalSetsInActiveVersion = activeSets.length;
    const segment1End = Math.ceil(totalSetsInActiveVersion / 3);
    const segment2End = Math.ceil(2 * totalSetsInActiveVersion / 3);

    if (setIndex < segment1End) {
        return 100;
    } else if (setIndex < segment2End) {
        return 250;
    } else {
        return 500;
    }
}

function populatePackList(page = 1) {
  const packList = document.getElementById('pack-list');
  const paginationContainer = document.getElementById('pack-selection-pagination');

  if (!packList || !paginationContainer) {
    console.error("Pack list or pagination container element not found.");
    return;
  }
  packList.innerHTML = '';
  paginationContainer.innerHTML = ''; 

  if (typeof unlockedSets === 'undefined' || typeof unlockAllPacksCheatActive === 'undefined' || 
      typeof openingpack === 'undefined' || typeof formatCurrency !== 'function' || 
      typeof showCustomAlert !== 'function' || typeof getSetMetadata !== 'function' ||
      typeof getActiveSetDefinitions !== 'function' || typeof PACKS_PER_PAGE === 'undefined' ||
      typeof renderPaginationControls !== 'function') {
    console.error("One or more global dependencies for populatePackList are missing.");
    return;
  }

  packSelectionCurrentPage = page;

  const setSelectorDisplay = document.getElementById('pack-screen-set-selector-display');
  if (!setSelectorDisplay) {
      console.error("Pack selection screen: Set selector display element not found.");
      packList.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">Error: Pack filter UI missing.</p>';
      return;
  }
  const selectedSetIdentifier = setSelectorDisplay.dataset.value;

  let allActivePacksDefinitions = getActiveSetDefinitions(); 
  let filteredPacksToDisplay = [];

  if (selectedSetIdentifier === 'all') {
      filteredPacksToDisplay = allActivePacksDefinitions;
  } else {
      filteredPacksToDisplay = allActivePacksDefinitions.filter(setDef => setDef.abbr === selectedSetIdentifier);
  }


  const totalPages = Math.ceil(filteredPacksToDisplay.length / PACKS_PER_PAGE);
  const startIndex = (packSelectionCurrentPage - 1) * PACKS_PER_PAGE;
  const endIndex = startIndex + PACKS_PER_PAGE;
  const paginatedPacks = filteredPacksToDisplay.slice(startIndex, endIndex);

  if (paginatedPacks.length === 0 && filteredPacksToDisplay.length > 0 && packSelectionCurrentPage > 1) {
    populatePackList(totalPages);
    return;
  }
  if (paginatedPacks.length === 0) {
    packList.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">No packs available for the current selection.</p>';
  }

  paginatedPacks.forEach((setDef) => {
    const setAbbrIdentifier = setDef.abbr;
    const price = getPackPrice(setAbbrIdentifier);
    const isUnlocked = unlockedSets.includes(setAbbrIdentifier) || unlockAllPacksCheatActive;
    const meta = getSetMetadata(setAbbrIdentifier); 

    if (!meta || meta.name.startsWith("Unknown Set")) {
        console.warn(`Skipping pack for unknown set identifier: ${setAbbrIdentifier}`);
        return;
    }

    const packDiv = document.createElement('div');
    packDiv.className = 'pack-container';
    if (!isUnlocked) {
      packDiv.classList.add('locked-pack');
    }
    packDiv.dataset.price = price;
    packDiv.onclick = isUnlocked
      ? () => { openingpack.openPack(setAbbrIdentifier, price); if (typeof playSound === 'function') playSound('sfx_pack_select.mp3'); }
      : () => { showCustomAlert(`${meta.name} is currently locked. Unlock it through gameplay or cheats.`, null, 2500); if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3'); };


    const packName = document.createElement('p');
    packName.className = 'pack-info-text pack-name';
    packName.textContent = meta.name;
    packDiv.appendChild(packName);

    const packImage = document.createElement('img');
    const primaryImage = meta.boosterCoverPath; 
    const defaultImage = `gui/booster_covers/boosterpack.png`;
    const placeholderImage = `https://placehold.co/135x135/42A5F5/FFFFFF?text=${setAbbrIdentifier}`;

    packImage.src = primaryImage;
    packImage.className = 'pack-image';
    packImage.alt = `${meta.name} Pack Art`;
    packImage.onerror = function() {
      this.src = defaultImage;
      this.alt = `${meta.name} (Default Pack Art)`;
      this.onerror = function() {
        this.src = placeholderImage;
        this.alt = `[${meta.name} Art Missing]`;
        this.onerror = null;
      };
    };
    packDiv.appendChild(packImage);

    const packPriceText = document.createElement('p');
    packPriceText.className = 'pack-info-text pack-price';
    if (isUnlocked) {
        packPriceText.innerHTML = `<span class="price">${formatCurrency(price)}</span>`;
    } else {
        packPriceText.innerHTML = `<span class="pack-locked-text">Locked</span>`;
    }
    packDiv.appendChild(packPriceText);
    packList.appendChild(packDiv);
  });

  renderPaginationControls('pack-selection-pagination', totalPages, packSelectionCurrentPage, populatePackList);
}
