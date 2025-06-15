// tests/fish-in-sea-mechanics.test.js

describe('Fishing Mechanics (fish-in-sea-mechanics.js)', () => {
    let mockFishingGameState;
    let mockFishingConfig;
    let mockFishingUi;
    let mockFishingBasket;
    let mockSoundPlayer; // For playSound
    let mockGlobalHelpers; // For things like addSummonTickets etc.

    // Keep a reference to the original Math.random for easy restoration
    const originalMathRandom = Math.random;
    // Keep a reference to original setTimeout and clearTimeout
    const originalSetTimeout = setTimeout;
    const originalClearTimeout = clearTimeout;

    beforeEach(() => {
        // --- Reset Global Mocks ---
        // Mock Math.random
        Math.random = jasmine.createSpy('Math.random').and.returnValue(0.5); // Default to 0.5

        // Mock setTimeout and clearTimeout
        window.setTimeout = jasmine.createSpy('setTimeout').and.callFake((fn, delay) => {
            // In tests, we might want to execute fn immediately or control it via test clock
            // For now, just return a dummy ID
            return originalSetTimeout(fn, 0); // Execute quickly for some tests, or use Jasmine clock
        });
        window.clearTimeout = jasmine.createSpy('clearTimeout').and.callFake(originalClearTimeout);


        // --- Initialize Mocks for Each Test ---
        mockFishingGameState = {
            isGameActive: true,
            isRodCast: false,
            isReeling: false,
            hasHookedFish: false,
            bitingFishId: null,
            biteTimer: 0, // Used for reaction time
            biteTimeoutId: null, // Timer for bite occurrence
            biteReactionTimeoutId: null, // Timer for player to react
            currentRod: {
                level: 1, name: "Basic Rod", catchSpeedFactor: 1.0, successRate: 0.65,
                rarityBonus: 0, ticketCatchBonus: 0, cost: 0, autoCatch: false
            },
            currentBait: {
                id: "none", name: "None", cost: 0, uses: Infinity, rarityBoost: 0,
                ticketBoost: 0, successBoost: 0, biteBoost: 1.0, description: "None"
            },
            currentBaitUsesLeft: Infinity,
            ui: {} // fishingUi functions will be spied on mockFishingUi instead
        };

        mockFishingConfig = {
            BASE_BITE_TIME_MS: 5000,
            BITE_TIME_RANDOM_FACTOR: 0.2,
            BITE_TIMER_DURATION_MS: 3000, // Player reaction time
            REEL_TIME_BASE_MS: 1000,
            REEL_TIME_RANDOM_MS: 500,
            BASE_TICKET_CHANCE: 0.1,
            RARITY_DISTRIBUTION: [
                { key: 'base', packProb: 0.7 },
                { key: 'rare', packProb: 0.2 },
                { key: 'foil', packProb: 0.07 },
                { key: 'holo', packProb: 0.03 }
            ],
            SUMMON_TICKET_RARITY_DISTRIBUTION: [
                { key: 'rare', prob: 0.6 },
                { key: 'foil', prob: 0.3 },
                { key: 'holo', prob: 0.1 }
            ],
            ROD_TYPES: [ /* simplified for brevity, assuming currentRod is set directly */ ],
            BAIT_TYPES: [ /* simplified, assuming currentBait is set directly */ ]
        };

        mockFishingUi = {
            setCatState: jasmine.createSpy('ui.setCatState'),
            showBobber: jasmine.createSpy('ui.showBobber'),
            drawRodLine: jasmine.createSpy('ui.drawRodLine'),
            hideBobber: jasmine.createSpy('ui.hideBobber'),
            hideRodLine: jasmine.createSpy('ui.hideRodLine'),
            animateBobberBite: jasmine.createSpy('ui.animateBobberBite'),
            resetBobberAnimation: jasmine.createSpy('ui.resetBobberAnimation'),
            updateStatusText: jasmine.createSpy('ui.updateStatusText'),
            displayCenteredCaughtItem: jasmine.createSpy('ui.displayCenteredCaughtItem'),
            showTemporaryResultMessage: jasmine.createSpy('ui.showTemporaryResultMessage'),
            hideCatchPreview: jasmine.createSpy('ui.hideCatchPreview')
        };

        mockFishingBasket = {
            addCardToBasket: jasmine.createSpy('basket.addCardToBasket')
            // addTicketToBasket or similar if tickets are basket items
        };

        mockSoundPlayer = {
            playSound: jasmine.createSpy('playSound')
        };
        // Assuming playSound is global for now based on its usage in mechanics
        window.playSound = mockSoundPlayer.playSound;


        mockGlobalHelpers = {
            addSummonTickets: jasmine.createSpy('addSummonTickets'),
            getActiveSetDefinitions: jasmine.createSpy('getActiveSetDefinitions').and.returnValue([{ abbr: 'V1', count: 100 }]),
            getFixedGradeAndPrice: jasmine.createSpy('getFixedGradeAndPrice').and.returnValue({ rarityKey: 'base', grade: 'S', price: 10 }),
            getRarityTierInfo: jasmine.createSpy('getRarityTierInfo').and.callFake(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1) })),
            getCardImagePath: jasmine.createSpy('getCardImagePath').and.returnValue('path/to/image.png'),
            getSummonTicketImagePath: jasmine.createSpy('getSummonTicketImagePath').and.returnValue('path/to/ticket_image.png'),
            // Mock getCardIntrinsicRarity if determineCatch needs it for filtering eligible cards per rarity
            getCardIntrinsicRarity: jasmine.createSpy('getCardIntrinsicRarity').and.returnValue('base')
        };
        // Assign global helpers to window if they are accessed globally
        window.addSummonTickets = mockGlobalHelpers.addSummonTickets;
        window.getActiveSetDefinitions = mockGlobalHelpers.getActiveSetDefinitions;
        window.getFixedGradeAndPrice = mockGlobalHelpers.getFixedGradeAndPrice;
        window.getRarityTierInfo = mockGlobalHelpers.getRarityTierInfo;
        window.getCardImagePath = mockGlobalHelpers.getCardImagePath;
        window.getSummonTicketImagePath = mockGlobalHelpers.getSummonTicketImagePath;
        window.getCardIntrinsicRarity = mockGlobalHelpers.getCardIntrinsicRarity;


        // Provide the mocks to the fishingMechanicsInstance
        // This assumes fishingMechanicsInstance is structured to allow dependency injection
        // or that its global dependencies (fishingGameState, FISHING_CONFIG, fishingUi) can be replaced.
        // For tests, we directly use the global/window scope that the mechanics file uses.
        window.fishingGameState = mockFishingGameState;
        window.FISHING_CONFIG = mockFishingConfig; // Note: Config is usually all caps
        window.fishingUi = mockFishingUi;
        window.fishingBasket = mockFishingBasket;

        // fishingMechanicsInstance is defined in fish-in-sea-mechanics.js and assigned to window.fishingMechanics
        // We'll call methods on window.fishingMechanics
        // Initialize activeFish for mechanics that might use it (like spawnFish, updateFishMovement)
        window.fishingMechanics.activeFish = [];
        for (let i = 0; i < 3; i++) { // Add some mock fish
            window.fishingMechanics.activeFish.push({
                id: `fish_test_${i}`, x: 100, y: 100, speedX: 0, speedY: 0, targetX: 100, targetY: 100,
                rarity: "common", imagePath: 'path/to/fish.png'
            });
        }
         window.fishingMechanics.hookPosition = { x: 200, y: 100 }; // Default hook position for tests
    });

    afterEach(() => {
        // Restore original Math.random
        Math.random = originalMathRandom;
        // Restore original timers
        window.setTimeout = originalSetTimeout;
        window.clearTimeout = originalClearTimeout;
    });

    // Test suites for each function will go here...

    describe('castRodAndWaitForBite', () => {
        it('should do nothing if rod is already cast', () => {
            mockFishingGameState.isRodCast = true;
            window.fishingMechanics.castRodAndWaitForBite();
            expect(mockFishingUi.setCatState).not.toHaveBeenCalled();
            expect(window.setTimeout).not.toHaveBeenCalled();
        });

        it('should do nothing if reeling', () => {
            mockFishingGameState.isReeling = true;
            window.fishingMechanics.castRodAndWaitForBite();
            expect(mockFishingUi.setCatState).not.toHaveBeenCalled();
        });

        it('should do nothing if fish is already hooked', () => {
            mockFishingGameState.hasHookedFish = true;
            window.fishingMechanics.castRodAndWaitForBite();
            expect(mockFishingUi.setCatState).not.toHaveBeenCalled();
        });

        it('should correctly set initial states and UI on successful cast', () => {
            window.fishingMechanics.castRodAndWaitForBite();

            expect(mockFishingGameState.isRodCast).toBe(true);
            expect(mockFishingGameState.isReeling).toBe(false);
            expect(mockFishingGameState.bitingFishId).toBeNull();
            expect(mockFishingGameState.hasHookedFish).toBe(false);

            expect(mockSoundPlayer.playSound).toHaveBeenCalledWith('sfx_fishing_cast.mp3');
            expect(mockFishingUi.setCatState).toHaveBeenCalledWith('casting');
            expect(mockFishingUi.showBobber).toHaveBeenCalled();
            expect(mockFishingUi.drawRodLine).toHaveBeenCalled();
            expect(mockFishingUi.resetBobberAnimation).toHaveBeenCalled();
            expect(mockFishingUi.updateStatusText).toHaveBeenCalledWith("Waiting for a bite...");
            expect(mockFishingUi.hideCatchPreview).toHaveBeenCalled();
        });

        it('should set cat state to "idle" after casting animation delay', () => {
            // Make setTimeout store the function
            const castingAnimationCallback = jasmine.createSpy('castingAnimationCallback');
            window.setTimeout.and.callFake((fn, delay) => {
                if (delay === 700) { // Assuming 700ms is the specific delay for cat animation
                    castingAnimationCallback.and.callFake(fn);
                    return 123; // Dummy ID
                }
                return originalSetTimeout(fn, 0); // For other timeouts
            });

            window.fishingMechanics.castRodAndWaitForBite();
            expect(mockFishingUi.setCatState).toHaveBeenCalledWith('casting');

            // Simulate the timeout for cat animation completion
            castingAnimationCallback(); // Manually invoke the captured callback
            expect(mockFishingUi.setCatState).toHaveBeenCalledWith('idle');
        });

        it('should schedule triggerBiteDisplay with correct delay calculation', () => {
            const expectedBaseTime = mockFishingConfig.BASE_BITE_TIME_MS; // 5000
            const rodFactor = mockFishingGameState.currentRod.catchSpeedFactor; // 1.0
            const baitFactor = mockFishingGameState.currentBait.biteBoost; // 1.0
            const randomFactor = mockFishingConfig.BITE_TIME_RANDOM_FACTOR; // 0.2

            // Math.random is mocked to return 0.5 by default
            // waitDuration = (base / (rod * bait)) * (1 - randomFactor + Math.random() * randomFactor * 2)
            // waitDuration = (5000 / (1.0 * 1.0)) * (1 - 0.2 + 0.5 * 0.2 * 2)
            // waitDuration = 5000 * (0.8 + 0.5 * 0.4)
            // waitDuration = 5000 * (0.8 + 0.2) = 5000 * 1.0 = 5000
            // Max wait: 5000 * (1 + 0.2) = 6000 (Math.random=1)
            // Min wait: 5000 * (1 - 0.2) = 4000 (Math.random=0)
            // With Math.random = 0.5, it's 5000 * (0.8 + 0.5 * 0.4) = 5000 * (0.8 + 0.2) = 5000.

            // Let's adjust mechanics to use the random factor correctly if it's not already
            // The mechanics file has: waitDuration = waitDuration * (0.8 + Math.random() * 0.4);
            // This is equivalent to: baseTime / (rod*bait) * (1 - 0.2 + Math.random() * 0.4)
            // If BITE_TIME_RANDOM_FACTOR = 0.2, then (1 - 0.2 + Math.random() * 0.4)
            // If Math.random() = 0.5, then (0.8 + 0.5 * 0.4) = 0.8 + 0.2 = 1.0. So waitDuration = 5000.

            let capturedDelay;
            let capturedFunction;
            window.setTimeout.and.callFake((fn, delay) => {
                // The first setTimeout is for cat animation (700ms)
                // The second one is for triggerBiteDisplay
                if (delay !== 700) {
                    capturedFunction = fn;
                    capturedDelay = delay;
                }
                return originalSetTimeout(fn, 0); // Allow it to proceed for other tests if needed
            });

            window.fishingMechanics.castRodAndWaitForBite();

            expect(capturedFunction).toBeDefined();
            // Check if capturedFunction.name or similar indicates it's triggerBiteDisplay.
            // For now, we assume it's the correct function based on the call order.
            // spyOn(window.fishingMechanics, 'triggerBiteDisplay'); would be better if it's not private

            const expectedCalculatedDelay = (expectedBaseTime / (rodFactor * baitFactor)) * (1 - randomFactor + 0.5 * randomFactor * 2);
            expect(capturedDelay).toBeCloseTo(expectedCalculatedDelay, 0); // Using toBeCloseTo for potential float issues

            expect(mockFishingGameState.biteTimeoutId).not.toBeNull(); // Should be set to the ID from setTimeout
        });

        it('should clear previous biteTimeoutId if one exists', () => {
            mockFishingGameState.biteTimeoutId = 12345; // Dummy pre-existing timeout
            window.fishingMechanics.castRodAndWaitForBite();
            expect(window.clearTimeout).toHaveBeenCalledWith(12345);
        });
    });

    describe('triggerBiteDisplay', () => {
        beforeEach(() => {
            // Ensure rod is cast for most triggerBiteDisplay tests
            mockFishingGameState.isRodCast = true;
            mockFishingGameState.hasHookedFish = false;
            mockFishingGameState.isReeling = false;
        });

        it('should do nothing if rod is not cast', () => {
            mockFishingGameState.isRodCast = false;
            window.fishingMechanics.triggerBiteDisplay();
            expect(mockFishingGameState.hasHookedFish).toBe(false);
            expect(mockFishingUi.animateBobberBite).not.toHaveBeenCalled();
        });

        it('should do nothing if already reeling', () => {
            mockFishingGameState.isReeling = true;
            window.fishingMechanics.triggerBiteDisplay();
            expect(mockFishingGameState.hasHookedFish).toBe(false);
            expect(mockFishingUi.animateBobberBite).not.toHaveBeenCalled();
        });

        it('should do nothing if fish is already hooked (e.g., called twice)', () => {
            mockFishingGameState.hasHookedFish = true;
            // Call it once to set up state, then try again
            window.fishingMechanics.triggerBiteDisplay(); // This would be the problematic second call

            // Reset spies to check they are not called *again*
            mockFishingUi.animateBobberBite.calls.reset();
            mockSoundPlayer.playSound.calls.reset();
            window.setTimeout.calls.reset();

            window.fishingMechanics.triggerBiteDisplay();
            expect(mockFishingUi.animateBobberBite).not.toHaveBeenCalled();
            expect(mockSoundPlayer.playSound).not.toHaveBeenCalledWith('sfx_fishing_bite.mp3');
        });

        it('should set correct states and UI for a bite', () => {
            window.fishingMechanics.triggerBiteDisplay();

            expect(mockFishingGameState.hasHookedFish).toBe(true);
            expect(mockFishingGameState.isRodCast).toBe(false); // Rod is no longer "just cast"
            expect(mockFishingGameState.biteTimer).toEqual(mockFishingConfig.BITE_TIMER_DURATION_MS);

            expect(mockSoundPlayer.playSound).toHaveBeenCalledWith('sfx_fishing_bite.mp3');
            expect(mockFishingUi.setCatState).toHaveBeenCalledWith('alert');
            expect(mockFishingUi.animateBobberBite).toHaveBeenCalled();
            expect(mockFishingUi.updateStatusText).toHaveBeenCalledWith("BITE! Reel it in!");
        });

        it('should assign a bitingFishId if active fish are available', () => {
            // Ensure activeFish has fish as per beforeEach setup
            expect(window.fishingMechanics.activeFish.length).toBeGreaterThan(0);
            window.fishingMechanics.triggerBiteDisplay();
            expect(mockFishingGameState.bitingFishId).not.toBeNull();
            expect(window.fishingMechanics.activeFish.find(f => f.id === mockFishingGameState.bitingFishId)).toBeDefined();
        });

        it('should set bitingFishId to null if no active fish', () => {
            window.fishingMechanics.activeFish = []; // No fish in the sea
            window.fishingMechanics.triggerBiteDisplay();
            expect(mockFishingGameState.bitingFishId).toBeNull();
        });

        it('should schedule handleFishEscape with BITE_TIMER_DURATION_MS', () => {
            let capturedDelay;
            let capturedFunction; // We'll assume it's handleFishEscape by context

            window.setTimeout.and.callFake((fn, delay) => {
                capturedFunction = fn;
                capturedDelay = delay;
                return 999; // Dummy ID for biteReactionTimeoutId
            });

            spyOn(window.fishingMechanics, 'handleFishEscape').and.stub(); // Spy on it

            window.fishingMechanics.triggerBiteDisplay();

            expect(capturedFunction).toBeDefined();
            // To be more robust, we'd check if capturedFunction calls handleFishEscape
            // For now, we assume by flow. If we execute it:
            // capturedFunction(); expect(window.fishingMechanics.handleFishEscape).toHaveBeenCalledWith("Too slow!");

            expect(capturedDelay).toEqual(mockFishingConfig.BITE_TIMER_DURATION_MS);
            expect(mockFishingGameState.biteReactionTimeoutId).toEqual(999);
        });

        it('should clear previous biteReactionTimeoutId if one exists', () => {
            mockFishingGameState.biteReactionTimeoutId = 54321; // Dummy pre-existing timeout
            window.fishingMechanics.triggerBiteDisplay();
            expect(window.clearTimeout).toHaveBeenCalledWith(54321);
        });
    });

    describe('reelRod', () => {
        beforeEach(() => {
            // Spy on functions that reelRod might call internally
            spyOn(window.fishingMechanics, 'determineCatch').and.returnValue({ type: 'card', details: { set: 'V1', cardId: 'C1', rarityKey: 'base', grade: 'S', price: 10, name: 'Test Fish Card', imagePath: 'path/to/card.png' } });
            spyOn(window.fishingMechanics, 'resetFishingState').and.stub();
            spyOn(window.fishingMechanics, 'handleFishEscape').and.stub();
            spyOn(window.fishingMechanics, 'spawnFish').and.stub(); // Add spy for spawnFish

            // Ensure a bite reaction timer exists to test its clearing
            mockFishingGameState.biteReactionTimeoutId = 67890;
        });

        it('should do nothing if already reeling', () => {
            mockFishingGameState.isReeling = true;
            window.fishingMechanics.reelRod();
            expect(mockFishingUi.setCatState).not.toHaveBeenCalled();
            expect(window.clearTimeout).not.toHaveBeenCalledWith(67890); // Should not clear if already reeling
        });

        describe('When fish is hooked', () => {
            beforeEach(() => {
                mockFishingGameState.hasHookedFish = true;
                mockFishingGameState.bitingFishId = 'fish_test_0'; // Assume a fish was biting
            });

            it('should successfully catch a fish', () => {
                Math.random = jasmine.createSpy().and.returnValue(0.1); // Ensure success ( < successRate)
                mockFishingGameState.currentRod.successRate = 0.7;
                mockFishingGameState.currentBait.successBoost = 0;


                window.fishingMechanics.reelRod();

                expect(window.clearTimeout).toHaveBeenCalledWith(67890);
                expect(mockFishingGameState.isReeling).toBe(true); // Temporarily true during reel
                expect(mockFishingUi.setCatState).toHaveBeenCalledWith('reeling');
                expect(mockFishingUi.updateStatusText).toHaveBeenCalledWith("Reeling it in...");
                expect(mockFishingUi.resetBobberAnimation).toHaveBeenCalled();
                expect(mockSoundPlayer.playSound).toHaveBeenCalledWith('sfx_fishing_reel.mp3');

                // Simulate timeout for reeling completion
                // The actual callback within reelRod needs to be manually invoked or use jasmine.clock()
                // For simplicity, assume the setTimeout for reeling executes its logic via our mocked setTimeout.
                // We need to find the callback passed to setTimeout for the reel process.
                const reelProcessCallback = window.setTimeout.calls.argsFor(0)[0]; // First arg of first call
                reelProcessCallback();


                expect(window.fishingMechanics.determineCatch).toHaveBeenCalledWith('fish_test_0');
                const caughtItem = window.fishingMechanics.determineCatch.calls.mostRecent().returnValue;
                expect(mockFishingUi.displayCenteredCaughtItem).toHaveBeenCalledWith(caughtItem);

                // Check basket addition based on determineCatch's output
                if (caughtItem.type === 'card') {
                    // The cardDataForBasket is constructed inside reelRod, so we check the arguments of addCardToBasket
                    expect(mockFishingBasket.addCardToBasket).toHaveBeenCalled();
                    const basketArgs = mockFishingBasket.addCardToBasket.calls.argsFor(0);
                    expect(basketArgs[0].id).toEqual(caughtItem.details.cardId);
                    expect(basketArgs[0].set).toEqual(caughtItem.details.set);
                }

                expect(mockSoundPlayer.playSound).toHaveBeenCalledWith('sfx_fishing_win.mp3');
                expect(window.fishingMechanics.spawnFish).toHaveBeenCalledWith('fish_test_0');
                expect(window.fishingMechanics.resetFishingState).toHaveBeenCalled();
            });

            it('should handle failed catch (fish escapes)', () => {
                Math.random = jasmine.createSpy().and.returnValue(0.9); // Ensure failure ( > successRate)
                mockFishingGameState.currentRod.successRate = 0.7;
                 mockFishingGameState.currentBait.successBoost = 0;

                window.fishingMechanics.reelRod();

                expect(window.clearTimeout).toHaveBeenCalledWith(67890);
                expect(mockFishingGameState.isReeling).toBe(true);

                const reelProcessCallback = window.setTimeout.calls.argsFor(0)[0];
                reelProcessCallback();

                expect(window.fishingMechanics.determineCatch).not.toHaveBeenCalled();
                expect(window.fishingMechanics.handleFishEscape).toHaveBeenCalledWith("The fish got away!");
                expect(window.fishingMechanics.resetFishingState).toHaveBeenCalled();
            });

             it('should consume bait if catch is successful and bait is not "none"', () => {
                Math.random = jasmine.createSpy().and.returnValue(0.1); // Success
                mockFishingGameState.currentRod.successRate = 0.7;
                mockFishingGameState.currentBait = { id: "simple_lure", name: "Simple Lure", uses: 5, biteBoost: 1.05, ticketBoost: 0.005, rarityBoost: 0.01, successBoost: 0.02 };
                mockFishingGameState.currentBaitUsesLeft = 5;

                window.fishingMechanics.reelRod();
                const reelProcessCallback = window.setTimeout.calls.argsFor(0)[0];
                reelProcessCallback();

                expect(mockFishingGameState.currentBaitUsesLeft).toBe(4);
            });

            it('should switch to "none" bait if uses run out', () => {
                Math.random = jasmine.createSpy().and.returnValue(0.1); // Success
                mockFishingGameState.currentRod.successRate = 0.7;
                mockFishingConfig.BAIT_TYPES = [ { id: "none", name: "None", uses: Infinity, biteBoost:1, ticketBoost:0, rarityBoost:0, successBoost:0 }]; // Make sure "none" bait is in config for find
                mockFishingGameState.currentBait = { id: "simple_lure", name: "Simple Lure", uses: 1, biteBoost: 1.05, ticketBoost: 0.005, rarityBoost: 0.01, successBoost: 0.02 };
                mockFishingGameState.currentBaitUsesLeft = 1;

                window.fishingMechanics.reelRod();
                const reelProcessCallback = window.setTimeout.calls.argsFor(0)[0];
                reelProcessCallback();

                expect(mockFishingGameState.currentBaitUsesLeft).toBe(0); // Goes to 0 first
                // Then, because it's <=0, it should switch
                expect(mockFishingGameState.currentBait.id).toBe("none");
                expect(mockFishingUi.showTemporaryResultMessage).toHaveBeenCalledWith('Your Simple Lure ran out!');
                expect(mockFishingUi.updateRodAndBaitDisplay).toHaveBeenCalled();
            });
        });

        describe('When rod is cast but no fish hooked (reel in early)', () => {
            beforeEach(() => {
                mockFishingGameState.isRodCast = true;
                mockFishingGameState.hasHookedFish = false;
            });

            it('should reel in empty', () => {
                window.fishingMechanics.reelRod();

                expect(window.clearTimeout).toHaveBeenCalledWith(67890); // Clears potential bite reaction timer
                expect(mockSoundPlayer.playSound).toHaveBeenCalledWith('sfx_fishing_reel_empty.mp3');
                expect(mockFishingUi.updateStatusText).toHaveBeenCalledWith("Reeled in too early!");
                expect(window.fishingMechanics.resetFishingState).toHaveBeenCalled();
                expect(mockFishingGameState.isReeling).toBe(false); // Should not enter reeling state
                expect(window.fishingMechanics.determineCatch).not.toHaveBeenCalled();
            });
        });
         it('should do nothing if not rod cast and no fish hooked', () => {
            mockFishingGameState.isRodCast = false;
            mockFishingGameState.hasHookedFish = false;
            window.fishingMechanics.reelRod();
            expect(window.clearTimeout).toHaveBeenCalledWith(67890); // Still clears, as a precaution
            expect(mockSoundPlayer.playSound).not.toHaveBeenCalledWith('sfx_fishing_reel_empty.mp3');
            expect(mockFishingUi.setCatState).not.toHaveBeenCalledWith('reeling');
        });
    });

    describe('handleFishEscape', () => {
        beforeEach(() => {
            // Ensure resetFishingState is spied on for this suite as well
            if (!window.fishingMechanics.resetFishingState.and) { // Check if already a spy
                 spyOn(window.fishingMechanics, 'resetFishingState').and.stub();
            }
             if (!window.fishingMechanics.spawnFish.and) { // Check if already a spy
                spyOn(window.fishingMechanics, 'spawnFish').and.stub();
            }
            mockFishingGameState.bitingFishId = 'fish_escaped_123'; // Assume a fish was biting
        });

        it('should show escape message, play sound, spawn new fish, and reset state', () => {
            const escapeReason = "The fish was too clever!";
            window.fishingMechanics.handleFishEscape(escapeReason);

            expect(mockFishingUi.showTemporaryResultMessage).toHaveBeenCalledWith(escapeReason);
            expect(mockSoundPlayer.playSound).toHaveBeenCalledWith('sfx_fishing_lose.mp3');
            expect(window.fishingMechanics.spawnFish).toHaveBeenCalledWith('fish_escaped_123');
            expect(window.fishingMechanics.resetFishingState).toHaveBeenCalled();
        });

        it('should use default escape message if none provided', () => {
            window.fishingMechanics.handleFishEscape(); // No reason passed
            expect(mockFishingUi.showTemporaryResultMessage).toHaveBeenCalledWith("The fish got away!");
        });

        it('should not call spawnFish if no bitingFishId was set', () => {
            mockFishingGameState.bitingFishId = null;
            window.fishingMechanics.handleFishEscape();
            expect(window.fishingMechanics.spawnFish).not.toHaveBeenCalled();
        });

        it('should correctly make the escaped fish dart away (visual logic)', () => {
            // This test is more about the internal logic of making the fish dart away
            // It assumes the fish is in activeFish array
            const escapedFish = {
                id: 'fish_escaped_123', x: 100, y: 100,
                speedX: 10, speedY: 10,
                targetX: 100, targetY: 100
            };
            window.fishingMechanics.activeFish = [escapedFish];
            mockFishingGameState.seaBoundaries = { minX: 0, maxX: 400, minY: 0, maxY: 300 };


            window.fishingMechanics.handleFishEscape();

            // Check that targetX/Y are outside boundaries and speed increased
            // This requires Math.random to be predictable or to check for values far off screen
            const newTargetXIsFar = escapedFish.targetX < (mockFishingGameState.seaBoundaries.minX - 40) || escapedFish.targetX > (mockFishingGameState.seaBoundaries.maxX + 40);
            const newTargetYIsFar = escapedFish.targetY < (mockFishingGameState.seaBoundaries.minY - 40) || escapedFish.targetY > (mockFishingGameState.seaBoundaries.maxY + 40);

            expect(newTargetXIsFar).toBe(true);
            expect(newTargetYIsFar).toBe(true);
            expect(escapedFish.speedX).toEqual(10 * 3); // Original speed * 3
            expect(escapedFish.speedY).toEqual(10 * 3);
        });
    });

    describe('determineCatch', () => {
        const originalMathRandom = Math.random; // Store original Math.random

        afterEach(() => {
            Math.random = originalMathRandom; // Restore original Math.random after each test
        });

        it('should return a card if random chance selects card over ticket', () => {
            Math.random = jasmine.createSpy().and.callFake(() => 0.5); // Ensures not ticket (ticket chance is 0.1)
            mockFishingGameState.currentRod.ticketCatchBonus = 0;
            mockFishingGameState.currentBait.ticketBoost = 0;

            const caughtItem = window.fishingMechanics.determineCatch('fish_test_0');
            expect(caughtItem.type).toBe('card');
            expect(caughtItem.details).toBeDefined();
            expect(mockGlobalHelpers.getActiveSetDefinitions).toHaveBeenCalled();
            expect(mockGlobalHelpers.getFixedGradeAndPrice).toHaveBeenCalled();
        });

        it('should return a ticket if random chance selects ticket', () => {
            Math.random = jasmine.createSpy().and.callFake(() => 0.05); // Ensures ticket (ticket chance 0.1)
            mockFishingGameState.currentRod.ticketCatchBonus = 0;
            mockFishingGameState.currentBait.ticketBoost = 0;

            const caughtItem = window.fishingMechanics.determineCatch('fish_test_0');
            expect(caughtItem.type).toBe('ticket');
            expect(caughtItem.details).toBeDefined();
            expect(mockGlobalHelpers.addSummonTickets).toHaveBeenCalled();
            expect(mockGlobalHelpers.getRarityTierInfo).toHaveBeenCalledWith(caughtItem.details.rarityKey);
        });

        it('should increase ticket chance with rod and bait bonuses', () => {
            // Base ticket chance = 0.1
            mockFishingGameState.currentRod.ticketCatchBonus = 0.05; // Total 0.15
            mockFishingGameState.currentBait.ticketBoost = 0.05;    // Total 0.20

            Math.random = jasmine.createSpy().and.returnValue(0.18); // Should be a ticket
            let caughtItem = window.fishingMechanics.determineCatch('fish_test_0');
            expect(caughtItem.type).toBe('ticket');

            Math.random = jasmine.createSpy().and.returnValue(0.22); // Should be a card
            caughtItem = window.fishingMechanics.determineCatch('fish_test_0');
            expect(caughtItem.type).toBe('card');
        });

        describe('Card Rarity Determination', () => {
            beforeEach(() => {
                // Ensure card is chosen over ticket
                spyOn(Math, 'random').and.callFake(() => 0.5); // > BASE_TICKET_CHANCE (0.1)
            });

            it('should default to "base" rarity with no bonuses and average random roll for rarity', () => {
                // RARITY_DISTRIBUTION: base: 0.7, rare: 0.2, foil: 0.07, holo: 0.03
                // Math.random for rarity roll (second Math.random call)
                Math.random.and.returnValues(0.5, 0.3); // 0.5 for ticket/card, 0.3 for rarity (falls into base)
                mockFishingGameState.currentRod.rarityBonus = 0;
                mockFishingGameState.currentBait.rarityBoost = 0;

                const caughtItem = window.fishingMechanics.determineCatch('fish_test_0');
                expect(caughtItem.type).toBe('card');
                expect(caughtItem.details.rarityKey).toBe('base');
            });

            it('should get rarer card with rarityBonus', () => {
                Math.random.and.returnValues(0.5, 0.3); // Base roll would be 'base'
                mockFishingGameState.currentRod.rarityBonus = 0.25; // Effectively makes roll 0.3 - 0.25 = 0.05
                                                                 // RARITY_DISTRIBUTION: base: 0.7 (0-0.7), rare: 0.2 (0.7-0.9), foil: 0.07 (0.9-0.97), holo: 0.03 (0.97-1.0)
                                                                 // This example logic is tricky with the mock.
                                                                 // Actual logic: randomPackProb -= bonus.
                                                                 // If randomPackProb (0.3) - 0.25 = 0.05. This is still 'base'.
                                                                 // Let's try to hit rare: rare starts after 0.7. So randomPackProb should be < 0.7.
                                                                 // If Math.random for rarity is 0.75 (would be rare), and bonus is 0.06. Result 0.69 -> base.
                                                                 // This shows bonus helps, but let's test more directly.

                // Target holo (original prob 0.03, starts after 0.97 cumulative)
                // So, random number for rarity needs to be > 0.97
                // If Math.random for rarity is 0.98.
                // With no bonus, it's holo.
                // With rarityBonus = 0.02, randomPackProb becomes 0.96. This would be foil.
                // This test needs careful setup of Math.random for the rarity part.

                mockFishingConfig.RARITY_DISTRIBUTION = [
                     {key:'base', packProb:0.5},
                     {key:'rare', packProb:0.3}, // Starts at 0.5
                     {key:'holo', packProb:0.2}  // Starts at 0.8
                ];
                mockFishingGameState.currentRod.rarityBonus = 0.15;
                mockFishingGameState.currentBait.rarityBoost = 0;

                // Rarity roll: 0.85 (would be holo). Adjusted by bonus: 0.85 - 0.15 = 0.70. This should be 'rare'.
                Math.random.and.returnValues(0.5, 0.85);
                let item = window.fishingMechanics.determineCatch('fish_test_0');
                expect(item.details.rarityKey).toBe('rare');

                // Rarity roll: 0.55 (would be rare). Adjusted by bonus: 0.55 - 0.15 = 0.40. This should be 'base'.
                Math.random.and.returnValues(0.5, 0.55);
                item = window.fishingMechanics.determineCatch('fish_test_0');
                expect(item.details.rarityKey).toBe('base');
            });
        });

        describe('Ticket Rarity Determination', () => {
            beforeEach(() => {
                // Ensure ticket is chosen over card
                spyOn(Math, 'random').and.callFake(() => 0.05); // < BASE_TICKET_CHANCE (0.1)
                mockFishingConfig.SUMMON_TICKET_RARITY_DISTRIBUTION = [
                    { key: 'rare', prob: 0.6 }, // 0 - 0.6
                    { key: 'foil', prob: 0.3 }, // 0.6 - 0.9
                    { key: 'holo', prob: 0.1 }  // 0.9 - 1.0
                ];
            });

            it('should pick ticket rarity based on SUMMON_TICKET_RARITY_DISTRIBUTION', () => {
                // First Math.random for ticket/card (0.05), second for ticket rarity
                Math.random.and.returnValues(0.05, 0.5); // Should be 'rare' ticket (0.5 < 0.6)
                let item = window.fishingMechanics.determineCatch('fish_test_0');
                expect(item.type).toBe('ticket');
                expect(item.details.rarityKey).toBe('rare');

                Math.random.and.returnValues(0.05, 0.75); // Should be 'foil' ticket (0.6 < 0.75 < 0.9)
                item = window.fishingMechanics.determineCatch('fish_test_0');
                expect(item.details.rarityKey).toBe('foil');

                Math.random.and.returnValues(0.05, 0.95); // Should be 'holo' ticket (0.9 < 0.95 < 1.0)
                item = window.fishingMechanics.determineCatch('fish_test_0');
                expect(item.details.rarityKey).toBe('holo');
            });

            it('should fallback to first ticket type if SUMMON_TICKET_RARITY_DISTRIBUTION is empty or malformed', () => {
                mockFishingConfig.SUMMON_TICKET_RARITY_DISTRIBUTION = []; // Empty
                Math.random.and.returnValues(0.05, 0.5); // Random value for rarity doesn't matter here for fallback

                // The mechanics code has a fallback to ['rare', 'foil', 'holo'] and then random choice
                // So this test needs to check one of those. With Math.random = 0.5 for the choice, it's 'foil'.
                const item = window.fishingMechanics.determineCatch('fish_test_0');
                expect(item.type).toBe('ticket');
                expect(['rare', 'foil', 'holo'].includes(item.details.rarityKey)).toBe(true);
                // Based on current fallback: const ticketRarities = ['rare', 'foil', 'holo']; chosen = ticketRarities[Math.floor(Math.random() * 3)]
                // If the second Math.random (for choice) is 0.5 -> Math.floor(0.5*3)=Math.floor(1.5)=1 -> 'foil'
                expect(item.details.rarityKey).toBe('foil');
            });
        });
    });

    describe('resetFishingState', () => {
        it('should reset all relevant game state properties', () => {
            // Set some properties to non-default values to ensure they are reset
            mockFishingGameState.isRodCast = true;
            mockFishingGameState.isReeling = true;
            mockFishingGameState.hasHookedFish = true;
            mockFishingGameState.bitingFishId = 'some_fish_id';
            mockFishingGameState.biteTimer = 1000;
            mockFishingGameState.biteTimeoutId = 123;
            mockFishingGameState.biteReactionTimeoutId = 456;

            window.fishingMechanics.resetFishingState();

            expect(mockFishingGameState.isRodCast).toBe(false);
            expect(mockFishingGameState.isReeling).toBe(false);
            expect(mockFishingGameState.hasHookedFish).toBe(false);
            expect(mockFishingGameState.bitingFishId).toBeNull();
            expect(mockFishingGameState.biteTimer).toBe(0);
        });

        it('should clear fishing timers', () => {
            mockFishingGameState.biteTimeoutId = 123;
            mockFishingGameState.biteReactionTimeoutId = 456;

            window.fishingMechanics.resetFishingState();

            expect(window.clearTimeout).toHaveBeenCalledWith(123);
            expect(window.clearTimeout).toHaveBeenCalledWith(456);
            expect(mockFishingGameState.biteTimeoutId).toBeNull();
            expect(mockFishingGameState.biteReactionTimeoutId).toBeNull();
        });

        it('should call UI functions to reset the visual state', () => {
            window.fishingMechanics.resetFishingState();

            expect(mockFishingUi.hideBobber).toHaveBeenCalled();
            expect(mockFishingUi.hideRodLine).toHaveBeenCalled();
            expect(mockFishingUi.resetBobberAnimation).toHaveBeenCalled();
            expect(mockFishingUi.setCatState).toHaveBeenCalledWith('idle');
            expect(mockFishingUi.updateStatusText).toHaveBeenCalled(); // Called with no args, should reset to default
            expect(mockFishingUi.hideCatchPreview).toHaveBeenCalled();
        });
    });
});
