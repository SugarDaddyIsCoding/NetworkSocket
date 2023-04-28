import { NextRequest } from 'next/server'
import { OpenAI } from 'openai-streams'

const max_tokens = process.env.MAX_TOKENS
  ? parseInt(process.env.MAX_TOKENS)
  : 20

export default async function handler(req: NextRequest) {
  const { messages } = await req.json()

  const stream = await OpenAI('chat', {
    model: 'gpt-3.5-turbo',
    max_tokens,
    messages,
  })
  return new Response(stream)
}

export const config = {
  runtime: 'experimental-edge',
}
