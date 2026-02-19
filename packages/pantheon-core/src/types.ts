export type FeatureStatusType = 'planning' | 'approved' | 'executing' | 'completed';

export interface FeatureJson {
  name: string;
  status: FeatureStatusType;
  ticket?: string;
  sessionId?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

export type TaskStatusType = 'pending' | 'in_progress' | 'done' | 'cancelled' | 'blocked' | 'failed' | 'partial';
export type TaskOrigin = 'plan' | 'manual';
export type SubtaskType = 'test' | 'implement' | 'review' | 'verify' | 'research' | 'debug' | 'custom';

export interface Subtask {
  id: string;
  name: string;
  folder: string;
  status: TaskStatusType;
  type?: SubtaskType;
  createdAt?: string;
  completedAt?: string;
}

export interface SubtaskStatus {
  status: TaskStatusType;
  type?: SubtaskType;
  createdAt: string;
  completedAt?: string;
}

/** Worker session information for background task execution */
export interface WorkerSession {
  /** Background task ID from OMO-Slim */
  taskId?: string;
  /** Unique session identifier */
  sessionId: string;
  /** Worker instance identifier */
  workerId?: string;
  /** Agent type handling this task */
  agent?: string;
  /** Execution mode: inline (same session) or delegate (background) */
  mode?: 'inline' | 'delegate';
  /** ISO timestamp of last heartbeat */
  lastHeartbeatAt?: string;
  /** Current attempt number (1-based) */
  attempt?: number;
  /** Number of messages exchanged in session */
  messageCount?: number;
}

export interface TaskStatus {
  /** Schema version for forward compatibility (default: 1) */
  schemaVersion?: number;
  status: TaskStatusType;
  origin: TaskOrigin;
  planTitle?: string;
  summary?: string;
  startedAt?: string;
  completedAt?: string;
  baseCommit?: string;
  subtasks?: Subtask[];
  /** Idempotency key for safe retries */
  idempotencyKey?: string;
  /** Worker session info for background execution */
  workerSession?: WorkerSession;
  /**
   * Task dependencies expressed as task folder names (e.g., '01-setup', '02-core-api').
   * A task cannot start until all its dependencies have status 'done'.
   * Resolved from plan.md dependency annotations during pantheon_tasks_sync.
   */
  dependsOn?: string[];
}

export interface PlanComment {
  id: string;
  line: number;
  body: string;
  author: string;
  timestamp: string;
}

export interface CommentsJson {
  threads: PlanComment[];
}

export interface PlanReadResult {
  content: string;
  status: FeatureStatusType;
  comments: PlanComment[];
}

export interface TasksSyncResult {
  created: string[];
  removed: string[];
  kept: string[];
  manual: string[];
}

export interface TaskInfo {
  folder: string;
  name: string;
  status: TaskStatusType;
  origin: TaskOrigin;
  planTitle?: string;
  summary?: string;
}

export interface FeatureInfo {
  name: string;
  status: FeatureStatusType;
  tasks: TaskInfo[];
  hasPlan: boolean;
  commentCount: number;
}

export interface ContextFile {
  name: string;
  content: string;
  updatedAt: string;
}

export interface SessionInfo {
  sessionId: string;
  taskFolder?: string;
  startedAt: string;
  lastActiveAt: string;
  messageCount?: number;
}

export interface SessionsJson {
  master?: string;
  sessions: SessionInfo[];
}

export interface TaskSpec {
  taskFolder: string;
  featureName: string;
  planSection: string;
  context: string;
  priorTasks: Array<{ folder: string; summary?: string }>;
}

/** Agent model/temperature configuration */
export interface AgentModelConfig {
  /** Model to use - format: "provider/model-id" (e.g., 'anthropic/claude-sonnet-4-20250514') */
  model?: string;
  /** Temperature for generation (0-2) */
  temperature?: number;
  /** Skills to enable for this agent */
  skills?: string[];
  /** Skills to auto-load for this agent */
  autoLoadSkills?: string[];
  /** Variant key for model reasoning/effort level (e.g., 'low', 'medium', 'high', 'max') */
  variant?: string;
}

export interface HiveConfig {
  /** Schema reference for config file */
  $schema?: string;
  /** Enable pantheon tools for specific features */
  enableToolsFor?: string[];
  /** Globally disable specific skills (won't appear in pantheon_skill tool) */
  disableSkills?: string[];
  /** Globally disable specific MCP servers. Available: websearch, context7, grep_app, ast_grep */
  disableMcps?: string[];
  /** Enable OMO-Slim delegation (optional integration) */
  omoSlimEnabled?: boolean;
  /** Choose between agent modes: full (10 agents), core (6 agents), lean (4 agents) */
  agentMode?: 'full' | 'core' | 'lean';
  /** Agent configuration */
  agents?: {
    /** Enlil - Plan Validator */
    'enlil-validator'?: AgentModelConfig;
    /** Enki - Planner (Architect) */
    'enki-planner'?: AgentModelConfig;
    /** Nudimmud - Orchestrator */
    'nudimmud-orchestrator'?: AgentModelConfig;
    /** Adapa - Explorer / Researcher */
    'adapa-explorer'?: AgentModelConfig;
    /** Kulla - Coder (Worker) */
    'kulla-coder'?: AgentModelConfig;
    /** Nanshe - Code Reviewer */
    'nanshe-reviewer'?: AgentModelConfig;
    /** Enbilulu - Tester */
    'enbilulu-tester'?: AgentModelConfig;
    /** Mushdamma - Phase Reviewer */
    'mushdamma-phase-reviewer'?: AgentModelConfig;
    /** Isimud - Idea Architect */
    'isimud-ideator'?: AgentModelConfig;
    /** Asalluhi - Prompt Engineer */
    'asalluhi-prompter'?: AgentModelConfig;
  };
  /** Sandbox mode for worker isolation */
  sandbox?: 'none' | 'docker';
  /** Docker image to use when sandbox is 'docker' (optional explicit override) */
  dockerImage?: string;
  /** Reuse Docker containers per worktree (default: true when sandbox is 'docker') */
  persistentContainers?: boolean;
  /** Hook execution cadence (number of turns between hook invocations). Key = hook name, Value = cadence (1 = every turn, 3 = every 3rd turn) */
  hook_cadence?: Record<string, number>;
}

/** Default models for Pantheon agents */
export const DEFAULT_AGENT_MODELS = {
  'enlil-validator': 'github-copilot/claude-sonnet-4-20250514',
  'enki-planner': 'github-copilot/gpt-5.2-codex',
  'nudimmud-orchestrator': 'github-copilot/claude-opus-4.5',
  'adapa-explorer': 'zai-coding-plan/glm-4.7',
  'kulla-coder': 'github-copilot/gpt-5.2-codex',
  'nanshe-reviewer': 'github-copilot/gpt-5.2-codex',
  'enbilulu-tester': 'github-copilot/gpt-5.2-codex',
  'mushdamma-phase-reviewer': 'github-copilot/claude-sonnet-4-20250514',
  'isimud-ideator': 'github-copilot/claude-sonnet-4-20250514',
  'asalluhi-prompter': 'github-copilot/claude-sonnet-4-20250514',
} as const;

export const DEFAULT_HIVE_CONFIG: HiveConfig = {
  $schema: 'https://raw.githubusercontent.com/tctinh/agent-hive/main/packages/opencode-pantheon/schema/agent_pantheon.schema.json',
  enableToolsFor: [],
  disableSkills: [],
  disableMcps: [],
  agentMode: 'full',
  sandbox: 'none',
  agents: {
    'enlil-validator': {
      model: DEFAULT_AGENT_MODELS['enlil-validator'],
      temperature: 0.3,
      skills: [],
      autoLoadSkills: [],
    },
    'enki-planner': {
      model: DEFAULT_AGENT_MODELS['enki-planner'],
      temperature: 0.7,
      skills: ['brainstorming', 'writing-plans'],
      autoLoadSkills: ['parallel-exploration'],
    },
    'nudimmud-orchestrator': {
      model: DEFAULT_AGENT_MODELS['nudimmud-orchestrator'],
      temperature: 0.5,
      skills: ['dispatching-parallel-agents', 'executing-plans'],
      autoLoadSkills: [],
    },
    'adapa-explorer': {
      model: DEFAULT_AGENT_MODELS['adapa-explorer'],
      temperature: 0.5,
      skills: [],
      autoLoadSkills: [],
    },
    'kulla-coder': {
      model: DEFAULT_AGENT_MODELS['kulla-coder'],
      temperature: 0.3,
      autoLoadSkills: ['test-driven-development', 'verification-before-completion'],
    },
    'nanshe-reviewer': {
      model: DEFAULT_AGENT_MODELS['nanshe-reviewer'],
      temperature: 0.3,
      skills: ['systematic-debugging', 'code-reviewer'],
      autoLoadSkills: [],
    },
    'enbilulu-tester': {
      model: DEFAULT_AGENT_MODELS['enbilulu-tester'],
      temperature: 0.3,
      skills: ['test-driven-development'],
      autoLoadSkills: [],
    },
    'mushdamma-phase-reviewer': {
      model: DEFAULT_AGENT_MODELS['mushdamma-phase-reviewer'],
      temperature: 0.3,
      skills: [],
      autoLoadSkills: [],
    },
    'isimud-ideator': {
      model: DEFAULT_AGENT_MODELS['isimud-ideator'],
      temperature: 0.7,
      skills: ['brainstorming'],
      autoLoadSkills: [],
    },
    'asalluhi-prompter': {
      model: DEFAULT_AGENT_MODELS['asalluhi-prompter'],
      temperature: 0.5,
      skills: [],
      autoLoadSkills: [],
    },
  },
};
