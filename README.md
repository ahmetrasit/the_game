# Tower Defense Factory Game - Session 1

A tower defense + factory automation PWA game built with React and Canvas.

## Session 1 - Complete ✓

### Implemented Features
- Entity-Component System (ECS) architecture
- Game loop with 60fps target using requestAnimationFrame
- Zustand state management
- Canvas-based rendering system
- Combat system with targeting and damage
- Health bars on entities
- Test scenario: 1 turret shoots 1 enemy

### Architecture

```
/src
  /core
    Entity.js      - ECS entity with component system
    Game.js        - Zustand store for game state
  /systems
    CombatSystem.js   - Handles combat, targeting, damage
    RenderSystem.js   - Canvas rendering with grid and health bars
  /data
    entities.json     - Entity stats and configuration
  App.jsx          - Main app with game loop
  index.jsx        - React entry point
```

### Tech Stack
- React 19
- Zustand 5 (state management)
- Vite (bundler)
- Canvas API (rendering)

### Run the Game

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Game Mechanics

**ECS Components:**
- Health: { current, max }
- Combat: { damage, range, fireRate, timer }

**Systems:**
- CombatSystem: Finds targets, applies damage, removes dead entities
- RenderSystem: Draws grid, entities, health bars

**Test Setup:**
- Turret at (25, 25): 300 HP, 10 damage, 8 tile range, 1 shot/sec
- Enemy at (30, 30): 50 HP
- Distance: ~7.07 tiles (within range)
- Result: Turret kills enemy in ~5 seconds

### Performance
- 60 FPS target
- 50×50 tile grid (32×32 pixels per tile)
- Canvas size: 1600×1600 pixels
- Max entities: 100 enemies, 50 buildings

### Next Sessions
- Session 2: Movement, pathfinding, waves
- Session 3: Resource gathering, building placement
- Session 4: Factory automation, modules, save/load
