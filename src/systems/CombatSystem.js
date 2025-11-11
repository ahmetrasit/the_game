import { useGame } from '../core/Game';

export class CombatSystem {
  update(dt) {
    const state = useGame.getState();
    const entitiesToRemove = [];

    state.entities.forEach(entity => {
      const combat = entity.get('Combat');
      if (!combat) return;

      combat.timer = (combat.timer || 0) + dt;

      if (combat.timer >= 1 / combat.fireRate) {
        const target = this.findTarget(entity, combat.range);
        if (target) {
          const targetHealth = target.get('Health');
          if (targetHealth) {
            targetHealth.current -= combat.damage;
            combat.timer = 0;

            if (targetHealth.current <= 0) {
              if (target.type === 'enemy') {
                state.addResource('iron', 5);
                state.addResource('copper', 2);
              }
              entitiesToRemove.push(target.id);
            }
          }
        }
      }
    });

    entitiesToRemove.forEach(id => state.remove(id));
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
