import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { HiveService } from '../services/hiveService'
import { PlanComment } from '../types'

interface PlanMeta {
  version: number
  status: string
  generatedAt: string
  lastUpdatedAt: string
  approvedAt?: string
  approvedBy?: string
}

export class PlanReviewProvider {
  private panel: vscode.WebviewPanel | null = null
  private currentFeature: string | null = null

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly hiveService: HiveService,
    private readonly workspaceRoot: string
  ) {}

  async show(featureName: string): Promise<void> {
    this.currentFeature = featureName

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One)
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'hivePlanReview',
        `Plan Review: ${featureName}`,
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true }
      )

      this.panel.onDidDispose(() => {
        this.panel = null
      })

      this.setupMessageHandlers()
    }

    await this.refresh()
  }

  private async refresh(): Promise<void> {
    if (!this.panel || !this.currentFeature) return

    const planContent = this.hiveService.getPlanContent(this.currentFeature)
    const planMeta = this.hiveService.getPlanMetadata(this.currentFeature)
    const comments = this.hiveService.getPlanComments(this.currentFeature)

    this.panel.title = `Plan Review: ${this.currentFeature}`
    this.panel.webview.html = this.getHtml(this.currentFeature, planContent, planMeta, comments)
  }

  private setupMessageHandlers(): void {
    if (!this.panel) return

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (!this.currentFeature) return

      switch (msg.type) {
        case 'approve':
          await this.approvePlan(this.currentFeature)
          await this.refresh()
          vscode.window.showInformationMessage('Plan approved!')
          break

        case 'addComment':
          await this.addComment(this.currentFeature, msg.content)
          await this.refresh()
          break

        case 'requestRevision':
          const terminal = vscode.window.createTerminal('OpenCode - Hive')
          terminal.sendText(`opencode "Please revise the plan based on the review comments"`)
          terminal.show()
          break
      }
    })
  }

  private async approvePlan(feature: string): Promise<void> {
    const metaPath = path.join(this.workspaceRoot, '.hive', 'features', feature, 'plan.meta.json')
    if (!fs.existsSync(metaPath)) return

    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      meta.status = 'approved'
      meta.approvedAt = new Date().toISOString()
      meta.approvedBy = 'user'
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
    } catch {}
  }

  private async addComment(feature: string, content: string): Promise<void> {
    const commentsPath = path.join(this.workspaceRoot, '.hive', 'features', feature, 'comments.json')
    let data: { comments: PlanComment[] } = { comments: [] }

    if (fs.existsSync(commentsPath)) {
      try {
        data = JSON.parse(fs.readFileSync(commentsPath, 'utf-8'))
      } catch {}
    }

    const citations = this.extractCitations(content)
    data.comments.push({
      id: Date.now().toString(36),
      author: 'user',
      content,
      createdAt: new Date().toISOString(),
      citations
    })

    fs.writeFileSync(commentsPath, JSON.stringify(data, null, 2))
  }

  private extractCitations(content: string): string[] {
    const matches = content.match(/@cite:([^\s]+)/g) || []
    return matches.map(m => m.replace('@cite:', ''))
  }

  private getHtml(feature: string, planContent: string | null, planMeta: PlanMeta | null, comments: PlanComment[]): string {
    const status = planMeta?.status || 'no-plan'
    const statusIcon = status === 'approved' ? '✅' : status === 'draft' ? '📝' : '❓'
    const canApprove = status === 'draft'

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 12px; }
    .header h2 { margin: 0; }
    .status { font-size: 12px; opacity: 0.8; }
    .actions { display: flex; gap: 8px; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 6px 12px; cursor: pointer; border-radius: 3px; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .plan-content { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 13px; max-height: 400px; overflow: auto; margin-bottom: 16px; }
    .no-plan { text-align: center; padding: 40px; opacity: 0.6; }
    .comments { margin-top: 24px; }
    .comment { background: var(--vscode-editor-background); border-left: 3px solid var(--vscode-editorInfo-foreground); padding: 12px; margin-bottom: 8px; }
    .comment-header { font-size: 11px; opacity: 0.7; margin-bottom: 4px; }
    .add-comment { margin-top: 16px; }
    textarea { width: 100%; min-height: 80px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 8px; font-family: inherit; }
    .add-btn { margin-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2>${statusIcon} Plan: ${this.escapeHtml(feature)}</h2>
      <div class="status">v${planMeta?.version || 0} | ${status}${planMeta?.lastUpdatedAt ? ` | Updated: ${new Date(planMeta.lastUpdatedAt).toLocaleDateString()}` : ''}</div>
    </div>
    <div class="actions">
      ${canApprove ? '<button onclick="approve()">✅ Approve</button>' : ''}
      ${status === 'draft' ? '<button class="secondary" onclick="requestRevision()">🔄 Request Revision</button>' : ''}
    </div>
  </div>

  ${planContent ? `<div class="plan-content">${this.escapeHtml(planContent)}</div>` : '<div class="no-plan">No plan generated yet. Use hive_plan_generate to create one.</div>'}

  <div class="comments">
    <h3>💬 Comments (${comments.length})</h3>
    ${comments.map(c => `
      <div class="comment">
        <div class="comment-header">${c.author} • ${new Date(c.createdAt).toLocaleString()}</div>
        <div>${this.escapeHtml(c.content)}</div>
      </div>
    `).join('')}
    
    <div class="add-comment">
      <textarea id="commentInput" placeholder="Add a comment... Use @cite:path/to/file.ts to reference code"></textarea>
      <button class="add-btn" onclick="addComment()">Add Comment</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function approve() { vscode.postMessage({ type: 'approve' }); }
    function requestRevision() { vscode.postMessage({ type: 'requestRevision' }); }
    function addComment() {
      const content = document.getElementById('commentInput').value.trim();
      if (content) {
        vscode.postMessage({ type: 'addComment', content });
        document.getElementById('commentInput').value = '';
      }
    }
  </script>
</body>
</html>`
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}
