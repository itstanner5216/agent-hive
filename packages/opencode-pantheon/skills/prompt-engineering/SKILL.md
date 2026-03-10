---
name: prompt-engineering
description: "Use when you need to craft, refine, or audit a prompt — system prompts or deep research prompts. Generates a polished ready-to-use prompt."
---

# Prompt Engineering

## Overview

Craft production-ready prompts — **Deep Research Prompts** or **System Prompts** — using proven prompt engineering principles. This skill produces a polished, ready-to-use prompt as its deliverable.

**Behavior:** If the request provides enough context to draft a prompt, **generate it immediately** and offer refinement after. Only ask clarifying questions (1–3 max) if intent is genuinely ambiguous — not as a default workflow.

---

## Prompting Philosophy

These principles govern every prompt produced under this skill.

### 1. Positive Framing Is the Default; Negation Is Surgical

Tell the model what it **should** do, what it **can** do, and what it should **always** do. Positive framing defines a clear behavioral target — the model knows where to aim. Negative framing only marks walls, leaving the model guessing about where to go.

Negative instructions ("do not," "never," "avoid") are reserved for situations where **all three** conditions are met:

- The behavior is **genuinely ambiguous** — the model could reasonably go either way.
- The failure mode is **easy to trigger** — common enough to warrant an explicit guardrail.
- The **cost of failure is high** — the wrong behavior meaningfully degrades the output.

When a negative constraint is warranted, always pair it with the positive alternative — what the model *should* do instead.

### 2. Let the Model Maneuver

Prompts define the **destination and terrain**, not every footstep. Rigid formatting mandates collapse the model's ability to reason about what the content actually needs.

- Define the goal and quality standards.
- Suggest structure as a strong default, not a straitjacket.
- Let the model organize its thinking in whatever way best serves the content.

**Exception:** When output feeds a parser or must match a schema, structural requirements are functional necessities. Specify them clearly and explain *why* the format matters.

### 3. Context Outperforms Rules

The most powerful prompting technique is giving the model the right context — about its role, the audience, the domain, and what success looks like. A well-contextualized model with minimal instructions outperforms a poorly contextualized model buried in rules.

Prioritize: who the model is → who the audience is → what the domain is → what success looks like. These four pieces of context do more behavioral shaping than any list of instructions.

### 4. Hierarchy of Prompt Power

When encoding an instruction, use the most effective lever:

1. **Identity and role framing** — shapes everything downstream with minimal words.
2. **Context and situation** — gives the model world-knowledge about the task.
3. **Positive behavioral guidance** — "always," "focus on," "prioritize."
4. **Structural suggestions** — offered as defaults, not mandates.
5. **Quality criteria** — what "good" looks like.
6. **Negative constraints** — last resort, surgical, justified.

Each level down carries less weight and costs more tokens per unit of behavioral influence. Start at the top.

---

## Prompt Types

### Deep Research Prompts

Prompts that drive a model to perform thorough, multi-faceted investigation and produce insightful, well-sourced analysis.

**Construction elements:**

1. **Research Identity** — What kind of analyst or investigator the model should be. Frame as analytical disposition, not rigid methodology.
2. **Research Mission** — The core question, scope boundaries, and what comprehensive coverage looks like.
3. **Inquiry Threads** — Specific dimensions, angles, or questions to explore. Framed as threads to pull, not boxes to check.
4. **Source & Rigor Standards** — Quality expectations for evidence and analysis. Framed as standards to uphold.
5. **Synthesis Expectations** — What the final output should accomplish for its reader. Describe purpose and utility, not exact structure.
6. **Contextual Anchors** — Known information, prior work, or specific angles the user wants emphasized.

The model receiving a research prompt should feel like it has a well-defined mission with room to exercise expert judgment about how to pursue it.

### System Prompts

Identity and behavioral prompts that configure a model for a specific ongoing role.

**Construction elements:**

1. **Identity & Expertise** — Who the model is, what it's expert in, its character. Highest-leverage section.
2. **Operating Context** — Where the model lives, what it has access to, how context flows in.
3. **Core Behaviors** — What the model should always do, how it approaches its work. Written as positive behavioral guidance.
4. **Interaction Style** — Tone, depth, pacing. Framed as defaults the model can adapt from.
5. **Quality Standards** — What "good output" looks like for this specific role.
6. **Surgical Constraints** — Only when warranted by the three-condition test. Most system prompts need zero to two.

**Length calibration:**

| Role Type | Guidance |
|---|---|
| Focused single-task (summarizer, formatter) | Short — a few paragraphs. Over-prompting adds noise. |
| Moderate integration (assistant, code reviewer) | Medium — roughly a page. Enough behavioral surface area to need context. |
| Complex multi-behavior agent (research assistant, planning agent) | Long — multiple pages. Many behaviors and edge cases to establish. |

---

## Decision Points

Before drafting, resolve these — from the request if clear, or by asking (1–3 questions max) if genuinely ambiguous:

**For all prompts:** prompt type (Deep Research or System), primary objective, target model/platform (if known), audience, tone/voice.

**Deep Research additions:** research topic & scope, key questions, source expectations, depth & length, known context.

**System Prompt additions:** model's role & identity, operating environment, interaction pattern, core behaviors, output expectations.

If the user's request already answers most of these — **draft immediately**. Present decisions you inferred and offer to adjust.

---

## Drafting Process

1. **Draft the full prompt.** Apply the Prompting Philosophy — identity and context do the heavy lifting, positive framing throughout, negative constraints only when the three-condition test is met.
2. **Annotate 2–4 key design decisions** after the prompt — why you made specific structural or framing choices.
3. **Offer refinement:** present the draft and ask what works and what doesn't.
4. Iterate collaboratively. Each revision notes what changed and why.

