import { useGame } from '../core/Game';
import { Entity } from '../core/Entity';
import entitiesData from '../data/entities.json';

export class DroneSystem {
  constructor() {
    this.nextDroneId = 0;
  }

  update(dt) {
    const state = useGame.getState();

    // Calculate max drones: 5 base + 3 per additional drone bay
    const droneBayCount = Array.from(state.entities.values()).filter(
      e => e.id.startsWith('droneBay')
    ).length;
    const maxDrones = 5 + (droneBayCount > 0 ? (droneBayCount - 1) * 3 : 0);

    // Count active drones
    const activeDrones = Array.from(state.entities.values()).filter(
      e => e.type === 'drone'
    );
    const currentDroneCount = activeDrones.length;

    // Update drone bays (production)
    state.entities.forEach(entity => {
      if (!entity.id.startsWith('droneBay')) return;

      const droneBay = entity.get('DroneBay');
      if (!droneBay) return;

      // Only produce if under max capacity
      if (currentDroneCount < maxDrones) {
        droneBay.productionProgress = (droneBay.productionProgress || 0) + dt;

        if (droneBay.productionProgress >= droneBay.productionTime) {
          // Check if we can afford the drone
          const cost = entitiesData.droneBay.droneCost;
          const canAfford = Object.entries(cost).every(
            ([resource, amount]) => (state.resources[resource] || 0) >= amount
          );

          if (canAfford) {
            // Deduct resources
            Object.entries(cost).forEach(([resource, amount]) => {
              state.addResource(resource, -amount);
            });

            // Spawn drone
            this.spawnDrone(entity.x, entity.y);
            droneBay.productionProgress = 0;
          } else {
            // Can't afford, wait
            droneBay.productionProgress = droneBay.productionTime;
          }
        }
      } else {
        // Reset progress if at max capacity
        droneBay.productionProgress = 0;
      }
    });

    // Update drones (movement and repair)
    const dronesToRemove = [];
    activeDrones.forEach(drone => {
      const droneComp = drone.get('Drone');
      if (!droneComp) return;

      // Find damaged building (including player turret and walls)
      const target = this.findDamagedBuilding(drone, state);

      if (target) {
        droneComp.targetId = target.id;
        droneComp.targetX = target.x;
        droneComp.targetY = target.y;

        // Move towards target
        const dx = target.x - drone.x;
        const dy = target.y - drone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.5) {
          // Move towards target
          const speed = droneComp.speed;
          drone.x += (dx / distance) * speed * dt;
          drone.y += (dy / distance) * speed * dt;
        } else {
          // At target, repair it
          const health = target.get('Health');
          if (health && health.current < health.max) {
            const repairAmount = Math.min(
              droneComp.repairRate * dt,
              health.max - health.current,
              droneComp.healCapacity
            );

            health.current += repairAmount;
            droneComp.healCapacity -= repairAmount;

            // Remove drone if depleted
            if (droneComp.healCapacity <= 0) {
              dronesToRemove.push(drone.id);
            }
          }
        }
      } else {
        // No damaged buildings, idle at current position
        droneComp.targetId = null;
      }
    });

    dronesToRemove.forEach(id => state.remove(id));
  }

  spawnDrone(x, y) {
    const state = useGame.getState();
    const drone = new Entity(`drone_${this.nextDroneId++}`, 'drone');
    drone.x = x;
    drone.y = y;

    drone.add('Drone', {
      speed: 5, // tiles per second
      repairRate: 10, // HP per second
      healCapacity: 100, // total HP can heal
      targetId: null,
      targetX: null,
      targetY: null
    });

    state.spawn(drone);
  }

  findDamagedBuilding(drone, state) {
    let closest = null;
    let minDistance = Infinity;

    state.entities.forEach(other => {
      if (other.type !== 'building') return;

      const health = other.get('Health');
      if (!health || health.current >= health.max) return;

      const dx = other.x - drone.x;
      const dy = other.y - drone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        closest = other;
        minDistance = distance;
      }
    });

    return closest;
  }
}
