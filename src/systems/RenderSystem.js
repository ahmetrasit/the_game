import { useGame } from '../core/Game';

export class RenderSystem {
  constructor(canvas, particleSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = canvas.width / 50;
    this.hoverTile = null;
    this.time = 0; // For animations
    this.particleSystem = particleSystem;
  }

  setHoverTile(x, y) {
    this.hoverTile = { x, y };
  }

  update(dt) {
    this.time += dt || 0.016; // Track time for animations
    const state = useGame.getState();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    state.entities.forEach(entity => {
      this.drawEntity(entity);
      this.drawHealthBar(entity);
    });

    // Render particles
    if (this.particleSystem) {
      this.particleSystem.render(this.ctx, this.tileSize, 0, 0);
    }

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
    } else if (entity.type === 'drone') {
      // Draw drone as a small circle
      const radius = this.tileSize / 6;
      this.ctx.fillStyle = '#00ff88';
      this.ctx.beginPath();
      this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw drone outline
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Draw line to target if moving
      const droneComp = entity.get('Drone');
      if (droneComp && droneComp.targetId) {
        this.ctx.strokeStyle = '#00ff8844';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + this.tileSize / 2, y + this.tileSize / 2);
        this.ctx.lineTo(
          droneComp.targetX * this.tileSize + this.tileSize / 2,
          droneComp.targetY * this.tileSize + this.tileSize / 2
        );
        this.ctx.stroke();
      }
    } else if (entity.type === 'collectorCar') {
      // Draw collector car as a small square with direction indicator
      const size = this.tileSize / 3;
      const carComp = entity.get('CollectorCar');

      // Add shadow
      this.ctx.shadowBlur = 4;
      this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;

      this.ctx.fillStyle = '#ffaa00';
      this.ctx.fillRect(
        x + this.tileSize / 2 - size / 2,
        y + this.tileSize / 2 - size / 2,
        size,
        size
      );

      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;

      // Draw outline
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        x + this.tileSize / 2 - size / 2,
        y + this.tileSize / 2 - size / 2,
        size,
        size
      );

      // Draw direction indicator (triangle pointing in movement direction)
      if (carComp) {
        let targetX = null, targetY = null;
        if (carComp.state === 'collecting' && carComp.targetId) {
          const target = useGame.getState().entities.get(carComp.targetId);
          if (target) {
            targetX = target.x;
            targetY = target.y;
          }
        } else if (carComp.state === 'returning') {
          // Find nearest storage
          const state = useGame.getState();
          state.entities.forEach(e => {
            if (e.id.startsWith('storage')) {
              if (!targetX) {
                targetX = e.x;
                targetY = e.y;
              }
            }
          });
        }

        if (targetX !== null && targetY !== null) {
          const angle = Math.atan2(targetY - entity.y, targetX - entity.x);
          const cx = x + this.tileSize / 2;
          const cy = y + this.tileSize / 2;
          const arrowSize = size / 4;

          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.moveTo(
            cx + Math.cos(angle) * arrowSize,
            cy + Math.sin(angle) * arrowSize
          );
          this.ctx.lineTo(
            cx + Math.cos(angle + 2.5) * arrowSize * 0.6,
            cy + Math.sin(angle + 2.5) * arrowSize * 0.6
          );
          this.ctx.lineTo(
            cx + Math.cos(angle - 2.5) * arrowSize * 0.6,
            cy + Math.sin(angle - 2.5) * arrowSize * 0.6
          );
          this.ctx.closePath();
          this.ctx.fill();
        }

        // Draw indicator if carrying resources
        if (carComp.carrying) {
          this.ctx.fillStyle = '#00ff00';
          this.ctx.shadowBlur = 6;
          this.ctx.shadowColor = '#00ff00';
          this.ctx.beginPath();
          this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2 - size / 2 - 4, 4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }
    } else if (entity.type === 'resourceDrop') {
      // Draw resource drop as a small colored circle with pulsing animation
      const dropComp = entity.get('ResourceDrop');
      if (dropComp) {
        // Pulsing effect
        const pulse = Math.sin(this.time * 4) * 0.2 + 1; // 0.8 to 1.2
        const baseRadius = this.tileSize / 8;
        const radius = baseRadius * pulse;

        // Color based on resource type
        if (dropComp.resourceType === 'iron') {
          this.ctx.fillStyle = '#888888';
        } else if (dropComp.resourceType === 'copper') {
          this.ctx.fillStyle = '#ff8844';
        } else if (dropComp.resourceType === 'gears') {
          this.ctx.fillStyle = '#cccccc';
        } else if (dropComp.resourceType === 'circuits') {
          this.ctx.fillStyle = '#00ff00';
        } else {
          this.ctx.fillStyle = '#ffffff';
        }

        const centerX = x + this.tileSize / 2;
        const centerY = y + this.tileSize / 2;

        // Draw outer glow ring
        this.ctx.globalAlpha = 0.3 * pulse;
        this.ctx.shadowBlur = radius * 2;
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        // Draw main circle
        this.ctx.shadowBlur = radius;
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw bright center
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
      }
    } else if (entity.type === 'building') {
      const padding = this.tileSize / 16;
      const power = entity.get('Power');
      const isPowered = !power || power.connected;

      if (entity.id.startsWith('wall')) {
        this.ctx.fillStyle = '#666666';
      } else if (entity.id.startsWith('laserTurret')) {
        this.ctx.fillStyle = '#00ffff';
      } else if (entity.id.startsWith('cannon')) {
        this.ctx.fillStyle = '#8b4513';
      } else if (entity.id.startsWith('sniperTurret')) {
        this.ctx.fillStyle = '#9932cc';
      } else if (entity.id.startsWith('machineGun')) {
        this.ctx.fillStyle = '#ff6600';
      } else if (entity.id.startsWith('turret')) {
        this.ctx.fillStyle = '#4444ff';
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
      } else if (entity.id.startsWith('droneBay')) {
        this.ctx.fillStyle = '#00ff88';
      } else if (entity.id.startsWith('carGarage')) {
        this.ctx.fillStyle = '#ffaa00';
      } else {
        this.ctx.fillStyle = '#4444ff';
      }

      // Add shadow for depth
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
      this.ctx.shadowOffsetX = 3;
      this.ctx.shadowOffsetY = 3;

      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);

      // Reset shadow
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;

      // Add highlight to top for 3D effect
      const gradient = this.ctx.createLinearGradient(
        x + padding,
        y + padding,
        x + padding,
        y + this.tileSize - padding
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);

      // Power indicator ring
      if (power && !isPowered) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.strokeRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
        this.ctx.shadowBlur = 0;
      } else if (power && power.connected) {
        // Subtle green outline for powered buildings
        this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + padding, y + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
      }

      // Draw player-controlled turret facing indicator
      const playerControlled = entity.get('PlayerControlled');
      if (playerControlled) {
        const angleRad = (playerControlled.angle * Math.PI) / 180;
        const cx = x + this.tileSize / 2;
        const cy = y + this.tileSize / 2;
        const barrelLength = this.tileSize / 2;

        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(
          cx + Math.cos(angleRad) * barrelLength,
          cy + Math.sin(angleRad) * barrelLength
        );
        this.ctx.stroke();

        // Draw aiming cone (30 degree cone)
        const coneAngle = 15 * Math.PI / 180;
        this.ctx.strokeStyle = '#ffff0044';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(
          cx + Math.cos(angleRad - coneAngle) * barrelLength * 1.5,
          cy + Math.sin(angleRad - coneAngle) * barrelLength * 1.5
        );
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(
          cx + Math.cos(angleRad + coneAngle) * barrelLength * 1.5,
          cy + Math.sin(angleRad + coneAngle) * barrelLength * 1.5
        );
        this.ctx.stroke();
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
    } else if (buildingType === 'laserTurret') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#00ffff';
    } else if (buildingType === 'cannon') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#8b4513';
    } else if (buildingType === 'sniperTurret') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#9932cc';
    } else if (buildingType === 'machineGun') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#ff6600';
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
    } else if (buildingType === 'droneBay') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#00ff88';
    } else if (buildingType === 'carGarage') {
      this.ctx.fillStyle = isOccupied ? '#ff0000' : '#ffaa00';
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
