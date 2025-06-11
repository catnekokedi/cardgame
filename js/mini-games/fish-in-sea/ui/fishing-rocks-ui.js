// js/mini-games/fish-in-sea/ui/fishing-rocks-ui.js

const fishingRocksUi = {
    init(parentElement) {
        fishingGameState.ui.rocksContainer = parentElement.querySelector('#fishing-rocks-container');
        fishingGameState.ui.pickaxeIcon = parentElement.querySelector('#fishing-ui-panel-right #fishing-tool-pickaxe');

        if (fishingGameState.ui.pickaxeIcon) {
            fishingGameState.ui.pickaxeIcon.addEventListener('click', () => this.handlePickaxeToolClick());
        }
        // console.log('[Rock UI] Initialized. Rocks Container Element:', fishingGameState.ui.rocksContainer);
    },

    _getSVGRockPath(rockDef, crackLevel = 0) { 
        let pathData = "M10,30 Q15,5 25,10 T40,30 Q30,35 20,35 T10,30 Z"; 
        if (crackLevel === 1 && rockDef.clicksToBreak > 1) pathData += " M15,15 L25,25"; 
        else if (crackLevel === 2 && rockDef.clicksToBreak > 2) pathData += " M15,15 L25,25 M15,25 L25,15"; 
        else if (crackLevel >= 3 && rockDef.clicksToBreak > 3) pathData += " M15,15 L25,25 M15,25 L25,15 M20,10 L20,30 M12,20 L38,20";
        return pathData;
    },

    addRockToDOM(rockInstance) { 
        const rocksContainer = fishingGameState.ui.rocksContainer;
        if (!rocksContainer) return;
        // console.log(`[Rock UI] Adding rock to DOM: ${rockInstance.definition.name}, ID: ${rockInstance.instanceId}`);


        const rockWrapper = document.createElement('div');
        rockWrapper.className = 'fishing-rock-wrapper';
        rockWrapper.id = rockInstance.instanceId;
        rockWrapper.style.left = `${rockInstance.position.x}%`;
        rockWrapper.style.bottom = `${rockInstance.position.y}%`;
        rockWrapper.onclick = () => this.handleRockClick(rockInstance.instanceId);

        const rockSvg = fishingUi._createSVGElement('svg'); 
        rockSvg.classList.add('fishing-rock-svg');
        rockSvg.setAttribute('viewBox', '0 0 50 40'); 
        rockSvg.setAttribute('width', '40'); 
        rockSvg.setAttribute('height', '32'); 
        
        const rockName = document.createElement('div');
        rockName.className = 'rock-name-display';
        rockName.textContent = rockInstance.definition.name;

        rockWrapper.appendChild(rockSvg);
        rockWrapper.appendChild(rockName);
        rocksContainer.appendChild(rockWrapper);
        this.updateVisual(rockInstance.instanceId); 
    },

    updateVisual(rockInstanceId) { 
        const rockWrapper = document.getElementById(rockInstanceId);
        if (!rockWrapper) return;
        const rockSvg = rockWrapper.querySelector('.fishing-rock-svg');
        const rockInstance = fishingGameState.rocks.find(r => r.instanceId === rockInstanceId);

        if (!rockSvg || !rockInstance) return;
        rockSvg.innerHTML = ''; 
        // console.log(`[Rock UI] Updating rock visual: ${rockInstanceId}, Ready: ${rockInstance.isReadyToMine}, Clicks: ${rockInstance.currentClicks}`);


        const basePath = fishingUi._createSVGElement('path');
        const crackLevel = rockInstance.isReadyToMine ? rockInstance.currentClicks : 0;
        basePath.setAttribute('d', this._getSVGRockPath(rockInstance.definition, crackLevel));
        
        if (!rockInstance.isReadyToMine) {
            rockSvg.classList.add('cooldown');
            basePath.setAttribute('fill', FISHING_CONFIG.SVG_COLORS.rockCooldown);
            basePath.setAttribute('stroke', FISHING_CONFIG.SVG_COLORS.rockCooldownStroke);
        } else {
            rockSvg.classList.remove('cooldown');
            basePath.setAttribute('fill', rockInstance.definition.color || FISHING_CONFIG.SVG_COLORS.rockNormal);
            basePath.setAttribute('stroke', FISHING_CONFIG.SVG_COLORS.rockStroke);
        }
        basePath.setAttribute('stroke-width', '1');
        rockSvg.appendChild(basePath);
    },

    playBreakAnimation(rockInstanceId, callback) { 
        const rockWrapper = document.getElementById(rockInstanceId);
        if (!rockWrapper) { if (callback) callback(); return; }
        const rockSvg = rockWrapper.querySelector('.fishing-rock-svg');
        if (!rockSvg) { if (callback) callback(); return; }
        // console.log(`[Rock UI] Playing break animation for rock: ${rockInstanceId}`);


        rockSvg.classList.add('mining-effect');
        
        setTimeout(() => {
            if (rockWrapper && rockWrapper.parentNode) {
                 rockWrapper.parentNode.removeChild(rockWrapper);
            }
            if (callback) callback();
        }, 250); 
    },

    updateAllVisuals() { 
        if (fishingGameState.ui.rocksContainer) fishingGameState.ui.rocksContainer.innerHTML = '';
        fishingGameState.rocks.forEach(rock => {
            this.addRockToDOM(rock);
        });
    },

    handleRockClick(rockInstanceId) {
        if (fishingGameState.pickaxeSelected) {
            // console.log(`[Rock UI] Pickaxe selected, attempting to mine rock: ${rockInstanceId}`);
            rockMechanics.mineRock(rockInstanceId);
        } else {
            // console.log(`[Rock UI] Rock clicked but pickaxe not selected: ${rockInstanceId}`);
        }
    },

    handlePickaxeToolClick() {
        fishingGameState.pickaxeSelected = !fishingGameState.pickaxeSelected;
        this.updatePickaxeIconState();
        // console.log(`[Rock UI] Pickaxe tool toggled. Selected: ${fishingGameState.pickaxeSelected}`);
        if (typeof playSound === 'function') playSound('sfx_button_click_subtle.mp3');
    },

    updatePickaxeIconState() {
        if (fishingGameState.ui.pickaxeIcon) {
            fishingGameState.ui.pickaxeIcon.classList.toggle('selected-tool', fishingGameState.pickaxeSelected);
            // console.log(`[Rock UI] Pickaxe icon class 'selected-tool' ${fishingGameState.pickaxeSelected ? 'added' : 'removed'}`);
        }
    }
};