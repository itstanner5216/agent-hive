/**
 * Tests for `pantheon_feature_complete` tool.
 *
 * Verifies that the tool blocks completion without verificationEvidence
 * and succeeds when evidence >= 20 chars is provided.
 */

import { describe, it, expect, afterEach, beforeAll, afterAll, spyOn, mock } from 'bun:test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ConfigService, FeatureService } from 'pantheon-core';
import plugin from '../index.js';

// ---------------------------------------------------------------------------
// Stubs (same pattern as worktree-agent.test.ts)
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

describe('pantheon_feature_complete — verificationEvidence gate', () => {
  let tmpdir: string;

  beforeAll(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-fc-test-'));
    fs.mkdirSync(path.join(tmpdir, '.pantheon'), { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpdir, { recursive: true, force: true });
  });

  afterEach(() => {
    mock.restore();
  });

  async function buildFeatureCompleteTool(dir: string) {
    spyOn(ConfigService.prototype, 'get').mockReturnValue({ agentMode: 'full', agents: {} } as any);
    spyOn(ConfigService.prototype, 'getDisabledMcps').mockReturnValue([]);
    spyOn(ConfigService.prototype, 'getDisabledSkills').mockReturnValue([]);
    spyOn(ConfigService.prototype, 'init').mockReturnValue(undefined as any);

    const ctx = {
      directory: dir,
      worktree: dir,
      serverUrl: new URL('http://localhost:1'),
      project: { id: 'test', worktree: dir, time: { created: Date.now() } },
      client: createStubClient(),
      $: createStubShell(),
    };

    const hooks = await plugin(ctx as any);
    return (hooks.tool as any).pantheon_feature_complete;
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

  it('is blocked when verificationEvidence is omitted / empty string', async () => {
    const tool = await buildFeatureCompleteTool(tmpdir);
    const result = await tool.execute(
      { name: 'test-feature', verificationEvidence: '' },
      makeToolCtx(tmpdir),
    );
    expect(result).toContain('BLOCKED');
    expect(result).toContain('Verification evidence required');
  });

  it('is blocked when verificationEvidence is under 20 chars', async () => {
    const tool = await buildFeatureCompleteTool(tmpdir);
    const result = await tool.execute(
      { name: 'test-feature', verificationEvidence: 'tests pass' }, // 10 chars
      makeToolCtx(tmpdir),
    );
    expect(result).toContain('BLOCKED');
  });

  it('is blocked when verificationEvidence is exactly 19 chars', async () => {
    const tool = await buildFeatureCompleteTool(tmpdir);
    const result = await tool.execute(
      { name: 'test-feature', verificationEvidence: '1234567890123456789' }, // 19 chars
      makeToolCtx(tmpdir),
    );
    expect(result).toContain('BLOCKED');
  });

  it('succeeds when verificationEvidence is exactly 20 chars', async () => {
    spyOn(FeatureService.prototype, 'complete').mockReturnValue(undefined as any);
    const tool = await buildFeatureCompleteTool(tmpdir);
    const result = await tool.execute(
      { name: 'test-feature', verificationEvidence: '12345678901234567890' }, // 20 chars
      makeToolCtx(tmpdir),
    );
    expect(result).toContain('marked as completed');
    expect(result).toContain('test-feature');
  });

  it('succeeds with a descriptive evidence summary', async () => {
    spyOn(FeatureService.prototype, 'complete').mockReturnValue(undefined as any);
    const tool = await buildFeatureCompleteTool(tmpdir);
    const result = await tool.execute(
      {
        name: 'my-feature',
        verificationEvidence: 'All 181 tests pass (bun test). Manual smoke test of the worktree flow confirmed end-to-end.',
      },
      makeToolCtx(tmpdir),
    );
    expect(result).toContain('marked as completed');
    expect(result).toContain('my-feature');
    expect(result).toContain('All 181 tests pass');
  });

  it('truncates long verificationEvidence in success message at 200 chars', async () => {
    spyOn(FeatureService.prototype, 'complete').mockReturnValue(undefined as any);
    const tool = await buildFeatureCompleteTool(tmpdir);
    const longEvidence = 'a'.repeat(300);
    const result = await tool.execute(
      { name: 'test-feature', verificationEvidence: longEvidence },
      makeToolCtx(tmpdir),
    );
    expect(result).toContain('marked as completed');
    expect(result).toContain('...');
    // Should not contain the full 300-char string
    expect(result).not.toContain(longEvidence);
  });
});
