// ===== TON ARCADE - Main Script =====
// Complete JavaScript functionality for mvp.html

// ===== Configuration =====
const CONFIG = {
    API_URL: "https://backend-51rt.onrender.com",
    MANIFEST_URL: "https://tonnaton.netlify.app/tonconnect-manifest.json"
};

// ===== Global State =====
let tonConnectUI = null;
let currentWallet = null;
let currentUser = null;

// ===== TON Connect Initialization =====
function initTonConnect() {
    try {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: CONFIG.MANIFEST_URL,
            buttonRootId: 'ton-connect-button'
        });

        // Listen for wallet connection changes
        tonConnectUI.onStatusChange(wallet => {
            if (wallet) {
                console.log('✅ Wallet connected:', wallet);
                currentWallet = wallet.account.address;
                handleWalletConnected(wallet);
            } else {
                console.log('❌ Wallet disconnected');
                currentWallet = null;
                handleWalletDisconnected();
            }
        });

        // Check if already connected
        const currentState = tonConnectUI.wallet;
        if (currentState) {
            currentWallet = currentState.account.address;
            handleWalletConnected(currentState);
        }

        console.log('🔌 TON Connect initialized');
    } catch (error) {
        console.error('❌ TON Connect initialization failed:', error);
        showNotification('Failed to initialize wallet connection', 'error');
    }
}

