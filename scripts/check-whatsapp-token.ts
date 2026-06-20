/**
 * WhatsApp token tanılama scripti
 *
 * Kullanım A — ENCRYPTION_KEY varsa (Vercel'den alarak .env.local'a ekle):
 *   ENCRYPTION_KEY=<64hex> TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}' node --env-file=.env.local node_modules/ts-node/dist/bin.js scripts/check-whatsapp-token.ts
 *
 * Kullanım B — Token'ı direkt argüman olarak ver:
 *   TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}' node --env-file=.env.local node_modules/ts-node/dist/bin.js scripts/check-whatsapp-token.ts EAABcde...rawtoken
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rawTokenArg = process.argv[2]

  const accounts = await prisma.whatsappAccount.findMany({
    where: { status: 'CONNECTED' },
    select: {
      id: true,
      phoneNumberId: true,
      wabaId: true,
      accessToken: true,
    },
  })

  if (accounts.length === 0) {
    console.log("DB'de bağlı WhatsApp hesabı bulunamadı.")
    return
  }

  for (const account of accounts) {
    console.log(`\n--- Hesap: ${account.id} | phoneNumberId: ${account.phoneNumberId} ---`)

    let token: string

    if (rawTokenArg) {
      console.log('Token kaynağı: CLI argümanı (raw)')
      token = rawTokenArg
    } else if (process.env.ENCRYPTION_KEY) {
      const { decrypt } = await import('../lib/encryption')
      try {
        token = decrypt(account.accessToken)
        console.log('Token decrypt: OK (ilk 20 karakter):', token.slice(0, 20) + '...')
      } catch (err) {
        console.error('Token decrypt HATA:', err)
        continue
      }
    } else {
      console.error(
        'ENCRYPTION_KEY bulunamadı ve raw token argümanı verilmedi.\n' +
        "  Seçenek 1: ENCRYPTION_KEY'i Vercel Dashboard'dan alıp komuta prefix ekle:\n" +
        '    ENCRYPTION_KEY=<64hex> ... node ... scripts/check-whatsapp-token.ts\n' +
        '  Seçenek 2: Raw token argümanı ver:\n' +
        '    ... node ... scripts/check-whatsapp-token.ts EAABcde...'
      )
      continue
    }

    const url = `https://graph.facebook.com/v19.0/${account.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`
    console.log('Meta API isteği:', url)

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const body = await res.json() as {
      display_phone_number?: string
      verified_name?: string
      quality_rating?: string
      error?: { message?: string; code?: number; type?: string; fbtrace_id?: string }
    }

    if (res.ok) {
      console.log('✓ Token GEÇERLİ')
      console.log('  Numara:', body.display_phone_number)
      console.log('  Doğrulanmış Ad:', body.verified_name)
      console.log('  Kalite:', body.quality_rating)
    } else {
      console.error('✗ Token GEÇERSİZ veya HATALI')
      console.error('  HTTP Status:', res.status)
      console.error('  Meta Hata Kodu:', body.error?.code)
      console.error('  Meta Hata Mesajı:', body.error?.message)
      console.error('  Meta Hata Tipi:', body.error?.type)
      console.error('  Trace ID:', body.error?.fbtrace_id)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
