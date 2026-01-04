# Agent Hive

Context-Driven Development for AI coding assistants.

## Overview

Hive is a workflow tool that helps you organize AI-assisted development around:

- **PROBLEM** - Why we're doing this (tickets, requirements)
- **CONTEXT** - What we decided (decisions, architecture)
- **EXECUTION** - How we implement (steps, specs)

## Packages

| Package | Description |
|---------|-------------|
| `opencode-hive` | OpenCode plugin (tools, skills, commands) |
| `vscode-hive` | VSCode extension (UI, sidebar, panel) |

## Data Storage

```
.hive/                              ← Shared data (all clients)
└── features/
    └── [feature-name]/
        ├── problem/
        ├── context/
        ├── execution/
        └── report.md

.opencode/hive/                     ← OpenCode sessions
└── sessions/

.claude/hive/                       ← Claude Code sessions (future)
└── sessions/
```

## Getting Started

1. Install the OpenCode plugin
2. Install the VSCode extension
3. Run `/hive new "feature-name"` in OpenCode

## License

MIT
