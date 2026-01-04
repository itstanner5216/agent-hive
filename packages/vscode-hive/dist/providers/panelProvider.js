"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HivePanelProvider = void 0;
const vscode = __importStar(require("vscode"));
class HivePanelProvider {
    constructor(extensionUri, hiveService) {
        this.extensionUri = extensionUri;
        this.hiveService = hiveService;
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtml();
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'openInOpenCode':
                    vscode.commands.executeCommand('hive.openInOpenCode', message.feature, message.step);
                    break;
                case 'openInClaude':
                    vscode.commands.executeCommand('hive.openInClaude', message.feature, message.step);
                    break;
            }
        });
    }
    showFeature(featureName) {
        if (!this._view)
            return;
        const feature = this.hiveService.getFeature(featureName);
        const problem = this.hiveService.getProblem(featureName);
        const context = this.hiveService.getContext(featureName);
        this._view.webview.postMessage({
            command: 'showFeature',
            data: { feature, problem, context }
        });
    }
    getHtml() {
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
</html>`;
    }
}
exports.HivePanelProvider = HivePanelProvider;
HivePanelProvider.viewType = 'hive.panel';
//# sourceMappingURL=panelProvider.js.map