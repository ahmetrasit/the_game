import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { useGame } from './core/Game';
import { Entity } from './core/Entity';
import { PathfindingSystem } from './systems/PathfindingSystem';
import { MovementSystem } from './systems/MovementSystem';
import { WaveSystem } from './systems/WaveSystem';
import { CombatSystem } from './systems/CombatSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { ProductionSystem } from './systems/ProductionSystem';
import { ConveyorSystem } from './systems/ConveyorSystem';
import { PowerSystem } from './systems/PowerSystem';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { RepairSystem } from './systems/RepairSystem';
import { DroneSystem } from './systems/DroneSystem';
import { CollectorCarSystem } from './systems/CollectorCarSystem';
import { UpgradeSystem } from './systems/UpgradeSystem';
import { DeckShuffleSystem } from './systems/DeckShuffleSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { RenderSystem } from './systems/RenderSystem';
import entitiesData from './data/entities.json';
import modifiersData from './data/modifiers.json';

class GameLoop {
  constructor(canvas) {
    this.waveSystem = new WaveSystem();
    this.deckShuffleSystem = new DeckShuffleSystem();
    this.particleSystem = new ParticleSystem();
    this.renderSystem = new RenderSystem(canvas, this.particleSystem);
    this.systems = [
      this.waveSystem,
      new PathfindingSystem(),
      new MovementSystem(),
      new CombatSystem(this.particleSystem),
      new ProjectileSystem(this.particleSystem),
      new PowerSystem(),
      new ProductionSystem(),
      new ConveyorSystem(),
      new PlayerControlSystem(),
      new RepairSystem(),
      new DroneSystem(),
      new CollectorCarSystem(),
      new UpgradeSystem(),
      this.deckShuffleSystem,
      this.particleSystem,
      this.renderSystem
    ];
    this.delta = 0;
    this.last = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.fps = 60;
  }

  update = (time) => {
    this.delta = (time - this.last) / 1000;
    this.last = time;

    this.fpsTimer += this.delta;
    this.frameCount++;

    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    const state = useGame.getState();
    if (!state.isPaused) {
      this.systems.forEach(system => system.update(this.delta));
      state.updateGameTime(this.delta);
    }

    requestAnimationFrame(this.update);
  };

  start() {
    this.last = performance.now();
    requestAnimationFrame(this.update);
  }

  getFPS() {
    return this.fps;
  }

  getWaveNumber() {
    return this.waveSystem.getWaveNumber();
  }

  getNextWaveTimer() {
    return (10 - this.waveSystem.timer).toFixed(1);
  }

  getNextShuffleTimer() {
    return this.deckShuffleSystem?.getTimeUntilShuffle()?.toFixed(1) || '30.0';
  }
}

