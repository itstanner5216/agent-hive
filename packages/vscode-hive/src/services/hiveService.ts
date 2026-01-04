import * as fs from 'fs'
import * as path from 'path'
import { Feature, Step, ProblemDocs, ContextDocs } from '../types'

export class HiveService {
  private basePath: string

  constructor(workspaceRoot: string) {
    this.basePath = path.join(workspaceRoot, '.hive')
  }

  exists(): boolean {
    return fs.existsSync(this.basePath)
  }

  getFeatures(): Feature[] {
    const featuresPath = path.join(this.basePath, 'features')
    if (!fs.existsSync(featuresPath)) return []

    return fs.readdirSync(featuresPath)
      .filter(f => fs.statSync(path.join(featuresPath, f)).isDirectory())
      .map(name => this.getFeature(name))
  }

  getFeature(name: string): Feature {
    const steps = this.getSteps(name)
    const doneCount = steps.filter(s => s.status === 'done').length
    const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0

    return { name, progress, steps }
  }

  getSteps(feature: string): Step[] {
    const execPath = path.join(this.basePath, 'features', feature, 'execution')
    if (!fs.existsSync(execPath)) return []

    return fs.readdirSync(execPath)
      .filter(f => f.endsWith('.json'))
      .map(file => {
        const content = this.readJson<Step>(path.join(execPath, file))
        return content
      })
      .filter((s): s is Step => s !== null)
      .sort((a, b) => a.order - b.order)
  }

  getProblem(feature: string): ProblemDocs {
    const problemPath = path.join(this.basePath, 'features', feature, 'problem')
    return {
      ticket: this.readFile(path.join(problemPath, 'ticket.md')) ?? undefined,
      requirements: this.readFile(path.join(problemPath, 'requirements.md')) ?? undefined,
      notes: this.readFile(path.join(problemPath, 'notes.md')) ?? undefined
    }
  }

  getContext(feature: string): ContextDocs {
    const contextPath = path.join(this.basePath, 'features', feature, 'context')
    return {
      decisions: this.readFile(path.join(contextPath, 'decisions.md')) ?? undefined,
      architecture: this.readFile(path.join(contextPath, 'architecture.md')) ?? undefined,
      constraints: this.readFile(path.join(contextPath, 'constraints.md')) ?? undefined
    }
  }

  getReport(feature: string): string | null {
    return this.readFile(path.join(this.basePath, 'features', feature, 'report.md'))
  }

  private readFile(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  }

  private readJson<T>(filePath: string): T | null {
    const content = this.readFile(filePath)
    if (!content) return null
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  }
}
