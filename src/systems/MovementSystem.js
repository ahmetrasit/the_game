import { useGame } from '../core/Game';

export class MovementSystem {
  countNearbyEnemies(x, y, excludeId, entities, radius = 0.6) {
    let count = 0;
    entities.forEach(other => {
      if (other.id === excludeId || other.type !== 'enemy') return;
      const dx = other.x - x;
      const dy = other.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) count++;
    });
    return count;
  }

  update(dt) {
    const state = useGame.getState();
    const entitiesToUpdate = [];

    state.entities.forEach(e => {
      const m = e.get('Movement');
      if (!m?.path?.length) return;

      const next = m.path[0];
      let dx = next.x - e.x;
      let dy = next.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (!m.randomOffset) {
        m.randomOffset = { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.3 };
      }

      if (dist < 0.15) {
        const occupant = state.grid[next.y]?.[next.x];
        if (occupant && occupant !== e.id) {
          const occupantEntity = state.entities.get(occupant);
          if (occupantEntity?.type === 'building') {
            return;
          }
        }

        const nearbyCount = this.countNearbyEnemies(next.x, next.y, e.id, state.entities);
        if (nearbyCount >= 5) {
          return;
        }

        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);
        e.x = next.x;
        e.y = next.y;
        m.path.shift();
        m.randomOffset = null;

        entitiesToUpdate.push({ entity: e, oldX, oldY });
      } else {
        dx += m.randomOffset.x;
        dy += m.randomOffset.y;
        const randomDist = Math.hypot(dx, dy);

        const moveX = (dx / randomDist) * m.speed * dt;
        const moveY = (dy / randomDist) * m.speed * dt;
        const newPosX = e.x + moveX;
        const newPosY = e.y + moveY;

        const occupant = state.grid[Math.floor(newPosY)]?.[Math.floor(newPosX)];
        if (occupant && occupant !== e.id) {
          const occupantEntity = state.entities.get(occupant);
          if (occupantEntity?.type === 'building') {
            return;
          }
        }

        const nearbyCount = this.countNearbyEnemies(newPosX, newPosY, e.id, state.entities);
        if (nearbyCount >= 5) {
          return;
        }

        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);

        e.x = newPosX;
        e.y = newPosY;

        const finalX = Math.floor(e.x);
        const finalY = Math.floor(e.y);

        if (oldX !== finalX || oldY !== finalY) {
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
