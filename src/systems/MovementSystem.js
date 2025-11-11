import { useGame } from '../core/Game';

export class MovementSystem {
  calculateSeparation(entity, entities) {
    let separationX = 0;
    let separationY = 0;
    let nearbyCount = 0;

    const ex = Math.floor(entity.x);
    const ey = Math.floor(entity.y);

    entities.forEach(other => {
      if (other.id === entity.id || other.type !== 'enemy') return;

      const ox = Math.floor(other.x);
      const oy = Math.floor(other.y);
      const tileDist = Math.abs(ex - ox) + Math.abs(ey - oy);
      if (tileDist > 2) return;

      const dx = entity.x - other.x;
      const dy = entity.y - other.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 1.0 && dist > 0.01) {
        nearbyCount++;
        const force = (1.0 - dist) / 1.0;
        separationX += (dx / dist) * force * 1.5;
        separationY += (dy / dist) * force * 1.5;
      }
    });

    return { x: separationX, y: separationY };
  }

  update(dt) {
    const state = useGame.getState();
    const entitiesToUpdate = [];

    state.entities.forEach(e => {
      const m = e.get('Movement');
      if (!m) return;
      if (!m.path || m.path.length === 0) return;

      const next = m.path[0];
      const dx = next.x - e.x;
      const dy = next.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.1) {
        const occupant = state.grid[next.y]?.[next.x];
        if (occupant && occupant !== e.id) {
          const occupantEntity = state.entities.get(occupant);
          if (occupantEntity?.type === 'building') {
            m.path.shift();
            if (!m.path.length) return;
          }
        }

        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);
        e.x = next.x;
        e.y = next.y;
        m.path.shift();

        entitiesToUpdate.push({ entity: e, oldX, oldY });
      } else {
        const separation = this.calculateSeparation(e, state.entities);

        const moveX = (dx / dist) * m.speed * dt + separation.x * dt;
        const moveY = (dy / dist) * m.speed * dt + separation.y * dt;

        const newPosX = e.x + moveX;
        const newPosY = e.y + moveY;

        if (newPosX < 0 || newPosX >= 50 || newPosY < 0 || newPosY >= 50) return;

        const occupant = state.grid[Math.floor(newPosY)]?.[Math.floor(newPosX)];
        if (occupant && occupant !== e.id) {
          const occupantEntity = state.entities.get(occupant);
          if (occupantEntity?.type === 'building') {
            return;
          }
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
