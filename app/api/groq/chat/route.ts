import { NextRequest } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { groq, GROQ_MODEL, buildSystemPrompt, type UserStats } from '@/lib/groq'

async function getUserStats(userId: string, storeName: string): Promise<UserStats> {
  try {
    const [
      emailAgg, waAgg, customerCount,
      campaignCount, ordersAgg,
      vipCount, loyalCount, atRiskCount, newCount, inactiveCount,
    ] = await Promise.all([
      prisma.campaign.aggregate({ where: { userId, type: 'email' }, _sum: { sent: true, opened: true, revenue: true } }),
      prisma.campaign.aggregate({ where: { userId, type: 'whatsapp' }, _sum: { sent: true } }),
      prisma.customer.count({ where: { userId } }),
      prisma.campaign.count({ where: { userId, status: 'active' } }),
      prisma.order.aggregate({ where: { userId, financialStatus: 'paid' }, _sum: { total: true }, _count: { id: true } }),
      prisma.customer.count({ where: { userId, segment: 'vip'      } }),
      prisma.customer.count({ where: { userId, segment: 'loyal'    } }),
      prisma.customer.count({ where: { userId, segment: 'at_risk'  } }),
      prisma.customer.count({ where: { userId, segment: 'new'      } }),
      prisma.customer.count({ where: { userId, segment: 'inactive' } }),
    ])

    const emailSent   = emailAgg._sum.sent    ?? 0
    const emailOpened = emailAgg._sum.opened  ?? 0
    const totalOrders = ordersAgg._count.id
    const totalRev    = ordersAgg._sum.total  ?? 0

    return {
      storeName,
      totalRevenue:     Math.round((emailAgg._sum.revenue ?? 0) + (waAgg._sum.sent ?? 0)),
      totalCustomers:   customerCount,
      activeCampaigns:  campaignCount,
      avgOrderValue:    totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0,
      emailSent,
      emailOpenRate:    emailSent > 0 ? Math.round((emailOpened / emailSent) * 100) : 0,
      waSent:           waAgg._sum.sent ?? 0,
      vipCount,
      loyalCount,
      atRiskCount,
      newCount,
      inactiveCount,
    }
  } catch {
    return {
      storeName, totalRevenue: 0, totalCustomers: 0, activeCampaigns: 0,
      avgOrderValue: 0, emailSent: 0, emailOpenRate: 0, waSent: 0,
      vipCount: 0, loyalCount: 0, atRiskCount: 0, newCount: 0, inactiveCount: 0,
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Kullanıcı datasını al — mümkünse dinamik prompt yap
    let systemPrompt: string
    const session = await getApiSession()
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { storeName: true },
      })
      const stats = await getUserStats(session.user.id, user?.storeName ?? 'Mağazanız')
      systemPrompt = buildSystemPrompt(stats)
    } else {
      const { SYSTEM_PROMPT } = await import('@/lib/groq')
      systemPrompt = SYSTEM_PROMPT
    }

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        const stream = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
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
