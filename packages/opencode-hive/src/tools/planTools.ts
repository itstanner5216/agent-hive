import { z } from 'zod';
import { PlanService } from '../services/planService.js';
import { FeatureService } from '../services/featureService.js';

export function createPlanTools(projectRoot: string) {
  const planService = new PlanService(projectRoot);
  const featureService = new FeatureService(projectRoot);

  return {
    hive_plan_write: {
      description: 'Create or update the plan.md for the active feature. Clears any existing comments (new plan = fresh review).',
      parameters: z.object({
        content: z.string().describe('The markdown content for the plan'),
        featureName: z.string().optional().describe('Feature name (defaults to active feature)'),
      }),
      execute: async ({ content, featureName }: { content: string; featureName?: string }) => {
        const feature = featureName || featureService.getActive();
        if (!feature) {
          return { error: 'No active feature. Create one with hive_feature_create first.' };
        }

        const path = planService.write(feature, content);
        return { path, message: `Plan written to ${path}. Comments cleared for fresh review.` };
      },
    },

    hive_plan_read: {
      description: 'Read the plan.md and any user comments for the active feature.',
      parameters: z.object({
        featureName: z.string().optional().describe('Feature name (defaults to active feature)'),
      }),
      execute: async ({ featureName }: { featureName?: string }) => {
        const feature = featureName || featureService.getActive();
        if (!feature) {
          return { error: 'No active feature.' };
        }

        const result = planService.read(feature);
        if (!result) {
          return { error: `No plan.md found for feature '${feature}'` };
        }

        return result;
      },
    },

    hive_plan_approve: {
      description: 'Approve the plan for execution. After approval, run hive_tasks_sync to generate tasks.',
      parameters: z.object({
        featureName: z.string().optional().describe('Feature name (defaults to active feature)'),
      }),
      execute: async ({ featureName }: { featureName?: string }) => {
        const feature = featureName || featureService.getActive();
        if (!feature) {
          return { error: 'No active feature.' };
        }

        const comments = planService.getComments(feature);
        if (comments.length > 0) {
          return { 
            error: `Cannot approve: ${comments.length} unresolved comment(s). Address comments and rewrite plan first.`,
            comments,
          };
        }

        planService.approve(feature);
        return { 
          approved: true, 
          message: 'Plan approved. Run hive_tasks_sync to generate tasks from the plan.',
        };
      },
    },
  };
}
