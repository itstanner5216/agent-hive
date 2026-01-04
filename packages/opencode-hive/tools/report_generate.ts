import * as fs from 'fs'
import * as path from 'path'

export interface ReportGenerateParams {
  feature: string
  content: string
}

export interface ReportGenerateResult {
  path: string
  saved: boolean
}

export async function hive_report_generate(
  params: ReportGenerateParams
): Promise<ReportGenerateResult> {
  const reportPath = path.resolve(
    process.cwd(),
    '.hive',
    'features',
    params.feature,
    'report.md'
  )

  fs.writeFileSync(reportPath, params.content)

  return { path: reportPath, saved: true }
}
