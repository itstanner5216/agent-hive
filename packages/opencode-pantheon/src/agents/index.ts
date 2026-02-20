/**
 * Pantheon Agents (Eridu Deity Suite)
 * 
 * The Eridu Pantheon Model:
 * - Enlil (Validator): Validates plans against iron laws
 * - Enki (Planner): Plans features through discovery and interviews
 * - Marduk (Orchestrator): Orchestrates execution, delegates, spawns workers
 * - Adapa (Explorer): Researches codebase and external docs/data
 * - Kulla (Coder): Executes tasks in isolated worktrees
 * - Nanshe (Reviewer): Reviews code quality and correctness
 * - Enbilulu (Tester): Writes and runs tests
 * - Mushdamma (Phase Reviewer): Benched — not active in any mode
 * - Isimud (Ideator): Benched — not active in any mode
 * - Asalluhi (Critical Implementer): Resolves blockages and complex tasks
 */

// Pantheon agents (Eridu deity suite)
export { ENLIL_PROMPT } from './enlil';
export { ENKI_PROMPT } from './enki';
export { MARDUK_PROMPT } from './marduk';
export { ADAPA_PROMPT } from './adapa';
export { KULLA_PROMPT } from './kulla';
export { NANSHE_PROMPT } from './nanshe';
export { ENBILULU_PROMPT } from './enbilulu';
export { MUSHDAMMA_PROMPT } from './mushdamma';
export { ISIMUD_PROMPT } from './isimud';
export { ASALLUHI_PROMPT } from './asalluhi';


/**
 * Agent registry for OpenCode plugin
 * 
 * Pantheon Agents:
 * - enlil-validator: Plan validator (APPROVE/REJECT)
 * - enki-planner: Planner/architect (discovery, interviews, plans)
 * - marduk-orchestrator: Orchestrator (delegates, verifies, merges)
 * - adapa-explorer: Explorer/researcher (codebase + external docs)
 * - kulla-coder: Coder/worker (executes tasks in worktrees)
 * - nanshe-reviewer: Code reviewer (quality, correctness, standards)
 * - enbilulu-tester: Tester (writes and runs tests)
 * - mushdamma-phase-reviewer: Benched — not active in any mode
 * - isimud-ideator: Benched — not active in any mode
 * - asalluhi-prompter: Critical implementer (resolves blockages, complex tasks)
 */
export const pantheonAgents = {
  'enlil-validator': {
    name: 'Enlil (Plan Validator)',
    description: 'Validates plans against iron laws. APPROVE/REJECT verdict.',
    mode: 'subagent' as const,
  },
  'enki-planner': {
    name: 'Enki (Planner)',
    description: 'Plans features through discovery and interviews. NEVER executes.',
    mode: 'primary' as const,
  },
  'marduk-orchestrator': {
    name: 'Marduk (Orchestrator)',
    description: 'Orchestrates execution. Delegates, spawns workers, verifies, merges.',
    mode: 'primary' as const,
  },
  'adapa-explorer': {
    name: 'Adapa (Explorer)',
    description: 'Researches codebase and external docs/data.',
    mode: 'subagent' as const,
  },
  'kulla-coder': {
    name: 'Kulla (Coder)',
    description: 'Executes tasks directly in isolated worktrees. Never delegates.',
    mode: 'subagent' as const,
  },
  'nanshe-reviewer': {
    name: 'Nanshe (Code Reviewer)',
    description: 'Reviews code quality and correctness. OKAY/REJECT verdict.',
    mode: 'subagent' as const,
  },
  'enbilulu-tester': {
    name: 'Enbilulu (Tester)',
    description: 'Writes and runs tests, validates implementation correctness.',
    mode: 'subagent' as const,
  },
  'mushdamma-phase-reviewer': {
    name: 'Mushdamma (Phase Reviewer)',
    description: 'Reviews completed phases before next phase begins.',
    mode: 'subagent' as const,
  },
  'isimud-ideator': {
    name: 'Isimud (Idea Architect)',
    description: 'Shapes raw ideas into implementable concepts. Pre-pipeline.',
    mode: 'primary' as const,
  },
  'asalluhi-prompter': {
    name: 'Asalluhi (Critical Implementer)',
    description: 'Resolves blockages, implements complex tasks that other agents cannot. Critical path agent.',
    mode: 'primary' as const,
  },
};
