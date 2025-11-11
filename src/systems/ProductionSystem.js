import { useGame } from '../core/Game';
import recipes from '../data/recipes.json';

export class ProductionSystem {
  update(dt) {
    const state = useGame.getState();

    state.entities.forEach(e => {
      const p = e.get('Production');
      if (!p) return;

      const power = e.get('Power');
      if (power && !power.connected) return;

      p.progress = (p.progress || 0) + dt;
      if (p.progress >= p.time) {
        const recipe = recipes[p.recipe];
        if (!recipe) {
          p.progress = 0;
          return;
        }

        if (this.hasInputs(recipe.inputs)) {
          recipe.inputs.forEach(i => state.addResource(i.type, -i.amount));

          recipe.outputs.forEach(o => {
            const conv = this.findConveyor(e);
            if (conv) {
              conv.get('Conveyor').items.push({ type: o.type, amount: o.amount, pos: 0 });
            } else {
              state.addResource(o.type, o.amount);
            }
          });
        }
        p.progress = 0;
      }
    });
  }

  hasInputs(inputs) {
    const r = useGame.getState().resources;
    return inputs.every(i => (r[i.type] || 0) >= i.amount);
  }

  findConveyor(e) {
    const grid = useGame.getState().grid;
    const entities = useGame.getState().entities;

    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (const d of dirs) {
      const nx = Math.floor(e.x) + d[0];
      const ny = Math.floor(e.y) + d[1];

      if (nx < 0 || nx >= 50 || ny < 0 || ny >= 50) continue;

      const cellId = grid[ny]?.[nx];
      if (!cellId) continue;

      const cellEntity = entities.get(cellId);
      if (cellEntity?.type === 'conveyor') {
        return cellEntity;
      }
    }
    return null;
  }
}
