import { useGame } from '../core/Game';
import { Entity } from '../core/Entity';

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
                // Spawn resource drops on the ground
                const dropX = target.x;
                const dropY = target.y;

                // Always drop iron
                const ironDrop = new Entity(`drop_iron_${Date.now()}`, 'resourceDrop');
                ironDrop.x = dropX;
                ironDrop.y = dropY;
                ironDrop.add('ResourceDrop', { resourceType: 'iron', amount: 5 });
                state.spawn(ironDrop);

                // Always drop copper
                const copperDrop = new Entity(`drop_copper_${Date.now()}`, 'resourceDrop');
                copperDrop.x = dropX + 0.3; // Slight offset
                copperDrop.y = dropY;
                copperDrop.add('ResourceDrop', { resourceType: 'copper', amount: 2 });
                state.spawn(copperDrop);

                // 10% chance to drop gears
                if (Math.random() < 0.1) {
                  const gearDrop = new Entity(`drop_gears_${Date.now()}`, 'resourceDrop');
                  gearDrop.x = dropX;
                  gearDrop.y = dropY + 0.3;
                  gearDrop.add('ResourceDrop', { resourceType: 'gears', amount: 1 });
                  state.spawn(gearDrop);
                }

                // 5% chance to drop circuits
                if (Math.random() < 0.05) {
                  const circuitDrop = new Entity(`drop_circuits_${Date.now()}`, 'resourceDrop');
                  circuitDrop.x = dropX + 0.3;
                  circuitDrop.y = dropY + 0.3;
                  circuitDrop.add('ResourceDrop', { resourceType: 'circuits', amount: 1 });
                  state.spawn(circuitDrop);
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
