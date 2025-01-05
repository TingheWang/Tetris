import { CONFIG, GAME_STATES, Storage } from './config.js';
import { Tetromino } from './tetromino.js';
import { ParticleSystem } from './particle.js';

class Game {
    constructor() {
        // 初始化画布
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // 设置画布大小
        this.gameCanvas.width = CONFIG.GRID_WIDTH * CONFIG.BLOCK_SIZE;
        this.gameCanvas.height = CONFIG.GRID_HEIGHT * CONFIG.BLOCK_SIZE;
        this.previewCanvas.width = 100;
        this.previewCanvas.height = 100;

        // 初始化烟花画布
        this.fireworksCanvas = document.getElementById('fireworksCanvas');
        this.fireworksCtx = this.fireworksCanvas.getContext('2d');
        
        // 设置烟花画布大小为窗口大小
        this.fireworksCanvas.width = window.innerWidth;
        this.fireworksCanvas.height = window.innerHeight;

        // 游戏状态 - 只在内存中维护，不持久化
        this.gameState = GAME_STATES.MENU;  // 初始状态始终是菜单
        
        // 清空网格
        this.grid = Array(CONFIG.GRID_HEIGHT).fill().map(() => 
            Array(CONFIG.GRID_WIDTH).fill(null)
        );
        
        // 游戏数据
        this.score = 0;
        this.highScore = Storage.loadHighScore();  // 只持久化最高分
        this.settings = Storage.loadSettings();     // 和设置
        this.currentPiece = null;
        this.nextPiece = null;
        this.fallSpeed = 1.0;
        this.lastSpeedScore = 0;
        this.lastTime = 0;
        this.fallTime = 0;
        this.paused = false;

        // 特效系统
        this.particleSystem = new ParticleSystem();

        // 绑定事件处理
        this.bindEvents();
        
        // 初始化背景色按钮的颜色
        this.initializeBackgroundButton();
        
        // 初始化时只显示主菜单，隐藏其他所有画面
        this.showScreen('menuScreen');
        
        // 开始游戏循环
        requestAnimationFrame(this.gameLoop.bind(this));

        // 在初始化时设置当前选中的颜色
        this.initializeColorSelection();
    }

    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 按钮点击事件
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('optionsButton').addEventListener('click', () => {
            this.showScreen('optionsScreen');
        });
        
        document.getElementById('backButton').addEventListener('click', () => {
            this.showScreen('menuScreen');
        });

        // 修改选项按钮的事件监听
        document.querySelector('.adjust-threshold')
            .addEventListener('click', () => this.adjustThreshold());
        
        document.querySelector('.adjust-speed')
            .addEventListener('click', () => this.adjustSpeed());
        
        document.querySelector('.adjust-background')
            .addEventListener('click', () => this.adjustBackground());

        document.querySelector('.reset-score')
            .addEventListener('click', () => this.resetHighScore());

        // 游戏结束画面的按钮事件
        document.getElementById('restartButton').addEventListener('click', () => {
            this.startGame();  // 直接重新开始游戏
        });

