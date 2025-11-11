import { create } from 'zustand';

export const useGame = create((set, get) => ({
  entities: new Map(),
  resources: { iron: 100, copper: 50 },
  grid: Array(50).fill().map(() => Array(50).fill(null)),
  isPaused: false,
  gameTime: 0,
  metrics: { curiosity: 0, perseverance: 0, events: [] },

  spawn: (entity) => set((state) => {
    const newEntities = new Map(state.entities);
    newEntities.set(entity.id, entity);
    const newGrid = state.grid.map(row => [...row]);
    if (entity.x >= 0 && entity.x < 50 && entity.y >= 0 && entity.y < 50) {
      newGrid[entity.y][entity.x] = entity.id;
    }
    return { entities: newEntities, grid: newGrid };
  }),

  remove: (id) => set((state) => {
    const entity = state.entities.get(id);
    if (!entity) return state;

    const newEntities = new Map(state.entities);
    newEntities.delete(id);

    const newGrid = state.grid.map(row => [...row]);
    if (entity.x >= 0 && entity.x < 50 && entity.y >= 0 && entity.y < 50) {
      newGrid[entity.y][entity.x] = null;
    }

    return { entities: newEntities, grid: newGrid };
  }),

  addResource: (type, amount) => set((state) => ({
    resources: { ...state.resources, [type]: (state.resources[type] || 0) + amount }
  })),

  updateGameTime: (delta) => set((state) => ({
    gameTime: state.gameTime + delta
  })),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused }))
}));
