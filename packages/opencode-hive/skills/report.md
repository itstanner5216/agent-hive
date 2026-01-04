---
name: report
trigger: /report OR all steps done
---

Generate a summary report for this feature.

Read from:
- problem/ folder -> PROBLEM section
- context/ folder -> CONTEXT section
- execution/ folder -> EXECUTION section

Format as markdown with PROBLEM, CONTEXT, EXECUTION sections.
Use `hive_report_generate` tool to save.
