let audioElement = null;
let isPlaying = false;

// Initialize background music
function initBackgroundAudio() {
    audioElement = document.createElement('audio');
    audioElement.id = 'background-audio';
    audioElement.loop = true;
    audioElement.volume = 0.3;
    
    const source = document.createElement('source');
    source.src = 'Resources/cosmic.mp3'; // 改成 cosmic
    source.type = 'audio/mpeg';
    
    audioElement.appendChild(source);
    document.body.appendChild(audioElement);
    
    // Create audio toggle button
    createAudioToggleButton();
    
    // Try to auto play
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
                    document.addEventListener('click', playAudioOnce, { once: true });
                    document.addEventListener('touchstart', playAudioOnce, { once: true });
                });
        }
    }
}

// Play audio on first user interaction
function playAudioOnce() {
    if (audioElement && audioElement.paused) {
        audioElement.play()
            .then(() => {
                isPlaying = true;
                updateButtonState();
            })
            .catch(err => console.log('Play failed:', err));
    }
}

// Create audio toggle button
function createAudioToggleButton() {
    const button = document.createElement('button');
    button.id = 'audio-toggle-btn';
    button.innerHTML = '🔊 Play Sea Sound';
    button.title = 'Click to toggle ocean waves sound';
    
    // Button styles
    button.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
        padding: 10px 16px;
        border-radius: 25px;
        background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%);
        border: 2px solid #81c784;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(100, 181, 246, 0.4);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        white-space: nowrap;
    `;
    
    // Hover effect
    button.onmouseover = () => {
        button.style.background = 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)';
        button.style.boxShadow = '0 8px 20px rgba(100, 181, 246, 0.6)';
        button.style.transform = 'translateY(-2px)';
    };
    
    button.onmouseout = () => {
        button.style.background = 'linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)';
        button.style.boxShadow = '0 6px 16px rgba(100, 181, 246, 0.4)';
        button.style.transform = 'translateY(0)';
    };
    
    // Click event
    button.onclick = (e) => {
        e.stopPropagation();
        if (isPlaying) {
            audioElement.pause();
        } else {
            playAudio();
        }
    };
    
    document.body.appendChild(button);
}

// Update button state
function updateButtonState() {
    const button = document.getElementById('audio-toggle-btn');
    if (button) {
        button.innerHTML = isPlaying ? '⏸️ Stop Sound' : '🔊 Play Sound';
        button.title = isPlaying ? 'Click to turn off ocean waves' : 'Click to turn on ocean waves';
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
    setupAudioListeners();
});