import { useGame } from '../core/Game';
import { Entity } from '../core/Entity';

export class CombatSystem {
  constructor() {
    this.projectileId = 0;
  }

  update(dt) {
    const state = useGame.getState();
    const entitiesToRemove = [];

    state.entities.forEach(entity => {
      const combat = entity.get('Combat');
      if (!combat) return;

      combat.timer = (combat.timer || 0) + dt;

      if (combat.timer >= 1 / combat.fireRate) {
        if (entity.type === 'building') {
          const playerControlled = entity.get('PlayerControlled');

          if (playerControlled) {
            // Player-controlled turret: fire in the direction it's facing
            const target = this.findTargetInDirection(entity, combat.range, playerControlled.angle);
            if (target) {
              this.spawnProjectile(entity, target, combat.damage);
              combat.timer = 0;
            }
          } else {
            // Auto-targeting turret
            const target = this.findEnemyTarget(entity, combat.range);
            if (target) {
              this.spawnProjectile(entity, target, combat.damage);
              combat.timer = 0;
            }
          }
        } else if (entity.type === 'enemy') {
          const target = this.findBuildingTarget(entity, 1.5);
          if (target) {
            const health = target.get('Health');
            if (health) {
              health.current -= combat.damage;
              if (health.current <= 0) {
                // Check if player turret was destroyed
                if (target.id === 't1') {
                  state.setGameOver();
                }
                entitiesToRemove.push(target.id);
              }
            }
            combat.timer = 0;
          }
        }
      }
    });

    entitiesToRemove.forEach(id => state.remove(id));
  }

  spawnProjectile(source, target, damage) {
    const state = useGame.getState();

    const projectile = new Entity(`proj_${this.projectileId++}`, 'projectile');
    projectile.x = source.x;
    projectile.y = source.y;

    // Calculate velocity toward target
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.hypot(dx, dy);
    const speed = 20; // tiles per second

    projectile.add('Projectile', {
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      targetId: target.id,
      damage: damage
    });

    state.spawn(projectile);
  }

  findEnemyTarget(entity, range) {
    const state = useGame.getState();
    let closest = null;
    let minDistance = Infinity;

    state.entities.forEach(other => {
      if (other.type !== 'enemy') return;

      const dx = entity.x - other.x;
      const dy = entity.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= range && distance < minDistance) {
        closest = other;
        minDistance = distance;
      }
    });

    return closest;
  }

  findBuildingTarget(entity, range) {
    const state = useGame.getState();
    let closest = null;
    let minDistance = Infinity;

    state.entities.forEach(other => {
      if (other.type !== 'building' && other.type !== 'conveyor') return;

      const dx = entity.x - other.x;
      const dy = entity.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= range && distance < minDistance) {
        closest = other;
        minDistance = distance;
      }
    });

    return closest;
  }

  findTargetInDirection(entity, range, angleDegrees) {
    const state = useGame.getState();
    let closest = null;
    let minDistance = Infinity;

    // Convert angle to radians
    const angleRad = (angleDegrees * Math.PI) / 180;
    const facingX = Math.cos(angleRad);
    const facingY = Math.sin(angleRad);

    // 30 degree cone (15 degrees on each side)
    const coneAngle = 15 * Math.PI / 180;

    state.entities.forEach(other => {
      if (other.type !== 'enemy') return;

      const dx = other.x - entity.x;
      const dy = other.y - entity.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > range || distance < 0.1) return;

      // Normalize direction to enemy
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Calculate angle between facing direction and enemy direction
      const dotProduct = facingX * dirX + facingY * dirY;
      const angleToEnemy = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

      // Check if enemy is within the cone
      if (angleToEnemy <= coneAngle && distance < minDistance) {
        closest = other;
        minDistance = distance;
      }
    });

    return closest;
  }
}
