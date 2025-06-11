
// js/ui/components/filters.js

function populateSetSelectors() {
    if (typeof ALL_SET_DEFINITIONS === 'undefined' || typeof getActiveSetDefinitions !== 'function') {
        console.error("populateSetSelectors: ALL_SET_DEFINITIONS or getActiveSetDefinitions is not available.");
        return;
    }

    const createCustomSelector = (containerElementId, onSelectCallback, isAchievementSelector = false) => {
        const containerElement = document.getElementById(containerElementId);
        if (!containerElement) {
            // console.warn(`Custom selector container #${containerElementId} not found.`);
            return;
        }

        const displayButton = containerElement.querySelector('.custom-select-display');
        const panel = containerElement.querySelector('.custom-select-panel');
        const searchInput = containerElement.querySelector('.custom-select-search');
        const optionsList = containerElement.querySelector('.custom-select-options');

        if (!displayButton || !panel || !searchInput || !optionsList) {
            console.error("Custom selector inner elements not found for", containerElementId);
            return;
        }
        
        const newDisplayButton = displayButton.cloneNode(true);
        displayButton.parentNode.replaceChild(newDisplayButton, displayButton);
        
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);

        const activeSets = getActiveSetDefinitions();

        const populateOptions = (searchTerm = '') => {
            optionsList.innerHTML = '';
            const lowerSearchTerm = searchTerm.toLowerCase();

            const allSetsLi = document.createElement('li');
            allSetsLi.dataset.value = 'all';
            let allSetsText = isAchievementSelector 
                ? `All ${currentActiveSetVersion.toUpperCase()} Sets Progress` 
                : 'All Sets';
            allSetsLi.textContent = allSetsText;
            
            if (searchTerm === '' || allSetsText.toLowerCase().includes(lowerSearchTerm)) {
                 optionsList.appendChild(allSetsLi);
            }

            activeSets.forEach(setDef => {
                if (searchTerm === '' || setDef.name.toLowerCase().includes(lowerSearchTerm) || setDef.abbr.toLowerCase().includes(lowerSearchTerm)) {
                    const li = document.createElement('li');
                    li.dataset.value = setDef.abbr;
                    li.textContent = setDef.name;
                    optionsList.appendChild(li);
                }
            });

            Array.from(optionsList.children).forEach(li => {
                li.addEventListener('click', () => {
                    newDisplayButton.textContent = li.textContent;
                    newDisplayButton.dataset.value = li.dataset.value;
                    panel.style.display = 'none';
                    if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3');
                    if (onSelectCallback) {
                        onSelectCallback();
                    }
                });
            });
        };

        let currentSelectedValue = newDisplayButton.dataset.value || 'all';
        let initialText = isAchievementSelector 
            ? `All ${currentActiveSetVersion.toUpperCase()} Sets Progress` 
            : 'All Sets';

        if (currentSelectedValue !== 'all') {
            const selectedSetDef = activeSets.find(s => s.abbr === currentSelectedValue);
            if (selectedSetDef) {
                initialText = selectedSetDef.name;
            } else {
                currentSelectedValue = 'all'; // Reset to 'all' if saved value is no longer valid for current version
                newDisplayButton.dataset.value = 'all';
            }
        }
        newDisplayButton.textContent = initialText;
        
        newDisplayButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyVisible = panel.style.display === 'block';
            document.querySelectorAll('.custom-select-panel').forEach(p => {
                if (p !== panel) p.style.display = 'none';
            });
            panel.style.display = isCurrentlyVisible ? 'none' : 'block';
            if (panel.style.display === 'block') {
                populateOptions(newSearchInput.value);
                newSearchInput.focus();
                if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3');
            } else {
                if (isCurrentlyVisible && typeof playSound === 'function') playSound('sfx_modal_close.mp3');
            }
        });

        newSearchInput.addEventListener('click', (e) => e.stopPropagation());
        newSearchInput.addEventListener('keyup', () => {
            populateOptions(newSearchInput.value);
        });
        
        populateOptions(); 
    };
    
    // Initialize for Collection screen
    createCustomSelector('set-selector-container', () => { 
        if (typeof showSetCollection === 'function') showSetCollection(1); 
    });

    // Initialize for Gallery screen
    createCustomSelector('gallery-set-selector-container', () => {
        if (typeof showGallery === 'function') showGallery(1);
    });
    
    // Initialize for Achievements screen
    createCustomSelector('achievement-set-selector-container', () => {
        if (typeof updateAchievementsDisplay === 'function') updateAchievementsDisplay();
    }, true); // true indicates it's for achievements

    // Initialize for Pack Selection screen
    createCustomSelector('pack-screen-set-selector-container', () => {
        if (typeof populatePackList === 'function') populatePackList(1);
    });
}


function populateRarityFilters() {
    if (typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined') {
        console.error("populateRarityFilters: RARITY_PACK_PULL_DISTRIBUTION is not available.");
        return;
    }
    const raritySelectors = [
        document.getElementById('rarity-selector'),
        document.getElementById('gallery-rarity-selector'),
    ];

    raritySelectors.forEach(selector => {
        if (!selector) return;

        const originalOnChange = selector.onchange;
        selector.onchange = null; // Temporarily remove to prevent firing during population

        const firstOptionValue = selector.options[0]?.value || 'all';
        const firstOptionText = selector.options[0]?.text || 'All Rarities';
        selector.innerHTML = `<option value="${firstOptionValue}">${firstOptionText}</option>`;

        RARITY_PACK_PULL_DISTRIBUTION.forEach(rarityTier => {
            const option = document.createElement('option');
            option.value = rarityTier.key;
            option.textContent = rarityTier.name;
            selector.appendChild(option);
        });
        selector.onchange = (event) => { // Re-attach original or new logic
            if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3');
            if (originalOnChange) originalOnChange(event);
        };
    });
}

// Global listener to close custom dropdowns
document.addEventListener('click', (event) => {
    let clickedInsideCustomSelect = false;
    document.querySelectorAll('.custom-select-container').forEach(container => {
        if (container.contains(event.target)) {
            clickedInsideCustomSelect = true;
        }
    });

    if (!clickedInsideCustomSelect) {
        document.querySelectorAll('.custom-select-panel').forEach(panel => {
            if (panel.style.display === 'block') {
                panel.style.display = 'none';
                // Consider playing a close sound here if desired, but might be too much.
                // if (typeof playSound === 'function') playSound('sfx_modal_close.mp3');
            }
        });
    }
});
