import { describe, expect, it, afterEach, spyOn, mock } from 'bun:test';
import { ConfigService } from 'pantheon-core';
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

  it('registers 8 active agents in full mode (Isimud and Mushdamma benched)', async () => {
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

    // Full mode: 8 active agents
    expect(opencodeConfig.agent?.['enki-planner']).toBeTruthy();
    expect(opencodeConfig.agent?.['marduk-orchestrator']).toBeTruthy();
    expect(opencodeConfig.agent?.['enlil-validator']).toBeTruthy();
    expect(opencodeConfig.agent?.['adapa-explorer']).toBeTruthy();
    expect(opencodeConfig.agent?.['kulla-coder']).toBeTruthy();
    expect(opencodeConfig.agent?.['nanshe-reviewer']).toBeTruthy();
    expect(opencodeConfig.agent?.['enbilulu-tester']).toBeTruthy();
    expect(opencodeConfig.agent?.['asalluhi-prompter']).toBeTruthy();

    // Benched agents must NOT be registered
    expect(opencodeConfig.agent?.['isimud-ideator']).toBeUndefined();
    expect(opencodeConfig.agent?.['mushdamma-phase-reviewer']).toBeUndefined();

    // Verify count
    expect(Object.keys(opencodeConfig.agent!).length).toBe(8);

    expect(opencodeConfig.default_agent).toBe('enki-planner');

    const enkiPerm = opencodeConfig.agent?.['enki-planner']?.permission;
    expect(enkiPerm).toBeTruthy();
  });

  it('registers core agents in core mode', async () => {
    spyOn(ConfigService.prototype, 'get').mockReturnValue({
      agentMode: 'core',
      agents: {
        'enki-planner': {},
        'marduk-orchestrator': {},
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
    expect(opencodeConfig.agent?.['marduk-orchestrator']).toBeTruthy();
    expect(opencodeConfig.agent?.['adapa-explorer']).toBeTruthy();
    expect(opencodeConfig.agent?.['kulla-coder']).toBeTruthy();
    expect(opencodeConfig.agent?.['nanshe-reviewer']).toBeTruthy();

    // NOT in core mode
    expect(opencodeConfig.agent?.['enbilulu-tester']).toBeUndefined();
    expect(opencodeConfig.agent?.['asalluhi-prompter']).toBeUndefined();

    // Benched agents never registered regardless of mode
    expect(opencodeConfig.agent?.['isimud-ideator']).toBeUndefined();
    expect(opencodeConfig.agent?.['mushdamma-phase-reviewer']).toBeUndefined();

    expect(opencodeConfig.default_agent).toBe('enki-planner');

    const mardukPerm = opencodeConfig.agent?.['marduk-orchestrator']?.permission;
    const enkiPerm = opencodeConfig.agent?.['enki-planner']?.permission;

    expect(mardukPerm).toBeTruthy();
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

  describe('lean mode', () => {
    it('registers exactly 4 agents in lean mode', async () => {
      spyOn(ConfigService.prototype, 'get').mockReturnValue({
        agentMode: 'lean',
        agents: {},
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

      // Lean mode: 4 essential agents
      expect(opencodeConfig.agent?.['enki-planner']).toBeTruthy();
      expect(opencodeConfig.agent?.['marduk-orchestrator']).toBeTruthy();
      expect(opencodeConfig.agent?.['kulla-coder']).toBeTruthy();
      expect(opencodeConfig.agent?.['adapa-explorer']).toBeTruthy();

      // Agents excluded from lean mode must NOT be registered
      expect(opencodeConfig.agent?.['enbilulu-tester']).toBeUndefined();
      expect(opencodeConfig.agent?.['nanshe-reviewer']).toBeUndefined();
      expect(opencodeConfig.agent?.['enlil-validator']).toBeUndefined();
      expect(opencodeConfig.agent?.['asalluhi-prompter']).toBeUndefined();

      // Benched agents never registered
      expect(opencodeConfig.agent?.['isimud-ideator']).toBeUndefined();
      expect(opencodeConfig.agent?.['mushdamma-phase-reviewer']).toBeUndefined();

      // Verify count
      expect(Object.keys(opencodeConfig.agent!).length).toBe(4);

      expect(opencodeConfig.default_agent).toBe('enki-planner');
    });

    it('lean mode agents have permissions set', async () => {
      spyOn(ConfigService.prototype, 'get').mockReturnValue({
        agentMode: 'lean',
        agents: {},
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

      expect(opencodeConfig.agent?.['enki-planner']?.permission).toBeTruthy();
      expect(opencodeConfig.agent?.['marduk-orchestrator']?.permission).toBeTruthy();
      expect(opencodeConfig.agent?.['kulla-coder']?.permission).toBeTruthy();
      expect(opencodeConfig.agent?.['adapa-explorer']?.permission).toBeTruthy();
    });
  });

  it('asalluhi has critical implementer permissions', async () => {
    spyOn(ConfigService.prototype, 'get').mockReturnValue({
      agentMode: 'full',
      agents: {
        'asalluhi-prompter': {},
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

    const asalluhiPerm = opencodeConfig.agent?.['asalluhi-prompter']?.permission;
    expect(asalluhiPerm).toBeTruthy();
    expect(asalluhiPerm!.edit).toBe('allow');
    expect(asalluhiPerm!.task).toBe('deny');
    expect(asalluhiPerm!.delegate).toBe('deny');
    expect(asalluhiPerm!.webfetch).toBe('allow');
    expect(asalluhiPerm!.skill).toBe('allow');
    expect(asalluhiPerm!.todoread).toBe('allow');
  });
});
