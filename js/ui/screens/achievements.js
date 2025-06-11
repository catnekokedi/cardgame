
// js/ui/screens/achievements.js (Originally menu-js/achievements.js)

function checkAllAchievements(changedSetAbbrInput) {
    const dependencies = {
        collection: typeof collection !== 'undefined',
        achievements: typeof achievements !== 'undefined',
        getActiveSetDefinitions: typeof getActiveSetDefinitions === 'function', // Use this
        showCustomAlert: typeof showCustomAlert === 'function',
        saveGame: typeof saveGame === 'function',
        updateAchievementsDisplay: typeof updateAchievementsDisplay === 'function',
        getSetMetadata: typeof getSetMetadata === 'function',
        addSummonTickets: typeof addSummonTickets === 'function', 
        getRarityTierInfo: typeof getRarityTierInfo === 'function'
    };
    for (const dep in dependencies) {
        if (!dependencies[dep]) {
            console.error(`checkAllAchievements: Missing dependency: ${dep}`);
            return;
        }
    }

    const changedSetAbbr = changedSetAbbrInput;
    const setMetaOfChangedCard = getSetMetadata(changedSetAbbr);

    // Ensure the changed set belongs to the current active version
    if (!setMetaOfChangedCard || setMetaOfChangedCard.version !== currentActiveSetVersion) {
        // console.log(`Achievement check skipped for set ${changedSetAbbr} as it's not in the active version ${currentActiveSetVersion}.`);
        return;
    }
    
    if (setMetaOfChangedCard.name.startsWith("Unknown Set") || setMetaOfChangedCard.count === 0) {
        console.error(`Achievement Check: Invalid set identifier or set has 0 cards: ${changedSetAbbr}.`);
        return;
    }
    const totalInSet = setMetaOfChangedCard.count;
    const displaySetName = setMetaOfChangedCard.name;

    const achievementRewards = {
        first: { ticketRarity: 'rare', amount: 1, name: "First Card Collected" },
        p10:   { ticketRarity: 'foil', amount: 1, name: "10% Set Completion" },
        p25:   { ticketRarity: 'holo', amount: 1, name: "25% Set Completion" },
        p50:   { ticketRarity: 'rainy',amount: 1, name: "50% Set Completion" },
        p100:  { ticketRarity: 'shiny',amount: 1, name: "100% Set Completion (Master!)" }
    };

    if(collection[changedSetAbbr]){
        const setAchievements = achievements[changedSetAbbr] || {first:false, p10:false, p25:false, p50:false, p100:false};

        let ownedInSet = 0;
        Object.keys(collection[changedSetAbbr]).forEach(cardIdKey => {
            if(collection[changedSetAbbr][cardIdKey].count > 0) ownedInSet++;
        });

        const percentageOwned = totalInSet > 0 ? (ownedInSet / totalInSet) * 100 : 0;

        const grantReward = (achievementKey) => {
            let rewardMessagePart = "";
            const rewardInfo = achievementRewards[achievementKey];
            if (rewardInfo && addSummonTickets && getRarityTierInfo) {
                addSummonTickets(rewardInfo.ticketRarity, rewardInfo.amount);
                const ticketRarityDetails = getRarityTierInfo(rewardInfo.ticketRarity);
                const ticketName = ticketRarityDetails ? ticketRarityDetails.name : rewardInfo.ticketRarity;
                rewardMessagePart = ` You received ${rewardInfo.amount} ${ticketName} Summon Ticket!`;
            }
            showCustomAlert(`Achievement Unlocked (${displaySetName} - ${currentActiveSetVersion.toUpperCase()}): ${rewardInfo.name}!${rewardMessagePart}`, null, 2500);
            if (typeof playSound === 'function') playSound('sfx_achievement_unlocked.mp3');
        };

        if(ownedInSet > 0 && !setAchievements.first){
            setAchievements.first=true;
            grantReward('first');
        }
        if(percentageOwned >= 10 && !setAchievements.p10){
            setAchievements.p10=true;
            grantReward('p10');
        }
        if(percentageOwned >= 25 && !setAchievements.p25){
            setAchievements.p25=true;
            grantReward('p25');
        }
        if(percentageOwned >= 50 && !setAchievements.p50){
            setAchievements.p50=true;
            grantReward('p50');
        }
        if(percentageOwned >= 100 && !setAchievements.p100){
            setAchievements.p100=true;
            grantReward('p100');
        }
        achievements[changedSetAbbr] = setAchievements;
    }

    // Check for "All Sets Complete" for the current version
    let allSetsInCurrentVersionComplete = true;
    const activeSetsForCompletionCheck = getActiveSetDefinitions();
    activeSetsForCompletionCheck.forEach(setDef => {
        if(!achievements[setDef.abbr] || !achievements[setDef.abbr].p100){
            allSetsInCurrentVersionComplete = false;
        }
    });

    if (currentActiveSetVersion === 'v1') {
        if (allSetsInCurrentVersionComplete && !achievements.allV1SetsComplete) {
            achievements.allV1SetsComplete = true;
            showCustomAlert(`MEGA ACHIEVEMENT (${currentActiveSetVersion.toUpperCase()}): All V1 Sets 100% Complete!`, null, 3000);
            if (typeof playSound === 'function') playSound('sfx_achievement_unlocked.mp3');
        }
    } else if (currentActiveSetVersion === 'v2') {
        if (allSetsInCurrentVersionComplete && !achievements.allV2SetsComplete) {
            achievements.allV2SetsComplete = true;
            showCustomAlert(`MEGA ACHIEVEMENT (${currentActiveSetVersion.toUpperCase()}): All V2 Sets 100% Complete!`, null, 3000);
            if (typeof playSound === 'function') playSound('sfx_achievement_unlocked.mp3');
        }
    }
    
    // Update stats, which includes master collector progress for the current version
    if (typeof updateStats === 'function') {
        updateStats();
    }

    saveGame();
    if(typeof document !== 'undefined' && document.getElementById('achievements') && document.getElementById('achievements').style.display==='flex') {
        updateAchievementsDisplay();
    }
}

