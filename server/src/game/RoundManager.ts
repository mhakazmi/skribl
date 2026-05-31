export class RoundManager {
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private hintTimeouts: ReturnType<typeof setTimeout>[] = [];

  startTimer(
    durationSeconds: number,
    onTick: (secondsLeft: number) => void,
    onExpire: () => void,
  ): void {
    let secondsLeft = durationSeconds;
    onTick(secondsLeft);

    this.timerInterval = setInterval(() => {
      secondsLeft--;
      onTick(secondsLeft);
      if (secondsLeft <= 0) {
        this.cancelTimer();
        onExpire();
      }
    }, 1000);
  }

  scheduleHints(
    word: string,
    durationSeconds: number,
    onHint: (revealedIndices: Set<number>) => void,
  ): void {
    const revealed = new Set<number>();
    const nonSpaceIndices = word
      .split('')
      .map((c, i) => (c !== ' ' ? i : -1))
      .filter(i => i !== -1);

    const reveal = () => {
      const unrevealed = nonSpaceIndices.filter(i => !revealed.has(i));
      if (unrevealed.length === 0) return;
      const idx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      revealed.add(idx);
      onHint(new Set(revealed));
    };

    const t1 = setTimeout(reveal, durationSeconds * 1000 * 0.5);
    const t2 = setTimeout(reveal, durationSeconds * 1000 * 0.75);
    this.hintTimeouts.push(t1, t2);
  }

  cancelTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  cancelAll(): void {
    this.cancelTimer();
    this.hintTimeouts.forEach(t => clearTimeout(t));
    this.hintTimeouts = [];
  }
}
