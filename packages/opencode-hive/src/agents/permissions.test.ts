import { describe, expect, it, spyOn, afterEach, mock } from 'bun:test';
import { ConfigService } from 'hive-core';
import * as path from 'path';
import plugin from '../index';

type PluginInput = {
  directory: string;
  worktree: string;
  serverUrl: URL;
  project: { id: string; worktree: string; time: { created: number } };
  client: unknown;
  $: unknown;
};

function createStubShell(): unknown {
  const fn = ((..._args: unknown[]) => {
    throw new Error('shell not available in this test');
  }) as unknown as Record<string, unknown>;

  return Object.assign(fn, {
    braces(pattern: string) {
      return [pattern];
    },
    escape(input: string) {
      return input;
    },
    env() {
      return fn;
    },
    cwd() {
      return fn;
    },
    nothrow() {
      return fn;
    },
    throws() {
      return fn;
    },
  });
}

function createStubClient(): unknown {
  return {
    session: {
      create: async () => ({ data: { id: 'test-session' } }),
      prompt: async () => ({ data: {} }),
      get: async () => ({ data: { status: 'idle' } }),
      messages: async () => ({ data: [] }),
      abort: async () => {},
    },
    app: {
      agents: async () => ({ data: [] }),
      log: async () => {},
    },
    config: {
      get: async () => ({ data: {} }),
    },
  };
}

describe('Agent permissions', () => {
  afterEach(() => {
    mock.restore();
  });

  it('registers enki-planner, adapa, kulla, and nanshe in full mode', async () => {
    // Mock ConfigService to return full mode
    spyOn(ConfigService.prototype, 'get').mockReturnValue({
      agentMode: 'full',
      agents: {
        'enki-planner': {},
      }
    } as any);

    const repoRoot = path.resolve(import.meta.dir, '..', '..', '..', '..');

    const ctx: PluginInput = {
      directory: repoRoot,
      worktree: repoRoot,
      serverUrl: new URL('http://localhost:1'),
      project: { id: 'test', worktree: repoRoot, time: { created: Date.now() } },
      client: createStubClient(),
      $: createStubShell(),
    };

    const hooks = await plugin(ctx as any);
    
    const opencodeConfig: { 
      agent?: Record<string, { permission?: Record<string, string> }>,
      default_agent?: string 
    } = {};
    await hooks.config?.(opencodeConfig);

    expect(opencodeConfig.agent?.['enki-planner']).toBeTruthy();
    expect(opencodeConfig.agent?.['nudimmud-orchestrator']).toBeUndefined();
    expect(opencodeConfig.agent?.['enki-planner']).toBeUndefined();
    expect(opencodeConfig.agent?.['adapa-explorer']).toBeTruthy();
    expect(opencodeConfig.agent?.['kulla-coder']).toBeTruthy();
    expect(opencodeConfig.agent?.['nanshe-reviewer']).toBeTruthy();
    expect(opencodeConfig.default_agent).toBe('enki-planner');

    const hivePerm = opencodeConfig.agent?.['enki-planner']?.permission;
    expect(hivePerm).toBeTruthy();
  });

  it('registers core agents in core mode', async () => {
    // Mock ConfigService to return core mode
    spyOn(ConfigService.prototype, 'get').mockReturnValue({
      agentMode: 'core',
      agents: {
        'enki-planner': {},
        'nudimmud-orchestrator': {},
      }
    } as any);

    const repoRoot = path.resolve(import.meta.dir, '..', '..', '..', '..');

    const ctx: PluginInput = {
      directory: repoRoot,
      worktree: repoRoot,
      serverUrl: new URL('http://localhost:1'),
      project: { id: 'test', worktree: repoRoot, time: { created: Date.now() } },
      client: createStubClient(),
      $: createStubShell(),
    };

    const hooks = await plugin(ctx as any);
    
    const opencodeConfig: { 
      agent?: Record<string, { permission?: Record<string, string> }>,
      default_agent?: string 
    } = {};
    await hooks.config?.(opencodeConfig);

    expect(opencodeConfig.agent?.['enki-planner']).toBeUndefined();
    expect(opencodeConfig.agent?.['nudimmud-orchestrator']).toBeTruthy();
    expect(opencodeConfig.agent?.['enki-planner']).toBeTruthy();
    expect(opencodeConfig.agent?.['adapa-explorer']).toBeTruthy();
    expect(opencodeConfig.agent?.['kulla-coder']).toBeTruthy();
    expect(opencodeConfig.agent?.['nanshe-reviewer']).toBeTruthy();
    expect(opencodeConfig.default_agent).toBe('enki-planner');

    const swarmPerm = opencodeConfig.agent?.['nudimmud-orchestrator']?.permission;
    const architectPerm = opencodeConfig.agent?.['enki-planner']?.permission;

    expect(swarmPerm).toBeTruthy();
    expect(architectPerm).toBeTruthy();

    expect(architectPerm!.edit).toBe('deny');
    expect(architectPerm!.task).toBe('allow');
  });

  it('explicitly denies delegation tools for subagents', async () => {
    spyOn(ConfigService.prototype, 'get').mockReturnValue({
      agentMode: 'full',
      agents: {
        'enki-planner': {},
      },
    } as any);

    const repoRoot = path.resolve(import.meta.dir, '..', '..', '..', '..');

    const ctx: PluginInput = {
      directory: repoRoot,
      worktree: repoRoot,
      serverUrl: new URL('http://localhost:1'),
      project: { id: 'test', worktree: repoRoot, time: { created: Date.now() } },
      client: createStubClient(),
      $: createStubShell(),
    };

    const hooks = await plugin(ctx as any);
    const opencodeConfig: {
      agent?: Record<string, { permission?: Record<string, string> }>;
      default_agent?: string;
    } = {};
    await hooks.config?.(opencodeConfig);

    const subagentNames = ['adapa-explorer', 'kulla-coder', 'nanshe-reviewer'] as const;
    for (const name of subagentNames) {
      const perm = opencodeConfig.agent?.[name]?.permission;
      expect(perm).toBeTruthy();
      expect(perm!.task).toBe('deny');
      expect(perm!.delegate).toBe('deny');
    }
  });
});
