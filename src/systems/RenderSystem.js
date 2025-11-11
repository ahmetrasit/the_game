import { useGame } from '../core/Game';

export class RenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = canvas.width / 50; // Dynamic tile size based on canvas width
  }

  update() {
    const state = useGame.getState();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    state.entities.forEach(entity => {
      this.drawEntity(entity);
      this.drawHealthBar(entity);
    });
  }

  drawGrid() {
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= 50; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.tileSize, 0);
      this.ctx.lineTo(x * this.tileSize, 50 * this.tileSize);
      this.ctx.stroke();
    }

    for (let y = 0; y <= 50; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.tileSize);
      this.ctx.lineTo(50 * this.tileSize, y * this.tileSize);
      this.ctx.stroke();
    }
  }

  drawEntity(entity) {
    const x = entity.x * this.tileSize;
    const y = entity.y * this.tileSize;

    if (entity.type === 'projectile') {
      // Draw projectile as a bright yellow circle
      const radius = this.tileSize / 5; // Scale with tile size
      this.ctx.fillStyle = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Add glow effect
      this.ctx.shadowBlur = radius * 2;
      this.ctx.shadowColor = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    } else if (entity.type === 'enemy') {
      const padding = this.tileSize / 16; // Scale padding with tile size
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
    } else if (entity.type === 'building') {
      const padding = this.tileSize / 16;
      this.ctx.fillStyle = '#4444ff';
      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
    } else {
      const padding = this.tileSize / 16;
      this.ctx.fillStyle = '#888';
      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
    }
  }

  drawHealthBar(entity) {
    const health = entity.get('Health');
    if (!health) return;

    const ratio = health.current / health.max;
    if (ratio >= 1) return;

    const x = entity.x * this.tileSize;
    const y = entity.y * this.tileSize;
    const padding = this.tileSize / 16;
    const barWidth = this.tileSize - padding * 2;
    const barHeight = this.tileSize / 8;
    const offset = this.tileSize / 5;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + padding, y - offset, barWidth, barHeight);

    this.ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#fbbf24' : '#ef4444';
    this.ctx.fillRect(x + padding, y - offset, barWidth * ratio, barHeight);
  }
}
