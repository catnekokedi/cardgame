
// js/core/rarity-grade-manager.js

// RARITY_PACK_PULL_DISTRIBUTION is defined in js/data/card-rarity-definitions.js
// RARITY_SET_COMPOSITION_DISTRIBUTION is defined in js/data/card-rarity-definitions.js
// Global mappings derived from RARITY_PACK_PULL_DISTRIBUTION
var rarityFilterOrder = []; // Will be populated in initializeRarityAndGradeSystems
var stringToRarityInt = {}; // Will be populated
var intToRarityString = {}; // Will be populated
var fixedCardProperties = {}; // Moved from window.fixedCardProperties to script scope

function updateRarityMappings() {
    if (typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined') {
        rarityFilterOrder = RARITY_PACK_PULL_DISTRIBUTION.map(r => r.key);
        stringToRarityInt = RARITY_PACK_PULL_DISTRIBUTION.reduce((acc, r) => { acc[r.key] = r.level; return acc; }, {});
        intToRarityString = RARITY_PACK_PULL_DISTRIBUTION.reduce((acc, r) => { acc[r.level] = r.key; return acc; }, {});
    } else {
        console.error("updateRarityMappings: RARITY_PACK_PULL_DISTRIBUTION is not defined.");
    }
}


function initializeRarityAndGradeSystems() {
    if (typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined') {
        console.error("CRITICAL: RARITY_PACK_PULL_DISTRIBUTION not found. Odds system cannot initialize properly.");
    }
    if (typeof RARITY_SET_COMPOSITION_DISTRIBUTION === 'undefined') {
        console.error("CRITICAL: RARITY_SET_COMPOSITION_DISTRIBUTION not found. Set composition cannot be initialized properly.");
    }
    updateRarityMappings(); // Populate mappings based on the data file

    if (!initialDefaultRarityPackPullDistribution && typeof RARITY_PACK_PULL_DISTRIBUTION !== 'undefined') {
        initialDefaultRarityPackPullDistribution = JSON.parse(JSON.stringify(RARITY_PACK_PULL_DISTRIBUTION));
    }
    if (!liveRarityPackPullDistribution && typeof initialDefaultRarityPackPullDistribution !== 'undefined') {
        liveRarityPackPullDistribution = JSON.parse(JSON.stringify(initialDefaultRarityPackPullDistribution));
    }

    if (gradeDistribution.length === 0 && typeof originalHardcodedGradeDistribution !== 'undefined') {
        gradeDistribution = JSON.parse(JSON.stringify(originalHardcodedGradeDistribution));
    }
    if (initialDefaultGradeDistribution.length === 0 && typeof originalHardcodedGradeDistribution !== 'undefined') {
         initialDefaultGradeDistribution = JSON.parse(JSON.stringify(originalHardcodedGradeDistribution));
    }

    normalizeProbabilities(initialDefaultGradeDistribution, 'prob');
    normalizeProbabilities(initialDefaultRarityPackPullDistribution, 'packProb');
    normalizeProbabilities(gradeDistribution, 'prob');
    normalizeProbabilities(liveRarityPackPullDistribution, 'packProb');
}


