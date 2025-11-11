import { useGame } from '../core/Game';

export class ProjectileSystem {
  update(dt) {
    const state = useGame.getState();
    const projectilesToRemove = [];
    const entitiesToRemove = [];

    state.entities.forEach(projectile => {
      if (projectile.type !== 'projectile') return;

      const proj = projectile.get('Projectile');
      if (!proj) return;

      // Move projectile
      projectile.x += proj.vx * dt;
      projectile.y += proj.vy * dt;

      // Check if hit target
      const target = state.entities.get(proj.targetId);
      if (target) {
        const dx = projectile.x - target.x;
        const dy = projectile.y - target.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.5) {
          // Hit the target
          const targetHealth = target.get('Health');
          if (targetHealth) {
            targetHealth.current -= proj.damage;

            if (targetHealth.current <= 0) {
              if (target.type === 'enemy') {
                // Always drop iron and copper
                state.addResource('iron', 5);
                state.addResource('copper', 2);

                // 10% chance to drop gears
                if (Math.random() < 0.1) {
                  state.addResource('gears', 1);
                }

                // 5% chance to drop circuits
                if (Math.random() < 0.05) {
                  state.addResource('circuits', 1);
                }
              }
              entitiesToRemove.push(target.id);
            }
          }
          projectilesToRemove.push(projectile.id);
        }
      } else {
        // Target is dead, remove projectile
        projectilesToRemove.push(projectile.id);
      }

      // Remove if out of bounds
      if (projectile.x < 0 || projectile.x > 50 || projectile.y < 0 || projectile.y > 50) {
        projectilesToRemove.push(projectile.id);
      }
    });

    projectilesToRemove.forEach(id => state.remove(id));
    entitiesToRemove.forEach(id => state.remove(id));
  }
}
