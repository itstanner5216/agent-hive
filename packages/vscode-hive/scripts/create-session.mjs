#!/usr/bin/env node
import { createOpencodeClient } from '@opencode-ai/sdk'

const [,, title, prompt] = process.argv

if (!title || !prompt) {
  console.error('Usage: create-session.mjs <title> <prompt>')
  process.exit(1)
}

const client = await createOpencodeClient({ baseUrl: 'http://localhost:4096' })
const response = await client.session.create({ body: { title } })
const sessionId = response.data?.id

if (!sessionId) {
  console.error('Failed to create session')
  process.exit(1)
}

await client.session.prompt({
  path: { id: sessionId },
  body: {
    noReply: true,
    parts: [{ type: 'text', text: prompt }]
  }
})

console.log(sessionId)
