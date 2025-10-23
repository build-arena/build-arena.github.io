// Animation Configuration
let config = {
    steps: [],
    animationString: '', // Unified tagged string built from steps
    charDelay: 5, // milliseconds per character for streaming effect (default)
    stepDelay: 1000, // delay after completing a step (unused now)
    imageTransitionDuration: 500 // image fade duration
};

// Animation State
let state = {
    isPlaying: false,
    isPaused: false,
    currentTimeout: null,
    globalCharIndex: 0, // Current position in the unified animation string
    currentElement: null, // Current DOM element being animated (message/code block)
    punchlineSpan: null, // Current punchline span if inside <PUNCHLINE>
    currentImagePath: '', // Track current displayed image
    imagePreloadCache: {}, // Cache for preloaded images
    isCodeBlock: false, // Track if we're inside a code block
    isStreaming: false, // Prevent concurrent streaming loops
    streamRunId: 0, // Monotonic run identifier to invalidate old loops
    cursorElement: null // Blinking cursor element
};

// DOM Elements
const terminalContent = document.getElementById('terminal-content');
let graphicsImage = document.getElementById('current-image');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status');

// Load configuration and build unified tagged string
async function loadConfig() {
    try {
        const response = await fetch('assets/pipeline_config.json');
        const data = await response.json();
        config = { ...config, ...data };
        
        // Build unified tagged string from steps
        let taggedString = '';
        for (const step of config.steps) {
            // Add image tag FIRST (will trigger image load without printing)
            if (step.image) {
                // Update image path to use assets folder
                const imagePath = step.image.replace('images/', 'assets/pipeline_images/');
                taggedString += `<image:${imagePath}>`;
            }
            
            // Add agent tag
            if (step.agent) {
                taggedString += `<agent:${step.agent}>`;
            }
            
            // Add messages
            for (const msg of step.messages) {
                if (msg.type === 'code') {
                    taggedString += `<code>${msg.content}</code>`;
                } else if (msg.type === 'text') {
                    taggedString += msg.content;
                }
            }
            
            // Add separator for better readability
            taggedString += '\n\n';
        }
        
        config.animationString = taggedString;
        
        console.log('Tagged string built:', taggedString.substring(0, 200) + '...');
    } catch (error) {
        console.error('Failed to load config:', error);
        loadDefaultConfig();
    }
}

// Default configuration for demo
function loadDefaultConfig() {
    config.steps = [
        {
            agent: "builder",
            messages: [
                {
                    type: "text",
                    content: "Builder:\nInitializing build arena environment..."
                },
                {
                    type: "code",
                    content: "add_block(id=1, type='Starting Block', position=[0, 0, 0.5])"
                },
                {
                    type: "text",
                    content: "You have successfully added <ID 1: Starting Block>.\nExisting Blocks: 1\n(The starting block) <ID 1: Starting Block>\nPosition: [0, 0, 0.5]\nAttachable Faces:\nFace label: A, Face center: [0.5, 0., 0.5], Facing towards <East with 0.0° pitch>\nFace label: B, Face center: [-0.5, 0., 0.5], Facing towards <West with 0.0° pitch>\nFace label: C, Face center: [0., 0., 1.], Facing towards <straight up>\nFace label: D, Face center: [0., 0., 0.], Facing towards <straight down>\nFace label: E, Face center: [0., 0.5, 0.5], Facing towards <North with 0.0° pitch>\nFace label: F, Face center: [0., -0.5, 0.5], Facing towards <South with 0.0° pitch>"
                }
            ],
            image: "assets/pipeline_images/step1.png"
        }
    ];
    // Build the tagged string from default config
    config.animationString = '<agent:builder>Builder:\nInitializing build arena environment...<code>add_block(id=1, type=\'Starting Block\', position=[0, 0, 0.5])</code>You have successfully added <ID 1: Starting Block>...<image:assets/pipeline_images/step1.png>\n\n';
}

// Helper: Create agent label element
function createAgentLabel(agent) {
    const labelBlock = document.createElement('div');
    labelBlock.className = `agent-label agent-${agent}`;
    labelBlock.textContent = getAgentLabel(agent);
    return labelBlock;
}

// Helper: Create message content block
function createMessageBlock() {
    const messageBlock = document.createElement('div');
    messageBlock.className = 'message-block';
    const content = document.createElement('div');
    content.className = 'message-content';
    messageBlock.appendChild(content);
    // Append wrapper to terminal immediately to ensure correct layout
    terminalContent.appendChild(messageBlock);
    return content;
}

