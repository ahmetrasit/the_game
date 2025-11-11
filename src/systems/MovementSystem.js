import { useGame } from '../core/Game';

export class MovementSystem {
  calculateRepulsion(entity, entities, radius = 0.8) {
    let repulsionX = 0;
    let repulsionY = 0;
    let nearbyCount = 0;

    entities.forEach(other => {
      if (other.id === entity.id || other.type !== 'enemy') return;

      const dx = entity.x - other.x;
      const dy = entity.y - other.y;
      const dist = Math.hypot(dx, dy);

      if (dist < radius && dist > 0.01) {
        nearbyCount++;
        const force = (radius - dist) / radius;
        repulsionX += (dx / dist) * force;
        repulsionY += (dy / dist) * force;
      }
    });

    if (nearbyCount > 3) {
      const strength = Math.min(nearbyCount / 5, 2) * 5;
      return { x: repulsionX * strength, y: repulsionY * strength };
    }

    return { x: 0, y: 0 };
  }

  update(dt) {
    const state = useGame.getState();
    const entitiesToUpdate = [];

    state.entities.forEach(e => {
      const m = e.get('Movement');
      if (!m?.path?.length) return;

      if (!m.lastPosition) {
        m.lastPosition = { x: e.x, y: e.y, time: 0 };
      }

      m.lastPosition.time += dt;
      if (m.lastPosition.time > 1) {
        const moveDist = Math.hypot(e.x - m.lastPosition.x, e.y - m.lastPosition.y);
        if (moveDist < 0.5) {
          m.path = null;
          m.lastPosition.time = 0;
          return;
        }
        m.lastPosition = { x: e.x, y: e.y, time: 0 };
      }

      const next = m.path[0];
      let dx = next.x - e.x;
      let dy = next.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (!m.randomOffset) {
        m.randomOffset = { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.3 };
      }

      const repulsion = this.calculateRepulsion(e, state.entities);

      if (dist < 0.15) {
        const occupant = state.grid[next.y]?.[next.x];
        if (occupant && occupant !== e.id) {
          const occupantEntity = state.entities.get(occupant);
          if (occupantEntity?.type === 'building') {
            return;
          }
        }

        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);
        e.x = next.x + repulsion.x * 0.5;
        e.y = next.y + repulsion.y * 0.5;

        e.x = Math.max(0, Math.min(49.9, e.x));
        e.y = Math.max(0, Math.min(49.9, e.y));

        m.path.shift();
        m.randomOffset = null;

        entitiesToUpdate.push({ entity: e, oldX, oldY });
      } else {
        dx += m.randomOffset.x + repulsion.x;
        dy += m.randomOffset.y + repulsion.y;
        const randomDist = Math.hypot(dx, dy);

        if (randomDist < 0.01) {
          const randomAngle = Math.random() * Math.PI * 2;
          dx = Math.cos(randomAngle) * 0.5;
          dy = Math.sin(randomAngle) * 0.5;
        }

        const moveX = (dx / randomDist) * m.speed * dt;
        const moveY = (dy / randomDist) * m.speed * dt;
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
