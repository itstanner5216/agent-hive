# opencode-hive

OpenCode plugin for Hive - Context-Driven Development.

## Installation

Copy to .opencode/hive/ in your project.

## Commands

| Command | Description |
|---------|-------------|
| /hive new <name> | Create feature |
| /hive list | List features |
| /hive status | Show progress |
| /plan | Generate steps |
| /done | Mark step complete |
| /report | Generate summary |
| /decision <text> | Log decision |

## Skills

- plan: Generate execution steps
- report: Generate PROBLEM/CONTEXT/EXECUTION summary
- decision: Log decisions to context/
- step-log: Auto-log on todo complete

## Hooks

- onTodoComplete: Triggers step-log skill
- onAllTodosComplete: Triggers report skill
