import { useGame } from '../core/Game';

export class UpgradeSystem {
  constructor() {
    this.upgradeTimer = 0;
    this.upgradeInterval = 60; // 60 seconds
  }

  update(dt) {
    const state = useGame.getState();

    // Don't count time if game is over or cards are showing
    if (state.gameOver || state.showUpgradeCards) return;

    this.upgradeTimer += dt;

    if (this.upgradeTimer >= this.upgradeInterval) {
      // Show upgrade cards and pause the game
      state.setShowUpgradeCards(true);
      if (!state.isPaused) {
        state.togglePause();
      }
      this.upgradeTimer = 0;
    }
  }
}
