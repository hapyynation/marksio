import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const RECOMMENDATIONS = {
  bounceRate: {
    threshold: 2,
    message: 'Geri dönüş oranınız yüksek. Listenizdeki geçersiz e-posta adreslerini temizleyin.',
  },
  complaintRate: {
    threshold: 0.1,
    message: 'Şikayet oranınız yüksek. E-posta içeriklerinizi ve gönderim sıklığınızı gözden geçirin.',
  },
  openRate: {
    threshold: 15,
    message: 'Açılma oranınız düşük. Konu satırlarınızı ve gönderim zamanlamanızı optimize edin.',
    invert: true,
  },
  deliveryRate: {
    threshold: 95,
    message: 'Teslim oranınız düşük. Alan adı doğrulamanızı kontrol edin.',
    invert: true,
  },
}

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const uid = session.user.id

  const health = await prisma.emailHealthScore.findUnique({ where: { userId: uid } })

  if (!health) {
    return NextResponse.json({
      score: null,
      status: 'unknown',
      rates: {},
      recommendations: [],
      lastCalculated: null,
    })
  }

  const recommendations: string[] = []

  if (health.bounceRate > RECOMMENDATIONS.bounceRate.threshold) {
    recommendations.push(RECOMMENDATIONS.bounceRate.message)
  }
  if (health.complaintRate > RECOMMENDATIONS.complaintRate.threshold) {
    recommendations.push(RECOMMENDATIONS.complaintRate.message)
  }
  if (health.openRate < RECOMMENDATIONS.openRate.threshold) {
    recommendations.push(RECOMMENDATIONS.openRate.message)
  }
  if (health.deliveryRate < RECOMMENDATIONS.deliveryRate.threshold) {
    recommendations.push(RECOMMENDATIONS.deliveryRate.message)
  }

  return NextResponse.json({
    score: health.score,
    status: health.status,
    rates: {
      bounceRate:      health.bounceRate,
      complaintRate:   health.complaintRate,
      openRate:        health.openRate,
      deliveryRate:    health.deliveryRate,
      unsubscribeRate: health.unsubscribeRate,
    },
    recommendations,
    lastCalculated: health.lastCalculated,
  })
}
