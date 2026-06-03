-- Mail altyapısı schema güncellemesi
-- Çalıştır: Supabase SQL editor veya psql

-- Customer tablosuna bounce/complaint alanları ekle
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "bounced"      BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "bouncedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "complained"   BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "complainedAt" TIMESTAMP(3);

-- EmailDomain tablosuna gönderici konfigürasyon alanları ekle
ALTER TABLE "EmailDomain"
  ADD COLUMN IF NOT EXISTS "fromPrefix"  TEXT NOT NULL DEFAULT 'kampanya',
  ADD COLUMN IF NOT EXISTS "senderName"  TEXT;

-- Mevcut fromEmail'lerden fromPrefix türet (opsiyonel)
UPDATE "EmailDomain"
SET "fromPrefix" = SPLIT_PART("fromEmail", '@', 1)
WHERE "fromEmail" IS NOT NULL AND "fromPrefix" = 'kampanya';
