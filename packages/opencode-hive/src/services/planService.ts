import * as fs from "fs/promises";
import * as path from "path";
import type { FeatureStatus, PlanMetadata, PlanJson, PlanTask, PlanDecision, StepWithFolder } from "../types.js";
import { getFeaturePath, getPlanPath as getNewPlanPath } from "../utils/paths.js";
import { ensureDir, readFile, writeJson, readJson, fileExists } from "../utils/json.js";
import { assertFeatureMutable } from "../utils/immutability.js";

const MAX_HISTORY_VERSIONS = 3;

export interface PlanData {
  content: string;
  version: number;
  status: PlanMetadata["status"];
  lastUpdatedAt: string;
}

export class PlanService {
  constructor(
    private directory: string,
    private featureService?: { get(name: string): Promise<FeatureStatus | null> },
    private stepService?: { list(featureName: string): Promise<StepWithFolder[]> },
    private decisionService?: { list(featureName: string): Promise<Array<{ filename: string; title: string; loggedAt: string }>> }
  ) {}

  private async getFeature(featureName: string): Promise<FeatureStatus | null> {
    if (this.featureService) {
      return this.featureService.get(featureName);
    }
    const featurePath = getFeaturePath(this.directory, featureName);
    return readJson<FeatureStatus>(path.join(featurePath, "feature.json"));
  }

  private async updateFeature(featureName: string, feature: FeatureStatus): Promise<void> {
    const featurePath = getFeaturePath(this.directory, featureName);
    await writeJson(path.join(featurePath, "feature.json"), feature);
  }

  getJsonPlanPath(featureName: string): string {
    const featurePath = getFeaturePath(this.directory, featureName);
    return getNewPlanPath(featurePath);
  }

  getLegacyPlanPath(featureName: string): string {
    return path.join(getFeaturePath(this.directory, featureName), "plan.md");
  }

  getPlanPath(featureName: string): string {
    return this.getJsonPlanPath(featureName);
  }

  getPlanHistoryPath(featureName: string): string {
    return path.join(getFeaturePath(this.directory, featureName), "plan-history");
  }

  async getPlanJson(featureName: string): Promise<PlanJson | null> {
    const jsonPath = this.getJsonPlanPath(featureName);
    
    if (await fileExists(jsonPath)) {
      return readJson<PlanJson>(jsonPath);
    }

    const legacyPath = this.getLegacyPlanPath(featureName);
    if (await fileExists(legacyPath)) {
      const content = await readFile(legacyPath);
      if (content) {
        return this.markdownToPlanJson(content, featureName);
      }
    }

    return null;
  }

  async getPlan(featureName: string): Promise<PlanData | null> {
    const planJson = await this.getPlanJson(featureName);
    if (!planJson) {
      return null;
    }

    return {
      content: this.planJsonToMarkdown(planJson),
      version: planJson.version,
      status: planJson.status,
      lastUpdatedAt: planJson.updatedAt,
    };
  }

  planJsonToMarkdown(plan: PlanJson): string {
    const lines: string[] = [];

    lines.push(`# Implementation Plan`);
    lines.push(``);
    lines.push(`**Version**: ${plan.version}`);
    lines.push(`**Status**: ${plan.status}`);
    lines.push(`**Updated**: ${plan.updatedAt}`);
    lines.push(``);

    if (plan.summary) {
      lines.push(`## Summary`);
      lines.push(``);
      lines.push(plan.summary);
      lines.push(``);
    }

    if (plan.decisions.length > 0) {
      lines.push(`## Decisions`);
      lines.push(``);
      for (const decision of plan.decisions) {
        lines.push(`- **${decision.title}** (${decision.file})`);
      }
      lines.push(``);
    }

    if (plan.tasks.length > 0) {
      lines.push(`## Tasks`);
      lines.push(``);

      const tasksByOrder: Record<number, PlanTask[]> = {};
      for (const task of plan.tasks) {
        if (!tasksByOrder[task.order]) {
          tasksByOrder[task.order] = [];
        }
        tasksByOrder[task.order].push(task);
      }

      const orders = Object.keys(tasksByOrder).map(Number).sort((a, b) => a - b);
      for (const order of orders) {
        const batch = tasksByOrder[order];
        const isParallel = batch.length > 1;

        if (isParallel) {
          lines.push(`### Batch ${order} (parallel)`);
        } else {
          lines.push(`### Step ${order}`);
        }
        lines.push(``);

        for (const task of batch) {
          const icon = task.status === "done" ? "✅" :
                       task.status === "in_progress" ? "🔄" :
                       task.status === "cancelled" ? "⏭️" :
                       task.status === "failed" ? "❌" :
                       task.status === "blocked" ? "🚫" :
                       task.status === "reverted" ? "↩️" : "⬜";

          lines.push(`${icon} **${task.id}**: ${task.name}`);
          lines.push(``);
          lines.push(task.spec);
          lines.push(``);
        }
      }
    }

    return lines.join("\n");
  }

