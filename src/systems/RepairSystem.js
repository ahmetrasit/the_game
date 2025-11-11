import { useGame } from '../core/Game';

export class RepairSystem {
  update(dt) {
    const state = useGame.getState();

    state.entities.forEach(entity => {
      // Only repair buildings (not enemies, projectiles, conveyors)
      if (entity.type !== 'building') return;

      // Don't auto-repair player turret or walls
      if (entity.id === 't1' || entity.id.startsWith('wall')) return;

      const health = entity.get('Health');
      if (!health) return;

      // Only repair if damaged
      if (health.current < health.max) {
        // Repair 2 HP per second
        health.current = Math.min(health.max, health.current + 2 * dt);
      }
    });
  }
}
