import { useEffect, useRef } from 'react';
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
import { RenderSystem } from './systems/RenderSystem';

class GameLoop {
  constructor(canvas) {
    this.waveSystem = new WaveSystem();
    this.systems = [
      this.waveSystem,
      new PathfindingSystem(),
      new MovementSystem(),
      new CombatSystem(),
      new ProjectileSystem(),
      new PowerSystem(),
      new ProductionSystem(),
      new ConveyorSystem(),
      new RenderSystem(canvas)
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
}

function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const { resources, entities, gameTime } = useGame();

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
    if (!canvasRef.current || gameRef.current) return;

    const game = new GameLoop(canvasRef.current);
    gameRef.current = game;
    game.start();

    const turret = new Entity('t1', 'building');
    turret.x = 25;
    turret.y = 25;
    turret.add('Health', { current: 300, max: 300 });
    turret.add('Combat', { damage: 25, range: 15, fireRate: 3, timer: 0 });
    turret.add('Equipment', {});
    useGame.getState().spawn(turret);

    const generator = new Entity('generator1', 'building');
    generator.x = 20;
    generator.y = 20;
    generator.add('Health', { current: 150, max: 150 });
    generator.add('Power', { production: 20, consumption: 0, connected: true });
    generator.add('Equipment', {});
    useGame.getState().spawn(generator);

    const refinery = new Entity('refinery1', 'building');
    refinery.x = 22;
    refinery.y = 20;
    refinery.add('Health', { current: 200, max: 200 });
    refinery.add('Production', { recipe: 'ironPlates', time: 2, progress: 0 });
    refinery.add('Power', { production: 0, consumption: 5, connected: false });
    refinery.add('Equipment', {});
    useGame.getState().spawn(refinery);

    const conveyor1 = new Entity('conveyor1', 'conveyor');
    conveyor1.x = 23;
    conveyor1.y = 20;
    conveyor1.add('Health', { current: 50, max: 50 });
    conveyor1.add('Conveyor', { items: [], speed: 1, dir: { x: 1, y: 0 } });
    conveyor1.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor1.add('Equipment', {});
    useGame.getState().spawn(conveyor1);

    const conveyor2 = new Entity('conveyor2', 'conveyor');
    conveyor2.x = 24;
    conveyor2.y = 20;
    conveyor2.add('Health', { current: 50, max: 50 });
    conveyor2.add('Conveyor', { items: [], speed: 1, dir: { x: 1, y: 0 } });
    conveyor2.add('Power', { production: 0, consumption: 1, connected: false });
    conveyor2.add('Equipment', {});
    useGame.getState().spawn(conveyor2);

    const storage = new Entity('storage1', 'building');
    storage.x = 25;
    storage.y = 20;
    storage.add('Health', { current: 100, max: 100 });
    storage.add('Equipment', {});
    useGame.getState().spawn(storage);
  }, []);

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
        <span style={{ marginRight: '20px' }}>Iron: {resources.iron || 0}</span>
        <span style={{ marginRight: '20px' }}>Copper: {resources.copper || 0}</span>
        <span style={{ marginRight: '20px' }}>Iron Plates: {resources.ironPlates || 0}</span>
        <span style={{ marginRight: '20px' }}>Copper Plates: {resources.copperPlates || 0}</span>
        <span style={{ marginRight: '20px' }}>Entities: {entities.size}</span>
        <span style={{ marginRight: '20px' }}>Wave: {gameRef.current?.getWaveNumber() || 0}</span>
        <span style={{ marginRight: '20px' }}>Next: {gameRef.current?.getNextWaveTimer() || '10.0'}s</span>
        <span style={{ marginRight: '20px' }}>Time: {gameTime.toFixed(1)}s</span>
        <span>FPS: {gameRef.current?.getFPS() || 0}</span>
      </div>
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
          padding: '10px'
        }}>
          <div style={{ color: '#888', fontSize: '12px' }}>
            Reserved for future features
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
