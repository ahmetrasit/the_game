import { useGame } from '../core/Game';

export class PathfindingSystem {
  constructor() {
    this.recalcTimers = new Map();
  }

  update(dt) {
    const state = useGame.getState();
    let count = 0;

    state.entities.forEach(e => {
      if (e.type !== 'enemy') return;

      const m = e.get('Movement');
      if (!m) return;

      // Initialize recalc timer if needed
      if (!this.recalcTimers.has(e.id)) {
        this.recalcTimers.set(e.id, 0);
      }

      // Update recalc timer
      const timer = this.recalcTimers.get(e.id) + dt;
      this.recalcTimers.set(e.id, timer);

      // Recalculate path if: no path, reached end, or timer expired (every 2 seconds to update target)
      const shouldRecalc = !m.path || m.path.length === 0 || timer >= 2.0;

      if (!shouldRecalc || count >= 10) return;

      count++;
      this.recalcTimers.set(e.id, 0); // Reset timer

      // Find nearest building to attack
      let nearestBuilding = null;
      let nearestDist = Infinity;

      state.entities.forEach(b => {
        if (b.type === 'building') {
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestBuilding = b;
          }
        }
      });

      // If found a building, path to it; otherwise use original target
      const target = nearestBuilding ? { x: Math.floor(nearestBuilding.x), y: Math.floor(nearestBuilding.y) } : m.target;
      m.path = this.astar({ x: Math.floor(e.x), y: Math.floor(e.y) }, target);
    });

    // Clean up timers for removed enemies
    const enemyIds = new Set();
    state.entities.forEach(e => {
      if (e.type === 'enemy') enemyIds.add(e.id);
    });

    this.recalcTimers.forEach((_, id) => {
      if (!enemyIds.has(id)) {
        this.recalcTimers.delete(id);
      }
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
