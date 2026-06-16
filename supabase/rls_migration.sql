-- ═══════════════════════════════════════════════════════════════
-- Marksio — RLS Migration + AIAsset Table
-- Supabase SQL Editor'da veya prisma db execute ile çalıştır.
-- Tablo isimleri Prisma schema'dan alınmıştır.
-- ═══════════════════════════════════════════════════════════════

-- ── ADIM 1: RLS'yi tüm tablolarda etkinleştir ───────────────────

ALTER TABLE "User"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignRevenue"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignProduct"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignOpen"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailEvent"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerEvent"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Automation"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationRun"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationRunStep"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationLog"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlowExecution"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Segment"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncLog"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerification"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailDomain"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppSettings"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppQuickReply"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppMessage"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppCampaign"     ENABLE ROW LEVEL SECURITY;

-- ── ADIM 2: RLS policy'leri ekle ────────────────────────────────
-- userId TEXT tipinde, auth.uid() UUID döner → ::text cast zorunlu.

-- User (profil — id üzerinden izolasyon)
DROP POLICY IF EXISTS "user_isolation" ON "User";
CREATE POLICY "user_isolation" ON "User"
  FOR ALL USING (auth.uid()::text = id);

-- Campaign
DROP POLICY IF EXISTS "user_isolation" ON "Campaign";
CREATE POLICY "user_isolation" ON "Campaign"
  FOR ALL USING (auth.uid()::text = "userId");

-- CampaignRevenue
DROP POLICY IF EXISTS "user_isolation" ON "CampaignRevenue";
CREATE POLICY "user_isolation" ON "CampaignRevenue"
  FOR ALL USING (auth.uid()::text = "userId");

-- CampaignProduct
DROP POLICY IF EXISTS "user_isolation" ON "CampaignProduct";
CREATE POLICY "user_isolation" ON "CampaignProduct"
  FOR ALL USING (auth.uid()::text = "userId");

-- CampaignOpen
DROP POLICY IF EXISTS "user_isolation" ON "CampaignOpen";
CREATE POLICY "user_isolation" ON "CampaignOpen"
  FOR ALL USING (auth.uid()::text = "userId");

-- EmailEvent (Campaign üzerinden join — kendi userId yok)
DROP POLICY IF EXISTS "user_isolation" ON "EmailEvent";
CREATE POLICY "user_isolation" ON "EmailEvent"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "EmailEvent"."campaignId"
        AND auth.uid()::text = c."userId"
    )
  );

-- Customer
DROP POLICY IF EXISTS "user_isolation" ON "Customer";
CREATE POLICY "user_isolation" ON "Customer"
  FOR ALL USING (auth.uid()::text = "userId");

-- Integration
DROP POLICY IF EXISTS "user_isolation" ON "Integration";
CREATE POLICY "user_isolation" ON "Integration"
  FOR ALL USING (auth.uid()::text = "userId");

-- Order
DROP POLICY IF EXISTS "user_isolation" ON "Order";
CREATE POLICY "user_isolation" ON "Order"
  FOR ALL USING (auth.uid()::text = "userId");

-- OrderItem (Order üzerinden join)
DROP POLICY IF EXISTS "user_isolation" ON "OrderItem";
CREATE POLICY "user_isolation" ON "OrderItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Order" o
      WHERE o.id = "OrderItem"."orderId"
        AND auth.uid()::text = o."userId"
    )
  );

-- CustomerEvent
DROP POLICY IF EXISTS "user_isolation" ON "CustomerEvent";
CREATE POLICY "user_isolation" ON "CustomerEvent"
  FOR ALL USING (auth.uid()::text = "userId");

-- Automation
DROP POLICY IF EXISTS "user_isolation" ON "Automation";
CREATE POLICY "user_isolation" ON "Automation"
  FOR ALL USING (auth.uid()::text = "userId");

-- AutomationRun
DROP POLICY IF EXISTS "user_isolation" ON "AutomationRun";
CREATE POLICY "user_isolation" ON "AutomationRun"
  FOR ALL USING (auth.uid()::text = "userId");

-- AutomationRunStep (AutomationRun üzerinden join)
DROP POLICY IF EXISTS "user_isolation" ON "AutomationRunStep";
CREATE POLICY "user_isolation" ON "AutomationRunStep"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "AutomationRun" ar
      WHERE ar.id = "AutomationRunStep"."runId"
        AND auth.uid()::text = ar."userId"
    )
  );

