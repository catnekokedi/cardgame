
// js/ui/screens/rarityOddsScreen.js (Originally menu-js/rarityodds.js)

function showRarityOddsScreen() {
    if (typeof liveRarityPackPullDistribution === 'undefined' || liveRarityPackPullDistribution === null ||
        typeof gradeDistribution === 'undefined' || gradeDistribution.length === 0) {
        console.error("Rarity/Grade distributions not initialized. Attempting to initialize for Rarity Odds screen.");
        if (typeof initializeRarityAndGradeSystems === 'function') {
            initializeRarityAndGradeSystems();
        } else {
            console.error("CRITICAL: initializeRarityAndGradeSystems is not defined. Rarity Odds screen cannot function.");
            const oddsInfoContainer = document.getElementById('odds-info-display-container');
            if (oddsInfoContainer) oddsInfoContainer.innerHTML = "<p style='color:red;'>Error: Rarity data not loaded.</p>";
            return;
        }
    }

    displayCurrentOddsInfo();
    if (rarityOddsConfigUnlocked) {
        document.getElementById('odds-config-unlock-section').style.display = 'none';
        document.getElementById('odds-config-panel').style.display = 'flex';
        populateOddsConfigPanel();
    } else {
        document.getElementById('odds-config-unlock-section').style.display = 'flex';
        document.getElementById('odds-config-panel').style.display = 'none';
        document.getElementById('odds-config-password').value = '';
    }

    const unlockButton = document.getElementById('unlock-odds-config-btn');
    if (unlockButton) unlockButton.onclick = handleUnlockOddsConfig;

    const saveButton = document.getElementById('save-odds-btn');
    if (saveButton) saveButton.onclick = saveOddsSettings;

    const makeDefaultButton = document.getElementById('make-default-odds-btn');
    if (makeDefaultButton) makeDefaultButton.onclick = makeCurrentOddsDefault;

    const resetButton = document.getElementById('reset-odds-btn');
    if (resetButton) resetButton.onclick = resetOddsToCurrentDefault;
}

function displayCurrentOddsInfo() {
    const gradeTableBody = document.getElementById('grade-info-table')?.getElementsByTagName('tbody')[0];
    const rarityProbTableBody = document.getElementById('rarity-prob-info-table')?.getElementsByTagName('tbody')[0];

    const sourceGradeDist = gradeDistribution;
    const sourceRarityDist = liveRarityPackPullDistribution;

    if (gradeTableBody) {
        gradeTableBody.innerHTML = '';
        sourceGradeDist.forEach(g => {
            const row = gradeTableBody.insertRow();
            row.insertCell().textContent = g.grade;
            row.insertCell().textContent = (g.prob * 100).toFixed(2);
            row.insertCell().textContent = g.priceMinMult.toFixed(2);
            row.insertCell().textContent = g.priceMaxMult.toFixed(2);
        });
    }

    if (rarityProbTableBody && sourceRarityDist) {
        rarityProbTableBody.innerHTML = '';
        sourceRarityDist.forEach(tier => {
            const row = rarityProbTableBody.insertRow();
            row.insertCell().textContent = tier.name;
            row.insertCell().textContent = (tier.packProb * 100).toFixed(2);
            row.insertCell().textContent = formatCurrency(tier.basePrice[0]);
            row.insertCell().textContent = formatCurrency(tier.basePrice[1]);
        });
    }
}

function handleUnlockOddsConfig() {
    const passwordInput = document.getElementById('odds-config-password');
    if (passwordInput.value === "aymon") { // Password updated here
        rarityOddsConfigUnlocked = true;
        showRarityOddsScreen();
        showCustomAlert("Configuration panel unlocked!", null, 1500);
        if (typeof saveGame === 'function') saveGame();
    } else {
        showCustomAlert("Incorrect password.", null, 2000);
    }
    passwordInput.value = '';
}

