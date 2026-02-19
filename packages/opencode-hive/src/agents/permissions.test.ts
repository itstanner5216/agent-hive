import { describe, expect, it, afterEach, spyOn, mock } from 'bun:test';
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
  };
}

describe('Agent permissions', () => {
  afterEach(() => {
    mock.restore();
  });

  it('registers enki-planner, adapa, kulla, and nanshe in full mode', async () => {
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

    // Full mode: all 10 agents should be registered
    expect(opencodeConfig.agent?.['enki-planner']).toBeTruthy();
    expect(opencodeConfig.agent?.['nudimmud-orchestrator']).toBeTruthy();
    expect(opencodeConfig.agent?.['enlil-validator']).toBeTruthy();
    expect(opencodeConfig.agent?.['adapa-explorer']).toBeTruthy();
    expect(opencodeConfig.agent?.['kulla-coder']).toBeTruthy();
    expect(opencodeConfig.agent?.['nanshe-reviewer']).toBeTruthy();
    expect(opencodeConfig.agent?.['enbilulu-tester']).toBeTruthy();
    expect(opencodeConfig.agent?.['mushdamma-phase-reviewer']).toBeTruthy();
    expect(opencodeConfig.agent?.['isimud-ideator']).toBeTruthy();
    expect(opencodeConfig.agent?.['asalluhi-prompter']).toBeTruthy();
    expect(opencodeConfig.default_agent).toBe('enki-planner');

    const enkiPerm = opencodeConfig.agent?.['enki-planner']?.permission;
    expect(enkiPerm).toBeTruthy();
  });

  it('registers core agents in core mode', async () => {
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

    // Core mode: 6 pipeline agents
    expect(opencodeConfig.agent?.['enlil-validator']).toBeTruthy();
    expect(opencodeConfig.agent?.['enki-planner']).toBeTruthy();
    expect(opencodeConfig.agent?.['nudimmud-orchestrator']).toBeTruthy();
    expect(opencodeConfig.agent?.['adapa-explorer']).toBeTruthy();
    expect(opencodeConfig.agent?.['kulla-coder']).toBeTruthy();
    expect(opencodeConfig.agent?.['nanshe-reviewer']).toBeTruthy();

    // NOT in core mode
    expect(opencodeConfig.agent?.['enbilulu-tester']).toBeUndefined();
    expect(opencodeConfig.agent?.['mushdamma-phase-reviewer']).toBeUndefined();
    expect(opencodeConfig.agent?.['isimud-ideator']).toBeUndefined();
    expect(opencodeConfig.agent?.['asalluhi-prompter']).toBeUndefined();

    expect(opencodeConfig.default_agent).toBe('enki-planner');

    const nudimmudPerm = opencodeConfig.agent?.['nudimmud-orchestrator']?.permission;
    const enkiPerm = opencodeConfig.agent?.['enki-planner']?.permission;

    expect(nudimmudPerm).toBeTruthy();
    expect(enkiPerm).toBeTruthy();
    expect(enkiPerm!.edit).toBe('deny');
    expect(enkiPerm!.task).toBe('allow');
  });

  it('explicitly denies delegation tools for subagents', async () => {
    spyOn(ConfigService.prototype, 'get').mockReturnValue({
      agentMode: 'full',
      agents: {
        'adapa-explorer': {},
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

    const adapaPerm = opencodeConfig.agent?.['adapa-explorer']?.permission;
    const kullaPerm = opencodeConfig.agent?.['kulla-coder']?.permission;

    expect(adapaPerm).toBeTruthy();
    expect(adapaPerm!.task).toBe('deny');
    expect(adapaPerm!.edit).toBe('deny');

    expect(kullaPerm).toBeTruthy();
    expect(kullaPerm!.task).toBe('deny');
    expect(kullaPerm!.edit).toBe('allow');
  });
});