  async markdownToPlanJson(markdown: string, featureName: string): Promise<PlanJson> {
    const feature = await this.getFeature(featureName);
    const now = new Date().toISOString();

    const versionMatch = markdown.match(/\*\*Version\*\*:\s*(\d+)/);
    const statusMatch = markdown.match(/\*\*Status\*\*:\s*(\w+)/);
    const summaryMatch = markdown.match(/## Summary\s*\n\s*\n([\s\S]*?)(?=\n## |\n---|\n$)/);

    const tasks: PlanTask[] = [];
    if (this.stepService) {
      const steps = await this.stepService.list(featureName);
      for (const step of steps) {
        tasks.push({
          id: step.folder,
          order: step.order,
          name: step.name,
          status: step.status,
          spec: step.spec || "",
        });
      }
    }

    const decisions: PlanDecision[] = [];
    if (this.decisionService) {
      const decisionList = await this.decisionService.list(featureName);
      for (const d of decisionList) {
        decisions.push({
          title: d.title,
          file: d.filename,
          loggedAt: d.loggedAt,
        });
      }
    }

    return {
      version: versionMatch ? parseInt(versionMatch[1], 10) : (feature?.plan?.version ?? 1),
      status: (statusMatch?.[1] as PlanJson["status"]) || (feature?.plan?.status ?? "draft"),
      createdAt: feature?.plan?.generatedAt ?? now,
      updatedAt: now,
      summary: summaryMatch?.[1]?.trim() || "",
      tasks,
      decisions,
    };
  }

  async generatePlanJson(featureName: string, summary?: string): Promise<PlanJson> {
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature "${featureName}" not found`);
    }

    await assertFeatureMutable(feature, featureName);

    const now = new Date().toISOString();
    const tasks: PlanTask[] = [];
    const decisions: PlanDecision[] = [];

    if (this.stepService) {
      const steps = await this.stepService.list(featureName);
      for (const step of steps) {
        tasks.push({
          id: step.folder,
          order: step.order,
          name: step.name,
          status: step.status,
          spec: step.spec || "",
        });
      }
    }

    if (this.decisionService) {
      const decisionList = await this.decisionService.list(featureName);
      for (const d of decisionList) {
        decisions.push({
          title: d.title,
          file: d.filename,
          loggedAt: d.loggedAt,
        });
      }
    }

    const existingPlan = await this.getPlanJson(featureName);
    const version = existingPlan ? existingPlan.version + 1 : 1;

    const planJson: PlanJson = {
      version,
      status: "draft",
      createdAt: existingPlan?.createdAt ?? now,
      updatedAt: now,
      summary: summary || existingPlan?.summary || "",
      tasks,
      decisions,
    };

    if (existingPlan) {
      await this.archiveCurrentPlan(featureName);
    }

    await writeJson(this.getJsonPlanPath(featureName), planJson);

    feature.plan = {
      version: planJson.version,
      status: planJson.status,
      generatedAt: planJson.createdAt,
      lastUpdatedAt: planJson.updatedAt,
      approvedAt: null,
      approvedBy: null,
    };
    await this.updateFeature(featureName, feature);

    return planJson;
  }

  async archiveCurrentPlan(featureName: string): Promise<void> {
    const jsonPath = this.getJsonPlanPath(featureName);
    const legacyPath = this.getLegacyPlanPath(featureName);
    const historyPath = this.getPlanHistoryPath(featureName);

    const feature = await this.getFeature(featureName);
    const currentVersion = feature?.plan?.version ?? 0;
    
    if (currentVersion === 0) {
      return;
    }

    await ensureDir(historyPath);

    if (await fileExists(jsonPath)) {
      const archivePath = path.join(historyPath, `plan.v${currentVersion}.json`);
      await fs.copyFile(jsonPath, archivePath);
    } else if (await fileExists(legacyPath)) {
      const archivePath = path.join(historyPath, `v${currentVersion}.md`);
      await fs.copyFile(legacyPath, archivePath);
    }

    try {
      const entries = await fs.readdir(historyPath);
      const versions = entries
        .filter(e => e.includes(".v") || e.startsWith("v"))
        .map(e => {
          const match = e.match(/\.?v(\d+)\./);
          return match ? parseInt(match[1], 10) : NaN;
        })
        .filter(v => !isNaN(v))
        .sort((a, b) => b - a);

      for (const v of versions.slice(MAX_HISTORY_VERSIONS)) {
        const jsonFile = path.join(historyPath, `plan.v${v}.json`);
        const mdFile = path.join(historyPath, `v${v}.md`);
        try { await fs.unlink(jsonFile); } catch {}
        try { await fs.unlink(mdFile); } catch {}
      }
    } catch {}
  }

  async savePlan(
    featureName: string,
    content: string,
    options?: { incrementVersion?: boolean }
  ): Promise<{ path: string; version: number }> {
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature "${featureName}" not found`);
    }

    await assertFeatureMutable(feature, featureName);

    if (feature.plan?.status === "locked") {
      throw new Error(`Plan is locked. Cannot modify during execution.`);
    }

    const now = new Date().toISOString();

    if (options?.incrementVersion && feature.plan?.version) {
      await this.archiveCurrentPlan(featureName);
    }

    const newVersion = options?.incrementVersion 
      ? (feature.plan?.version ?? 0) + 1 
      : (feature.plan?.version ?? 1);

