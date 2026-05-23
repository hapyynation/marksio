import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const customer = await prisma.customer.findFirst({
      where: { unsubscribeToken: params.token },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Geçersiz link' }, { status: 404 })
    }
    if (customer.unsubscribed) {
      return NextResponse.json({ already: true, email: customer.email })
    }
    await prisma.customer.update({
      where: { id: customer.id },
      data: { unsubscribed: true },
    })
    return NextResponse.json({ success: true, email: customer.email })
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
