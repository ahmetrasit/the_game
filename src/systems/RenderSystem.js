import { useGame } from '../core/Game';

export class RenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = canvas.width / 50;
    this.hoverTile = null;
  }

  setHoverTile(x, y) {
    this.hoverTile = { x, y };
  }

  update() {
    const state = useGame.getState();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    state.entities.forEach(entity => {
      this.drawEntity(entity);
      this.drawHealthBar(entity);
    });

    if (state.selectedBuilding && this.hoverTile) {
      this.drawPlacementPreview(this.hoverTile.x, this.hoverTile.y, state.selectedBuilding, state.buildingRotation, state.grid);
    }
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
      const radius = this.tileSize / 5;
      this.ctx.fillStyle = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = radius * 2;
      this.ctx.shadowColor = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    } else if (entity.type === 'enemy') {
      const padding = this.tileSize / 16;
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
    } else if (entity.type === 'building') {
      const padding = this.tileSize / 16;
      const power = entity.get('Power');
      const isPowered = !power || power.connected;

      if (entity.id.startsWith('wall')) {
        this.ctx.fillStyle = '#666666';
      } else if (entity.id.startsWith('ironRefinery')) {
        this.ctx.fillStyle = isPowered ? '#ff8800' : '#662200';
      } else if (entity.id.startsWith('copperRefinery')) {
        this.ctx.fillStyle = isPowered ? '#ff6600' : '#884400';
      } else if (entity.id.startsWith('assembler') || entity.id.startsWith('advancedAssembler')) {
        this.ctx.fillStyle = isPowered ? '#00aaff' : '#004466';
      } else if (entity.id.startsWith('generator')) {
        this.ctx.fillStyle = '#ffff00';
      } else if (entity.id.startsWith('storage')) {
        this.ctx.fillStyle = '#888888';
      } else {
        this.ctx.fillStyle = '#4444ff';
      }

      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);

      if (power && !isPowered) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
      }
    } else if (entity.type === 'conveyor') {
      const padding = this.tileSize / 16;
      const power = entity.get('Power');
      const isPowered = !power || power.connected;

      this.ctx.fillStyle = isPowered ? '#666' : '#333';
      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);

      const conv = entity.get('Conveyor');
      if (conv?.dir) {
        this.ctx.strokeStyle = isPowered ? '#aaa' : '#555';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const cx = x + this.tileSize / 2;
        const cy = y + this.tileSize / 2;
        const arrowLen = this.tileSize / 3;
        this.ctx.moveTo(cx - conv.dir.x * arrowLen, cy - conv.dir.y * arrowLen);
        this.ctx.lineTo(cx + conv.dir.x * arrowLen, cy + conv.dir.y * arrowLen);
        this.ctx.stroke();
      }

      if (conv?.items) {
        conv.items.forEach(item => {
          const itemX = x + item.pos * this.tileSize * (conv.dir?.x || 1);
          const itemY = y + item.pos * this.tileSize * (conv.dir?.y || 0);
          const itemSize = this.tileSize / 4;

          this.ctx.fillStyle = item.type === 'iron' ? '#888' :
                               item.type === 'copper' ? '#ff8844' :
                               item.type === 'ironPlates' ? '#aaa' :
                               item.type === 'copperPlates' ? '#ffaa66' :
                               item.type === 'gears' ? '#cccccc' :
                               item.type === 'circuits' ? '#00ff00' :
                               item.type === 'advancedCircuits' ? '#00ffff' : '#fff';

          this.ctx.fillRect(itemX + this.tileSize / 2 - itemSize / 2,
                           itemY + this.tileSize / 2 - itemSize / 2,
                           itemSize, itemSize);
        });
      }
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

  drawPlacementPreview(gridX, gridY, buildingType, rotation, grid) {
    const x = gridX * this.tileSize;
    const y = gridY * this.tileSize;
    const padding = this.tileSize / 16;

    const isOccupied = grid[gridY]?.[gridX] !== null;

    this.ctx.globalAlpha = 0.5;

    if (buildingType === 'wall') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#666666';
    } else if (buildingType === 'turret') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#4444ff';
    } else if (buildingType === 'ironRefinery') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#ff8800';
    } else if (buildingType === 'copperRefinery') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#ff6600';
    } else if (buildingType === 'assembler' || buildingType === 'advancedAssembler') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#00aaff';
    } else if (buildingType === 'generator') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#ffff00';
    } else if (buildingType === 'storage') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#888888';
    } else if (buildingType === 'conveyor') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#666';
    }

    this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);

    if (buildingType === 'conveyor') {
      const dir = this.getDirectionFromRotation(rotation);
      this.ctx.strokeStyle = isOccupied ? '#ff0000' : '#aaa';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      const cx = x + this.tileSize / 2;
      const cy = y + this.tileSize / 2;
      const arrowLen = this.tileSize / 3;
      this.ctx.moveTo(cx - dir.x * arrowLen, cy - dir.y * arrowLen);
      this.ctx.lineTo(cx + dir.x * arrowLen, cy + dir.y * arrowLen);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  getDirectionFromRotation(rotation) {
    switch (rotation) {
      case 0: return { x: 1, y: 0 };
      case 90: return { x: 0, y: 1 };
      case 180: return { x: -1, y: 0 };
      case 270: return { x: 0, y: -1 };
      default: return { x: 1, y: 0 };
    }
  }
}
