import { tool, type Plugin } from "@opencode-ai/plugin";
import { createWorktreeService } from "./services/worktreeService.js";
import { FeatureService } from "./services/featureService.js";
import { StepService } from "./services/stepService.js";
import { DecisionService } from "./services/decisionService.js";
import { StatusService } from "./services/statusService.js";

import { createFeatureCreateTool, createFeatureListTool, createFeatureSwitchTool, createFeatureCompleteTool } from "./tools/featureTools.js";
import { createStepCreateTool, createStepReadTool, createStepUpdateTool, createStepDeleteTool, createStepListTool } from "./tools/stepTools.js";
import { createDecisionLogTool, createDecisionListTool } from "./tools/decisionTools.js";
import { createExecStartTool, createExecCompleteTool, createExecAbortTool, createExecRevertTool } from "./tools/execTools.js";
import { createStatusTool } from "./tools/queryTools.js";
import { PlanService } from "./services/planService.js";
import { CommentService } from "./services/commentService.js";
import { createPlanGenerateTool } from "./tools/planTools.js";
import { createPlanReadTool, createPlanUpdateTool, createPlanApproveTool, createPlanLockTool } from "./tools/planManagementTools.js";

const HIVE_SYSTEM_PROMPT = `
## Hive - Feature Development & Execution System

You have hive tools for planning, tracking, and executing feature development.

### Available Tools (20 Core Tools)

#### Feature Domain (5 tools)
| Tool | Purpose |
|------|---------|
| hive_feature_create | Create new feature, set as active |
| hive_feature_list | List all features |
| hive_feature_switch | Change active feature |
| hive_feature_complete | Mark as completed (immutable) |
| hive_status | Show active feature + all details |

#### Step Domain (5 tools)
| Tool | Purpose |
|------|---------|
| hive_step_create | Create step |
| hive_step_read | Read step details |
| hive_step_update | Update spec/order/status/summary |
| hive_step_delete | Delete step |
| hive_step_list | List all steps |

#### Decision Domain (2 tools)
| Tool | Purpose |
|------|---------|
| hive_decision_log | Log decision |
| hive_decision_list | List all with full content |

#### Plan Domain (4 tools)
| Tool | Purpose |
|------|---------|
| hive_plan_generate | Generate plan.md from steps/decisions |
| hive_plan_read | Read plan content and comments |
| hive_plan_update | Update plan with comment responses |
| hive_plan_approve | Approve plan for execution |

#### Execution Domain (4 tools)
| Tool | Purpose |
|------|---------|
| hive_exec_start | Create worktree, begin work (requires approved plan) |
| hive_exec_complete | Apply changes, mark done |
| hive_exec_abort | Abandon worktree, reset step |
| hive_exec_revert | Revert completed step |

---

### Workflow: Planning

1. Call \`hive_feature_create(name, ticket)\` to start
2. Call \`hive_decision_log(title, content)\` for each design choice
3. Call \`hive_step_create(name, order, spec)\` for each step
4. Call \`hive_plan_generate\` to create plan.md
5. Wait for user approval before execution

### Workflow: Plan Revision (when user requests revision)

1. Call \`hive_plan_read(includeComments: true)\`
2. For each unresolved comment:
   - Read any cited files with \`@cite:\` references
   - Determine appropriate action:
     - \`addressed\`: Made the requested change
     - \`rejected\`: Explain why change wasn't made
     - \`deferred\`: Will address in future step
3. Generate updated plan content addressing feedback
4. Call \`hive_plan_update\` with new content and comment responses
5. Inform user: "Plan updated to version {N}. Please review."

### Comment Response Format

When responding to comments, be specific:
- ✅ "Updated file paths to use existing src/lib/auth/"
- ✅ "Removed step 01-password-utils, will import from src/utils/crypto.ts"
- ❌ "Fixed" (too vague)
- ❌ "Will do" (no action specified)

### Workflow: Execution

1. Ensure plan is approved (status = 'approved')
2. Call \`hive_exec_start(stepFolder)\` to create worktree
3. Work in the returned worktree path
4. Call \`hive_exec_complete(stepFolder, summary)\` to finish

### Workflow: Recovery

- Abandon: \`hive_exec_abort(stepFolder)\` - discard work
- Revert: \`hive_exec_revert(stepFolder)\` - undo completed changes

### Parallelism Rules

- Steps with same \`order\` value run in parallel batches
- Check \`hive_status\` batches to see parallelization

---

### Feature Lifecycle

PLANNING → REVIEW → APPROVED → EXECUTION → COMPLETED (immutable)

Plan must be approved before execution can begin.
Once completed, features are read-only. Create a new feature for changes.
`;

