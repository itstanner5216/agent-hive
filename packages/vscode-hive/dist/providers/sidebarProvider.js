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
exports.HiveSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
class FeatureItem extends vscode.TreeItem {
    constructor(feature) {
        super(feature.name, vscode.TreeItemCollapsibleState.Expanded);
        this.feature = feature;
        this.description = `${feature.progress}%`;
        this.contextValue = 'feature';
        this.iconPath = new vscode.ThemeIcon('package');
    }
}
class FolderItem extends vscode.TreeItem {
    constructor(label, featureName, folder, icon) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.featureName = featureName;
        this.folder = folder;
        this.contextValue = 'folder';
        this.iconPath = new vscode.ThemeIcon(icon);
        this.command = {
            command: 'hive.openFolder',
            title: 'Open',
            arguments: [featureName, folder]
        };
    }
}
class ExecutionItem extends vscode.TreeItem {
    constructor(feature) {
        super('Execution', vscode.TreeItemCollapsibleState.Expanded);
        this.feature = feature;
        this.contextValue = 'execution';
        this.iconPath = new vscode.ThemeIcon('run-all');
    }
}
class StepItem extends vscode.TreeItem {
    constructor(featureName, step) {
        super(`${String(step.order).padStart(2, '0')}-${step.name}`, vscode.TreeItemCollapsibleState.None);
        this.featureName = featureName;
        this.step = step;
        this.contextValue = 'step';
        this.iconPath = new vscode.ThemeIcon(StepItem.statusIcons[step.status] || 'circle-outline');
        if (step.summary) {
            this.description = step.summary;
        }
        const clients = Object.keys(step.sessions);
        if (clients.length > 0) {
            this.tooltip = `Sessions: ${clients.join(', ')}`;
        }
    }
}
StepItem.statusIcons = {
    done: 'pass',
    wip: 'sync~spin',
    pending: 'circle-outline',
    bug: 'bug'
};
class HiveSidebarProvider {
    constructor(hiveService) {
        this.hiveService = hiveService;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return this.hiveService.getFeatures().map(f => new FeatureItem(f));
        }
        if (element instanceof FeatureItem) {
            return [
                new FolderItem('Problem', element.feature.name, 'problem', 'question'),
                new FolderItem('Context', element.feature.name, 'context', 'lightbulb'),
                new ExecutionItem(element.feature)
            ];
        }
        if (element instanceof ExecutionItem) {
            return element.feature.steps.map(s => new StepItem(element.feature.name, s));
        }
        return [];
    }
}
exports.HiveSidebarProvider = HiveSidebarProvider;
//# sourceMappingURL=sidebarProvider.js.map