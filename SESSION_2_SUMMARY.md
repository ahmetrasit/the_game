# Session 2: Pathfinding + Wave System

## Implementation Complete

### Systems Implemented

1. **PathfindingSystem.js** - A* pathfinding algorithm
   - Max 10 pathfinding calculations per frame (budget enforced)
   - Manhattan distance heuristic
   - Obstacles detection (buildings block paths)
   - Enemies find paths from spawn to center (25, 25)

2. **MovementSystem.js** - Path following
   - Enemies follow calculated paths
   - Speed: 2 units/second
   - Grid position updates maintained
   - Smooth interpolation between waypoints

3. **WaveSystem.js** - Wave spawning
   - Spawns 5 enemies every 10 seconds
   - Random edge spawning (x=0, x=49, y=0, y=49)
   - Wave number tracking for future difficulty scaling
   - All enemies target center (25, 25)

4. **CombatSystem.js** - Resource drops added
   - Enemies drop 5 iron + 2 copper on death
   - Turret at center attacks enemies in 8-tile range
   - 10 damage, 1 attack/second

### Components Added

- **Movement** component: `{speed, target, path}`
- **Equipment** component: Added to all entities (future-proofing)
- **Health** component: 50 HP for enemies

### Test Controls

Press keyboard keys to spawn enemies:
- **[1]** - Spawn 1 enemy
- **[2]** - Spawn 20 enemies (pathfinding test)
- **[3]** - Spawn 100 enemies (performance test)

### UI Metrics

Display shows:
- Iron/Copper resources
- Entity count
- Current wave number
- Next wave timer countdown
- Game time
- FPS counter

## Testing Verification

### Test 1: Single Enemy Pathfinding
1. Press [1] to spawn 1 enemy at random edge
2. Enemy should calculate path to center (25, 25)
3. Red square should move along path around turret
4. When in range, turret shoots (health bar appears)
5. On death: resources increase (+5 iron, +2 copper)

### Test 2: Multiple Enemies (20)
1. Press [2] to spawn 20 enemies
2. Max 10 paths calculated per frame
3. All enemies should pathfind and move to center
4. Turret targets closest enemy
5. FPS should remain 55+ with 20 entities

### Test 3: Performance (100 Enemies)
1. Press [3] to spawn 100 enemies
2. System handles 101 entities (100 enemies + 1 turret)
3. Pathfinding budget prevents frame drops
4. Expected FPS: 40-60 depending on system

### Test 4: Wave System
1. Wait 10 seconds from game start
2. Wave 1 spawns 5 enemies
3. "Wave: 1" shown in UI
4. Every 10s after, 5 more enemies spawn
5. Wave counter increments

## Performance Characteristics

- **Pathfinding Budget**: Max 10/frame prevents lag
- **Grid Updates**: Only changed positions update grid
- **Render Optimization**: Single canvas, 50x50 grid
- **Memory**: Efficient path caching per enemy
- **Target FPS**: 60 with <50 entities, 40-60 with 100 entities

## Architecture Notes

- All systems use ECS pattern
- State managed via Zustand
- Grid tracks entity positions (50x50)
- Systems run in order: Wave → Pathfinding → Movement → Combat → Render
- All actions serializable (multiplayer-ready)

## Files Modified/Created

```
src/systems/PathfindingSystem.js (new)
src/systems/MovementSystem.js (new)
src/systems/WaveSystem.js (new)
src/systems/CombatSystem.js (modified - resource drops)
src/App.jsx (modified - systems integration, test controls)
```

## Next Session Preview

Session 3 will add:
- Building placement system
- Resource management/costs
- Multiple tower types
- Upgrade system
- Factory automation basics
