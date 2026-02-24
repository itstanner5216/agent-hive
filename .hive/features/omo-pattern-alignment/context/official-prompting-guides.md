# Official Prompting Guides — Key Findings for Hive

## Sources
- `best practice prompt claude.md` — Anthropic's Claude 4.6 prompting best practices
- `best practice prompt codex.md` — OpenAI's Codex (GPT-5.2) prompting guide

## Patterns to Adopt (Both Guides)

### 1. De-escalate Tone (Claude guide — HIGH IMPACT)
Claude 4.6 overtriggers on aggressive language. Replace "CRITICAL/MUST/NEVER" with normal phrasing.
- Before: "You MUST ALWAYS verify before committing"
- After: "Verify before committing"
- Source: Claude guide §Overthinking — "Remove over-prompting. Tools that undertriggered in previous models likely trigger appropriately now."

### 2. Autonomous Senior Engineer Persona (Codex guide)
"You are autonomous senior engineer: once given direction, proactively gather context, plan, implement, test, and refine without waiting for additional prompts."
- Already partially in our Action Bias. Make it the Forager's identity.

### 3. Promise Discipline (Codex guide — NEW)
"Avoid committing to tests/broad refactors unless you will do them now. Otherwise, label them explicitly as optional 'Next steps'."
- Workers shouldn't promise future work they won't do this turn.

### 4. DRY/Search First (Codex guide — NEW)
"Before adding new helpers or logic, search for prior art and reuse or extract a shared helper instead of duplicating."
- Concrete rule for convention following.

### 5. Efficient Edits (Codex guide — NEW)
"Read enough context before changing a file and batch logical edits together instead of thrashing with many tiny patches."
- Prevents the "micro-edit" anti-pattern.

### 6. Plan Closure (Codex guide — NEW)
"Before finishing, reconcile every previously stated intention/TODO/plan. Mark each as Done, Blocked, or Cancelled. Do not end with in_progress/pending items."
- Strengthens Turn-End Self-Check.

### 7. Avoid Over-engineering (Claude guide — NEW)
"Only make changes directly requested or clearly necessary. Don't add features, refactor code, or make improvements beyond what was asked."
- Key anti-slop pattern.

### 8. Investigate Before Answering (Claude guide)
"Never speculate about code you have not opened. Read the file before answering."
- Already partially in Exploration Hierarchy. Make explicit.

### 9. Reversibility Preference (Claude guide — NEW)
"Prefer local, reversible actions. For actions hard to reverse, confirm first."
- Workers should prefer reversible actions in worktrees.

### 10. Batch Parallel Tool Calls (Both guides)
"Think first → decide ALL files needed → batch reads → analyze → repeat"
- Codex: explicit workflow pattern
- Claude: "boost parallel calling to ~100%"

### 11. Tight Error Handling (Codex guide)
"No broad catches or silent defaults. Propagate or surface errors explicitly."
- Good coding practice to include in Forager.

### 12. Tell What TO DO, Not What NOT To Do (Claude guide)
"Instead of 'Do not use markdown' → 'Use smoothly flowing prose paragraphs'"
- Reframe negative rules as positive instructions where possible.

## Patterns NOT to Adopt

| Pattern | Why Skip |
|---------|----------|
| Codex apply_patch tool format | Hive uses different edit tools |
| Claude prefill migration | Not applicable to agent prompts |
| Codex shell_command tool format | Hive has its own bash tool |
| Claude frontend design skills | Not relevant to agent prompts |
| Codex compaction API | Infrastructure, not prompt |
| Codex update_plan tool | Hive has its own task tools |
| Claude LaTeX guidance | Not relevant |

## Meta-Insights

1. **Both guides converge on: action bias + completeness + convention following** — these are universal best practices
2. **Claude 4.6 specifically: tone de-escalation** — stop shouting in prompts
3. **Codex specifically: promise discipline + plan closure** — don't leave orphaned TODOs
4. **Combined effect**: prompts should be shorter (de-escalated tone = fewer ALL-CAPS words), more positive (tell what to do), and more operational (concrete workflows over abstract principles)
