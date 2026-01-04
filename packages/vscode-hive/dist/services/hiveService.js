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
            .filter(f => f.endsWith('.json'))
            .map(file => {
            const content = this.readJson(path.join(execPath, file));
            return content;
        })
            .filter((s) => s !== null)
            .sort((a, b) => a.order - b.order);
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
    getReport(feature) {
        return this.readFile(path.join(this.basePath, 'features', feature, 'report.md'));
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