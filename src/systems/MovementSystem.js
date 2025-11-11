import { useGame } from '../core/Game';

export class MovementSystem {
  update(dt) {
    const state = useGame.getState();
    const entitiesToUpdate = [];
    const claimedTiles = new Map();

    state.entities.forEach(e => {
      if (e.type !== 'enemy') return;
      const cx = Math.floor(e.x);
      const cy = Math.floor(e.y);
      const tiles = [
        `${cx},${cy}`,
        `${cx + 1},${cy}`,
        `${cx},${cy + 1}`,
        `${cx + 1},${cy + 1}`
      ];

      const fx = e.x - cx;
      const fy = e.y - cy;

      if (fx < 0.3 && fy < 0.3) {
        claimedTiles.set(`${cx},${cy}`, e.id);
      } else if (fx > 0.7 && fy < 0.3) {
        claimedTiles.set(`${cx + 1},${cy}`, e.id);
      } else if (fx < 0.3 && fy > 0.7) {
        claimedTiles.set(`${cx},${cy + 1}`, e.id);
      } else if (fx > 0.7 && fy > 0.7) {
        claimedTiles.set(`${cx + 1},${cy + 1}`, e.id);
      } else {
        claimedTiles.set(`${cx},${cy}`, e.id);
      }
    });

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
        const tileKey = `${next.x},${next.y}`;
        const occupant = state.grid[next.y][next.x];
        const claimedBy = claimedTiles.get(tileKey);

        if (occupant && occupant !== e.id) {
          const occupantEntity = state.entities.get(occupant);
          if (occupantEntity?.type === 'enemy') {
            return;
          }
        }

        if (claimedBy && claimedBy !== e.id) {
          const claimant = state.entities.get(claimedBy);
          if (claimant?.type === 'enemy') {
            return;
          }
        }

        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);
        e.x = next.x;
        e.y = next.y;
        m.path.shift();
        m.randomOffset = null;

        claimedTiles.set(tileKey, e.id);
        entitiesToUpdate.push({ entity: e, oldX, oldY });
      } else {
        dx += m.randomOffset.x;
        dy += m.randomOffset.y;
        const randomDist = Math.hypot(dx, dy);
        const oldX = Math.floor(e.x);
        const oldY = Math.floor(e.y);
        const newX = Math.floor(e.x + (dx / randomDist) * m.speed * dt);
        const newY = Math.floor(e.y + (dy / randomDist) * m.speed * dt);

        if (newX !== oldX || newY !== oldY) {
          const tileKey = `${newX},${newY}`;
          const occupant = state.grid[newY][newX];
          const claimedBy = claimedTiles.get(tileKey);

          if (occupant && occupant !== e.id) {
            const occupantEntity = state.entities.get(occupant);
            if (occupantEntity?.type === 'enemy') {
              return;
            }
          }

          if (claimedBy && claimedBy !== e.id) {
            const claimant = state.entities.get(claimedBy);
            if (claimant?.type === 'enemy') {
              return;
            }
          }
        }

        e.x += (dx / randomDist) * m.speed * dt;
        e.y += (dy / randomDist) * m.speed * dt;

        const finalX = Math.floor(e.x);
        const finalY = Math.floor(e.y);

        if (oldX !== finalX || oldY !== finalY) {
          const finalKey = `${finalX},${finalY}`;
          claimedTiles.set(finalKey, e.id);
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
