import { describe, test, expect } from 'bun:test';
import { buildCompactionPrompt } from '../utils/compaction-prompt.js';

describe('buildCompactionPrompt', () => {
  test('includes resume instruction to continue current task', () => {
    const prompt = buildCompactionPrompt();
    expect(prompt).toMatch(/continue/i);
    expect(prompt).toMatch(/task/i);
  });

  test('instructs reading task spec file, not full repo', () => {
    const prompt = buildCompactionPrompt();
    expect(prompt).toMatch(/worker-prompt\.md|task spec|spec file/i);
  });

  test('does not instruct calling legacy hive_status on resume', () => {
    const prompt = buildCompactionPrompt();
    expect(prompt).not.toMatch(/hive_status/);
  });

  test('does not instruct re-reading entire codebase or full repo', () => {
    const prompt = buildCompactionPrompt();
    expect(prompt).not.toMatch(/read (the |all |entire |full )?(repo|codebase|project)/i);
  });

  test('instructs to avoid calling pantheon_status as first action', () => {
    const prompt = buildCompactionPrompt();
    expect(prompt).toMatch(/do not|avoid|skip/i);
    expect(prompt).toMatch(/pantheon_status|status/i);
  });

  test('is stable across multiple calls (same output)', () => {
    const prompt1 = buildCompactionPrompt();
    const prompt2 = buildCompactionPrompt();
    expect(prompt1).toBe(prompt2);
  });

  test('is concise (under 600 characters)', () => {
    const prompt = buildCompactionPrompt();
    expect(prompt.length).toBeLessThan(600);
  });
});

import plugin from '../index.js';

describe('experimental.session.compacting hook output', () => {
  test('pushes compaction prompt into output.context', async () => {
    const hooks = await plugin({ directory: process.cwd(), client: {} as any } as any);
    const output = { context: [] as string[] };
    await (hooks as any)['experimental.session.compacting']({ sessionID: 's1' }, output);
    expect(output.context).toContain(buildCompactionPrompt());
  });
});
});
