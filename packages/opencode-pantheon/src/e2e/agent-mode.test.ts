import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { createOpencodeClient } from "@opencode-ai/sdk";
import plugin from "../index";

const OPENCODE_CLIENT = createOpencodeClient({ baseUrl: "http://localhost:1" });

const TEST_ROOT_BASE = "/tmp/pantheon-agent-mode-test";

function createProject(worktree: string) {
  return {
    id: "test",
    worktree,
    time: { created: Date.now() },
  };
}

describe("agentMode gating", () => {
  let testRoot: string;
  let originalHome: string | undefined;

  beforeEach(() => {
    originalHome = process.env.HOME;
    fs.rmSync(TEST_ROOT_BASE, { recursive: true, force: true });
    fs.mkdirSync(TEST_ROOT_BASE, { recursive: true });
    testRoot = fs.mkdtempSync(path.join(TEST_ROOT_BASE, "project-"));
    process.env.HOME = testRoot;
  });

  afterEach(() => {
    fs.rmSync(TEST_ROOT_BASE, { recursive: true, force: true });
    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
  });

  it("registers enki-planner, adapa, kulla, and nanshe in full mode", async () => {
    const configPath = path.join(testRoot, ".config", "opencode", "agent_hive.json");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        agentMode: "full",
      }),
    );

    const ctx: any = {
      directory: testRoot,
      worktree: testRoot,
      serverUrl: new URL("http://localhost:1"),
      project: createProject(testRoot),
      client: OPENCODE_CLIENT,
    };

    const hooks = await plugin(ctx);
    const opencodeConfig: any = { agent: {} };
    await hooks.config!(opencodeConfig);

    // Full mode: 8 active agents (Isimud and Mushdamma benched)
    expect(opencodeConfig.agent["enlil-validator"]).toBeDefined();
    expect(opencodeConfig.agent["enki-planner"]).toBeDefined();
    expect(opencodeConfig.agent["nudimmud-orchestrator"]).toBeDefined();
    expect(opencodeConfig.agent["adapa-explorer"]).toBeDefined();
    expect(opencodeConfig.agent["kulla-coder"]).toBeDefined();
    expect(opencodeConfig.agent["nanshe-reviewer"]).toBeDefined();
    expect(opencodeConfig.agent["enbilulu-tester"]).toBeDefined();
    expect(opencodeConfig.agent["asalluhi-prompter"]).toBeDefined();
    expect(opencodeConfig.agent["mushdamma-phase-reviewer"]).toBeUndefined();
    expect(opencodeConfig.agent["isimud-ideator"]).toBeUndefined();
    expect(opencodeConfig.default_agent).toBe("enki-planner");
  });

  it("registers core agents in core mode", async () => {
    const configPath = path.join(testRoot, ".config", "opencode", "agent_hive.json");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        agentMode: "core",
      }),
    );

    const ctx: any = {
      directory: testRoot,
      worktree: testRoot,
      serverUrl: new URL("http://localhost:1"),
      project: createProject(testRoot),
      client: OPENCODE_CLIENT,
    };

    const hooks = await plugin(ctx);
    const opencodeConfig: any = { agent: {} };
    await hooks.config!(opencodeConfig);

    // Core mode: 6 pipeline agents
    expect(opencodeConfig.agent["enlil-validator"]).toBeDefined();
    expect(opencodeConfig.agent["enki-planner"]).toBeDefined();
    expect(opencodeConfig.agent["nudimmud-orchestrator"]).toBeDefined();
    expect(opencodeConfig.agent["adapa-explorer"]).toBeDefined();
    expect(opencodeConfig.agent["kulla-coder"]).toBeDefined();
    expect(opencodeConfig.agent["nanshe-reviewer"]).toBeDefined();
    // NOT in core mode
    expect(opencodeConfig.agent["enbilulu-tester"]).toBeUndefined();
    expect(opencodeConfig.agent["mushdamma-phase-reviewer"]).toBeUndefined();
    expect(opencodeConfig.agent["isimud-ideator"]).toBeUndefined();
    expect(opencodeConfig.agent["asalluhi-prompter"]).toBeUndefined();
    expect(opencodeConfig.default_agent).toBe("enki-planner");
  });

  it("registers lean agents in lean mode", async () => {
    const configPath = path.join(testRoot, ".config", "opencode", "agent_hive.json");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        agentMode: "lean",
      }),
    );

    const ctx: any = {
      directory: testRoot,
      worktree: testRoot,
      serverUrl: new URL("http://localhost:1"),
      project: createProject(testRoot),
      client: OPENCODE_CLIENT,
    };

    const hooks = await plugin(ctx);
    const opencodeConfig: any = { agent: {} };
    await hooks.config!(opencodeConfig);

    // Lean mode: 4 essential agents
    expect(opencodeConfig.agent["enki-planner"]).toBeDefined();
    expect(opencodeConfig.agent["nudimmud-orchestrator"]).toBeDefined();
    expect(opencodeConfig.agent["kulla-coder"]).toBeDefined();
    expect(opencodeConfig.agent["adapa-explorer"]).toBeDefined();
    // NOT in lean mode
    expect(opencodeConfig.agent["enlil-validator"]).toBeUndefined();
    expect(opencodeConfig.agent["nanshe-reviewer"]).toBeUndefined();
    expect(opencodeConfig.agent["enbilulu-tester"]).toBeUndefined();
    expect(opencodeConfig.agent["mushdamma-phase-reviewer"]).toBeUndefined();
    expect(opencodeConfig.agent["isimud-ideator"]).toBeUndefined();
    expect(opencodeConfig.agent["asalluhi-prompter"]).toBeUndefined();
    expect(opencodeConfig.default_agent).toBe("enki-planner");
  });
});
