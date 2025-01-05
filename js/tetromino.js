import { CONFIG } from './config.js';

class Tetromino {
    constructor(shape, grid) {
        this.shape = shape;
        this.color = CONFIG.COLORS.PIECE_COLORS[
            Math.floor(Math.random() * CONFIG.COLORS.PIECE_COLORS.length)
        ];
        this.x = Math.floor(CONFIG.GRID_WIDTH / 2) - Math.floor(shape[0].length / 2);
        this.y = 0;
        this.grid = grid;
    }

    rotate() {
        // 创建新的旋转后的形状
        const newShape = this.shape[0].map((_, colIndex) =>
            this.shape.map(row => row[colIndex]).reverse()
        );

        // 检查旋转后是否会发生碰撞
        if (!this.checkCollision(newShape, this.x, this.y)) {
            this.shape = newShape;
        }
    }

    moveDown() {
        if (!this.checkCollision(this.shape, this.x, this.y + 1)) {
            this.y += 1;
            return true;
        }
        return false;
    }

    moveLeft() {
        if (!this.checkCollision(this.shape, this.x - 1, this.y)) {
            this.x -= 1;
        }
    }

    moveRight() {
        if (!this.checkCollision(this.shape, this.x + 1, this.y)) {
            this.x += 1;
        }
    }

    checkCollision(shape, x, y) {
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j]) {
                    const newY = y + i;
                    const newX = x + j;
                    
                    // 检查是否碰到边界或其他方块
                    if (newY >= CONFIG.GRID_HEIGHT || 
                        newX < 0 || 
                        newX >= CONFIG.GRID_WIDTH || 
                        (newY >= 0 && this.grid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    draw(ctx) {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(
                        (this.x + j) * CONFIG.BLOCK_SIZE,
                        (this.y + i) * CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE
                    );
                }
            }
        }
    }

    // 预览绘制方法
    drawPreview(ctx, blockSize) {
        const offsetX = (ctx.canvas.width - this.shape[0].length * blockSize) / 2;
        const offsetY = (ctx.canvas.height - this.shape.length * blockSize) / 2;

        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(
                        offsetX + j * blockSize,
                        offsetY + i * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }
}

export { Tetromino }; 