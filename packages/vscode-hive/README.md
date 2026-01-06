# vscode-hive

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/tctinh.vscode-hive)](https://marketplace.visualstudio.com/items?itemName=tctinh.vscode-hive)
[![License: MIT with Commons Clause](https://img.shields.io/badge/License-MIT%20with%20Commons%20Clause-blue.svg)](../../LICENSE)

**From Vibe Coding to Hive Coding** — The VS Code extension for reviewing and approving AI-generated plans.

## Why Hive?

Your AI writes the plan. You review it. Then it executes. No surprises.

```
Vibe: Hope it works
Hive: Review → Approve → Confidence
```

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Hive"
4. Click Install

### From VSIX

Download from [Releases](https://github.com/tctinh/agent-hive/releases) and install manually.

## Features

### 📋 Feature Sidebar
See all your features at a glance with progress indicators.

### 💬 Inline Plan Review
Add comments directly on plan.md. Discuss, iterate, approve.

### 🔄 Real-time Updates
Watches `.hive/` folder for changes. Always in sync.

### 🚀 OpenCode Integration
Launch tasks directly in OpenCode from the sidebar.

## Usage

1. Hive activates when `.hive/` folder exists in your workspace
2. Click the Hive icon in the Activity Bar
3. View features, tasks, and execution progress
4. Open plan.md to add review comments
5. Click "Done Review" when ready for AI to continue

## Commands

| Command | Description |
|---------|-------------|
| Hive: New Feature | Create a new feature |
| Hive: Refresh | Refresh the feature tree |
| View Details | Show feature details |
| View Report | Open feature report |
| Open in OpenCode | Open step in OpenCode |

## Pair with OpenCode

For the full workflow, install [opencode-hive](https://www.npmjs.com/package/opencode-hive) plugin.

## Requirements

- VS Code 1.80.0 or higher
- A project with `.hive/` folder (created by opencode-hive)

## License

MIT with Commons Clause — Free for personal and non-commercial use. See [LICENSE](../../LICENSE) for details.

---

**Stop vibing. Start hiving.** 🐝
