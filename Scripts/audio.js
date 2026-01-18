let audioElement = null;
let isPlaying = false;

// Initialize background music
function initBackgroundAudio() {
    audioElement = document.createElement('audio');
    audioElement.id = 'background-audio';
    audioElement.loop = true;
    audioElement.volume = 0.4;
    
    const source = document.createElement('source');
    source.src = 'Resources/rains_on_windows.mp3'; // Rain BGM
    source.type = 'audio/mpeg';
    
    audioElement.appendChild(source);
    document.body.appendChild(audioElement);
    
    // Create audio toggle button
    createAudioToggleButton();
    
    // Setup listeners
    setupAudioListeners();
    
    // Auto play on load
    playAudio();
}

// Play audio with user interaction fallback
function playAudio() {
    if (audioElement) {
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    isPlaying = true;
                    updateButtonState();
                })
                .catch(err => {
                    console.log('Auto play blocked, waiting for user interaction');
                });
        }
    }
}

// Pause audio
function pauseAudio() {
    if (audioElement) {
        audioElement.pause();
        isPlaying = false;
        updateButtonState();
    }
}

// Toggle audio play/pause
function toggleAudio() {
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
}

// Create audio toggle button
function createAudioToggleButton() {
    const button = document.createElement('button');
    button.id = 'audio-toggle-btn';
    button.innerHTML = '🌧️ Rain BGM';
    button.title = 'Click to toggle rain sound';
    
    // Button styles - Visible and styled beautifully
    button.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
        padding: 12px 20px;
        border-radius: 50px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: 2px solid #6ee7b7;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        white-space: nowrap;
        font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    `;
    
    // Hover effect - More dynamic
    button.onmouseover = () => {
        button.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
        button.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.6)';
        button.style.transform = 'translateY(-3px) scale(1.05)';
        button.style.borderColor = '#a7f3d0';
    };
    
    button.onmouseout = () => {
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        button.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
        button.style.transform = 'translateY(0) scale(1)';
        button.style.borderColor = '#6ee7b7';
    };
    
    // Click event
    button.onclick = (e) => {
        e.stopPropagation();
        toggleAudio();
    };
    
    document.body.appendChild(button);
}

// Update button state
function updateButtonState() {
    const button = document.getElementById('audio-toggle-btn');
    if (button) {
        if (isPlaying) {
            button.innerHTML = '🌧️ Rain BGM: ON';
            button.title = 'Click to turn off rain sound';
            button.style.opacity = '1';
        } else {
            button.innerHTML = '🌧️ Rain BGM: OFF';
            button.title = 'Click to turn on rain sound';
            button.style.opacity = '0.7';
        }
    }
}

// Listen for play/pause events
function setupAudioListeners() {
    if (audioElement) {
        audioElement.addEventListener('play', () => {
            isPlaying = true;
            updateButtonState();
        });
        
        audioElement.addEventListener('pause', () => {
            isPlaying = false;
            updateButtonState();
        });
    }
}

// Initialize after page loads
document.addEventListener('DOMContentLoaded', () => {
    initBackgroundAudio();
});