    const planJson = await this.markdownToPlanJson(content, featureName);
    planJson.version = newVersion;
    planJson.status = "draft";
    planJson.updatedAt = now;

    const jsonPath = this.getJsonPlanPath(featureName);
    await writeJson(jsonPath, planJson);

    feature.plan = {
      version: newVersion,
      status: "draft",
      generatedAt: feature.plan?.generatedAt ?? now,
      lastUpdatedAt: now,
      approvedAt: null,
      approvedBy: null,
    };

    await this.updateFeature(featureName, feature);

    return { path: jsonPath, version: newVersion };
  }

  async updatePlanJson(featureName: string, updates: Partial<PlanJson>): Promise<PlanJson> {
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature "${featureName}" not found`);
    }

    await assertFeatureMutable(feature, featureName);

    if (feature.plan?.status === "locked") {
      throw new Error(`Plan is locked. Cannot modify during execution.`);
    }

    const existingPlan = await this.getPlanJson(featureName);
    if (!existingPlan) {
      throw new Error(`No plan exists for feature "${featureName}". Generate a plan first.`);
    }

    const now = new Date().toISOString();
    const updatedPlan: PlanJson = {
      ...existingPlan,
      ...updates,
      updatedAt: now,
    };

    await writeJson(this.getJsonPlanPath(featureName), updatedPlan);

    feature.plan = {
      ...feature.plan!,
      lastUpdatedAt: now,
      status: updatedPlan.status,
    };
    await this.updateFeature(featureName, feature);

    return updatedPlan;
  }

  async approve(featureName: string): Promise<{ approved: true; version: number }> {
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature "${featureName}" not found`);
    }

    await assertFeatureMutable(feature, featureName);

    if (!feature.plan) {
      throw new Error(`No plan exists for feature "${featureName}". Generate a plan first.`);
    }

    if (feature.plan.status === "locked") {
      throw new Error(`Plan is already locked (execution in progress).`);
    }

    const now = new Date().toISOString();
    feature.plan.status = "approved";
    feature.plan.approvedAt = now;
    feature.plan.approvedBy = "user";

    await this.updateFeature(featureName, feature);

    const planJson = await this.getPlanJson(featureName);
    if (planJson) {
      planJson.status = "approved";
      planJson.updatedAt = now;
      await writeJson(this.getJsonPlanPath(featureName), planJson);
    }

    return { approved: true, version: feature.plan.version };
  }

  async lock(featureName: string): Promise<void> {
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature "${featureName}" not found`);
    }

    if (!feature.plan) {
      throw new Error(`No plan exists for feature "${featureName}".`);
    }

    if (feature.plan.status !== "approved") {
      throw new Error(`Plan must be approved before locking. Current status: ${feature.plan.status}`);
    }

    feature.plan.status = "locked";
    await this.updateFeature(featureName, feature);

    const planJson = await this.getPlanJson(featureName);
    if (planJson) {
      planJson.status = "locked";
      await writeJson(this.getJsonPlanPath(featureName), planJson);
    }
  }

  async unlock(featureName: string): Promise<void> {
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature "${featureName}" not found`);
    }

    if (!feature.plan) {
      return;
    }

    feature.plan.status = "draft";
    feature.plan.approvedAt = null;
    feature.plan.approvedBy = null;
    await this.updateFeature(featureName, feature);

    const planJson = await this.getPlanJson(featureName);
    if (planJson) {
      planJson.status = "draft";
      await writeJson(this.getJsonPlanPath(featureName), planJson);
    }
  }

  async getPlanHistory(featureName: string): Promise<{ version: number; path: string; format: "json" | "md" }[]> {
    const historyPath = this.getPlanHistoryPath(featureName);
    const history: { version: number; path: string; format: "json" | "md" }[] = [];

    try {
      const entries = await fs.readdir(historyPath);
      for (const entry of entries) {
        if (entry.endsWith(".json")) {
          const match = entry.match(/\.v(\d+)\.json$/);
          if (match) {
            history.push({
              version: parseInt(match[1], 10),
              path: path.join(historyPath, entry),
              format: "json",
            });
          }
        } else if (entry.startsWith("v") && entry.endsWith(".md")) {
          const version = parseInt(entry.slice(1, -3), 10);
          if (!isNaN(version)) {
            history.push({
              version,
              path: path.join(historyPath, entry),
              format: "md",
            });
          }
        }
      }
    } catch {}

    return history.sort((a, b) => b.version - a.version);
  }

  async migrateLegacyPlan(featureName: string): Promise<{ migrated: boolean }> {
    const legacyPath = this.getLegacyPlanPath(featureName);
    const jsonPath = this.getJsonPlanPath(featureName);

    if (await fileExists(jsonPath)) {
      return { migrated: false };
    }

    if (!(await fileExists(legacyPath))) {
      return { migrated: false };
    }

    const content = await readFile(legacyPath);
    if (!content) {
      return { migrated: false };
    }

    const planJson = await this.markdownToPlanJson(content, featureName);
    await writeJson(jsonPath, planJson);

    return { migrated: true };
  }
}
