
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
                <div id="fishing-main-panel"> {/* Changed from class="fishing-game-content-wrapper" */}
                    <div id="fishing-land-area">
                        <div id="fishing-tree-container">
                            <svg id="fishing-tree-svg" viewBox="0 0 130 150"></svg> 
                             <div id="fishing-tree-moisture-bar-container">
                                <div id="fishing-tree-moisture-bar">0%</div>
                            </div>
                            <div id="fishing-fruit-slots-container">
                            </div>
                        </div>
                        <div id="fishing-rocks-container">
                        </div>
                    </div>
                    <div id="fishing-water-area">
                        <div id="fishing-cat-svg-container"></div>
                        <canvas id="fishing-rod-line-canvas"></canvas>
                        <div id="fishing-water-surface">
                            <div id="fishing-bobber" style="display:none;">
                                <span class="exclamation-mark" style="display:none;">❗</span>
                            </div>
                            <div id="fishing-card-display-area">
                                ${Array(5).fill(null).map((_, i) => `<div class="card-fish" alt="Fish ${i+1}" style="animation-duration: ${12 + Math.random()*6}s; animation-delay: ${Math.random()*5}s; top: ${10 + Math.random()*80}%; left: ${5 + Math.random()*90}%;"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                     <p id="fishing-result-message"></p> {/* Moved out of water-area for general messages */}
                     <div id="fishing-catch-preview" style="display:none;"> {/* Moved out of water-area for general messages */}
                        <img id="fishing-catch-preview-img" src="" alt="Caught Item">
                        <div id="fishing-catch-preview-details">
                            <p id="fishing-catch-preview-name"></p>
                            <p id="fishing-catch-preview-rarity"></p>
                            <p id="fishing-catch-preview-grade"></p>
                        </div>
                    </div>
                    <div id="fishing-ui-panel-right">
                         място за кошницата
                        <div id="fishing-rod-upgrade-icon" class="fishing-ui-icon" title="Upgrade Rod">🎣</div>
                        <div id="fishing-bait-select-icon" class="fishing-ui-icon" title="Select Bait">🐛</div>
                    </div>
                </div>
            </div>
            <div id="fishing-reward-popup" style="display: none; position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 3000; padding: 20px; background-color: rgba(0,0,0,0.8); border-radius: 10px; text-align: center; box-shadow: 0 0 15px #fff; flex-direction: column; align-items: center;">
                <img id="fishing-reward-popup-img" src="" alt="Reward" style="max-width: 150px; max-height: 210px; border-radius: 5px; margin-bottom: 10px; border: 2px solid #FFF;">
                <p id="fishing-reward-popup-text" style="color: white; font-size: 1em; margin: 0; font-family: 'Roboto', sans-serif; font-weight: bold;"></p>
            </div>
        `;
        actualContentArea.insertAdjacentHTML('beforeend', this.getModalHTML());

        fishingGameState.ui = {};
        fishingGameState.ui.mainPanel = actualContentArea.querySelector('#fishing-main-panel');
        fishingGameState.ui.landArea = actualContentArea.querySelector('#fishing-land-area'); // New
        fishingGameState.ui.waterArea = actualContentArea.querySelector('#fishing-water-area'); // New

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
        fishingGameState.ui.waterDropArea = actualContentArea.querySelector('#fishing-water-surface'); 
        fishingGameState.ui.treeDropArea = actualContentArea.querySelector('#fishing-tree-container');

        fishingGameState.ui.basketModal = document.getElementById('fishing-basket-modal');
        fishingGameState.ui.rodUpgradeModal = document.getElementById('fishing-rod-upgrade-modal');
        fishingGameState.ui.baitSelectModal = document.getElementById('fishing-bait-select-modal');
        fishingGameState.ui.shopModal = document.getElementById('fishing-shop-modal');
        fishingGameState.ui.cardDetailFishingBasketModal = document.getElementById('card-detail-fishingbasket-modal');

        if (fishingGameState.ui.basketModal) {
            fishingGameState.ui.basketGrid = fishingGameState.ui.basketModal.querySelector('#fishing-basket-grid');
            fishingGameState.ui.basketRarityFilter = fishingGameState.ui.basketModal.querySelector('#fishing-basket-rarity-filter');
            fishingGameState.ui.basketSortFilter = fishingGameState.ui.basketModal.querySelector('#fishing-basket-sort-filter');
            fishingGameState.ui.basketSearchInput = fishingGameState.ui.basketModal.querySelector('#fishing-basket-search');
            fishingGameState.ui.basketCloseBtn = fishingGameState.ui.basketModal.querySelector('#fishing-basket-close-btn');
            fishingGameState.ui.basketAddAllBtn = fishingGameState.ui.basketModal.querySelector('#fishing-basket-add-all-btn');
            fishingGameState.ui.basketSellAllBtn = fishingGameState.ui.basketModal.querySelector('#fishing-basket-sell-all-btn');
            fishingGameState.ui.basketTabs = fishingGameState.ui.basketModal.querySelectorAll('.fishing-basket-tabs button');
            fishingGameState.ui.basketLockModeCheckbox = fishingGameState.ui.basketModal.querySelector('#fishing-basket-lock-mode');
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
        if (fishingGameState.ui.cardDetailFishingBasketModal) {
             fishingGameState.ui.cardDetailFishingBasketCloseBtn = fishingGameState.ui.cardDetailFishingBasketModal.querySelector('.fishing-basket-detail-close-button');
             fishingGameState.ui.cardDetailFishingBasketCollectBtn = fishingGameState.ui.cardDetailFishingBasketModal.querySelector('.fishing-basket-detail-collect-button');
             fishingGameState.ui.cardDetailFishingBasketSellBtn = fishingGameState.ui.cardDetailFishingBasketModal.querySelector('.fishing-basket-detail-sell-button');
        }
        
        this.createSVGCat(); 
        fishingGameState.ui.rodGroup = fishingGameState.ui.catContainer.querySelector('#fishing-rod-group');

        if (fishingGameState.ui.rodLineCanvas && fishingGameState.ui.waterArea) { // Canvas now relative to waterArea
            fishingGameState.ui.rodLineCanvas.width = fishingGameState.ui.waterArea.offsetWidth;
            fishingGameState.ui.rodLineCanvas.height = fishingGameState.ui.waterArea.offsetHeight;
        }

        this.createToolIcons(actualContentArea.querySelector('#fishing-ui-panel-right'));
        this.addEventListeners(); 
        
        if (typeof fishingTreeUi !== 'undefined' && fishingTreeUi.init) fishingTreeUi.init(actualContentArea); 
        if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.init) fishingWateringCanUi.init(actualContentArea); 
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.init) fishingRocksUi.init(actualContentArea); 
        
        if (typeof fishingTreeUi !== 'undefined' && fishingTreeUi.updateVisuals) fishingTreeUi.updateVisuals();
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.updateAllVisuals) fishingRocksUi.updateAllVisuals();
        if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIcon) fishingWateringCanUi.updateIcon();
        
        this.setCatState('idle');
    },
    
    createSVGCat() {
        const catContainer = fishingGameState.ui.catContainer;
        if (!catContainer) return;
        catContainer.innerHTML = ''; // Clear previous SVG if any

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("id", "fishing-cat-svg");
        svg.setAttribute("viewBox", "0 0 100 100"); // Adjusted viewBox for new design
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.overflow = "visible";

        // Boat
        const boat = document.createElementNS(svgNS, "path");
        boat.setAttribute("id", "cat-boat");
        // A slightly more spacious boat design:
        boat.setAttribute("d", "M10 85 Q20 75 50 77 T90 85 L80 95 L20 95 Z");
        boat.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.boatFill || "#A0522D"); // Sienna
        boat.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.boatStroke || "#5A2D0C"); // Darker Brown
        boat.setAttribute("stroke-width", "2");
        svg.appendChild(boat);

        // Cat Group (for potential whole-cat animation, though rod is separate)
        const catGroup = document.createElementNS(svgNS, "g");
        catGroup.setAttribute("id", "cat-character-group");

        // Body
        const body = document.createElementNS(svgNS, "ellipse");
        body.setAttribute("id", "cat-body");
        body.setAttribute("cx", "50"); body.setAttribute("cy", "65"); // Centered in new boat
        body.setAttribute("rx", "10"); body.setAttribute("ry", "12"); // Slightly slimmer
        body.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody || "#D2B48C"); // Tan
        body.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline || "#8B4513"); // SaddleBrown
        body.setAttribute("stroke-width", "1.5");
        catGroup.appendChild(body);

        // Head
        const head = document.createElementNS(svgNS, "circle");
        head.setAttribute("id", "cat-head");
        head.setAttribute("cx", "50"); head.setAttribute("cy", "48"); // On top of body
        head.setAttribute("r", "8");
        head.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody || "#D2B48C");
        head.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline || "#8B4513");
        head.setAttribute("stroke-width", "1.5");
        catGroup.appendChild(head);

        // Eyes
        const eyeLeft = document.createElementNS(svgNS, "circle");
        eyeLeft.setAttribute("cx", "47"); eyeLeft.setAttribute("cy", "47"); eyeLeft.setAttribute("r", "1.2");
        eyeLeft.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catEyes || "black");
        catGroup.appendChild(eyeLeft);

        const eyeRight = document.createElementNS(svgNS, "circle");
        eyeRight.setAttribute("cx", "53"); eyeRight.setAttribute("cy", "47"); eyeRight.setAttribute("r", "1.2");
        eyeRight.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catEyes || "black");
        catGroup.appendChild(eyeRight);

        // Ears
        const earLeft = document.createElementNS(svgNS, "path");
        earLeft.setAttribute("d", "M42 41 Q40 35 46 39 Z"); // Pointy ear
        earLeft.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody || "#D2B48C");
        earLeft.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline || "#8B4513");
        earLeft.setAttribute("stroke-width", "1.5");
        catGroup.appendChild(earLeft);

        const earRight = document.createElementNS(svgNS, "path");
        earRight.setAttribute("d", "M58 41 Q60 35 54 39 Z"); // Pointy ear
        earRight.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.catBody || "#D2B48C");
        earRight.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline || "#8B4513");
        earRight.setAttribute("stroke-width", "1.5");
        catGroup.appendChild(earRight);

        // Tail (optional, simple curve)
        const tail = document.createElementNS(svgNS, "path");
        tail.setAttribute("id", "cat-tail");
        tail.setAttribute("d", "M60 75 Q65 70 68 60"); // Simple curved tail
        tail.setAttribute("fill", "none");
        tail.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline || "#8B4513");
        tail.setAttribute("stroke-width", "2");
        catGroup.appendChild(tail);

        svg.appendChild(catGroup); // Add cat character to SVG

        // Fishing Rod Group (for animation - includes arm)
        const rodGroup = document.createElementNS(svgNS, "g");
        rodGroup.setAttribute("id", "fishing-rod-group"); // Crucial ID for existing animation logic
        const pivotX = 52; // Cat's right side (viewer's left)
        const pivotY = 60; // Cat's shoulder height
        rodGroup.setAttribute("transform-origin", `${pivotX}px ${pivotY}px`);

        // Cat's Arm (holding the rod)
        const arm = document.createElementNS(svgNS, "path");
        arm.setAttribute("id", "cat-arm");
        arm.setAttribute("d", `M${pivotX-3} ${pivotY+2} L${pivotX+5} ${pivotY-5} L${pivotX+10} ${pivotY-3}`); // Simple bent arm
        arm.setAttribute("fill", "none");
        arm.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.catOutline || "#8B4513");
        arm.setAttribute("stroke-width", "3");
        arm.setAttribute("stroke-linecap", "round");
        rodGroup.appendChild(arm);

        // Fishing Rod
        const rodBaseX = pivotX + 8; // Start rod near hand
        const rodBaseY = pivotY - 4;
        const rodTipX = rodBaseX + 30; // Rod length
        const rodTipY = rodBaseY - 60; // Rod angle upwards

        const rodLineSvg = document.createElementNS(svgNS, "line");
        rodLineSvg.setAttribute("id", "fishing-rod-svg-line"); // ID for the rod itself
        rodLineSvg.setAttribute("x1", `${rodBaseX}`); rodLineSvg.setAttribute("y1", `${rodBaseY}`);
        rodLineSvg.setAttribute("x2", `${rodTipX}`); rodLineSvg.setAttribute("y2", `${rodTipY}`);
        rodLineSvg.setAttribute("stroke", FISHING_CONFIG.SVG_COLORS.rod || "#8B4513"); // Brown rod
        rodLineSvg.setAttribute("stroke-width", "2.5");
        rodLineSvg.setAttribute("stroke-linecap", "round");
        rodGroup.appendChild(rodLineSvg);

        // Rod Tip Element (for line attachment)
        const rodTip = document.createElementNS(svgNS, "circle");
        rodTip.setAttribute("id", "rod-tip"); // CRUCIAL ID for drawRodLine()
        rodTip.setAttribute("cx", `${rodTipX}`); rodTip.setAttribute("cy", `${rodTipY}`);
        rodTip.setAttribute("r", "1"); // Small, can be invisible if fill is 'none'
        rodTip.setAttribute("fill", FISHING_CONFIG.SVG_COLORS.rodTip || "red");
        rodGroup.appendChild(rodTip);

        svg.appendChild(rodGroup); // Add rod group to SVG

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
                        <div class="fishing-basket-lock-control">
                            <input type="checkbox" id="fishing-basket-lock-mode">
                            <label for="fishing-basket-lock-mode">Lock Mode</label>
                        </div>
                    </div>
                     <div class="fishing-basket-tabs">
                        <button class="game-button active" data-tab-type="all_caught">All Caught</button>
                        <button class="game-button" data-tab-type="card">Fish</button>
                        <button class="game-button" data-tab-type="fruit_card">Fruit</button>
                        <button class="game-button" data-tab-type="mineral_card">Minerals</button>
                    </div>
                    <div id="fishing-basket-grid" class="fishing-game-modal-scrollable-content fishing-basket-grid gallery-grid"></div>
                    <div class="fishing-game-modal-actions">
                        <button id="fishing-basket-add-all-btn" class="game-button">Collect All Unlocked</button>
                        <button id="fishing-basket-sell-all-btn" class="game-button game-button-danger">Sell All Unlocked</button> 
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
            <div id="card-detail-fishingbasket-modal" class="fishing-game-modal-overlay" style="display: none;">
                <div class="fishing-game-modal-content card-detail-fishingbasket-content">
                    <div class="fishing-game-modal-header">
                        <h3>Item Details</h3>
                        <button class="game-button fishing-basket-detail-close-button">&times;</button>
                    </div>
                    <div class="fishing-game-modal-scrollable-content fishing-basket-detail-scrollable">
                        <div class="detail-image-container-frameless" id="fishing-basket-detail-image-container">
                            <img id="detail-image-fishingbasket" class="detail-image card">
                        </div>
                        <div class="detail-info-panel-frameless" id="fishing-basket-detail-info-panel">
                            <p id="detail-info-fishingbasket"></p>
                            <div id="detail-owned-versions-fishingbasket" style="display:none;"></div>
                            <button class="game-button fishing-basket-detail-collect-button">Collect This Item</button>
                            <button class="game-button game-button-danger fishing-basket-detail-sell-button">Sell This Item</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    createToolIcons(uiPanelRight) {
        if (!uiPanelRight) return;

        // Add Basket Icon dynamically
        fishingGameState.ui.basketIcon = document.createElement('div');
        fishingGameState.ui.basketIcon.id = 'fishing-tool-basket'; // New consistent ID
        fishingGameState.ui.basketIcon.className = 'fishing-ui-icon';
        fishingGameState.ui.basketIcon.innerHTML = '🧺';
        fishingGameState.ui.basketIcon.title = 'Open Basket';
        // Prepend basket icon so it appears first, or append if order doesn't matter / CSS handles it
        uiPanelRight.prepend(fishingGameState.ui.basketIcon);


        fishingGameState.ui.wateringCanIcon = document.createElement('div');
        fishingGameState.ui.wateringCanIcon.id = 'fishing-tool-watering-can';
        fishingGameState.ui.wateringCanIcon.className = 'fishing-ui-icon';
        fishingGameState.ui.wateringCanIcon.innerHTML = '🚰';
        fishingGameState.ui.wateringCanIcon.title = 'Watering Can';
        fishingGameState.ui.wateringCanIcon.draggable = true; 
        uiPanelRight.appendChild(fishingGameState.ui.wateringCanIcon);
        
        fishingGameState.ui.pickaxeIcon = document.createElement('div');
        fishingGameState.ui.pickaxeIcon.id = 'fishing-tool-pickaxe';
        fishingGameState.ui.pickaxeIcon.className = 'fishing-ui-icon';
        fishingGameState.ui.pickaxeIcon.innerHTML = '⛏️';
        fishingGameState.ui.pickaxeIcon.title = 'Pickaxe';
        uiPanelRight.appendChild(fishingGameState.ui.pickaxeIcon);


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
        
        if(ui.basketAddAllBtn) ui.basketAddAllBtn.addEventListener('click', () => { 
            if (typeof collectAllFishingBasketItems === 'function') collectAllFishingBasketItems(); else console.error("collectAllFishingBasketItems is not defined");
            playSound('sfx_button_click.mp3'); 
        });
        if(ui.basketSellAllBtn) ui.basketSellAllBtn.addEventListener('click', () => { 
            if (typeof sellAllUnlockedFishingBasketItems === 'function') sellAllUnlockedFishingBasketItems(); else console.error("sellAllUnlockedFishingBasketItems is not defined");
            playSound('sfx_button_click.mp3'); 
        });  

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
        if (ui.basketLockModeCheckbox) { 
            ui.basketLockModeCheckbox.addEventListener('change', () => {
                fishingGameState.isBasketLockModeActive = ui.basketLockModeCheckbox.checked;
                playSound('sfx_button_click_subtle.mp3');
                renderFishingBasket(); 
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

        if (ui.cardDetailFishingBasketModal) {
            ui.cardDetailFishingBasketModal.addEventListener('click', (event) => {
                if (event.target === ui.cardDetailFishingBasketModal) {
                    if (typeof closeFishingBasketDetailModal === "function") {
                        closeFishingBasketDetailModal();
                    }
                    playSound('sfx_modal_close.mp3');
                }
            });
        }
        if (ui.cardDetailFishingBasketCloseBtn) {
            ui.cardDetailFishingBasketCloseBtn.addEventListener('click', () => {
                if (typeof closeFishingBasketDetailModal === "function") {
                    closeFishingBasketDetailModal();
                }
                playSound('sfx_modal_close.mp3');
            });
        }

        // Pickaxe Icon Click Listener
        if (ui.pickaxeIcon) {
            ui.pickaxeIcon.addEventListener('click', () => {
                fishingGameState.pickaxeSelected = !fishingGameState.pickaxeSelected;
                if (typeof fishingRocksUi !== 'undefined' && typeof fishingRocksUi.updatePickaxeIconState === 'function') {
                    fishingRocksUi.updatePickaxeIconState();
                } else {
                    // Fallback direct styling if function not available
                    ui.pickaxeIcon.classList.toggle('active-tool', fishingGameState.pickaxeSelected);
                }
                if (typeof playSound === 'function') playSound(fishingGameState.pickaxeSelected ? 'sfx_tool_select.mp3' : 'sfx_tool_deselect.mp3');

                // Deselect watering can if pickaxe is selected
                if (fishingGameState.pickaxeSelected && fishingGameState.wateringCan && fishingGameState.wateringCan.isToolSelected) {
                    // Assuming a similar deselection logic for watering can if it exists
                    // fishingGameState.wateringCan.isToolSelected = false;
                    // if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIconState === 'function') {
                    //     fishingWateringCanUi.updateIconState();
                    // }
                }
                 this.updateStatusText(); // Update status text to reflect tool selection or default state
            });
        }

        // Watering Can Modal Toggle (moved from fishing-watering-can-ui.js)
        if (ui.wateringCanIcon) {
            ui.wateringCanIcon.addEventListener('click', () => {
                // Prevent drag logic from interfering if it's just a click
                if (fishingGameState.wateringCan && fishingGameState.wateringCan.isIconBeingDragged) return;

                const modal = document.getElementById('watering-can-upgrade-modal');
                if (modal) {
                    const isHidden = modal.style.display === 'none' || modal.style.display === '';
                    modal.style.display = isHidden ? 'flex' : 'none';
                    if (isHidden && typeof playSound === 'function') playSound('sfx_modal_open.mp3');
                    else if (!isHidden && typeof playSound === 'function') playSound('sfx_modal_close.mp3');

                    if (isHidden && typeof updateWateringCanUI === 'function') {
                        updateWateringCanUI(); // This function is from watering-can.js
                    }
                }
            });
        }
        // Ensure the modal's own close button works
        const closeModalButton = document.getElementById('close-watering-can-modal');
        if (closeModalButton && !closeModalButton.dataset.listenerAttached) {
            closeModalButton.addEventListener('click', () => {
                const modal = document.getElementById('watering-can-upgrade-modal');
                if (modal) {
                    modal.style.display = 'none';
                    if (typeof playSound === 'function') playSound('sfx_modal_close.mp3');
                }
            });
            closeModalButton.dataset.listenerAttached = 'true';
        }


        if (fishingWateringCanUi && fishingWateringCanUi.addDragListenersToIcon) { // This should now only contain drag listeners
            fishingWateringCanUi.addDragListenersToIcon(); 
        }
        
        if (ui.waterDropArea) { // This is #fishing-water-surface
            ui.waterDropArea.addEventListener('dragover', (e) => this.handleDragOver(e, 'water_area'));
            ui.waterDropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e, 'water_area'));
            ui.waterDropArea.addEventListener('drop', (e) => this.handleDrop(e, 'water_area'));
        }
        if (ui.treeDropArea) { // This is #fishing-tree-container
            ui.treeDropArea.addEventListener('dragover', (e) => this.handleDragOver(e, 'tree_area'));
            ui.treeDropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e, 'tree_area'));
            ui.treeDropArea.addEventListener('drop', (e) => this.handleDrop(e, 'tree_area'));
        }
         if (fishingRocksUi && fishingRocksUi.addClickListenersToIcons) { 
            fishingRocksUi.addClickListenersToIcons();
        }
    },
    handleDragOver(event, targetAreaType) {
        event.preventDefault(); 
        if (event.dataTransfer.types.includes('text/plain') && event.dataTransfer.getData('text/plain') === 'watering_can') {
            event.dataTransfer.dropEffect = 'move';
            if (fishingGameState.wateringCan.isIconBeingDragged) {
                 wateringCanMechanics.startOperationOnTarget(targetAreaType);
            }
            const targetEl = targetAreaType === 'water_area' ? fishingGameState.ui.waterDropArea : fishingGameState.ui.treeDropArea;
            if(targetEl) targetEl.classList.add('drag-over-active');
        }
    },
    handleDragLeave(event, targetAreaType) {
        const targetEl = targetAreaType === 'water_area' ? fishingGameState.ui.waterDropArea : fishingGameState.ui.treeDropArea;
        if(targetEl) targetEl.classList.remove('drag-over-active');
    },
    handleDrop(event, targetAreaType) {
        event.preventDefault();
        const targetEl = targetAreaType === 'water_area' ? fishingGameState.ui.waterDropArea : fishingGameState.ui.treeDropArea;
        if(targetEl) targetEl.classList.remove('drag-over-active');
    },
    
    setCatState(state) { 
        const rodGroup = fishingGameState.ui.rodGroup;
        if (!rodGroup) {
            return;
        }
        rodGroup.classList.remove('cat-rod-idle', 'cat-rod-casting', 'cat-rod-reeling');
        if (state === 'casting') rodGroup.classList.add('cat-rod-casting');
        else if (state === 'reeling') rodGroup.classList.add('cat-rod-reeling');
        else rodGroup.classList.add('cat-rod-idle');
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
            } else { 
                fishingGameState.ui.statusText.textContent = text || (fishingGameState.isRodCast ? "Waiting for a bite..." : "Press Space to cast!");
            }
        }
    },
    showBobber() { 
        if (fishingGameState.ui.bobber && fishingGameState.ui.waterDropArea) {
            const waterSurface = fishingGameState.ui.waterDropArea; 
            const bobberWidth = fishingGameState.ui.bobber.offsetWidth;
            const bobberHeight = fishingGameState.ui.bobber.offsetHeight;
            const padding = 5;

            const maxX = waterSurface.offsetWidth - bobberWidth - padding;
            const minY = padding; 
            const maxY = waterSurface.offsetHeight - bobberHeight - (waterSurface.offsetHeight * 0.1); 

            fishingGameState.bobberPosition.x = Math.random() * (maxX - padding) + padding;
            fishingGameState.bobberPosition.y = Math.random() * (maxY - minY) + minY;
            fishingGameState.ui.bobber.style.left = `${fishingGameState.bobberPosition.x}px`;
            fishingGameState.ui.bobber.style.top = `${fishingGameState.bobberPosition.y}px`;
            fishingGameState.ui.bobber.style.display = 'flex';
            this.drawRodLine(); // Draw line immediately after showing bobber
        }
    },
    hideBobber() { if (fishingGameState.ui.bobber) fishingGameState.ui.bobber.style.display = 'none'; },
    drawRodLine() {
        const canvas = fishingGameState.ui.rodLineCanvas;
        const rodTipEl = document.getElementById('rod-tip'); 
        const bobberEl = fishingGameState.ui.bobber;
    
        if (!canvas || !rodTipEl || !bobberEl || bobberEl.style.display === 'none') {
            if (canvas) { 
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }
    
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        // Get rod tip position relative to the canvas
        const rodTipRect = rodTipEl.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect(); 
        const startX = rodTipRect.left + rodTipRect.width / 2 - canvasRect.left;
        const startY = rodTipRect.top + rodTipRect.height / 2 - canvasRect.top;
    
        // Get bobber center position relative to the canvas
        // fishingGameState.bobberPosition.x/y are relative to #fishing-water-surface
        const waterSurface = fishingGameState.ui.waterDropArea; // This is #fishing-water-surface
        const waterSurfaceRect = waterSurface.getBoundingClientRect();
        
        const bobberCenterXInWaterSurface = fishingGameState.bobberPosition.x + bobberEl.offsetWidth / 2;
        const bobberCenterYInWaterSurface = fishingGameState.bobberPosition.y + bobberEl.offsetHeight / 2;
        
        const endX = (waterSurfaceRect.left - canvasRect.left) + bobberCenterXInWaterSurface;
        const endY = (waterSurfaceRect.top - canvasRect.top) + bobberCenterYInWaterSurface;

    
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const controlY = Math.max(startY, endY) + Math.abs(endY - startY) * 0.3 + 20; 
        const controlX = startX + (endX - startX) / 2; 
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
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

        if (!previewEl || !imgEl || !nameEl || !rarityEl || !gradeEl) return;

        if (item.type === 'ticket') {
            imgEl.src = `gui/summon_tickets/ticket_${item.details.rarityKey}.png`;
            imgEl.classList.add('ticket-image');
            nameEl.textContent = item.details.name;
            rarityEl.textContent = ''; gradeEl.textContent = '';
        } else if (item.type === 'card' || item.type === 'fruit_card' || item.type === 'mineral_card') {
            imgEl.src = getCardImagePath(item.details.set, item.details.cardId);
            imgEl.classList.remove('ticket-image');
            nameEl.textContent = `${item.details.set}C${item.details.cardId}`;
            const rarityInfo = getRarityTierInfo(item.details.rarityKey);
            rarityEl.textContent = `Rarity: ${rarityInfo ? rarityInfo.name : item.details.rarityKey}`;
            gradeEl.textContent = `Grade: ${item.details.grade}`;
        }
        previewEl.style.display = 'flex';
        setTimeout(() => { previewEl.style.display = 'none'; }, 2500);
    },
    hideCatchPreview() { if (fishingGameState.ui.catchPreview) fishingGameState.ui.catchPreview.style.display = 'none'; },
    
    _createSVGElement(type) {
        return document.createElementNS("http://www.w3.org/2000/svg", type);
    },
    
    updateTreeVisuals() {
       if (typeof fishingTreeUi !== 'undefined' && fishingTreeUi.updateVisuals) {
           fishingTreeUi.updateVisuals();
       }
    },
    addRockElementToDOM(rockInstance) { 
       if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.addRockToDOM) {
           fishingRocksUi.addRockToDOM(rockInstance);
       }
    },
    updateRockVisual(rockInstanceId) { 
         if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.updateVisual) {
           fishingRocksUi.updateVisual(rockInstanceId);
       }
    },
    playRockBreakAnimation(rockInstanceId, callback) { 
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.playBreakAnimation) {
           fishingRocksUi.playBreakAnimation(rockInstanceId, callback);
       }
    },
    updateAllRockVisuals() { 
        if (typeof fishingRocksUi !== 'undefined' && fishingRocksUi.updateAllVisuals) {
           fishingRocksUi.updateAllVisuals();
       }
    },
    updateWateringCanIcon() {
        if (typeof fishingWateringCanUi !== 'undefined' && fishingWateringCanUi.updateIcon) {
           fishingWateringCanUi.updateIcon();
       }
    },

    showCaughtItemDisplay(cardData) {
        const popup = document.getElementById('fishing-reward-popup');
        const imgEl = document.getElementById('fishing-reward-popup-img');
        const textEl = document.getElementById('fishing-reward-popup-text');

        if (!popup || !imgEl || !textEl) {
            console.error("Fishing reward popup elements not found.");
            // Fallback to simpler alert if UI elements are missing
            if (typeof showCustomAlert === 'function') {
                showCustomAlert(`You found: ${cardData.name || `${cardData.set} C${cardData.cardId}`}!`, null, 3500);
            }
            return;
        }

        imgEl.src = cardData.imagePath || getCardImagePath(cardData.set, cardData.cardId || cardData.id);
        imgEl.alt = cardData.name || `${cardData.set} C${cardData.cardId || cardData.id}`;

        // Attempt to get a nicer display name if rarity is available
        let displayName = cardData.name || `${cardData.set} C${cardData.cardId || cardData.id}`;
        if (cardData.rarityKey && typeof getRarityTierInfo === 'function') {
            const rarityInfo = getRarityTierInfo(cardData.rarityKey);
            if (rarityInfo && rarityInfo.name) {
                displayName = `${rarityInfo.name} ${displayName}`;
            }
        }
        textEl.textContent = `You found: ${displayName}!`;

        popup.style.display = 'flex';

        // Auto-hide after a delay
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3500);

        // Hide on click
        popup.onclick = () => {
            popup.style.display = 'none';
            // Important: remove the onclick to prevent issues if it's shown again quickly
            popup.onclick = null;
        };
    }
};