-- AutomationLog
DROP POLICY IF EXISTS "user_isolation" ON "AutomationLog";
CREATE POLICY "user_isolation" ON "AutomationLog"
  FOR ALL USING (auth.uid()::text = "userId");

-- FlowExecution
DROP POLICY IF EXISTS "user_isolation" ON "FlowExecution";
CREATE POLICY "user_isolation" ON "FlowExecution"
  FOR ALL USING (auth.uid()::text = "userId");

-- Segment
DROP POLICY IF EXISTS "user_isolation" ON "Segment";
CREATE POLICY "user_isolation" ON "Segment"
  FOR ALL USING (auth.uid()::text = "userId");

-- Template
DROP POLICY IF EXISTS "user_isolation" ON "Template";
CREATE POLICY "user_isolation" ON "Template"
  FOR ALL USING (auth.uid()::text = "userId");

-- SyncLog
DROP POLICY IF EXISTS "user_isolation" ON "SyncLog";
CREATE POLICY "user_isolation" ON "SyncLog"
  FOR ALL USING (auth.uid()::text = "userId");

-- EmailVerification
DROP POLICY IF EXISTS "user_isolation" ON "EmailVerification";
CREATE POLICY "user_isolation" ON "EmailVerification"
  FOR ALL USING (auth.uid()::text = "userId");

-- PasswordResetToken (userId yok, email bazlı izolasyon)
-- Token ile erişildiği için sadece geçerli token sahibi erişebilir.
-- Service role (API routes) bypass eder, anon key ile doğrudan erişim engellenir.
DROP POLICY IF EXISTS "user_isolation" ON "PasswordResetToken";
CREATE POLICY "user_isolation" ON "PasswordResetToken"
  FOR ALL USING (false);

-- EmailDomain
DROP POLICY IF EXISTS "user_isolation" ON "EmailDomain";
CREATE POLICY "user_isolation" ON "EmailDomain"
  FOR ALL USING (auth.uid()::text = "userId");

-- WhatsAppSettings
DROP POLICY IF EXISTS "user_isolation" ON "WhatsAppSettings";
CREATE POLICY "user_isolation" ON "WhatsAppSettings"
  FOR ALL USING (auth.uid()::text = "userId");

-- WhatsAppQuickReply
DROP POLICY IF EXISTS "user_isolation" ON "WhatsAppQuickReply";
CREATE POLICY "user_isolation" ON "WhatsAppQuickReply"
  FOR ALL USING (auth.uid()::text = "userId");

-- WhatsAppConversation
DROP POLICY IF EXISTS "user_isolation" ON "WhatsAppConversation";
CREATE POLICY "user_isolation" ON "WhatsAppConversation"
  FOR ALL USING (auth.uid()::text = "userId");

-- WhatsAppMessage (WhatsAppConversation üzerinden join)
DROP POLICY IF EXISTS "user_isolation" ON "WhatsAppMessage";
CREATE POLICY "user_isolation" ON "WhatsAppMessage"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "WhatsAppConversation" wc
      WHERE wc.id = "WhatsAppMessage"."conversationId"
        AND auth.uid()::text = wc."userId"
    )
  );

-- WhatsAppCampaign
DROP POLICY IF EXISTS "user_isolation" ON "WhatsAppCampaign";
CREATE POLICY "user_isolation" ON "WhatsAppCampaign"
  FOR ALL USING (auth.uid()::text = "userId");

-- ── ADIM 3: AIAsset tablosunu oluştur ───────────────────────────

CREATE TABLE IF NOT EXISTS "AIAsset" (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        text NOT NULL,
  html            text,
  "bgImageUrl"    text,
  "productImage"  text,
  "sceneName"     text,
  status          text NOT NULL DEFAULT 'draft',
  "createdAt"     bigint NOT NULL DEFAULT (extract(epoch from now())::bigint * 1000),
  config          jsonb NOT NULL DEFAULT '{}',
  content         jsonb NOT NULL DEFAULT '{}'
);

ALTER TABLE "AIAsset" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_isolation" ON "AIAsset";
CREATE POLICY "user_isolation" ON "AIAsset"
  FOR ALL USING (auth.uid()::text = "userId");

CREATE INDEX IF NOT EXISTS "AIAsset_userId_idx"    ON "AIAsset" ("userId");
CREATE INDEX IF NOT EXISTS "AIAsset_createdAt_idx" ON "AIAsset" ("createdAt" DESC);
