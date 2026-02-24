# OMO Pattern Alignment + Prompt Efficiency

## Discovery

### Original Request
- "oh-my-opencode updated quite big, introduces GPT 5.3 Codex-based agent with patterns very fitting for Hive. Investigate and help me align/apply new patterns to hive that improve hive while still align with PHILOSOPHY.md"
- "check this out this is claude code system prompt try format our prompt more efficient also get what we can from their as well, just remember always align with philosophy"
- "check these 2 for more insight first" — Anthropic's Claude 4.6 prompting best practices + OpenAI's Codex prompting guide

### Interview Summary
- Intent: Adopt prompt-level patterns from FOUR sources into Hive agent prompts:
  1. OMO's Hephaestus agent (GPT 5.3 Codex) — capability patterns
  2. Claude Code's system prompt — conciseness patterns
  3. Anthropic's official Claude 4.6 prompting guide — model-specific best practices
  4. OpenAI's official Codex prompting guide — agentic coding patterns
- Scope: Prompt engineering changes only for agent prompts (Tasks 1-4) — no infrastructure changes. Task 5 updates PHILOSOPHY.md with evolution notes.
- Philosophy alignment: Must strengthen P1-P7, never contradict them
- Efficiency goal: Make prompts tighter and more concise — fewer words, more signal

### Research Findings

**OMO Hephaestus patterns:**
- `oh-my-opencode/src/agents/hephaestus.ts:169-203` — Intent Extraction pattern
- `oh-my-opencode/src/agents/hephaestus.ts:131-161` — "Do NOT Ask — Just Do" pattern
- `oh-my-opencode/src/agents/hephaestus.ts:457-488` — Completion Guarantee with Turn-End Self-Check
- `oh-my-opencode/src/agents/hephaestus.ts:310-324` — Execution Loop (EXPLORE → PLAN → EXECUTE → VERIFY)
- `oh-my-opencode/src/agents/hephaestus.ts:213-227` — Ambiguity Protocol (explore first, ask last)
- `oh-my-opencode/src/agents/hephaestus.ts:298-306` — Search Stop Conditions
- `oh-my-opencode/src/agents/sisyphus.ts:196-223` — Intent Verbalization
- `oh-my-opencode/src/agents/sisyphus-gemini-overlays.ts:59-81` — Verification Override

**Claude Code system prompt patterns:**
- Conciseness: "minimize output tokens", "fewer than 4 lines", "no preamble/postamble"
- Convention following: "NEVER assume library available", "look at neighboring files first"
- No comments: "DO NOT ADD ANY COMMENTS unless asked"
- See context: `.hive/features/omo-pattern-alignment/context/claude-code-prompt-patterns.md`

**Anthropic Claude 4.6 guide patterns (NEW):**
- De-escalate tone: Claude 4.6 overtriggers on "CRITICAL/MUST/NEVER" — use normal language
- Tell what TO DO, not what NOT to do: positive instructions > negative rules
- Examples are the most reliable steering: 3-5 structured examples
- Avoid over-engineering: "Only make changes directly requested"
- Investigate before answering: "Never speculate about code you haven't read"
- Reversibility preference: prefer local, reversible actions
- See context: `.hive/features/omo-pattern-alignment/context/official-prompting-guides.md`

**OpenAI Codex guide patterns (NEW):**
- Autonomous senior engineer persona: proactive gather→plan→implement→verify
- Promise discipline: don't commit to work you won't do this turn
- DRY/search first: search for prior art before adding new code
- Efficient edits: read context, batch logical edits, avoid micro-patches
- Plan closure: reconcile all TODOs before finishing (Done/Blocked/Cancelled)
- Tight error handling: no broad catches or silent defaults
- Batch parallel tool calls: think first → batch all reads → analyze → repeat
- See context: `.hive/features/omo-pattern-alignment/context/official-prompting-guides.md`

**Current prompts:**
- `packages/opencode-hive/src/agents/forager.ts:1-172` — Forager
- `packages/opencode-hive/src/agents/hive.ts:1-263` — Hive
- `packages/opencode-hive/src/agents/swarm.ts:1-157` — Swarm
- `packages/opencode-hive/src/agents/scout.ts:1-130` — Scout

