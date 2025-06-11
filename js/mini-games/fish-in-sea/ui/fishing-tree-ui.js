// js/mini-games/fish-in-sea/ui/fishing-tree-ui.js

const fishingTreeUi = {
    init(parentElement) {
        fishingGameState.ui.treeSvg = parentElement.querySelector('#fishing-tree-svg');
        fishingGameState.ui.treeMoistureBarContainer = parentElement.querySelector('#fishing-tree-moisture-bar-container');
        fishingGameState.ui.treeMoistureBar = parentElement.querySelector('#fishing-tree-moisture-bar');
        fishingGameState.ui.fruitSlotsContainer = parentElement.querySelector('#fishing-fruit-slots-container');
        fishingGameState.ui.treeDropArea = parentElement.querySelector('#fishing-tree-container'); 

        if (fishingGameState.ui.treeDropArea) {
             fishingGameState.ui.treeDropArea.addEventListener('dragover', (e) => fishingUi.handleDragOver(e, 'tree_area'));
             fishingGameState.ui.treeDropArea.addEventListener('dragleave', (e) => fishingUi.handleDragLeave(e, 'tree_area'));
             fishingGameState.ui.treeDropArea.addEventListener('drop', (e) => fishingUi.handleDrop(e, 'tree_area'));
        }
    },

    _getSVGTreePath() { 
        // ViewBox is 0 0 200 180
        // Trunk: Narrower base, less prominent roots
        const trunkPath = "M100,180 C85,180 75,175 65,160 C50,140 55,100 70,70 L75,50 C80,30 90,25 100,25 C110,25 120,30 125,50 L130,70 C145,100 150,140 135,160 C125,175 115,180 100,180 Z";
        // Leaves: Kept the same wider canopy from previous adjustment
        const leavesPath = "M20,70 C-20,50 10,0 100,0 C190,0 220,50 180,70 C210,100 170,130 100,120 C30,130 -10,100 20,70 Z";
        return { 
            trunk: trunkPath,
            leaves: leavesPath
        };
    },

    _getSVGFruitPath(growthStage) { 
        switch(growthStage) {
            case 'sprout': return "M10,20 Q12,15 15,20 Q12,25 10,20 M15,20 Q18,15 20,20 Q18,25 15,20"; 
            case 'bud': return "M12,18 A6,6 0 1,1 12,6 A6,6 0 1,1 12,18 Z"; 
            default: return "M5,5 H19 V29 H5 Z"; 
        }
    },

    updateVisuals() { 
        const treeSvgContainer = fishingGameState.ui.treeSvg; 
        if (!treeSvgContainer || !fishingGameState.ui.fruitSlotsContainer) {
            return;
        }
        treeSvgContainer.innerHTML = ''; 
        treeSvgContainer.setAttribute("viewBox", "0 0 200 180"); // Ensure viewBox is correct for new paths


        const treePaths = this._getSVGTreePath();
        const trunk = fishingUi._createSVGElement('path'); 
        trunk.setAttribute('d', treePaths.trunk);
        trunk.setAttribute('fill', FISHING_CONFIG.SVG_COLORS.treeTrunk);
        trunk.setAttribute('stroke', FISHING_CONFIG.SVG_COLORS.treeTrunkStroke);
        trunk.setAttribute('stroke-width', '1.5'); 
        treeSvgContainer.appendChild(trunk);

        const leaves = fishingUi._createSVGElement('path');
        leaves.setAttribute('d', treePaths.leaves);
        leaves.setAttribute('fill', FISHING_CONFIG.SVG_COLORS.treeLeaves);
        leaves.setAttribute('stroke', FISHING_CONFIG.SVG_COLORS.treeLeavesStroke);
        leaves.setAttribute('stroke-width', '1'); 
        treeSvgContainer.appendChild(leaves);
        
        const moisturePercentage = Math.max(0, Math.min(100, (fishingGameState.treeMoistureLevel / FISHING_CONFIG.TREE_CONFIG.MAX_MOISTURE_LEVEL) * 100));
        if (fishingGameState.ui.treeMoistureBar) {
            fishingGameState.ui.treeMoistureBar.style.width = `${moisturePercentage}%`;
            fishingGameState.ui.treeMoistureBar.textContent = `${moisturePercentage.toFixed(0)}%`; 
        }

        if (fishingGameState.ui.fruitSlotsContainer) {
            fishingGameState.ui.fruitSlotsContainer.innerHTML = '';
            fishingGameState.fruitSlots.forEach((slot, index) => {
                const slotEl = document.createElement('div');
                slotEl.className = 'fishing-fruit-slot';
                slotEl.dataset.slotIndex = index; 

                const innerContainer = document.createElement('div');
                innerContainer.className = 'fruit-card-container-inner';

                const backVisual = fishingUi._createSVGElement('svg'); 
                backVisual.classList.add('fruit-card-back');
                backVisual.setAttribute('viewBox', '0 0 24 34'); 

                const frontImg = fishingUi._createSVGElement('image'); 
                frontImg.classList.add('fruit-card-front');
                
                if (slot.isMature && slot.item) {
                    slotEl.classList.add('mature');
                    frontImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', getCardImagePath(slot.item.set, slot.item.cardId));
                    frontImg.classList.add(slot.item.rarityKey); 
                    frontImg.onerror = () => frontImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'gui/fishing_game/tree-back.png'); 
                    
                    const matureBackPath = fishingUi._createSVGElement('rect');
                    matureBackPath.setAttribute('width', '100%'); matureBackPath.setAttribute('height', '100%');
                    matureBackPath.setAttribute('fill', FISHING_CONFIG.SVG_COLORS.fruitMaturing);
                    backVisual.appendChild(matureBackPath);

                    slotEl.onclick = () => treeMechanics.collectFruit(index);
                } else if (slot.growthProgress > 0 && slot.targetRarityKey) {
                    slotEl.classList.add('growing-visible');
                    let fruitPathData = "";
                    let fruitFillColor = FISHING_CONFIG.SVG_COLORS.fruitSprout;

                    if (slot.growthProgress < 33) fruitPathData = this._getSVGFruitPath('sprout');
                    else if (slot.growthProgress < 66) { fruitPathData = this._getSVGFruitPath('bud'); fruitFillColor = FISHING_CONFIG.SVG_COLORS.fruitBud; }
                    else { fruitPathData = this._getSVGFruitPath('maturing'); fruitFillColor = FISHING_CONFIG.SVG_COLORS.fruitMaturing; }
                    
                    const fruitPathEl = fishingUi._createSVGElement('path');
                    fruitPathEl.setAttribute('d', fruitPathData);
                    fruitPathEl.setAttribute('fill', fruitFillColor);
                    fruitPathEl.setAttribute('stroke', FISHING_CONFIG.SVG_COLORS.fruitStroke);
                    fruitPathEl.setAttribute('stroke-width', '0.5');
                    backVisual.appendChild(fruitPathEl);
                    frontImg.style.display = 'none';
                } else {
                     slotEl.classList.add('empty-slot'); 
                     backVisual.style.display = 'none';
                     frontImg.style.display = 'none';
                }

                innerContainer.appendChild(backVisual);
                innerContainer.appendChild(frontImg);
                slotEl.appendChild(innerContainer);
                fishingGameState.ui.fruitSlotsContainer.appendChild(slotEl);
            });
        }
    }
};