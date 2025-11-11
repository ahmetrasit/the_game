import { useGame } from '../core/Game';
import { Entity } from '../core/Entity';

export class CollectorCarSystem {
  constructor() {
    this.spawnedCars = new Set(); // Track which garages have spawned cars
  }

  update(dt) {
    const state = useGame.getState();

    // Spawn collector cars for each car garage
    state.entities.forEach(entity => {
      if (entity.id.startsWith('carGarage') && !this.spawnedCars.has(entity.id)) {
        this.spawnCollectorCar(entity);
        this.spawnedCars.add(entity.id);
      }
    });

    // Update collector car behavior
    state.entities.forEach(car => {
      if (car.type !== 'collectorCar') return;

      const carComp = car.get('CollectorCar');
      if (!carComp) return;

      // If car is destroyed, remove it and allow respawn from garage
      const health = car.get('Health');
      if (health && health.current <= 0) {
        const garage = state.entities.get(carComp.garageId);
        if (garage) {
          this.spawnedCars.delete(carComp.garageId);
        }
        state.remove(car.id);
        return;
      }

      // State machine: IDLE -> COLLECTING -> RETURNING -> DEPOSITING -> IDLE
      if (carComp.state === 'idle') {
        // Find nearest resource drop
        const drop = this.findNearestResourceDrop(car, state);
        if (drop) {
          carComp.state = 'collecting';
          carComp.targetId = drop.id;
        }
      } else if (carComp.state === 'collecting') {
        const drop = state.entities.get(carComp.targetId);
        if (!drop) {
          // Resource was collected or disappeared
          carComp.state = 'idle';
          carComp.targetId = null;
          return;
        }

        // Move towards resource drop
        this.moveTowards(car, drop, dt);

        // Check if reached drop
        const dist = Math.hypot(car.x - drop.x, car.y - drop.y);
        if (dist < 0.5) {
          // Pick up resource
          const dropComp = drop.get('ResourceDrop');
          if (dropComp) {
            carComp.carrying = {
              type: dropComp.resourceType,
              amount: dropComp.amount
            };
            state.remove(drop.id);
            carComp.state = 'returning';
            carComp.targetId = null;
          }
        }
      } else if (carComp.state === 'returning') {
        // Find nearest storage
        const storage = this.findNearestStorage(car, state);
        if (!storage) {
          // No storage available, go idle
          carComp.state = 'idle';
          return;
        }

        // Move towards storage
        this.moveTowards(car, storage, dt);

        // Check if reached storage
        const dist = Math.hypot(car.x - storage.x, car.y - storage.y);
        if (dist < 1.5) {
          // Deposit resources
          if (carComp.carrying) {
            state.addResource(carComp.carrying.type, carComp.carrying.amount);
            carComp.carrying = null;
          }
          carComp.state = 'idle';
        }
      }
    });
  }

  spawnCollectorCar(garage) {
    const state = useGame.getState();
    const car = new Entity(`car_${garage.id}`, 'collectorCar');
    car.x = garage.x;
    car.y = garage.y;

    car.add('Health', { current: 50, max: 50 });
    car.add('CollectorCar', {
      garageId: garage.id,
      state: 'idle', // idle, collecting, returning
      targetId: null,
      carrying: null, // { type: 'iron', amount: 5 }
      speed: 3
    });
    car.add('Equipment', {});

    state.spawn(car);
  }

  findNearestResourceDrop(car, state) {
    let nearest = null;
    let nearestDist = Infinity;

    state.entities.forEach(entity => {
      if (entity.type !== 'resourceDrop') return;

      const dist = Math.hypot(car.x - entity.x, car.y - entity.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = entity;
      }
    });

    return nearest;
  }

  findNearestStorage(car, state) {
    let nearest = null;
    let nearestDist = Infinity;

    state.entities.forEach(entity => {
      if (!entity.id.startsWith('storage')) return;

      const dist = Math.hypot(car.x - entity.x, car.y - entity.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = entity;
      }
    });

    return nearest;
  }

  moveTowards(car, target, dt) {
    const dx = target.x - car.x;
    const dy = target.y - car.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.1) {
      const carComp = car.get('CollectorCar');
      const speed = carComp.speed * (useGame.getState().globalSpeedModifier || 1);
      car.x += (dx / dist) * speed * dt;
      car.y += (dy / dist) * speed * dt;
    }
  }
}
