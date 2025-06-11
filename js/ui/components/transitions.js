
// js/ui/components/transitions.js

function showPackTransition(message, duration, themeRarityKey, onCompleteCallback) {
    const overlay = document.getElementById('pack-transition-overlay');
    const messageEl = document.getElementById('pack-transition-message');
    const animationEl = document.getElementById('pack-transition-animation');

    if (!overlay || !messageEl || !animationEl) {
        console.error("Pack transition elements not found. Skipping animation.");
        if (onCompleteCallback) onCompleteCallback();
        return;
    }

    messageEl.textContent = message || "Processing...";

    // Clear previous theme classes (safer than relying on a single class)
    const themePrefix = 'transition-theme-';
    overlay.className.split(' ').forEach(cls => {
        if (cls.startsWith(themePrefix)) {
            overlay.classList.remove(cls);
        }
    });
    
    // Add new theme class
    const themeClass = themeRarityKey ? `${themePrefix}${themeRarityKey}` : `${themePrefix}default`;
    overlay.classList.add(themeClass);
    
    // Specific animation setup for Rainy theme
    if (themeRarityKey === 'rainy') {
        animationEl.innerHTML = ''; // Clear previous drops
        for (let i = 0; i < 50; i++) { // Create 50 rain drops
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 1}s`;
            drop.style.opacity = `${Math.random() * 0.5 + 0.3}`;
            animationEl.appendChild(drop);
        }
    } else {
        animationEl.innerHTML = ''; // Clear for other themes that might use ::before for animation
    }


    overlay.style.display = 'flex';
    setTimeout(() => { // Ensure display:flex is applied before starting opacity transition
        overlay.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            animationEl.innerHTML = ''; // Clean up animation elements
            if (onCompleteCallback) {
                onCompleteCallback();
            }
        }, 300); // Match opacity transition duration
    }, duration);
}
