import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    const products = await prisma.campaignProduct.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(products)
  } catch (err) {
    console.error('[Products GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    const body = await req.json()
    const product = await prisma.campaignProduct.create({
      data: {
        userId,
        productName: body.productName,
        productImage: body.productImage || null,
        price: body.price ? parseFloat(body.price) : null,
        compareAtPrice: body.compareAtPrice ? parseFloat(body.compareAtPrice) : null,
        description: body.description || null,
        category: body.category || null,
        productUrl: body.productUrl || null,
        platformId: body.platformId || null,
        source: body.source || 'manual',
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('[Products POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    const { id } = await req.json()
    await prisma.campaignProduct.deleteMany({ where: { id, userId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Products DELETE]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
