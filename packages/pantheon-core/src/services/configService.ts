import * as fs from 'fs';
import * as path from 'path';
import { HiveConfig, DEFAULT_HIVE_CONFIG } from '../types.js';
import type { SandboxConfig } from './dockerSandboxService.js';

/**
 * ConfigService manages user config at ~/.config/opencode/agent_hive.json
 * 
 * This is USER config (not project-scoped):
 * - VSCode extension reads/writes this
 * - OpenCode plugin reads this to enable features
 * - Agent does NOT have tools to access this
 */
export class ConfigService {
  private configPath: string;

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const configDir = path.join(homeDir, '.config', 'opencode');
    this.configPath = path.join(configDir, 'agent_hive.json');
  }

  /**
   * Get config path
   */
  getPath(): string {
    return this.configPath;
  }

  /**
   * Get the full config, merged with defaults.
   */
  get(): HiveConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        return { ...DEFAULT_HIVE_CONFIG };
      }
      const raw = fs.readFileSync(this.configPath, 'utf-8');
      const stored = JSON.parse(raw) as Partial<HiveConfig>;

      // Deep merge with defaults
      return {
        ...DEFAULT_HIVE_CONFIG,
        ...stored,
        agents: {
          ...DEFAULT_HIVE_CONFIG.agents,
          ...stored.agents,
          // Deep merge Pantheon agent configs
          'enlil-validator': {
            ...DEFAULT_HIVE_CONFIG.agents?.['enlil-validator'],
            ...stored.agents?.['enlil-validator'],
          },
          'enki-planner': {
            ...DEFAULT_HIVE_CONFIG.agents?.['enki-planner'],
            ...stored.agents?.['enki-planner'],
          },
          'nudimmud-orchestrator': {
            ...DEFAULT_HIVE_CONFIG.agents?.['nudimmud-orchestrator'],
            ...stored.agents?.['nudimmud-orchestrator'],
          },
          'adapa-explorer': {
            ...DEFAULT_HIVE_CONFIG.agents?.['adapa-explorer'],
            ...stored.agents?.['adapa-explorer'],
          },
          'kulla-coder': {
            ...DEFAULT_HIVE_CONFIG.agents?.['kulla-coder'],
            ...stored.agents?.['kulla-coder'],
          },
          'nanshe-reviewer': {
            ...DEFAULT_HIVE_CONFIG.agents?.['nanshe-reviewer'],
            ...stored.agents?.['nanshe-reviewer'],
          },
          'enbilulu-tester': {
            ...DEFAULT_HIVE_CONFIG.agents?.['enbilulu-tester'],
            ...stored.agents?.['enbilulu-tester'],
          },
          'mushdamma-phase-reviewer': {
            ...DEFAULT_HIVE_CONFIG.agents?.['mushdamma-phase-reviewer'],
            ...stored.agents?.['mushdamma-phase-reviewer'],
          },
          'isimud-ideator': {
            ...DEFAULT_HIVE_CONFIG.agents?.['isimud-ideator'],
            ...stored.agents?.['isimud-ideator'],
          },
          'asalluhi-prompter': {
            ...DEFAULT_HIVE_CONFIG.agents?.['asalluhi-prompter'],
            ...stored.agents?.['asalluhi-prompter'],
          },
        },
      };
    } catch {
      return { ...DEFAULT_HIVE_CONFIG };
    }
  }

  /**
   * Update config (partial merge).
   */
  set(updates: Partial<HiveConfig>): HiveConfig {
    const current = this.get();
    
    const merged: HiveConfig = {
      ...current,
      ...updates,
      agents: updates.agents ? {
        ...current.agents,
        ...updates.agents,
      } : current.agents,
    };

    // Ensure config directory exists
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(this.configPath, JSON.stringify(merged, null, 2));
    return merged;
  }

  /**
   * Check if config file exists.
   */
  exists(): boolean {
    return fs.existsSync(this.configPath);
  }

  /**
   * Initialize config with defaults if it doesn't exist.
   */
  init(): HiveConfig {
    if (!this.exists()) {
      return this.set(DEFAULT_HIVE_CONFIG);
    }
    return this.get();
  }

  /**
   * Get agent-specific model config
   */
  getAgentConfig(
    agent: 'enlil-validator' | 'enki-planner' | 'nudimmud-orchestrator' | 'adapa-explorer' | 'kulla-coder' | 'nanshe-reviewer' | 'enbilulu-tester' | 'mushdamma-phase-reviewer' | 'isimud-ideator' | 'asalluhi-prompter',
  ): { model?: string; temperature?: number; skills?: string[]; autoLoadSkills?: string[]; variant?: string } {
    const config = this.get();
    const agentConfig = config.agents?.[agent] ?? {};
    const defaultAutoLoadSkills = DEFAULT_HIVE_CONFIG.agents?.[agent]?.autoLoadSkills ?? [];
    const userAutoLoadSkills = agentConfig.autoLoadSkills ?? [];
    const isPlannerAgent = agent === 'enki-planner';
    const effectiveUserAutoLoadSkills = isPlannerAgent
      ? userAutoLoadSkills
      : userAutoLoadSkills.filter((skill) => skill !== 'onboarding');
    const effectiveDefaultAutoLoadSkills = isPlannerAgent
      ? defaultAutoLoadSkills
      : defaultAutoLoadSkills.filter((skill) => skill !== 'onboarding');
    const combinedAutoLoadSkills = [...effectiveDefaultAutoLoadSkills, ...effectiveUserAutoLoadSkills];
    const uniqueAutoLoadSkills = Array.from(new Set(combinedAutoLoadSkills));
    const disabledSkills = config.disableSkills ?? [];
    const effectiveAutoLoadSkills = uniqueAutoLoadSkills.filter(
      (skill) => !disabledSkills.includes(skill),
    );

    return {
      ...agentConfig,
      autoLoadSkills: effectiveAutoLoadSkills,
    };
  }

  /**
   * Check if OMO-Slim delegation is enabled via user config.
   */
  isOmoSlimEnabled(): boolean {
    const config = this.get();
    return config.omoSlimEnabled === true;
  }

  /**
   * Get list of globally disabled skills.
   */
  getDisabledSkills(): string[] {
    const config = this.get();
    return config.disableSkills ?? [];
  }

  /**
   * Get list of globally disabled MCPs.
   */
  getDisabledMcps(): string[] {
    const config = this.get();
    return config.disableMcps ?? [];
  }

  /**
   * Get sandbox configuration for worker isolation.
   * Returns { mode: 'none' | 'docker', image?: string, persistent?: boolean }
   */
  getSandboxConfig(): SandboxConfig {
    const config = this.get();
    const mode = config.sandbox ?? 'none';
    const image = config.dockerImage;
    const persistent = config.persistentContainers ?? (mode === 'docker');

    return { mode, ...(image && { image }), persistent };
  }

  /**
   * Get hook execution cadence for a specific hook.
   * Returns the configured cadence or 1 (every turn) if not set.
   * Validates cadence values and defaults to 1 for invalid values.
   * 
   * @param hookName - The OpenCode hook name (e.g., 'experimental.chat.system.transform')
   * @param options - Optional configuration
   * @param options.safetyCritical - If true, enforces cadence=1 regardless of config
   * @returns Validated cadence value (always >= 1)
   */
  getHookCadence(hookName: string, options?: { safetyCritical?: boolean }): number {
    const config = this.get();
    const configuredCadence = config.hook_cadence?.[hookName];

    // Safety-critical hooks must always fire (cadence=1)
    if (options?.safetyCritical && configuredCadence && configuredCadence > 1) {
      console.warn(
        `[pantheon:cadence] Ignoring cadence > 1 for safety-critical hook: ${hookName}`
      );
      return 1;
    }

    // Validate and clamp cadence
    if (configuredCadence === undefined || configuredCadence === null) {
      return 1;
    }
    if (configuredCadence <= 0 || !Number.isInteger(configuredCadence)) {
      console.warn(
        `[pantheon:cadence] Invalid cadence ${configuredCadence} for ${hookName}, using 1`
      );
      return 1;
    }

    return configuredCadence;
  }

}
