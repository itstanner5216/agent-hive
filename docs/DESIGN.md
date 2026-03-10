# Pantheon Design

## Core Concept

Context-Driven Development for AI coding assistants.

```
PROBLEM  -> CONTEXT  -> EXECUTION -> REPORT
(why)       (what)      (how)        (shape)
```

## Architecture

```
.pantheon/                    <- Shared data (all clients)
├── features/             <- Feature-scoped work
│   └── {feature}/
│       ├── feature.json  <- Feature metadata and state
│       ├── plan.md       <- Approved execution plan
│       ├── tasks.json    <- Task list with status
│       ├── contexts/     <- Persistent knowledge files
│       └── tasks/        <- Individual task folders
│           └── {task}/
│               ├── status.json      <- Task state
│               ├── spec.md          <- Task context and requirements
│               ├── worker-prompt.md <- Full worker prompt
│               └── report.md        <- Execution summary and results
└── .worktrees/           <- Isolated git worktrees per task
    └── {feature}/{task}/ <- Full repo copy for safe execution

packages/
├── pantheon-core/            <- Shared logic (services, types, utils)
├── opencode-pantheon/        <- OpenCode plugin (planning, execution, tracking)
└── vscode-hive/          <- VS Code extension (visualization, review, approval)
```

## Data Flow

1. User creates feature via `pantheon_feature_create`
2. Agent writes plan via `pantheon_plan_write`
3. User reviews in VSCode, adds comments
4. User approves via `pantheon_plan_approve`
5. Tasks synced via `pantheon_tasks_sync` (generates spec.md for each)
6. Each task executed via `pantheon_worktree_create` -> work -> `pantheon_worktree_commit`
7. Changes applied from worktree to main repo
8. Report generated with diff stats and file list

## Prompt Management

- `spec.md` is the single source for plan/context/prior task summaries in worker prompts to avoid duplication.
- `pantheon_worktree_create` writes the full prompt to `.pantheon/features/<feature>/tasks/<task>/worker-prompt.md` and returns `workerPromptPath` plus a short preview.
- Prompt budgets default to last 10 tasks, 2000 chars per summary, 20KB per context file, 60KB total; `promptMeta`, `payloadMeta`, and `warnings` report sizes.

## Feature Resolution (v0.5.0)

All tools use detection-based feature resolution instead of global state:

```typescript
function resolveFeature(explicit?: string): string | null {
  // 1. Use explicit parameter if provided
  if (explicit) return explicit
  
  // 2. Detect from worktree path (.pantheon/.worktrees/{feature}/{task}/)
  const detected = detectContext(cwd)
  if (detected?.feature) return detected.feature
  
  // 3. Fall back to single feature if only one exists
  const features = listFeatures()
  if (features.length === 1) return features[0]
  
  // 4. Require explicit parameter if multiple features
  return null
}
```

This enables:
- Multi-session support (parallel agents on different features)
- Worktree detection (agent knows which feature from its cwd)
- Explicit override (always specify feature when needed)

## Session Tracking

Sessions tracked per feature in `sessions/` directory:
- Each session captures: id, title, startedAt, endedAt
- Sessions can be forked (continue from existing) or fresh (new start)
- VSCode extension shows session history per feature

## Task Lifecycle

```
pending -> in_progress -> done
                      \-> blocked -> (resume) -> done
                      \-> failed
                      \-> partial
                      \-> cancelled
```

### Status Vocabulary (TaskStatusType)

| Status | Description |
|--------|-------------|
| `pending` | Not started |
| `in_progress` | Currently being worked on |
| `done` | Completed successfully |
| `blocked` | Waiting for user decision (blocker protocol) |
| `failed` | Execution failed (errors, tests not passing) |
| `partial` | Partially completed (some work done, not finished) |
| `cancelled` | Cancelled by user |

### spec.md (generated on task sync)
Contains task context for the executing agent:
- Task number, name, feature, folder
- Full description from plan
- Prior tasks (what came before)
- Upcoming tasks (what comes after)

### report.md (generated on task complete)
Contains execution results:
- Feature name, completion timestamp
- Status (success/failed)
- Summary (agent-provided)
- Diff statistics (files changed, insertions, deletions)
- List of modified files

## Worktree Isolation

Each task executes in an isolated git worktree:
- Full repo copy at `.pantheon/.worktrees/{feature}/{task}/`
- Agent makes changes freely without affecting main repo
- On `pantheon_worktree_commit`: diff extracted and applied to main repo
- On `pantheon_worktree_discard`: worktree discarded, no changes applied

## Key Principles

- **No global state** — All tools accept explicit feature parameter
- **Detection-first** — Worktree path reveals feature context
- **Isolation** — Each task in own worktree, safe to discard
- **Audit trail** — Every action logged to `.pantheon/`
- **Agent-friendly** — Minimal overhead during execution

## Source of Truth Rules

Pantheon uses file-based state with clear ownership boundaries:

| File | Owner | Other Access |
|------|-------|--------------| 
| `feature.json` | Pantheon Orchestrator | VS Code (read-only) |
| `tasks.json` | Pantheon Orchestrator | VS Code (read-only) |
| `status.json` (task) | Worker | Pantheon Orchestrator (read), Poller (read-only) |
| `plan.md` | Pantheon Orchestrator | VS Code (read + comment) |
| `comments.json` | VS Code | Pantheon Orchestrator (read-only) |
| `spec.md` | `pantheon_worktree_create` | Worker (read-only) |
| `report.md` | Worker | All (read-only) |
| `BLOCKED` | Steward | All (read-only, blocks operations) |

### Poller Constraints

The VSCode extension poller watches `.pantheon/` for changes:
- **Read-only**: Poller NEVER writes to any file
- **Debounced**: File changes debounced to avoid thrashing
- **Selective**: Only watches files it needs for UI

## Field Ownership

Task `status.json` fields and who writes them:

| Field | Written By | When |
|-------|-----------|------|
| `status` | Worker via `pantheon_worktree_commit` | On completion/block |
| `origin` | `pantheon_tasks_sync` | On task creation |
| `planTitle` | `pantheon_tasks_sync` | On task creation |
| `summary` | Worker via `pantheon_worktree_commit` | On completion |
| `startedAt` | `pantheon_worktree_create` | On task start |
| `completedAt` | `pantheon_worktree_commit` | On completion |
| `baseCommit` | `pantheon_worktree_create` | On worktree creation |
| `blocker` | Worker via `pantheon_worktree_commit` | When blocked |

## Idempotency Expectations

### Idempotent Operations

These operations are safe to retry:
- `pantheon_plan_read` - Pure read
- `pantheon_status` - Pure read

### Non-Idempotent Operations

These operations have side effects:
- `pantheon_feature_create` - Creates feature directory (errors if exists)
- `pantheon_plan_write` - Overwrites plan.md, clears comments
- `pantheon_tasks_sync` - Reconciles tasks (additive, removes orphans)
- `pantheon_worktree_create` - Creates worktree (reuses if exists for blocked resume)
- `pantheon_worktree_commit` - Commits changes, writes report (once per completion)
- `pantheon_merge` - Merges branch (fails if already merged)

### Recovery Patterns

If a tool call fails mid-operation:
1. Check `pantheon_status` to see current state
2. Most operations leave state consistent (atomic file writes)
3. Worktrees can be cleaned up with `pantheon_worktree_discard`
4. Partial merges require manual git intervention
