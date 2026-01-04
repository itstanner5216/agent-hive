import * as vscode from 'vscode'
import { HiveService } from '../services/hiveService'
import { Feature, Step } from '../types'

type HiveItem = FeatureItem | FolderItem | ExecutionItem | StepItem

class FeatureItem extends vscode.TreeItem {
  constructor(public readonly feature: Feature) {
    super(feature.name, vscode.TreeItemCollapsibleState.Expanded)
    this.description = `${feature.progress}%`
    this.contextValue = 'feature'
    this.iconPath = new vscode.ThemeIcon('package')
  }
}

class FolderItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly featureName: string,
    public readonly folder: 'problem' | 'context',
    icon: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None)
    this.contextValue = 'folder'
    this.iconPath = new vscode.ThemeIcon(icon)
    this.command = {
      command: 'hive.openFolder',
      title: 'Open',
      arguments: [featureName, folder]
    }
  }
}

class ExecutionItem extends vscode.TreeItem {
  constructor(public readonly feature: Feature) {
    super('Execution', vscode.TreeItemCollapsibleState.Expanded)
    this.contextValue = 'execution'
    this.iconPath = new vscode.ThemeIcon('run-all')
  }
}

class StepItem extends vscode.TreeItem {
  private static statusIcons: Record<string, string> = {
    done: 'pass',
    wip: 'sync~spin',
    pending: 'circle-outline',
    bug: 'bug'
  }

  constructor(
    public readonly featureName: string,
    public readonly step: Step
  ) {
    super(
      `${String(step.order).padStart(2, '0')}-${step.name}`,
      vscode.TreeItemCollapsibleState.None
    )
    this.contextValue = 'step'
    this.iconPath = new vscode.ThemeIcon(StepItem.statusIcons[step.status] || 'circle-outline')
    
    if (step.summary) {
      this.description = step.summary
    }

    const clients = Object.keys(step.sessions)
    if (clients.length > 0) {
      this.tooltip = `Sessions: ${clients.join(', ')}`
    }
  }
}

export class HiveSidebarProvider implements vscode.TreeDataProvider<HiveItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<HiveItem | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  constructor(private hiveService: HiveService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: HiveItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: HiveItem): HiveItem[] {
    if (!element) {
      return this.hiveService.getFeatures().map(f => new FeatureItem(f))
    }

    if (element instanceof FeatureItem) {
      return [
        new FolderItem('Problem', element.feature.name, 'problem', 'question'),
        new FolderItem('Context', element.feature.name, 'context', 'lightbulb'),
        new ExecutionItem(element.feature)
      ]
    }

    if (element instanceof ExecutionItem) {
      return element.feature.steps.map(s => new StepItem(element.feature.name, s))
    }

    return []
  }
}
