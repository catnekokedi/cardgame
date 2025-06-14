// js/mini-games/fishing-game/fishing-ui.js

const fishingUi = {
    init(parentElement) {
        const isDirectHost = parentElement.classList.contains('mini-game-main-content');
        const actualContentArea = isDirectHost ? parentElement : parentElement.querySelector('.mini-game-main-content');

        if (!actualContentArea) {
            console.error("Fishing UI: Could not find '.mini-game-main-content' within the provided parentElement.");
            actualContentArea = parentElement;
        }

        actualContentArea.innerHTML = `
            <div id="fishing-game-layout-host">
                <div id="fishing-game-info-bar">
                    <span id="fishing-rod-name">Rod: Basic Rod</span>
                    <span id="fishing-bait-name">Bait: None</span>
                    <span id="fishing-status-text">Press Space to cast!</span>
                </div>
                <div class="fishing-game-content-wrapper">
                    <div id="fishing-left-panel">
                        <div id="fishing-tree-container">
                            <svg id="fishing-tree-svg" viewBox="0 0 70 100"></svg>
                             <div id="fishing-tree-moisture-bar-container">
                                <div id="fishing-tree-moisture-bar">0%</div>
                            </div>
                            <div id="fishing-fruit-slots-container">
                            </div>
                        </div>
                        <div id="fishing-rocks-container">
                        </div>
                        <div id="fishing-cat-svg-container"></div>
                    </div>
                    <div id="fishing-water-panel">
                        <canvas id="fishing-rod-line-canvas" style="position:absolute; top:0; left:0; pointer-events:none; z-index: 5;"></canvas>
                        <div id="fishing-bobber" style="display:none;">
                            <span class="exclamation-mark" style="display:none;">❗</span>
                        </div>
                        <div id="fishing-card-display-area">
                            ${Array(5).fill(null).map((_, i) => `<img src="${i % 2 === 0 ? 'gui/back.jpg' : 'gui/yuki-back.jpg'}" class="card-fish" alt="Card Fish ${i+1}" style="animation-duration: ${12 + Math.random()*6}s; animation-delay: ${Math.random()*5}s;">`).join('')}
                        </div>
                         <p id="fishing-result-message"></p>
                         <div id="fishing-catch-preview" style="display:none;">
                            <img id="fishing-catch-preview-img" src="" alt="Caught Item">
                            <div id="fishing-catch-preview-details">
                                <p id="fishing-catch-preview-name"></p>
                                <p id="fishing-catch-preview-rarity"></p>
                                <p id="fishing-catch-preview-grade"></p>
                            </div>
                        </div>
                    </div>
                    <div id="fishing-ui-panel-right">
                        <div id="fishing-basket-icon" class="fishing-ui-icon" title="Open Basket">🧺</div>
                        <div id="fishing-rod-upgrade-icon" class="fishing-ui-icon" title="Upgrade Rod">🎣</div>
                        <div id="fishing-bait-select-icon" class="fishing-ui-icon" title="Select Bait">🐛</div>
                    </div>
                </div>
            </div>
        `;
        actualContentArea.insertAdjacentHTML('beforeend', this.getModalHTML());

        // Initialize fishingGameState.ui object
        fishingGameState.ui = {};

        // Query elements from main layout first
        fishingGameState.ui.rodName = actualContentArea.querySelector('#fishing-rod-name');
        fishingGameState.ui.baitName = actualContentArea.querySelector('#fishing-bait-name');
        fishingGameState.ui.statusText = actualContentArea.querySelector('#fishing-status-text');
        fishingGameState.ui.bobber = actualContentArea.querySelector('#fishing-bobber');
        fishingGameState.ui.exclamation = actualContentArea.querySelector('#fishing-bobber .exclamation-mark');
        fishingGameState.ui.resultMsg = actualContentArea.querySelector('#fishing-result-message');
        fishingGameState.ui.catchPreview = actualContentArea.querySelector('#fishing-catch-preview');
        fishingGameState.ui.catchPreviewImg = actualContentArea.querySelector('#fishing-catch-preview-img');
        fishingGameState.ui.catchPreviewName = actualContentArea.querySelector('#fishing-catch-preview-name');
        fishingGameState.ui.catchPreviewRarity = actualContentArea.querySelector('#fishing-catch-preview-rarity');
        fishingGameState.ui.catchPreviewGrade = actualContentArea.querySelector('#fishing-catch-preview-grade');
        fishingGameState.ui.rodLineCanvas = actualContentArea.querySelector('#fishing-rod-line-canvas');
        fishingGameState.ui.treeSvg = actualContentArea.querySelector('#fishing-tree-svg');
        fishingGameState.ui.treeMoistureBarContainer = actualContentArea.querySelector('#fishing-tree-moisture-bar-container');
        fishingGameState.ui.treeMoistureBar = actualContentArea.querySelector('#fishing-tree-moisture-bar');
        fishingGameState.ui.fruitSlotsContainer = actualContentArea.querySelector('#fishing-fruit-slots-container');
        fishingGameState.ui.rocksContainer = actualContentArea.querySelector('#fishing-rocks-container');
        fishingGameState.ui.catContainer = actualContentArea.querySelector('#fishing-cat-svg-container');
        fishingGameState.ui.basketIcon = actualContentArea.querySelector('#fishing-basket-icon');
        fishingGameState.ui.rodUpgradeIcon = actualContentArea.querySelector('#fishing-rod-upgrade-icon');
        fishingGameState.ui.baitSelectIcon = actualContentArea.querySelector('#fishing-bait-select-icon');
        fishingGameState.ui.waterDropArea = actualContentArea.querySelector('#fishing-water-panel');
        fishingGameState.ui.treeDropArea = actualContentArea.querySelector('#fishing-tree-container');

        // Query modal containers (they are outside actualContentArea, in document body after insertAdjacentHTML)
        fishingGameState.ui.basketModal = document.getElementById('fishing-basket-modal');
        fishingGameState.ui.rodUpgradeModal = document.getElementById('fishing-rod-upgrade-modal');
        fishingGameState.ui.baitSelectModal = document.getElementById('fishing-bait-select-modal');
        fishingGameState.ui.shopModal = document.getElementById('fishing-shop-modal');

        // Query elements INSIDE modals, using the modal container as context
        if (fishingGameState.ui.basketModal) {
            fishingGameState.ui.basketGrid = fishingGameState.ui.basketModal.querySelector('#fishing-basket-grid');
            fishingGameState.ui.basketRarityFilter = fishingGameState.ui.basketModal.querySelector('#fishing-basket-rarity-filter');
            fishingGameState.ui.basketSortFilter = fishingGameState.ui.basketModal.querySelector('#fishing-basket-sort-filter');
            fishingGameState.ui.basketSearchInput = fishingGameState.ui.basketModal.querySelector('#fishing-basket-search');
            fishingGameState.ui.basketCloseBtn = fishingGameState.ui.basketModal.querySelector('#fishing-basket-close-btn');
            fishingGameState.ui.basketAddAllBtn = fishingGameState.ui.basketModal.querySelector('#fishing-basket-add-all-btn');
            fishingGameState.ui.basketSellAllBtn = fishingGameState.ui.basketModal.querySelector('#fishing-basket-sell-all-btn');
            fishingGameState.ui.basketTabs = fishingGameState.ui.basketModal.querySelectorAll('.fishing-basket-tabs button');
        }

        if (fishingGameState.ui.rodUpgradeModal) {
            fishingGameState.ui.rodUpgradeContent = fishingGameState.ui.rodUpgradeModal.querySelector('#fishing-rod-upgrade-content');
            fishingGameState.ui.rodUpgradeCloseBtn = fishingGameState.ui.rodUpgradeModal.querySelector('#fishing-rod-upgrade-close-btn');
        }

        if (fishingGameState.ui.baitSelectModal) {
            fishingGameState.ui.baitSelectContent = fishingGameState.ui.baitSelectModal.querySelector('#fishing-bait-select-content');
            fishingGameState.ui.baitSelectCloseBtn = fishingGameState.ui.baitSelectModal.querySelector('#fishing-bait-select-close-btn');
        }

        if (fishingGameState.ui.shopModal) {
            fishingGameState.ui.shopCloseBtn = fishingGameState.ui.shopModal.querySelector('#fishing-shop-close-btn');
            fishingGameState.ui.shopTabs = fishingGameState.ui.shopModal.querySelectorAll('.fishing-shop-tabs button');
            fishingGameState.ui.shopItemsGrid = fishingGameState.ui.shopModal.querySelector('#fishing-shop-items-grid');
            fishingGameState.ui.shopSellAllBtn = fishingGameState.ui.shopModal.querySelector('#fishing-shop-sell-all-btn');
            fishingGameState.ui.shopExchangeInfo = fishingGameState.ui.shopModal.querySelector('#fishing-shop-exchange-info');
            fishingGameState.ui.shopTicketBalances = fishingGameState.ui.shopModal.querySelector('#fishing-shop-ticket-balances');
        }
        
        this.createSVGCat(); 

        if (fishingGameState.ui.rodLineCanvas && fishingGameState.ui.waterDropArea) {
            fishingGameState.ui.rodLineCanvas.width = fishingGameState.ui.waterDropArea.offsetWidth;
            fishingGameState.ui.rodLineCanvas.height = fishingGameState.ui.waterDropArea.offsetHeight;
        }

        this.createToolIcons(actualContentArea.querySelector('#fishing-ui-panel-right'));
        this.addEventListeners(); 
        
        // Call init for modular UI components, ensuring they also have access to their specific elements
        if (typeof fishingTreeUi !== 'undefined' && fishingTreeUi.init) {
            fishingTreeUi.init(actualContentArea); 
        }
        if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.init) {
            fishingWateringCanUi.init(actualContentArea); 
        }
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.init) {
            fishingRocksUi.init(actualContentArea); 
        }
        
        // Initial updates, now potentially delegated
        if (typeof fishingTreeUi !== 'undefined' && fishingTreeUi.updateVisuals) fishingTreeUi.updateVisuals();
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.updateAllVisuals) fishingRocksUi.updateAllVisuals();
        if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIcon) fishingWateringCanUi.updateIcon();
        
        this.setCatState('idle');
    },
    
    createSVGCat() {
        const catContainer = fishingGameState.ui.catContainer;
        if (!catContainer) return;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("id", "fishing-cat-svg");
        svg.setAttribute("viewBox", "0 0 70 100"); 
        svg.setAttribute("width", "100%"); 
        svg.setAttribute("height", "100%");
        svg.style.overflow = "visible"; 

        const body = document.createElementNS(svgNS, "ellipse");
        body.setAttribute("cx", "35"); body.setAttribute("cy", "75");
        body.setAttribute("rx", "15"); body.setAttribute("ry", "20");
        body.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody); 
        body.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline); 
        body.setAttribute("stroke-width", "1.5");
        svg.appendChild(body);

        const head = document.createElementNS(svgNS, "circle");
        head.setAttribute("cx", "35"); head.setAttribute("cy", "50"); head.setAttribute("r", "12");
        head.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody); 
        head.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline); 
        head.setAttribute("stroke-width", "1.5");
        svg.appendChild(head);

        const eyeLeft = document.createElementNS(svgNS, "circle");
        eyeLeft.setAttribute("cx", "30"); eyeLeft.setAttribute("cy", "48"); eyeLeft.setAttribute("r", "2");
        eyeLeft.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catEyes);
        svg.appendChild(eyeLeft);

        const eyeRight = document.createElementNS(svgNS, "circle");
        eyeRight.setAttribute("cx", "40"); eyeRight.setAttribute("cy", "48"); eyeRight.setAttribute("r", "2");
        eyeRight.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catEyes);
        svg.appendChild(eyeRight);
        
        const earLeft = document.createElementNS(svgNS, "path");
        earLeft.setAttribute("d", "M25 40 Q22 30 30 38 Z"); 
        earLeft.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody); 
        earLeft.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline); 
        earLeft.setAttribute("stroke-width", "1.5");
        svg.appendChild(earLeft);

        const earRight = document.createElementNS(svgNS, "path");
        earRight.setAttribute("d", "M45 40 Q48 30 40 38 Z"); 
        earRight.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody); 
        earRight.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline); 
        earRight.setAttribute("stroke-width", "1.5");
        svg.appendChild(earRight);

        const rodGroup = document.createElementNS(svgNS, "g");
        rodGroup.setAttribute("id", "fishing-rod-group");
        const pivotX = 38; 
        const pivotY = 70; 
        rodGroup.setAttribute("transform-origin", `${pivotX}px ${pivotY}px`); 

        const rodLineSvg = document.createElementNS(svgNS, "line");
        rodLineSvg.setAttribute("id", "fishing-rod-svg-line");
        rodLineSvg.setAttribute("x1", pivotX); rodLineSvg.setAttribute("y1", pivotY); 
        rodLineSvg.setAttribute("x2", pivotX + 35); rodLineSvg.setAttribute("y2", pivotY - 75); 
        rodLineSvg.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.rod); 
        rodLineSvg.setAttribute("stroke-width", "3");
        rodLineSvg.setAttribute("stroke-linecap", "round");
        rodGroup.appendChild(rodLineSvg);

        const rodTip = document.createElementNS(svgNS, "circle");
        rodTip.setAttribute("id", "rod-tip"); 
        rodTip.setAttribute("cx", pivotX + 35); rodTip.setAttribute("cy", pivotY - 75); 
        rodTip.setAttribute("r", "1.5");
        rodTip.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.rodTip);
        rodGroup.appendChild(rodTip);
        
        svg.appendChild(rodGroup);
        catContainer.appendChild(svg);
        fishingGameState.ui.catSvg = svg;
    },


    getModalHTML() { 
        return `
            <div id="fishing-basket-modal" class="fishing-game-modal-overlay" style="display:none;">
                <div class="fishing-game-modal-content fishing-basket-content">
                    <div class="fishing-game-modal-header">
                        <h3>Fishing Basket</h3>
                        <button id="fishing-basket-close-btn" class="game-button">&times;</button>
                    </div>
                    <div class="fishing-basket-controls">
                        <select id="fishing-basket-rarity-filter"></select>
                        <select id="fishing-basket-sort-filter">
                            <option value="default">Sort: Default</option>
                            <option value="value_high_low">Value: High to Low</option>
                            <option value="value_low_high">Value: Low to High</option>
                            <option value="quantity_high_low">Quantity: High to Low</option>
                            <option value="quantity_low_high">Quantity: Low to High</option>
                        </select>
                        <input type="text" id="fishing-basket-search" placeholder="Search ID (e.g., DRI C1)">
                    </div>
                     <div class="fishing-basket-tabs">
                        <button class="game-button active" data-tab-type="all_caught">All Caught</button>
                        <button class="game-button" data-tab-type="card">Fish</button>
                        <button class="game-button" data-tab-type="fruit_card">Fruit</button>
                        <button class="game-button" data-tab-type="mineral_card">Minerals</button>
                    </div>
                    <div id="fishing-basket-grid" class="fishing-game-modal-scrollable-content fishing-basket-grid gallery-grid"></div>
                    <div class="fishing-game-modal-actions">
                        <button id="fishing-basket-add-all-btn" class="game-button">Add All to Collection</button>
                        <button id="fishing-basket-sell-all-btn" class="game-button game-button-danger">Sell Selected</button> 
                    </div>
                </div>
            </div>
            <div id="fishing-rod-upgrade-modal" class="fishing-game-modal-overlay" style="display:none;">
                <div class="fishing-game-modal-content fishing-upgrade-content">
                     <div class="fishing-game-modal-header">
                        <h3>Upgrade Fishing Rod</h3>
                        <button id="fishing-rod-upgrade-close-btn" class="game-button">&times;</button>
                    </div>
                    <div id="fishing-rod-upgrade-content" class="fishing-game-modal-scrollable-content"></div>
                </div>
            </div>
            <div id="fishing-bait-select-modal" class="fishing-game-modal-overlay" style="display:none;">
                <div class="fishing-game-modal-content fishing-upgrade-content">
                    <div class="fishing-game-modal-header">
                        <h3>Select Bait</h3>
                        <button id="fishing-bait-select-close-btn" class="game-button">&times;</button>
                    </div>
                    <div id="fishing-bait-select-content" class="fishing-game-modal-scrollable-content"></div>
                </div>
            </div>
             <div id="fishing-shop-modal" class="fishing-game-modal-overlay" style="display: none;">
                <div class="fishing-game-modal-content fishing-shop-modal-content">
                    <div class="fishing-game-modal-header">
                        <h3>Fishing Exchange</h3>
                        <button id="fishing-shop-close-btn" class="game-button">&times;</button>
                    </div>
                    <div id="fishing-shop-ticket-balances" class="fishing-shop-ticket-balances-area"></div>
                    <div class="fishing-shop-tabs">
                        <button class="game-button active" data-tab-type="fish">Fish/Cards</button>
                        <button class="game-button" data-tab-type="fruit">Fruit</button>
                        <button class="game-button" data-tab-type="minerals">Minerals</button>
                    </div>
                    <div class="fishing-game-modal-scrollable-content">
                        <div id="fishing-shop-exchange-info" class="fishing-shop-exchange-info-area"></div>
                        <div id="fishing-shop-items-grid" class="fishing-shop-items-grid-area"></div>
                    </div>
                    <div class="fishing-game-modal-actions">
                        <button id="fishing-shop-sell-all-btn" class="game-button game-button-variant">Exchange All in Tab</button>
                    </div>
                </div>
            </div>
        `;
    },

    createToolIcons(uiPanelRight) {
        if (!uiPanelRight) return;

        // The modular UI components will create and manage their own icons.
        // This function can still create any general icons not tied to a specific sub-module.
        fishingGameState.ui.sieveIcon = document.createElement('div');
        fishingGameState.ui.sieveIcon.id = 'fishing-tool-sieve';
        fishingGameState.ui.sieveIcon.className = 'fishing-ui-icon';
        fishingGameState.ui.sieveIcon.innerHTML = '⏳';
        fishingGameState.ui.sieveIcon.title = 'Use Sieve (Coming Soon!)';
        uiPanelRight.appendChild(fishingGameState.ui.sieveIcon);

        fishingGameState.ui.shopIcon = document.createElement('div'); 
        fishingGameState.ui.shopIcon.id = 'fishing-tool-shop';
        fishingGameState.ui.shopIcon.className = 'fishing-ui-icon';
        fishingGameState.ui.shopIcon.innerHTML = '🏪';
        fishingGameState.ui.shopIcon.title = 'Open Exchange Shop';
        uiPanelRight.appendChild(fishingGameState.ui.shopIcon);
    },

    addEventListeners() { 
        const ui = fishingGameState.ui;
        if (ui.bobber) ui.bobber.addEventListener('click', () => fishingMechanics.handleBobberClick(false));
        
        if (ui.catContainer) {
            ui.catContainer.addEventListener('click', () => {
                if (document.querySelector('.custom-modal-overlay[style*="display: flex"]')) return;
                if (Array.from(document.querySelectorAll('.fishing-game-modal-overlay')).some(m => m.style.display === 'flex')) return;
                if (!fishingGameState.isRodCast && !fishingGameState.isReeling && !this.isToolSelected()) {
                    fishingMechanics.castRod();
                }
            });
        }

        if (ui.basketIcon) ui.basketIcon.addEventListener('click', () => { toggleFishingBasketModal(true); playSound('sfx_modal_open.mp3'); });
        if (ui.basketCloseBtn) ui.basketCloseBtn.addEventListener('click', () => { toggleFishingBasketModal(false); playSound('sfx_modal_close.mp3'); });
        if (ui.basketModal) ui.basketModal.addEventListener('click', (event) => { if (event.target === ui.basketModal) toggleFishingBasketModal(false); });
        if(ui.basketAddAllBtn) ui.basketAddAllBtn.addEventListener('click', () => { addAllFromFishingBasketToCollection(); playSound('sfx_button_click.mp3'); });
        if(ui.basketSellAllBtn) ui.basketSellAllBtn.addEventListener('click', () => { sellSelectedFishingBasketItem(); playSound('sfx_button_click.mp3'); }); 
        if (ui.basketRarityFilter) ui.basketRarityFilter.addEventListener('change', renderFishingBasket);
        if (ui.basketSortFilter) ui.basketSortFilter.addEventListener('change', renderFishingBasket);
        if (ui.basketSearchInput) ui.basketSearchInput.addEventListener('input', renderFishingBasket);
        if (ui.basketTabs) {
            ui.basketTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    ui.basketTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    fishingGameState.selectedItemInBasket = null; 
                    renderFishingBasket();
                    playSound('sfx_button_click_subtle.mp3');
                });
            });
        }

        if (ui.rodUpgradeIcon) ui.rodUpgradeIcon.addEventListener('click', () => { toggleFishingRodUpgradeModal(true); playSound('sfx_modal_open.mp3'); });
        if (ui.rodUpgradeCloseBtn) ui.rodUpgradeCloseBtn.addEventListener('click', () => { toggleFishingRodUpgradeModal(false); playSound('sfx_modal_close.mp3'); });
        if (ui.rodUpgradeModal) ui.rodUpgradeModal.addEventListener('click', (event) => { if (event.target === ui.rodUpgradeModal) toggleFishingRodUpgradeModal(false); });

        if (ui.baitSelectIcon) ui.baitSelectIcon.addEventListener('click', () => { toggleFishingBaitSelectModal(true); playSound('sfx_modal_open.mp3'); });
        if (ui.baitSelectCloseBtn) ui.baitSelectCloseBtn.addEventListener('click', () => { toggleFishingBaitSelectModal(false); playSound('sfx_modal_close.mp3'); });
        if (ui.baitSelectModal) ui.baitSelectModal.addEventListener('click', (event) => { if (event.target === ui.baitSelectModal) toggleFishingBaitSelectModal(false); });
        
        if (ui.shopIcon) ui.shopIcon.addEventListener('click', () => { toggleFishingShopModal(true); playSound('sfx_modal_open.mp3'); });
        if (ui.shopCloseBtn) ui.shopCloseBtn.addEventListener('click', () => { toggleFishingShopModal(false); playSound('sfx_modal_close.mp3'); });
        if (ui.shopModal) ui.shopModal.addEventListener('click', (event) => { if (event.target === ui.shopModal) toggleFishingShopModal(false); });
        if (ui.shopTabs) {
            ui.shopTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    ui.shopTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    renderFishingShopItems(tab.dataset.tabType);
                    playSound('sfx_button_click_subtle.mp3');
                });
            });
        }
        if (ui.shopSellAllBtn) ui.shopSellAllBtn.addEventListener('click', () => { handleFishingShopExchangeAll(); playSound('sfx_button_click.mp3');});

    },
    handleDragOver(event, targetAreaType) {
        event.preventDefault(); // Essential for drop to work
        if (event.dataTransfer.types.includes('text/plain') && event.dataTransfer.getData('text/plain') === 'watering_can') {
            event.dataTransfer.dropEffect = 'move';
            if (fishingGameState.wateringCan.isIconBeingDragged && fishingGameState.wateringCan.currentTarget !== targetAreaType) {
                wateringCanMechanics.startOperationOnTarget(targetAreaType);
            }
            const targetEl = targetAreaType === 'water_area' ? fishingGameState.ui.waterDropArea : fishingGameState.ui.treeDropArea;
            if(targetEl) targetEl.classList.add('drag-over-active');
        } else {
             event.dataTransfer.dropEffect = 'none';
        }
    },
    handleDragLeave(event, targetAreaType) {
        const targetEl = targetAreaType === 'water_area' ? fishingGameState.ui.waterDropArea : fishingGameState.ui.treeDropArea;
        if(targetEl) targetEl.classList.remove('drag-over-active');
        // Only clear current operation if leaving the *active* target
        if (fishingGameState.wateringCan.currentTarget === targetAreaType) {
            // Check if the mouse is truly outside the element boundaries
            const rect = targetEl.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY >= rect.bottom) {
                wateringCanMechanics.clearCurrentOperation();
            }
        }
    },
    handleDrop(event, targetAreaType) {
        event.preventDefault();
        const targetEl = targetAreaType === 'water_area' ? fishingGameState.ui.waterDropArea : fishingGameState.ui.treeDropArea;
        if(targetEl) targetEl.classList.remove('drag-over-active');
        // The actual filling/watering logic is handled by updateWateringCanDragAction based on currentTarget.
        // Drop essentially signifies the end of a drag for this specific target, but operation may continue if mouse stays.
        // The dragend on the icon itself will fully stop operations if needed.
    },
    setCatState(state) { 
        const catContainer = fishingGameState.ui.catContainer;
        if (!catContainer || !fishingGameState.ui.catSvg) return;

        catContainer.classList.remove('fishing-cat--idle', 'fishing-cat--casting', 'fishing-cat--reeling');
        if (state === 'casting') {
            catContainer.classList.add('fishing-cat--casting');
        } else if (state === 'reeling') {
            catContainer.classList.add('fishing-cat--reeling');
        } else {
            catContainer.classList.add('fishing-cat--idle');
        }
    },
    updateToolIconSelectionState() { 
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.updatePickaxeIconState) {
            fishingRocksUi.updatePickaxeIconState();
        }
    },
    isToolSelected() { return fishingGameState.pickaxeSelected; },
    updateRodAndBaitDisplay() { 
        if (fishingGameState.ui.rodName) fishingGameState.ui.rodName.textContent = `Rod: ${fishingGameState.currentRod.name}`;
        if (fishingGameState.ui.baitName) {
            let baitText = `Bait: ${fishingGameState.currentBait.name}`;
            if (fishingGameState.currentBait.id !== "none" && fishingGameState.currentBaitUsesLeft !== Infinity) {
                baitText += ` (${fishingGameState.currentBaitUsesLeft} left)`;
            }
            fishingGameState.ui.baitName.textContent = baitText;
        }
    },
    updateStatusText(text) {
        if (fishingGameState.ui.statusText) {
            if (fishingGameState.wateringCan && fishingGameState.wateringCan.isIconBeingDragged && fishingGameState.wateringCan.currentTarget) {
                if (fishingGameState.wateringCan.currentTarget === 'water_area') {
                    fishingGameState.ui.statusText.textContent = "Watering can filling...";
                } else if (fishingGameState.wateringCan.currentTarget === 'tree_area') {
                    fishingGameState.ui.statusText.textContent = "Watering tree...";
                }
            } else { // Default status logic
                fishingGameState.ui.statusText.textContent = text || (fishingGameState.isRodCast ? "Waiting for a bite..." : "Press Space to cast!");
            }
        }
    },
    showBobber() {
        console.log("[UI] showBobber: Called.");
        if (fishingGameState.ui.bobber) {
            const waterPanel = fishingGameState.ui.waterDropArea;
            if (waterPanel) {
                console.log(`[UI] showBobber: waterPanel dimensions: offsetWidth=${waterPanel.offsetWidth}, offsetHeight=${waterPanel.offsetHeight}`);
                if (waterPanel.offsetWidth === 0 || waterPanel.offsetHeight === 0) {
                    console.warn("[UI] showBobber: waterPanel has zero width or height. Bobber positioning might be incorrect.");
                }
                const maxX = waterPanel.offsetWidth - fishingGameState.ui.bobber.offsetWidth - 20;
                const maxY = waterPanel.offsetHeight * 0.4 + (waterPanel.offsetHeight * 0.6 * 0.2);
                const minY = waterPanel.offsetHeight * 0.5;

                fishingGameState.bobberPosition.x = Math.random() * maxX + 10;
                fishingGameState.bobberPosition.y = Math.random() * (maxY - minY) + minY;
                fishingGameState.ui.bobber.style.left = `${fishingGameState.bobberPosition.x}px`;
                fishingGameState.ui.bobber.style.top = `${fishingGameState.bobberPosition.y}px`;
                fishingGameState.ui.bobber.style.display = 'flex';
                console.log(`[UI] showBobber: Bobber positioned at left=${fishingGameState.ui.bobber.style.left}, top=${fishingGameState.ui.bobber.style.top}. Display set to flex.`);
            } else {
                console.warn("[UI] showBobber: waterPanel element not found.");
            }
        } else {
            console.warn("[UI] showBobber: Bobber element not found in fishingGameState.ui.");
        }
    },
    hideBobber() { if (fishingGameState.ui.bobber) fishingGameState.ui.bobber.style.display = 'none'; },
    drawRodLine() {
        console.log("[UI] drawRodLine: Called.");
        const canvas = fishingGameState.ui.rodLineCanvas;
        const rodTipEl = document.getElementById('rod-tip');
        const bobberEl = fishingGameState.ui.bobber;

        if (!canvas) console.warn("[UI] drawRodLine: rodLineCanvas not found.");
        if (!rodTipEl) console.warn("[UI] drawRodLine: rod-tip element not found.");
        if (!bobberEl) console.warn("[UI] drawRodLine: bobber element not found.");

        if (!canvas || !rodTipEl || !bobberEl || bobberEl.style.display === 'none') {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                console.log("[UI] drawRodLine: Conditions not met (e.g., bobber hidden), canvas cleared.");
            }
            return;
        }

        console.log(`[UI] drawRodLine: Canvas dimensions: width=${canvas.width}, height=${canvas.height}`);
        if (canvas.width === 0 || canvas.height === 0) {
            console.warn("[UI] drawRodLine: Canvas has zero width or height. Line will not be visible.");
            // Attempt to resize canvas if waterDropArea is available
            if (fishingGameState.ui.waterDropArea && fishingGameState.ui.waterDropArea.offsetWidth > 0 && fishingGameState.ui.waterDropArea.offsetHeight > 0) {
                canvas.width = fishingGameState.ui.waterDropArea.offsetWidth;
                canvas.height = fishingGameState.ui.waterDropArea.offsetHeight;
                console.log(`[UI] drawRodLine: Canvas resized to waterDropArea: width=${canvas.width}, height=${canvas.height}`);
            }
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const rodTipRect = rodTipEl.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        if (canvasRect.width === 0 || canvasRect.height === 0) {
            console.warn("[UI] drawRodLine: canvasRect has zero width or height. This might indicate canvas is not visible or not correctly attached to DOM for getBoundingClientRect to work.");
        }
    
        const rodTipCanvasX = rodTipRect.left + rodTipRect.width / 2 - canvasRect.left;
        const rodTipCanvasY = rodTipRect.top + rodTipRect.height / 2 - canvasRect.top;
    
        const bobberCanvasX = fishingGameState.bobberPosition.x + bobberEl.offsetWidth / 2;
        const bobberCanvasY = fishingGameState.bobberPosition.y + bobberEl.offsetHeight / 2;

        console.log(`[UI] drawRodLine: Line from rodTip (canvas coords: ${rodTipCanvasX.toFixed(2)}, ${rodTipCanvasY.toFixed(2)}) to bobber (canvas coords: ${bobberCanvasX.toFixed(2)}, ${bobberCanvasY.toFixed(2)})`);
    
        ctx.beginPath();
        ctx.moveTo(rodTipCanvasX, rodTipCanvasY);
        ctx.quadraticCurveTo(
            rodTipCanvasX, 
            bobberCanvasY * 0.7 + rodTipCanvasY * 0.3, 
            bobberCanvasX, 
            bobberCanvasY
        );
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.7)'; 
        ctx.lineWidth = 1.5; 
        ctx.stroke();
    },
    hideRodLine() { 
        const canvas = fishingGameState.ui.rodLineCanvas;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },
    showExclamationOnBobber(show) { if (fishingGameState.ui.exclamation) fishingGameState.ui.exclamation.style.display = show ? 'block' : 'none'; },
    
    animateBobberBite() {
        if (fishingGameState.ui.bobber) {
            fishingGameState.ui.bobber.classList.add('bobber-bite');
        }
    },
    resetBobberAnimation() {
        if (fishingGameState.ui.bobber) {
            fishingGameState.ui.bobber.classList.remove('bobber-bite');
             fishingGameState.ui.bobber.style.transform = 'translateY(0)'; 
        }
    },
    showTemporaryResultMessage(message) { 
        const msgEl = fishingGameState.ui.resultMsg;
        if (msgEl) {
            msgEl.textContent = message;
            msgEl.style.display = 'block';
            setTimeout(() => { msgEl.style.display = 'none'; }, 2000);
        }
    },
    showCatchPreview(item) { 
        const previewEl = fishingGameState.ui.catchPreview;
        const imgEl = fishingGameState.ui.catchPreviewImg;
        const nameEl = fishingGameState.ui.catchPreviewName;
        const rarityEl = fishingGameState.ui.catchPreviewRarity;
        const gradeEl = fishingGameState.ui.catchPreviewGrade;
        const detailsContainer = fishingGameState.ui.catchPreview.querySelector('#fishing-catch-preview-details');


        if (!previewEl || !imgEl || !nameEl || !rarityEl || !gradeEl || !detailsContainer) {
            console.error("FishingUI: Catch preview elements not found.", fishingGameState.ui);
            return;
        }

        // Reset visibility first
        detailsContainer.style.display = 'block';
        nameEl.style.display = 'block';
        rarityEl.style.display = 'block';
        gradeEl.style.display = 'block';
        imgEl.classList.remove('ticket-image');
        imgEl.style.marginBottom = ''; // Default margin

        if (item.type === 'card' || item.type === 'collectible_card' || item.type === 'fruit_card' || item.type === 'mineral_card') {
            imgEl.src = item.details.imagePath || (typeof getCardImagePath === 'function' ? getCardImagePath(item.details.set, item.details.cardId) : 'gui/items/placeholder_icon.png');
            detailsContainer.style.display = 'none'; // Hide the whole details text container
            imgEl.style.marginBottom = '0'; // Remove margin below image when text is hidden
        } else if (item.type === 'ticket') {
            imgEl.src = item.details.imagePath || (typeof getSummonTicketImagePath === 'function' ? getSummonTicketImagePath(item.details.rarityKey) : `gui/summon_tickets/ticket_${item.details.rarityKey}.png`);
            imgEl.classList.add('ticket-image');
            nameEl.textContent = item.details.name;
            rarityEl.style.display = 'none'; // Tickets don't show rarity text in this preview usually
            gradeEl.style.display = 'none';  // Tickets don't have grades
        } else { // Other item types - show all details if available
             imgEl.src = item.details.imagePath || 'gui/items/placeholder_icon.png';
             nameEl.textContent = item.details.name || "Unknown Item";
             const rarityInfo = item.details.rarityKey ? getRarityTierInfo(item.details.rarityKey) : null;
             rarityEl.textContent = rarityInfo ? `Rarity: ${rarityInfo.name}` : '';
             rarityEl.style.display = rarityInfo ? 'block' : 'none';
             gradeEl.textContent = item.details.grade ? `Grade: ${item.details.grade}` : "";
             gradeEl.style.display = item.details.grade ? 'block' : 'none';
        }
        previewEl.style.display = 'flex';
        setTimeout(() => { previewEl.style.display = 'none'; }, 2500);
    },
    hideCatchPreview() { if (fishingGameState.ui.catchPreview) fishingGameState.ui.catchPreview.style.display = 'none'; },
    
    _createSVGElement(type) { // Re-added this helper, as it's used by the modular UI components
        return document.createElementNS("http://www.w3.org/2000/svg", type);
    }
};

// Expose the fishingUi object globally
window.fishingUi = fishingUi;