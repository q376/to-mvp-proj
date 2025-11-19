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
        manifestUrl: 'https://tonarcade.netlify.app/tonconnect-manifest.json',
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
        "aim": "games/aim/index.html",
        "color": "games/color/index.html",
        "reflex": "games/reaction/index.html",
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

