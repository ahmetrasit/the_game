import { useGame } from '../core/Game';
import { Entity } from '../core/Entity';

export class CombatSystem {
  constructor() {
    this.projectileId = 0;
  }

  update(dt) {
    const state = useGame.getState();

    state.entities.forEach(entity => {
      const combat = entity.get('Combat');
      if (!combat) return;

      combat.timer = (combat.timer || 0) + dt;

      if (combat.timer >= 1 / combat.fireRate) {
        const target = this.findTarget(entity, combat.range);
        if (target) {
          // Spawn projectile
          this.spawnProjectile(entity, target, combat.damage);
          combat.timer = 0;
        }
      }
    });
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

  findTarget(entity, range) {
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
}
