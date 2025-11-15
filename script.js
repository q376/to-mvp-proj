// ===== TON ARCADE - Main Script =====
import { TONAddressConverter } from './utils.js';

const converter = new TONAddressConverter();

// ==== Configuration ====
const API_URL = "https://backend-51rt.onrender.com";

// ==== Global State ====
let tonConnectUI = null;
let currentWallet = null;

// ==== TON Connect Initialization ====
export function initTonConnect() {
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://tonnaton.netlify.app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    tonConnectUI.onStatusChange(wallet => {
        if (wallet) {
            console.log('Wallet connected:', wallet);
            currentWallet = wallet.account.address;
            handleWalletConnected(wallet);
        } else {
            console.log('Wallet disconnected');
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
}

// ==== Wallet Connection Handlers ====
export async function handleWalletConnected(wallet) {
    let walletAddress = wallet.account.address;
    let walletFriendly = converter.toNonBounceable(walletAddress);
    
    console.log('🔍 Connecting with wallet:', walletAddress);
    
    try {
        const response = await fetch(`${API_URL}/auth/wallet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wallet_raw: walletAddress,
                wallet_user_friendly: walletFriendly
            }),
        });

        const data = await response.json();

        if (response.ok && data.user) {
            localStorage.setItem("tonUser", JSON.stringify(data.user));
            console.log("User logged in:", data.user);
            renderUserProfile(data.user);
            showNotification("Connected successfully! 🎮", "success");
            showSection('account');
        } else {
            console.error("Login error:", data);
            showNotification("Login failed", "error");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        showNotification("Network error", "error");
    }
}

export function handleWalletDisconnected() {
    localStorage.removeItem("tonUser");
    location.reload();
}

// ==== UI Rendering ====
export function renderUserProfile(user) {
    renderAccountPage(user);
}

export function renderAccountPage(user) {
    document.getElementById("account-info").innerHTML = `
        <div class="account-profile" style="text-align: center; padding: 2rem; background: var(--card-bg); border-radius: 24px; border: 1px solid var(--card-border); margin-bottom: 2rem;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(45deg, #4ecdc4, #45b7d1); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1rem;">
                💎
            </div>
            <h3>Your TON Wallet</h3>
            <p style="font-family: monospace; background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 12px; margin: 1rem 0; word-break: break-all;">
                ${user.wallet_user_friendly}
            </p>
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                Connected since: ${new Date(user.created_at).toLocaleDateString()}
            </p>
        </div>
        
        <div class="wallet-section" style="padding: 2rem; background: var(--card-bg); border-radius: 24px; border: 1px solid var(--card-border);">
            <h3>💰 Your Stats</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
                <div style="padding: 1.5rem; background: rgba(78, 205, 196, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #4ecdc4;">${user.total_earned || 0} TON</div>
                    <div style="opacity: 0.8; margin-top: 0.5rem;">Total Earned</div>
                </div>
                <div style="padding: 1.5rem; background: rgba(255, 215, 0, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ffd700;">${user.tournaments_won || 0}</div>
                    <div style="opacity: 0.8; margin-top: 0.5rem;">Tournaments Won</div>
                </div>
                <div style="padding: 1.5rem; background: rgba(255, 107, 107, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ff6b6b;">${user.games_played || 0}</div>
                    <div style="opacity: 0.8; margin-top: 0.5rem;">Games Played</div>
                </div>
            </div>
            
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 15px; border-left: 4px solid #4ecdc4;">
                <h4 style="color: #4ecdc4; margin-bottom: 0.5rem;">💎 How Payouts Work:</h4>
                <ul style="color: rgba(255, 255, 255, 0.8); line-height: 1.8; padding-left: 1rem;">
                    <li>All prizes are sent directly to your connected TON wallet</li>
                    <li>Payouts are automatic after competitions end</li>
                    <li>Minimum payout is 0.1 TON</li>
                    <li>No withdrawal fees - you get 100% of your winnings</li>
                </ul>
            </div>
        </div>
    `;
}

export function checkSession() {
    const storedUser = localStorage.getItem("tonUser");
    if (storedUser && currentWallet) {
        const user = JSON.parse(storedUser);
        renderUserProfile(user);
    }
}

// ==== Navigation ====
export function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    document.getElementById(sectionName).classList.add('active');
    
    // Close mobile menu if open
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.classList.remove('active');
        navLinks.classList.remove('mobile-open');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function toggleMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
    }
}

// ==== Game Functions ====
export function playGame(gameId) {
    const gameMap = {
        "aim": "games/aim.html
        "flappy": "games/under_const.html",
        "2048": "games/under_const.html",
        "snake": "games/under_const.html",
        "memory": "games/under_const.html",
        "pong": "games/under_const.html",
        "reaction": "games/under_const.html",
        "breakout": "games/under_const.html",
        "minesweeper": "games/under_const.html",
        /*"flappy": "games/flappy/index.html",
        "2048": "games/2048/index.html",
        "snake": "games/snake/snaki.html",
        "memory": "games/memory/index.html",
        "pong": "games/pong.html",
        "reaction": "games/reaction.html",
        "breakout": "games/breakout/index.html",
        "minesweeper": "games/minesweeper/index.html",*/
    };

    const gameUrl = gameMap[gameId];
    if (!gameUrl) {
        showNotification("Game coming soon!", 'info');
        return;
    }

    // Lock screen orientation for mobile games if possible
    if (screen.orientation && screen.orientation.lock) {
        try {
            screen.orientation.lock('portrait').catch(() => {});
        } catch (e) {}
    }

    document.getElementById("game-frame").src = gameUrl;
    document.getElementById("game-modal").style.display = "flex";
    document.body.style.overflow = 'hidden';
}

export function closeGame() {
    document.getElementById("game-frame").src = "";
    document.getElementById("game-modal").style.display = "none";
    document.body.style.overflow = '';
    
    // Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
        try {
            screen.orientation.unlock();
        } catch (e) {}
    }
}

// ==== Notification System ====
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const isMobile = window.innerWidth <= 768;
    
    notification.style.cssText = `
        position: fixed;
        ${isMobile ? 'top: 80px; right: 10px; left: 10px;' : 'top: 20px; right: 20px; max-width: 300px;'}
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        color: white;
        font-weight: 600;
    `;
    
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
    
    setTimeout(() => notification.remove(), 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(style);

// ==== Score Validation ====
export function validateScore(game, score, data) {
    switch(game) {
        case 'breakout':
            const maxScorePerSecond = 50;
            const gameTimeSeconds = data.gameTime / 1000;
            return score <= (maxScorePerSecond * gameTimeSeconds);
    }
    return true;
}

// ==== Game Score Submission ====
window.addEventListener('message', function(event) {
    if (event.data.type === 'gameComplete') {
        const { game, score, data, timestamp } = event.data;
    
        if (validateScore(game, score, data)) {
            fetch(`${API_URL}/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: currentWallet,
                    game: game,
                    score: score,
                    gameData: data,
                    timestamp: timestamp
                })
            }).then(response => {
                if (response.ok) {
                    showNotification(`Score ${score} saved for ${game}!`, 'success');
                }
            });
        }
    }
});