function normalizeProbabilities(distArray, probField = 'prob') {
    if (!Array.isArray(distArray) || distArray.length === 0) return;

    const targetSum = 1.0;
    let currentTotalProb = distArray.reduce((sum, item) => {
        const probValue = parseFloat(item[probField]);
        return sum + (isNaN(probValue) ? 0 : probValue);
    }, 0);

    const epsilon = 0.00001;

    if (Math.abs(currentTotalProb - targetSum) > epsilon && currentTotalProb > 0) {
        const scaleFactor = targetSum / currentTotalProb;
        let cumulativeNormalizedProb = 0;
        for (let i = 0; i < distArray.length; i++) {
            let currentProb = parseFloat(distArray[i][probField]);
            if (isNaN(currentProb)) currentProb = 0;

            let newProb = parseFloat((currentProb * scaleFactor).toFixed(5));
            if (i === distArray.length - 1) {
                newProb = parseFloat((targetSum - cumulativeNormalizedProb).toFixed(5));
            }
            distArray[i][probField] = newProb;
            cumulativeNormalizedProb += newProb;
        }
    } else if (currentTotalProb === 0 && distArray.length > 0) {
        const equalShare = parseFloat((targetSum / distArray.length).toFixed(5));
        let sum = 0;
        for(let i=0; i < distArray.length -1; i++) {
            distArray[i][probField] = equalShare;
            sum += equalShare;
        }
        distArray[distArray.length-1][probField] = parseFloat((targetSum - sum).toFixed(5));
    }

    distArray.forEach(item => {
        if (item[probField] < 0) item[probField] = 0;
    });

    let finalSumCheck = distArray.reduce((sum, item) => sum + item[probField], 0);
    if (Math.abs(finalSumCheck - targetSum) > epsilon && finalSumCheck > 0 && distArray.length > 0) {
        const diff = targetSum - finalSumCheck;
        let tierToAdjust = distArray[0];
        let maxProb = -1;
        for(const tier of distArray){
            if(tier[probField] > maxProb){
                maxProb = tier[probField];
                tierToAdjust = tier;
            }
        }
        if (tierToAdjust) {
             tierToAdjust.probField = parseFloat((tierToAdjust[probField] + diff).toFixed(5));
             if(tierToAdjust[probField] < 0) tierToAdjust[probField] = 0;
        }
    }
}

function adjustProbabilitiesAndPrices() {
    // if (typeof isDebugModeActive === 'undefined') { // INFO
        // console.warn("adjustProbabilitiesAndPrices: isDebugModeActive is not defined. Defaulting to false."); // INFO
    // } // INFO
    if (typeof liveRarityPackPullDistribution === 'undefined' || liveRarityPackPullDistribution === null) {
        console.error("adjustProbabilitiesAndPrices: liveRarityPackPullDistribution not initialized.");
        initializeRarityAndGradeSystems();
    }

    if (isDebugModeActive) {
        if (!originalPackProbsSnapshotDebug) {
            originalPackProbsSnapshotDebug = JSON.parse(JSON.stringify(liveRarityPackPullDistribution));
        }
        const numRarities = liveRarityPackPullDistribution.length;
        const equalProb = numRarities > 0 ? parseFloat((1 / numRarities).toFixed(5)) : 0;

        let sum = 0;
        for (let i=0; i< liveRarityPackPullDistribution.length; i++) {
            if (i < liveRarityPackPullDistribution.length -1) {
                liveRarityPackPullDistribution[i].packProb = equalProb;
                sum += equalProb;
            } else {
                liveRarityPackPullDistribution[i].packProb = parseFloat((1.0 - sum).toFixed(5));
            }
        }
    } else {
        if (originalPackProbsSnapshotDebug) {
            liveRarityPackPullDistribution = JSON.parse(JSON.stringify(originalPackProbsSnapshotDebug));
            originalPackProbsSnapshotDebug = null;
        } else {
             liveRarityPackPullDistribution = JSON.parse(JSON.stringify(initialDefaultRarityPackPullDistribution));
        }
    }
    normalizeProbabilities(liveRarityPackPullDistribution, 'packProb');
}