function populateOddsConfigPanel() {
    const gradeConfigTableBody = document.getElementById('grade-config-table')?.getElementsByTagName('tbody')[0];
    const rarityProbConfigTableBody = document.getElementById('rarity-prob-config-table')?.getElementsByTagName('tbody')[0];

    const sourceGradeDist = gradeDistribution;
    const sourceRarityDist = liveRarityPackPullDistribution;

    if (gradeConfigTableBody) {
        gradeConfigTableBody.innerHTML = '';
        sourceGradeDist.forEach((g, index) => {
            const row = gradeConfigTableBody.insertRow();
            row.insertCell().textContent = g.grade;
            row.insertCell().appendChild(createConfigInput(`grade-prob-${index}`, (g.prob * 100).toFixed(2), 'number', 0, 100, 0.01, updateGradeProbSum));
            row.insertCell().appendChild(createConfigInput(`grade-minmult-${index}`, g.priceMinMult.toFixed(2), 'number', 0.01, 10, 0.01));
            row.insertCell().appendChild(createConfigInput(`grade-maxmult-${index}`, g.priceMaxMult.toFixed(2), 'number', 0.01, 10, 0.01));
        });
        updateGradeProbSum();
    }

    if (rarityProbConfigTableBody && sourceRarityDist) {
        rarityProbConfigTableBody.innerHTML = '';
        sourceRarityDist.forEach(tier => {
            const row = rarityProbConfigTableBody.insertRow();
            row.insertCell().textContent = tier.name;
            row.insertCell().appendChild(createConfigInput(`rarity-prob-${tier.key}`, (tier.packProb * 100).toFixed(2), 'number', 0, 100, 0.01, updateRarityProbSum));
            row.insertCell().appendChild(createConfigInput(`rarity-config-minprice-${tier.key}`, tier.basePrice[0], 'number', 0, 10000000, 1));
            row.insertCell().appendChild(createConfigInput(`rarity-config-maxprice-${tier.key}`, tier.basePrice[1], 'number', 0, 10000000, 1));
        });
        updateRarityProbSum();
    }
}

function createConfigInput(id, value, type = 'number', min, max, step, eventListener = null) {
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.value = value;
    if (type === 'number') {
        if (min !== undefined) input.min = min;
        if (max !== undefined) input.max = max;
        if (step !== undefined) input.step = step;
    }
    input.className = 'config-input';
    if (eventListener) {
        input.addEventListener('input', eventListener);
        input.addEventListener('change', eventListener);
    }
    return input;
}

function updateGradeProbSum() {
    let sum = 0;
    gradeDistribution.forEach((g, index) => {
        const input = document.getElementById(`grade-prob-${index}`);
        if (input) sum += parseFloat(input.value) || 0;
    });
    const sumDisplay = document.getElementById('grade-prob-sum-config');
    if (sumDisplay) {
        sumDisplay.textContent = `(Sum: ${sum.toFixed(2)}%)`;
        sumDisplay.style.color = Math.abs(sum - 100) > 0.01 ? 'var(--material-error)' : 'var(--material-primary)';
    }
}

function updateRarityProbSum() {
    let sum = 0;
    liveRarityPackPullDistribution.forEach(tier => {
        const input = document.getElementById(`rarity-prob-${tier.key}`);
        if (input) sum += parseFloat(input.value) || 0;
    });
    const sumDisplay = document.getElementById('rarity-prob-sum-config');
    if (sumDisplay) {
        sumDisplay.textContent = `(Sum: ${sum.toFixed(2)}%)`;
        sumDisplay.style.color = Math.abs(sum - 100) > 0.01 ? 'var(--material-error)' : 'var(--material-primary)';
    }
}

