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
exports.HiveService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class HiveService {
    constructor(workspaceRoot) {
        this.basePath = path.join(workspaceRoot, '.hive');
    }
    exists() {
        return fs.existsSync(this.basePath);
    }
    getFeatures() {
        const featuresPath = path.join(this.basePath, 'features');
        if (!fs.existsSync(featuresPath))
            return [];
        return fs.readdirSync(featuresPath)
            .filter(f => fs.statSync(path.join(featuresPath, f)).isDirectory())
            .map(name => this.getFeature(name));
    }
    getFeature(name) {
        const steps = this.getSteps(name);
        const doneCount = steps.filter(s => s.status === 'done').length;
        const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;
        return { name, progress, steps };
    }
    getSteps(feature) {
        const execPath = path.join(this.basePath, 'features', feature, 'execution');
        if (!fs.existsSync(execPath))
            return [];
        return fs.readdirSync(execPath)
            .filter(f => {
            const stat = fs.statSync(path.join(execPath, f));
            return stat.isDirectory();
        })
            .map(folder => {
            const folderPath = path.join(execPath, folder);
            const statusPath = path.join(folderPath, 'status.json');
            const status = this.readJson(statusPath);
            const specFiles = fs.readdirSync(folderPath)
                .filter(f => f.endsWith('.md'));
            if (!status)
                return null;
            return {
                name: status.name,
                order: status.order,
                status: status.status,
                folderPath: folder,
                specFiles,
                sessionId: status.sessionId,
                summary: status.summary
            };
        })
            .filter((s) => s !== null)
            .sort((a, b) => a.order - b.order);
    }
    getStepSpec(feature, stepFolder, specFile) {
        const specPath = path.join(this.basePath, 'features', feature, 'execution', stepFolder, specFile);
        return this.readFile(specPath);
    }
    getStepStatus(feature, stepFolder) {
        const statusPath = path.join(this.basePath, 'features', feature, 'execution', stepFolder, 'status.json');
        return this.readJson(statusPath);
    }
    getProblem(feature) {
        const problemPath = path.join(this.basePath, 'features', feature, 'problem');
        return {
            ticket: this.readFile(path.join(problemPath, 'ticket.md')) ?? undefined,
            requirements: this.readFile(path.join(problemPath, 'requirements.md')) ?? undefined,
            notes: this.readFile(path.join(problemPath, 'notes.md')) ?? undefined
        };
    }
    getContext(feature) {
        const contextPath = path.join(this.basePath, 'features', feature, 'context');
        return {
            decisions: this.readFile(path.join(contextPath, 'decisions.md')) ?? undefined,
            architecture: this.readFile(path.join(contextPath, 'architecture.md')) ?? undefined,
            constraints: this.readFile(path.join(contextPath, 'constraints.md')) ?? undefined
        };
    }
    getFilesInFolder(feature, folder) {
        const folderPath = path.join(this.basePath, 'features', feature, folder);
        if (!fs.existsSync(folderPath))
            return [];
        return fs.readdirSync(folderPath).filter(f => {
            const stat = fs.statSync(path.join(folderPath, f));
            return stat.isFile();
        });
    }
    getFilePath(feature, folder, filename) {
        return path.join(this.basePath, 'features', feature, folder, filename);
    }
    getStepFilePath(feature, stepFolder, filename) {
        return path.join(this.basePath, 'features', feature, 'execution', stepFolder, filename);
    }
    getFeaturePath(feature) {
        return path.join(this.basePath, 'features', feature);
    }
    getReport(feature) {
        const feat = this.getFeature(feature);
        const problem = this.getProblem(feature);
        const context = this.getContext(feature);
        let report = `# Feature: ${feature}\n\n`;
        report += `## PROBLEM\n${problem.ticket || '(no ticket)'}\n\n`;
        report += `## CONTEXT\n`;
        if (context.decisions)
            report += context.decisions + '\n';
        if (context.architecture)
            report += context.architecture + '\n';
        if (!context.decisions && !context.architecture)
            report += '(no decisions)\n';
        report += '\n';
        report += `## EXECUTION\n`;
        for (const step of feat.steps) {
            const icon = step.status === 'done' ? '✅' : step.status === 'in_progress' ? '🔄' : '⬜';
            report += `${icon} **${step.order}. ${step.name}** (${step.status})`;
            if (step.sessionId)
                report += ` [session: ${step.sessionId}]`;
            report += '\n';
            if (step.summary)
                report += `   ${step.summary}\n`;
        }
        return report;
    }
    updateStepSession(feature, stepFolder, sessionId) {
        const statusPath = path.join(this.basePath, 'features', feature, 'execution', stepFolder, 'status.json');
        const status = this.readJson(statusPath);
        if (!status)
            return false;
        status.sessionId = sessionId;
        try {
            fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
            return true;
        }
        catch {
            return false;
        }
    }
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch {
            return null;
        }
    }
    readJson(filePath) {
        const content = this.readFile(filePath);
        if (!content)
            return null;
        try {
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
}
exports.HiveService = HiveService;
//# sourceMappingURL=hiveService.js.map