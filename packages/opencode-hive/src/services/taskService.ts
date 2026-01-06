import * as fs from 'fs';
import {
  getTasksPath,
  getTaskPath,
  getTaskStatusPath,
  getTaskReportPath,
  getPlanPath,
  ensureDir,
  readJson,
  writeJson,
  readText,
  writeText,
  fileExists,
} from '../utils/paths.js';
import { TaskStatus, TaskStatusType, TaskOrigin, TasksSyncResult, TaskInfo } from '../types.js';

export class TaskService {
  constructor(private projectRoot: string) {}

  sync(featureName: string): TasksSyncResult {
    const planPath = getPlanPath(this.projectRoot, featureName);
    const planContent = readText(planPath);
    
    if (!planContent) {
      throw new Error(`No plan.md found for feature '${featureName}'`);
    }

    const planTasks = this.parseTasksFromPlan(planContent);
    const existingTasks = this.list(featureName);
    
    const result: TasksSyncResult = {
      created: [],
      removed: [],
      kept: [],
      manual: [],
    };

    const existingByName = new Map(existingTasks.map(t => [t.folder, t]));

    for (const existing of existingTasks) {
      if (existing.origin === 'manual') {
        result.manual.push(existing.folder);
        continue;
      }

      if (existing.status === 'done' || existing.status === 'in_progress') {
        result.kept.push(existing.folder);
        continue;
      }

      if (existing.status === 'cancelled') {
        this.deleteTask(featureName, existing.folder);
        result.removed.push(existing.folder);
        continue;
      }

      const stillInPlan = planTasks.some(p => p.folder === existing.folder);
      if (!stillInPlan) {
        this.deleteTask(featureName, existing.folder);
        result.removed.push(existing.folder);
      } else {
        result.kept.push(existing.folder);
      }
    }

    for (const planTask of planTasks) {
      if (!existingByName.has(planTask.folder)) {
        this.createFromPlan(featureName, planTask.folder, planTask.order);
        result.created.push(planTask.folder);
      }
    }

    return result;
  }

  create(featureName: string, name: string, order?: number): string {
    const tasksPath = getTasksPath(this.projectRoot, featureName);
    const existingFolders = this.listFolders(featureName);
    
    const nextOrder = order ?? this.getNextOrder(existingFolders);
    const folder = `${String(nextOrder).padStart(2, '0')}-${name}`;
    const taskPath = getTaskPath(this.projectRoot, featureName, folder);

    ensureDir(taskPath);

    const status: TaskStatus = {
      status: 'pending',
      origin: 'manual',
    };
    writeJson(getTaskStatusPath(this.projectRoot, featureName, folder), status);

    return folder;
  }

  private createFromPlan(featureName: string, folder: string, order: number): void {
    const taskPath = getTaskPath(this.projectRoot, featureName, folder);
    ensureDir(taskPath);

    const status: TaskStatus = {
      status: 'pending',
      origin: 'plan',
    };
    writeJson(getTaskStatusPath(this.projectRoot, featureName, folder), status);
  }

  update(featureName: string, taskFolder: string, updates: Partial<Pick<TaskStatus, 'status' | 'summary'>>): TaskStatus {
    const statusPath = getTaskStatusPath(this.projectRoot, featureName, taskFolder);
    const current = readJson<TaskStatus>(statusPath);
    
    if (!current) {
      throw new Error(`Task '${taskFolder}' not found`);
    }

    const updated: TaskStatus = {
      ...current,
      ...updates,
    };

    if (updates.status === 'in_progress' && !current.startedAt) {
      updated.startedAt = new Date().toISOString();
    }
    if (updates.status === 'done' && !current.completedAt) {
      updated.completedAt = new Date().toISOString();
    }

    writeJson(statusPath, updated);
    return updated;
  }

  get(featureName: string, taskFolder: string): TaskInfo | null {
    const statusPath = getTaskStatusPath(this.projectRoot, featureName, taskFolder);
    const status = readJson<TaskStatus>(statusPath);
    
    if (!status) return null;

    return {
      folder: taskFolder,
      name: taskFolder.replace(/^\d+-/, ''),
      status: status.status,
      origin: status.origin,
      summary: status.summary,
    };
  }

  list(featureName: string): TaskInfo[] {
    const folders = this.listFolders(featureName);
    return folders
      .map(folder => this.get(featureName, folder))
      .filter((t): t is TaskInfo => t !== null);
  }

  writeReport(featureName: string, taskFolder: string, report: string): string {
    const reportPath = getTaskReportPath(this.projectRoot, featureName, taskFolder);
    writeText(reportPath, report);
    return reportPath;
  }

  private listFolders(featureName: string): string[] {
    const tasksPath = getTasksPath(this.projectRoot, featureName);
    if (!fileExists(tasksPath)) return [];

    return fs.readdirSync(tasksPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();
  }

  private deleteTask(featureName: string, taskFolder: string): void {
    const taskPath = getTaskPath(this.projectRoot, featureName, taskFolder);
    if (fileExists(taskPath)) {
      fs.rmSync(taskPath, { recursive: true });
    }
  }

  private getNextOrder(existingFolders: string[]): number {
    if (existingFolders.length === 0) return 1;
    
    const orders = existingFolders
      .map(f => parseInt(f.split('-')[0], 10))
      .filter(n => !isNaN(n));
    
    return Math.max(...orders, 0) + 1;
  }

  private parseTasksFromPlan(content: string): Array<{ folder: string; order: number }> {
    const tasks: Array<{ folder: string; order: number }> = [];
    const taskPattern = /^###\s+(\d+)\.\s+(.+)$/gm;
    
    let match;
    while ((match = taskPattern.exec(content)) !== null) {
      const order = parseInt(match[1], 10);
      const name = match[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const folder = `${String(order).padStart(2, '0')}-${name}`;
      tasks.push({ folder, order });
    }

    return tasks;
  }
}
