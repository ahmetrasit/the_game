import { create } from 'zustand';
import modifiersData from '../data/modifiers.json';

export const useGame = create((set, get) => ({
  entities: new Map(),
  resources: {
    iron: 500,
    copper: 300,
    ironPlates: 100,
    copperPlates: 50,
    gears: 20,
    circuits: 10,
    advancedCircuits: 5
  },
  grid: Array(50).fill().map(() => Array(50).fill(null)),
  isPaused: false,
  gameOver: false,
  gameTime: 0,
  metrics: { curiosity: 0, perseverance: 0, events: [] },
  selectedBuilding: null,
  buildingRotation: 0,
  nextEntityId: 0,

  // Upgrade modifiers
  rangeModifier: 1.0, // +5% per upgrade
  damageBonus: 0, // +10 per upgrade
  enemySpeedModifier: 1.0, // -15% per upgrade (0.85)

  // Deck building system
  gameStarted: false,
  selectedDeck: [],
  currentHand: [],
  activeModifier: null,
  deckShuffleTimer: 0,
  globalSpeedModifier: 1.0,
  enemySpeedBonus: 1.0,

  showUpgradeCards: false,

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
    const gridX = Math.floor(entity.x);
    const gridY = Math.floor(entity.y);
    if (gridX >= 0 && gridX < 50 && gridY >= 0 && gridY < 50) {
      if (newGrid[gridY][gridX] === id) {
        newGrid[gridY][gridX] = null;
      }
    }

    return { entities: newEntities, grid: newGrid };
  }),

  addResource: (type, amount) => set((state) => ({
    resources: { ...state.resources, [type]: (state.resources[type] || 0) + amount }
  })),

  updateGameTime: (delta) => set((state) => ({
    gameTime: state.gameTime + delta
  })),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setGameOver: () => set({ gameOver: true, isPaused: true }),

  selectBuilding: (type) => set({ selectedBuilding: type, buildingRotation: 0 }),

  rotateBuilding: () => set((state) => ({
    buildingRotation: (state.buildingRotation + 90) % 360
  })),

  getNextEntityId: () => {
    const state = get();
    const id = state.nextEntityId;
    set({ nextEntityId: id + 1 });
    return id;
  },

  setShowUpgradeCards: (show) => set({ showUpgradeCards: show }),

  startGame: (deck, modifier) => {
    const modifierEffects = modifiersData[modifier]?.effects || {};
    set({
      gameStarted: true,
      selectedDeck: deck,
      activeModifier: modifier,
      currentHand: [],
      deckShuffleTimer: 0,
      globalSpeedModifier: modifierEffects.globalSpeedModifier || 1.0,
      enemySpeedBonus: modifierEffects.enemySpeedBonus || 1.0
    });
  },

  shuffleDeck: () => {
    const state = get();
    // All infrastructure buildings
    const allInfrastructure = ['generator', 'storage', 'droneBay', 'carGarage', 'conveyor', 'ironRefinery', 'copperRefinery', 'assembler', 'advancedAssembler'];

    // Shuffle and pick 3 random infrastructure buildings
    const shuffledInfra = [...allInfrastructure].sort(() => Math.random() - 0.5);
    const infraHand = shuffledInfra.slice(0, 3);

    // Shuffle weapons and pick 1 random one
    const shuffledWeapons = [...state.selectedDeck].sort(() => Math.random() - 0.5);
    const weaponHand = shuffledWeapons.slice(0, 1);

    // 3 infrastructure + 1 weapon
    set({ currentHand: [...infraHand, ...weaponHand] });
  },

  applyUpgrade: (type) => set((state) => {
    const updates = { showUpgradeCards: false };

    if (type === 'range') {
      updates.rangeModifier = state.rangeModifier * 1.05; // +5%
    } else if (type === 'damage') {
      updates.damageBonus = state.damageBonus + 10;
    } else if (type === 'enemySpeed') {
      updates.enemySpeedModifier = state.enemySpeedModifier * 0.85; // -15%
    }

    // Unpause the game
    if (state.isPaused) {
      updates.isPaused = false;
    }

    return updates;
  })
}));
