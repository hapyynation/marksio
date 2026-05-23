import { NextRequest } from 'next/server'
import { groq, GROQ_MODEL, SYSTEM_PROMPT } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        const stream = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          max_tokens: 1024,
          temperature: 0.7,
          stream: true,
        })

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Groq hatası'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
