const CONFIG = {
    // 游戏区域设置
    BLOCK_SIZE: 30,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 15,
    PREVIEW_WIDTH: 130,
    FPS: 30,

    // 颜色定义
    COLORS: {
        BLACK: '#000000',
        WHITE: '#FFFFFF',
        PIECE_COLORS: [
            '#00FFFF',  // I - 青色
            '#FFFF00',  // O - 黄色
            '#FFA500',  // L - 橙色
            '#0000FF',  // J - 蓝色
            '#00FF00',  // S - 绿色
            '#FF0000',  // Z - 红色
            '#800080'   // T - 紫色
        ]
    },

    // 方块形状定义
    SHAPES: [
        [[1, 1, 1, 1]],         // I
        [[1, 1], [1, 1]],       // O
        [[1, 0, 0], [1, 1, 1]], // L
        [[0, 0, 1], [1, 1, 1]], // J
        [[0, 1, 1], [1, 1, 0]], // S
        [[1, 1, 0], [0, 1, 1]], // Z
        [[0, 1, 0], [1, 1, 1]]  // T
    ],

    // 游戏设置
    GAME_SETTINGS: {
        scoreThreshold: 300,
        speedFactor: 0.8,
        bgColors: {
            'Navy': '#000080',
            'Black': '#000000',
            'Dark Green': '#006400',
            'Dark Purple': '#300030',
            'Dark Gray': '#404040'
        }
    },

    // 本地存储键
    STORAGE_KEYS: {
        HIGH_SCORE: 'tetris_high_score',
        SETTINGS: 'tetris_settings'
    }
};

// 游戏状态枚举
const GAME_STATES = {
    MENU: 'menu',
    OPTIONS: 'options',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// 本地存储操作
const Storage = {
    saveHighScore(score) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, score.toString());
    },

    loadHighScore() {
        return parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE)) || 0;
    },

    saveSettings(settings) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    loadSettings() {
        const defaultSettings = {
            scoreThreshold: CONFIG.GAME_SETTINGS.scoreThreshold,
            speedFactor: CONFIG.GAME_SETTINGS.speedFactor,
            bgColor: 'Navy'
        };
        
        try {
            const savedSettings = JSON.parse(
                localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS)
            );
            return { ...defaultSettings, ...savedSettings };
        } catch {
            return defaultSettings;
        }
    }
};

// 导出配置
export { CONFIG, GAME_STATES, Storage }; 