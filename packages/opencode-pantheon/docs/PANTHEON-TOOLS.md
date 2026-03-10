# Pantheon Tools Inventory

## Tools (16 total)

### Feature Management (2 tools)
| Tool | Purpose |
|------|---------|
| `pantheon_feature_create` | Create new feature, set as active |
| `pantheon_feature_complete` | Mark feature completed (irreversible) |

### Plan Management (3 tools)
| Tool | Purpose |
|------|---------|
| `pantheon_plan_write` | Write plan.md (clears comments) |
| `pantheon_plan_read` | Read plan.md and user comments |
| `pantheon_plan_approve` | Approve plan for execution |

### Task Management (3 tools)
| Tool | Purpose |
|------|---------|
| `pantheon_tasks_sync` | Generate tasks from approved plan (parses ### headers) |
| `pantheon_task_create` | Create manual task (not from plan) |
| `pantheon_task_update` | Update task status or summary |

### Worktree (3 tools)
| Tool | Purpose |
|------|---------|
| `pantheon_worktree_create` | Create worktree and begin work |
| `pantheon_worktree_commit` | Commit changes, write report (does NOT merge), return JSON completion contract |
| `pantheon_worktree_discard` | Discard changes, reset status |

#### pantheon_worktree_commit output

- Always returns JSON with control-flow fields:
  - `ok`: whether the operation succeeded
  - `terminal`: whether worker should stop (`true`) or continue (`false`)
  - `status`: completion status (`completed`, `blocked`, `failed`, `partial`) or error/rejected state
  - `taskState`: resulting persisted task state
  - `nextAction`: explicit next step for worker/orchestrator
- Non-terminal responses (for example `reason: "verification_required"`) require worker remediation and retry.

#### pantheon_worktree_create output

- `workerPromptPath`: file path to `.pantheon/features/<feature>/tasks/<task>/worker-prompt.md`
- `workerPromptPreview`: short preview of the prompt
- `promptMeta`, `payloadMeta`, `budgetApplied`, `warnings`: size and budget observability

### Merge (1 tool)
| Tool | Purpose |
|------|---------|
| `pantheon_merge` | Merge task branch (strategies: merge/squash/rebase) |

### Context (1 tool)
| Tool | Purpose |
|------|---------|
| `pantheon_context_write` | Write context file |

### Status (1 tool)
| Tool | Purpose |
|------|---------|
| `pantheon_status` | Get comprehensive feature status as JSON |

### Skills (1 tool)
| Tool | Purpose |
|------|---------|
| `pantheon_skill` | Load and inject Pantheon skill content |

### Agents (1 tool)
| Tool | Purpose |
|------|---------|
| `pantheon_agents_md` | Generate AGENTS.md with current agent config |

---

## Removed Tools

| Tool | Reason |
|------|--------|
| `hive_subtask_*` (5 tools) | Subtask complexity not needed, use todowrite instead |
| `hive_session_*` (2 tools) | Replaced by `pantheon_status` |
| `hive_context_read` | Agents can read files directly |
| `hive_context_list` | Agents can use glob/Read |
| `hive_steering` | Removed in favor of direct context management |

---

## Tool Categories Summary

| Category | Count | Tools |
|----------|-------|-------|
| Feature | 2 | create, complete |
| Plan | 3 | write, read, approve |
| Task | 3 | sync, create, update |
| Worktree | 3 | create, commit, discard |
| Merge | 1 | merge |
| Context | 1 | write |
| Status | 1 | status |
| Skills | 1 | skill |
| Agents | 1 | agents_md |
| **Total** | **16** | |
