import * as vscode from 'vscode'

export type Client = 'opencode'

export class Launcher {
  constructor(private workspaceRoot: string) {}

  async openStep(
    client: Client,
    feature: string,
    task: string,
    sessionId?: string
  ): Promise<void> {
    const terminalName = `OpenCode: ${feature}/${task}`

    if (sessionId) {
      const terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: this.workspaceRoot
      })
      terminal.sendText(`opencode -s ${sessionId}`)
      terminal.show()
      return
    }

    const terminal = vscode.window.createTerminal({
      name: terminalName,
      cwd: this.workspaceRoot
    })
    terminal.sendText('opencode')
    terminal.show()
  }

  async openFeature(client: Client, feature: string): Promise<void> {
    const terminal = vscode.window.createTerminal({
      name: `OpenCode: ${feature}`,
      cwd: this.workspaceRoot
    })
    terminal.sendText('opencode')
    terminal.show()
  }

  openSession(sessionId: string): void {
    const terminal = vscode.window.createTerminal({
      name: `OpenCode - ${sessionId.slice(0, 8)}`,
      cwd: this.workspaceRoot
    })
    terminal.sendText(`opencode -s ${sessionId}`)
    terminal.show()
  }
}
