/**
 * Unit tests for the chat.message hook variant injection.
 * 
 * Tests:
 * - Applies configured variant to Hive agents
 * - Does not override already-set variant
 * - Does not apply variants to non-Hive agents
 * - Handles empty/whitespace-only variants
 */

import { describe, it, expect } from 'bun:test';
import { normalizeVariant, createVariantHook, HIVE_AGENT_NAMES } from './variant-hook.js';

// ============================================================================
// normalizeVariant tests
// ============================================================================

describe('normalizeVariant', () => {
  it('returns trimmed string for valid variant', () => {
    expect(normalizeVariant('high')).toBe('high');
    expect(normalizeVariant('  medium  ')).toBe('medium');
    expect(normalizeVariant('\tlow\n')).toBe('low');
  });

  it('returns undefined for empty string', () => {
    expect(normalizeVariant('')).toBeUndefined();
    expect(normalizeVariant('   ')).toBeUndefined();
    expect(normalizeVariant('\t\n')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(normalizeVariant(undefined)).toBeUndefined();
  });
});

// ============================================================================
// HIVE_AGENT_NAMES tests
// ============================================================================

describe('HIVE_AGENT_NAMES', () => {
  it('contains all expected Hive agent names', () => {
    expect(HIVE_AGENT_NAMES).toContain('enki-planner');
    expect(HIVE_AGENT_NAMES).toContain('enki-planner');
    expect(HIVE_AGENT_NAMES).toContain('nudimmud-orchestrator');
    expect(HIVE_AGENT_NAMES).toContain('adapa-explorer');
    expect(HIVE_AGENT_NAMES).toContain('kulla-coder');
    expect(HIVE_AGENT_NAMES).toContain('nanshe-reviewer');
  });

  it('has exactly 10 agents', () => {
    expect(HIVE_AGENT_NAMES.length).toBe(10);
  });
});

// ============================================================================
// createVariantHook tests
// ============================================================================

describe('createVariantHook', () => {
  // Mock ConfigService
  const createMockConfigService = (agentVariants: Record<string, string | undefined>) => ({
    getAgentConfig: (agent: string) => ({
      variant: agentVariants[agent],
    }),
  });

  // Helper to create a minimal output object for testing
  const createOutput = (variant?: string) => ({
    message: { variant },
    parts: [],
  });

  describe('applies variant to Hive agents', () => {
    it('sets variant when message has no variant and agent has configured variant', async () => {
      const configService = createMockConfigService({
        'kulla-coder': 'high',
      });

      const hook = createVariantHook(configService as any);

      const input = {
        sessionID: 'session-123',
        agent: 'kulla-coder',
        model: { providerID: 'anthropic', modelID: 'claude-sonnet' },
        messageID: 'msg-1',
        variant: undefined,
      };

      const output = createOutput(undefined);

      await hook(input, output);

      expect(output.message.variant).toBe('high');
    });

    it('applies variant to all Hive agents', async () => {
      const configService = createMockConfigService({
        'enlil-validator': 'max',
        'enki-planner': 'high',
        'nudimmud-orchestrator': 'medium',
        'adapa-explorer': 'low',
        'kulla-coder': 'high',
        'nanshe-reviewer': 'medium',
        'enbilulu-tester': 'low',
        'mushdamma-phase-reviewer': 'medium',
        'isimud-ideator': 'high',
        'asalluhi-prompter': 'max',
      });

      const hook = createVariantHook(configService as any);

      for (const agentName of HIVE_AGENT_NAMES) {
        const output = createOutput(undefined);

        await hook(
          { sessionID: 'session-123', agent: agentName },
          output,
        );

        expect(output.message.variant).toBeDefined();
      }
    });
  });

  describe('respects explicit variant', () => {
    it('does not override already-set variant', async () => {
      const configService = createMockConfigService({
        'kulla-coder': 'high',
      });

      const hook = createVariantHook(configService as any);

      const output = createOutput('low'); // Already set

      await hook(
        { sessionID: 'session-123', agent: 'kulla-coder', variant: 'low' },
        output,
      );

      // Should remain 'low', not overridden to 'high'
      expect(output.message.variant).toBe('low');
    });
  });

  describe('does not apply to non-Hive agents', () => {
    it('does not set variant for unknown agent', async () => {
      const configService = createMockConfigService({
        'kulla-coder': 'high',
      });

      const hook = createVariantHook(configService as any);

      const output = createOutput(undefined);

      await hook(
        { sessionID: 'session-123', agent: 'some-other-agent' },
        output,
      );

      expect(output.message.variant).toBeUndefined();
    });

    it('does not set variant for built-in OpenCode agents', async () => {
      const configService = createMockConfigService({
        'kulla-coder': 'high',
      });

      const hook = createVariantHook(configService as any);

      const builtinAgents = ['build', 'plan', 'code'];

      for (const agentName of builtinAgents) {
        const output = createOutput(undefined);

        await hook(
          { sessionID: 'session-123', agent: agentName },
          output,
        );

        expect(output.message.variant).toBeUndefined();
      }
    });
  });

  describe('handles edge cases', () => {
    it('handles missing agent in input', async () => {
      const configService = createMockConfigService({
        'kulla-coder': 'high',
      });

      const hook = createVariantHook(configService as any);

      const output = createOutput(undefined);

      await hook(
        { sessionID: 'session-123', agent: undefined },
        output,
      );

      // Should not crash, should not set variant (no agent to look up)
      expect(output.message.variant).toBeUndefined();
    });

    it('handles empty variant config', async () => {
      const configService = createMockConfigService({
        'kulla-coder': '', // Empty string
      });

      const hook = createVariantHook(configService as any);

      const output = createOutput(undefined);

      await hook(
        { sessionID: 'session-123', agent: 'kulla-coder' },
        output,
      );

      // Empty string should be treated as unset
      expect(output.message.variant).toBeUndefined();
    });

    it('handles whitespace-only variant config', async () => {
      const configService = createMockConfigService({
        'kulla-coder': '   ', // Whitespace only
      });

      const hook = createVariantHook(configService as any);

      const output = createOutput(undefined);

      await hook(
        { sessionID: 'session-123', agent: 'kulla-coder' },
        output,
      );

      // Whitespace-only should be treated as unset
      expect(output.message.variant).toBeUndefined();
    });

    it('handles undefined variant config', async () => {
      const configService = createMockConfigService({
        'kulla-coder': undefined,
      });

      const hook = createVariantHook(configService as any);

      const output = createOutput(undefined);

      await hook(
        { sessionID: 'session-123', agent: 'kulla-coder' },
        output,
      );

      // Undefined should be treated as unset
      expect(output.message.variant).toBeUndefined();
    });

    it('trims variant before applying', async () => {
      const configService = createMockConfigService({
        'kulla-coder': '  high  ', // Has whitespace
      });

      const hook = createVariantHook(configService as any);

      const output = createOutput(undefined);

      await hook(
        { sessionID: 'session-123', agent: 'kulla-coder' },
        output,
      );

      // Should be trimmed
      expect(output.message.variant).toBe('high');
    });
  });
});