// Helper: Create code block
function createCodeBlock() {
    const messageBlock = document.createElement('div');
    messageBlock.className = 'message-block';
    const codeBlock = document.createElement('div');
    codeBlock.className = 'code-block';
    messageBlock.appendChild(codeBlock);
    // Append wrapper to terminal immediately to ensure correct layout
    terminalContent.appendChild(messageBlock);
    return codeBlock;
}

// Create and add cursor element
function addCursor() {
    if (!state.cursorElement) {
        state.cursorElement = document.createElement('span');
        state.cursorElement.className = 'cursor-blink';
    }
    
    // Add cursor to current element or punchline span
    const targetElement = state.punchlineSpan || state.currentElement;
    if (targetElement && !targetElement.contains(state.cursorElement)) {
        targetElement.appendChild(state.cursorElement);
    }
}

// Remove cursor element
function removeCursor() {
    if (state.cursorElement && state.cursorElement.parentNode) {
        state.cursorElement.parentNode.removeChild(state.cursorElement);
    }
}

// Unified streaming animation - parses and renders the tagged string
async function streamAnimation(runId) {
    const str = config.animationString;
    let i = state.globalCharIndex;
    
    console.log(`🎬 Starting stream from index ${i}/${str.length}`);
    state.isStreaming = true;
    
    while (i < str.length && state.isPlaying && !state.isPaused) {
        // Abort if a newer streaming run has started
        if (runId !== state.streamRunId) {
            console.log('⛔ Aborting outdated streaming run');
            break;
        }
        // Check for tags
        if (str[i] === '<') {
            // Special handling while inside a code block: only recognise </code>
            if (state.isCodeBlock && !str.startsWith('</code>', i)) {
                // Treat '<' as a literal character inside code
                if (!state.currentElement) {
                    state.currentElement = createCodeBlock();
                }
                state.currentElement.appendChild(document.createTextNode('<'));
                i++;
                state.globalCharIndex = i;
                updateProgress();
                await new Promise(resolve => { state.currentTimeout = setTimeout(resolve, config.charDelay); });
                if (runId !== state.streamRunId) { console.log('⛔ Aborting outdated streaming run after wait'); break; }
                if (!state.isPlaying || state.isPaused) { console.log(`⏸️  Paused at index ${state.globalCharIndex}/${str.length}`); break; }
                continue;
            }

            const tagEnd = str.indexOf('>', i);
            if (tagEnd === -1) {
                console.error('❌ Unclosed tag at index', i);
                break;
            }
            
            const tagContent = str.substring(i + 1, tagEnd);
            // Determine whether this is a recognised tag; if not, treat '<' literally
            const isKnown = tagContent === 'code' || tagContent === '/code' ||
                            tagContent === 'PUNCHLINE' || tagContent === '/PUNCHLINE' ||
                            tagContent.startsWith('agent:') || tagContent.startsWith('image:');
            if (!isKnown) {
                // Not a recognised tag: output '<' literally
                if (!state.currentElement) {
                    state.currentElement = createMessageBlock();
                }
                state.currentElement.appendChild(document.createTextNode('<'));
                i++;
                state.globalCharIndex = i;
                updateProgress();
                await new Promise(resolve => { state.currentTimeout = setTimeout(resolve, config.charDelay); });
                if (runId !== state.streamRunId) { console.log('⛔ Aborting outdated streaming run after wait'); break; }
                if (!state.isPlaying || state.isPaused) { console.log(`⏸️  Paused at index ${state.globalCharIndex}/${str.length}`); break; }
                continue;
            }
            
            console.log(`🏷️  Tag found: <${tagContent}>`);
            
            // Handle different tag types
            if (tagContent.startsWith('agent:')) {
                // Create agent label element
                const agent = tagContent.split(':')[1];
                const label = createAgentLabel(agent);
                terminalContent.appendChild(label);
                console.log(`👤 Agent label added: ${agent}`);
                
                // Reset current element for new agent's messages
                state.currentElement = null;
                state.punchlineSpan = null;
            }
            else if (tagContent.startsWith('image:')) {
                // Load image WITHOUT logging text to terminal
                const imagePath = tagContent.split(':')[1];
                // If image is "none", skip and keep previous image
                if (imagePath === 'none') {
                    console.log(`🖼️  Keeping previous image (none specified)`);
                } else {
                    console.log(`🖼️  Loading image: ${imagePath}`);
                    await preloadImage(imagePath);
                    await changeImage(imagePath);
                    state.currentImagePath = imagePath;
                }
            }
            else if (tagContent === 'code') {
                // Start code block
                state.currentElement = createCodeBlock();
                state.isCodeBlock = true;
                console.log('💻 Code block started');
            }
            else if (tagContent === '/code') {
                // End code block
                state.currentElement = null;
                state.isCodeBlock = false;
                console.log('💻 Code block ended');
            }
            else if (tagContent === 'PUNCHLINE') {
                // Start punchline span
                if (!state.currentElement) {
                    state.currentElement = createMessageBlock();
                }
                state.punchlineSpan = document.createElement('span');
                state.punchlineSpan.className = 'punchline';
                state.currentElement.appendChild(state.punchlineSpan);
                console.log('🎯 Punchline started');
            }
            else if (tagContent === '/PUNCHLINE') {
                // End punchline
                state.punchlineSpan = null;
                console.log('🎯 Punchline ended');
            }
            
            // Skip past the tag
            i = tagEnd + 1;
            state.globalCharIndex = i;
            
            // Update progress
            updateProgress();
        }
        else {
            // Regular character - type it
            if (!state.currentElement) {
                state.currentElement = createMessageBlock();
            }
            
            // Remove cursor before adding character
            removeCursor();
            
            const char = str[i];
            const textNode = document.createTextNode(char);
                    
            if (state.punchlineSpan) {
                state.punchlineSpan.appendChild(textNode);
            } else {
                state.currentElement.appendChild(textNode);
            }
            
            // Add cursor after character
            addCursor();
                    
            i++;
            state.globalCharIndex = i;
                    
            // Auto-scroll to bottom
            terminalContent.scrollTop = terminalContent.scrollHeight;
                    
            // Update progress
            updateProgress();
            
            // Wait for charDelay
            await new Promise(resolve => {
                state.currentTimeout = setTimeout(resolve, config.charDelay);
            });
            
            // Abort if a newer streaming run has started while we were waiting
            if (runId !== state.streamRunId) {
                console.log('⛔ Aborting outdated streaming run after wait');
                break;
            }
            // Check pause/play state after each character
            if (!state.isPlaying || state.isPaused) {
                console.log(`⏸️  Paused at index ${state.globalCharIndex}/${str.length}`);
                break;
            }
        }
    }
    
    // Animation complete
    if (i >= str.length && state.isPlaying && !state.isPaused) {
        removeCursor(); // Remove cursor when complete
        stopAnimation();
        updateButtonStates(); // Update button states when complete
        console.log('✅ Animation complete');
    }
    // Keep cursor visible if paused (don't remove it)
    state.isStreaming = false;
}