function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const renderSystemRef = useRef(null);
  const { resources, entities, gameTime, selectedBuilding, buildingRotation, gameOver, showUpgradeCards, rangeModifier, damageBonus, enemySpeedModifier, gameStarted, currentHand, activeModifier, selectedDeck, deckShuffleTimer } = useGame();

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameRef.current) {
        useGame.setState({});
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const spawnTestEnemies = (count) => {
      for (let i = 0; i < count; i++) {
        const e = new Entity(`test_e${Date.now()}_${i}`, 'enemy');
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) {
          e.x = Math.floor(Math.random() * 50);
          e.y = 0;
        } else if (edge === 1) {
          e.x = 49;
          e.y = Math.floor(Math.random() * 50);
        } else if (edge === 2) {
          e.x = Math.floor(Math.random() * 50);
          e.y = 49;
        } else {
          e.x = 0;
          e.y = Math.floor(Math.random() * 50);
        }
        e.add('Health', { current: 50, max: 50 });
        e.add('Movement', { speed: 2, target: { x: 25, y: 25 }, path: null });
        e.add('Combat', { damage: 5, fireRate: 1, timer: 0 });
        e.add('Equipment', {});
        useGame.getState().spawn(e);
      }
    };

    const handleKeyPress = (event) => {
      if (event.key === '1') spawnTestEnemies(1);
      if (event.key === '2') spawnTestEnemies(20);
      if (event.key === '3') spawnTestEnemies(100);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (!gameStarted) return; // Wait until game starts
    if (!canvasRef.current || gameRef.current) return;

    const game = new GameLoop(canvasRef.current);
    gameRef.current = game;
    renderSystemRef.current = game.systems[game.systems.length - 1];
    game.start();

    // ========== MINIMAL 3x4 STARTER FACTORY (24,24) to (27,26) ========== //

    // ROW 24 - Top row: generator, turret, storage
    const generator1 = new Entity('generator1', 'building');
    generator1.x = 24;
    generator1.y = 24;
    generator1.add('Health', { current: 150, max: 150 });
    generator1.add('Power', { production: 20, consumption: 0, connected: true });
    generator1.add('Equipment', {});
    useGame.getState().spawn(generator1);

    const turret2 = new Entity('turret2', 'building');
    turret2.x = 25;
    turret2.y = 24;
    turret2.add('Health', { current: 300, max: 300 });
    turret2.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret2.add('Equipment', {});
    useGame.getState().spawn(turret2);

    const storage1 = new Entity('storage1', 'building');
    storage1.x = 26;
    storage1.y = 24;
    storage1.add('Health', { current: 100, max: 100 });
    storage1.add('Equipment', {});
    useGame.getState().spawn(storage1);

    // ROW 25 - Middle row: turret, player turret (t1), drone bay
    const turret3 = new Entity('turret3', 'building');
    turret3.x = 24;
    turret3.y = 25;
    turret3.add('Health', { current: 300, max: 300 });
    turret3.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret3.add('Equipment', {});
    useGame.getState().spawn(turret3);

    const turret = new Entity('t1', 'building');
    turret.x = 25;
    turret.y = 25;
    turret.add('Health', { current: 250, max: 250 });
    turret.add('Combat', { damage: 25, range: 20, fireRate: 3, timer: 0 });
    turret.add('PlayerControlled', { angle: 0, rotationSpeed: 180 });
    turret.add('Equipment', {});
    useGame.getState().spawn(turret);

    const droneBay1 = new Entity('droneBay1', 'building');
    droneBay1.x = 26;
    droneBay1.y = 25;
    droneBay1.add('Health', { current: 300, max: 300 });
    droneBay1.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay1.add('Equipment', {});
    useGame.getState().spawn(droneBay1);

    // ROW 26 - Production row: iron refinery, turret, car garage
    const ironRefinery1 = new Entity('ironRefinery1', 'building');
    ironRefinery1.x = 24;
    ironRefinery1.y = 26;
    ironRefinery1.add('Health', { current: 200, max: 200 });
    ironRefinery1.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery1.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery1.add('Equipment', {});
    useGame.getState().spawn(ironRefinery1);

    const turret4 = new Entity('turret4', 'building');
    turret4.x = 25;
    turret4.y = 26;
    turret4.add('Health', { current: 300, max: 300 });
    turret4.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret4.add('Equipment', {});
    useGame.getState().spawn(turret4);

    const carGarage1 = new Entity('carGarage1', 'building');
    carGarage1.x = 26;
    carGarage1.y = 26;
    carGarage1.add('Health', { current: 250, max: 250 });
    carGarage1.add('Equipment', {});
    useGame.getState().spawn(carGarage1);

    // ROW 27 - Bottom row: generator2, copper refinery, turret
    const generator2 = new Entity('generator2', 'building');
    generator2.x = 24;
    generator2.y = 27;
    generator2.add('Health', { current: 150, max: 150 });
    generator2.add('Power', { production: 20, consumption: 0, connected: true });
    generator2.add('Equipment', {});
    useGame.getState().spawn(generator2);

    const copperRefinery1 = new Entity('copperRefinery1', 'building');
    copperRefinery1.x = 25;
    copperRefinery1.y = 27;
    copperRefinery1.add('Health', { current: 200, max: 200 });
    copperRefinery1.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery1.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery1.add('Equipment', {});
    useGame.getState().spawn(copperRefinery1);

    const turret5 = new Entity('turret5', 'building');
    turret5.x = 26;
    turret5.y = 27;
    turret5.add('Health', { current: 300, max: 300 });
    turret5.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret5.add('Equipment', {});
    useGame.getState().spawn(turret5);

  }, [gameStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let draggedBuilding = null;
    let dragStartX = null;
    let dragStartY = null;
    let isRightClickHeld = false;
    let lastDeletedTile = null;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (canvas.width / 50));
      const y = Math.floor((e.clientY - rect.top) / (canvas.height / 50));

      if (x >= 0 && x < 50 && y >= 0 && y < 50 && renderSystemRef.current) {
        renderSystemRef.current.setHoverTile(x, y);
      }

      // Handle deleting while right-click is held
      if (isRightClickHeld && x >= 0 && x < 50 && y >= 0 && y < 50) {
        const tileKey = `${x},${y}`;

        // Only delete if we haven't deleted this tile yet in this drag
        if (lastDeletedTile !== tileKey) {
          const state = useGame.getState();
          const buildingId = state.grid[y][x];

          if (buildingId) {
            const building = state.entities.get(buildingId);
            if (building && (building.type === 'building' || building.type === 'conveyor')) {
              // Get building type from ID
              const buildingType = building.id.split('_')[0];
              const buildingData = entitiesData[buildingType];

              if (buildingData && buildingData.cost) {
                // Refund 65-80% of resources
                const refundPercent = 0.65 + Math.random() * 0.15;

                Object.entries(buildingData.cost).forEach(([resource, amount]) => {
                  const refund = Math.floor(amount * refundPercent);
                  state.addResource(resource, refund);
                });
              }

              // Remove the building
              state.remove(buildingId);
              lastDeletedTile = tileKey;
            }
          }
        }
      }

      // Handle dragging building
      if (isDragging && draggedBuilding && (x !== dragStartX || y !== dragStartY)) {
        const state = useGame.getState();

        // Check if target position is valid
        if (x >= 0 && x < 50 && y >= 0 && y < 50) {
          const occupant = state.grid[y][x];

          // Can only move to empty space
          if (!occupant || occupant === draggedBuilding.id) {
            // Move the building
            draggedBuilding.x = x;
            draggedBuilding.y = y;

            // Update grid
            const newGrid = state.grid.map(row => [...row]);

            // Clear old position
            if (dragStartX !== null && dragStartY !== null) {
              if (newGrid[dragStartY][dragStartX] === draggedBuilding.id) {
                newGrid[dragStartY][dragStartX] = null;
              }
            }

            // Set new position
            newGrid[y][x] = draggedBuilding.id;

            useGame.setState({ grid: newGrid });
            dragStartX = x;
            dragStartY = y;
          }
        }
      }
    };

    const handleMouseDown = (e) => {
      const state = useGame.getState();
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (canvas.width / 50));
      const y = Math.floor((e.clientY - rect.top) / (canvas.height / 50));

      if (x < 0 || x >= 50 || y < 0 || y >= 50) return;

      // Right click - start delete mode (hold to delete)
      if (e.button === 2) {
        e.preventDefault();
        isRightClickHeld = true;
        lastDeletedTile = null; // Reset so we can delete the first building
        return;
      }

      // Left click - place new building or start dragging existing
      if (e.button === 0) {
        const buildingId = state.grid[y][x];

        // If clicking on existing building, start drag
        if (buildingId && !state.selectedBuilding) {
          const building = state.entities.get(buildingId);

          // Only allow dragging buildings and conveyors (not enemies, projectiles, etc.)
          if (building && (building.type === 'building' || building.type === 'conveyor')) {
            // Don't allow dragging the player turret
            if (building.id === 't1') return;

            isDragging = true;
            draggedBuilding = building;
            dragStartX = x;
            dragStartY = y;
          }
          return;
        }

        // If no building selected, do nothing
        if (!state.selectedBuilding) return;

        // Place new building
        handleMouseClick(e);
      }
    };

    const handleMouseUp = (e) => {
      isDragging = false;
      draggedBuilding = null;
      dragStartX = null;
      dragStartY = null;

      // Release right-click delete mode
      if (e.button === 2) {
        isRightClickHeld = false;
        lastDeletedTile = null;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault(); // Prevent context menu from appearing
    };

    const handleMouseClick = (e) => {
      const state = useGame.getState();
      if (!state.selectedBuilding) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (canvas.width / 50));
      const y = Math.floor((e.clientY - rect.top) / (canvas.height / 50));

      if (x < 0 || x >= 50 || y < 0 || y >= 50) return;
      if (state.grid[y][x] !== null) return;

      const buildingData = entitiesData[state.selectedBuilding];
      if (!buildingData || !buildingData.cost) return;

      // Apply cost multiplier from modifier
      const costMultiplier = state.activeModifier && modifiersData[state.activeModifier]?.effects?.costMultiplier || 1;

      const canAfford = Object.entries(buildingData.cost).every(
        ([resource, amount]) => (state.resources[resource] || 0) >= Math.ceil(amount * costMultiplier)
      );

      if (!canAfford) return;

      Object.entries(buildingData.cost).forEach(([resource, amount]) => {
        state.addResource(resource, -Math.ceil(amount * costMultiplier));
      });

      const entityType = state.selectedBuilding === 'conveyor' ? 'conveyor' : 'building';
      const entity = new Entity(`${state.selectedBuilding}_${state.getNextEntityId()}`, entityType);
      entity.x = x;
      entity.y = y;

      // Apply modifier effects for turrets
      const modifierEffects = state.activeModifier && modifiersData[state.activeModifier]?.effects || {};
      const isTurret = buildingData.damage && buildingData.range && buildingData.fireRate;
      const hpMultiplier = isTurret && modifierEffects.turretHPMultiplier || 1;
      const damageMultiplier = isTurret && modifierEffects.turretDamageMultiplier || 1;

      const finalHP = Math.ceil(buildingData.hp * hpMultiplier);
      entity.add('Health', { current: finalHP, max: finalHP });
      entity.add('Equipment', {});

      if (isTurret) {
        entity.add('Combat', {
          damage: Math.ceil(buildingData.damage * damageMultiplier),
          range: buildingData.range,
          fireRate: buildingData.fireRate,
          timer: 0
        });
      } else if (state.selectedBuilding === 'ironRefinery' || state.selectedBuilding === 'copperRefinery' ||
                 state.selectedBuilding === 'assembler' || state.selectedBuilding === 'advancedAssembler') {
        entity.add('Production', {
          recipe: buildingData.recipe,
          time: buildingData.productionTime,
          progress: 0
        });
        entity.add('Power', {
          production: 0,
          consumption: buildingData.powerConsumption,
          connected: false
        });
      } else if (state.selectedBuilding === 'generator') {
        const powerMultiplier = modifierEffects.powerMultiplier || 1;
        entity.add('Power', {
          production: Math.ceil(buildingData.powerProduction * powerMultiplier),
          consumption: 0,
          connected: true
        });
      } else if (state.selectedBuilding === 'droneBay') {
        entity.add('DroneBay', {
          productionTime: buildingData.droneProductionTime,
          productionProgress: 0
        });
      } else if (state.selectedBuilding === 'carGarage') {
        // Car garage just needs Health and Equipment, the CollectorCarSystem handles spawning cars
      } else if (state.selectedBuilding === 'conveyor') {
        const dir = getDirectionFromRotation(state.buildingRotation);
        entity.add('Conveyor', { items: [], speed: buildingData.speed, dir });
        entity.add('Power', {
          production: 0,
          consumption: buildingData.powerConsumption,
          connected: false
        });
      }

      state.spawn(entity);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        useGame.getState().rotateBuilding();
      }
      if (e.key === 'Escape') {
        useGame.getState().selectBuilding(null);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted]); // Run when gameStarted changes so canvas exists

  const getDirectionFromRotation = (rotation) => {
    switch (rotation) {
      case 0: return { x: 1, y: 0 };
      case 90: return { x: 0, y: 1 };
      case 180: return { x: -1, y: 0 };
      case 270: return { x: 0, y: -1 };
      default: return { x: 1, y: 0 };
    }
  };

  // Deck selection state - weapons only
  const [tempDeck, setTempDeck] = React.useState(['wall', 'turret', 'laserTurret', 'cannon']);
  const [tempModifier, setTempModifier] = React.useState('normal');

  const maxWeapons = 4;
  const minWeapons = 4;

  const handleStartGame = () => {
    useGame.getState().startGame(tempDeck, tempModifier);
    useGame.getState().shuffleDeck();
  };

  // Deck selection UI
  if (!gameStarted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#111',
        color: '#fff',
        fontFamily: 'monospace'
      }}>
        <div style={{
          backgroundColor: '#222',
          border: '3px solid #4ade80',
          padding: '40px',
          borderRadius: '10px',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <h1 style={{ color: '#4ade80', marginBottom: '20px' }}>SELECT YOUR ARSENAL</h1>
          <p style={{ color: '#888', marginBottom: '30px' }}>
            Choose 4 weapons from 6 available. Every 30s, your deck shuffles to reveal 3 random infrastructure buildings + 1 random weapon.
          </p>

          <h3 style={{ color: '#fff', marginBottom: '15px' }}>Select Weapons ({tempDeck.length}/{maxWeapons})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' }}>
            {['wall', 'turret', 'laserTurret', 'cannon', 'sniperTurret', 'machineGun'].map(type => {
              const isSelected = tempDeck.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => {
                    if (isSelected) {
                      setTempDeck(tempDeck.filter(t => t !== type));
                    } else if (tempDeck.length < maxWeapons) {
                      setTempDeck([...tempDeck, type]);
                    }
                  }}
                  style={{
                    padding: '15px',
                    backgroundColor: isSelected ? '#4ade80' : '#333',
                    border: '2px solid' + (isSelected ? '#4ade80' : '#555'),
                    color: isSelected ? '#000' : '#fff',
                    cursor: 'pointer',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 'bold' : 'normal'
                  }}
                >
                  {type.toUpperCase()}
                </button>
              );
            })}
          </div>

          <h3 style={{ color: '#fff', marginBottom: '15px' }}>Choose Modifier</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
            {Object.entries(modifiersData).map(([key, mod]) => (
              <button
                key={key}
                onClick={() => setTempModifier(key)}
                style={{
                  padding: '15px',
                  backgroundColor: tempModifier === key ? '#4dabf7' : '#333',
                  border: '2px solid ' + (tempModifier === key ? '#4dabf7' : '#555'),
                  color: '#fff',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '16px', marginBottom: '5px' }}>
                  {mod.icon} <strong>{mod.name}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>{mod.description}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleStartGame}
            disabled={tempDeck.length < minWeapons}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '20px',
              fontWeight: 'bold',
              backgroundColor: tempDeck.length >= minWeapons ? '#4ade80' : '#555',
              border: 'none',
              borderRadius: '10px',
              color: tempDeck.length >= minWeapons ? '#000' : '#888',
              cursor: tempDeck.length >= minWeapons ? 'pointer' : 'not-allowed'
            }}
          >
            START GAME {tempDeck.length >= minWeapons ? '' : `(Select exactly ${minWeapons} weapons)`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ margin: '10px 0', textAlign: 'center' }}>Tower Defense Factory</h1>
      <div style={{ marginBottom: '10px', fontSize: '14px', textAlign: 'center' }}>
        <span style={{ marginRight: '15px' }}>Iron: {resources.iron || 0}</span>
        <span style={{ marginRight: '15px' }}>Copper: {resources.copper || 0}</span>
        <span style={{ marginRight: '15px' }}>IPlates: {resources.ironPlates || 0}</span>
        <span style={{ marginRight: '15px' }}>CPlates: {resources.copperPlates || 0}</span>
        <span style={{ marginRight: '15px' }}>Gears: {resources.gears || 0}</span>
        <span style={{ marginRight: '15px' }}>Circuits: {resources.circuits || 0}</span>
        <span style={{ marginRight: '15px' }}>AdvCircuits: {resources.advancedCircuits || 0}</span>
      </div>
      <div style={{ marginBottom: '10px', fontSize: '12px', textAlign: 'center', color: '#888' }}>
        <span style={{ marginRight: '20px' }}>Entities: {entities.size}</span>
        <span style={{ marginRight: '20px' }}>Wave: {gameRef.current?.getWaveNumber() || 0}</span>
        <span style={{ marginRight: '20px' }}>Next Wave: {gameRef.current?.getNextWaveTimer() || '10.0'}s</span>
        <span style={{ marginRight: '20px' }}>Next Shuffle: {gameRef.current?.getNextShuffleTimer() || '30.0'}s</span>
        <span style={{ marginRight: '20px' }}>Time: {gameTime.toFixed(1)}s</span>
        <span>FPS: {gameRef.current?.getFPS() || 0}</span>
      </div>
      {activeModifier && modifiersData[activeModifier] && (
        <div style={{ marginBottom: '10px', fontSize: '12px', textAlign: 'center', color: '#4dabf7' }}>
          Modifier: {modifiersData[activeModifier].icon} {modifiersData[activeModifier].name}
        </div>
      )}
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
        Test Controls: Press [1] spawn 1 enemy | [2] spawn 20 enemies | [3] spawn 100 enemies
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            id="game"
            width={800}
            height={800}
          />
        </div>
        <div style={{
          flex: 1,
          border: '1px solid #444',
          margin: '0 10px 10px 10px',
          backgroundColor: '#111',
          padding: '10px',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Buildings</h3>
          <div style={{ color: '#aaa', fontSize: '11px', marginBottom: '15px' }}>
            Click to select, then click on grid to place. Press [R] to rotate conveyors. [ESC] to cancel.
          </div>

          {selectedBuilding && (
            <div style={{
              padding: '8px',
              backgroundColor: '#222',
              marginBottom: '10px',
              border: '1px solid #444',
              fontSize: '12px',
              color: '#4ade80'
            }}>
              Selected: {selectedBuilding.toUpperCase()} {selectedBuilding === 'conveyor' && `(${buildingRotation}°)`}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentHand.map(type => {
              const data = entitiesData[type];
              if (!data) return null;

              const isSelected = selectedBuilding === type;
              const costMultiplier = activeModifier && modifiersData[activeModifier]?.effects?.costMultiplier || 1;
              const canAfford = data.cost && Object.entries(data.cost).every(
                ([resource, amount]) => (resources[resource] || 0) >= Math.ceil(amount * costMultiplier)
              );

              const isWeapon = data.damage && data.range && data.fireRate;

              const getDisplayName = (t) => {
                if (t === 'ironRefinery') return 'IRON REFINERY';
                if (t === 'copperRefinery') return 'COPPER REFINERY';
                if (t === 'advancedAssembler') return 'ADV ASSEMBLER';
                if (t === 'droneBay') return 'DRONE BAY';
                return t.toUpperCase();
              };

              return (
                <button
                  key={type}
                  onClick={() => useGame.getState().selectBuilding(type)}
                  style={{
                    padding: '8px',
                    backgroundColor: isSelected ? '#444' : '#222',
                    border: `2px solid ${isSelected ? (isWeapon ? '#ff6b6b' : '#4ade80') : canAfford ? '#444' : '#883333'}`,
                    color: canAfford ? '#fff' : '#888',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  disabled={!canAfford}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '12px' }}>
                    {getDisplayName(type)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    {data.cost ? Object.entries(data.cost)
                      .map(([r, a]) => `${Math.ceil(a * costMultiplier)} ${r}`)
                      .join(', ') : 'Free'}
                  </div>
                  {isWeapon && (
                    <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                      Dmg:{data.damage} Rng:{data.range} Rate:{data.fireRate}/s HP:{data.hp}
                    </div>
                  )}
                  {(type === 'ironRefinery' || type === 'copperRefinery' || type === 'assembler' || type === 'advancedAssembler') && (
                    <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                      {data.recipe} | Pwr:{data.powerConsumption} | T:{data.productionTime}s
                    </div>
                  )}
                  {type === 'generator' && (
                    <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                      Power: +{data.powerProduction}
                    </div>
                  )}
                  {type === 'conveyor' && (
                    <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                      Spd:{data.speed} | Pwr:{data.powerConsumption}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showUpgradeCards && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#222',
            border: '3px solid #4ade80',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#4ade80', fontSize: '42px', margin: '0 0 15px 0' }}>
              CHOOSE AN UPGRADE
            </h1>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 30px 0' }}>
              Current bonuses: Range +{((rangeModifier - 1) * 100).toFixed(0)}% | Damage +{damageBonus} | Enemy Speed {((1 - enemySpeedModifier) * 100).toFixed(0)}% slower
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button
                onClick={() => useGame.getState().applyUpgrade('range')}
                style={{
                  padding: '30px',
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #4ade80',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  width: '200px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2a2a2a'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#1a1a1a'}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: '#4ade80' }}>
                  +5% RANGE
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Increase all turret ranges by 5%
                </div>
              </button>

              <button
                onClick={() => useGame.getState().applyUpgrade('damage')}
                style={{
                  padding: '30px',
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #ff6b6b',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  width: '200px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2a2a2a'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#1a1a1a'}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚡</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: '#ff6b6b' }}>
                  +10 DAMAGE
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Increase all turret damage by 10
                </div>
              </button>

              <button
                onClick={() => useGame.getState().applyUpgrade('enemySpeed')}
                style={{
                  padding: '30px',
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #4dabf7',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  width: '200px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2a2a2a'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#1a1a1a'}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🐌</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: '#4dabf7' }}>
                  -15% ENEMY SPEED
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Slow down all enemies by 15%
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#222',
            border: '3px solid #ff4444',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#ff4444', fontSize: '48px', margin: '0 0 20px 0' }}>
              GAME OVER
            </h1>
            <p style={{ color: '#fff', fontSize: '24px', margin: '0 0 10px 0' }}>
              Your turret has been destroyed!
            </p>
            <p style={{ color: '#888', fontSize: '16px', margin: '0 0 30px 0' }}>
              Survived {gameTime.toFixed(1)} seconds | Wave {gameRef.current?.getWaveNumber() || 0}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#4ade80',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              RESTART
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
