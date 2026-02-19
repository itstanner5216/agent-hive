import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ConfigService } from "./configService";
import { DEFAULT_HIVE_CONFIG } from "../types";

let originalHome: string | undefined;
let tempHome: string;

const makeTempHome = () => fs.mkdtempSync(path.join(os.tmpdir(), "pantheon-home-"));

beforeEach(() => {
  originalHome = process.env.HOME;
  tempHome = makeTempHome();
  process.env.HOME = tempHome;
});

afterEach(() => {
  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }
  fs.rmSync(tempHome, { recursive: true, force: true });
});

describe("ConfigService defaults", () => {
  it("returns DEFAULT_HIVE_CONFIG when config is missing", () => {
    const service = new ConfigService();
    const config = service.get();

    expect(config).toEqual(DEFAULT_HIVE_CONFIG);
    expect(Object.keys(config.agents ?? {}).sort()).toEqual([
      "adapa-explorer",
      "asalluhi-prompter",
      "enbilulu-tester",
      "enki-planner",
      "enlil-validator",
      "isimud-ideator",
      "kulla-coder",
      "mushdamma-phase-reviewer",
      "nanshe-reviewer",
      "nudimmud-orchestrator",
    ]);
    expect(config.agents?.["enki-planner"]?.model).toBe(
      "github-copilot/gpt-5.2-codex",
    );
    expect(config.agents?.["enlil-validator"]?.model).toBe(
      "github-copilot/claude-sonnet-4-20250514",
    );
    expect(config.agents?.["nudimmud-orchestrator"]?.model).toBe(
      "github-copilot/claude-opus-4.5",
    );
  });

  it("returns 'full' as default agentMode", () => {
    const service = new ConfigService();
    expect(service.get().agentMode).toBe('full');
  });

  it("deep-merges agent overrides with defaults", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          agents: {
            "enki-planner": { temperature: 0.8 },
          },
        },
        null,
        2,
      ),
    );

    const config = service.get();
    expect(config.agents?.["enki-planner"]?.temperature).toBe(0.8);
    expect(config.agents?.["enki-planner"]?.model).toBe(
      "github-copilot/gpt-5.2-codex",
    );

    const agentConfig = service.getAgentConfig("enki-planner");
    expect(agentConfig.temperature).toBe(0.8);
    expect(agentConfig.model).toBe("github-copilot/gpt-5.2-codex");
  });

  it("deep-merges variant field from user config", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          agents: {
            "kulla-coder": { variant: "high" },
            "adapa-explorer": { variant: "low", temperature: 0.2 },
          },
        },
        null,
        2,
      ),
    );

    const config = service.get();
    // variant should be merged from user config
    expect(config.agents?.["kulla-coder"]?.variant).toBe("high");
    expect(config.agents?.["adapa-explorer"]?.variant).toBe("low");
    // other defaults should still be present
    expect(config.agents?.["kulla-coder"]?.model).toBe(
      "github-copilot/gpt-5.2-codex",
    );
    expect(config.agents?.["adapa-explorer"]?.temperature).toBe(0.2);

    // getAgentConfig should also return variant
    const foragerConfig = service.getAgentConfig("kulla-coder");
    expect(foragerConfig.variant).toBe("high");
    expect(foragerConfig.model).toBe("github-copilot/gpt-5.2-codex");

    const scoutConfig = service.getAgentConfig("adapa-explorer");
    expect(scoutConfig.variant).toBe("low");
    expect(scoutConfig.temperature).toBe(0.2);
  });

  it("merges autoLoadSkills defaults and overrides", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          agents: {
            "kulla-coder": {
              autoLoadSkills: ["custom-skill", "verification-before-completion"],
            },
          },
        },
        null,
        2,
      ),
    );

    const config = service.getAgentConfig("kulla-coder");
    expect(config.autoLoadSkills).toEqual([
      "test-driven-development",
      "verification-before-completion",
      "custom-skill",
    ]);
  });

  it("removes autoLoadSkills via disableSkills", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          disableSkills: ["parallel-exploration", "custom-skill"],
          agents: {
            "enki-planner": {
              autoLoadSkills: ["custom-skill"],
            },
          },
        },
        null,
        2,
      ),
    );

    const config = service.getAgentConfig("enki-planner");
    expect(config.autoLoadSkills).toEqual([]);
  });

  it("defaults have no variant set", () => {
    const service = new ConfigService();
    const config = service.get();

    // Default config should not have variant set for any agent
    for (const agentKey of Object.keys(config.agents ?? {})) {
      const agent = config.agents?.[agentKey as keyof typeof config.agents];
      expect(agent?.variant).toBeUndefined();
    }
  });

  it("scout-researcher autoLoadSkills does NOT include parallel-exploration", () => {
    // Scout should not auto-load parallel-exploration to prevent recursive delegation.
    // Scouts are leaf agents that should not spawn further scouts.
    const service = new ConfigService();
    const scoutConfig = service.getAgentConfig("adapa-explorer");

    expect(scoutConfig.autoLoadSkills).not.toContain("parallel-exploration");
  });
});

describe("ConfigService disabled skills/mcps", () => {
  it("returns empty arrays when not configured", () => {
    const service = new ConfigService();
    expect(service.getDisabledSkills()).toEqual([]);
    expect(service.getDisabledMcps()).toEqual([]);
  });

  it("returns configured disabled skills", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        disableSkills: ["brainstorming", "writing-plans"],
      }),
    );

    expect(service.getDisabledSkills()).toEqual(["brainstorming", "writing-plans"]);
  });

  it("returns configured disabled MCPs", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        disableMcps: ["websearch", "ast_grep"],
      }),
    );

    expect(service.getDisabledMcps()).toEqual(["websearch", "ast_grep"]);
  });
});

describe("ConfigService sandbox config", () => {
  it("getSandboxConfig() returns { mode: 'none' } when not configured", () => {
    const service = new ConfigService();
    const sandboxConfig = service.getSandboxConfig();

    expect(sandboxConfig).toEqual({ mode: 'none', persistent: false });
  });

  it("getSandboxConfig() returns { mode: 'docker' } when sandbox is set to docker", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        sandbox: 'docker',
      }),
    );

    const sandboxConfig = service.getSandboxConfig();
    expect(sandboxConfig).toEqual({ mode: 'docker', persistent: true });
  });

  it("getSandboxConfig() returns { mode: 'docker', image: 'node:22-slim' } when configured with dockerImage", () => {
    const service = new ConfigService();
    const configPath = service.getPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        sandbox: 'docker',
        dockerImage: 'node:22-slim',
      }),
    );

    const sandboxConfig = service.getSandboxConfig();
    expect(sandboxConfig).toEqual({ mode: 'docker', image: 'node:22-slim', persistent: true });
  });
});
