import { useGame } from '../core/Game';

export class ConveyorSystem {
  update(dt) {
    const state = useGame.getState();

    state.entities.forEach(e => {
      const c = e.get('Conveyor');
      if (!c) return;

      const power = e.get('Power');
      if (power && !power.connected) return;

      c.items.forEach(item => {
        item.pos += c.speed * dt;
        if (item.pos >= 1) {
          const next = this.getNext(e, c);
          if (next) {
            const nextConv = next.get('Conveyor');
            if (nextConv) {
              nextConv.items.push({ ...item, pos: 0 });
            } else if (next.type === 'building' && next.id.startsWith('storage')) {
              state.addResource(item.type, item.amount || 1);
            } else if (next.type === 'building') {
              // Any other building acts as sink - items go to resources
              state.addResource(item.type, item.amount || 1);
            }
          }
        }
      });

      c.items = c.items.filter(i => i.pos < 1);
    });
  }

  getNext(e, c) {
    const grid = useGame.getState().grid;
    const entities = useGame.getState().entities;
    const dir = c.dir;

    const nx = Math.floor(e.x) + dir.x;
    const ny = Math.floor(e.y) + dir.y;

    if (nx < 0 || nx >= 50 || ny < 0 || ny >= 50) return null;

    const cellId = grid[ny]?.[nx];
    if (!cellId) return null;

    return entities.get(cellId);
  }
}
