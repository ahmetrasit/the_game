import { useEffect, useRef } from 'react';
import { useGame } from './core/Game';
import { Entity } from './core/Entity';
import { CombatSystem } from './systems/CombatSystem';
import { RenderSystem } from './systems/RenderSystem';

class GameLoop {
  constructor(canvas) {
    this.systems = [
      new CombatSystem(),
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
}

function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const { resources, entities, gameTime } = useGame();

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new GameLoop(canvasRef.current);
    gameRef.current = game;
    game.start();

    const turret = new Entity('t1', 'building');
    turret.x = 25;
    turret.y = 25;
    turret.add('Health', { current: 300, max: 300 });
    turret.add('Combat', { damage: 10, range: 8, fireRate: 1, timer: 0 });
    useGame.getState().spawn(turret);

    const scout = new Entity('e1', 'enemy');
    scout.x = 30;
    scout.y = 30;
    scout.add('Health', { current: 50, max: 50 });
    useGame.getState().spawn(scout);

    console.log('Game initialized: 1 turret at (25,25), 1 enemy at (30,30)');
  }, []);

  return (
    <div style={{ textAlign: 'center', color: '#fff', fontFamily: 'monospace' }}>
      <h1 style={{ margin: '10px 0' }}>Tower Defense Factory</h1>
      <div style={{ marginBottom: '10px', fontSize: '14px' }}>
        <span style={{ marginRight: '20px' }}>Iron: {resources.iron}</span>
        <span style={{ marginRight: '20px' }}>Copper: {resources.copper}</span>
        <span style={{ marginRight: '20px' }}>Entities: {entities.size}</span>
        <span style={{ marginRight: '20px' }}>Time: {gameTime.toFixed(1)}s</span>
        <span>FPS: {gameRef.current?.getFPS() || 0}</span>
      </div>
      <canvas
        ref={canvasRef}
        id="game"
        width={1600}
        height={1600}
      />
    </div>
  );
}

export default App;