function _internal_assignGradeAndPrice(intrinsicRarityKey) {
    if (typeof getRarityTierInfo !== 'function' || typeof gradeDistribution === 'undefined' || gradeDistribution.length === 0) {
        console.error("CRITICAL: getRarityTierInfo function or gradeDistribution not available for _internal_assignGradeAndPrice.");
        return { grade: 1, price: 1 };
    }

    const rarityTierInfo = getRarityTierInfo(intrinsicRarityKey);

    if (!rarityTierInfo) {
        console.error(`CRITICAL ERROR in _internal_assignGradeAndPrice: Rarity key "${intrinsicRarityKey}" not found. Defaulting to base values.`);
        const baseTierInfo = getRarityTierInfo('base') || { basePrice: [1,1], key: 'base' };
        const [minBasePriceDefault, maxBasePriceDefault] = baseTierInfo.basePrice;
        let assignedFallbackGradeDetails = gradeDistribution[0];
        return { grade: assignedFallbackGradeDetails.grade, price: Math.round(minBasePriceDefault + (maxBasePriceDefault - minBasePriceDefault) * Math.random()) };
    }

    const [minRarityPrice, maxRarityPrice] = rarityTierInfo.basePrice;
    const rarityPriceRange = maxRarityPrice - minRarityPrice;

    let randomGradeNum = Math.random();
    let cumulativeProb = 0;
    let assignedGradeDetails = gradeDistribution[0];

    for (const gradeTier of gradeDistribution) {
        cumulativeProb += gradeTier.prob;
        if (randomGradeNum < cumulativeProb) {
            assignedGradeDetails = gradeTier;
            break;
        }
    }
    if (randomGradeNum >= cumulativeProb && cumulativeProb < (1.0 - 0.00001) && gradeDistribution.length > 0) {
         assignedGradeDetails = gradeDistribution[gradeDistribution.length -1];
    }

    const priceSegmentMin = minRarityPrice + (rarityPriceRange * assignedGradeDetails.priceMinMult);
    const priceSegmentMax = minRarityPrice + (rarityPriceRange * assignedGradeDetails.priceMaxMult);
    const segmentRange = Math.max(0, priceSegmentMax - priceSegmentMin);

    let cardPrice = priceSegmentMin + (segmentRange * Math.random());
    cardPrice = Math.max(minRarityPrice, Math.min(maxRarityPrice, Math.round(cardPrice)));
    if (isNaN(cardPrice)) {
        console.error("Calculated cardPrice is NaN", {intrinsicRarityKey, rarityTierInfo, assignedGradeDetails, priceSegmentMin, priceSegmentMax});
        cardPrice = minRarityPrice;
    }

    return { grade: assignedGradeDetails.grade, price: cardPrice };
}

function getFixedGradeAndPrice(setAbbrIdentifier, cardIdNum) {
    // console.log(`[RarityManager] getFixedGradeAndPrice called for Set: ${setAbbrIdentifier}, CardID: ${cardIdNum}`); // REMOVED DEBUG
    let intrinsicRarityKey = 'base'; // Default

    if (typeof getCardIntrinsicRarity !== 'function') {
        console.error("[RarityManager] CRITICAL: getCardIntrinsicRarity function not available. Defaulting intrinsicRarity to 'base'.");
        return { grade: 1, price: 1, rarityKey: 'base', name: `${setAbbrIdentifier} Card #${cardIdNum} (Error)` }; // Return a name property for fallback
    }

    intrinsicRarityKey = getCardIntrinsicRarity(setAbbrIdentifier, cardIdNum);
    // console.log(`[RarityManager] Intrinsic Rarity for ${setAbbrIdentifier}#${cardIdNum}: ${intrinsicRarityKey}`); // REMOVED DEBUG

    // fixedCardProperties is now a script-level variable
    if (!fixedCardProperties[setAbbrIdentifier]) {
        fixedCardProperties[setAbbrIdentifier] = {};
    }

    if (fixedCardProperties[setAbbrIdentifier][cardIdNum]) {
        // Name is NOT currently stored in fixedCardProperties. This function doesn't handle names.
        // The name should come from window.cardData[setAbbrIdentifier][cardIdNum].name
        // This log will show that props from cache lack a name.
        // console.log(`[RarityManager] Returning cached props for ${setAbbrIdentifier}#${cardIdNum}:`, fixedCardProperties[setAbbrIdentifier][cardIdNum]); // REMOVED DEBUG
        return fixedCardProperties[setAbbrIdentifier][cardIdNum];
    } else {
        const { grade, price } = _internal_assignGradeAndPrice(intrinsicRarityKey);

        // This function DOES NOT KNOW THE CARD'S SPECIFIC NAME.
        // Card names are not sourced from js/data/card-definitions.js.
        // They would ideally come from a populated window.cardData object, but that's not reliably populated with details.
        // For now, it only returns grade, price, and the actual rarityKey.
        const props = { grade, price, rarityKey: intrinsicRarityKey };

        // Attempt to get name from window.cardData if it happens to be populated for this specific card.
        // This is unlikely for most cards given current system state.
        if (typeof cardData !== 'undefined' && cardData[setAbbrIdentifier] && cardData[setAbbrIdentifier][cardIdNum] && cardData[setAbbrIdentifier][cardIdNum].name) {
            props.name = cardData[setAbbrIdentifier][cardIdNum].name;
        } else {
            // props.name will be undefined. Callers like generateRandomCardForTree are responsible for providing a generic/fallback name.
            // console.warn(`[RarityManager] Specific name not found in cardData for ${setAbbrIdentifier}#${cardIdNum}. Generic name will be used by caller.`); // REMOVED INFO
        }

        fixedCardProperties[setAbbrIdentifier][cardIdNum] = { ...props }; // Cache whatever we have determined.
        // console.log(`[RarityManager] Calculated and cached props for ${setAbbrIdentifier}#${cardIdNum}. Name: ${props.name || 'N/A (expected, to be set by caller)'}. Returning props:`, props); // REMOVED DEBUG
        return props;
    }
}


