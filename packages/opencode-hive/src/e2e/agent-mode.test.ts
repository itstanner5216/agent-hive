import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { createOpencodeClient } from "@opencode-ai/sdk";
import plugin from "../index";

const OPENCODE_CLIENT = createOpencodeClient({ baseUrl: "http://localhost:1" });

const TEST_ROOT_BASE = "/tmp/hive-agent-mode-test";

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

    expect(opencodeConfig.agent["enki-planner"]).toBeDefined();
    expect(opencodeConfig.agent["enki-planner"]).toBeUndefined();
    expect(opencodeConfig.agent["nudimmud-orchestrator"]).toBeUndefined();
    expect(opencodeConfig.agent["adapa-explorer"]).toBeDefined();
    expect(opencodeConfig.agent["kulla-coder"]).toBeDefined();
    expect(opencodeConfig.agent["nanshe-reviewer"]).toBeDefined();
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

    expect(opencodeConfig.agent["enki-planner"]).toBeUndefined();
    expect(opencodeConfig.agent["enki-planner"]).toBeDefined();
    expect(opencodeConfig.agent["nudimmud-orchestrator"]).toBeDefined();
    expect(opencodeConfig.agent["adapa-explorer"]).toBeDefined();
    expect(opencodeConfig.agent["kulla-coder"]).toBeDefined();
    expect(opencodeConfig.agent["nanshe-reviewer"]).toBeDefined();
    expect(opencodeConfig.default_agent).toBe("enki-planner");
  });
});
