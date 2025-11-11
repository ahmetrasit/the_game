import { useGame } from '../core/Game';

export class DeckShuffleSystem {
  constructor() {
    this.shuffleInterval = 30; // 30 seconds
  }

  update(dt) {
    const state = useGame.getState();

    // Don't run if game hasn't started or is over
    if (!state.gameStarted || state.gameOver || state.showUpgradeCards) return;

    // Increment timer
    const newTimer = state.deckShuffleTimer + dt;

    if (newTimer >= this.shuffleInterval) {
      // Shuffle the deck
      state.shuffleDeck();
      useGame.setState({ deckShuffleTimer: 0 });
    } else {
      useGame.setState({ deckShuffleTimer: newTimer });
    }
  }

  getTimeUntilShuffle() {
    const state = useGame.getState();
    return Math.max(0, this.shuffleInterval - state.deckShuffleTimer);
  }
}
