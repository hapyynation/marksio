/**
 * Mail altyapısı migration script
 * Çalıştır: npx ts-node scripts/apply-mail-migration.ts
 * VEYA: Dev server'ı durdur, ardından: npx prisma db push
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Mail migration başlatılıyor...')

  // Raw SQL ile yeni kolonları ekle (Prisma db push'un yapamadığı durumlarda)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Customer"
    ADD COLUMN IF NOT EXISTS "bounced"      BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "bouncedAt"    TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "complained"   BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "complainedAt" TIMESTAMP(3)
  `)
  console.log('✓ Customer tablosuna bounce/complaint alanları eklendi')

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "EmailDomain"
    ADD COLUMN IF NOT EXISTS "fromPrefix" TEXT NOT NULL DEFAULT 'kampanya',
    ADD COLUMN IF NOT EXISTS "senderName" TEXT
  `)
  console.log('✓ EmailDomain tablosuna fromPrefix/senderName alanları eklendi')

  // Mevcut fromEmail'lerden fromPrefix türet
  await prisma.$executeRawUnsafe(`
    UPDATE "EmailDomain"
    SET "fromPrefix" = SPLIT_PART("fromEmail", '@', 1)
    WHERE "fromEmail" IS NOT NULL AND "fromPrefix" = 'kampanya'
  `)
  console.log('✓ Mevcut domainlerin fromPrefix değerleri güncellendi')

  console.log('\nMail migration tamamlandı!')
  console.log('Ardından: npx prisma generate (dev server durdurulmuşken)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
