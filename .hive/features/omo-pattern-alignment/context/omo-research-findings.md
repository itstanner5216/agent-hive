# OMO v3.8+ Research Findings

## Date: 2026-02-24

## Key New Patterns in OMO

### 1. Hephaestus — Autonomous Deep Worker (GPT 5.3 Codex)
- **File**: `oh-my-opencode/src/agents/hephaestus.ts` (539 LOC)
- **Model**: `gpt-5.3-codex` with `reasoningEffort: "medium"`
- **Key Innovation**: Intent extraction → verbalization → commitment loop
- **"Do NOT Ask — Just Do"** pattern: Workers bias to action, questions are LAST resort
- **Completion Guarantee**: "100% OR NOTHING" with turn-end self-check
- **Exploration Hierarchy**: 5-step mandatory exploration before asking questions
- **Execution Loop**: EXPLORE → PLAN → DECIDE → EXECUTE → VERIFY
- **Progress Updates**: Proactive reporting at meaningful milestones

### 2. Model-Specific Overlays (Gemini)
- **File**: `oh-my-opencode/src/agents/sisyphus-gemini-overlays.ts` (118 LOC)
- Counter model-specific biases with corrective prompt sections
- Gemini: aggressive optimism → force tool calls, delegation, verification
- GPT: conservative grounding → force intent extraction, action bias

### 3. Dynamic Prompt Composition
- **File**: `oh-my-opencode/src/agents/dynamic-agent-prompt-builder.ts` (396 LOC)
- Prompt sections built from available agents/tools/skills metadata

### 4. Intent Gate Patterns
- **Sisyphus (Orchestrator)**: Verbalize intent → routing decision → anchor
- **Hephaestus (Worker)**: Extract true intent → action commitment → turn-end self-check
- Both include intent mapping tables (surface form → true intent → response)

## Hive Alignment Analysis

### Patterns that STRENGTHEN Hive Philosophy

| OMO Pattern | Hive Principle | Impact |
|-------------|----------------|--------|
| Intent Verbalization | P7 (Iron Laws) | Makes routing transparent, prevents silent misclassification |
| Completion Guarantee + Self-Check | P6 (Tests Define Done) + P7 | Stronger "done means verified" enforcement |
| Exploration Hierarchy (5-step) | P3 (Human Shapes, Agent Builds) | Workers explore before asking — human shapes, agent explores |
| "Do NOT Ask — Just Do" (workers) | P3 + P4 (Good Enough Wins) | Workers are autonomous builders, not question machines |
| Progress Updates | P5 (Batched Parallelism) | Better visibility during parallel execution |
| Search Stop Conditions | P4 (Good Enough Wins) | Prevents over-exploration |
| Execution Loop | P2 + P6 | Explicit loop aligns with plan-first + TDD |

### Patterns that CONFLICT — Do NOT adopt

| OMO Pattern | Conflict | Resolution |
|-------------|----------|------------|
| "Do NOT Ask — Just Do" (orchestrator-level) | P2 (Plan → Approve) | Apply ONLY to Forager, not Hive/Swarm |
| Dynamic prompt composition (code-level) | Hive is prompt-based | Adopt patterns in prompts, not infrastructure |
| Category + Skills delegation | Hive uses worktree isolation | Different execution model — skip |
| Model-specific overlays (code infrastructure) | No model detection in Hive | Future work |
