
// js/idle-exhibition/ie-main.js

const idleExhibition = {
    isActive: false,
    gameLoopIntervalId: null,
    uiUpdateIntervalId: null, 

    startIdleExhibitionGame(gameContentEl, gameResultEl) {
        this.isActive = true;
        idleExhibitionUI.init(gameContentEl);
        idleExhibitionState.lastPlayerVisitTimestamp = Date.now();
        
        idleExhibitionState.lastTrueGameTimeUpdateTimestamp = Date.now();
        idleExhibitionState.inGameTimeHoursAtLastTrueUpdate = idleExhibitionState.inGameTimeHours;
        idleExhibitionState.inGameDayAtLastTrueUpdate = idleExhibitionState.inGameDay;

        this.runUpdateLoop(); 
        if (this.gameLoopIntervalId === null) {
            this.gameLoopIntervalId = setInterval(() => this.runUpdateLoop(), 1000 * 5); 
        }

        if (this.uiUpdateIntervalId === null) {
            this.uiUpdateIntervalId = setInterval(() => {
                if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
                    const now = Date.now();
                    const realMillisSinceLastTrueUpdate = now - idleExhibitionState.lastTrueGameTimeUpdateTimestamp;
                    const additionalGameHoursForDisplay = (realMillisSinceLastTrueUpdate / (1000 * 60)) / idleExhibitionConfig.REAL_MINUTES_PER_GAME_DAY * 24;
                    
                    let displayHours = idleExhibitionState.inGameTimeHoursAtLastTrueUpdate + additionalGameHoursForDisplay;
                    let displayDay = idleExhibitionState.inGameDayAtLastTrueUpdate;

                    while(displayHours >= 24){
                        displayHours -= 24;
                        displayDay++;
                    }
                    idleExhibitionUI.updateGameTimeDisplay(displayDay, displayHours);
                }
            }, 1000);
        }

        console.log("Idle Exhibition Started. Current In-Game Time: Day " + idleExhibitionState.inGameDay + ", " + Math.floor(idleExhibitionState.inGameTimeHours) + ":00");
        idleExhibitionUI.updateIncomeDisplay();
        idleExhibitionUI.updateGameTimeDisplay(idleExhibitionState.inGameDay, idleExhibitionState.inGameTimeHours); 
    },

    stopIdleExhibitionGame() {
        this.isActive = false;
        if (this.gameLoopIntervalId !== null) {
            clearInterval(this.gameLoopIntervalId);
            this.gameLoopIntervalId = null;
        }
        if (this.uiUpdateIntervalId !== null) {
            clearInterval(this.uiUpdateIntervalId);
            this.uiUpdateIntervalId = null;
        }
        console.log("Idle Exhibition Stopped");
    },

    runUpdateLoop() {
        const miniGameAreaVisible = document.getElementById('mini-game-content-active')?.style.display === 'flex';
        if (!this.isActive || currentMiniGame !== SCREENS.IDLE_EXHIBITION || !miniGameAreaVisible) {
            if (this.gameLoopIntervalId !== null || this.uiUpdateIntervalId !== null) {
                this.stopIdleExhibitionGame();
            }
            return;
        }

        const now = Date.now();
        const deltaTimeMs = now - idleExhibitionState.lastUpdateTime;
        idleExhibitionState.lastUpdateTime = now;

        if (deltaTimeMs <= 0) return; 

        const realMinutesElapsedSinceLastUpdate = deltaTimeMs / (1000 * 60);
        const gameDaysElapsedThisTick = realMinutesElapsedSinceLastUpdate / idleExhibitionConfig.REAL_MINUTES_PER_GAME_DAY;
        
        idleExhibitionState.inGameTimeHours += gameDaysElapsedThisTick * 24;
        
        let daysPassedThisLoop = 0;
        let cleanlinessChangedThisLoop = false;
        while (idleExhibitionState.inGameTimeHours >= 24) {
            idleExhibitionState.inGameTimeHours -= 24;
            idleExhibitionState.inGameDay++;
            daysPassedThisLoop++;
            const previousCleanlinessStates = idleExhibitionState.exhibitedCards.map(s => s ? s.cleanliness : null);
            this.applyDailyMaintenanceDegradation();
            // Auto-cleaner logic
            if (idleExhibitionState.autoCleanLevel > 0 && idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES[idleExhibitionState.autoCleanLevel]) {
                const autoCleanConfig = idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES[idleExhibitionState.autoCleanLevel];
                idleExhibitionState.gameMinutesSinceLastAutoClean += gameDaysElapsedThisTick * 24 * 60; // Convert game days elapsed to game minutes
                
                while (idleExhibitionState.gameMinutesSinceLastAutoClean >= autoCleanConfig.cleanFrequencyMinutes) {
                    idleExhibitionState.gameMinutesSinceLastAutoClean -= autoCleanConfig.cleanFrequencyMinutes;
                    idleExhibitionState.exhibitedCards.forEach(slot => {
                        if (slot && slot.card && slot.cleanliness < 100) {
                            slot.cleanliness = Math.min(100, (slot.cleanliness || 0) + autoCleanConfig.cleanAmountPerTick);
                            cleanlinessChangedThisLoop = true; 
                        }
                    });
                }
            }
            idleExhibitionState.exhibitedCards.forEach((s, idx) => {
                if (s && previousCleanlinessStates[idx] !== null && s.cleanliness !== previousCleanlinessStates[idx]) {
                    cleanlinessChangedThisLoop = true;
                }
            });
        }
        
        idleExhibitionState.exhibitedCards.forEach(slot => {
            if (slot && slot.card) {
                const C_norm = (slot.cleanliness || 0) / 100; // Normalized cleanliness (0-1)
                const DF = idleExhibitionConfig.INCOME_REDUCTION_DIRTY_FACTOR;
                // effectiveCleanlinessMultiplier: 1.0 at 100% clean, (1-DF) at 0% clean
                const effectiveCleanlinessMultiplier = (1 - DF) + C_norm * DF;
                
                const incomeThisTick = (slot.incomeRate * (deltaTimeMs / (1000 * 60))) * effectiveCleanlinessMultiplier;
                slot.accruedIncome = (slot.accruedIncome || 0) + incomeThisTick;
            }
        });
        idleExhibitionState.totalAccruedIncome = idleExhibitionState.exhibitedCards.reduce((sum, slot) => {
            return sum + (slot && slot.accruedIncome ? slot.accruedIncome : 0);
        }, 0);

        idleExhibitionState.lastTrueGameTimeUpdateTimestamp = now;
        idleExhibitionState.inGameTimeHoursAtLastTrueUpdate = idleExhibitionState.inGameTimeHours;
        idleExhibitionState.inGameDayAtLastTrueUpdate = idleExhibitionState.inGameDay;

        if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && miniGameAreaVisible) {
            idleExhibitionUI.updateIncomeDisplay();
            idleExhibitionUI.updateGameTimeDisplay(idleExhibitionState.inGameDay, idleExhibitionState.inGameTimeHours); 
            if (daysPassedThisLoop > 0 || cleanlinessChangedThisLoop) { 
                idleExhibitionUI.renderSlots();
            }
        }
        
        if(typeof saveGame === 'function') saveGame();
    },

    applyDailyMaintenanceDegradation() {
        idleExhibitionState.exhibitedCards.forEach(slot => {
            if (slot && slot.card) {
                slot.cleanliness = Math.max(0, (slot.cleanliness || 0) - idleExhibitionConfig.CLEANLINESS_DEGRADATION_RATE_PER_GAME_DAY);
            }
        });
    },

    cleanCardInSlot(slotId) {
        const slot = idleExhibitionState.exhibitedCards[slotId];
        if (slot && slot.card) {
            const broomEffectiveness = (idleExhibitionConfig.IE_BROOM_UPGRADES[idleExhibitionState.broomLevel || 0]?.cleanEffectiveness) || 1.0;
            const cleanAmount = 25 * broomEffectiveness; 
            slot.cleanliness = Math.min(100, (slot.cleanliness || 0) + cleanAmount);
            slot.lastCleanedTimestamp = Date.now();

            if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
                idleExhibitionUI.renderSlots(); 
                idleExhibitionUI.updateIncomeDisplay(); 
            }
            if(typeof saveGame === 'function') saveGame();
            showCustomAlert(`Card in slot ${slotId + 1} cleaned! New cleanliness: ${slot.cleanliness.toFixed(0)}%`, null, 1200);
        }
    },

    tryExhibitCard(set, id, rarityKey, grade, price, galleryInstanceIdFromGallery) {
        const emptySlotIndex = idleExhibitionState.exhibitedCards.findIndex((slot, index) => 
            index < idleExhibitionState.unlockedSlotsCount && slot === null
        );

        if (emptySlotIndex === -1) {
            showCustomAlert("No empty slots available in your exhibition.");
            return;
        }

        if (this.isCardTypeExhibited(set, id)) {
            showCustomAlert(`Card ${set}C${id} is already on exhibition.`);
            return;
        }
        
        const cardData = {
            set, id, rarityKey, grade, price,
            instanceId: galleryInstanceIdFromGallery || `exhibit-${set}C${id}-${Date.now()}`,
            imagePath: getCardImagePath(set, id)
        };

        const incomeRate = this.calculateCardIncomeRate(cardData, emptySlotIndex);

        idleExhibitionState.exhibitedCards[emptySlotIndex] = {
            slotId: emptySlotIndex,
            card: cardData,
            incomeRate: incomeRate,
            cleanliness: 100,
            lastCleanedTimestamp: Date.now(),
            lastCollectedTimestamp: Date.now(),
            accruedIncome: 0
        };
        
        showCustomAlert(`${cardData.set}C${cardData.id} is now on exhibition!`, null, 1500);
        if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
            idleExhibitionUI.renderSlots();
            idleExhibitionUI.updateIncomeDisplay();
        }
        if (typeof saveGame === 'function') saveGame();
        
    },

    isCardTypeExhibited(setAbbr, cardIdNum) {
        if (!idleExhibitionState.exhibitedCards || idleExhibitionState.exhibitedCards.length === 0) {
            return false;
        }
        return idleExhibitionState.exhibitedCards.some(slot =>
            slot && slot.card &&
            slot.card.set.toLowerCase() === setAbbr.toLowerCase() && 
            parseInt(slot.card.id) === parseInt(cardIdNum)
        );
    },

    removeCardFromExhibition(slotId) {
        const slotBeingRemoved = idleExhibitionState.exhibitedCards[slotId];
        if (slotBeingRemoved && slotBeingRemoved.card) {
            this.collectIncomeForSlot(slotId, true); 

            idleExhibitionState.totalAccruedIncome = Math.max(0, idleExhibitionState.totalAccruedIncome - (slotBeingRemoved.accruedIncome || 0));
            idleExhibitionState.exhibitedCards[slotId] = null;
            
            if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
                idleExhibitionUI.renderSlots();
                idleExhibitionUI.updateIncomeDisplay();
            }
            if(typeof saveGame === 'function') saveGame();
            showCustomAlert("Card removed from exhibition.", null, 1000);
        }
    },
    
    calculateCardIncomeRate(card, slotId) { 
        let rate = idleExhibitionConfig.INCOME_BASE_PER_MINUTE;
        rate += idleExhibitionConfig.RARITY_INCOME_BONUS[card.rarityKey] || 0;
        rate *= idleExhibitionConfig.GRADE_INCOME_MULTIPLIER[card.grade] || 1;
        rate += card.price * idleExhibitionConfig.PRICE_INCOME_FACTOR;

        const setMeta = getSetMetadata(card.set);
        if (setMeta && setMeta.count > 0) { 
            rate *= idleExhibitionConfig.SET_SIZE_INCOME_FACTOR(setMeta.count);
        }
        
        const visualTierIndex = idleExhibitionState.slotVisualTiers[slotId] || 0;
        const visualUpgrade = idleExhibitionConfig.SLOT_VISUAL_UPGRADES[visualTierIndex];
        if (visualUpgrade && visualUpgrade.incomeBoost) {
            rate *= visualUpgrade.incomeBoost;
        }

        return Math.max(0.01, parseFloat(rate.toFixed(4))); 
    },

    collectIncomeForSlot(slotId, silent = false) {
        const slot = idleExhibitionState.exhibitedCards[slotId];
        if (slot && slot.card && slot.accruedIncome > 0) {
            const incomeCollected = Math.floor(slot.accruedIncome);
            if (incomeCollected > 0) {
                balance += incomeCollected;
                slot.accruedIncome -= incomeCollected; 
                slot.lastCollectedTimestamp = Date.now();
            
                if (!silent) {
                    showCustomAlert(`Collected ${formatCurrency(incomeCollected)} from ${slot.card.set}C${slot.card.id}.`, null, 1000);
                }
                updateBalance(); 
            }
        }
    },

    collectAllIncome() {
        const rawTotalAccruedFromSlots = idleExhibitionState.exhibitedCards.reduce((sum, slot) => {
            return sum + (slot && slot.card && slot.accruedIncome > 0 ? slot.accruedIncome : 0);
        }, 0);

        const amountToCollectAndDisplay = Math.floor(rawTotalAccruedFromSlots);

        if (amountToCollectAndDisplay > 0) {
            balance += amountToCollectAndDisplay; 

            idleExhibitionState.exhibitedCards.forEach((slot) => {
                if (slot && slot.card && slot.accruedIncome > 0) {
                    slot.accruedIncome = 0; 
                    slot.lastCollectedTimestamp = Date.now();
                }
            });
            idleExhibitionState.totalAccruedIncome = 0;


            showCustomAlert(`Collected a total of ${formatCurrency(amountToCollectAndDisplay)} from all exhibited cards!`, null, 2000);
            updateBalance(); 

            if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
                 idleExhibitionUI.updateIncomeDisplay(); 
            }
            if(typeof saveGame === 'function') saveGame();
        } else {
            showCustomAlert("No income to collect at the moment.", null, 1500);
        }
    },

    tryUnlockSlot(slotIdToUnlock) {
        if (idleExhibitionState.unlockedSlotsCount >= idleExhibitionConfig.MAX_SLOTS) {
            showCustomAlert("All exhibition slots are already unlocked!");
            return;
        }
        if (slotIdToUnlock !== idleExhibitionState.unlockedSlotsCount) {
            showCustomAlert("You must unlock previous slots first.");
            return;
        }

        const cost = idleExhibitionConfig.SLOT_UNLOCK_COSTS[slotIdToUnlock];
        if (balance >= cost) {
            balance -= cost;
            if (typeof moneySpent !== 'undefined') moneySpent += cost; 
            idleExhibitionState.unlockedSlotsCount++;
            updateBalance();
            showCustomAlert(`Exhibition Slot ${idleExhibitionState.unlockedSlotsCount} unlocked!`, null, 1500);
             if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
                idleExhibitionUI.renderSlots();
                if (idleExhibitionUI.upgradeModalEl && idleExhibitionUI.upgradeModalEl.style.display === 'flex') {
                    idleExhibitionUI.renderUpgradePanelContent();
                }
            }
            if(typeof saveGame === 'function') saveGame();
        } else {
            showCustomAlert(`Not enough Toki to unlock new slot. Cost: ${formatCurrency(cost)}`);
        }
    },
    
    tryPurchaseSlotVisualUpgrade(slotId) {
        const currentTierIndex = idleExhibitionState.slotVisualTiers[slotId] || 0;
        const nextTierIndex = currentTierIndex + 1;

        if (!idleExhibitionConfig.SLOT_VISUAL_UPGRADES || idleExhibitionConfig.SLOT_VISUAL_UPGRADES.length === 0) {
            showCustomAlert("Error: Slot visual upgrade configuration is missing.");
            return;
        }
        if (nextTierIndex >= idleExhibitionConfig.SLOT_VISUAL_UPGRADES.length) {
            showCustomAlert("This slot is already at its maximum visual tier.", null, 1500);
            return;
        }

        const upgradeToPurchase = idleExhibitionConfig.SLOT_VISUAL_UPGRADES[nextTierIndex];
        if (!upgradeToPurchase) {
            showCustomAlert("Error: Upgrade configuration missing for this tier.");
            return;
        }
        
        if (typeof upgradeToPurchase.cost !== 'number' || isNaN(upgradeToPurchase.cost)) {
            showCustomAlert("Error: Upgrade cost is invalid for this tier.");
            return;
        }

        if (balance >= upgradeToPurchase.cost) {
            balance -= upgradeToPurchase.cost;
            if (typeof moneySpent !== 'undefined') moneySpent += upgradeToPurchase.cost;
            idleExhibitionState.slotVisualTiers[slotId] = nextTierIndex;

            const slotData = idleExhibitionState.exhibitedCards[slotId];
            if (slotData && slotData.card) {
                slotData.incomeRate = this.calculateCardIncomeRate(slotData.card, slotId);
            }
            
            updateBalance();
            showCustomAlert(`Slot ${slotId + 1} upgraded to ${upgradeToPurchase.name}!`, null, 1500);

            try {
                if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
                    idleExhibitionUI.renderSlots(); 
                    idleExhibitionUI.updateIncomeDisplay(); 
                    if (idleExhibitionUI.upgradeModalEl && idleExhibitionUI.upgradeModalEl.style.display === 'flex') {
                        idleExhibitionUI.renderUpgradePanelContent(); 
                    }
                }
            } catch (uiError) {
                console.error("[IE Purchase SlotVisual] UI Update Error:", uiError);
                showCustomAlert("Purchase recorded, but UI update failed. State saved.", null, 2500);
            }
            if(typeof saveGame === 'function') saveGame();
        } else {
            showCustomAlert(`Not enough Toki. Cost: ${formatCurrency(upgradeToPurchase.cost)}`, null, 2000);
        }
    },

    tryPurchaseSecuritySystemUpgrade() {
        const currentTierIndex = idleExhibitionState.securitySystemTier || 0;
        const nextTierIndex = currentTierIndex + 1;

        if (!idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES || idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES.length === 0) {
            showCustomAlert("Error: Security system upgrade configuration is missing.");
            return;
        }
        if (nextTierIndex >= idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES.length) {
            showCustomAlert("Security system is already at its maximum tier.", null, 1500);
            return;
        }

        const upgradeToPurchase = idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES[nextTierIndex];
        if (!upgradeToPurchase) {
            showCustomAlert("Error: Upgrade configuration missing for this security tier.");
            return;
        }
        
        if (typeof upgradeToPurchase.cost !== 'number' || isNaN(upgradeToPurchase.cost)) {
            showCustomAlert("Error: Upgrade cost is invalid for this security tier.");
            return;
        }

        if (balance >= upgradeToPurchase.cost) {
            balance -= upgradeToPurchase.cost;
            if (typeof moneySpent !== 'undefined') moneySpent += upgradeToPurchase.cost;
            idleExhibitionState.securitySystemTier = nextTierIndex;
            
            updateBalance();
            showCustomAlert(`Security system upgraded to ${upgradeToPurchase.name}!`, null, 1500);

            try {
                if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') {
                     if (idleExhibitionUI.upgradeModalEl && idleExhibitionUI.upgradeModalEl.style.display === 'flex') {
                        idleExhibitionUI.renderUpgradePanelContent(); 
                    }
                }
            } catch (uiError) {
                console.error("[IE Purchase Security] UI Update Error:", uiError);
                showCustomAlert("Purchase recorded, but UI update failed. State saved.", null, 2500);
            }
            if(typeof saveGame === 'function') saveGame();
        } else {
            showCustomAlert(`Not enough Toki. Cost: ${formatCurrency(upgradeToPurchase.cost)}`, null, 2000);
        }
    },

    tryPurchaseBroomUpgrade() {
        const currentLevel = idleExhibitionState.broomLevel || 0;
        const nextLevel = currentLevel + 1;

        if (!idleExhibitionConfig.IE_BROOM_UPGRADES || idleExhibitionConfig.IE_BROOM_UPGRADES.length === 0) {
            showCustomAlert("Error: Broom upgrade configuration is missing.");
            return;
        }
        if (nextLevel >= idleExhibitionConfig.IE_BROOM_UPGRADES.length) {
            showCustomAlert("Broom is already at maximum power!", null, 1500);
            return;
        }

        const upgradeToPurchase = idleExhibitionConfig.IE_BROOM_UPGRADES[nextLevel];
        if (!upgradeToPurchase) {
            showCustomAlert("Error: Upgrade configuration missing for this broom level.");
            return;
        }
        
        if (typeof upgradeToPurchase.cost !== 'number' || isNaN(upgradeToPurchase.cost)) {
            showCustomAlert("Error: Upgrade cost is invalid for this broom level.");
            return;
        }

        if (balance >= upgradeToPurchase.cost) {
            balance -= upgradeToPurchase.cost;
            if (typeof moneySpent !== 'undefined') moneySpent += upgradeToPurchase.cost;
            idleExhibitionState.broomLevel = nextLevel;

            updateBalance();
            showCustomAlert(`Broom upgraded to Level ${nextLevel}! Effectiveness: ${(upgradeToPurchase.cleanEffectiveness * 100).toFixed(0)}%`, null, 1500);
            
            try {
                if (idleExhibitionUI.upgradeModalEl && idleExhibitionUI.upgradeModalEl.style.display === 'flex') {
                    idleExhibitionUI.renderUpgradePanelContent();
                }
            } catch (uiError) {
                console.error("[IE Purchase Broom] UI Update Error:", uiError);
                showCustomAlert("Purchase recorded, but UI update failed. State saved.", null, 2500);
            }
            if(typeof saveGame === 'function') saveGame();
        } else {
            showCustomAlert(`Not enough Toki. Cost: ${formatCurrency(upgradeToPurchase.cost)}`, null, 2000);
        }
    },

    tryPurchaseAutoCleanUpgrade() {
        const currentLevel = idleExhibitionState.autoCleanLevel || 0;
        const nextLevel = currentLevel + 1;

        if (!idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES || idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES.length === 0) {
            showCustomAlert("Error: Auto-cleaner upgrade configuration is missing.");
            return;
        }
        if (nextLevel >= idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES.length) {
            showCustomAlert("Auto-Cleaner is already at maximum level!", null, 1500);
            return;
        }

        const upgradeToPurchase = idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES[nextLevel];
        if (!upgradeToPurchase) {
            showCustomAlert("Error: Upgrade configuration missing for this auto-cleaner level.");
            return;
        }
        
        if (typeof upgradeToPurchase.cost !== 'number' || isNaN(upgradeToPurchase.cost)) {
            showCustomAlert("Error: Upgrade cost is invalid for this auto-cleaner level.");
            return;
        }
        
        if (balance >= upgradeToPurchase.cost) {
            balance -= upgradeToPurchase.cost;
            if (typeof moneySpent !== 'undefined') moneySpent += upgradeToPurchase.cost;
            idleExhibitionState.autoCleanLevel = nextLevel;

            updateBalance();
            const message = currentLevel === 0 ? "Auto-Cleaner Unlocked!" : `Auto-Cleaner upgraded to Level ${nextLevel}!`;
            showCustomAlert(message, null, 1500);

            try {
                if (idleExhibitionUI.upgradeModalEl && idleExhibitionUI.upgradeModalEl.style.display === 'flex') {
                    idleExhibitionUI.renderUpgradePanelContent();
                }
            } catch (uiError) {
                console.error("[IE Purchase AutoClean] UI Update Error:", uiError);
                showCustomAlert("Purchase recorded, but UI update failed. State saved.", null, 2500);
            }
            if(typeof saveGame === 'function') saveGame();
        } else {
            showCustomAlert(`Not enough Toki. Cost: ${formatCurrency(upgradeToPurchase.cost)}`, null, 2000);
        }
    },

    loadState(savedIdleState) {
        // console.log("[IE LOADSTATE DEBUG] Received savedIdleState:", JSON.parse(JSON.stringify(savedIdleState))); // Deep copy for logging
        if (!savedIdleState) {
            initializeIdleExhibitionState(); 
            // console.log("[IE LOADSTATE DEBUG] No saved state, initialized to default:", JSON.parse(JSON.stringify(idleExhibitionState)));
            return;
        }
        
        idleExhibitionState.exhibitedCards = savedIdleState.exhibitedCards || [];
        for (let i = idleExhibitionState.exhibitedCards.length; i < idleExhibitionConfig.MAX_SLOTS; i++) {
            idleExhibitionState.exhibitedCards.push(null);
        }
        idleExhibitionState.exhibitedCards.length = idleExhibitionConfig.MAX_SLOTS;

        idleExhibitionState.unlockedSlotsCount = savedIdleState.unlockedSlotsCount || idleExhibitionConfig.INITIAL_SLOTS;
        idleExhibitionState.slotVisualTiers = savedIdleState.slotVisualTiers || {};
        for (let i = 0; i < idleExhibitionConfig.MAX_SLOTS; i++) {
            if (typeof idleExhibitionState.slotVisualTiers[i] === 'undefined') {
                idleExhibitionState.slotVisualTiers[i] = 0;
            }
        }

        idleExhibitionState.securitySystemTier = savedIdleState.securitySystemTier || 0;
        idleExhibitionState.broomLevel = savedIdleState.broomLevel || 0;
        idleExhibitionState.autoCleanLevel = savedIdleState.autoCleanLevel || 0;
        idleExhibitionState.gameMinutesSinceLastAutoClean = savedIdleState.gameMinutesSinceLastAutoClean || 0;


        idleExhibitionState.lastUpdateTime = savedIdleState.lastUpdateTime || Date.now();
        idleExhibitionState.inGameTimeHours = savedIdleState.inGameTimeHours || 0;
        idleExhibitionState.inGameDay = savedIdleState.inGameDay || 1;
        idleExhibitionState.lastPlayerVisitTimestamp = savedIdleState.lastPlayerVisitTimestamp || Date.now();
        
        idleExhibitionState.lastTrueGameTimeUpdateTimestamp = savedIdleState.lastTrueGameTimeUpdateTimestamp || idleExhibitionState.lastUpdateTime;
        idleExhibitionState.inGameTimeHoursAtLastTrueUpdate = savedIdleState.inGameTimeHoursAtLastTrueUpdate || idleExhibitionState.inGameTimeHours;
        idleExhibitionState.inGameDayAtLastTrueUpdate = savedIdleState.inGameDayAtLastTrueUpdate || idleExhibitionState.inGameDay;


        idleExhibitionState.exhibitedCards.forEach((slot, slotId) => { 
            if (slot && slot.card) {
                slot.incomeRate = this.calculateCardIncomeRate(slot.card, slotId); 
                slot.accruedIncome = slot.accruedIncome || 0;
                slot.cleanliness = typeof slot.cleanliness === 'number' ? slot.cleanliness : 100;
                slot.lastCleanedTimestamp = slot.lastCleanedTimestamp || Date.now();
                slot.lastCollectedTimestamp = slot.lastCollectedTimestamp || Date.now();
            }
        });
        idleExhibitionState.totalAccruedIncome = idleExhibitionState.exhibitedCards.reduce((sum, slot) => {
            return sum + (slot && slot.accruedIncome ? slot.accruedIncome : 0);
        }, 0);
        // console.log("[IE LOADSTATE DEBUG] State after loading:", JSON.parse(JSON.stringify(idleExhibitionState)));
    },

    resetState() {
        initializeIdleExhibitionState(); 
         if (this.isActive && currentMiniGame === SCREENS.IDLE_EXHIBITION && document.getElementById('mini-game-content-active')?.style.display === 'flex') { 
            idleExhibitionUI.renderSlots();
            idleExhibitionUI.updateIncomeDisplay();
            idleExhibitionUI.updateGameTimeDisplay(idleExhibitionState.inGameDay, idleExhibitionState.inGameTimeHours);
        }
    }
};
