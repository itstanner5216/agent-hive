# Hive Data Model

## Structure

```
.hive/
├── config.json
└── features/
    └── {feature-name}/
        ├── problem/
        │   ├── ticket.md
        │   ├── requirements.md
        │   └── notes.md
        ├── context/
        │   ├── decisions.md
        │   ├── architecture.md
        │   └── constraints.md
        ├── execution/
        │   ├── 01-first-step.json
        │   └── 02-second-step.json
        ├── master/
        │   └── sessions.json
        └── report.md
```

## Step JSON

```json
{
  "name": "first-step",
  "order": 1,
  "spec": "# Auth Flow\n\nImplement login...",
  "status": "done",
  "startedAt": "2025-01-05T09:00:00Z",
  "completedAt": "2025-01-05T10:30:00Z",
  "summary": "Login endpoint implemented",
  "sessions": {
    "opencode": {
      "sessionId": "ses_abc123",
      "lastActive": "2025-01-05T10:30:00Z"
    }
  }
}
```

## Status Values

- pending: Not started
- wip: Work in progress
- done: Completed
- bug: Has issues
