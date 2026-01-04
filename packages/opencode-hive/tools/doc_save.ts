import * as fs from 'fs'
import * as path from 'path'

export interface DocSaveParams {
  feature: string
  folder: 'problem' | 'context'
  filename: string
  content: string
  append?: boolean
}

export interface DocSaveResult {
  path: string
  saved: boolean
}

export async function hive_doc_save(
  params: DocSaveParams
): Promise<DocSaveResult> {
  const filePath = path.resolve(
    process.cwd(),
    '.hive',
    'features',
    params.feature,
    params.folder,
    params.filename
  )

  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (params.append) {
    fs.appendFileSync(filePath, params.content + '\n')
  } else {
    fs.writeFileSync(filePath, params.content)
  }

  return { path: filePath, saved: true }
}
