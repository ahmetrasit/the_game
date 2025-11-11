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

    // ========== COMPACT FACTORY LAYOUT (20,20) to (28,28) ========== //

    // GENERATORS (8 total) - Distributed around factory perimeter for power coverage
    const generator1 = new Entity('generator1', 'building');
    generator1.x = 20;
    generator1.y = 20;
    generator1.add('Health', { current: 150, max: 150 });
    generator1.add('Power', { production: 20, consumption: 0, connected: true });
    generator1.add('Equipment', {});
    useGame.getState().spawn(generator1);

    const generator2 = new Entity('generator2', 'building');
    generator2.x = 24;
    generator2.y = 20;
    generator2.add('Health', { current: 150, max: 150 });
    generator2.add('Power', { production: 20, consumption: 0, connected: true });
    generator2.add('Equipment', {});
    useGame.getState().spawn(generator2);

    const generator3 = new Entity('generator3', 'building');
    generator3.x = 28;
    generator3.y = 20;
    generator3.add('Health', { current: 150, max: 150 });
    generator3.add('Power', { production: 20, consumption: 0, connected: true });
    generator3.add('Equipment', {});
    useGame.getState().spawn(generator3);

    const generator4 = new Entity('generator4', 'building');
    generator4.x = 20;
    generator4.y = 24;
    generator4.add('Health', { current: 150, max: 150 });
    generator4.add('Power', { production: 20, consumption: 0, connected: true });
    generator4.add('Equipment', {});
    useGame.getState().spawn(generator4);

    const generator5 = new Entity('generator5', 'building');
    generator5.x = 28;
    generator5.y = 24;
    generator5.add('Health', { current: 150, max: 150 });
    generator5.add('Power', { production: 20, consumption: 0, connected: true });
    generator5.add('Equipment', {});
    useGame.getState().spawn(generator5);

    const generator6 = new Entity('generator6', 'building');
    generator6.x = 20;
    generator6.y = 28;
    generator6.add('Health', { current: 150, max: 150 });
    generator6.add('Power', { production: 20, consumption: 0, connected: true });
    generator6.add('Equipment', {});
    useGame.getState().spawn(generator6);

    const generator7 = new Entity('generator7', 'building');
    generator7.x = 24;
    generator7.y = 28;
    generator7.add('Health', { current: 150, max: 150 });
    generator7.add('Power', { production: 20, consumption: 0, connected: true });
    generator7.add('Equipment', {});
    useGame.getState().spawn(generator7);

    const generator8 = new Entity('generator8', 'building');
    generator8.x = 28;
    generator8.y = 28;
    generator8.add('Health', { current: 150, max: 150 });
    generator8.add('Power', { production: 20, consumption: 0, connected: true });
    generator8.add('Equipment', {});
    useGame.getState().spawn(generator8);

    // PLAYER TURRET - Center of factory
    const turret = new Entity('t1', 'building');
    turret.x = 24;
    turret.y = 24;
    turret.add('Health', { current: 250, max: 250 });
    turret.add('Combat', { damage: 25, range: 20, fireRate: 3, timer: 0 });
    turret.add('PlayerControlled', { angle: 0, rotationSpeed: 180 });
    turret.add('Equipment', {});
    useGame.getState().spawn(turret);

    // IRON REFINERIES (4 total) - Clustered for efficiency
    const ironRefinery1 = new Entity('ironRefinery1', 'building');
    ironRefinery1.x = 21;
    ironRefinery1.y = 21;
    ironRefinery1.add('Health', { current: 200, max: 200 });
    ironRefinery1.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery1.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery1.add('Equipment', {});
    useGame.getState().spawn(ironRefinery1);

    const ironRefinery2 = new Entity('ironRefinery2', 'building');
    ironRefinery2.x = 22;
    ironRefinery2.y = 21;
    ironRefinery2.add('Health', { current: 200, max: 200 });
    ironRefinery2.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery2.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery2.add('Equipment', {});
    useGame.getState().spawn(ironRefinery2);

    const ironRefinery3 = new Entity('ironRefinery3', 'building');
    ironRefinery3.x = 21;
    ironRefinery3.y = 22;
    ironRefinery3.add('Health', { current: 200, max: 200 });
    ironRefinery3.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery3.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery3.add('Equipment', {});
    useGame.getState().spawn(ironRefinery3);

    const ironRefinery4 = new Entity('ironRefinery4', 'building');
    ironRefinery4.x = 22;
    ironRefinery4.y = 22;
    ironRefinery4.add('Health', { current: 200, max: 200 });
    ironRefinery4.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery4.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery4.add('Equipment', {});
    useGame.getState().spawn(ironRefinery4);

    // COPPER REFINERIES (3 total) - Clustered
    const copperRefinery1 = new Entity('copperRefinery1', 'building');
    copperRefinery1.x = 26;
    copperRefinery1.y = 21;
    copperRefinery1.add('Health', { current: 200, max: 200 });
    copperRefinery1.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery1.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery1.add('Equipment', {});
    useGame.getState().spawn(copperRefinery1);

    const copperRefinery2 = new Entity('copperRefinery2', 'building');
    copperRefinery2.x = 27;
    copperRefinery2.y = 21;
    copperRefinery2.add('Health', { current: 200, max: 200 });
    copperRefinery2.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery2.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery2.add('Equipment', {});
    useGame.getState().spawn(copperRefinery2);

    const copperRefinery3 = new Entity('copperRefinery3', 'building');
    copperRefinery3.x = 26;
    copperRefinery3.y = 22;
    copperRefinery3.add('Health', { current: 200, max: 200 });
    copperRefinery3.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery3.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery3.add('Equipment', {});
    useGame.getState().spawn(copperRefinery3);

    // GEAR ASSEMBLERS (3 total) - Center left
    const assembler1 = new Entity('assembler1', 'building');
    assembler1.x = 21;
    assembler1.y = 26;
    assembler1.add('Health', { current: 250, max: 250 });
    assembler1.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler1.add('Power', { production: 0, consumption: 10, connected: false });
    assembler1.add('Equipment', {});
    useGame.getState().spawn(assembler1);

    const assembler2 = new Entity('assembler2', 'building');
    assembler2.x = 22;
    assembler2.y = 26;
    assembler2.add('Health', { current: 250, max: 250 });
    assembler2.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler2.add('Power', { production: 0, consumption: 10, connected: false });
    assembler2.add('Equipment', {});
    useGame.getState().spawn(assembler2);

    const assembler3 = new Entity('assembler3', 'building');
    assembler3.x = 21;
    assembler3.y = 27;
    assembler3.add('Health', { current: 250, max: 250 });
    assembler3.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler3.add('Power', { production: 0, consumption: 10, connected: false });
    assembler3.add('Equipment', {});
    useGame.getState().spawn(assembler3);

    // CIRCUIT ASSEMBLERS (2 total) - Center right
    const advancedAssembler1 = new Entity('advancedAssembler1', 'building');
    advancedAssembler1.x = 26;
    advancedAssembler1.y = 26;
    advancedAssembler1.add('Health', { current: 300, max: 300 });
    advancedAssembler1.add('Production', { recipe: 'circuits', time: 3, progress: 0 });
    advancedAssembler1.add('Power', { production: 0, consumption: 15, connected: false });
    advancedAssembler1.add('Equipment', {});
    useGame.getState().spawn(advancedAssembler1);

    const advancedAssembler2 = new Entity('advancedAssembler2', 'building');
    advancedAssembler2.x = 27;
    advancedAssembler2.y = 26;
    advancedAssembler2.add('Health', { current: 300, max: 300 });
    advancedAssembler2.add('Production', { recipe: 'circuits', time: 3, progress: 0 });
    advancedAssembler2.add('Power', { production: 0, consumption: 15, connected: false });
    advancedAssembler2.add('Equipment', {});
    useGame.getState().spawn(advancedAssembler2);

    // STORAGE (3 total) - Central access
    const storage1 = new Entity('storage1', 'building');
    storage1.x = 23;
    storage1.y = 24;
    storage1.add('Health', { current: 100, max: 100 });
    storage1.add('Equipment', {});
    useGame.getState().spawn(storage1);

    const storage2 = new Entity('storage2', 'building');
    storage2.x = 25;
    storage2.y = 24;
    storage2.add('Health', { current: 100, max: 100 });
    storage2.add('Equipment', {});
    useGame.getState().spawn(storage2);

    const storage3 = new Entity('storage3', 'building');
    storage3.x = 24;
    storage3.y = 25;
    storage3.add('Health', { current: 100, max: 100 });
    storage3.add('Equipment', {});
    useGame.getState().spawn(storage3);

    // DRONE BAYS (3 total) - Center for wide repair coverage
    const droneBay1 = new Entity('droneBay1', 'building');
    droneBay1.x = 23;
    droneBay1.y = 23;
    droneBay1.add('Health', { current: 300, max: 300 });
    droneBay1.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay1.add('Equipment', {});
    useGame.getState().spawn(droneBay1);

    const droneBay2 = new Entity('droneBay2', 'building');
    droneBay2.x = 25;
    droneBay2.y = 23;
    droneBay2.add('Health', { current: 300, max: 300 });
    droneBay2.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay2.add('Equipment', {});
    useGame.getState().spawn(droneBay2);

    const droneBay3 = new Entity('droneBay3', 'building');
    droneBay3.x = 23;
    droneBay3.y = 25;
    droneBay3.add('Health', { current: 300, max: 300 });
    droneBay3.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay3.add('Equipment', {});
    useGame.getState().spawn(droneBay3);

    // CAR GARAGES (4 total) - Near edges for collection
    const carGarage1 = new Entity('carGarage1', 'building');
    carGarage1.x = 22;
    carGarage1.y = 27;
    carGarage1.add('Health', { current: 250, max: 250 });
    carGarage1.add('Equipment', {});
    useGame.getState().spawn(carGarage1);

    const carGarage2 = new Entity('carGarage2', 'building');
    carGarage2.x = 26;
    carGarage2.y = 27;
    carGarage2.add('Health', { current: 250, max: 250 });
    carGarage2.add('Equipment', {});
    useGame.getState().spawn(carGarage2);

    const carGarage3 = new Entity('carGarage3', 'building');
    carGarage3.x = 27;
    carGarage3.y = 22;
    carGarage3.add('Health', { current: 250, max: 250 });
    carGarage3.add('Equipment', {});
    useGame.getState().spawn(carGarage3);

    const carGarage4 = new Entity('carGarage4', 'building');
    carGarage4.x = 25;
    carGarage4.y = 25;
    carGarage4.add('Health', { current: 250, max: 250 });
    carGarage4.add('Equipment', {});
    useGame.getState().spawn(carGarage4);

    // ========== PERIMETER DEFENSES - TURRETS ON THE OUTSIDE ========== //

    // NORTH PERIMETER TURRETS (y=19)
    const sniperTurret1 = new Entity('sniperTurret1', 'building');
    sniperTurret1.x = 20;
    sniperTurret1.y = 19;
    sniperTurret1.add('Health', { current: 200, max: 200 });
    sniperTurret1.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret1.add('Equipment', {});
    useGame.getState().spawn(sniperTurret1);

    const turret2 = new Entity('turret2', 'building');
    turret2.x = 22;
    turret2.y = 19;
    turret2.add('Health', { current: 300, max: 300 });
    turret2.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret2.add('Equipment', {});
    useGame.getState().spawn(turret2);

    const turret3 = new Entity('turret3', 'building');
    turret3.x = 26;
    turret3.y = 19;
    turret3.add('Health', { current: 300, max: 300 });
    turret3.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret3.add('Equipment', {});
    useGame.getState().spawn(turret3);

    const sniperTurret2 = new Entity('sniperTurret2', 'building');
    sniperTurret2.x = 28;
    sniperTurret2.y = 19;
    sniperTurret2.add('Health', { current: 200, max: 200 });
    sniperTurret2.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret2.add('Equipment', {});
    useGame.getState().spawn(sniperTurret2);

    // SOUTH PERIMETER TURRETS (y=29)
    const machineGun1 = new Entity('machineGun1', 'building');
    machineGun1.x = 20;
    machineGun1.y = 29;
    machineGun1.add('Health', { current: 280, max: 280 });
    machineGun1.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun1.add('Equipment', {});
    useGame.getState().spawn(machineGun1);

    const cannon1 = new Entity('cannon1', 'building');
    cannon1.x = 22;
    cannon1.y = 29;
    cannon1.add('Health', { current: 400, max: 400 });
    cannon1.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon1.add('Equipment', {});
    useGame.getState().spawn(cannon1);

    const cannon2 = new Entity('cannon2', 'building');
    cannon2.x = 26;
    cannon2.y = 29;
    cannon2.add('Health', { current: 400, max: 400 });
    cannon2.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon2.add('Equipment', {});
    useGame.getState().spawn(cannon2);

    const machineGun2 = new Entity('machineGun2', 'building');
    machineGun2.x = 28;
    machineGun2.y = 29;
    machineGun2.add('Health', { current: 280, max: 280 });
    machineGun2.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun2.add('Equipment', {});
    useGame.getState().spawn(machineGun2);

    // WEST SIDE TURRETS (x=19)
    const laserTurret1 = new Entity('laserTurret1', 'building');
    laserTurret1.x = 19;
    laserTurret1.y = 22;
    laserTurret1.add('Health', { current: 250, max: 250 });
    laserTurret1.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret1.add('Equipment', {});
    useGame.getState().spawn(laserTurret1);

    const laserTurret3 = new Entity('laserTurret3', 'building');
    laserTurret3.x = 19;
    laserTurret3.y = 26;
    laserTurret3.add('Health', { current: 250, max: 250 });
    laserTurret3.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret3.add('Equipment', {});
    useGame.getState().spawn(laserTurret3);

    // EAST SIDE TURRETS (x=29)
    const laserTurret2 = new Entity('laserTurret2', 'building');
    laserTurret2.x = 29;
    laserTurret2.y = 22;
    laserTurret2.add('Health', { current: 250, max: 250 });
    laserTurret2.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret2.add('Equipment', {});
    useGame.getState().spawn(laserTurret2);

    const laserTurret4 = new Entity('laserTurret4', 'building');
    laserTurret4.x = 29;
    laserTurret4.y = 26;
    laserTurret4.add('Health', { current: 250, max: 250 });
    laserTurret4.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret4.add('Equipment', {});
    useGame.getState().spawn(laserTurret4);

    // ========== DEFENSIVE WALLS - SOLID PERIMETER ========== //
    // South wall (y=30) - Complete defensive line
    const wall1 = new Entity('wall1', 'building');
    wall1.x = 19;
    wall1.y = 30;
    wall1.add('Health', { current: 500, max: 500 });
    wall1.add('Equipment', {});
    useGame.getState().spawn(wall1);

    const wall2 = new Entity('wall2', 'building');
    wall2.x = 20;
    wall2.y = 30;
    wall2.add('Health', { current: 500, max: 500 });
    wall2.add('Equipment', {});
    useGame.getState().spawn(wall2);

    const wall3 = new Entity('wall3', 'building');
    wall3.x = 21;
    wall3.y = 30;
    wall3.add('Health', { current: 500, max: 500 });
    wall3.add('Equipment', {});
    useGame.getState().spawn(wall3);

    const wall4 = new Entity('wall4', 'building');
    wall4.x = 22;
    wall4.y = 30;
    wall4.add('Health', { current: 500, max: 500 });
    wall4.add('Equipment', {});
    useGame.getState().spawn(wall4);

    const wall5 = new Entity('wall5', 'building');
    wall5.x = 23;
    wall5.y = 30;
    wall5.add('Health', { current: 500, max: 500 });
    wall5.add('Equipment', {});
    useGame.getState().spawn(wall5);

    const wall6 = new Entity('wall6', 'building');
    wall6.x = 24;
    wall6.y = 30;
    wall6.add('Health', { current: 500, max: 500 });
    wall6.add('Equipment', {});
    useGame.getState().spawn(wall6);

    const wall7 = new Entity('wall7', 'building');
    wall7.x = 25;
    wall7.y = 30;
    wall7.add('Health', { current: 500, max: 500 });
    wall7.add('Equipment', {});
    useGame.getState().spawn(wall7);

    const wall8 = new Entity('wall8', 'building');
    wall8.x = 26;
    wall8.y = 30;
    wall8.add('Health', { current: 500, max: 500 });
    wall8.add('Equipment', {});
    useGame.getState().spawn(wall8);

    const wall9 = new Entity('wall9', 'building');
    wall9.x = 27;
    wall9.y = 30;
    wall9.add('Health', { current: 500, max: 500 });
    wall9.add('Equipment', {});
    useGame.getState().spawn(wall9);

    const wall10 = new Entity('wall10', 'building');
    wall10.x = 28;
    wall10.y = 30;
    wall10.add('Health', { current: 500, max: 500 });
    wall10.add('Equipment', {});
    useGame.getState().spawn(wall10);

    const wall11 = new Entity('wall11', 'building');
    wall11.x = 29;
    wall11.y = 30;
    wall11.add('Health', { current: 500, max: 500 });
    wall11.add('Equipment', {});
    useGame.getState().spawn(wall11);
  }, [gameStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (canvas.width / 50));
      const y = Math.floor((e.clientY - rect.top) / (canvas.height / 50));

      if (x >= 0 && x < 50 && y >= 0 && y < 50 && renderSystemRef.current) {
        renderSystemRef.current.setHoverTile(x, y);
      }
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
    canvas.addEventListener('click', handleMouseClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleMouseClick);
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
