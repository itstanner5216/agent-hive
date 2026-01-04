import * as fs from 'fs'
import * as path from 'path'

export interface StepUpdateParams {
  feature: string
  step: string
  status?: 'pending' | 'wip' | 'done' | 'bug'
  summary?: string
}

export interface StepUpdateResult {
  updated: boolean
}

export async function hive_step_update(
  params: StepUpdateParams,
  context: { sessionId: string }
): Promise<StepUpdateResult> {
  const filePath = path.resolve(
    process.cwd(),
    '.hive',
    'features',
    params.feature,
    'execution',
    `${params.step}.json`
  )

  const step = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  if (params.status) {
    step.status = params.status
    if (params.status === 'wip' && !step.startedAt) {
      step.startedAt = new Date().toISOString()
    }
    if (params.status === 'done') {
      step.completedAt = new Date().toISOString()
    }
  }

  if (params.summary) {
    step.summary = params.summary
  }

  step.sessions.opencode = {
    sessionId: context.sessionId,
    lastActive: new Date().toISOString()
  }

  fs.writeFileSync(filePath, JSON.stringify(step, null, 2))

  return { updated: true }
}