const getHiveContextForCompaction = async (
  featureService: FeatureService,
  stepService: StepService
): Promise<string> => {
  const activeFeature = await featureService.getActiveFeature();
  if (!activeFeature) {
    return "";
  }

  const { name, feature } = activeFeature;
  const steps = await stepService.list(name);
  const inProgress = steps.filter(s => s.status === "in_progress");
  const pending = steps.filter(s => s.status === "pending");
  const completed = steps.filter(s => s.status === "done");

  let context = `## Hive Feature Context (PRESERVE THIS)\n\n`;
  context += `**Active Feature**: ${name} (${feature.status})\n`;
  context += `**Progress**: ${completed.length}/${steps.length} steps completed\n\n`;

  if (inProgress.length > 0) {
    context += `**Currently In Progress**:\n`;
    for (const step of inProgress) {
      context += `- ${step.folder}: ${step.name}\n`;
      if (step.execution?.worktreePath) {
        context += `  Worktree: ${step.execution.worktreePath}\n`;
      }
    }
    context += `\n`;
  }

  if (pending.length > 0) {
    context += `**Next Pending Steps**:\n`;
    for (const step of pending.slice(0, 3)) {
      context += `- ${step.folder}: ${step.name} (order ${step.order})\n`;
    }
    if (pending.length > 3) {
      context += `- ... and ${pending.length - 3} more\n`;
    }
    context += `\n`;
  }

  context += `**IMPORTANT**: Call \`hive_status\` to see full feature state before continuing work.\n`;

  return context;
};

const plugin: Plugin = async (ctx) => {
  const { directory } = ctx;

  const worktreeService = createWorktreeService(directory);
  const featureService = new FeatureService(directory);
  const stepService = new StepService(directory, featureService);
  const decisionService = new DecisionService(directory, featureService);

  (featureService as any).stepService = stepService;
  (featureService as any).decisionService = decisionService;

  const statusService = new StatusService(featureService, stepService, decisionService);
  const planService = new PlanService(directory, featureService);
  const commentService = new CommentService(directory);

  return {
    "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
      output.system.push(HIVE_SYSTEM_PROMPT);

      const activeFeature = await featureService.getActiveFeature();
      if (activeFeature) {
        const { name, feature } = activeFeature;
        const steps = await stepService.list(name);
        const inProgress = steps.filter(s => s.status === "in_progress");
        const pending = steps.filter(s => s.status === "pending");
        const completed = steps.filter(s => s.status === "done");

        let statusHint = `\n### Current Hive Status\n`;
        statusHint += `**Active Feature**: ${name} (${feature.status})\n`;
        statusHint += `**Progress**: ${completed.length}/${steps.length} steps\n`;

        if (inProgress.length > 0) {
          statusHint += `**In Progress**: ${inProgress.map(s => s.folder).join(", ")}\n`;
          statusHint += `\n⚠️ Steps are in progress. Complete them with \`hive_exec_complete\` or abort with \`hive_exec_abort\`.\n`;
        } else if (pending.length > 0) {
          statusHint += `**Next Step**: ${pending[0].folder}\n`;
        }

        output.system.push(statusHint);
      } else {
        output.system.push(`\n### No Active Hive Feature\nFor multi-step tasks, consider using \`hive_feature_create\` to track progress.\n`);
      }
    },

    "experimental.session.compacting": async (
      _input: unknown,
      output: { context: string[]; prompt?: string }
    ) => {
      const hiveContext = await getHiveContextForCompaction(featureService, stepService);
      if (hiveContext) {
        output.context.push(hiveContext);
      }
    },

    tool: {
      hive_feature_create: createFeatureCreateTool(featureService),
      hive_feature_list: createFeatureListTool(featureService),
      hive_feature_switch: createFeatureSwitchTool(featureService),
      hive_feature_complete: createFeatureCompleteTool(featureService),

      hive_step_create: createStepCreateTool(stepService, featureService, decisionService),
      hive_step_read: createStepReadTool(stepService, featureService),
      hive_step_update: createStepUpdateTool(stepService, featureService),
      hive_step_delete: createStepDeleteTool(stepService, featureService),
      hive_step_list: createStepListTool(stepService, featureService),

      hive_decision_log: createDecisionLogTool(decisionService, featureService),
      hive_decision_list: createDecisionListTool(decisionService, featureService),

      hive_exec_start: createExecStartTool(worktreeService, stepService, featureService, directory, planService, commentService),
      hive_exec_complete: createExecCompleteTool(worktreeService, stepService, featureService, directory),
      hive_exec_abort: createExecAbortTool(worktreeService, stepService, featureService, directory),
      hive_exec_revert: createExecRevertTool(worktreeService, stepService, featureService, directory),

      hive_status: createStatusTool(featureService, stepService, decisionService),

      hive_plan_generate: createPlanGenerateTool(planService, featureService, stepService, decisionService),
      hive_plan_read: createPlanReadTool(planService, featureService),
      hive_plan_update: createPlanUpdateTool(planService, featureService),
      hive_plan_approve: createPlanApproveTool(planService, featureService),
      hive_plan_lock: createPlanLockTool(planService, featureService),
    },

    command: {
      hive: {
        description: "Create a new feature: /hive <feature-name>",
        async run(args: string) {
          const name = args.trim();
          if (!name) return "Usage: /hive <feature-name>";
          return `Create feature "${name}" using hive_feature_create tool. Ask for the problem description.`;
        },
      },
    },
  };
};

export default plugin;
