// js/mini-games/fish-in-sea/watering-can.js

// State for watering can upgrades
let wateringCanUpgrades = {
    constantMoisture: false,
    autoMoistureLevel: 0, // e.g., 0 = off, 1 = basic, 2 = advanced
    autoPickEnabled: false
};

const CONSTANT_MOISTURE_COST = 500; // Example cost

/**
 * Initializes the watering can functionality.
 * Sets up event listeners for the icon.
 */
function initializeWateringCan() {
    const canIcon = document.getElementById('watering-can-icon');
    if (canIcon) {
        canIcon.addEventListener('click', openUpgradeModal);
    } else {
        console.error("Watering can icon not found. Ensure HTML is loaded before this script or defer this call.");
    }

    const closeModalButton = document.getElementById('close-watering-can-modal');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeUpgradeModal);
    } else {
        console.error("Watering can modal close button not found.");
    }

    const purchaseMoistureButton = document.getElementById('purchase-moisture-btn');
    if (purchaseMoistureButton) {
        purchaseMoistureButton.addEventListener('click', purchaseMoistureUpgrade);
    } else {
        console.error("Purchase moisture button not found.");
    }

    // Update UI based on loaded data (if any was loaded before this)
    updateWateringCanUI();
    console.log("Watering Can initialized.");
}

/**
 * Opens the watering can upgrade modal.
 */
function openUpgradeModal() {
    const modal = document.getElementById('watering-can-upgrade-modal');
    if (modal) {
        modal.style.display = 'flex'; // Assuming uses flex like other modals
        playSound('sfx_modal_open.mp3');
    }
}

/**
 * Closes the watering can upgrade modal.
 */
function closeUpgradeModal() {
    const modal = document.getElementById('watering-can-upgrade-modal');
    if (modal) {
        modal.style.display = 'none';
        playSound('sfx_modal_close.mp3');
    }
}

/**
 * Handles the purchase of the constant moisture upgrade.
 */
function purchaseMoistureUpgrade() {
    // Assuming a global `playerData` or similar object with `toki` currency
    // and `showCustomModal` for notifications.
    if (typeof playerData === 'undefined' || typeof playerData.toki === 'undefined') {
        console.error("playerData or playerData.toki is not defined. Cannot process purchase.");
        if (typeof showCustomModal === 'function') showCustomModal("Error: Player data not found.", "error");
        return;
    }

    if (wateringCanUpgrades.constantMoisture) {
        if (typeof showCustomModal === 'function') showCustomModal("You already have Constant Moisture!");
        playSound('sfx_error.mp3');
        return;
    }

    if (playerData.toki >= CONSTANT_MOISTURE_COST) {
        playerData.toki -= CONSTANT_MOISTURE_COST;
        console.log(`Spent ${CONSTANT_MOISTURE_COST} toki. Remaining: ${playerData.toki}`);
        if (typeof updateTokiDisplay === "function") updateTokiDisplay(); // Update currency display

        wateringCanUpgrades.constantMoisture = true;
        
        // Attempt to call the function in treeMechanics.js
        // Ensure treeMechanics.js is loaded and setConstantMoistureSupply is global or properly namespaced
        if (typeof setConstantMoistureSupply === 'function') {
            setConstantMoistureSupply(true);
            console.log("Constant moisture supply purchased and activated.");
        } else {
            console.warn("setConstantMoistureSupply function not found. Tree moisture may not be affected by upgrade.");
        }

        updateWateringCanUI();
        if (typeof showCustomModal === 'function') showCustomModal("Constant Moisture purchased! The tree will now stay moist.", "success");
        playSound('sfx_purchase_upgrade.mp3');
        closeUpgradeModal();
        
        if (typeof saveGame === 'function') saveGame();

    } else {
        if (typeof showCustomModal === 'function') showCustomModal(`Not enough Toki! Cost: ${CONSTANT_MOISTURE_COST} Toki.`, "error");
        playSound('sfx_error.mp3');
        console.log("Not enough Toki for constant moisture upgrade.");
    }
}

/**
 * Updates the UI elements related to watering can upgrades.
 */
function updateWateringCanUI() {
    const purchaseMoistureButton = document.getElementById('purchase-moisture-btn');
    if (purchaseMoistureButton) {
        if (wateringCanUpgrades.constantMoisture) {
            purchaseMoistureButton.textContent = "Purchased";
            purchaseMoistureButton.disabled = true;
        } else {
            purchaseMoistureButton.textContent = `Purchase (Cost: ${CONSTANT_MOISTURE_COST} Toki)`;
            purchaseMoistureButton.disabled = false;
        }
    }
    // Add logic for other upgrades here in the future
}

// --- Placeholder functions for future upgrades ---
function purchaseAutoMoistureUpgrade(level) {
    console.log(`Placeholder: Attempt to purchase auto-moisture level ${level}`);
    // wateringCanUpgrades.autoMoistureLevel = level;
    // updateWateringCanUI();
}

function purchaseAutoPickUpgrade() {
    console.log("Placeholder: Attempt to purchase auto-pick");
    // wateringCanUpgrades.autoPickEnabled = true;
    // updateWateringCanUI();
}

// --- Save and Load ---

/**
 * Gets the watering can upgrade data for saving.
 * @returns {object} The watering can upgrade data.
 */
function getWateringCanDataForSave() {
    return { ...wateringCanUpgrades };
}

/**
 * Loads watering can upgrade data.
 * @param {object} data The saved watering can upgrade data.
 */
function loadWateringCanData(data) {
    if (data) {
        wateringCanUpgrades.constantMoisture = data.constantMoisture || false;
        wateringCanUpgrades.autoMoistureLevel = data.autoMoistureLevel || 0;
        wateringCanUpgrades.autoPickEnabled = data.autoPickEnabled || false;
    } else {
        // Default state if no save data
        wateringCanUpgrades.constantMoisture = false;
        wateringCanUpgrades.autoMoistureLevel = 0;
        wateringCanUpgrades.autoPickEnabled = false;
    }

    // After loading, ensure the effects of upgrades are applied
    if (wateringCanUpgrades.constantMoisture) {
        if (typeof setConstantMoistureSupply === 'function') {
            setConstantMoistureSupply(true); // Activate the effect
        } else {
            console.warn("loadWateringCanData: setConstantMoistureSupply function not found. Effect may not apply.");
        }
    }

    // Update UI to reflect loaded state AFTER data is processed
    // updateWateringCanUI(); // This will be called by initializeWateringCan after DOM is ready
    console.log("Watering Can data loaded:", wateringCanUpgrades);
}

// Make initializeWateringCan globally accessible
window.initializeWateringCan = initializeWateringCan;

console.log("watering-can.js loaded");
