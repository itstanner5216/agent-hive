import * as vscode from 'vscode'

export type Client = 'opencode' | 'claude'

export class Launcher {
  async open(
    client: Client,
    feature: string,
    step?: string,
    sessionId?: string
  ): Promise<void> {
    switch (client) {
      case 'opencode':
        return this.openInOpenCode(feature, step, sessionId)
      case 'claude':
        return this.openInClaude(feature, step, sessionId)
    }
  }

  private async openInOpenCode(
    feature: string,
    step?: string,
    sessionId?: string
  ): Promise<void> {
    const terminal = vscode.window.createTerminal('OpenCode - Hive')

    let cmd = 'opencode'
    if (sessionId) {
      cmd += ` --session ${sessionId}`
    }

    terminal.sendText(cmd)
    terminal.show()
  }

  private async openInClaude(
    _feature: string,
    _step?: string,
    _sessionId?: string
  ): Promise<void> {
    vscode.window.showInformationMessage('Claude Code support coming soon')
  }
}
