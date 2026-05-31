export function calculateGuesserScore(
  elapsedSeconds: number,
  drawTimeSetting: number,
  guessPosition: number,
): number {
  const base = Math.max(50, 500 - elapsedSeconds * 5);
  const positionMultiplier = Math.max(0.5, 1 - (guessPosition - 1) * 0.1);
  return Math.round(base * positionMultiplier);
}

export function calculateDrawerBonus(correctGuessCount: number): number {
  return Math.min(100, correctGuessCount * 10);
}
