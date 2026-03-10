/**
 * Tests for the `getNextAction` function inside `pantheon_status`.
 *
 * getNextAction is a private closure; we exercise it via the pantheon_status
 * tool's `nextAction` field in its JSON output.
 */

import { describe, it, expect, afterEach, beforeAll, afterAll, spyOn, mock } from 'bun:test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  ConfigService,
  FeatureService,
  TaskService,
  PlanService,
  WorktreeService,
  ContextService,
} from 'pantheon-core';
import plugin from '../index.js';

// ---------------------------------------------------------------------------
// Stubs
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
// Helper: build pantheon_status tool
// ---------------------------------------------------------------------------

describe('getNextAction (via pantheon_status nextAction field)', () => {
  let tmpdir: string;

  beforeAll(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-gna-test-'));
    fs.mkdirSync(path.join(tmpdir, '.pantheon'), { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpdir, { recursive: true, force: true });
  });

  afterEach(() => {
    mock.restore();
  });

  async function buildStatusTool(
    dir: string,
    featureStatus: 'planning' | 'approved' | 'executing' | 'completed',
    tasks: Array<{ folder: string; status: string; origin?: string; name?: string }>,
  ) {
    spyOn(ConfigService.prototype, 'get').mockReturnValue({ agentMode: 'full', agents: {} } as any);
    spyOn(ConfigService.prototype, 'getDisabledMcps').mockReturnValue([]);
    spyOn(ConfigService.prototype, 'getDisabledSkills').mockReturnValue([]);
    spyOn(ConfigService.prototype, 'init').mockReturnValue(undefined as any);

    // Feature service
    const featureJson = {
      name: 'test-feature',
      status: featureStatus,
      createdAt: new Date().toISOString(),
    };
    spyOn(FeatureService.prototype, 'get').mockReturnValue(featureJson as any);
    spyOn(FeatureService.prototype, 'list').mockReturnValue(['test-feature']);

    // Task service
    const taskInfos = tasks.map(t => ({
      folder: t.folder,
      name: t.name ?? t.folder,
      status: t.status,
      origin: t.origin ?? 'plan',
    }));
    spyOn(TaskService.prototype, 'list').mockReturnValue(taskInfos as any);
    spyOn(TaskService.prototype, 'getRawStatus').mockImplementation((_feature, folder) => {
      return { status: tasks.find(t => t.folder === folder)?.status ?? 'pending', origin: 'plan', dependsOn: [] } as any;
    });

    // Plan service — return plan so it doesn't block
    spyOn(PlanService.prototype, 'read').mockReturnValue({
      content: '# Plan\n\n## Discovery\n\nSome notes.\n\n### 1. test',
      comments: [],
    } as any);

    // Worktree — return null for all
    spyOn(WorktreeService.prototype, 'get').mockResolvedValue(null as any);

    // Context — none
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
    return (hooks.tool as any).pantheon_status;
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

  async function getNextAction(
    featureStatus: 'planning' | 'approved' | 'executing' | 'completed',
    tasks: Array<{ folder: string; status: string }>,
  ): Promise<string> {
    const tool = await buildStatusTool(tmpdir, featureStatus, tasks);
    const raw = await tool.execute({ feature: 'test-feature' }, makeToolCtx(tmpdir));
    const parsed = JSON.parse(raw);
    return parsed.nextAction as string;
  }

  // -------------------------------------------------------------------------
  // Cases
  // -------------------------------------------------------------------------

  it('returns verify nudge when all tasks are done', async () => {
    const action = await getNextAction('executing', [
      { folder: '01-a', status: 'done' },
      { folder: '02-b', status: 'done' },
    ]);
    expect(action).toContain('All tasks done');
    expect(action).toContain('pantheon_feature_complete');
    expect(action).toContain('verificationEvidence');
  });

  it('returns single-worker hint when one task is in_progress', async () => {
    const action = await getNextAction('executing', [
      { folder: '01-a', status: 'in_progress' },
      { folder: '02-b', status: 'pending' },
    ]);
    expect(action).toContain('Worker running for: 01-a');
    expect(action).toContain('wait for task() to return');
  });

  it('returns parallel-worker hint listing all in-progress folders when multiple tasks are in_progress', async () => {
    const action = await getNextAction('executing', [
      { folder: '01-a', status: 'in_progress' },
      { folder: '02-b', status: 'in_progress' },
    ]);
    expect(action).toContain('workers running in parallel');
    expect(action).toContain('01-a');
    expect(action).toContain('02-b');
    expect(action).toContain('merge sequentially');
  });

  it('returns runnable hint for a single ready task', async () => {
    const action = await getNextAction('executing', [
      { folder: '01-a', status: 'pending' },
    ]);
    expect(action).toContain('Start next task with pantheon_worktree_create');
    expect(action).toContain('01-a');
  });

  it('returns task-sync hint when no tasks exist yet', async () => {
    const action = await getNextAction('approved', []);
    expect(action).toContain('Generate tasks from plan with pantheon_tasks_sync');
  });
});
