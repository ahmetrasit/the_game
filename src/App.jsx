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

    // ========== ULTRA COMPACT 11x11 FACTORY (20,20) to (30,30) - NO HOLES ========== //

    // ROW 20 - Top defensive line (11 buildings)
    const generator1 = new Entity('generator1', 'building');
    generator1.x = 20;
    generator1.y = 20;
    generator1.add('Health', { current: 150, max: 150 });
    generator1.add('Power', { production: 20, consumption: 0, connected: true });
    generator1.add('Equipment', {});
    useGame.getState().spawn(generator1);

    const sniperTurret1 = new Entity('sniperTurret1', 'building');
    sniperTurret1.x = 21;
    sniperTurret1.y = 20;
    sniperTurret1.add('Health', { current: 200, max: 200 });
    sniperTurret1.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret1.add('Equipment', {});
    useGame.getState().spawn(sniperTurret1);

    const turret2 = new Entity('turret2', 'building');
    turret2.x = 22;
    turret2.y = 20;
    turret2.add('Health', { current: 300, max: 300 });
    turret2.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret2.add('Equipment', {});
    useGame.getState().spawn(turret2);

    const turret3 = new Entity('turret3', 'building');
    turret3.x = 23;
    turret3.y = 20;
    turret3.add('Health', { current: 300, max: 300 });
    turret3.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret3.add('Equipment', {});
    useGame.getState().spawn(turret3);

    const generator2 = new Entity('generator2', 'building');
    generator2.x = 24;
    generator2.y = 20;
    generator2.add('Health', { current: 150, max: 150 });
    generator2.add('Power', { production: 20, consumption: 0, connected: true });
    generator2.add('Equipment', {});
    useGame.getState().spawn(generator2);

    const turret = new Entity('t1', 'building');
    turret.x = 25;
    turret.y = 20;
    turret.add('Health', { current: 250, max: 250 });
    turret.add('Combat', { damage: 25, range: 20, fireRate: 3, timer: 0 });
    turret.add('PlayerControlled', { angle: 0, rotationSpeed: 180 });
    turret.add('Equipment', {});
    useGame.getState().spawn(turret);

    const laserTurret1 = new Entity('laserTurret1', 'building');
    laserTurret1.x = 26;
    laserTurret1.y = 20;
    laserTurret1.add('Health', { current: 250, max: 250 });
    laserTurret1.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret1.add('Equipment', {});
    useGame.getState().spawn(laserTurret1);

    const laserTurret2 = new Entity('laserTurret2', 'building');
    laserTurret2.x = 27;
    laserTurret2.y = 20;
    laserTurret2.add('Health', { current: 250, max: 250 });
    laserTurret2.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret2.add('Equipment', {});
    useGame.getState().spawn(laserTurret2);

    const sniperTurret2 = new Entity('sniperTurret2', 'building');
    sniperTurret2.x = 28;
    sniperTurret2.y = 20;
    sniperTurret2.add('Health', { current: 200, max: 200 });
    sniperTurret2.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret2.add('Equipment', {});
    useGame.getState().spawn(sniperTurret2);

    const cannon1 = new Entity('cannon1', 'building');
    cannon1.x = 29;
    cannon1.y = 20;
    cannon1.add('Health', { current: 400, max: 400 });
    cannon1.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon1.add('Equipment', {});
    useGame.getState().spawn(cannon1);

    const generator3 = new Entity('generator3', 'building');
    generator3.x = 30;
    generator3.y = 20;
    generator3.add('Health', { current: 150, max: 150 });
    generator3.add('Power', { production: 20, consumption: 0, connected: true });
    generator3.add('Equipment', {});
    useGame.getState().spawn(generator3);

    // ROW 21 - Production row (11 buildings)
    const laserTurret3 = new Entity('laserTurret3', 'building');
    laserTurret3.x = 20;
    laserTurret3.y = 21;
    laserTurret3.add('Health', { current: 250, max: 250 });
    laserTurret3.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret3.add('Equipment', {});
    useGame.getState().spawn(laserTurret3);


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

    const droneBay1 = new Entity('droneBay1', 'building');
    droneBay1.x = 23;
    droneBay1.y = 21;
    droneBay1.add('Health', { current: 300, max: 300 });
    droneBay1.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay1.add('Equipment', {});
    useGame.getState().spawn(droneBay1);

    const storage1 = new Entity('storage1', 'building');
    storage1.x = 24;
    storage1.y = 21;
    storage1.add('Health', { current: 100, max: 100 });
    storage1.add('Equipment', {});
    useGame.getState().spawn(storage1);

    const storage2 = new Entity('storage2', 'building');
    storage2.x = 25;
    storage2.y = 21;
    storage2.add('Health', { current: 100, max: 100 });
    storage2.add('Equipment', {});
    useGame.getState().spawn(storage2);

    const storage3 = new Entity('storage3', 'building');
    storage3.x = 26;
    storage3.y = 21;
    storage3.add('Health', { current: 100, max: 100 });
    storage3.add('Equipment', {});
    useGame.getState().spawn(storage3);

    const droneBay2 = new Entity('droneBay2', 'building');
    droneBay2.x = 27;
    droneBay2.y = 21;
    droneBay2.add('Health', { current: 300, max: 300 });
    droneBay2.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay2.add('Equipment', {});
    useGame.getState().spawn(droneBay2);

    const copperRefinery1 = new Entity('copperRefinery1', 'building');
    copperRefinery1.x = 28;
    copperRefinery1.y = 21;
    copperRefinery1.add('Health', { current: 200, max: 200 });
    copperRefinery1.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery1.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery1.add('Equipment', {});
    useGame.getState().spawn(copperRefinery1);

    const copperRefinery2 = new Entity('copperRefinery2', 'building');
    copperRefinery2.x = 29;
    copperRefinery2.y = 21;
    copperRefinery2.add('Health', { current: 200, max: 200 });
    copperRefinery2.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery2.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery2.add('Equipment', {});
    useGame.getState().spawn(copperRefinery2);

    const laserTurret4 = new Entity('laserTurret4', 'building');
    laserTurret4.x = 30;
    laserTurret4.y = 21;
    laserTurret4.add('Health', { current: 250, max: 250 });
    laserTurret4.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret4.add('Equipment', {});
    useGame.getState().spawn(laserTurret4);

    // ROW 22 (11 buildings)
    const machineGun1 = new Entity('machineGun1', 'building');
    machineGun1.x = 20;
    machineGun1.y = 22;
    machineGun1.add('Health', { current: 280, max: 280 });
    machineGun1.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun1.add('Equipment', {});
    useGame.getState().spawn(machineGun1);

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

    const carGarage1 = new Entity('carGarage1', 'building');
    carGarage1.x = 23;
    carGarage1.y = 22;
    carGarage1.add('Health', { current: 250, max: 250 });
    carGarage1.add('Equipment', {});
    useGame.getState().spawn(carGarage1);

    const conveyor1 = new Entity('conveyor1', 'conveyor');
    conveyor1.x = 24;
    conveyor1.y = 22;
    conveyor1.add('Health', { current: 50, max: 50 });
    conveyor1.add('Conveyor', { items: [], speed: 1, dir: { x: 1, y: 0 } });
    conveyor1.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor1.add('Equipment', {});
    useGame.getState().spawn(conveyor1);

    const conveyor2 = new Entity('conveyor2', 'conveyor');
    conveyor2.x = 25;
    conveyor2.y = 22;
    conveyor2.add('Health', { current: 50, max: 50 });
    conveyor2.add('Conveyor', { items: [], speed: 1, dir: { x: 0, y: -1 } });
    conveyor2.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor2.add('Equipment', {});
    useGame.getState().spawn(conveyor2);

    const conveyor3 = new Entity('conveyor3', 'conveyor');
    conveyor3.x = 26;
    conveyor3.y = 22;
    conveyor3.add('Health', { current: 50, max: 50 });
    conveyor3.add('Conveyor', { items: [], speed: 1, dir: { x: -1, y: 0 } });
    conveyor3.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor3.add('Equipment', {});
    useGame.getState().spawn(conveyor3);

    const carGarage2 = new Entity('carGarage2', 'building');
    carGarage2.x = 27;
    carGarage2.y = 22;
    carGarage2.add('Health', { current: 250, max: 250 });
    carGarage2.add('Equipment', {});
    useGame.getState().spawn(carGarage2);

    const copperRefinery3 = new Entity('copperRefinery3', 'building');
    copperRefinery3.x = 28;
    copperRefinery3.y = 22;
    copperRefinery3.add('Health', { current: 200, max: 200 });
    copperRefinery3.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery3.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery3.add('Equipment', {});
    useGame.getState().spawn(copperRefinery3);

    const advancedAssembler1 = new Entity('advancedAssembler1', 'building');
    advancedAssembler1.x = 29;
    advancedAssembler1.y = 22;
    advancedAssembler1.add('Health', { current: 300, max: 300 });
    advancedAssembler1.add('Production', { recipe: 'circuits', time: 3, progress: 0 });
    advancedAssembler1.add('Power', { production: 0, consumption: 15, connected: false });
    advancedAssembler1.add('Equipment', {});
    useGame.getState().spawn(advancedAssembler1);

    const machineGun2 = new Entity('machineGun2', 'building');
    machineGun2.x = 30;
    machineGun2.y = 22;
    machineGun2.add('Health', { current: 280, max: 280 });
    machineGun2.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun2.add('Equipment', {});
    useGame.getState().spawn(machineGun2);

    // ROW 23 (11 buildings)
    const generator4 = new Entity('generator4', 'building');
    generator4.x = 20;
    generator4.y = 23;
    generator4.add('Health', { current: 150, max: 150 });
    generator4.add('Power', { production: 20, consumption: 0, connected: true });
    generator4.add('Equipment', {});
    useGame.getState().spawn(generator4);

    const assembler1 = new Entity('assembler1', 'building');
    assembler1.x = 21;
    assembler1.y = 23;
    assembler1.add('Health', { current: 250, max: 250 });
    assembler1.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler1.add('Power', { production: 0, consumption: 10, connected: false });
    assembler1.add('Equipment', {});
    useGame.getState().spawn(assembler1);

    const assembler2 = new Entity('assembler2', 'building');
    assembler2.x = 22;
    assembler2.y = 23;
    assembler2.add('Health', { current: 250, max: 250 });
    assembler2.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler2.add('Power', { production: 0, consumption: 10, connected: false });
    assembler2.add('Equipment', {});
    useGame.getState().spawn(assembler2);

    const droneBay3 = new Entity('droneBay3', 'building');
    droneBay3.x = 23;
    droneBay3.y = 23;
    droneBay3.add('Health', { current: 300, max: 300 });
    droneBay3.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay3.add('Equipment', {});
    useGame.getState().spawn(droneBay3);

    const storage4 = new Entity('storage4', 'building');
    storage4.x = 24;
    storage4.y = 23;
    storage4.add('Health', { current: 100, max: 100 });
    storage4.add('Equipment', {});
    useGame.getState().spawn(storage4);

    const storage5 = new Entity('storage5', 'building');
    storage5.x = 25;
    storage5.y = 23;
    storage5.add('Health', { current: 100, max: 100 });
    storage5.add('Equipment', {});
    useGame.getState().spawn(storage5);

    const storage6 = new Entity('storage6', 'building');
    storage6.x = 26;
    storage6.y = 23;
    storage6.add('Health', { current: 100, max: 100 });
    storage6.add('Equipment', {});
    useGame.getState().spawn(storage6);

    const droneBay4 = new Entity('droneBay4', 'building');
    droneBay4.x = 27;
    droneBay4.y = 23;
    droneBay4.add('Health', { current: 300, max: 300 });
    droneBay4.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay4.add('Equipment', {});
    useGame.getState().spawn(droneBay4);

    const assembler3 = new Entity('assembler3', 'building');
    assembler3.x = 28;
    assembler3.y = 23;
    assembler3.add('Health', { current: 250, max: 250 });
    assembler3.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler3.add('Power', { production: 0, consumption: 10, connected: false });
    assembler3.add('Equipment', {});
    useGame.getState().spawn(assembler3);

    const advancedAssembler2 = new Entity('advancedAssembler2', 'building');
    advancedAssembler2.x = 29;
    advancedAssembler2.y = 23;
    advancedAssembler2.add('Health', { current: 300, max: 300 });
    advancedAssembler2.add('Production', { recipe: 'circuits', time: 3, progress: 0 });
    advancedAssembler2.add('Power', { production: 0, consumption: 15, connected: false });
    advancedAssembler2.add('Equipment', {});
    useGame.getState().spawn(advancedAssembler2);

    const generator5 = new Entity('generator5', 'building');
    generator5.x = 30;
    generator5.y = 23;
    generator5.add('Health', { current: 150, max: 150 });
    generator5.add('Power', { production: 20, consumption: 0, connected: true });
    generator5.add('Equipment', {});
    useGame.getState().spawn(generator5);

    // ROW 24 - Center (11 buildings)
    const cannon2 = new Entity('cannon2', 'building');
    cannon2.x = 20;
    cannon2.y = 24;
    cannon2.add('Health', { current: 400, max: 400 });
    cannon2.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon2.add('Equipment', {});
    useGame.getState().spawn(cannon2);

    const carGarage3 = new Entity('carGarage3', 'building');
    carGarage3.x = 21;
    carGarage3.y = 24;
    carGarage3.add('Health', { current: 250, max: 250 });
    carGarage3.add('Equipment', {});
    useGame.getState().spawn(carGarage3);

    const carGarage4 = new Entity('carGarage4', 'building');
    carGarage4.x = 22;
    carGarage4.y = 24;
    carGarage4.add('Health', { current: 250, max: 250 });
    carGarage4.add('Equipment', {});
    useGame.getState().spawn(carGarage4);

    const storage7 = new Entity('storage7', 'building');
    storage7.x = 23;
    storage7.y = 24;
    storage7.add('Health', { current: 100, max: 100 });
    storage7.add('Equipment', {});
    useGame.getState().spawn(storage7);

    const conveyor4 = new Entity('conveyor4', 'conveyor');
    conveyor4.x = 24;
    conveyor4.y = 24;
    conveyor4.add('Health', { current: 50, max: 50 });
    conveyor4.add('Conveyor', { items: [], speed: 1, dir: { x: 0, y: 1 } });
    conveyor4.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor4.add('Equipment', {});
    useGame.getState().spawn(conveyor4);

    const conveyor5 = new Entity('conveyor5', 'conveyor');
    conveyor5.x = 25;
    conveyor5.y = 24;
    conveyor5.add('Health', { current: 50, max: 50 });
    conveyor5.add('Conveyor', { items: [], speed: 1, dir: { x: 1, y: 0 } });
    conveyor5.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor5.add('Equipment', {});
    useGame.getState().spawn(conveyor5);

    const conveyor6 = new Entity('conveyor6', 'conveyor');
    conveyor6.x = 26;
    conveyor6.y = 24;
    conveyor6.add('Health', { current: 50, max: 50 });
    conveyor6.add('Conveyor', { items: [], speed: 1, dir: { x: 0, y: 1 } });
    conveyor6.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor6.add('Equipment', {});
    useGame.getState().spawn(conveyor6);

    const storage8 = new Entity('storage8', 'building');
    storage8.x = 27;
    storage8.y = 24;
    storage8.add('Health', { current: 100, max: 100 });
    storage8.add('Equipment', {});
    useGame.getState().spawn(storage8);

    const carGarage5 = new Entity('carGarage5', 'building');
    carGarage5.x = 28;
    carGarage5.y = 24;
    carGarage5.add('Health', { current: 250, max: 250 });
    carGarage5.add('Equipment', {});
    useGame.getState().spawn(carGarage5);

    const carGarage6 = new Entity('carGarage6', 'building');
    carGarage6.x = 29;
    carGarage6.y = 24;
    carGarage6.add('Health', { current: 250, max: 250 });
    carGarage6.add('Equipment', {});
    useGame.getState().spawn(carGarage6);

    const cannon3 = new Entity('cannon3', 'building');
    cannon3.x = 30;
    cannon3.y = 24;
    cannon3.add('Health', { current: 400, max: 400 });
    cannon3.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon3.add('Equipment', {});
    useGame.getState().spawn(cannon3);

    // ROW 25 (11 buildings) - Mirror of row 23
    const generator6 = new Entity('generator6', 'building');
    generator6.x = 20;
    generator6.y = 25;
    generator6.add('Health', { current: 150, max: 150 });
    generator6.add('Power', { production: 20, consumption: 0, connected: true });
    generator6.add('Equipment', {});
    useGame.getState().spawn(generator6);

    const assembler4 = new Entity('assembler4', 'building');
    assembler4.x = 21;
    assembler4.y = 25;
    assembler4.add('Health', { current: 250, max: 250 });
    assembler4.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler4.add('Power', { production: 0, consumption: 10, connected: false });
    assembler4.add('Equipment', {});
    useGame.getState().spawn(assembler4);

    const assembler5 = new Entity('assembler5', 'building');
    assembler5.x = 22;
    assembler5.y = 25;
    assembler5.add('Health', { current: 250, max: 250 });
    assembler5.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler5.add('Power', { production: 0, consumption: 10, connected: false });
    assembler5.add('Equipment', {});
    useGame.getState().spawn(assembler5);

    const droneBay5 = new Entity('droneBay5', 'building');
    droneBay5.x = 23;
    droneBay5.y = 25;
    droneBay5.add('Health', { current: 300, max: 300 });
    droneBay5.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay5.add('Equipment', {});
    useGame.getState().spawn(droneBay5);

    const storage9 = new Entity('storage9', 'building');
    storage9.x = 24;
    storage9.y = 25;
    storage9.add('Health', { current: 100, max: 100 });
    storage9.add('Equipment', {});
    useGame.getState().spawn(storage9);

    const storage10 = new Entity('storage10', 'building');
    storage10.x = 25;
    storage10.y = 25;
    storage10.add('Health', { current: 100, max: 100 });
    storage10.add('Equipment', {});
    useGame.getState().spawn(storage10);

    const storage11 = new Entity('storage11', 'building');
    storage11.x = 26;
    storage11.y = 25;
    storage11.add('Health', { current: 100, max: 100 });
    storage11.add('Equipment', {});
    useGame.getState().spawn(storage11);

    const droneBay6 = new Entity('droneBay6', 'building');
    droneBay6.x = 27;
    droneBay6.y = 25;
    droneBay6.add('Health', { current: 300, max: 300 });
    droneBay6.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay6.add('Equipment', {});
    useGame.getState().spawn(droneBay6);

    const assembler6 = new Entity('assembler6', 'building');
    assembler6.x = 28;
    assembler6.y = 25;
    assembler6.add('Health', { current: 250, max: 250 });
    assembler6.add('Production', { recipe: 'gears', time: 1, progress: 0 });
    assembler6.add('Power', { production: 0, consumption: 10, connected: false });
    assembler6.add('Equipment', {});
    useGame.getState().spawn(assembler6);

    const advancedAssembler3 = new Entity('advancedAssembler3', 'building');
    advancedAssembler3.x = 29;
    advancedAssembler3.y = 25;
    advancedAssembler3.add('Health', { current: 300, max: 300 });
    advancedAssembler3.add('Production', { recipe: 'circuits', time: 3, progress: 0 });
    advancedAssembler3.add('Power', { production: 0, consumption: 15, connected: false });
    advancedAssembler3.add('Equipment', {});
    useGame.getState().spawn(advancedAssembler3);

    const generator7 = new Entity('generator7', 'building');
    generator7.x = 30;
    generator7.y = 25;
    generator7.add('Health', { current: 150, max: 150 });
    generator7.add('Power', { production: 20, consumption: 0, connected: true });
    generator7.add('Equipment', {});
    useGame.getState().spawn(generator7);

    // ROW 26 (11 buildings)
    const machineGun3 = new Entity('machineGun3', 'building');
    machineGun3.x = 20;
    machineGun3.y = 26;
    machineGun3.add('Health', { current: 280, max: 280 });
    machineGun3.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun3.add('Equipment', {});
    useGame.getState().spawn(machineGun3);

    const ironRefinery5 = new Entity('ironRefinery5', 'building');
    ironRefinery5.x = 21;
    ironRefinery5.y = 26;
    ironRefinery5.add('Health', { current: 200, max: 200 });
    ironRefinery5.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery5.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery5.add('Equipment', {});
    useGame.getState().spawn(ironRefinery5);

    const ironRefinery6 = new Entity('ironRefinery6', 'building');
    ironRefinery6.x = 22;
    ironRefinery6.y = 26;
    ironRefinery6.add('Health', { current: 200, max: 200 });
    ironRefinery6.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery6.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery6.add('Equipment', {});
    useGame.getState().spawn(ironRefinery6);

    const carGarage7 = new Entity('carGarage7', 'building');
    carGarage7.x = 23;
    carGarage7.y = 26;
    carGarage7.add('Health', { current: 250, max: 250 });
    carGarage7.add('Equipment', {});
    useGame.getState().spawn(carGarage7);

    const conveyor7 = new Entity('conveyor7', 'conveyor');
    conveyor7.x = 24;
    conveyor7.y = 26;
    conveyor7.add('Health', { current: 50, max: 50 });
    conveyor7.add('Conveyor', { items: [], speed: 1, dir: { x: 1, y: 0 } });
    conveyor7.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor7.add('Equipment', {});
    useGame.getState().spawn(conveyor7);

    const conveyor8 = new Entity('conveyor8', 'conveyor');
    conveyor8.x = 25;
    conveyor8.y = 26;
    conveyor8.add('Health', { current: 50, max: 50 });
    conveyor8.add('Conveyor', { items: [], speed: 1, dir: { x: 0, y: 1 } });
    conveyor8.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor8.add('Equipment', {});
    useGame.getState().spawn(conveyor8);

    const conveyor9 = new Entity('conveyor9', 'conveyor');
    conveyor9.x = 26;
    conveyor9.y = 26;
    conveyor9.add('Health', { current: 50, max: 50 });
    conveyor9.add('Conveyor', { items: [], speed: 1, dir: { x: -1, y: 0 } });
    conveyor9.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor9.add('Equipment', {});
    useGame.getState().spawn(conveyor9);

    const carGarage8 = new Entity('carGarage8', 'building');
    carGarage8.x = 27;
    carGarage8.y = 26;
    carGarage8.add('Health', { current: 250, max: 250 });
    carGarage8.add('Equipment', {});
    useGame.getState().spawn(carGarage8);

    const copperRefinery4 = new Entity('copperRefinery4', 'building');
    copperRefinery4.x = 28;
    copperRefinery4.y = 26;
    copperRefinery4.add('Health', { current: 200, max: 200 });
    copperRefinery4.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery4.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery4.add('Equipment', {});
    useGame.getState().spawn(copperRefinery4);

    const advancedAssembler4 = new Entity('advancedAssembler4', 'building');
    advancedAssembler4.x = 29;
    advancedAssembler4.y = 26;
    advancedAssembler4.add('Health', { current: 300, max: 300 });
    advancedAssembler4.add('Production', { recipe: 'circuits', time: 3, progress: 0 });
    advancedAssembler4.add('Power', { production: 0, consumption: 15, connected: false });
    advancedAssembler4.add('Equipment', {});
    useGame.getState().spawn(advancedAssembler4);

    const machineGun4 = new Entity('machineGun4', 'building');
    machineGun4.x = 30;
    machineGun4.y = 26;
    machineGun4.add('Health', { current: 280, max: 280 });
    machineGun4.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun4.add('Equipment', {});
    useGame.getState().spawn(machineGun4);

    // ROW 27 (11 buildings)
    const laserTurret5 = new Entity('laserTurret5', 'building');
    laserTurret5.x = 20;
    laserTurret5.y = 27;
    laserTurret5.add('Health', { current: 250, max: 250 });
    laserTurret5.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret5.add('Equipment', {});
    useGame.getState().spawn(laserTurret5);

    const ironRefinery7 = new Entity('ironRefinery7', 'building');
    ironRefinery7.x = 21;
    ironRefinery7.y = 27;
    ironRefinery7.add('Health', { current: 200, max: 200 });
    ironRefinery7.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery7.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery7.add('Equipment', {});
    useGame.getState().spawn(ironRefinery7);

    const ironRefinery8 = new Entity('ironRefinery8', 'building');
    ironRefinery8.x = 22;
    ironRefinery8.y = 27;
    ironRefinery8.add('Health', { current: 200, max: 200 });
    ironRefinery8.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    ironRefinery8.add('Power', { production: 0, consumption: 5, connected: false });
    ironRefinery8.add('Equipment', {});
    useGame.getState().spawn(ironRefinery8);

    const droneBay7 = new Entity('droneBay7', 'building');
    droneBay7.x = 23;
    droneBay7.y = 27;
    droneBay7.add('Health', { current: 300, max: 300 });
    droneBay7.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay7.add('Equipment', {});
    useGame.getState().spawn(droneBay7);

    const storage12 = new Entity('storage12', 'building');
    storage12.x = 24;
    storage12.y = 27;
    storage12.add('Health', { current: 100, max: 100 });
    storage12.add('Equipment', {});
    useGame.getState().spawn(storage12);

    const storage13 = new Entity('storage13', 'building');
    storage13.x = 25;
    storage13.y = 27;
    storage13.add('Health', { current: 100, max: 100 });
    storage13.add('Equipment', {});
    useGame.getState().spawn(storage13);

    const storage14 = new Entity('storage14', 'building');
    storage14.x = 26;
    storage14.y = 27;
    storage14.add('Health', { current: 100, max: 100 });
    storage14.add('Equipment', {});
    useGame.getState().spawn(storage14);

    const droneBay8 = new Entity('droneBay8', 'building');
    droneBay8.x = 27;
    droneBay8.y = 27;
    droneBay8.add('Health', { current: 300, max: 300 });
    droneBay8.add('DroneBay', { productionTime: 15, productionProgress: 0 });
    droneBay8.add('Equipment', {});
    useGame.getState().spawn(droneBay8);

    const copperRefinery5 = new Entity('copperRefinery5', 'building');
    copperRefinery5.x = 28;
    copperRefinery5.y = 27;
    copperRefinery5.add('Health', { current: 200, max: 200 });
    copperRefinery5.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery5.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery5.add('Equipment', {});
    useGame.getState().spawn(copperRefinery5);

    const copperRefinery6 = new Entity('copperRefinery6', 'building');
    copperRefinery6.x = 29;
    copperRefinery6.y = 27;
    copperRefinery6.add('Health', { current: 200, max: 200 });
    copperRefinery6.add('Production', { recipe: 'copperPlates', time: 2, progress: 0 });
    copperRefinery6.add('Power', { production: 0, consumption: 5, connected: false });
    copperRefinery6.add('Equipment', {});
    useGame.getState().spawn(copperRefinery6);

    const laserTurret6 = new Entity('laserTurret6', 'building');
    laserTurret6.x = 30;
    laserTurret6.y = 27;
    laserTurret6.add('Health', { current: 250, max: 250 });
    laserTurret6.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret6.add('Equipment', {});
    useGame.getState().spawn(laserTurret6);

    // ROW 28 - Bottom defensive turret line (11 buildings)
    const generator8 = new Entity('generator8', 'building');
    generator8.x = 20;
    generator8.y = 28;
    generator8.add('Health', { current: 150, max: 150 });
    generator8.add('Power', { production: 20, consumption: 0, connected: true });
    generator8.add('Equipment', {});
    useGame.getState().spawn(generator8);

    const sniperTurret3 = new Entity('sniperTurret3', 'building');
    sniperTurret3.x = 21;
    sniperTurret3.y = 28;
    sniperTurret3.add('Health', { current: 200, max: 200 });
    sniperTurret3.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret3.add('Equipment', {});
    useGame.getState().spawn(sniperTurret3);

    const turret4 = new Entity('turret4', 'building');
    turret4.x = 22;
    turret4.y = 28;
    turret4.add('Health', { current: 300, max: 300 });
    turret4.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret4.add('Equipment', {});
    useGame.getState().spawn(turret4);

    const turret5 = new Entity('turret5', 'building');
    turret5.x = 23;
    turret5.y = 28;
    turret5.add('Health', { current: 300, max: 300 });
    turret5.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret5.add('Equipment', {});
    useGame.getState().spawn(turret5);

    const laserTurret7 = new Entity('laserTurret7', 'building');
    laserTurret7.x = 24;
    laserTurret7.y = 28;
    laserTurret7.add('Health', { current: 250, max: 250 });
    laserTurret7.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret7.add('Equipment', {});
    useGame.getState().spawn(laserTurret7);

    const laserTurret8 = new Entity('laserTurret8', 'building');
    laserTurret8.x = 25;
    laserTurret8.y = 28;
    laserTurret8.add('Health', { current: 250, max: 250 });
    laserTurret8.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret8.add('Equipment', {});
    useGame.getState().spawn(laserTurret8);

    const laserTurret9 = new Entity('laserTurret9', 'building');
    laserTurret9.x = 26;
    laserTurret9.y = 28;
    laserTurret9.add('Health', { current: 250, max: 250 });
    laserTurret9.add('Combat', { damage: 5, range: 12, fireRate: 3, timer: 0 });
    laserTurret9.add('Equipment', {});
    useGame.getState().spawn(laserTurret9);

    const turret6 = new Entity('turret6', 'building');
    turret6.x = 27;
    turret6.y = 28;
    turret6.add('Health', { current: 300, max: 300 });
    turret6.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret6.add('Equipment', {});
    useGame.getState().spawn(turret6);

    const sniperTurret4 = new Entity('sniperTurret4', 'building');
    sniperTurret4.x = 28;
    sniperTurret4.y = 28;
    sniperTurret4.add('Health', { current: 200, max: 200 });
    sniperTurret4.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret4.add('Equipment', {});
    useGame.getState().spawn(sniperTurret4);

    const cannon4 = new Entity('cannon4', 'building');
    cannon4.x = 29;
    cannon4.y = 28;
    cannon4.add('Health', { current: 400, max: 400 });
    cannon4.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon4.add('Equipment', {});
    useGame.getState().spawn(cannon4);

    const generator9 = new Entity('generator9', 'building');
    generator9.x = 30;
    generator9.y = 28;
    generator9.add('Health', { current: 150, max: 150 });
    generator9.add('Power', { production: 20, consumption: 0, connected: true });
    generator9.add('Equipment', {});
    useGame.getState().spawn(generator9);

    // ROW 29 - Heavy turret line (11 buildings)
    const machineGun5 = new Entity('machineGun5', 'building');
    machineGun5.x = 20;
    machineGun5.y = 29;
    machineGun5.add('Health', { current: 280, max: 280 });
    machineGun5.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun5.add('Equipment', {});
    useGame.getState().spawn(machineGun5);

    const cannon5 = new Entity('cannon5', 'building');
    cannon5.x = 21;
    cannon5.y = 29;
    cannon5.add('Health', { current: 400, max: 400 });
    cannon5.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon5.add('Equipment', {});
    useGame.getState().spawn(cannon5);

    const sniperTurret5 = new Entity('sniperTurret5', 'building');
    sniperTurret5.x = 22;
    sniperTurret5.y = 29;
    sniperTurret5.add('Health', { current: 200, max: 200 });
    sniperTurret5.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret5.add('Equipment', {});
    useGame.getState().spawn(sniperTurret5);

    const turret7 = new Entity('turret7', 'building');
    turret7.x = 23;
    turret7.y = 29;
    turret7.add('Health', { current: 300, max: 300 });
    turret7.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret7.add('Equipment', {});
    useGame.getState().spawn(turret7);

    const turret8 = new Entity('turret8', 'building');
    turret8.x = 24;
    turret8.y = 29;
    turret8.add('Health', { current: 300, max: 300 });
    turret8.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret8.add('Equipment', {});
    useGame.getState().spawn(turret8);

    const turret9 = new Entity('turret9', 'building');
    turret9.x = 25;
    turret9.y = 29;
    turret9.add('Health', { current: 300, max: 300 });
    turret9.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret9.add('Equipment', {});
    useGame.getState().spawn(turret9);

    const turret10 = new Entity('turret10', 'building');
    turret10.x = 26;
    turret10.y = 29;
    turret10.add('Health', { current: 300, max: 300 });
    turret10.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    turret10.add('Equipment', {});
    useGame.getState().spawn(turret10);

    const sniperTurret6 = new Entity('sniperTurret6', 'building');
    sniperTurret6.x = 27;
    sniperTurret6.y = 29;
    sniperTurret6.add('Health', { current: 200, max: 200 });
    sniperTurret6.add('Combat', { damage: 50, range: 15, fireRate: 0.33, timer: 0 });
    sniperTurret6.add('Equipment', {});
    useGame.getState().spawn(sniperTurret6);

    const cannon6 = new Entity('cannon6', 'building');
    cannon6.x = 28;
    cannon6.y = 29;
    cannon6.add('Health', { current: 400, max: 400 });
    cannon6.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon6.add('Equipment', {});
    useGame.getState().spawn(cannon6);

    const machineGun6 = new Entity('machineGun6', 'building');
    machineGun6.x = 29;
    machineGun6.y = 29;
    machineGun6.add('Health', { current: 280, max: 280 });
    machineGun6.add('Combat', { damage: 3, range: 7, fireRate: 5, timer: 0 });
    machineGun6.add('Equipment', {});
    useGame.getState().spawn(machineGun6);

    const cannon7 = new Entity('cannon7', 'building');
    cannon7.x = 30;
    cannon7.y = 29;
    cannon7.add('Health', { current: 400, max: 400 });
    cannon7.add('Combat', { damage: 40, range: 6, fireRate: 0.5, timer: 0 });
    cannon7.add('Equipment', {});
    useGame.getState().spawn(cannon7);

    // ROW 30 - WALL (11 walls)
    const wall1 = new Entity('wall1', 'building');
    wall1.x = 20;
    wall1.y = 30;
    wall1.add('Health', { current: 500, max: 500 });
    wall1.add('Equipment', {});
    useGame.getState().spawn(wall1);

    const wall2 = new Entity('wall2', 'building');
    wall2.x = 21;
    wall2.y = 30;
    wall2.add('Health', { current: 500, max: 500 });
    wall2.add('Equipment', {});
    useGame.getState().spawn(wall2);

    const wall3 = new Entity('wall3', 'building');
    wall3.x = 22;
    wall3.y = 30;
    wall3.add('Health', { current: 500, max: 500 });
    wall3.add('Equipment', {});
    useGame.getState().spawn(wall3);

    const wall4 = new Entity('wall4', 'building');
    wall4.x = 23;
    wall4.y = 30;
    wall4.add('Health', { current: 500, max: 500 });
    wall4.add('Equipment', {});
    useGame.getState().spawn(wall4);

    const wall5 = new Entity('wall5', 'building');
    wall5.x = 24;
    wall5.y = 30;
    wall5.add('Health', { current: 500, max: 500 });
    wall5.add('Equipment', {});
    useGame.getState().spawn(wall5);

    const wall6 = new Entity('wall6', 'building');
    wall6.x = 25;
    wall6.y = 30;
    wall6.add('Health', { current: 500, max: 500 });
    wall6.add('Equipment', {});
    useGame.getState().spawn(wall6);

    const wall7 = new Entity('wall7', 'building');
    wall7.x = 26;
    wall7.y = 30;
    wall7.add('Health', { current: 500, max: 500 });
    wall7.add('Equipment', {});
    useGame.getState().spawn(wall7);

    const wall8 = new Entity('wall8', 'building');
    wall8.x = 27;
    wall8.y = 30;
    wall8.add('Health', { current: 500, max: 500 });
    wall8.add('Equipment', {});
    useGame.getState().spawn(wall8);

    const wall9 = new Entity('wall9', 'building');
    wall9.x = 28;
    wall9.y = 30;
    wall9.add('Health', { current: 500, max: 500 });
    wall9.add('Equipment', {});
    useGame.getState().spawn(wall9);

    const wall10 = new Entity('wall10', 'building');
    wall10.x = 29;
    wall10.y = 30;
    wall10.add('Health', { current: 500, max: 500 });
    wall10.add('Equipment', {});
    useGame.getState().spawn(wall10);

    const wall11 = new Entity('wall11', 'building');
    wall11.x = 30;
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
