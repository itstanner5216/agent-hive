/**
 * Tests for the `agent` parameter on `pantheon_worktree_create`.
 *
 * Verifies that the agent param correctly flows through to taskToolCall.subagent_type
 * in the tool's JSON output, which is what Nudimmud reads to dispatch the right worker.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, spyOn, mock } from 'bun:test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  ConfigService,
  WorktreeService,
  TaskService,
  PlanService,
  ContextService,
} from 'pantheon-core';
import plugin from '../index.js';

// ---------------------------------------------------------------------------
// Stubs (same pattern as permissions.test.ts)
// ---------------------------------------------------------------------------

function createStubShell(): unknown {
  const fn = ((..._args: unknown[]) => {
    throw new Error('shell not available in this test');
  }) as unknown as Record<string, unknown>;

  return Object.assign(fn, {
    braces(pattern: string) { return [pattern]; },
    escape(input: string) { return input; },
    env() { return fn; },
    cwd() { return fn; },
    nothrow() { return fn; },
    throws() { return fn; },
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('pantheon_worktree_create — agent param', () => {
  let tmpdir: string;

  beforeAll(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-worktree-agent-test-'));
    // The writeWorkerPromptFile util needs the .pantheon dir to exist
    fs.mkdirSync(path.join(tmpdir, '.pantheon'), { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpdir, { recursive: true, force: true });
  });

  afterEach(() => {
    mock.restore();
  });

  /**
   * Build a plugin instance with all heavy services mocked so we can call
   * pantheon_worktree_create without a real git repo or filesystem structure.
   */
  async function buildWorktreeTool(dir: string) {
    // Config service — return minimal valid config
    spyOn(ConfigService.prototype, 'get').mockReturnValue({ agentMode: 'full', agents: {} } as any);
    spyOn(ConfigService.prototype, 'getDisabledMcps').mockReturnValue([]);
    spyOn(ConfigService.prototype, 'getDisabledSkills').mockReturnValue([]);
    spyOn(ConfigService.prototype, 'init').mockReturnValue(undefined as any);

    // WorktreeService.create — skip real git worktree add
    const fakeWorktree = {
      path: path.join(dir, '.pantheon', '.worktrees', 'test-feature', '01-test-task'),
      branch: 'pantheon/test-feature/01-test-task',
      commit: 'deadbeef',
      feature: 'test-feature',
      step: '01-test-task',
    };
    spyOn(WorktreeService.prototype, 'create').mockResolvedValue(fakeWorktree as any);
    spyOn(WorktreeService.prototype, 'get').mockResolvedValue(null as any);

    // TaskService — return minimal task metadata
    const fakeTask = {
      folder: '01-test-task',
      name: 'Test Task',
      planTitle: 'Test Task',
      status: 'pending',
      origin: 'plan',
    };
    spyOn(TaskService.prototype, 'get').mockReturnValue(fakeTask as any);
    spyOn(TaskService.prototype, 'list').mockReturnValue([fakeTask] as any);
    spyOn(TaskService.prototype, 'getRawStatus').mockReturnValue({
      name: 'Test Task',
      status: 'pending',
      planTitle: 'Test Task',
      dependsOn: [],
    } as any);
    spyOn(TaskService.prototype, 'update').mockReturnValue(fakeTask as any);
    spyOn(TaskService.prototype, 'buildSpecContent').mockReturnValue('# Task Spec\n\nDo the thing.');
    spyOn(TaskService.prototype, 'writeSpec').mockReturnValue(undefined as any);
    spyOn(TaskService.prototype, 'patchBackgroundFields').mockReturnValue(undefined as any);

    // PlanService
    spyOn(PlanService.prototype, 'read').mockReturnValue({
      content: '# Plan\n\n## Discovery\n\nQ&A here.\n\n### 1. Test Task\n\nDo the thing.',
      comments: [],
    } as any);

    // ContextService
    spyOn(ContextService.prototype, 'list').mockReturnValue([]);

    const ctx = {
      directory: dir,
      worktree: dir,
      serverUrl: new URL('http://localhost:1'),
      project: { id: 'test', worktree: dir, time: { created: Date.now() } },
      client: createStubClient(),
      $: createStubShell(),
    };

    const hooks = await plugin(ctx as any);
    return (hooks.tool as any).pantheon_worktree_create;
  }

  const makeToolCtx = (dir: string) => ({
    sessionID: 'test-session',
    messageID: 'test-message',
    agent: 'marduk-orchestrator',
    directory: dir,
    worktree: dir,
    abort: new AbortController().signal,
    metadata: () => {},
    ask: async () => {},
  });

  it('uses asalluhi-prompter when agent: "asalluhi-prompter" is passed', async () => {
    const worktreeTool = await buildWorktreeTool(tmpdir);

    const result = await worktreeTool.execute(
      { task: '01-test-task', feature: 'test-feature', agent: 'asalluhi-prompter' },
      makeToolCtx(tmpdir),
    );

    const parsed = JSON.parse(result);
    expect(parsed.taskToolCall.subagent_type).toBe('asalluhi-prompter');
    expect(parsed.agent).toBe('asalluhi-prompter');
    // Instructions should reference Asalluhi, not Kulla
    expect(parsed.instructions).toContain('Asalluhi (Critical Implementer)');
    expect(parsed.instructions).not.toContain('Kulla (Coder)');
  });

  it('uses kulla-coder when agent param is omitted (default)', async () => {
    const worktreeTool = await buildWorktreeTool(tmpdir);

    const result = await worktreeTool.execute(
      { task: '01-test-task', feature: 'test-feature' },
      makeToolCtx(tmpdir),
    );

    const parsed = JSON.parse(result);
    expect(parsed.taskToolCall.subagent_type).toBe('kulla-coder');
    expect(parsed.agent).toBe('kulla-coder');
    // Instructions should reference Kulla, not Asalluhi
    expect(parsed.instructions).toContain('Kulla (Coder)');
    expect(parsed.instructions).not.toContain('Asalluhi (Critical Implementer)');
  });

  it('uses kulla-coder when agent: "kulla-coder" is passed explicitly', async () => {
    const worktreeTool = await buildWorktreeTool(tmpdir);

    const result = await worktreeTool.execute(
      { task: '01-test-task', feature: 'test-feature', agent: 'kulla-coder' },
      makeToolCtx(tmpdir),
    );

    const parsed = JSON.parse(result);
    expect(parsed.taskToolCall.subagent_type).toBe('kulla-coder');
    expect(parsed.agent).toBe('kulla-coder');
  });
});
