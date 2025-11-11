import { useGame } from '../core/Game';

export class PowerSystem {
  update() {
    const state = useGame.getState();

    let totalProduction = 0;
    let totalConsumption = 0;

    state.entities.forEach(e => {
      const power = e.get('Power');
      if (!power) return;

      if (power.production > 0) {
        totalProduction += power.production;
      }
      if (power.consumption > 0) {
        totalConsumption += power.consumption;
      }
    });

    const isPowered = totalProduction >= totalConsumption;

    state.entities.forEach(e => {
      const power = e.get('Power');
      if (!power) return;

      power.connected = isPowered;
    });
  }
}
