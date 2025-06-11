
// js/audio/audio-manager.js

// Placeholder for master volume, not yet implemented in UI
let masterVolume = 0.7; // Default volume (0.0 to 1.0)
let isMuted = false;

function playSound(soundName) {
    if (isMuted) return;
    if (!soundName) {
        console.warn("playSound: No sound name provided.");
        return;
    }

    try {
        const audio = new Audio(`sfx/${soundName}`);
        audio.volume = masterVolume;
        audio.play().catch(error => {
            // Autoplay restrictions might prevent sound from playing without user interaction
            // console.warn(`Error playing sound "${soundName}":`, error.message);
            // This can be noisy if many sounds are blocked, so only log if truly unexpected.
            if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
                 console.error(`Unexpected error playing sound "${soundName}":`, error);
            }
        });
    } catch (e) {
        console.error(`Could not create or play audio for "${soundName}":`, e);
    }
}

// Functions for potential future volume controls (not yet used)
function setMasterVolume(level) {
    masterVolume = Math.max(0, Math.min(1, parseFloat(level)));
    // console.log("Master volume set to:", masterVolume);
    // Potentially update any currently playing sounds if needed, though usually new sounds will pick this up.
}

function toggleMasterMute() {
    isMuted = !isMuted;
    // console.log(isMuted ? "Audio Muted" : "Audio Unmuted");
    // If sounds are long and need to be stopped, add logic here.
    // For short SFX, just preventing new ones is often enough.
}

// Example: Call playSound('sfx_button_click.mp3');
