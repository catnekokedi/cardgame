
// js/ui/components/cardDetailModal.js

function applyCardHoverEffects(event, cardElementContainer) {
    const cardElement = cardElementContainer.querySelector('.detail-image.card');
    if (!cardElement) return;

    const cardWidth = cardElementContainer.offsetWidth;
    const cardHeight = cardElementContainer.offsetHeight;

    if (cardWidth === 0 || cardHeight === 0) return;

    const rect = cardElementContainer.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const mxPercent = mouseX / cardWidth;
    const myPercent = mouseY / cardHeight;

    cardElementContainer.style.setProperty('--mx', `${mxPercent * 100}%`);
    cardElementContainer.style.setProperty('--my', `${myPercent * 100}%`);
    cardElementContainer.style.setProperty('--posx', `${mxPercent * 100}%`);
    cardElementContainer.style.setProperty('--posy', `${myPercent * 100}%`);

    const dx = mxPercent - 0.5;
    const dy = myPercent - 0.5;
    const hypNormalized = Math.min(Math.sqrt(dx * dx + dy * dy) / 0.7071, 1);
    cardElementContainer.style.setProperty('--hyp', hypNormalized.toFixed(3));

    const tiltX = (myPercent - 0.5) * -18;
    const tiltY = (mxPercent - 0.5) * 18;
    const scaleEffect = 1.05;
    const translateYEffect = -5;

    cardElement.style.transform = `perspective(1200px) translateY(${translateYEffect}px) scale(${scaleEffect}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
}

function resetCardHoverEffects(cardElementContainer) {
    const cardElement = cardElementContainer.querySelector('.detail-image.card');
    if (!cardElement) return;

    cardElementContainer.style.removeProperty('--mx');
    cardElementContainer.style.removeProperty('--my');
    cardElementContainer.style.removeProperty('--posx');
    cardElementContainer.style.removeProperty('--posy');
    cardElementContainer.style.removeProperty('--hyp');
    cardElement.style.transform = 'perspective(1200px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)';
}


function showCardDetail(setIdentifier, cardId, rarityKey, source, instanceId = null, grade = null, packCardDetails = null) {
    const modalId = `card-detail-${source}-modal`;
    const modal = document.getElementById(modalId);
    const imgElement = document.getElementById(`detail-image-${source}`);
    const infoElement = document.getElementById(`detail-info-${source}`);
    const ownedVersionsElement = document.getElementById(`detail-owned-versions-${source}`);

    if (!modal || !imgElement || !infoElement || !ownedVersionsElement) {
        console.error(`Modal elements for source "${source}" not found.`);
        return;
    }
    if (typeof playSound === 'function') playSound('sfx_modal_open.mp3');


    const meta = getSetMetadata(setIdentifier);
    if (!meta || meta.name.startsWith("Unknown Set")) {
        console.error(`Card detail: Invalid set identifier ${setIdentifier}`);
        return;
    }

    const fixedProps = getFixedGradeAndPrice(setIdentifier, cardId);
    const displayRarityKey = rarityKey || fixedProps.rarityKey;
    const displayGrade = grade !== null ? grade : fixedProps.grade;
    const displayPrice = fixedProps.price;

    const rarityTierInfo = getRarityTierInfo(displayRarityKey);
    const displayNameRarity = rarityTierInfo ? rarityTierInfo.name : displayRarityKey;

    imgElement.src = getCardImagePath(setIdentifier, cardId);
    imgElement.alt = `Card ${setIdentifier}-C${cardId} (${displayNameRarity}, Grade ${displayGrade})`;
    imgElement.className = `detail-image card ${displayRarityKey}`;
    imgElement.onerror = function() { this.src=`https://placehold.co/300x420/CF6679/FFFFFF?text=${setIdentifier}-C${cardId}`; this.alt=`Error loading image`; this.onerror=null; };

    const cardInCollection = collection[setIdentifier]?.[cardId];
    const ownedCount = cardInCollection ? cardInCollection.count : 0;

    let infoHTML = `<p><strong>Set:</strong> ${meta.name}</p>`;
    infoHTML += `<p><strong>Card ID:</strong> ${cardId}</p>`;
    infoHTML += `<p><strong>Rarity:</strong> <span class="rarity-text-${displayRarityKey}">${displayNameRarity}</span></p>`;
    infoHTML += `<p><strong>Grade:</strong> ${displayGrade}</p>`;
    infoHTML += `<p><strong>Value:</strong> ${formatCurrency(displayPrice)}</p>`;
    infoHTML += `<p><strong>Owned:</strong> ${ownedCount > 0 ? ownedCount : 'Not Owned'}</p>`;
    infoElement.innerHTML = infoHTML;

    ownedVersionsElement.innerHTML = '';
    ownedVersionsElement.style.display = 'none';

    if (source === 'gallery') {
        const addToOfferButton = document.getElementById('add-to-offer-gallery-button');
        const addToAnvilButton = document.getElementById('add-to-anvil-gallery-button');

        // "Add to Offer" button
        if (addToOfferButton && typeof addCardToDirectOfferPlayerItems === 'function') {
            addToOfferButton.style.display = 'inline-flex';

            const canPhysicallyOffer = cardInCollection && cardInCollection.count > 1;

            let alreadyOffered = false;
            if (typeof directOfferPlayerItems !== 'undefined' && Array.isArray(directOfferPlayerItems)) {
                alreadyOffered = directOfferPlayerItems.some(offeredItem =>
                    offeredItem.setIdentifier === setIdentifier &&
                    offeredItem.cardId === cardId && 
                    offeredItem.rarityKey === displayRarityKey &&
                    offeredItem.grade === displayGrade
                );
            }

            if (!canPhysicallyOffer) {
                addToOfferButton.disabled = true;
                addToOfferButton.title = "You need more than one copy to offer.";
                addToOfferButton.onclick = null;
            } else if (alreadyOffered) {
                addToOfferButton.disabled = true;
                addToOfferButton.title = "An identical card is already in your current offer.";
                addToOfferButton.onclick = null;
            } else {
                addToOfferButton.disabled = false;
                addToOfferButton.title = "Add this card to your offer.";
                addToOfferButton.onclick = () => {
                    addCardToDirectOfferPlayerItems(setIdentifier, cardId, displayRarityKey, displayPrice, instanceId, displayGrade);
                    closeDetail(source);
                    if (typeof playSound === 'function') playSound('sfx_offer_add_card.mp3');
                };
            }
        } else if (addToOfferButton) { // Fallback if function missing
            addToOfferButton.style.display = 'inline-flex';
            addToOfferButton.disabled = true;
        }


        // "Add to Anvil" button always visible, state based on count and rarity
        if (addToAnvilButton && typeof addCardToAnvil === 'function') {
             addToAnvilButton.style.display = 'inline-flex';
             const canAddToAnvil = cardInCollection && cardInCollection.count > 0 && displayRarityKey !== 'shiny';
             addToAnvilButton.disabled = !canAddToAnvil;
             if (canAddToAnvil) {
                addToAnvilButton.onclick = () => {
                    const currentSet = setIdentifier;
                    const currentCardId = cardId;
                    const currentRarityKey = displayRarityKey; 
                    const currentGrade = displayGrade; 
                    const currentInstanceIdForAnvil = instanceId; 
                    const currentDisplayPrice = displayPrice; 

                    addCardToAnvil(currentSet, currentCardId, currentRarityKey, currentDisplayPrice, currentGrade, currentInstanceIdForAnvil);
                    if (typeof playSound === 'function') playSound('sfx_anvil_add_card.mp3');


                    // Refresh modal info after adding to Anvil (as count changes)
                    const updatedCardData = collection[currentSet]?.[currentCardId];
                    if (updatedCardData && updatedCardData.count > 0) {
                        let currentInfoHTML = infoElement.innerHTML;
                        const ownedRegex = /<p><strong>Owned:<\/strong>.*?<\/p>/;
                        if (ownedRegex.test(currentInfoHTML)) {
                            currentInfoHTML = currentInfoHTML.replace(ownedRegex, `<p><strong>Owned:</strong> ${updatedCardData.count}</p>`);
                        } else { 
                           currentInfoHTML += `<p><strong>Owned:</strong> ${updatedCardData.count}</p>`;
                        }
                        infoElement.innerHTML = currentInfoHTML;

                        // Re-evaluate "Add to Offer" button state after Anvil action
                        const stillCanPhysicallyOffer = updatedCardData.count > 1;
                        let stillAlreadyOffered = false;
                        if (typeof directOfferPlayerItems !== 'undefined' && Array.isArray(directOfferPlayerItems)) {
                            stillAlreadyOffered = directOfferPlayerItems.some(offeredItem =>
                                offeredItem.setIdentifier === currentSet &&
                                offeredItem.cardId === currentCardId &&
                                offeredItem.rarityKey === currentRarityKey &&
                                offeredItem.grade === currentGrade
                            );
                        }
                        if (addToOfferButton) {
                            if (!stillCanPhysicallyOffer) {
                                addToOfferButton.disabled = true;
                                addToOfferButton.title = "You need more than one copy to offer.";
                            } else if (stillAlreadyOffered) {
                                addToOfferButton.disabled = true;
                                addToOfferButton.title = "An identical card is already in your current offer.";
                            } else {
                                addToOfferButton.disabled = false;
                                addToOfferButton.title = "Add this card to your offer.";
                                // Onclick is already set or reset by the main offer button logic above,
                                // but if it needs to be re-set here based on new count:
                                // addToOfferButton.onclick = () => { ... }; 
                            }
                        }
                        
                        // Re-evaluate "Add to Anvil" button state
                        const stillCanAddToAnvil = updatedCardData.count > 0 && displayRarityKey !== 'shiny';
                        addToAnvilButton.disabled = !stillCanAddToAnvil;
                        
                        if (!stillCanAddToAnvil && (addToOfferButton && addToOfferButton.disabled)) { // Close if no actions left
                            closeDetail(source);
                        }
                    } else { // Card count became 0 or less
                        closeDetail(source);
                    }
                };
            } else {
                addToAnvilButton.onclick = null;
            }
        } else if (addToAnvilButton) {
            addToAnvilButton.style.display = 'inline-flex'; // Ensure visible even if function missing, but disabled
            addToAnvilButton.disabled = true;
        }
        // Exhibit button logic removed from gallery

    } else if (source === 'collection') {
        const infoPanel = document.getElementById(`detail-info-panel-${source}`);
        if (!infoPanel) {
            console.error(`CRITICAL: infoPanel for source '${source}' (ID: detail-info-panel-${source}) not found in DOM! Cannot attach exhibit button.`);
            if (modal) modal.style.display = 'none';
            showCustomAlert("Error displaying card details. UI components missing.");
            return; 
        }

        const exhibitBtn = document.getElementById('exhibit-card-collection-button');

        if (exhibitBtn && typeof idleExhibition !== 'undefined' && typeof idleExhibition.isCardTypeExhibited === 'function' && typeof idleExhibition.tryExhibitCard === 'function' && typeof idleExhibitionState !== 'undefined' && typeof idleExhibitionConfig !== 'undefined') {
            const playerOwnsCard = cardInCollection && cardInCollection.count > 0;
            exhibitBtn.style.display = playerOwnsCard ? 'inline-flex' : 'none';

            if (playerOwnsCard) {
                const alreadyExhibited = idleExhibition.isCardTypeExhibited(setIdentifier, cardId);
                const exhibitionSlotsFull = idleExhibitionState.exhibitedCards.filter(slot => slot !== null).length >= idleExhibitionState.unlockedSlotsCount;
                
                if (alreadyExhibited) {
                    exhibitBtn.disabled = true;
                    exhibitBtn.title = "Already on exhibition";
                    exhibitBtn.onclick = null;
                } else if (exhibitionSlotsFull) {
                    exhibitBtn.disabled = true;
                    exhibitBtn.title = "Exhibition slots are full";
                    exhibitBtn.onclick = null;
                } else {
                    exhibitBtn.disabled = false;
                    exhibitBtn.title = "Exhibit this card";
                    exhibitBtn.onclick = () => {
                        idleExhibition.tryExhibitCard(setIdentifier, cardId, displayRarityKey, displayGrade, displayPrice, null);
                        if (typeof playSound === 'function') playSound('sfx_idle_place_card.mp3');
                        // Re-check button state after exhibiting
                        const isNowExhibited = idleExhibition.isCardTypeExhibited(setIdentifier, cardId);
                        const slotsStillFull = idleExhibitionState.exhibitedCards.filter(slot => slot !== null).length >= idleExhibitionState.unlockedSlotsCount;
                        if (isNowExhibited) {
                            exhibitBtn.disabled = true;
                            exhibitBtn.title = "Already on exhibition";
                        } else if (slotsStillFull) {
                             exhibitBtn.disabled = true;
                            exhibitBtn.title = "Exhibition slots are full";
                        }
                    };
                }
            } else if (exhibitBtn) { // Button exists but player doesn't own
                exhibitBtn.disabled = true;
                exhibitBtn.title = "You don't own this card";
                exhibitBtn.onclick = null;
            }
        } else if (exhibitBtn) {
            exhibitBtn.style.display = 'none'; // Hide if IE system not ready
            exhibitBtn.disabled = true;
        } else {
            console.error("Exhibit button (ID: exhibit-card-collection-button) not found within collection modal.");
        }
    }

    modal.style.display = 'flex';
}

function closeDetail(source) {
    const modal = document.getElementById(`card-detail-${source}-modal`);
    if (modal) {
        modal.style.display = 'none';
        if (typeof playSound === 'function') playSound('sfx_modal_close.mp3');
    }
}