---

## Diagnostic Framework

When auditing or fixing a prompt that isn't performing well:

1. **Gather evidence** — ask for the specific output that missed the mark.
2. **Diagnose by layer** (fix higher layers first — more effective, fewer side effects):
   - **Identity** — model doesn't understand its role → strengthen identity framing.
   - **Context** — model missing needed information → add the missing context.
   - **Behavioral guidance** — model knows what it is but not how to behave → add positive guidance.
   - **Ambiguity** — model misinterpreting an instruction → clarify; consider surgical negative constraint.
   - **Model limitation** — model genuinely struggles → suggest workarounds or decomposition.
3. **Apply targeted fixes** — smallest change that addresses the diagnosed issue. Resist rewriting the entire prompt when one section needs adjustment.

---

## Quality Self-Check

Before presenting any prompt draft, verify:

- Prompt leads with **positive framing** — model knows what to do, not just what to avoid.
- Negative constraints each pass the **three-condition test** and are paired with positive alternatives.
- No rigid formatting mandates unless a downstream system requires it.
- Model has **room to maneuver** — can exercise judgment about structure, emphasis, depth.
- **Context is front-loaded** — identity, audience, success criteria before specific behavioral instructions.
- Follows the **hierarchy of prompt power** — identity and context do the heavy lifting.
- Prompt is **self-contained** — the model receiving it has everything it needs.
- Reads as a **coherent identity and behavioral description**, not a patchwork of bolted-on rules.
- Length is **proportionate to role complexity**.

---

## Edge Cases

- **User provides an existing prompt to improve:** Diagnose through the Prompting Philosophy. Present what's working, what's limiting the model, and how to reshape it. Revise collaboratively.
- **User wants a prompt that violates the philosophy:** Explain the trade-off. If they insist for valid reasons, accommodate — note the trade-off once, respect their decision.
- **User wants a prompt template:** Build a living scaffold — placeholders with guidance on what fits each slot, not a fill-in-the-blank form.
- **User wants one prompt but needs two:** If the use case has two distinct cognitive modes, suggest splitting. Consolidate only when tasks share enough context.
- **User isn't sure what they need:** Work backward from the problem — what's the situation, what should the AI do? This usually clarifies type, scope, and success criteria organically.
- **User returns with poor results:** Enter the Diagnostic Framework. Gather the failing output, diagnose, apply targeted fixes.

---

## Example — System Prompt

**Brief:** System prompt for a model integrated into an Obsidian vault. Helps the user think through and develop their notes. Audience: technical vault owner. Tone: direct and collaborative.

**Produced prompt:**

```markdown
You are a thinking partner embedded in the user's Obsidian vault. You have access to their notes, folder structure, tags, links, and frontmatter — treat the vault as a living knowledge base you know intimately.

Your purpose is to help the user develop their thinking: surface connections between notes they may not have noticed, identify gaps in their reasoning or coverage, summarize clusters of related notes into coherent overviews, and answer questions that draw on vault contents.

When the user asks about a topic, ground your response in their actual notes. Reference specific notes by name when relevant. If their vault has limited coverage of a topic, say so — distinguish between what their notes contain and what you know independently, and be transparent about which you're drawing from.

Adapt your depth to the question. A quick "which notes relate to X?" deserves a concise list with brief reasoning. A "help me think through Y" deserves substantive engagement — follow the threads, push on weak points, and offer perspectives the user's notes haven't explored yet.

When you spot connections the user hasn't made — notes that should link to each other, themes that span multiple folders, contradictions between notes — surface them proactively. Frame these as observations: "Your note on [X] and your note on [Y] are exploring the same tension from different angles — linking them might be useful."

Keep your responses grounded and direct. The user is technical and values substance over padding. When summarizing, capture the structure and tension of the ideas, not just their topics.
```

## Example — Deep Research Prompt

**Brief:** Research prompt investigating local-first software architecture for a developer evaluating whether to adopt it. Needs practical trade-offs, not advocacy.

**Produced prompt:**

```markdown
You are a senior software architect conducting a research analysis on local-first software — applications where data lives primarily on the user's device, syncs peer-to-peer or through lightweight servers, and remains functional offline.

Your audience is a developer deciding whether to adopt a local-first architecture for a new project. They need practical, honest analysis — not advocacy for or against the approach. They want to understand what actually works, what's still hard, and what the real trade-offs look like in production.

Investigate the current state of local-first software across these dimensions:

- **Core architectural patterns** — CRDTs, event sourcing, log-based replication, and hybrid approaches. Focus on what's proven in production vs. what's still experimental.
- **Sync and conflict resolution** — how real applications handle multi-device sync, merge conflicts, and eventual consistency. Surface the practical challenges developers report, not just the theoretical solutions.
- **Tooling and ecosystem maturity** — frameworks, libraries, and databases that support local-first development today. Assess their maturity honestly — distinguish between production-ready and promising-but-early.
- **Performance and scalability boundaries** — where local-first excels and where it struggles. Dataset size limits, query complexity, and the performance characteristics developers should expect.
- **Trade-offs against traditional architectures** — what you gain (offline capability, data ownership, latency) vs. what you lose or what becomes harder (real-time collaboration, access control, analytics, onboarding).

Ground your analysis in real implementations where possible — cite specific projects, libraries, or case studies that illustrate the points. When the landscape is fragmented or opinions conflict, present the tensions honestly rather than picking a winner.

Conclude with a synthesis that helps the reader assess fit: what kinds of projects benefit most from local-first, what kinds should avoid it, and what questions a developer should answer about their own project before committing to the approach.
```
