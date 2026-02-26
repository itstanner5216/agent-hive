const fallbackTurnCounters: Record<string, number> = {};

export function shouldExecuteHook(
  hookName: string,
  configService: { getHookCadence(name: string, opts?: { safetyCritical?: boolean }): number } | undefined,
  turnCounters: Record<string, number> | undefined,
  options?: { safetyCritical?: boolean },
): boolean {
  // During early hook execution, config service may not be initialized yet.
  const cadence = configService?.getHookCadence(hookName, options) ?? 1;
  const counters = turnCounters ?? fallbackTurnCounters;

  // Increment turn counter
  counters[hookName] = (counters[hookName] || 0) + 1;
  const currentTurn = counters[hookName];

  // Cadence of 1 means fire every turn (no gating needed)
  if (cadence === 1) {
    return true;
  }

  // Fire on turns 1, (1+cadence), (1+2*cadence), ...
  // Using (currentTurn - 1) % cadence === 0 ensures turn 1 always fires
  return (currentTurn - 1) % cadence === 0;
}