// ==== Header Scroll Effect ====
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        header.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// ==== Close Mobile Menu on Outside Click ====
document.addEventListener('click', function(e) {
    const nav = document.querySelector('nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (nav && !nav.contains(e.target)) {
        if (toggle) toggle.classList.remove('active');
        if (navLinks) navLinks.classList.remove('mobile-open');
    }
});

// ==== Keyboard Shortcuts ====
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeGame();
    }
});

// ==== Initialization ====
document.addEventListener('DOMContentLoaded', function() {
    initTonConnect();
    setTimeout(checkSession, 500);
    
    // Initialize card animations
    const cards = document.querySelectorAll('.game-card, .info-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    function animateOnScroll() {
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }
    
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    animateOnScroll();
});

// ==== Handle Orientation Changes ====
window.addEventListener('orientationchange', function() {
    setTimeout(() => window.scrollTo(0, 0), 100);
});

// ==== Make Functions Global ====
window.showSection = showSection;
window.playGame = playGame;
window.closeGame = closeGame;
window.toggleMobileMenu = toggleMobileMenu;
// ===== TON ARCADE - Main Script =====
// Complete JavaScript functionality for mvp.html
/*
import { TONAddressConverter } from './utils.js';

const converter = new TONAddressConverter();

// ==== TON Connect Initialization ====
const API_URL = "https://backend-51rt.onrender.com";
let tonConnectUI = null;
let currentWallet = null;

// Initialize TON Connect
export function initTonConnect() {
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://tonnaton.netlify.app/tonconnect-manifest.json', // UPDATE THIS WITH YOUR REAL URL!
        buttonRootId: 'ton-connect-button'
    });

    // Listen for wallet connection status changes
    tonConnectUI.onStatusChange(wallet => {
        if (wallet) {
            console.log('Wallet connected:', wallet);
            currentWallet = wallet.account.address;
            handleWalletConnected(wallet);
        } else {
            console.log('Wallet disconnected');
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
}


// Handle wallet connection
export async function handleWalletConnected(wallet) {
    // Get the wallet address - TON Connect provides it in user-friendly format
    let walletAddress = wallet.account.address;
    let walletFriendly = converter.toNonBounceable(walletAddress);
    // If address is in raw format (0:abc...), convert to user-friendly (EQ...)
    if (walletAddress.includes(':')) {
        // This is raw format, we need to convert it
        // For now, just use it as-is, TON Connect usually provides user-friendly format
        console.log('⚠️ Raw format detected:', walletAddress);
    }
    
    console.log('🔍 Connecting with wallet:', walletAddress);
    
    try {
        // Register/login user with backend
        const response = await fetch(`${API_URL}/auth/wallet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wallet_raw: walletAddress, // если есть raw
                wallet_user_friendly: walletFriendly // EQ/UQ
            }),
        });

        const data = await response.json();

        if (response.ok && data.user) {
            // Store user data locally
            localStorage.setItem("tonUser", JSON.stringify(data.user));
            console.log("User logged in:", data.user);
            renderUserProfile(data.user);
            showNotification("Connected successfully! 🎮", "success");
            showSection('account');
        } else {
            console.error("Login error:", data);
            showNotification("Login failed", "error");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        showNotification("Network error", "error");
    }
}

// Handle wallet disconnection
export function handleWalletDisconnected() {
    localStorage.removeItem("tonUser");
    location.reload();
}

// Render user profile after connection
export function renderUserProfile(user) {
    const authContainer = document.getElementById("auth-container");
    
    /*authContainer.innerHTML = `
        <div class="user-info" style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #4ecdc4, #45b7d1); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                💎
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
                <span style="font-weight: 600; font-size: 0.9rem;">${shortAddress}</span>
                <span style="font-size: 0.75rem; opacity: 0.7;">Connected</span>
            </div>
            <button onclick="disconnectWallet()" style="padding: 8px 16px; background: rgba(255, 68, 68, 0.2); border: 1px solid rgba(255, 68, 68, 0.4); border-radius: 8px; color: white; cursor: pointer; font-size: 0.85rem; transition: all 0.3s;">
                Disconnect
            </button>
        </div>
    `;* /

    renderAccountPage(user);
}

// Render account page
export function renderAccountPage(user) {
    document.getElementById("account-info").innerHTML = `
        <div class="account-profile" style="text-align: center; padding: 2rem; background: var(--card-bg); border-radius: 24px; border: 1px solid var(--card-border); margin-bottom: 2rem;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(45deg, #4ecdc4, #45b7d1); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1rem;">
                💎
            </div>
            <h3>Your TON Wallet</h3>
            <p style="font-family: monospace; background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 12px; margin: 1rem 0; word-break: break-all;">
                ${user.wallet_user_friendly}
            </p>
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                Connected since: ${new Date(user.created_at).toLocaleDateString()}
            </p>
        </div>
        
        <div class="wallet-section" style="padding: 2rem; background: var(--card-bg); border-radius: 24px; border: 1px solid var(--card-border);">
            <h3>💰 Your Stats</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
                <div style="padding: 1.5rem; background: rgba(78, 205, 196, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #4ecdc4;">${user.total_earned || 0} TON</div>
                    <div style="opacity: 0.8; margin-top: 0.5rem;">Total Earned</div>
                </div>
                <div style="padding: 1.5rem; background: rgba(255, 215, 0, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ffd700;">${user.tournaments_won || 0}</div>
                    <div style="opacity: 0.8; margin-top: 0.5rem;">Tournaments Won</div>
                </div>
                <div style="padding: 1.5rem; background: rgba(255, 107, 107, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ff6b6b;">${user.games_played || 0}</div>
                    <div style="opacity: 0.8; margin-top: 0.5rem;">Games Played</div>
                </div>
            </div>
            
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 15px; border-left: 4px solid #4ecdc4;">
                <h4 style="color: #4ecdc4; margin-bottom: 0.5rem;">💎 How Payouts Work:</h4>
                <ul style="color: rgba(255, 255, 255, 0.8); line-height: 1.8; padding-left: 1rem;">
                    <li>All prizes are sent directly to your connected TON wallet</li>
                    <li>Payouts are automatic after competitions end</li>
                    <li>Minimum payout is 0.1 TON</li>
                    <li>No withdrawal fees - you get 100% of your winnings</li>
                </ul>
            </div>
        </div>
    `;
}

// Disconnect wallet
async function disconnectWallet() {
    if (confirm("Are you sure you want to disconnect your wallet?")) {
        await tonConnectUI.disconnect();
        localStorage.removeItem("tonUser");
        showNotification("Wallet disconnected", "info");
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

// Check session on page load
export function checkSession() {
    const storedUser = localStorage.getItem("tonUser");
    if (storedUser && !currentWallet) {
        // User was logged in before but wallet not currently connected
        // Let TON Connect handle reconnection
        return;
    }
    if (storedUser && currentWallet) {
        const user = JSON.parse(storedUser);
        renderUserProfile(user);
    }
}

// ===== KEEP ALL THE CODE BELOW - These are your existing functions =====

// Section navigation
export function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.style.color = '#fff';
    });
    
    // Smooth scroll to top with mobile consideration
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Enhanced game functionality with mobile support
export function playGame(gameId) {
    const gameMap = {
        "flappy": "games/flappy/index.html",
        "2048": "games/2048/index.html",
        "snake": "games/snake/snaki.html",
        "memory": "games/memory/index.html",
        "chess": "games/chess.html",
        "pong": "games/pong.html",
        "reaction": "games/reaction.html",
        "checkers": "games/checkers/index.html",
        "plinko": "games/plinko/index.html",
        "slots": "games/slots/index.html",
        "blackjack": "games/blackjack/index.html",
        "breakout": "games/breakout/index.html",
        "minesweeper": "games/minesweeper/index.html",
    };

    const gameUrl = gameMap[gameId];
    if (!gameUrl) {
        showNotification("Game coming soon!", 'info');
        return;
    }

    // Lock screen orientation for mobile games if possible
    if (screen.orientation && screen.orientation.lock) {
        try {
            screen.orientation.lock('portrait').catch(() => {
                // Ignore if orientation lock fails
            });
        } catch (e) {
            // Ignore orientation lock errors
        }
    }

    document.getElementById("game-frame").src = gameUrl;
    document.getElementById("game-modal").style.display = "flex";
}

export function closeGame() {
    document.getElementById("game-frame").src = "";
    document.getElementById("game-modal").style.display = "none";
    
    // Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
        try {
            screen.orientation.unlock();
        } catch (e) {
            // Ignore orientation unlock errors
        }
    }
    
    // Show end-game ad
    setTimeout(() => {
        showNotification("Great game! Check out today's competitions!", 'info');
    }, 500);
}

// Enhanced notification system with mobile support
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    notification.style.cssText = `
        position: fixed;
        ${isMobile ? 'top: 80px; right: 10px; left: 10px; width: auto; max-width: none;' : 'top: 20px; right: 20px; max-width: 300px;'}
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        word-wrap: break-word;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
    `;
    
    if (isMobile) {
        notification.classList.add('notification-mobile');
    }
    
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
    
    notification.style.color = 'white';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

export function showUserProfile() {
    if (!currentWallet) {
        showNotification('Please connect your TON wallet to view profile', 'info');
    } else {
        showSection('account');
    }
}

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        header.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// Game score submission
window.addEventListener('message', function(event) {
    if (event.data.type === 'gameComplete') {
        const { game, score, data, timestamp } = event.data;
    
        // Basic validation
        if (validateScore(game, score, data)) {
            // Send to your backend
            fetch(`${API_URL}/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: currentWallet, // CHANGED: Now uses wallet instead of telegram_id
                    game: game,
                    score: score,
                    gameData: data,
                    timestamp: timestamp
                })
            }).then(response => {
                if (response.ok) {
                    showNotification(`Score ${score} saved for ${game}!`, 'success');
                }
            });
        }
    }
});

export function validateScore(game, score, data) {
    // Basic anti-cheat validation
    switch(game) {
        case 'breakout':
            // Check if score is reasonable for time played
            const maxScorePerSecond = 50;
            const gameTimeSeconds = data.gameTime / 1000;
            return score <= (maxScorePerSecond * gameTimeSeconds);
        // Add other games...
    }
    return true;
}

// Mobile Menu Toggle Functionality
export function initMobileMenu() {
    // Add mobile menu toggle to nav
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu toggle button
    const mobileToggle = document.createElement('div');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    // Insert mobile toggle before nav-links
    nav.insertBefore(mobileToggle, navLinks);
    
    // Toggle mobile menu
    mobileToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
    });
    
    // Close mobile menu when clicking on links
    const navLinksItems = navLinks.querySelectorAll('a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('mobile-open');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target)) {
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('mobile-open');
        }
    });
}

// Optimize for touch devices
export function optimizeForTouch() {
    // Add touch-friendly hover effects
    const cards = document.querySelectorAll('.game-card, .competition-card');
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Prevent zoom on input focus for mobile
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name=viewport]');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
            }
        });
        
        input.addEventListener('blur', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name=viewport]');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        });
    });
}

// Enhanced DOMContentLoaded with mobile support
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize TON Connect FIRST
    initTonConnect();
    
    // Then check session after a brief delay
    setTimeout(checkSession, 500);
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Optimize for touch devices
    optimizeForTouch();
    
    // Initialize card animations
    const cards = document.querySelectorAll('.game-card, .competition-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Animate cards on scroll
    function animateOnScroll() {
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }
    
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    animateOnScroll(); // Initial check
});

// Handle orientation changes
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

// Handle window resize
window.addEventListener('resize', function() {
    // Close mobile menu on resize
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        if (window.innerWidth > 768) {
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('mobile-open');
        }
    }
});

// At the end of script.js, make functions global:
   window.showSection = showSection;
   window.playGame = playGame;
   window.closeGame = closeGame;
   window.showUserProfile = showUserProfile;
   window.disconnectWallet = disconnectWallet;
*/
