// js/ui/components/global-item-display.js

function showTemporaryCollectedItem(cardData) {
    console.log(`%c[DisplayEvent] GLOBAL showTemporaryCollectedItem CALLED for item:`, 'color: red; font-weight: bold;', cardData ? cardData.name : cardData, cardData);
    if (!cardData) return;

    const existingDisplay = document.getElementById('temp-collected-item-display');
    if (existingDisplay) {
        existingDisplay.remove(); // Remove if one is already showing
    }

    const displayContainer = document.createElement('div');
    displayContainer.id = 'temp-collected-item-display';

    const cardImage = document.createElement('img');
    // Assuming getCardImagePath can handle cardData structure or a direct imagePath
    const imagePath = cardData.imagePath || getCardImagePath(cardData.set, cardData.id);
    cardImage.src = imagePath;
    cardImage.alt = cardData.name || "Collected Item";
    cardImage.onerror = function() {
        this.src = `https://placehold.co/200x280/333333/FFFFFF?text=${cardData.name || 'Item'}`;
        this.alt = `Error loading ${cardData.name}`;
        this.onerror = null;
    };

    const cardName = document.createElement('p');
    cardName.textContent = cardData.name || "New Item!";

    displayContainer.appendChild(cardImage);
    displayContainer.appendChild(cardName);
    document.body.appendChild(displayContainer);

    // Trigger fade in
    setTimeout(() => {
        displayContainer.classList.add('visible');
    }, 10); // Short delay to allow CSS transition

    // Fade out and remove after a few seconds
    setTimeout(() => {
        displayContainer.classList.remove('visible');
        setTimeout(() => {
            if (displayContainer.parentNode) {
                displayContainer.remove();
            }
        }, 500); // Allow fade out animation time
    }, 2500); // Display for 2.5 seconds
}

// Make it globally accessible
window.showTemporaryCollectedItem = showTemporaryCollectedItem;

console.log("global-item-display.js loaded");
