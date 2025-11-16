        const colors = [
            { name: 'RED', hex: '#ff6b6b' },
            { name: 'BLUE', hex: '#4ecdc4' },
            { name: 'GREEN', hex: '#51cf66' },
            { name: 'YELLOW', hex: '#ffd700' },
            { name: 'PURPLE', hex: '#a78bfa' },
            { name: 'ORANGE', hex: '#ff922b' },
            { name: 'PINK', hex: '#ff6ec7' },
            { name: 'CYAN', hex: '#22d3ee' }
        ];

        let gameState = {
            playing: false,
            score: 0,
            correct: 0,
            wrong: 0,
            combo: 0,
            bestCombo: 0,
            timeLeft: 30,
            startTime: 0,
            currentColor: null,
            options: [],
            totalRounds: 0,
            responseTimes: []
        };

        function shuffleArray(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function generateRound() {
            gameState.totalRounds++;
            gameState.roundStartTime = Date.now();
            
            // Pick a random target color
            gameState.currentColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Generate 4 unique color options including the correct one
            let optionPool = colors.filter(c => c !== gameState.currentColor);
            optionPool = shuffleArray(optionPool).slice(0, 3);
            gameState.options = shuffleArray([gameState.currentColor, ...optionPool]);
            
            // Display
            const colorName = document.getElementById('colorName');
            colorName.textContent = gameState.currentColor.name;
            colorName.style.color = gameState.currentColor.hex;
            
            // Create buttons
            const grid = document.getElementById('colorGrid');
            grid.innerHTML = '';
            gameState.options.forEach(color => {
                const btn = document.createElement('button');
                btn.className = 'color-button';
                btn.style.background = color.hex;
                btn.onclick = () => checkAnswer(color);
                grid.appendChild(btn);
            });
        }

        function checkAnswer(selectedColor) {
            if (!gameState.playing) return;
            
            const responseTime = Date.now() - gameState.roundStartTime;
            gameState.responseTimes.push(responseTime);
            
            if (selectedColor.name === gameState.currentColor.name) {
                // Correct!
                gameState.correct++;
                gameState.combo++;
                if (gameState.combo > gameState.bestCombo) {
                    gameState.bestCombo = gameState.combo;
                }
                
                // Score: base 10 + combo bonus + speed bonus
                const speedBonus = Math.max(0, Math.floor((1000 - responseTime) / 100));
                const comboBonus = gameState.combo * 5;
                const points = 10 + speedBonus + comboBonus;
                gameState.score += points;
                
                // Visual feedback
                event.target.classList.add('correct-flash');
                
                // Show combo if 3+
                if (gameState.combo >= 3) {
                    showCombo();
                }
                
                setTimeout(() => generateRound(), 200);
            } else {
                // Wrong!
                gameState.wrong++;
                gameState.combo = 0;
                
                // Visual feedback
                event.target.classList.add('wrong-flash');
                setTimeout(() => event.target.classList.remove('wrong-flash'), 300);
            }
            
            updateUI();
        }

        function showCombo() {
            const container = document.querySelector('.game-container');
            const comboEl = document.createElement('div');
            comboEl.className = 'combo-indicator';
            comboEl.textContent = `${gameState.combo}x COMBO!`;
            container.appendChild(comboEl);
            setTimeout(() => comboEl.remove(), 600);
        }

        function updateUI() {
            document.getElementById('score').textContent = gameState.score;
            document.getElementById('combo').textContent = gameState.combo + 'x';
        }

        function gameLoop() {
            if (!gameState.playing) return;

            const elapsed = (Date.now() - gameState.startTime) / 1000;
            gameState.timeLeft = Math.max(0, 30 - elapsed);
            document.getElementById('timer').textContent = Math.ceil(gameState.timeLeft);

            if (gameState.timeLeft <= 0) {
                endGame();
                return;
            }

            requestAnimationFrame(gameLoop);
        }

        function startGame() {
            document.querySelector('.start-screen').style.display = 'none';
            document.getElementById('gameArea').style.display = 'flex';
            
            gameState = {
                playing: true,
                score: 0,
                correct: 0,
                wrong: 0,
                combo: 0,
                bestCombo: 0,
                timeLeft: 30,
                startTime: Date.now(),
                totalRounds: 0,
                responseTimes: [],
                gameData: {
                    rounds: [],
                    startTime: Date.now()
                }
            };
            
            updateUI();
            generateRound();
            gameLoop();
        }

        function endGame() {
            gameState.playing = false;
            gameState.gameData.endTime = Date.now();
            
            const accuracy = gameState.correct + gameState.wrong > 0 
                ? Math.round((gameState.correct / (gameState.correct + gameState.wrong)) * 100)
                : 0;
            
            const avgResponseTime = gameState.responseTimes.length > 0
                ? Math.round(gameState.responseTimes.reduce((a, b) => a + b, 0) / gameState.responseTimes.length)
                : 0;

            document.getElementById('finalScore').textContent = gameState.score;
            document.getElementById('finalCorrect').textContent = gameState.correct;
            document.getElementById('finalAccuracy').textContent = accuracy + '%';
            document.getElementById('finalCombo').textContent = gameState.bestCombo + 'x';
            
            document.getElementById('gameArea').style.display = 'none';
            document.querySelector('.end-screen').style.display = 'flex';

            // Send score to parent
            if (window.parent) {
                window.parent.postMessage({
                    type: 'gameComplete',
                    game: 'color-match',
                    score: gameState.score,
                    data: {
                        correct: gameState.correct,
                        wrong: gameState.wrong,
                        accuracy: accuracy,
                        bestCombo: gameState.bestCombo,
                        avgResponseTime: avgResponseTime,
                        totalRounds: gameState.totalRounds,
                        gameData: gameState.gameData
                    },
                    timestamp: Date.now()
                }, '*');
            }
        }

        function restartGame() {
            document.querySelector('.end-screen').style.display = 'none';
            startGame();
        }
