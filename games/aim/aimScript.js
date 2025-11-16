        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        let gameState = {
            playing: false,
            score: 0,
            hits: 0,
            misses: 0,
            targets: [],
            timeLeft: 30,
            startTime: 0,
            hitTimes: [],
            gameData: {
                clickPositions: [],
                targetSpawns: []
            }
        };

        function resizeCanvas() {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Target {
            constructor() {
                const minSize = 30;
                const maxSize = 60;
                this.radius = Math.random() * (maxSize - minSize) + minSize;
                this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
                this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
                this.spawnTime = Date.now();
                this.lifetime = 2000; // 2 seconds before disappear
                this.points = Math.floor(100 / this.radius); // Smaller = more points
                
                gameState.gameData.targetSpawns.push({
                    x: this.x,
                    y: this.y,
                    radius: this.radius,
                    time: this.spawnTime
                });
            }

            draw() {
                const age = Date.now() - this.spawnTime;
                const lifePercent = age / this.lifetime;
                
                // Pulsing effect
                const pulse = Math.sin(age / 100) * 3;
                const currentRadius = this.radius + pulse;

                // Gradient
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, currentRadius
                );
                gradient.addColorStop(0, 'rgba(78, 205, 196, 0.8)');
                gradient.addColorStop(0.7, 'rgba(78, 205, 196, 0.4)');
                gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');

                // Main circle
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Border
                ctx.strokeStyle = `rgba(78, 205, 196, ${1 - lifePercent})`;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Center dot
                ctx.beginPath();
                ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#ff6b6b';
                ctx.fill();
            }

            isExpired() {
                return Date.now() - this.spawnTime > this.lifetime;
            }

            isHit(x, y) {
                const dx = x - this.x;
                const dy = y - this.y;
                return Math.sqrt(dx * dx + dy * dy) <= this.radius;
            }
        }

        function spawnTarget() {
            if (gameState.targets.length < 3) {
                gameState.targets.push(new Target());
            }
        }

        function handleClick(e) {
            if (!gameState.playing) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            let x, y;
            if (e.type.includes('touch')) {
                x = (e.touches[0].clientX - rect.left) * scaleX;
                y = (e.touches[0].clientY - rect.top) * scaleY;
            } else {
                x = (e.clientX - rect.left) * scaleX;
                y = (e.clientY - rect.top) * scaleY;
            }

            gameState.gameData.clickPositions.push({ x, y, time: Date.now() });

            let hit = false;
            for (let i = gameState.targets.length - 1; i >= 0; i--) {
                if (gameState.targets[i].isHit(x, y)) {
                    hit = true;
                    const target = gameState.targets[i];
                    const hitTime = Date.now() - target.spawnTime;
                    
                    gameState.score += target.points;
                    gameState.hits++;
                    gameState.hitTimes.push(hitTime);
                    gameState.targets.splice(i, 1);
                    
                    // Hit effect
                    createHitEffect(x, y);
                    break;
                }
            }

            if (!hit) {
                gameState.misses++;
                createMissEffect(x, y);
            }

            updateUI();
        }

        function createHitEffect(x, y) {
            // Simple particle burst
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const speed = 5;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 30,
                    color: '#4ecdc4'
                });
            }
        }

        function createMissEffect(x, y) {
            particles.push({
                x, y,
                vx: 0,
                vy: -2,
                life: 20,
                color: '#ff6b6b'
            });
        }

        let particles = [];

        function updateParticles() {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 30;
                ctx.fill();
                ctx.globalAlpha = 1;

                if (p.life <= 0) particles.splice(i, 1);
            }
        }

        function updateUI() {
            document.getElementById('score').textContent = gameState.score;
            const accuracy = gameState.hits + gameState.misses > 0 
                ? Math.round((gameState.hits / (gameState.hits + gameState.misses)) * 100)
                : 100;
            document.getElementById('accuracy').textContent = accuracy + '%';
        }

        function gameLoop() {
            if (!gameState.playing) return;

            // Clear canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update timer
            const elapsed = (Date.now() - gameState.startTime) / 1000;
            gameState.timeLeft = Math.max(0, 30 - elapsed);
            document.getElementById('timer').textContent = Math.ceil(gameState.timeLeft);

            if (gameState.timeLeft <= 0) {
                endGame();
                return;
            }

            // Remove expired targets
            gameState.targets = gameState.targets.filter(t => {
                if (t.isExpired()) {
                    gameState.misses++;
                    return false;
                }
                return true;
            });

            // Spawn new targets
            if (Math.random() < 0.03) {
                spawnTarget();
            }

            // Draw targets
            gameState.targets.forEach(t => t.draw());

            // Draw particles
            updateParticles();

            requestAnimationFrame(gameLoop);
        }

        function startGame() {
            document.querySelector('.start-screen').style.display = 'none';
            gameState = {
                playing: true,
                score: 0,
                hits: 0,
                misses: 0,
                targets: [],
                timeLeft: 30,
                startTime: Date.now(),
                hitTimes: [],
                gameData: {
                    clickPositions: [],
                    targetSpawns: [],
                    startTime: Date.now()
                }
            };
            
            spawnTarget();
            updateUI();
            gameLoop();
        }

        function endGame() {
            gameState.playing = false;
            gameState.gameData.endTime = Date.now();
            
            const accuracy = gameState.hits + gameState.misses > 0 
                ? Math.round((gameState.hits / (gameState.hits + gameState.misses)) * 100)
                : 0;
            
            const avgHitTime = gameState.hitTimes.length > 0
                ? Math.round(gameState.hitTimes.reduce((a, b) => a + b, 0) / gameState.hitTimes.length)
                : 0;

            document.getElementById('finalScore').textContent = gameState.score;
            document.getElementById('finalHits').textContent = gameState.hits;
            document.getElementById('finalAccuracy').textContent = accuracy + '%';
            document.getElementById('avgTime').textContent = avgHitTime + 'ms';
            
            document.querySelector('.end-screen').style.display = 'flex';

            // Send score to parent window
            if (window.parent) {
                window.parent.postMessage({
                    type: 'gameComplete',
                    game: 'aim-trainer',
                    score: gameState.score,
                    data: {
                        hits: gameState.hits,
                        misses: gameState.misses,
                        accuracy: accuracy,
                        avgHitTime: avgHitTime,
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

        // Event listeners
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleClick);

        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', e => e.preventDefault());
