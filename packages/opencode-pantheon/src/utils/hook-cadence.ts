export function shouldExecuteHook(
  hookName: string,
  configService: { getHookCadence(name: string, opts?: { safetyCritical?: boolean }): number },
  turnCounters: Record<string, number>,
  options?: { safetyCritical?: boolean },
): boolean {
  const cadence = configService.getHookCadence(hookName, options);

  // Increment turn counter
  turnCounters[hookName] = (turnCounters[hookName] || 0) + 1;
  const currentTurn = turnCounters[hookName];

  // Cadence of 1 means fire every turn (no gating needed)
  if (cadence === 1) {
    return true;
  }

  // Fire on turns 1, (1+cadence), (1+2*cadence), ...
  // Using (currentTurn - 1) % cadence === 0 ensures turn 1 always fires
  return (currentTurn - 1) % cadence === 0;
}
