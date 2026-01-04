import * as vscode from 'vscode'
import { HiveService, HiveWatcher, Launcher } from './services'
import { HiveSidebarProvider, HivePanelProvider } from './providers'

export function activate(context: vscode.ExtensionContext): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (!workspaceRoot) return

  const hiveService = new HiveService(workspaceRoot)
  if (!hiveService.exists()) return

  const launcher = new Launcher()

  const sidebarProvider = new HiveSidebarProvider(hiveService)
  vscode.window.registerTreeDataProvider('hive.features', sidebarProvider)

  const panelProvider = new HivePanelProvider(context.extensionUri, hiveService)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(HivePanelProvider.viewType, panelProvider)
  )

  const watcher = new HiveWatcher(workspaceRoot, () => sidebarProvider.refresh())
  context.subscriptions.push({ dispose: () => watcher.dispose() })

  context.subscriptions.push(
    vscode.commands.registerCommand('hive.refresh', () => {
      sidebarProvider.refresh()
    }),

    vscode.commands.registerCommand('hive.newFeature', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Feature name',
        placeHolder: 'my-feature'
      })
      if (name) {
        const terminal = vscode.window.createTerminal('OpenCode - Hive')
        terminal.sendText(`opencode --command "/hive new ${name}"`)
        terminal.show()
      }
    }),

    vscode.commands.registerCommand('hive.openInOpenCode', (feature: string, step?: string) => {
      const steps = hiveService.getSteps(feature)
      const stepData = steps.find(s => `${s.order}-${s.name}` === step)
      const sessionId = stepData?.sessions.opencode?.sessionId
      launcher.open('opencode', feature, step, sessionId)
    }),

    vscode.commands.registerCommand('hive.openInClaude', (feature: string, step?: string) => {
      const steps = hiveService.getSteps(feature)
      const stepData = steps.find(s => `${s.order}-${s.name}` === step)
      const sessionId = stepData?.sessions.claude?.sessionId
      launcher.open('claude', feature, step, sessionId)
    }),

    vscode.commands.registerCommand('hive.viewReport', (feature: string) => {
      const report = hiveService.getReport(feature)
      if (report) {
        vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
          .then(doc => vscode.window.showTextDocument(doc))
      } else {
        vscode.window.showInformationMessage('No report generated yet')
      }
    }),

    vscode.commands.registerCommand('hive.openFolder', (feature: string, folder: string) => {
      const folderPath = vscode.Uri.file(`${workspaceRoot}/.hive/features/${feature}/${folder}`)
      vscode.commands.executeCommand('revealInExplorer', folderPath)
    }),

    vscode.commands.registerCommand('hive.showFeature', (featureName: string) => {
      panelProvider.showFeature(featureName)
    })
  )
}

export function deactivate(): void {}