function saveOddsSettings() {
    try {
        let gradeProbSum = 0;
        const newGradeDistribution = gradeDistribution.map((g, index) => {
            const prob = parseFloat(document.getElementById(`grade-prob-${index}`).value);
            const minMult = parseFloat(document.getElementById(`grade-minmult-${index}`).value);
            const maxMult = parseFloat(document.getElementById(`grade-maxmult-${index}`).value);
            if (isNaN(prob) || prob < 0 || isNaN(minMult) || minMult < 0 || isNaN(maxMult) || maxMult < 0) throw new Error("Grade values cannot be negative.");
            if (minMult > maxMult) throw new Error(`Grade ${g.grade}: Min Multiplier cannot exceed Max.`);
            gradeProbSum += prob;
            return { ...g, prob: prob / 100, priceMinMult: minMult, priceMaxMult: maxMult };
        });

        if (Math.abs(gradeProbSum - 100) > 0.015) {
            showCustomAlert(`Grade probabilities must sum to 100%. Current sum: ${gradeProbSum.toFixed(2)}%`); return;
        }

        let rarityProbSum = 0;
        const newLiveRarityPackPullDistribution = liveRarityPackPullDistribution.map(tier => {
            const prob = parseFloat(document.getElementById(`rarity-prob-${tier.key}`).value);
            const minPrice = parseInt(document.getElementById(`rarity-config-minprice-${tier.key}`).value);
            const maxPrice = parseInt(document.getElementById(`rarity-config-maxprice-${tier.key}`).value);
            if (isNaN(prob) || prob < 0 || isNaN(minPrice) || minPrice < 0 || isNaN(maxPrice) || maxPrice < 0) throw new Error("Rarity values cannot be negative.");
            if (minPrice > maxPrice) throw new Error(`Rarity ${tier.name}: Min Price cannot exceed Max.`);
            rarityProbSum += prob;
            return { ...tier, packProb: prob / 100, basePrice: [minPrice, maxPrice] };
        });

        if (Math.abs(rarityProbSum - 100) > 0.015) {
            showCustomAlert(`Rarity pack probabilities must sum to 100%. Current sum: ${rarityProbSum.toFixed(2)}%`); return;
        }

        gradeDistribution = newGradeDistribution;
        liveRarityPackPullDistribution = newLiveRarityPackPullDistribution;

        normalizeProbabilities(gradeDistribution, 'prob');
        normalizeProbabilities(liveRarityPackPullDistribution, 'packProb');

        showCustomAlert("Settings saved successfully!", null, 1500);
        displayCurrentOddsInfo();
        rarityOddsConfigUnlocked = false;
        showRarityOddsScreen();

        if (typeof adjustProbabilitiesAndPrices === 'function') adjustProbabilitiesAndPrices();
        if (typeof saveGame === 'function') saveGame();

    } catch (error) {
        console.error("Error saving odds settings:", error);
        showCustomAlert(`Error: ${error.message || "Invalid input."}`);
    }
}

function makeCurrentOddsDefault() {
    showCustomConfirm("Are you sure you want to set the current LIVE configuration as the NEW DEFAULT odds and prices? This will change what 'Reset to Default' does.", () => {
        try {
            let gradeProbSum = gradeDistribution.reduce((sum, g) => sum + g.prob, 0);
            if (Math.abs(gradeProbSum - 1.0) > 0.001) {
                 showCustomAlert("Cannot set as default: Current live grade probabilities do not sum to 100%."); return;
            }
            for(const g of gradeDistribution) {
                if (g.priceMinMult > g.priceMaxMult) { showCustomAlert(`Cannot set as default: Grade ${g.grade} Min mult > Max mult.`); return;}
            }

            let rarityProbSum = liveRarityPackPullDistribution.reduce((sum, r) => sum + r.packProb, 0);
            if (Math.abs(rarityProbSum - 1.0) > 0.001) {
                 showCustomAlert("Cannot set as default: Current live rarity probabilities do not sum to 100%."); return;
            }
             for(const r of liveRarityPackPullDistribution) {
                if (r.basePrice[0] > r.basePrice[1]) { showCustomAlert(`Cannot set as default: Rarity ${r.name} Min price > Max price.`); return;}
            }

            initialDefaultGradeDistribution = JSON.parse(JSON.stringify(gradeDistribution));
            initialDefaultRarityPackPullDistribution = JSON.parse(JSON.stringify(liveRarityPackPullDistribution));

            normalizeProbabilities(initialDefaultGradeDistribution, 'prob');
            normalizeProbabilities(initialDefaultRarityPackPullDistribution, 'packProb');

            showCustomAlert("Current settings have been saved as the new defaults!", null, 2000);
            if (typeof saveGame === 'function') saveGame();

        } catch (error) {
            console.error("Error making current odds default:", error);
            showCustomAlert(`Error: ${error.message || "Could not set new defaults."}`);
        }
    });
}

function resetOddsToCurrentDefault() {
    showCustomConfirm("Are you sure you want to reset the current live odds and prices to your saved defaults?", () => {
        gradeDistribution = JSON.parse(JSON.stringify(initialDefaultGradeDistribution));
        liveRarityPackPullDistribution = JSON.parse(JSON.stringify(initialDefaultRarityPackPullDistribution));

        normalizeProbabilities(gradeDistribution, 'prob');
        normalizeProbabilities(liveRarityPackPullDistribution, 'packProb');

        showCustomAlert("Live odds and prices reset to current defaults.", null, 1500);
        displayCurrentOddsInfo();
        if (rarityOddsConfigUnlocked) populateOddsConfigPanel();

        if (typeof adjustProbabilitiesAndPrices === 'function') adjustProbabilitiesAndPrices();
        if (typeof saveGame === 'function') saveGame();
    });
}
