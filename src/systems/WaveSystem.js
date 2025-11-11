import { useGame } from '../core/Game';
import { Entity } from '../core/Entity';

export class WaveSystem {
  constructor() {
    this.timer = 0;
    this.waveNumber = 0;
  }

  update(dt) {
    this.timer += dt;

    if (this.timer >= 10) {
      this.spawnWave();
      this.timer = 0;
    }
  }

  spawnWave() {
    this.waveNumber++;

    for (let i = 0; i < 5; i++) {
      const e = new Entity(`e${Date.now()}_${i}`, 'enemy');

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
  }

  getWaveNumber() {
    return this.waveNumber;
  }
}
