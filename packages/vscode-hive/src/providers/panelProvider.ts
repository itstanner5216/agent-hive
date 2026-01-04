import * as vscode from 'vscode'
import { HiveService } from '../services/hiveService'

export class HivePanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'hive.panel'
  private _view?: vscode.WebviewView

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly hiveService: HiveService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    }

    webviewView.webview.html = this.getHtml()

    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'openInOpenCode':
          vscode.commands.executeCommand('hive.openInOpenCode', message.feature, message.step)
          break
        case 'openInClaude':
          vscode.commands.executeCommand('hive.openInClaude', message.feature, message.step)
          break
      }
    })
  }

  showFeature(featureName: string): void {
    if (!this._view) return

    const feature = this.hiveService.getFeature(featureName)
    const problem = this.hiveService.getProblem(featureName)
    const context = this.hiveService.getContext(featureName)

    this._view.webview.postMessage({
      command: 'showFeature',
      data: { feature, problem, context }
    })
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); }
    .section { margin-bottom: 16px; border: 1px solid var(--vscode-panel-border); padding: 12px; border-radius: 4px; }
    .section-title { font-weight: bold; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; opacity: 0.7; }
    .section-content { font-size: 13px; white-space: pre-wrap; }
    .step { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--vscode-panel-border); }
    .step:last-child { border-bottom: none; }
    .step-info { display: flex; align-items: center; gap: 8px; }
    .step-actions { display: flex; gap: 4px; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px 8px; cursor: pointer; border-radius: 2px; font-size: 11px; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .empty { opacity: 0.5; font-style: italic; }
  </style>
</head>
<body>
  <div id="content">
    <p class="empty">Select a feature to view details</p>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const statusIcons = { done: '✅', wip: '🔄', pending: '⏸', bug: '🐛' };

    window.addEventListener('message', event => {
      const { command, data } = event.data;
      if (command === 'showFeature') renderFeature(data);
    });

    function renderFeature({ feature, problem, context }) {
      const problemText = problem.ticket || problem.requirements || 'No problem defined';
      const contextText = context.decisions || 'No decisions yet';

      document.getElementById('content').innerHTML = 
        '<h2>' + feature.name + ' (' + feature.progress + '%)</h2>' +
        '<div class="section">' +
          '<div class="section-title">Problem</div>' +
          '<div class="section-content">' + problemText + '</div>' +
        '</div>' +
        '<div class="section">' +
          '<div class="section-title">Context</div>' +
          '<div class="section-content">' + contextText + '</div>' +
        '</div>' +
        '<div class="section">' +
          '<div class="section-title">Execution</div>' +
          feature.steps.map(step =>
            '<div class="step">' +
              '<div class="step-info">' +
                '<span>' + statusIcons[step.status] + '</span>' +
                '<span>' + String(step.order).padStart(2, '0') + '-' + step.name + '</span>' +
              '</div>' +
              '<div class="step-actions">' +
                '<button onclick="openIn(\\'opencode\\', \\'' + feature.name + '\\', \\'' + step.order + '-' + step.name + '\\')">OpenCode</button>' +
              '</div>' +
            '</div>'
          ).join('') +
        '</div>';
    }

    function openIn(client, feature, step) {
      vscode.postMessage({ command: client === 'opencode' ? 'openInOpenCode' : 'openInClaude', feature, step });
    }
  </script>
</body>
</html>`
  }
}
