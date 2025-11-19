        let gameState = 'waiting'; // 'waiting', 'ready', 'clicked'
        let startTime = 0;
        let gameTimeout = null;
        let attempts = [];
        let bestTime = localStorage.getItem('reflexBestTime') || null;
        let totalAttempts = parseInt(localStorage.getItem('reflexAttempts') || '0');

        const gameArea = document.getElementById('gameArea');
        const gameText = document.getElementById('gameText');
        const startBtn = document.getElementById('startBtn');
        const bestTimeEl = document.getElementById('bestTime');
        const avgTimeEl = document.getElementById('avgTime');
        const resultPopup = document.getElementById('resultPopup');
        const resultTime = document.getElementById('resultTime');
        const resultMessage = document.getElementById('resultMessage');

        // Load stats
        updateStatsDisplay();

        function startGame() {
            if (gameState !== 'waiting') return;
            
            gameState = 'waiting';
            gameArea.className = 'game-area waiting';
            gameText.textContent = 'Wait for GREEN...';
            startBtn.disabled = true;
            
            // Random delay between 2-6 seconds
            const delay = Math.random() * 4000 + 2000;
            
            gameTimeout = setTimeout(() => {
                if (gameState === 'waiting') {
                    gameState = 'ready';
                    gameArea.className = 'game-area ready';
                    gameText.textContent = 'CLICK NOW!';
                    startTime = Date.now();
                }
            }, delay);
        }

        function handleGameAreaClick() {
            if (gameState === 'waiting') {
                // Clicked too early
                clearTimeout(gameTimeout);
                gameState = 'clicked';
                gameArea.className = 'game-area too-early';
                gameText.textContent = 'Too early! Wait for GREEN';
                
                setTimeout(() => {
                    resetGame();
                }, 1500);
                
            } else if (gameState === 'ready') {
                // Perfect timing
                const reactionTime = Date.now() - startTime;
                gameState = 'clicked';
                gameArea.className = 'game-area clicked';
                gameText.textContent = `${reactionTime}ms!`;
                
                // Record the attempt
                attempts.push(reactionTime);
                totalAttempts++;
                
                // Update best time
                if (!bestTime || reactionTime < bestTime) {
                    bestTime = reactionTime;
                    localStorage.setItem('reflexBestTime', bestTime);
                    
                    // Show high score banner briefly
                    showHighScoreBanner();
                }
                
                localStorage.setItem('reflexAttempts', totalAttempts);
                updateStatsDisplay();
                
                // Show result popup
                showResult(reactionTime);
                
                // Reset after showing result
                setTimeout(() => {
                    resetGame();
                }, 2000);
            }
        }

        function showResult(time) {
            resultTime.textContent = `${time}ms`;
            
            let message = '';
            let emoji = '';
            
            if (time < 200) {
                message = 'INCREDIBLE! Pro gamer reflexes! 🏆';
                emoji = '🔥';
            } else if (time < 250) {
                message = 'Excellent! Lightning fast! ⚡';
                emoji = '⚡';
            } else if (time < 300) {
                message = 'Very good! Above average! 👏';
                emoji = '👏';
            } else if (time < 400) {
                message = 'Good reflexes! Keep practicing! 👍';
                emoji = '👍';
            } else if (time < 500) {
                message = 'Not bad! Room for improvement! 💪';
                emoji = '💪';
            } else {
                message = 'Keep trying! Practice makes perfect! 🎯';
                emoji = '🎯';
            }
            
            document.getElementById('resultMessage').textContent = message;
            resultPopup.classList.add('show');
        }

        function closeResult() {
            resultPopup.classList.remove('show');
        }

        function showHighScoreBanner() {
            const banner = document.createElement('div');
            banner.className = 'high-score-banner';
            banner.textContent = `🏆 NEW RECORD: ${bestTime}ms!`;
            
            document.querySelector('.game-container').insertBefore(banner, document.querySelector('.game-area'));
            
            setTimeout(() => {
                banner.remove();
            }, 3000);
        }

        function resetGame() {
            gameState = 'waiting';
            gameArea.className = 'game-area';
            gameText.textContent = 'Click "Start Game" to begin!';
            startBtn.disabled = false;
            clearTimeout(gameTimeout);
        }

        function resetStats() {
            if (confirm('Are you sure you want to reset all stats?')) {
                localStorage.removeItem('reflexBestTime');
                localStorage.removeItem('reflexAttempts');
                bestTime = null;
                totalAttempts = 0;
                attempts = [];
                updateStatsDisplay();
            }
        }

        function updateStatsDisplay() {
            bestTimeEl.textContent = bestTime ? `${bestTime}ms` : '---';
            
            if (attempts.length > 0) {
                const avg = Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
                avgTimeEl.textContent = `${avg}ms`;
            } else {
                avgTimeEl.textContent = '---';
            }
        }

        // Event listeners
        gameArea.addEventListener('click', handleGameAreaClick);
        gameArea.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleGameAreaClick();
        });

        // Prevent context menu on mobile
        gameArea.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });

        // Keyboard support (spacebar)
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                if (gameState === 'waiting' && startBtn.disabled) {
                    handleGameAreaClick();
                } else if (gameState === 'ready') {
                    handleGameAreaClick();
                } else if (gameState === 'waiting' && !startBtn.disabled) {
                    startGame();
                }
            }
        });

        // Game completion event (for future API integration)
        function submitScore(score) {
            // This will connect to your backend later
            console.log('Score submitted:', score);
            
            // Future API call example:
            /*
            fetch('/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: 'lightning-reflexes',
                    score: score,
                    timestamp: Date.now()
                })
            });
            */
        }

        // Auto-submit best scores (for tournaments)
        window.addEventListener('beforeunload', function() {
            if (bestTime) {
                submitScore(bestTime);
            }
        });