function getCardIntrinsicRarity(setAbbrIdentifier, cardIdNum) {
    // console.log(`[RarityManager] getCardIntrinsicRarity called for Set: ${setAbbrIdentifier}, CardID: ${cardIdNum}`); // REMOVED DEBUG
    // console.log(`[RarityManager] typeof getSetMetadata: ${typeof getSetMetadata}`); // REMOVED DEBUG
    // Use direct variable access, not window property, as these are top-level consts in their file
    // console.log(`[RarityManager] typeof RARITY_PACK_PULL_DISTRIBUTION: ${typeof RARITY_PACK_PULL_DISTRIBUTION}`); // REMOVED DEBUG
    // console.log(`[RarityManager] typeof RARITY_SET_COMPOSITION_DISTRIBUTION: ${typeof RARITY_SET_COMPOSITION_DISTRIBUTION}`); // REMOVED DEBUG

    if (typeof getSetMetadata !== 'function' || typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined' || typeof RARITY_SET_COMPOSITION_DISTRIBUTION === 'undefined') {
        console.error("[RarityManager] getCardIntrinsicRarity: Missing critical dependencies (getSetMetadata, RARITY_PACK_PULL_DISTRIBUTION, or RARITY_SET_COMPOSITION_DISTRIBUTION).");
        return (RARITY_PACK_PULL_DISTRIBUTION && RARITY_PACK_PULL_DISTRIBUTION[0]?.key) || 'base';
    }

    const setMeta = getSetMetadata(setAbbrIdentifier);
    // console.log(`[RarityManager] Metadata for ${setAbbrIdentifier}:`, setMeta ? JSON.parse(JSON.stringify(setMeta)) : "null/undefined"); // REMOVED DEBUG

    if (!setMeta) {
        // console.warn(`[RarityManager] No metadata found for set ${setAbbrIdentifier}! Returning default rarity.`); // REMOVED INFO (can be spammy)
        return (RARITY_PACK_PULL_DISTRIBUTION && RARITY_PACK_PULL_DISTRIBUTION[0]?.key) || 'base';
    }

    const defaultRarityKey = RARITY_PACK_PULL_DISTRIBUTION[0]?.key || 'base';

    if (setMeta.name.startsWith("Unknown Set") || !setMeta.count || setMeta.count === 0) { // Check setMeta.name after ensuring setMeta exists
        return defaultRarityKey;
    }
    if (cardIdNum < 1 || cardIdNum > setMeta.count) {
        return defaultRarityKey;
    }

    const totalCardsInSet = setMeta.count;
    const sortedCompositionTiers = RARITY_PACK_PULL_DISTRIBUTION.map(pullTier => { // This is the line reported in the error (around 234)
        const compositionTier = RARITY_SET_COMPOSITION_DISTRIBUTION.find(ct => ct.key === pullTier.key);
        return {
            key: pullTier.key,
            level: pullTier.level,
            percentage: compositionTier ? compositionTier.percentage : 0
        };
    }).sort((a, b) => a.level - b.level);

    let assignedCountsDetails = [];

    if (totalCardsInSet >= 25) {
        // New logic for sets with >= 25 cards (guarantee 1 of each rarity)
        let assignedCounts = {};
        let tempRawCounts = {};
        let sumOfRawFlooredCounts = 0;

        // Step 1 & 2: Apply Percentages and distribute remainder from flooring
        sortedCompositionTiers.forEach(tier => {
            const rawCount = tier.percentage * totalCardsInSet;
            tempRawCounts[tier.key] = rawCount;
            assignedCounts[tier.key] = Math.floor(rawCount);
            sumOfRawFlooredCounts += assignedCounts[tier.key];
        });

        let remainderFromFlooring = totalCardsInSet - sumOfRawFlooredCounts;
        const fractionalParts = sortedCompositionTiers.map(tier => ({
            key: tier.key,
            fraction: tempRawCounts[tier.key] - assignedCounts[tier.key]
        })).sort((a, b) => b.fraction - a.fraction);

        for (let i = 0; i < remainderFromFlooring; i++) {
            assignedCounts[fractionalParts[i % fractionalParts.length].key]++;
        }
        
        // Step 3: Enforce "At Least One" Guarantee
        sortedCompositionTiers.forEach(tier => {
            if (assignedCounts[tier.key] < 1) {
                assignedCounts[tier.key] = 1;
            }
        });

        // Step 4 & 5: Adjust 'base' (or common tiers) and ensure final sum and minimums
        let currentSumAfterGuarantee = Object.values(assignedCounts).reduce((a, b) => a + b, 0);
        let adjustmentNeeded = totalCardsInSet - currentSumAfterGuarantee;

        assignedCounts[defaultRarityKey] = (assignedCounts[defaultRarityKey] || 0) + adjustmentNeeded;

        if (assignedCounts[defaultRarityKey] < 1) {
            let shortfall = 1 - assignedCounts[defaultRarityKey];
            assignedCounts[defaultRarityKey] = 1;

            // Reduce shortfall from other tiers, starting from rarest (higher level) or highest current count
            const tiersToAdjustFrom = sortedCompositionTiers
                .filter(t => t.key !== defaultRarityKey)
                .sort((a, b) => b.level - a.level); // Rarest first

            for (const tierToAdjust of tiersToAdjustFrom) {
                if (shortfall <= 0) break;
                const currentTierCount = assignedCounts[tierToAdjust.key];
                const canReduceBy = currentTierCount - 1; // Max reduction while keeping at least 1
                if (canReduceBy > 0) {
                    const reduceAmount = Math.min(shortfall, canReduceBy);
                    assignedCounts[tierToAdjust.key] -= reduceAmount;
                    shortfall -= reduceAmount;
                }
            }
        }
        // One final sum check and dump any remaining difference to base (should be rare)
        let finalSumCheck = Object.values(assignedCounts).reduce((a,b) => a+b, 0);
        if (finalSumCheck !== totalCardsInSet) {
            assignedCounts[defaultRarityKey] += (totalCardsInSet - finalSumCheck);
            if (assignedCounts[defaultRarityKey] < 0) assignedCounts[defaultRarityKey] = 0; // Ultimate safety
        }


        assignedCountsDetails = sortedCompositionTiers.map(tier => ({
            key: tier.key,
            count: assignedCounts[tier.key] || 0 // Ensure count exists
        }));

    } else {
        // Original logic for sets with < 25 cards
        let cumulativeAssignedCount = 0;
        for (let i = 0; i < sortedCompositionTiers.length; i++) {
            const tier = sortedCompositionTiers[i];
            let numCardsForThisTier;

            if (tier.percentage === 0 && tier.key !== defaultRarityKey && i < sortedCompositionTiers.length - 1) {
                numCardsForThisTier = 0;
            } else if (i === sortedCompositionTiers.length - 1) {
                numCardsForThisTier = totalCardsInSet - cumulativeAssignedCount;
            } else {
                numCardsForThisTier = Math.round(totalCardsInSet * tier.percentage);
            }
            numCardsForThisTier = Math.max(0, numCardsForThisTier);

            if (cumulativeAssignedCount + numCardsForThisTier > totalCardsInSet && i < sortedCompositionTiers.length - 1) {
                numCardsForThisTier = totalCardsInSet - cumulativeAssignedCount;
            }
            
            assignedCountsDetails.push({ key: tier.key, count: numCardsForThisTier });
            cumulativeAssignedCount += numCardsForThisTier;
        }
        
        let currentTotalCalculated = assignedCountsDetails.reduce((sum, t) => sum + t.count, 0);
        if (currentTotalCalculated !== totalCardsInSet && assignedCountsDetails.length > 0) {
            const difference = totalCardsInSet - currentTotalCalculated;
            const baseTierIndex = assignedCountsDetails.findIndex(t => t.key === defaultRarityKey);
            const tierToAdjustIndex = baseTierIndex !== -1 ? baseTierIndex : 0;

            if (assignedCountsDetails[tierToAdjustIndex]) {
                 if (assignedCountsDetails[tierToAdjustIndex].count + difference >= 0) {
                     assignedCountsDetails[tierToAdjustIndex].count += difference;
                 } else {
                     assignedCountsDetails[tierToAdjustIndex].count = 0;
                     let remainingDifference = totalCardsInSet - assignedCountsDetails.reduce((sum, t) => sum + t.count, 0);
                     let largestTier = null;
                     for(const tierDetail of assignedCountsDetails) {
                         if (tierDetail.key !== assignedCountsDetails[tierToAdjustIndex].key) {
                             if (!largestTier || tierDetail.count > largestTier.count) {
                                 largestTier = tierDetail;
                             }
                         }
                     }
                     if (largestTier) {
                         largestTier.count += remainingDifference;
                         if (largestTier.count < 0) largestTier.count = 0;
                     }
                     let finalSum = assignedCountsDetails.reduce((sum, t) => sum + t.count, 0);
                     if (finalSum !== totalCardsInSet && assignedCountsDetails[0]) {
                        assignedCountsDetails[0].count += (totalCardsInSet - finalSum);
                        if(assignedCountsDetails[0].count < 0) assignedCountsDetails[0].count = 0;
                     }
                 }
            } else if (assignedCountsDetails.length > 0) {
                assignedCountsDetails[0].count += difference;
                if (assignedCountsDetails[0].count < 0) assignedCountsDetails[0].count = 0;
            }
        }
    }

    // Determine rarity based on calculated counts
    let cardIndexBoundary = 0;
    for (const tierDetail of assignedCountsDetails) {
        if (tierDetail.count === 0) continue;
        const tierStart = cardIndexBoundary + 1;
        const tierEnd = cardIndexBoundary + tierDetail.count;
        if (cardIdNum >= tierStart && cardIdNum <= tierEnd) {
            return tierDetail.key;
        }
        cardIndexBoundary = tierEnd;
    }
    return defaultRarityKey; 
}

function getRarityTierInfo(rarityIdentifier) {
    // Use direct variable access
    if (typeof RARITY_PACK_PULL_DISTRIBUTION === 'undefined') {
        // This console.error is critical and should remain.
        console.error("[RarityManager] getRarityTierInfo: RARITY_PACK_PULL_DISTRIBUTION is undefined.");
        return null;
    }
    if (typeof rarityIdentifier === 'string') {
        return RARITY_PACK_PULL_DISTRIBUTION.find(tier => tier.key === rarityIdentifier) || null;
    } else if (typeof rarityIdentifier === 'number') {
        return RARITY_PACK_PULL_DISTRIBUTION.find(tier => tier.level === rarityIdentifier) || null;
    }
    return null;
}
