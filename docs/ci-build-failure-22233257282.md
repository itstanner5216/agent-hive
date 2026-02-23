# CI Build Failure Investigation

**Workflow Run**: [tctinh/agent-hive #22233257282](https://github.com/tctinh/agent-hive/actions/runs/22233257282/job/64476087990#step:5:1)  
**Branch**: `hook-cadence-fix` (PR #49)  
**Failed Step**: Step 5 — `Build hive-core` (`bun run build`)  
**Date**: 2026-02-23

## Error

```
src/services/configService.ts(85,27): error TS2304: Cannot find name 'merged'.
```

TypeScript compilation failed during the `tsc --emitDeclarationOnly` phase of the build. The bundler (`bun build`) succeeded, but the type checker caught a reference to an undefined variable.

## Root Cause

In `packages/hive-core/src/services/configService.ts`, the `get()` method's deep-merge logic has a bug where the merged config object is returned directly instead of being assigned to a variable:

```typescript
// BUGGY CODE (hook-cadence-fix branch)
get(): HiveConfig {
  // ...
  try {
    // ...
    const stored = JSON.parse(raw) as Partial<HiveConfig>;

    // Deep merge with defaults
    return {                    // ← Returns the object literal directly
      ...DEFAULT_HIVE_CONFIG,
      ...stored,
      agents: {
        ...DEFAULT_HIVE_CONFIG.agents,
        ...stored.agents,
        // ... agent-specific deep merges ...
      },
    };
    this.cachedConfig = merged; // ← Line 85: unreachable, 'merged' is undefined
    return this.cachedConfig;   // ← Also unreachable
  } catch {
    // ...
  }
}
```

The `return { ... }` statement on ~line 53 returns the object literal immediately, making lines 85–86 unreachable. Additionally, the variable `merged` was never declared — the intent was to assign the object to `const merged` before returning it.

This introduces two problems:
1. **TS2304 compile error**: `merged` is referenced but never defined
2. **Caching bug**: `this.cachedConfig` is never set on the success path, so the config is re-read and re-parsed on every call to `get()`

## Fix

Replace the direct `return` with a variable assignment:

```typescript
// FIXED CODE
get(): HiveConfig {
  // ...
  try {
    // ...
    const stored = JSON.parse(raw) as Partial<HiveConfig>;

    // Deep merge with defaults
    const merged = {            // ← Assign to variable instead of returning
      ...DEFAULT_HIVE_CONFIG,
      ...stored,
      agents: {
        ...DEFAULT_HIVE_CONFIG.agents,
        ...stored.agents,
        // ... agent-specific deep merges ...
      },
    };
    this.cachedConfig = merged; // ← Now reachable, 'merged' is defined
    return this.cachedConfig;
  } catch {
    // ...
  }
}
```

## Reproduction

```bash
cd packages/hive-core   # or packages/pantheon-core in the renamed fork
bun run build            # runs: bun build ... && tsc --emitDeclarationOnly
```

The `bun build` bundler step succeeds (it ignores type errors), but `tsc --emitDeclarationOnly` fails with the TS2304 error.

## Status

This bug has been fixed in the `itstanner5216/agent-hive` fork. The `get()` method in `packages/pantheon-core/src/services/configService.ts` correctly assigns the merged object to a `const merged` variable before caching and returning it.