// Update progress bar based on current position in string
function updateProgress() {
    const progress = (state.globalCharIndex / config.animationString.length) * 100;
    progressFill.style.width = `${progress.toFixed(1)}%`;
}

// Add agent label
function getAgentLabel(agent) {
    switch (agent) {
        case 'builder':
            return 'Builder > ';
        case 'guidance':
            return 'Guidance > ';
        case 'env':
            return 'Env > ';
        case 'user':
            return 'User > ';
        case 'system':
            return 'System > ';
        default:
            return '';
    }
}


// Preload an image
function preloadImage(imagePath) {
    if (!imagePath || state.imagePreloadCache[imagePath]) {
        return Promise.resolve();
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            state.imagePreloadCache[imagePath] = true;
            resolve();
        };
        img.onerror = () => {
            console.warn(`Failed to preload image: ${imagePath}`);
            resolve(); // Resolve anyway to not block animation
        };
        img.src = imagePath;
    });
}

// Preload upcoming images
async function preloadUpcomingImages(startIndex) {
    const preloadCount = 3; // Preload next 3 images
    const promises = [];
    
    for (let i = startIndex; i < Math.min(startIndex + preloadCount, config.steps.length); i++) {
        const step = config.steps[i];
        if (step.image && step.image !== 'none') {
            promises.push(preloadImage(step.image));
        }
    }
    
    await Promise.all(promises);
}