        document.getElementById('returnToMenuButton').addEventListener('click', () => {
            this.returnToMenu();
        });
    }

    handleKeyPress(event) {
        if (this.gameState !== GAME_STATES.PLAYING || !this.currentPiece) return;

        switch(event.code) {
            case 'ArrowLeft':
                this.currentPiece.moveLeft();
                break;
            case 'ArrowRight':
                this.currentPiece.moveRight();
                break;
            case 'ArrowUp':
                this.currentPiece.rotate();
                break;
            case 'ArrowDown':
                this.currentPiece.moveDown();
                break;
            case 'Space':
                this.hardDrop();
                break;
            case 'KeyP':
                this.togglePause();
                break;
        }
    }

    startGame() {
        this.gameState = GAME_STATES.PLAYING;
        this.resetGame();
        if (!this.currentPiece) {
            this.currentPiece = this.getNewPiece();
        }
        // 隐藏所有画面
        this.showScreen('none');  // 游戏进行时不显示任何菜单画面
    }

    resetGame() {
        console.log('Resetting game, previous state:', this.gameState);
        this.grid = Array(CONFIG.GRID_HEIGHT).fill().map(() => 
            Array(CONFIG.GRID_WIDTH).fill(null)
        );
        this.score = 0;
        this.fallSpeed = 1.0;
        this.lastSpeedScore = 0;
        this.nextPiece = null;
        this.currentPiece = this.getNewPiece();
        this.gameState = GAME_STATES.PLAYING;
        console.log('Game state after reset:', this.gameState);
        this.paused = false;
        this.updateScore();
        this.fallTime = 0;
        document.getElementById('gameOverScreen').classList.add('hidden');  // 确保游戏结束画面是隐藏的
    }

    getNewPiece() {
        if (!this.nextPiece) {
            this.nextPiece = new Tetromino(
                CONFIG.SHAPES[Math.floor(Math.random() * CONFIG.SHAPES.length)],
                this.grid
            );
        }
        const piece = this.nextPiece;
        this.nextPiece = new Tetromino(
            CONFIG.SHAPES[Math.floor(Math.random() * CONFIG.SHAPES.length)],
            this.grid
        );
        return piece;
    }

    hardDrop() {
        while (this.currentPiece.moveDown()) {
            // 继续下落直到不能下落
        }
        this.lockPiece();
    }

    lockPiece() {
        for (let i = 0; i < this.currentPiece.shape.length; i++) {
            for (let j = 0; j < this.currentPiece.shape[i].length; j++) {
                if (this.currentPiece.shape[i][j]) {
                    const y = this.currentPiece.y + i;
                    const x = this.currentPiece.x + j;
                    if (y >= 0) {
                        this.grid[y][x] = this.currentPiece.color;
                    }
                }
            }
        }

        this.clearLines();
        this.currentPiece = this.getNewPiece();

        if (this.currentPiece.checkCollision(
            this.currentPiece.shape,
            this.currentPiece.x,
            this.currentPiece.y
        )) {
            this.gameOver();
        }
    }

    clearLines() {
        let linesCleared = 0;
        let clearedRows = [];

        // 找出需要清除的行
        for (let i = CONFIG.GRID_HEIGHT - 1; i >= 0; i--) {
            if (this.grid[i].every(cell => cell !== null)) {
                clearedRows.push(i);
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            // 添加闪烁动画
            this.animateClearedLines(clearedRows, () => {
                // 动画完成后清除行
                const newGrid = Array(CONFIG.GRID_HEIGHT).fill().map(() => 
                    Array(CONFIG.GRID_WIDTH).fill(null)
                );
                
                let sourceRow = CONFIG.GRID_HEIGHT - 1;
                let targetRow = CONFIG.GRID_HEIGHT - 1;
                
                // 从底部开始，跳过被清除的行
                while (sourceRow >= 0) {
                    if (!clearedRows.includes(sourceRow)) {
                        // 复制未被清除的行
                        newGrid[targetRow] = [...this.grid[sourceRow]];
                        targetRow--;
                    }
                    sourceRow--;
                }
                
                // 更新网格
                this.grid = newGrid;
                
                // 更新当前方块和下一个方块的网格引用
                if (this.currentPiece) {
                    this.currentPiece.grid = this.grid;
                }
                if (this.nextPiece) {
                    this.nextPiece.grid = this.grid;
                }

                this.score += linesCleared * 100;
                this.updateScore();

                if (Math.floor(this.score / this.settings.scoreThreshold) > 
                    Math.floor(this.lastSpeedScore / this.settings.scoreThreshold)) {
                    this.fallSpeed *= this.settings.speedFactor;
                    this.lastSpeedScore = this.score;
                }
            });
        }
    }

    animateClearedLines(rows, callback) {
        let flashCount = 0;
        const maxFlashes = 3;
        const flashInterval = setInterval(() => {
            rows.forEach(row => {
                for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
                    this.grid[row][x] = flashCount % 2 === 0 ? '#FFF' : '#000';
                }
            });
            
            flashCount++;
            if (flashCount >= maxFlashes * 2) {
                clearInterval(flashInterval);
                callback();
            }
        }, 100);
    }

    gameOver() {
        if (this.gameState === GAME_STATES.PLAYING) {
            this.gameState = GAME_STATES.GAME_OVER;
            
            // 先检查和更新最高分
            const isNewRecord = this.score > this.highScore;
            if (isNewRecord) {
                this.highScore = this.score;
                Storage.saveHighScore(this.highScore);
            }

            // 显示游戏结束画面
            this.showScreen('gameOverScreen');
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('finalHighScore').textContent = this.highScore;

            // 如果是新记录，立即开始烟花庆祝
            if (isNewRecord) {
                // 显示新记录提示
                const newRecordMessage = document.getElementById('newRecordMessage');
                newRecordMessage.classList.remove('hidden');
                
                // 清除可能存在的旧粒子
                this.particleSystem.clear();
                
                // 开始烟花庆祝，持续5秒
                const fireworkInterval = setInterval(() => {
                    // 在游戏区域内随机位置发射烟花
                    const x = Math.random() * window.innerWidth;
                    const y = window.innerHeight * 0.3;
                    
                    // 创建多个烟花
                    for (let i = 0; i < 3; i++) {
                        const offsetX = x + (Math.random() - 0.5) * 200;
                        const offsetY = y + (Math.random() - 0.5) * 200;
                        this.particleSystem.createFirework(offsetX, offsetY);
                    }
                }, 500);  // 每500ms发射一次

                // 5秒后停止烟花和隐藏提示
                setTimeout(() => {
                    clearInterval(fireworkInterval);
                    this.particleSystem.clear();
                    newRecordMessage.classList.add('hidden');
                }, 5000);
            }
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.showScreen('pauseScreen');
        } else {
            this.showScreen('none');  // 继续游戏时不显示任何菜单画面
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
    }

    draw() {
        // 清空主游戏画布
        this.gameCtx.fillStyle = CONFIG.GAME_SETTINGS.bgColors[this.settings.bgColor];
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

        // 绘制网格线（添加这部分来区分游戏区域）
        this.gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.gameCtx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x <= CONFIG.GRID_WIDTH; x++) {
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(x * CONFIG.BLOCK_SIZE, 0);
            this.gameCtx.lineTo(x * CONFIG.BLOCK_SIZE, this.gameCanvas.height);
            this.gameCtx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= CONFIG.GRID_HEIGHT; y++) {
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(0, y * CONFIG.BLOCK_SIZE);
            this.gameCtx.lineTo(this.gameCanvas.width, y * CONFIG.BLOCK_SIZE);
            this.gameCtx.stroke();
        }

        // 绘制网格中的方块
        for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
                if (this.grid[y][x]) {
                    this.gameCtx.fillStyle = this.grid[y][x];
                    this.gameCtx.fillRect(
                        x * CONFIG.BLOCK_SIZE,
                        y * CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE
                    );
                }
            }
        }

        // 绘制当前方块
        if (this.currentPiece) {
            this.currentPiece.draw(this.gameCtx);
        }

        // 绘制预览
        this.previewCtx.fillStyle = '#000';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        if (this.nextPiece) {
            this.nextPiece.drawPreview(this.previewCtx, 20);
        }

        // 清空并绘制烟花效果
        this.fireworksCtx.clearRect(0, 0, this.fireworksCanvas.width, this.fireworksCanvas.height);
        this.particleSystem.draw(this.fireworksCtx);
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;

        // 更新游戏逻辑
        if (this.gameState === GAME_STATES.PLAYING && !this.paused) {
            this.fallTime += deltaTime;

            if (this.fallTime >= this.fallSpeed * 1000) {
                this.fallTime = 0;
                if (this.currentPiece && !this.currentPiece.moveDown()) {
                    this.lockPiece();
                }
            }
        }

        // 始终更新和绘制粒子效果
        this.particleSystem.update();
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // 添加选项调整方法
    adjustThreshold() {
        const currentValue = parseInt(document.getElementById('thresholdValue').textContent);
        let newValue = currentValue + 100;
        if (newValue > 1000) newValue = 100;
        
        document.getElementById('thresholdValue').textContent = newValue;
        this.settings.scoreThreshold = newValue;
        Storage.saveSettings(this.settings);
    }

    adjustSpeed() {
        const currentLevel = parseInt(document.getElementById('speedLevel').textContent);
        let newLevel = currentLevel % 9 + 1;
        
        document.getElementById('speedLevel').textContent = newLevel;
        this.settings.speedFactor = (10 - newLevel) / 10;
        Storage.saveSettings(this.settings);
    }

    adjustBackground() {
        const colors = Object.keys(CONFIG.GAME_SETTINGS.bgColors);
        const currentColor = document.getElementById('bgColor').textContent;
        const currentIndex = colors.indexOf(currentColor);
        const nextColor = colors[(currentIndex + 1) % colors.length];
        
        // 更新文本和设置
        document.getElementById('bgColor').textContent = nextColor;
        this.settings.bgColor = nextColor;
        Storage.saveSettings(this.settings);
        
        // 更新按钮的背景色
        const button = document.querySelector('.adjust-background');
        if (button) {
            button.style.backgroundColor = CONFIG.GAME_SETTINGS.bgColors[nextColor];
        }
    }

    // 在初始化时设置当前选中的颜色
    initializeColorSelection() {
        const currentColor = this.settings.bgColor;
        const colorBtn = document.querySelector(`.color-btn[data-color="${currentColor}"]`);
        if (colorBtn) {
            colorBtn.classList.add('active');
        }
    }

    // 添加返回菜单的方法
    returnToMenu() {
        this.gameState = GAME_STATES.MENU;
        this.showScreen('menuScreen');
    }

    // 添加初始化背景色按钮的方法
    initializeBackgroundButton() {
        const currentColor = this.settings.bgColor;
        const button = document.querySelector('.adjust-background');
        if (button) {
            button.style.backgroundColor = CONFIG.GAME_SETTINGS.bgColors[currentColor];
        }
    }

    resetHighScore() {
        // 添加确认对话框
        if (confirm('Are you sure you want to reset the high score?')) {
            localStorage.removeItem('tetris_high_score');
            this.highScore = 0;
            document.getElementById('highScore').textContent = '0';
            if (document.getElementById('finalHighScore')) {
                document.getElementById('finalHighScore').textContent = '0';
            }
        }
    }

    // 添加一个新方法来管理画面显示
    showScreen(screenId) {
        // 隐藏所有画面
        const screens = ['menuScreen', 'gameOverScreen', 'optionsScreen', 'pauseScreen'];
        screens.forEach(screen => {
            document.getElementById(screen).classList.add('hidden');
        });
        
        // 只有当 screenId 不是 'none' 时才显示指定的画面
        if (screenId !== 'none') {
            document.getElementById(screenId).classList.remove('hidden');
        }
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new Game();
});

export { Game }; 