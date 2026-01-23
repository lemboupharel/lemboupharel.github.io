// Particle Animation System for Portfolio
// Optimized for performance with requestAnimationFrame

class ParticleSystem {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };

        // Configuration
        this.config = {
            particleCount: options.particleCount || (window.innerWidth < 768 ? 30 : 60),
            particleColors: options.colors || ['#22d3ee', '#a78bfa', '#f97316', '#06b6d4'],
            maxSize: options.maxSize || 4,
            minSize: options.minSize || 1,
            speed: options.speed || 0.5,
            connectionDistance: options.connectionDistance || 120,
            enableConnections: options.enableConnections !== false,
            enableMouseInteraction: options.enableMouseInteraction !== false
        };

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.createParticles();

        window.addEventListener('resize', () => this.resizeCanvas());

        if (this.config.enableMouseInteraction) {
            this.canvas.addEventListener('mousemove', (e) => {
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });
        }

        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(new Particle(this));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        if (this.config.enableConnections) {
            this.connectParticles();
        }

        requestAnimationFrame(() => this.animate());
    }

    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connectionDistance) {
                    const opacity = 1 - (distance / this.config.connectionDistance);
                    this.ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.2})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

class Particle {
    constructor(system) {
        this.system = system;
        this.reset();
        // Random initial position
        this.x = Math.random() * system.canvas.width;
        this.y = Math.random() * system.canvas.height;
    }

    reset() {
        this.size = Math.random() * (this.system.config.maxSize - this.system.config.minSize) + this.system.config.minSize;
        this.color = this.system.config.particleColors[Math.floor(Math.random() * this.system.config.particleColors.length)];
        this.speedX = (Math.random() - 0.5) * this.system.config.speed;
        this.speedY = (Math.random() - 0.5) * this.system.config.speed;
        this.opacity = Math.random() * 0.5 + 0.3;
    }

    update() {
        // Mouse interaction
        if (this.system.config.enableMouseInteraction && this.system.mouse.x !== null) {
            const dx = this.system.mouse.x - this.x;
            const dy = this.system.mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.system.mouse.radius) {
                const force = (this.system.mouse.radius - distance) / this.system.mouse.radius;
                const angle = Math.atan2(dy, dx);
                this.x -= Math.cos(angle) * force * 3;
                this.y -= Math.sin(angle) * force * 3;
            }
        }

        // Move particle
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x < 0 || this.x > this.system.canvas.width) {
            this.speedX *= -1;
        }
        if (this.y < 0 || this.y > this.system.canvas.height) {
            this.speedY *= -1;
        }

        // Keep within bounds
        this.x = Math.max(0, Math.min(this.system.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.system.canvas.height, this.y));
    }

    draw() {
        this.system.ctx.fillStyle = this.color;
        this.system.ctx.globalAlpha = this.opacity;
        this.system.ctx.beginPath();
        this.system.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.system.ctx.fill();
        this.system.ctx.globalAlpha = 1;
    }
}

// Auto-initialize if canvas exists
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        window.particleSystem = new ParticleSystem('particleCanvas');
    }
});
