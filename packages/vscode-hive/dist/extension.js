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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const services_1 = require("./services");
const providers_1 = require("./providers");
function findHiveRoot(startPath) {
    let current = startPath;
    while (current !== path.dirname(current)) {
        if (fs.existsSync(path.join(current, '.hive'))) {
            return current;
        }
        current = path.dirname(current);
    }
    return null;
}
function activate(context) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder)
        return;
    const workspaceRoot = findHiveRoot(workspaceFolder);
    if (!workspaceRoot)
        return;
    const hiveService = new services_1.HiveService(workspaceRoot);
    if (!hiveService.exists())
        return;
    const launcher = new services_1.Launcher(workspaceRoot);
    const sidebarProvider = new providers_1.HiveSidebarProvider(hiveService);
    vscode.window.registerTreeDataProvider('hive.features', sidebarProvider);
    const panelProvider = new providers_1.HivePanelProvider(context.extensionUri, hiveService);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(providers_1.HivePanelProvider.viewType, panelProvider));
    const watcher = new services_1.HiveWatcher(workspaceRoot, () => sidebarProvider.refresh());
    context.subscriptions.push({ dispose: () => watcher.dispose() });
    context.subscriptions.push(vscode.commands.registerCommand('hive.refresh', () => {
        sidebarProvider.refresh();
    }), vscode.commands.registerCommand('hive.newFeature', async () => {
        const name = await vscode.window.showInputBox({
            prompt: 'Feature name',
            placeHolder: 'my-feature'
        });
        if (name) {
            const terminal = vscode.window.createTerminal('OpenCode - Hive');
            terminal.sendText(`opencode --command "/hive new ${name}"`);
            terminal.show();
        }
    }), vscode.commands.registerCommand('hive.openStepInOpenCode', (featureName, stepName, sessionId) => {
        launcher.openStep('opencode', featureName, stepName, sessionId);
    }), vscode.commands.registerCommand('hive.createSession', async (item) => {
        if (item?.featureName && item?.stepFolder) {
            await launcher.createSession(item.featureName, item.stepFolder);
            sidebarProvider.refresh();
        }
    }), vscode.commands.registerCommand('hive.openFeatureInOpenCode', (featureName) => {
        launcher.openFeature('opencode', featureName);
    }), vscode.commands.registerCommand('hive.viewReport', (feature) => {
        const report = hiveService.getReport(feature);
        if (report) {
            vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
                .then(doc => vscode.window.showTextDocument(doc));
        }
        else {
            vscode.window.showInformationMessage('No report generated yet');
        }
    }), vscode.commands.registerCommand('hive.showFeature', (featureName) => {
        panelProvider.showFeature(featureName);
    }), vscode.commands.registerCommand('hive.openInOpenCode', (item) => {
        if (item?.featureName && item?.stepFolder) {
            launcher.openStep('opencode', item.featureName, item.stepFolder, item.sessionId);
        }
    }), vscode.commands.registerCommand('hive.openFile', (filePath) => {
        if (filePath) {
            vscode.workspace.openTextDocument(filePath)
                .then(doc => vscode.window.showTextDocument(doc));
        }
    }), vscode.commands.registerCommand('hive.viewFeatureDetails', (item) => {
        if (item?.featureName) {
            panelProvider.showFeature(item.featureName);
        }
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map