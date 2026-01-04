# Hive Tools

Tools to be implemented based on OpenCode plugin API.

## Tools

| Tool | Purpose |
|------|---------|
| hive_feature_create | Create feature folder structure |
| hive_step_create | Create execution step |
| hive_step_update | Update step status + log |
| hive_doc_save | Save to problem/ or context/ |
| hive_report_generate | Generate and save report |

## Implementation Notes

Tools interact with .hive/ folder structure:

```
.hive/features/{name}/
├── problem/
├── context/
├── execution/{order}-{step}/
│   ├── spec.md
│   ├── status
│   ├── log.md
│   └── sessions.json
└── report.md
```

Sessions tracked per client in sessions.json:
```json
{
  "opencode": { "sessionId": "xxx", "lastActive": "..." },
  "claude": { "sessionId": "yyy", "lastActive": "..." }
}
```
