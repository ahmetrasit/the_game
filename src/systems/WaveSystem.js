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
    const state = useGame.getState();

    // Scale enemy count: start at 5, add 2 per wave
    const enemyCount = 5 + (this.waveNumber - 1) * 2;

    // Scale enemy stats
    const baseHP = 50;
    const baseSpeed = 2;
    const baseDamage = 5;

    // +10% HP per wave
    const hp = Math.floor(baseHP * Math.pow(1.1, this.waveNumber - 1));
    // +5% speed per wave
    const baseSpeedScaled = baseSpeed * Math.pow(1.05, this.waveNumber - 1);
    // Apply global enemy speed modifier
    const speed = baseSpeedScaled * (state.enemySpeedModifier || 1);
    // +5% damage per wave
    const damage = Math.floor(baseDamage * Math.pow(1.05, this.waveNumber - 1));

    for (let i = 0; i < enemyCount; i++) {
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

      e.add('Health', { current: hp, max: hp });
      e.add('Movement', { speed: speed, target: { x: 25, y: 25 }, path: null });
      e.add('Combat', { damage: damage, fireRate: 1, timer: 0 });
      e.add('Equipment', {});

      useGame.getState().spawn(e);
    }
  }

  getWaveNumber() {
    return this.waveNumber;
  }
}