---

## Non-Goals
- No dynamic prompt composition infrastructure
- No category/skills delegation system
- No model-specific overlays (code-level)
- No new agent types
- No tool changes

---

## Verification Model

Workers operate in lightweight worktrees WITHOUT project dependencies. Workers do **best-effort verification using ast-grep** (already available via MCP). Full build + test verification runs on the main branch after batch merge.

---

## Prompt Efficiency Guidelines (Apply to ALL tasks)

Every task should make prompts MORE efficient, not just add content:

1. **De-escalate tone** — Replace "CRITICAL/MUST/NEVER" with normal language. Claude 4.6 overtriggers on aggressive prompting.
2. **Positive over negative** — "Write concise output" beats "DON'T write verbose output"
3. **Tables over prose** — If a rule can be a table row, make it a table row
4. **Examples over explanation** — Short Good/Bad examples beat paragraphs of rules
5. **Merge related sections** — Don't have 3 sections that say "don't ask questions"
6. **Cut filler** — "You should always" → "Always". "It is important to" → cut entirely
7. **No comments in code examples** — align with both Claude Code and Codex guides
8. **Target**: Each prompt ≤ its current line count (add patterns, remove verbosity — net neutral or shorter)

---

## Tasks

### 1. Upgrade Forager — Action Bias + Completion Guarantee + Efficiency

**Depends on**: none

**Files:**
- Modify: `packages/opencode-hive/src/agents/forager.ts`

**What to do**:

Rewrite the Forager prompt: MORE capable (Hephaestus + Codex patterns) and MORE concise (Claude guide + efficiency pass). Current: 172 lines. Target: ≤180 lines with significantly more capability.

