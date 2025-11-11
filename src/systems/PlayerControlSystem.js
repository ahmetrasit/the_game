import { useGame } from '../core/Game';

export class PlayerControlSystem {
  constructor() {
    this.keys = {
      left: false,
      right: false
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown(e) {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      this.keys.left = true;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      this.keys.right = true;
    }
  }

  handleKeyUp(e) {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      this.keys.left = false;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      this.keys.right = false;
    }
  }

  update(dt) {
    const state = useGame.getState();

    state.entities.forEach(entity => {
      const playerControlled = entity.get('PlayerControlled');
      if (!playerControlled) return;

      if (this.keys.left) {
        playerControlled.angle -= playerControlled.rotationSpeed * dt;
      }
      if (this.keys.right) {
        playerControlled.angle += playerControlled.rotationSpeed * dt;
      }

      // Normalize angle to 0-360
      playerControlled.angle = ((playerControlled.angle % 360) + 360) % 360;
    });
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
