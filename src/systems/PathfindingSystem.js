import { useGame } from '../core/Game';

export class PathfindingSystem {
  update(dt) {
    const state = useGame.getState();
    let count = 0;

    state.entities.forEach(e => {
      if (count >= 10 || e.type !== 'enemy') return;

      const m = e.get('Movement');
      if (!m || (m.path && m.path.length > 0)) return;

      count++;
      m.path = this.astar({ x: Math.floor(e.x), y: Math.floor(e.y) }, m.target);
    });
  }

  astar(start, goal) {
    const state = useGame.getState();
    const grid = state.grid;

    const open = [{ ...start, f: 0, g: 0 }];
    const closed = new Set();
    const cameFrom = {};

    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      const key = `${cur.x},${cur.y}`;

      const distToGoal = Math.hypot(cur.x - goal.x, cur.y - goal.y);
      if (distToGoal <= 1.5) {
        const path = [];
        let current = cur;
        let currentKey = key;

        while (currentKey) {
          path.unshift({ x: current.x, y: current.y });
          current = cameFrom[currentKey];
          currentKey = current ? `${current.x},${current.y}` : null;
        }

        return path;
      }

      closed.add(key);

      const directions = [
        { x: 0, y: 1, cost: 1 },
        { x: 1, y: 0, cost: 1 },
        { x: 0, y: -1, cost: 1 },
        { x: -1, y: 0, cost: 1 },
        { x: 1, y: 1, cost: 1.414 },
        { x: 1, y: -1, cost: 1.414 },
        { x: -1, y: 1, cost: 1.414 },
        { x: -1, y: -1, cost: 1.414 }
      ];

      directions.forEach(d => {
        const n = { x: cur.x + d.x, y: cur.y + d.y };
        const nk = `${n.x},${n.y}`;

        if (closed.has(nk) || n.x < 0 || n.x >= 50 || n.y < 0 || n.y >= 50) return;

        const cellOccupant = grid[n.y][n.x];
        if (cellOccupant && state.entities.get(cellOccupant)?.type === 'building') return;

        const g = cur.g + d.cost;
        const h = Math.hypot(n.x - goal.x, n.y - goal.y);
        n.g = g;
        n.f = g + h;

        if (!open.find(o => o.x === n.x && o.y === n.y)) {
          cameFrom[nk] = cur;
          open.push(n);
        }
      });
    }

    return null;
  }
}
