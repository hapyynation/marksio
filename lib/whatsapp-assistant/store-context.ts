import { prisma } from '@/lib/prisma'

export async function getStoreContextForAssistant(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      storeName: true,
      currency: true,
    },
  })

  if (!user) return ''

  const lines: string[] = []
  if (user.storeName) lines.push(`Mağaza adı: ${user.storeName}`)
  if (user.currency) lines.push(`Para birimi: ${user.currency}`)

  return lines.join('\n')
}
