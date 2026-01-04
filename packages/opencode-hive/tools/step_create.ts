import * as fs from 'fs'
import * as path from 'path'

export interface StepCreateParams {
  feature: string
  order: number
  name: string
  spec: string
}

export interface StepCreateResult {
  path: string
  created: boolean
}

export async function hive_step_create(
  params: StepCreateParams
): Promise<StepCreateResult> {
  const fileName = `${String(params.order).padStart(2, '0')}-${params.name}.json`
  const filePath = path.resolve(
    process.cwd(),
    '.hive',
    'features',
    params.feature,
    'execution',
    fileName
  )

  const step = {
    name: params.name,
    order: params.order,
    spec: params.spec,
    status: 'pending',
    startedAt: null,
    completedAt: null,
    summary: null,
    sessions: {}
  }

  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, JSON.stringify(step, null, 2))

  return { path: filePath, created: true }
}
