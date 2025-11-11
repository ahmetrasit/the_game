import { useGame } from '../core/Game';

export class MovementSystem {
  update(dt) {
    const state = useGame.getState();
    const entitiesToUpdate = [];

    state.entities.forEach(e => {
      const m = e.get('Movement');
      if (!m?.path?.length) return;

      const next = m.path[0];
      const dx = next.x - e.x;
      const dy = next.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.1) {
        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);
        e.x = next.x;
        e.y = next.y;
        m.path.shift();

        entitiesToUpdate.push({ entity: e, oldX, oldY });
      } else {
        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);
        e.x += (dx / dist) * m.speed * dt;
        e.y += (dy / dist) * m.speed * dt;

        const newX = Math.floor(e.x);
        const newY = Math.floor(e.y);

        if (oldX !== newX || oldY !== newY) {
          entitiesToUpdate.push({ entity: e, oldX, oldY });
        }
      }
    });

    if (entitiesToUpdate.length > 0) {
      const newGrid = state.grid.map(row => [...row]);

      entitiesToUpdate.forEach(({ entity, oldX, oldY }) => {
        if (oldX >= 0 && oldX < 50 && oldY >= 0 && oldY < 50) {
          if (newGrid[oldY][oldX] === entity.id) {
            newGrid[oldY][oldX] = null;
          }
        }

        const newX = Math.floor(entity.x);
        const newY = Math.floor(entity.y);
        if (newX >= 0 && newX < 50 && newY >= 0 && newY < 50) {
          newGrid[newY][newX] = entity.id;
        }
      });

      useGame.setState({ grid: newGrid });
    }
  }
}
