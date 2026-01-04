export interface Feature {
  name: string
  progress: number
  steps: Step[]
}

export interface Step {
  name: string
  order: number
  spec: string
  status: 'pending' | 'wip' | 'done' | 'bug'
  startedAt: string | null
  completedAt: string | null
  summary: string | null
  sessions: SessionMap
}

export interface SessionMap {
  opencode?: SessionInfo
  claude?: SessionInfo
}

export interface SessionInfo {
  sessionId: string
  lastActive: string
}

export interface ProblemDocs {
  ticket?: string
  requirements?: string
  notes?: string
}

export interface ContextDocs {
  decisions?: string
  architecture?: string
  constraints?: string
}