**Add (from Hephaestus — adapt, don't copy):**

1. **Intent Extraction** — 4-row table mapping spec type → true intent → action:
   | Spec says | True intent | Action |
   |---|---|---|
   | "Implement X" | Build + verify | Code → verify |
   | "Fix Y" | Root cause + minimal fix | Diagnose → fix → verify |
   | "Refactor Z" | Preserve behavior | Restructure → verify no regressions |
   | "Add tests" | Coverage | Write tests → verify |

2. **Action Bias** — Short, punchy rules:
   - FORBIDDEN: asking permission, stopping after partial work, explaining without acting
   - REQUIRED: keep going until done, make decisions, course-correct on failure

3. **5-Step Exploration Hierarchy** — Replace current 3-step "Resolve Before Blocking":
   1. Read referenced files + surrounding code
   2. Search codebase for similar patterns
   3. Check docs via research tools
   4. Try reasonable approach
   5. LAST RESORT: report blocked

4. **Execution Loop** — EXPLORE → PLAN → EXECUTE → VERIFY → LOOP (max 3 iterations)

5. **Turn-End Self-Check** — Before hive_worktree_commit:
   - All acceptance criteria met?
   - Best-effort verification done?
   - Re-read spec — missed anything?
   - Said "I'll do X" — did you?

6. **Failure Recovery** — 3 different approaches fail → STOP → revert → document → report blocked

7. **Progress Updates** — Brief status at milestones (not verbose)

**Add (from Codex + Claude official guides — NEW):**

8. **Autonomous Senior Engineer Persona** — "You are an autonomous senior engineer. Once given direction, gather context, implement, and verify without waiting for prompts."
9. **Promise Discipline** — "Don't commit to future work. If it's not happening this turn, label it 'Next steps' and exclude from plan."
10. **DRY/Search First** — "Before adding new code, search for existing helpers and patterns. Reuse over duplicate."
11. **Efficient Edits** — "Read enough context before editing. Batch logical edits. Avoid micro-patches."
12. **Tight Error Handling** — "No broad catches or silent defaults. Propagate errors explicitly."
13. **Investigate Before Acting** — "Never speculate about code you haven't read."
14. **Avoid Over-engineering** — "Only make changes directly requested. Don't add features beyond scope."

**Add (from Claude Code):**

15. **Convention Following** — "Check neighboring files first. Follow existing patterns."
16. **No Comments** — "Don't add comments unless spec requests them."
17. **Concise Output** — "Minimize output. Don't explain what you did unless asked."

**Remove/Tighten:**

18. **Remove TDD language** — Line 70 "Decide the first failing test you will write (TDD)" → remove
19. **Merge redundant sections** — "Resolve Before Blocking" absorbed into Exploration Hierarchy
20. **De-escalate tone** — Replace all "CRITICAL/MUST/NEVER" with normal language throughout
21. **Tighten Iron Laws** — Cut verbose Docker Sandbox paragraph to 2-3 lines
22. **Tighten Execution Flow** — Merge Orient and Implement into the Execution Loop

**Must NOT do**:
- Don't remove Hive-specific sections (blocked tools, plan read-only, docker sandbox, persistent notes)
- Don't add OMO terminology (Oracle, background_output)
- Don't add delegation capabilities
- Don't exceed 180 lines
- Don't add back hard TDD verification

**References**:
- `oh-my-opencode/src/agents/hephaestus.ts:131-499` — Hephaestus prompt
- `packages/opencode-hive/src/agents/forager.ts:1-172` — Current Forager
- `PHILOSOPHY.md:169-176` — P3
- `PHILOSOPHY.md:209-240` — P6 (best-effort model)
- `.hive/features/omo-pattern-alignment/context/claude-code-prompt-patterns.md`
- `.hive/features/omo-pattern-alignment/context/official-prompting-guides.md`

**Verify**:
- [ ] `ast_grep_scan-code` → no critical issues
- [ ] `grep -c "Blocked Tools\|Plan = READ ONLY\|Docker Sandbox\|Persistent Notes\|hive_worktree_commit\|ast_grep" packages/opencode-hive/src/agents/forager.ts` → ≥6
- [ ] `grep -c "Intent\|Action Bias\|Exploration\|Execution Loop\|Self-Check\|Failure Recovery" packages/opencode-hive/src/agents/forager.ts` → ≥6
- [ ] `grep -c "TDD\|failing test" packages/opencode-hive/src/agents/forager.ts` → 0
- [ ] `wc -l packages/opencode-hive/src/agents/forager.ts` → ≤180
- [ ] `grep -ci "CRITICAL\|MUST\b\|NEVER\b" packages/opencode-hive/src/agents/forager.ts` → ≤3 (de-escalated)

### 2. Upgrade Hive — Intent Verbalization + Efficiency

**Depends on**: none

**Files:**
- Modify: `packages/opencode-hive/src/agents/hive.ts`

**What to do**:

Add Hephaestus patterns AND make the prompt significantly more concise. Current: 263 lines — target ≤240 lines despite adding new content.

**Add:**

1. **Intent Verbalization** — After Intent Classification table:
   ```
   Verbalize before acting:
   > "I detect [type] intent — [reason]. Approach: [route]."
   ```
   Plus a 4-row surface-form → true-intent → routing table.

2. **Search Stop Conditions** — In Planning Phase:
   STOP when: enough context | same info repeated | 2 rounds no new data | direct answer found.

3. **Investigate Before Acting** — "Read referenced files before making claims about them."

**Tighten (from efficiency guidelines):**

4. **De-escalate tone** — Replace "CRITICAL/MUST/NEVER" with normal language throughout
5. **Cut verbose explanations** — Many sections have "This is because..." — cut them
6. **Merge AI-Slop Flags into tables** — Currently separate section, merge into compact table
7. **Tighten Gap Classification** — 3-row table is fine, cut surrounding prose
8. **Compress skill loading** — Reduce whitespace in skill table
9. **Trim "NEVER end with" examples** — Make more concise
10. **Positive framing** — Reframe negative rules as positive instructions where possible

**Must NOT do**:
- Don't change phase detection logic
- Don't add "Do NOT Ask" (Hive uses question())
- Don't exceed 240 lines

**References**:
- `oh-my-opencode/src/agents/sisyphus.ts:196-223` — Sisyphus verbalization
- `packages/opencode-hive/src/agents/hive.ts:1-263` — Current Hive
- `.hive/features/omo-pattern-alignment/context/official-prompting-guides.md`

**Verify**:
- [ ] `ast_grep_scan-code` → no critical issues
- [ ] `grep -c "Phase Detection\|Planning Phase\|Orchestration Phase\|question()" packages/opencode-hive/src/agents/hive.ts` → ≥4
- [ ] `grep -c "Intent Verbalization\|Search Stop" packages/opencode-hive/src/agents/hive.ts` → ≥2
- [ ] `wc -l packages/opencode-hive/src/agents/hive.ts` → ≤240
- [ ] `grep -ci "CRITICAL\|MUST\b\|NEVER\b" packages/opencode-hive/src/agents/hive.ts` → ≤5 (de-escalated)

### 3. Upgrade Swarm — Verification Override + Efficiency

**Depends on**: none

**Files:**
- Modify: `packages/opencode-hive/src/agents/swarm.ts`

**What to do**:

1. **Intent Verbalization** — After Intent Gate table:
   ```
   Verbalize: "I detect [type] intent — [reason]. Routing to [action]."
   ```

2. **Verification Override** — Strengthen post-delegation verification:
   ```
   Your confidence ≈ 50% accurate. Always:
   - Read changed files (don't trust self-reports)
   - Run lsp_diagnostics on modified files
   - Check acceptance criteria from spec
   ```

3. **Search Stop Conditions** — Same compact format as Hive.

4. **De-escalate tone + tighten overall** — Replace aggressive language, cut verbose prose, merge related sections. Target: ≤150 lines.

**Must NOT do**:
- Don't add "Do NOT Ask" (Swarm uses question())
- Don't exceed 150 lines

**References**:
- `oh-my-opencode/src/agents/sisyphus-gemini-overlays.ts:59-81` — Verification override
- `packages/opencode-hive/src/agents/swarm.ts:1-157` — Current Swarm
- `.hive/features/omo-pattern-alignment/context/official-prompting-guides.md`

**Verify**:
- [ ] `ast_grep_scan-code` → no critical issues
- [ ] `grep -c "Intent Verbalization\|50%\|Search Stop" packages/opencode-hive/src/agents/swarm.ts` → ≥3
- [ ] `wc -l packages/opencode-hive/src/agents/swarm.ts` → ≤150
- [ ] `grep -ci "CRITICAL\|MUST\b\|NEVER\b" packages/opencode-hive/src/agents/swarm.ts` → ≤3

### 4. Upgrade Scout — Search Stop + Evidence + Efficiency

**Depends on**: none

**Files:**
- Modify: `packages/opencode-hive/src/agents/scout.ts`

**What to do**:

1. **Search Stop Conditions** — After Research Protocol:
   STOP when: enough context | repeated info | 2 rounds no new data | direct answer found.

2. **Evidence Sufficiency Check** — Before delivering results:
   - Every claim has a source (file:line, URL, snippet)
   - No speculation without evidence
   - Say "can't answer with available evidence" if needed

3. **Investigate Before Answering** — "Read files before making claims about them."

4. **De-escalate tone + tighten overall** — Cut verbose prose. Target: ≤120 lines.

**Must NOT do**:
- Don't add implementation capabilities (Scout is read-only)
- Don't exceed 120 lines

**References**:
- `oh-my-opencode/src/agents/hephaestus.ts:298-306` — Search Stop
- `packages/opencode-hive/src/agents/scout.ts:1-130` — Current Scout
- `.hive/features/omo-pattern-alignment/context/official-prompting-guides.md`

**Verify**:
- [ ] `ast_grep_scan-code` → no critical issues
- [ ] `grep -c "Search Stop\|Evidence" packages/opencode-hive/src/agents/scout.ts` → ≥2
- [ ] `wc -l packages/opencode-hive/src/agents/scout.ts` → ≤120
- [ ] `grep -ci "CRITICAL\|MUST\b\|NEVER\b" packages/opencode-hive/src/agents/scout.ts` → ≤2

### 5. Update PHILOSOPHY.md with Evolution Notes

**Depends on**: 1, 2, 3, 4

**Files:**
- Modify: `PHILOSOPHY.md`

**What to do**:

Add `### v1.3.0` evolution section AFTER the existing `### v1.2.1` section. Document what was adopted from ALL FOUR sources.

Search for `### v1.2.1` and add after its "Design insight:" paragraph:

```markdown
### v1.3.0 (Multi-Source Pattern Alignment)

**Theme:** Stronger worker autonomy, transparent routing, prompt efficiency.

Four sources of improvement applied simultaneously: [Oh My OpenCode v3.8+](https://github.com/code-yeongyu/oh-my-opencode) (Hephaestus agent), Claude Code's system prompt, Anthropic's Claude 4.6 prompting guide, and OpenAI's Codex prompting guide.

**From Hephaestus (capability patterns):**
- **Intent Extraction**: Workers map spec → true intent → action before coding (P3)
- **Action Bias**: Workers bias to action — asking permission is forbidden, exploration before blocking is mandatory (P3, P4)
- **Completion Guarantee**: Turn-end self-check ensures all acceptance criteria met before reporting done (P6)
- **Execution Loop**: EXPLORE → PLAN → EXECUTE → VERIFY with retry (max 3) replaces linear flow (P2 at task level)
- **5-Step Exploration Hierarchy**: Workers try 5 approaches before blocking — reduces false blocking (P3)
- **Intent Verbalization**: Orchestrators announce routing decisions before acting — transparent classification (P7)
- **Verification Override**: Post-delegation confidence ≈ 50% — always verify with tools (P6)
- **Search Stop Conditions**: All agents stop searching when good enough (P4)

**From Claude Code (efficiency patterns):**
- Concise output — minimize preamble, postamble, explanation unless asked
- Convention following — check neighboring files first, follow existing patterns
- No comments — don't add code comments unless spec requests them

**From Anthropic Claude 4.6 guide (model-specific):**
- **Tone de-escalation**: Normal language instead of "CRITICAL/MUST/NEVER" — Claude 4.6 overtriggers on aggressive prompting
- **Positive instructions**: Tell what to do, not what not to do
- **Avoid over-engineering**: Only make changes directly requested
- **Investigate before answering**: Read files before making claims

**From OpenAI Codex guide (operational patterns):**
- **Autonomous senior engineer**: Proactive gather→plan→implement→verify without waiting
- **Promise discipline**: Don't commit to work you won't do this turn
- **DRY/search first**: Search for existing helpers before adding new code
- **Efficient edits**: Read context, batch logical edits, avoid micro-patches
- **Plan closure**: Reconcile all TODOs before finishing (Done/Blocked/Cancelled)
- **Tight error handling**: No broad catches or silent defaults

**What we did NOT adopt:**
- Dynamic prompt composition — patterns matter, not assembly mechanism
- Model-specific overlays (code-level) — insights adopted universally
- "Do NOT Ask" for orchestrators — workers only (P2 requires question() for user decisions)
- apply_patch / compaction APIs — infrastructure-specific to each platform

**Design insight:** Four sources, one principle: prompts should be short, positive, and operational. Hephaestus taught WHAT to add (capability). Claude Code taught HOW to express it (efficiency). Anthropic's guide taught HOW THE MODEL reads it (tone sensitivity). Codex guide taught WHAT WORKS in practice (operational patterns). The result: prompts that are more capable AND shorter. Every aggressive "MUST/NEVER" was replaced with normal language. Every verbose paragraph was compressed to a table row or example. This aligns with P4 (Good Enough Wins): prompts earn their space through signal, not emphasis.
```

**Must NOT do**:
- Don't change existing sections or prior evolution notes
- Don't claim these are model-specific patterns (they're universal)

**References**:
- `PHILOSOPHY.md` — Search for `### v1.2.1` insertion point

**Verify**:
- [ ] `grep -c "v1.3.0" PHILOSOPHY.md` → ≥1
- [ ] `grep -n "v1.2.1\|v1.3.0" PHILOSOPHY.md` — v1.3.0 line > v1.2.1 line