// ===== Wallet Connection Handlers =====
async function handleWalletConnected(wallet) {
    const walletAddress = wallet.account.address;
    
    try {
        // Register/authenticate with backend
        const response = await fetch(`${CONFIG.API_URL}/auth/wallet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wallet_address: walletAddress,
                chain: wallet.account.chain || 'mainnet'
            })
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user || { wallet_address: walletAddress };
            
            // Store user data
            localStorage.setItem("tonUser", JSON.stringify(currentUser));
            
            showNotification('Wallet connected successfully! 🎮', 'success');
            renderAccountInfo(walletAddress);
        } else {
            // Backend not available, still allow local functionality
            console.warn('⚠️ Backend unavailable, using local mode');
            currentUser = { 
                wallet_address: walletAddress,
                created_at: new Date().toISOString(),
                local_mode: true
            };
            localStorage.setItem("tonUser", JSON.stringify(currentUser));
            showNotification('Wallet connected (offline mode) 🎮', 'info');
            renderAccountInfo(walletAddress);
        }
    } catch (error) {
        console.error('❌ Connection error:', error);
        // Still allow local functionality
        currentUser = { 
            wallet_address: walletAddress,
            local_mode: true
        };
        showNotification('Wallet connected (offline mode)', 'info');
        renderAccountInfo(walletAddress);
    }
}

function handleWalletDisconnected() {
    currentUser = null;
    localStorage.removeItem("tonUser");
    showNotification('Wallet disconnected', 'info');
    location.reload();
}

// ===== UI Rendering Functions =====
function renderAccountInfo(address) {
    const accountInfo = document.getElementById('account-info');
    const shortAddress = address.substring(0, 6) + '...' + address.substring(address.length - 4);
    
    accountInfo.innerHTML = `
        <div class="account-profile">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(45deg, #4ecdc4, #45b7d1); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem;">
                💎
            </div>
            <h3>Wallet Connected</h3>
            <p style="word-break: break-all; font-family: 'Courier New', monospace; background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 12px; margin: 1rem 0;">
                ${address}
            </p>
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                ${currentUser?.local_mode ? '⚠️ Offline Mode - Backend Unavailable' : '✅ Connected & Ready'}
            </p>
            
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(78, 205, 196, 0.1); border-radius: 15px; border-left: 4px solid #4ecdc4;">
                <h4 style="color: #4ecdc4; margin-bottom: 0.5rem;">🎮 Your Gaming Hub</h4>
                <p style="color: rgba(255, 255, 255, 0.8); line-height: 1.6; margin: 0;">
                    Your progress is being tracked. Play games, compete with others, and prepare for upcoming tournaments with real TON prizes!
                </p>
            </div>
            
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 15px;">
                <h4 style="color: #ffd700; margin-bottom: 1rem;">🏆 Coming Soon:</h4>
                <ul style="color: rgba(255, 255, 255, 0.8); line-height: 1.8; padding-left: 1.5rem; text-align: left;">
                    <li>Competitive tournaments with TON prizes</li>
                    <li>Global leaderboards</li>
                    <li>Achievement system</li>
                    <li>Daily challenges</li>
                    <li>Multiplayer competitions</li>
                </ul>
            </div>
        </div>
    `;
}

// ===== Navigation Functions =====
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Close mobile menu if open
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.classList.remove('active');
        navLinks.classList.remove('mobile-open');
    }
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Mobile Menu Toggle =====
function toggleMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
    }
}

// ===== Game Functions =====
function playGame(gameId) {
    const gameMap = {
        "flappy": "games/flappy/index.html",
        "2048": "games/2048/index.html",
        "snake": "games/snake/snaki.html",
        "memory": "games/memory/index.html",
        "minesweeper": "games/minesweeper/index.html",
        "breakout": "games/breakout/index.html",
        "pong": "games/pong.html",
        "reaction": "games/reaction.html"
    };

    const gameUrl = gameMap[gameId];
    if (!gameUrl) {
        showNotification("Game coming soon! 🎮", 'info');
        return;
    }

    // Open game in modal
    const gameFrame = document.getElementById("game-frame");
    const gameModal = document.getElementById("game-modal");
    
    if (gameFrame && gameModal) {
        gameFrame.src = gameUrl;
        gameModal.style.display = "flex";
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

function closeGame() {
    const gameFrame = document.getElementById("game-frame");
    const gameModal = document.getElementById("game-modal");
    
    if (gameFrame && gameModal) {
        gameFrame.src = "";
        gameModal.style.display = "none";
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// ===== Notification System =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const isMobile = window.innerWidth <= 768;
    
    // Base styles
    notification.style.cssText = `
        position: fixed;
        ${isMobile ? 'top: 80px; right: 10px; left: 10px;' : 'top: 20px; right: 20px; max-width: 300px;'}
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        color: white;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    // Type-specific styling
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(45deg, #4ecdc4, #45b7d1)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(45deg, #ff6b6b, #ff5722)';
            break;
        case 'info':
            notification.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            break;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ===== Game Score Submission =====
window.addEventListener('message', function(event) {
    // Listen for game completion messages from iframes
    if (event.data.type === 'gameComplete') {
        const { game, score, timestamp } = event.data;
        
        if (!currentWallet) {
            showNotification('Connect wallet to save scores! 💎', 'info');
            return;
        }

        // Submit score to backend
        fetch(`${CONFIG.API_URL}/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: currentWallet,
                game: game,
                score: score,
                timestamp: timestamp || Date.now()
            })
        })
        .then(response => {
            if (response.ok) {
                showNotification(`Score ${score} saved for ${game}! 🎉`, 'success');
            } else {
                // Store locally if backend fails
                const localScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
                localScores.push({ game, score, timestamp: Date.now() });
                localStorage.setItem('gameScores', JSON.stringify(localScores));
                showNotification('Score saved locally ⚠️', 'info');
            }
        })
        .catch(error => {
            console.error('Score submission error:', error);
            // Store locally
            const localScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
            localScores.push({ game, score, timestamp: Date.now() });
            localStorage.setItem('gameScores', JSON.stringify(localScores));
            showNotification('Score saved locally', 'info');
        });
    }
});

// ===== Header Scroll Effect =====
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(0, 0, 0, 0.95)';
        } else {
            header.style.background = 'rgba(0, 0, 0, 0.85)';
        }
    }
});

// ===== Close Mobile Menu on Outside Click =====
document.addEventListener('click', function(e) {
    const nav = document.querySelector('nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (nav && !nav.contains(e.target)) {
        if (toggle) toggle.classList.remove('active');
        if (navLinks) navLinks.classList.remove('mobile-open');
    }
});

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', function(e) {
    // Close game with ESC key
    if (e.key === 'Escape') {
        closeGame();
    }
});

// ===== Session Check =====
function checkSession() {
    const storedUser = localStorage.getItem("tonUser");
    if (storedUser && !currentWallet) {
        // User was logged in before but wallet not connected
        // Let TON Connect handle reconnection
        console.log('📋 Previous session found, waiting for wallet reconnection...');
    }
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 TonArcade initializing...');
    
    // Initialize TON Connect
    initTonConnect();
    
    // Check for existing session
    setTimeout(checkSession, 500);
    
    // Log initialization complete
    console.log('✅ TonArcade initialized successfully');
});

// ===== Make Functions Global =====
window.showSection = showSection;
window.playGame = playGame;
window.closeGame = closeGame;
window.toggleMobileMenu = toggleMobileMenu;
