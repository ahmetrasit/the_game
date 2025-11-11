import { useGame } from '../core/Game';

class Particle {
  constructor(x, y, vx, vy, color, size, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.age = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;
    return this.age < this.lifetime;
  }

  getAlpha() {
    return 1 - (this.age / this.lifetime);
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    // Update all particles and remove dead ones
    this.particles = this.particles.filter(p => p.update(dt));
  }

  // Explosion effect
  createExplosion(x, y, color = '#ff6600', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 0.1 + Math.random() * 0.2;
      const lifetime = 0.3 + Math.random() * 0.3;
      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  // Muzzle flash effect
  createMuzzleFlash(x, y, targetX, targetY) {
    const angle = Math.atan2(targetY - y, targetX - x);
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 2;
      const vx = Math.cos(angle + spread) * speed;
      const vy = Math.sin(angle + spread) * speed;
      const size = 0.15 + Math.random() * 0.1;
      const lifetime = 0.1 + Math.random() * 0.1;
      const color = Math.random() > 0.5 ? '#ffff00' : '#ffaa00';
      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  // Impact effect
  createImpact(x, y, color = '#ffffff') {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const speed = 1 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 0.08 + Math.random() * 0.12;
      const lifetime = 0.2 + Math.random() * 0.2;
      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  // Smoke trail for projectiles
  createSmoke(x, y) {
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    const size = 0.05 + Math.random() * 0.1;
    const lifetime = 0.3 + Math.random() * 0.2;
    const color = '#888888';
    this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
  }

  render(ctx, tileSize, cameraX, cameraY) {
    this.particles.forEach(p => {
      const screenX = (p.x - cameraX) * tileSize;
      const screenY = (p.y - cameraY) * tileSize;

      ctx.save();
      ctx.globalAlpha = p.getAlpha();
      ctx.fillStyle = p.color;
      ctx.shadowBlur = tileSize * p.size;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, tileSize * p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
