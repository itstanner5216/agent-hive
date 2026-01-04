# Hive Design

## Core Concept

Context-Driven Development for AI coding assistants.

```
PROBLEM  -> CONTEXT  -> EXECUTION -> REPORT
(why)       (what)      (how)        (shape)
```

## Architecture

```
.hive/                    <- Shared data (all clients)
.opencode/hive/           <- OpenCode plugin
.claude/hive/             <- Claude Code plugin (future)

packages/
├── opencode-hive/        <- OpenCode plugin code
└── vscode-hive/          <- VSCode extension
```

## Data Flow

1. User creates feature via /hive new
2. Master session for thinking/planning
3. /plan generates execution steps
4. Each step = own session in OpenCode
5. Hooks auto-log progress
6. /report generates summary

## Session Tracking

Sessions tracked per client in sessions.json:
- OpenCode and Claude Code can work on same feature
- Each has own session IDs
- VSCode extension shows both

## Key Principles

- Agent stays focused (no overhead during work)
- Shape on checkpoints (auto-log on todo/step done)
- On-demand detail (/report when needed)
- You control (click to open, you decide)
