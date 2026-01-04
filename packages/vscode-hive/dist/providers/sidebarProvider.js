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
        this.featureName = feature.name;
        this.description = `${feature.progress}%`;
        this.contextValue = 'feature';
        this.iconPath = new vscode.ThemeIcon('package');
        this.command = {
            command: 'hive.showFeature',
            title: 'Show Feature Details',
            arguments: [feature.name]
        };
    }
}
class FolderItem extends vscode.TreeItem {
    constructor(label, featureName, folder, icon, hasChildren) {
        super(label, hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        this.featureName = featureName;
        this.folder = folder;
        this.contextValue = 'folder';
        this.iconPath = new vscode.ThemeIcon(icon);
    }
}
class FileItem extends vscode.TreeItem {
    constructor(filename, featureName, folder, filePath) {
        super(filename, vscode.TreeItemCollapsibleState.None);
        this.filename = filename;
        this.featureName = featureName;
        this.folder = folder;
        this.filePath = filePath;
        this.contextValue = 'file';
        this.iconPath = new vscode.ThemeIcon(filename.endsWith('.md') ? 'markdown' : 'file');
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(filePath)]
        };
        this.resourceUri = vscode.Uri.file(filePath);
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
    constructor(featureName, step, hasSpecFiles) {
        super(`${String(step.order).padStart(2, '0')}-${step.name}`, hasSpecFiles ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        this.featureName = featureName;
        this.step = step;
        this.stepName = step.name;
        this.stepFolder = step.folderPath;
        this.sessionId = step.sessionId;
        this.contextValue = step.sessionId ? 'step' : 'stepNoSession';
        this.iconPath = new vscode.ThemeIcon(StepItem.statusIcons[step.status] || 'circle-outline');
        if (step.summary) {
            this.description = step.summary;
        }
        if (step.sessionId) {
            this.tooltip = `Session: ${step.sessionId}`;
        }
    }
}
StepItem.statusIcons = {
    done: 'pass',
    in_progress: 'sync~spin',
    pending: 'circle-outline',
    blocked: 'error'
};
class SpecFileItem extends vscode.TreeItem {
    constructor(filename, featureName, stepFolder, filePath) {
        super(filename, vscode.TreeItemCollapsibleState.None);
        this.filename = filename;
        this.featureName = featureName;
        this.stepFolder = stepFolder;
        this.filePath = filePath;
        this.contextValue = 'specFile';
        this.iconPath = new vscode.ThemeIcon('markdown');
        this.command = {
            command: 'vscode.open',
            title: 'Open Spec',
            arguments: [vscode.Uri.file(filePath)]
        };
        this.resourceUri = vscode.Uri.file(filePath);
    }
}
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
            const problemFiles = this.hiveService.getFilesInFolder(element.feature.name, 'problem');
            const contextFiles = this.hiveService.getFilesInFolder(element.feature.name, 'context');
            return [
                new FolderItem('Problem', element.feature.name, 'problem', 'question', problemFiles.length > 0),
                new FolderItem('Context', element.feature.name, 'context', 'lightbulb', contextFiles.length > 0),
                new ExecutionItem(element.feature)
            ];
        }
        if (element instanceof FolderItem) {
            const files = this.hiveService.getFilesInFolder(element.featureName, element.folder);
            return files.map(f => new FileItem(f, element.featureName, element.folder, this.hiveService.getFilePath(element.featureName, element.folder, f)));
        }
        if (element instanceof ExecutionItem) {
            return element.feature.steps.map(s => new StepItem(element.feature.name, s, s.specFiles.length > 0));
        }
        if (element instanceof StepItem) {
            const step = this.hiveService.getFeature(element.featureName).steps.find(s => s.folderPath === element.stepFolder);
            if (!step)
                return [];
            return step.specFiles.map(f => new SpecFileItem(f, element.featureName, element.stepFolder, this.hiveService.getStepFilePath(element.featureName, element.stepFolder, f)));
        }
        return [];
    }
}
exports.HiveSidebarProvider = HiveSidebarProvider;
//# sourceMappingURL=sidebarProvider.js.map