// Change image with fade effect
async function changeImage(imagePath) {
    return new Promise((resolve) => {
        if (!imagePath) {
            resolve();
            return;
        }

        const img = graphicsImage;
        
        // Show image if it's the first one
        if (!img.src || img.style.display === 'none') {
            img.style.display = 'block';
            img.src = imagePath;
            img.classList.add('fade-in');
            setTimeout(() => {
                img.classList.remove('fade-in');
                resolve();
            }, config.imageTransitionDuration);
            return;
        }
        
        // Fade out
        img.classList.add('fade-out');
        
        setTimeout(() => {
            img.src = imagePath;
            img.classList.remove('fade-out');
            img.classList.add('fade-in');
            
            setTimeout(() => {
                img.classList.remove('fade-in');
                resolve();
            }, config.imageTransitionDuration);
        }, config.imageTransitionDuration);
    });
}

// Execute animation (simplified - just calls streamAnimation)
async function executeAnimation() {
    const runId = ++state.streamRunId;
    await streamAnimation(runId);
}

// Update button states based on animation state
function updateButtonStates() {
    if (state.isPlaying && !state.isPaused) {
        playBtn.classList.add('active');
        pauseBtn.classList.remove('active');
    } else if (state.isPaused) {
        playBtn.classList.remove('active');
        pauseBtn.classList.add('active');
    } else {
        playBtn.classList.remove('active');
        pauseBtn.classList.remove('active');
    }
}

// Start animation
async function startAnimation() {
    if (state.isPlaying && !state.isPaused) return;
    
    if (state.isPaused) {
        // Resume from where we paused
        console.log(`▶️  Resuming from index ${state.globalCharIndex}`);
        state.isPaused = false;
        state.isPlaying = true;
        updateButtonStates();
        await executeAnimation();
    } else {
        // Start from beginning
        console.log('▶️  Starting from beginning');
        state.isPlaying = true;
        state.isPaused = false;
        state.globalCharIndex = 0;
        
        // Clear placeholders and prepare for animation
        terminalContent.innerHTML = '';
        const graphicsContent = document.getElementById('graphics-content');
        const placeholder = graphicsContent.querySelector('.graphics-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        updateButtonStates();
        
        // Preload first batch of images before starting (optional with unified string)
        await preloadUpcomingImages(0);
        
        await executeAnimation();
    }
}

// Pause animation
function pauseAnimation() {
    if (!state.isPlaying || state.isPaused) return;
    console.log(`⏸️  Pausing at index ${state.globalCharIndex}`);
    state.isPaused = true;
    updateButtonStates();
    // Invalidate current stream loop so that resume starts cleanly
    state.streamRunId++;
}

// Stop animation
function stopAnimation() {
    state.isPlaying = false;
    state.isPaused = false;
    if (state.currentTimeout) {
        clearTimeout(state.currentTimeout);
    }
}

// Reset display
function resetDisplay() {
    console.log('🔄 Resetting display');
    removeCursor(); // Remove cursor on reset
    terminalContent.innerHTML = '<div class="terminal-placeholder">Please click on the Play button.</div>';
    const graphicsContent = document.getElementById('graphics-content');
    graphicsContent.innerHTML = '<div class="graphics-placeholder">Please click on the Play button.</div><img id="current-image" alt="Render output" style="display: none;" />';
    // Update graphicsImage reference after resetting DOM
    graphicsImage = document.getElementById('current-image');
    progressFill.style.width = '0%';
    state.globalCharIndex = 0;
    state.currentElement = null;
    state.punchlineSpan = null;
    state.currentImagePath = '';
    state.isCodeBlock = false;
    state.cursorElement = null;
    // Keep imagePreloadCache for performance
    // Invalidate any running stream
    state.streamRunId++;
}

// Reset animation
function resetAnimation() {
    console.log('⏹️  Resetting animation');
    stopAnimation();
    resetDisplay();
    updateButtonStates();
}

// Update speed in real-time
function updateSpeed() {
    config.charDelay = parseInt(speedSlider.value);
    speedValue.textContent = `${config.charDelay}ms`;
}

// Event Listeners
playBtn.addEventListener('click', startAnimation);
pauseBtn.addEventListener('click', pauseAnimation);
resetBtn.addEventListener('click', resetAnimation);
speedSlider.addEventListener('input', updateSpeed);

// Initialize
loadConfig();
updateSpeed(); // Set initial speed display

