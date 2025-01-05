class Particle {
    constructor(x, y, velocityX, velocityY, color, lifetime) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.lifetime = lifetime;
        this.alpha = 1;
        this.size = 4;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
        this.lifetime -= 16;  // 假设60fps
        this.alpha = this.lifetime / 1000;  // 逐渐消失
    }

    draw(ctx) {
        if (this.lifetime > 0) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    isAlive() {
        return this.lifetime > 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createFirework(x, y) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const particleCount = 100;  // 每个烟花的粒子数
        
        // 发射粒子
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 3 + Math.random() * 3;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push(new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                1000 + Math.random() * 500  // 1-1.5秒的生命周期
            ));
        }
    }

    startCelebration(x, y, callback) {
        // 创建烟花效果
        this.createFirework(x, y);
        
        if (callback) {
            setTimeout(callback, 1000);
        }
    }

    update() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.isAlive();
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

export { ParticleSystem }; 