function updateAchievementsDisplay() {
    if (!isGameInitialized) {
        console.warn("updateAchievementsDisplay called before game is fully initialized.");
        return;
    }
    const dependencies = {
        achievements: typeof achievements !== 'undefined',
        getActiveSetDefinitions: typeof getActiveSetDefinitions === 'function',
        getSetMetadata: typeof getSetMetadata === 'function'
    };
     for (const dep in dependencies) {
        if (!dependencies[dep]) {
            console.error(`updateAchievementsDisplay: Missing dependency: ${dep}`);
            return;
        }
    }

    const achievementListDiv=document.getElementById('achievement-list');
    if (!achievementListDiv) return;
    achievementListDiv.innerHTML='';

    const achievementSetSelectorDisplay = document.getElementById('achievement-set-selector-display');
    if (!achievementSetSelectorDisplay) {
        console.error("Achievement set selector display not found for updating display.");
        return;
    }
    const selectedSetIdentifierString = achievementSetSelectorDisplay.dataset.value;


    const masterCollectorDiv=document.createElement('div');
    masterCollectorDiv.className='achievement-item';
    const currentVersionMasterProgress = currentActiveSetVersion === 'v1' ? achievements.masterCollectorProgressV1 : achievements.masterCollectorProgressV2;
    const isMasterCollectorComplete = currentVersionMasterProgress >= 100;
    
    masterCollectorDiv.innerHTML = `
        <div class="name">Master Collector (${currentActiveSetVersion.toUpperCase()} Sets)</div>
        <div class="progress-bar-container">
            <div class="progress-bar ${isMasterCollectorComplete ? 'full' : ''}" style="width:${currentVersionMasterProgress.toFixed(1)}%;" id="master-collector-progress-bar">${currentVersionMasterProgress.toFixed(1)}%</div>
        </div>
        <div class="status">${isMasterCollectorComplete ? 'COMPLETED!' : 'In Progress'}</div>`;
    if(isMasterCollectorComplete) masterCollectorDiv.classList.add('achieved'); else masterCollectorDiv.classList.add('not-achieved');
    achievementListDiv.appendChild(masterCollectorDiv);

    const allSetsCompleteAchievementDiv = document.createElement('div');
    allSetsCompleteAchievementDiv.className = 'achievement-item';
    const isCurrentVersionAllSetsComplete = currentActiveSetVersion === 'v1' ? achievements.allV1SetsComplete : achievements.allV2SetsComplete;
    allSetsCompleteAchievementDiv.innerHTML = `
        <div class="name">All ${currentActiveSetVersion.toUpperCase()} Sets 100%</div>
        <div class="status">${isCurrentVersionAllSetsComplete ? 'COMPLETED!' : 'Locked'}</div>`;
    if(isCurrentVersionAllSetsComplete) allSetsCompleteAchievementDiv.classList.add('achieved'); else allSetsCompleteAchievementDiv.classList.add('not-achieved');
    achievementListDiv.appendChild(allSetsCompleteAchievementDiv);


    const displayAchievementsForSet=(setAbbr)=>{
        const setAchievementData = achievements[setAbbr] || {first:false,p10:false,p25:false,p50:false,p100:false};
        const setHeader=document.createElement('h3');
        setHeader.className = 'achievement-set-header';
        const meta = getSetMetadata(setAbbr);
        setHeader.textContent = meta ? meta.name : `Set ${setAbbr}`;
        setHeader.style.marginTop = selectedSetIdentifierString === 'all' ? '20px' : '5px';
        setHeader.style.marginBottom = '10px';

        achievementListDiv.appendChild(setHeader);
        const achievementItems=[{name:'First Card Collected',key:'first'},{name:'10% Set Completion',key:'p10'},{name:'25% Set Completion',key:'p25'},{name:'50% Set Completion',key:'p50'},{name:'100% Set Completion (Master!)',key:'p100'},];
        achievementItems.forEach(item=>{const div=document.createElement('div');div.className='achievement-item';const achieved=setAchievementData[item.key];div.innerHTML=`<div class="name">${item.name}</div><div class="status">${achieved?'UNLOCKED':'Locked'}</div>`;div.classList.add(achieved?'achieved':'not-achieved');achievementListDiv.appendChild(div);});
    };

    const activeSetsToDisplay = getActiveSetDefinitions(); 

    if(selectedSetIdentifierString === 'all') {
        activeSetsToDisplay.forEach(setDef => displayAchievementsForSet(setDef.abbr));
    } else {
        if (activeSetsToDisplay.some(s => s.abbr === selectedSetIdentifierString)) {
            displayAchievementsForSet(selectedSetIdentifierString);
        } else {
            achievementListDiv.innerHTML += `<p class="text-center">Selected set is not part of the active ${currentActiveSetVersion.toUpperCase()} version.</p>`;
        }
    }
}
