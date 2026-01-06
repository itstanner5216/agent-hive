# Agent Hive 🐝

**From Vibe Coding to Hive Coding** — Organize the chaos into structured execution.

[![License: MIT with Commons Clause](https://img.shields.io/badge/License-MIT%20with%20Commons%20Clause-blue.svg)](LICENSE)

---

## The Problem with Vibe Coding

AI coding assistants are powerful, but "vibe coding" leads to:
- 🌀 Context loss across sessions
- 🔄 Repeated explanations of the same decisions  
- 📝 No audit trail of what was built and why
- 🎯 Scope creep without structured planning

## The Hive Solution

**Agent Hive** transforms chaotic AI-assisted development into **structured, reviewable, executable plans**.

```
Vibe: "Just make it work somehow"
Hive: Plan → Review → Approve → Execute → Ship
```

### Inspired by Antigravity's Workflow Philosophy

Built on the principles that made [Antigravity](https://antigravity.dev) effective:
- **Plan before you code** — AI writes the plan, you review it
- **Human-in-the-loop** — Every plan requires your approval before execution
- **Traceable decisions** — Know why every choice was made
- **Parallel execution** — Multiple tasks, isolated worktrees, clean merges

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. CREATE FEATURE                                          │
│     hive_feature_create("dark-mode")                        │
├─────────────────────────────────────────────────────────────┤
│  2. AI WRITES PLAN                                          │
│     Agent generates structured plan.md                      │
├─────────────────────────────────────────────────────────────┤
│  3. YOU REVIEW IN VSCODE                                    │
│     Add comments, request changes, discuss                  │
├─────────────────────────────────────────────────────────────┤
│  4. APPROVE & EXECUTE                                       │
│     Tasks run in isolated git worktrees                     │
├─────────────────────────────────────────────────────────────┤
│  5. MERGE & SHIP                                            │
│     Clean commits, full audit trail                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Packages

| Package | Platform | Description |
|---------|----------|-------------|
| **[opencode-hive](https://www.npmjs.com/package/opencode-hive)** | npm | OpenCode plugin — tools, planning, execution |
| **[vscode-hive](https://marketplace.visualstudio.com/items?itemName=tctinh.vscode-hive)** | VS Code | Extension — review plans, add comments, approve |

---

## Quick Start

### 1. Install OpenCode Plugin

```bash
npm install opencode-hive
```

### 2. Install VS Code Extension

Search "Hive" in VS Code Extensions, or:
```bash
code --install-extension tctinh.vscode-hive
```

### 3. Start Building

```bash
# In OpenCode
hive_feature_create("my-feature")
hive_plan_write("# My Feature\n\n## Tasks\n\n### 1. First Task\n...")

# Review in VS Code, add comments
# Then approve and execute
hive_plan_approve()
hive_tasks_sync()
hive_exec_start("01-first-task")
# ... work ...
hive_exec_complete("01-first-task", "Implemented X, Y, Z")
```

---

## Why Hive?

| Vibe Coding | Hive Coding |
|-------------|-------------|
| "Just figure it out" | Structured plans with clear tasks |
| Context forgotten between sessions | Persistent feature context |
| No review before execution | Human approval required |
| Changes mixed in working tree | Isolated worktrees per task |
| "What did we decide?" | Decisions logged and searchable |
| Hope it works | Verify before merge |

---

## Built for the OpenCode Ecosystem

Agent Hive is designed to work seamlessly with:
- **[OpenCode](https://opencode.ai)** — The AI coding assistant
- **VS Code** — Your familiar editor for reviews
- **Git** — Worktrees for isolation, clean merges

---

## Features

### 🎯 Plan-First Development
AI writes the plan, you review and approve before any code is written.

### 💬 Inline Plan Review  
Add comments directly in VS Code. Discuss, iterate, refine.

### 🌳 Isolated Execution
Each task runs in its own git worktree. No conflicts, clean history.

### 📊 Progress Tracking
See what's done, what's in progress, what's next.

### 🔍 Full Audit Trail
Every decision, every change, fully traceable.

---

## License

MIT with Commons Clause — Free for personal and non-commercial use. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Stop vibing. Start hiving.</strong> 🐝
</p>
