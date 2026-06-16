import { Client } from '@upstash/qstash'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marksio.com'

export async function scheduleAutomationResume(
  runId: string,
  resumeAt: Date,
): Promise<string | null> {
  try {
    const delaySeconds = Math.max(
      Math.floor((resumeAt.getTime() - Date.now()) / 1000),
      1,
    )

    const result = await qstash.publishJSON({
      url: `${APP_URL}/api/automations/resume`,
      delay: delaySeconds,
      body: { runId },
    })

    return result.messageId
  } catch (error) {
    console.error('QStash schedule error:', error)
    return null
  }
}

export async function cancelScheduledResume(messageId: string): Promise<void> {
  try {
    await qstash.messages.delete(messageId)
  } catch {
    // Mesaj zaten çalışmış olabilir
  }
}

export async function verifyQStashSignature(req: Request): Promise<boolean> {
  try {
    const { Receiver } = await import('@upstash/qstash')
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    })

    const body = await req.text()
    const signature = req.headers.get('upstash-signature') ?? ''

    await receiver.verify({
      signature,
      body,
      url: `${APP_URL}/api/automations/resume`,
    })

    return true
  } catch {
    return false
  }
}
