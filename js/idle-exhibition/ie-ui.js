
// js/idle-exhibition/ie-ui.js

const idleExhibitionUI = {
    gameContentEl: null, // This will be the parent provided by miniGamesHost
    cleaningToolEl: null,
    collectIncomeToolEl: null,
    upgradeToolEl: null, 
    bottomRightActionsContainerEl: null,
    bottomLeftActionsContainerEl: null, 
    upgradeModalEl: null,

    init(gameContentElParent) { // Renamed parameter for clarity
        this.gameContentEl = gameContentElParent;
        this.gameContentEl.innerHTML = ''; // Clear any previous content

        this.renderBaseLayoutInsideParent(); // Modified to build inside gameContentElParent

        // Create container for bottom-right action icons
        this.bottomRightActionsContainerEl = document.createElement('div');
        this.bottomRightActionsContainerEl.id = 'ie-bottom-right-actions';
        
        this.collectIncomeToolEl = document.createElement('div');
        this.collectIncomeToolEl.id = 'ie-collect-income-tool-container';
        this.collectIncomeToolEl.innerHTML = "💰";
        this.collectIncomeToolEl.title = "Collect All Income";
        this.collectIncomeToolEl.className = 'ie-action-icon';
        this.collectIncomeToolEl.onclick = () => idleExhibition.collectAllIncome();
        this.bottomRightActionsContainerEl.appendChild(this.collectIncomeToolEl);

        this.cleaningToolEl = document.createElement('div');
        this.cleaningToolEl.id = 'ie-cleaning-tool-container';
        this.cleaningToolEl.innerHTML = "🧹"; 
        this.cleaningToolEl.title = "Cleaning Tool (Drag to Clean Slot)";
        this.cleaningToolEl.className = 'ie-action-icon';
        this.cleaningToolEl.draggable = true;
        this.cleaningToolEl.addEventListener('dragstart', this.handleCleaningToolDragStart.bind(this));
        this.cleaningToolEl.addEventListener('dragend', this.handleCleaningToolDragEnd.bind(this));
        this.bottomRightActionsContainerEl.appendChild(this.cleaningToolEl);
        this.gameContentEl.appendChild(this.bottomRightActionsContainerEl); // Append to the passed-in parent

        // Create container for bottom-left action icons
        this.bottomLeftActionsContainerEl = document.createElement('div');
        this.bottomLeftActionsContainerEl.id = 'ie-bottom-left-actions';

        this.upgradeToolEl = document.createElement('div');
        this.upgradeToolEl.id = 'ie-upgrade-tool-icon';
        this.upgradeToolEl.innerHTML = '⚙️'; 
        this.upgradeToolEl.title = "Open Upgrades Panel";
        this.upgradeToolEl.className = 'ie-action-icon';
        this.upgradeToolEl.onclick = () => this.toggleUpgradePanel(true);
        this.bottomLeftActionsContainerEl.appendChild(this.upgradeToolEl);
        this.gameContentEl.appendChild(this.bottomLeftActionsContainerEl); // Append to the passed-in parent


        // Upgrade modal is in the main game.html, so we just get a reference
        this.upgradeModalEl = document.getElementById('ie-upgrade-modal');
        if (this.upgradeModalEl) {
            const closeButton = this.upgradeModalEl.querySelector('#ie-close-upgrades-panel-button');
            if (closeButton) closeButton.onclick = () => this.toggleUpgradePanel(false);
            this.upgradeModalEl.onclick = (event) => {
                if (event.target === this.upgradeModalEl) {
                    this.toggleUpgradePanel(false);
                }
            };
        } else {
            console.error("Idle Exhibition: Upgrade modal element #ie-upgrade-modal not found in HTML.");
        }
        
        this.renderSlots(); // Renders slots inside the #ie-slots-container created by renderBaseLayoutInsideParent
    },

    handleCleaningToolDragStart(event) {
        if (event.target.id !== 'ie-cleaning-tool-container') return;
        event.dataTransfer.setData('text/plain', 'cleaningTool');
        event.dataTransfer.effectAllowed = 'move';
        event.target.style.cursor = 'grabbing';
        event.target.style.opacity = '0.7';
    },

    handleCleaningToolDragEnd(event) {
        if (event.target.id !== 'ie-cleaning-tool-container') return;
        event.target.style.cursor = 'grab'; 
        event.target.style.opacity = '1';
        
        const slots = this.gameContentEl.querySelectorAll('.ie-slot.ie-slot-droppable-hover');
        slots.forEach(s => s.classList.remove('ie-slot-droppable-hover'));
    },
    
    handleSlotDragOver(event) {
        event.preventDefault();
        const slotDiv = event.currentTarget;
        const cardInSlot = idleExhibitionState.exhibitedCards[parseInt(slotDiv.dataset.slotId)];
        if (cardInSlot && cardInSlot.card && cardInSlot.cleanliness < 100) {
            event.dataTransfer.dropEffect = 'move';
            slotDiv.classList.add('ie-slot-droppable-hover');
        } else {
            event.dataTransfer.dropEffect = 'none';
        }
    },

    handleSlotDragLeave(event) {
        event.currentTarget.classList.remove('ie-slot-droppable-hover');
    },

    handleSlotDrop(event) {
        event.preventDefault();
        const slotDiv = event.currentTarget;
        slotDiv.classList.remove('ie-slot-droppable-hover');
        if (event.dataTransfer.getData('text/plain') === 'cleaningTool') {
            const slotId = parseInt(slotDiv.dataset.slotId);
            const cardInSlot = idleExhibitionState.exhibitedCards[slotId];
            if (cardInSlot && cardInSlot.card && cardInSlot.cleanliness < 100) {
                idleExhibition.cleanCardInSlot(slotId); 
            }
        }
    },

    toggleUpgradePanel(show) {
        if (!this.upgradeModalEl) {
            console.error("Cannot toggle upgrade panel: Modal element not found.");
            return;
        }
        if (show) {
            this.renderUpgradePanelContent();
            this.upgradeModalEl.style.display = 'flex';
        } else {
            this.upgradeModalEl.style.display = 'none';
        }
    },

    renderUpgradePanelContent() {
        const panelContent = document.getElementById('ie-upgrade-panel-content');
        if (!panelContent) return;
        panelContent.innerHTML = ''; // Clear previous content

        // Helper function to create an upgrade item
        const createUpgradeItem = (text, cost, isMaxed, onPurchase, effectsText = null) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'ie-upgrade-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'ie-upgrade-name';
            nameSpan.textContent = text;
            itemDiv.appendChild(nameSpan);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'ie-upgrade-item-actions';

            if (isMaxed) {
                const maxedSpan = document.createElement('span');
                maxedSpan.className = 'ie-upgrade-maxed'; // Use this for styling
                maxedSpan.textContent = 'Maxed Out';
                actionsDiv.appendChild(maxedSpan);
            } else if (cost === null) { // No upgrade available beyond current for this specific item
                const noneAvailableSpan = document.createElement('span');
                noneAvailableSpan.className = 'ie-upgrade-none-available'; // Use this for styling
                noneAvailableSpan.textContent = 'No further upgrades';
                actionsDiv.appendChild(noneAvailableSpan);
            } else {
                const costSpan = document.createElement('span');
                costSpan.className = 'ie-upgrade-cost';
                costSpan.textContent = `Cost: ${formatCurrency(cost)}`;
                actionsDiv.appendChild(costSpan);

                const purchaseButton = document.createElement('button');
                purchaseButton.textContent = 'Buy';
                purchaseButton.className = 'game-button ie-purchase-button';
                purchaseButton.disabled = balance < cost;
                purchaseButton.onclick = onPurchase;
                actionsDiv.appendChild(purchaseButton);
            }
            itemDiv.appendChild(actionsDiv);
            
            if (effectsText && !isMaxed && cost !== null) {
                const effectsP = document.createElement('p');
                effectsP.className = 'ie-upgrade-effects-compact';
                effectsP.textContent = effectsText;
                itemDiv.appendChild(effectsP); // Append after actionsDiv if horizontal, or could be part of itemDiv logic
            }
            return itemDiv;
        };
        
        const createCategory = (title) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'ie-upgrade-category';
            const categoryTitleH5 = document.createElement('h5');
            categoryTitleH5.className = 'ie-upgrade-category-title';
            categoryTitleH5.textContent = title;
            categoryDiv.appendChild(categoryTitleH5);
            return categoryDiv;
        };


        // Category: Exhibition Stand Polish (Slot Visuals)
        const slotVisualsCategory = createCategory('Exhibition Stand Polish');
        for (let i = 0; i < idleExhibitionState.unlockedSlotsCount; i++) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'ie-upgrade-item-group';

            const currentTierIndex = idleExhibitionState.slotVisualTiers[i] || 0;
            const currentUpgrade = idleExhibitionConfig.SLOT_VISUAL_UPGRADES[currentTierIndex];
            
            const slotTitleP = document.createElement('p');
            slotTitleP.className = 'ie-slot-upgrade-title';
            slotTitleP.textContent = `Slot ${i + 1}: ${currentUpgrade.name}`;
            groupDiv.appendChild(slotTitleP);

            const nextTierIndex = currentTierIndex + 1;
            if (nextTierIndex < idleExhibitionConfig.SLOT_VISUAL_UPGRADES.length) {
                const nextUpgrade = idleExhibitionConfig.SLOT_VISUAL_UPGRADES[nextTierIndex];
                let effectsDesc = `Effects: +${((nextUpgrade.incomeBoost - 1.0) * 100).toFixed(0)}% Income`;
                if (nextUpgrade.securityBoost && nextUpgrade.securityBoost > 0) {
                    effectsDesc += `, +${(nextUpgrade.securityBoost * 100).toFixed(0)}% Security`;
                }
                const itemElement = createUpgradeItem(
                    `Upgrade to: ${nextUpgrade.name}`,
                    nextUpgrade.cost,
                    false,
                    () => {
                        console.log(`[IE UI DEBUG] Slot Visual Upgrade button clicked for slot: ${i}. Attempting to call idleExhibition.tryPurchaseSlotVisualUpgrade.`);
                        idleExhibition.tryPurchaseSlotVisualUpgrade(i);
                    },
                    effectsDesc
                );
                groupDiv.appendChild(itemElement);
            } else {
                const maxedP = document.createElement('p');
                maxedP.className = 'ie-upgrade-maxed';
                maxedP.textContent = 'Max Visual Tier';
                groupDiv.appendChild(maxedP);
            }
            slotVisualsCategory.appendChild(groupDiv);
        }
        panelContent.appendChild(slotVisualsCategory);

        // Category: Security Systems
        const securityCategory = createCategory('Security Systems');
        const currentSecurityTierIndex = idleExhibitionState.securitySystemTier || 0;
        const currentSecurityUpgrade = idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES[currentSecurityTierIndex];
        let currentSecurityDesc = `Current: ${currentSecurityUpgrade ? currentSecurityUpgrade.name : "None"}`;
        if (currentSecurityUpgrade && currentSecurityUpgrade.theftReduction > 0) {
            currentSecurityDesc += ` (${(currentSecurityUpgrade.theftReduction * 100).toFixed(0)}% Theft Reduction)`;
        }
        const currentSecurityP = document.createElement('p');
        currentSecurityP.className = 'ie-current-security-tier';
        currentSecurityP.textContent = currentSecurityDesc;
        securityCategory.appendChild(currentSecurityP);

        const nextSecurityTierIndex = currentSecurityTierIndex + 1;
        if (nextSecurityTierIndex < idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES.length) {
            const nextSecurity = idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES[nextSecurityTierIndex];
             const itemElement = createUpgradeItem(
                `Upgrade to: ${nextSecurity.name}`,
                nextSecurity.cost,
                false,
                () => idleExhibition.tryPurchaseSecuritySystemUpgrade(),
                `Effect: ${(nextSecurity.theftReduction * 100).toFixed(0)}% Theft Reduction`
            );
            securityCategory.appendChild(itemElement);
        } else if (idleExhibitionConfig.SECURITY_SYSTEM_UPGRADES.length > 0){
            const maxedP = document.createElement('p');
            maxedP.className = 'ie-upgrade-maxed';
            maxedP.textContent = 'Max Security Tier';
            securityCategory.appendChild(maxedP);
        } else {
            const noneP = document.createElement('p');
            noneP.className = 'ie-upgrade-none-available';
            noneP.textContent = 'No security upgrades available.';
            securityCategory.appendChild(noneP);
        }
        panelContent.appendChild(securityCategory);

        // Category: Maintenance Tools
        const toolsCategory = createCategory('Maintenance Tools');
        
        // Broom Efficiency Upgrade
        const broomGroup = document.createElement('div');
        broomGroup.className = 'ie-upgrade-item-group';
        const currentBroomLevel = idleExhibitionState.broomLevel || 0;
        const currentBroomUpgrade = idleExhibitionConfig.IE_BROOM_UPGRADES[currentBroomLevel];
        const broomStatusP = document.createElement('p');
        broomStatusP.className = 'ie-current-tool-status';
        broomStatusP.textContent = `Broom Power: Level ${currentBroomLevel +1} (${(currentBroomUpgrade.cleanEffectiveness * 100).toFixed(0)}% Base Clean)`;
        broomGroup.appendChild(broomStatusP);
        const nextBroomLevel = currentBroomLevel + 1;
        if (nextBroomLevel < idleExhibitionConfig.IE_BROOM_UPGRADES.length) {
            const nextBroom = idleExhibitionConfig.IE_BROOM_UPGRADES[nextBroomLevel];
            const itemElement = createUpgradeItem(
                `Upgrade to Level ${nextBroomLevel + 1}`,
                nextBroom.cost,
                false,
                () => idleExhibition.tryPurchaseBroomUpgrade(),
                `Effect: Cleans ${(nextBroom.cleanEffectiveness * 100).toFixed(0)}% of base amount.`
            );
            broomGroup.appendChild(itemElement);
        } else {
            const maxedP = document.createElement('p');
            maxedP.className = 'ie-upgrade-maxed';
            maxedP.textContent = 'Max Broom Power';
            broomGroup.appendChild(maxedP);
        }
        toolsCategory.appendChild(broomGroup);

        // Auto-Cleaner Upgrade
        const autoCleanGroup = document.createElement('div');
        autoCleanGroup.className = 'ie-upgrade-item-group';
        const currentAutoCleanLevel = idleExhibitionState.autoCleanLevel || 0;
        const currentAutoClean = idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES[currentAutoCleanLevel];
        let autoCleanStatusText = "Auto-Cleaner: ";
        if (!currentAutoClean.unlocked) autoCleanStatusText += "Not Unlocked";
        else autoCleanStatusText += `Level ${currentAutoCleanLevel} (Cleans ${currentAutoClean.cleanAmountPerTick}% every ${currentAutoClean.cleanFrequencyMinutes}m)`;
        const autoCleanStatusP = document.createElement('p');
        autoCleanStatusP.className = 'ie-current-tool-status';
        autoCleanStatusP.textContent = autoCleanStatusText;
        autoCleanGroup.appendChild(autoCleanStatusP);
        const nextAutoCleanLevel = currentAutoCleanLevel + 1;
        if (nextAutoCleanLevel < idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES.length) {
            const nextAutoClean = idleExhibitionConfig.IE_AUTO_CLEAN_UPGRADES[nextAutoCleanLevel];
            const upgradeName = currentAutoClean.unlocked ? `Upgrade to Level ${nextAutoCleanLevel}` : `Unlock Auto-Cleaner`;
            let effectsText = currentAutoClean.unlocked 
                ? `Effect: Cleans ${nextAutoClean.cleanAmountPerTick}% every ${nextAutoClean.cleanFrequencyMinutes}m.`
                : `Effect: Automatically cleans exhibited cards.`;
            const itemElement = createUpgradeItem(
                upgradeName,
                nextAutoClean.cost,
                false,
                () => idleExhibition.tryPurchaseAutoCleanUpgrade(),
                effectsText
            );
            autoCleanGroup.appendChild(itemElement);
        } else if (currentAutoClean.unlocked) {
            const maxedP = document.createElement('p');
            maxedP.className = 'ie-upgrade-maxed';
            maxedP.textContent = 'Max Auto-Cleaner Level';
            autoCleanGroup.appendChild(maxedP);
        }
        toolsCategory.appendChild(autoCleanGroup);
        panelContent.appendChild(toolsCategory);
    },

    renderBaseLayoutInsideParent() { // Modified name
        this.gameContentEl.innerHTML = `
            <div id="ie-info-bar">
                <p>Total Income Rate: <span id="ie-total-income-rate">0</span> Toki/min</p>
                <p>Accrued Income: <span id="ie-accrued-income">0</span> Toki</p>
                <p>In-Game Time: Day <span id="ie-game-day">1</span>, <span id="ie-game-time">00</span>:00</p>
            </div>
            <div id="ie-slots-container" class="gallery-grid">
            </div>
        `;
    },

    renderSlots() {
        const slotsContainer = this.gameContentEl.querySelector('#ie-slots-container');
        if (!slotsContainer) return;
        slotsContainer.innerHTML = '';

        for (let i = 0; i < idleExhibitionConfig.MAX_SLOTS; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'ie-slot';
            slotDiv.dataset.slotId = i;

            const visualTier = idleExhibitionState.slotVisualTiers[i] || 0;
            for(let k=0; k < idleExhibitionConfig.SLOT_VISUAL_UPGRADES.length; k++){
                slotDiv.classList.remove(`ie-slot-tier-${k}`);
            }
            slotDiv.classList.add(`ie-slot-tier-${visualTier}`);

            if (i < idleExhibitionState.unlockedSlotsCount) {
                const cardInSlot = idleExhibitionState.exhibitedCards[i];
                if (cardInSlot && cardInSlot.card) { 
                    slotDiv.addEventListener('dragover', this.handleSlotDragOver.bind(this));
                    slotDiv.addEventListener('dragleave', this.handleSlotDragLeave.bind(this));
                    slotDiv.addEventListener('drop', this.handleSlotDrop.bind(this));

                    const cardImg = document.createElement('img');
                    cardImg.src = cardInSlot.card.imagePath;
                    cardImg.alt = `${cardInSlot.card.set}C${cardInSlot.card.id}`;
                    cardImg.className = `card ${cardInSlot.card.rarityKey}`;
                    
                    const cleanliness = typeof cardInSlot.cleanliness === 'number' ? cardInSlot.cleanliness : 100; 
                    if (cleanliness < 100) {
                        const blurAmount = ((100 - cleanliness) / 100) * 2.5; 
                        const grayscaleAmount = (100 - cleanliness) * 0.6; 
                        cardImg.style.filter = `blur(${blurAmount}px) grayscale(${grayscaleAmount}%)`;
                    } else {
                        cardImg.style.filter = 'none';
                    }
                    slotDiv.appendChild(cardImg);

                    const infoP = document.createElement('p');
                    infoP.className = 'ie-card-info';
                    infoP.innerHTML = `
                        ${cardInSlot.card.set}C${cardInSlot.card.id} (G${cardInSlot.card.grade})<br>
                        Income: ${cardInSlot.incomeRate.toFixed(2)}/min<br>
                        Clean: ${cleanliness.toFixed(0)}%
                    `;
                    slotDiv.appendChild(infoP);

                    const removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'game-button ie-remove-card-button';
                    removeButton.onclick = (e) => {
                        e.stopPropagation();
                        idleExhibition.removeCardFromExhibition(i);
                    };
                    slotDiv.appendChild(removeButton);
                } else {
                    slotDiv.classList.add('empty');
                    slotDiv.innerHTML = '<p>Empty Slot</p>';
                    slotDiv.onclick = () => {
                         showCustomAlert("Go to your Collection, view a card, and click 'EXHIBIT' to add it here.", null, 2500);
                    };
                }
            } else {
                slotDiv.classList.add('locked');
                const unlockCost = idleExhibitionConfig.SLOT_UNLOCK_COSTS[i];
                slotDiv.innerHTML = `<p>Locked</p><button class="game-button ie-unlock-slot-button" data-slot-id="${i}">Unlock (${formatCurrency(unlockCost)})</button>`;
                const unlockButton = slotDiv.querySelector('.ie-unlock-slot-button');
                if (unlockButton) {
                    unlockButton.disabled = balance < unlockCost;
                    unlockButton.onclick = (e) => {
                        e.stopPropagation();
                        idleExhibition.tryUnlockSlot(i);
                    };
                }
            }
            slotsContainer.appendChild(slotDiv);
        }
    },
    
    updateIncomeDisplay() {
        const totalRateEl = this.gameContentEl.querySelector('#ie-total-income-rate');
        const accruedIncomeEl = this.gameContentEl.querySelector('#ie-accrued-income');
        if (totalRateEl) {
            let totalRate = 0;
            idleExhibitionState.exhibitedCards.forEach(slot => {
                if (slot && slot.card) {
                    const C_norm_ui = (typeof slot.cleanliness === 'number' ? slot.cleanliness : 0) / 100; 
                    const DF_ui = idleExhibitionConfig.INCOME_REDUCTION_DIRTY_FACTOR;
                    const effectiveCleanlinessMultiplier_ui = (1 - DF_ui) + C_norm_ui * DF_ui;
                    const incomeAfterCleanliness = slot.incomeRate * effectiveCleanlinessMultiplier_ui;
                    totalRate += incomeAfterCleanliness;
                }
            });
            totalRateEl.textContent = totalRate.toFixed(2);
        }
        if (accruedIncomeEl) {
            accruedIncomeEl.textContent = formatCurrency(Math.floor(idleExhibitionState.totalAccruedIncome));
        }
    },

    updateGameTimeDisplay(currentDayOverride, currentHoursOverride) {
        const dayEl = this.gameContentEl.querySelector('#ie-game-day');
        const timeEl = this.gameContentEl.querySelector('#ie-game-time');
        const displayDay = currentDayOverride !== undefined ? currentDayOverride : idleExhibitionState.inGameDay;
        const displayHours = currentHoursOverride !== undefined ? currentHoursOverride : idleExhibitionState.inGameTimeHours;
        if (dayEl) dayEl.textContent = displayDay;
        if (timeEl) timeEl.textContent = String(Math.floor(displayHours)).padStart(2, '0');
    }
};
