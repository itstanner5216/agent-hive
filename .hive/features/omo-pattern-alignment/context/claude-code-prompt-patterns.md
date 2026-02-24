# Claude Code System Prompt — Patterns to Adopt

## Source
Claude Code's official system prompt (Sonnet 4, 2025-08-19 version)

## Key Patterns Worth Adopting

### 1. Tone & Brevity (HIGH VALUE)
- "concise, direct, to the point"
- "minimize output tokens while maintaining helpfulness, quality, accuracy"
- "fewer than 4 lines unless asked for detail"
- "NO unnecessary preamble or postamble"
- "Do not add additional code explanation summary unless requested"
- One-word answers when possible

**Hive application**: Our agent prompts are verbose. Forager is 172 lines. Could be tighter. The PROMPT TEXT ITSELF should model the conciseness we want agents to exhibit.

### 2. Follow Conventions (HIGH VALUE)
- "NEVER assume a library is available, even if well-known"
- "look at neighboring files", "check package.json"
- "When you create a new component, first look at existing components"
- "When you edit code, first look at surrounding context"
- "follow security best practices"
- "DO NOT ADD ANY COMMENTS unless asked"

**Hive application**: Already partially in Forager's Orient phase. But the "no comments unless asked" and "never assume library" rules are concrete and useful.

### 3. Proactiveness Balance
- "allowed to be proactive, but only when user asks"
- "balance between doing the right thing and not surprising the user"
- "if asked how to approach something, answer first, don't jump into actions"

**Hive application**: Relevant for Hive/Swarm (orchestrators). Workers (Forager) should be MORE proactive (action bias). Different rules for different roles.

### 4. Task Doing Pattern
- Search tools extensively (parallel AND sequential)
- Implement solution
- Verify with tests (don't assume test framework)
- Run lint/typecheck after completion
- NEVER commit unless explicitly asked

**Hive application**: The "run lint/typecheck" post-work check is good. The "never commit unless asked" is already handled by our worktree model.

### 5. Code References Format
- `file_path:line_number` for referencing code
- "allow user to easily navigate to source code location"

**Hive application**: Already in our plan format. Good to reinforce in agent prompts.

## What NOT to Adopt
- Security restrictions (defensive only) — Hive is general-purpose
- WebFetch redirect handling — infrastructure-specific
- Claude Code help/feedback URLs — product-specific
- "GitHub-flavored markdown for CLI display" — we're in VSCode/terminal, different context

## Prompt Efficiency Insights
The Claude Code prompt is ~2500 words for a FULL general-purpose coding agent. Our individual agent prompts should aim to be equally efficient or tighter since each has a narrower scope.

Key technique: Use examples instead of verbose explanation. Claude Code uses <example> blocks extensively — short, concrete, unambiguous.
