# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Kaynak Doküman

**ANA MİMARİ KAYNAK**: `docs/MARKSIO MASTER SYSTEM ARCHITECTURE.txt`

Ürün vizyonu, UX kararları ve modül gereksinimleri için tek kaynak. Tüm geliştirme bu dosyaya uygun yapılmalı.

---

## Proje

Marksio = AI-powered Growth OS for Turkish e-commerce brands.
Stack: Next.js 14 App Router, Supabase Auth + NextAuth, Prisma, PostgreSQL, Recharts, Tailwind, shadcn/Radix.

---

## Komutlar

```bash
npm run dev       # localhost:3002
npm run build     # prisma generate + db push + next build
npm run lint      # eslint
npm run seed      # prisma/seed.ts
```

Schema değişiklikten sonra:
```bash
npx prisma db push    # geliştirme ortamı
npx prisma generate   # Prisma client'ı yenile
```

---

## Auth Mimarisi

`getApiSession()` (`lib/auth.ts`) iki strateji dener sırayla:

1. **NextAuth** (`lib/auth-options.ts`) — email/password (credentials) girişleri. `getServerSession()` kullanır.
2. **Supabase** (`lib/supabase/`) — OTP / magic-link girişleri. Supabase'de kullanıcı varsa ama Prisma'da yoksa otomatik oluşturur.

Her API route başına:
```typescript
const session = await getApiSession()
if (!session) return new Response('Unauthorized', { status: 401 })
const userId = session.user.id  // Prisma User.id (cuid)
```

`session.user.effectivePlan` expired/past_due aboneleri otomatik 'free' olarak işler.

**TODO (production öncesi)**: `middleware.ts` sadece `/` → `/dashboard` redirect yapıyor, auth check yok. `AppShell.tsx`'te de auth guard yok.

---

## Design System

CSS variables `app/globals.css`'de tanımlı. TypeScript token'lar `lib/ds.ts`'de:

```
colors.bg / colors.surface / colors.surface2 / colors.surface3
colors.text1 / text2 / text3
colors.blue (primary), green (success), red (danger), amber (warning), violet (AI)
colors.border / border2 / border3
```

`lib/ds.ts`'den `accents` map'i ile `statusColor()` ve `statusLabel()` helper'ları kullanılabilir.

Reusable primitives (`components/ui/primitives.tsx`):
- `<MCard>` — standard card
- `<MKpiCard>` — metric display
- `<MSectionHeader>` — section title + link
- `<MBadge>` — status badge
- `<MEmptyState>` — empty state
- `<MPageHeader>` — page title bar

**Kural**: Tailwind layout için, inline style brand renkleri için. `cn()` from `@/lib/utils` conditional class'lar için.

---

## Automation Engine

`lib/automation/engine.ts` — ReactFlow node graph'ını çalıştırır:

- `startRun(automationId, customerId, triggerData)` → `AutomationRun` oluşturur
- `executeRun(runId)` → her node'u sırayla çalıştırır
- **WaitNode**: run `status='waiting'` olur, QStash ile `scheduleAutomationResume()` zamanlar
- **StopNode**: run `status='completed'` olur

Node executor'ları `lib/automation/node-executors.ts`'de. Cron endpoint `/api/cron/automations` bekleyen run'ları resume eder. QStash (`lib/qstash.ts`) gecikmiş resume'ları Upstash üzerinden tetikler.

---

## WhatsApp Sistemi

İki ayrı WhatsApp katmanı var:

1. **Eski (WhatsApp\*)** — `WhatsAppSettings`, `WhatsAppConversation`, `WhatsAppMessage` modelleri. `app/whatsapp/` altındaki sayfalar.
2. **Yeni BYO (Whatsapp\* — büyük/küçük harf farkına dikkat)** — `WhatsappAccount`, `WhatsappTemplate`, `WhatsappConversation`, `WhatsappBroadcast` modelleri. `app/api/whatsapp/` API route'ları. Her hesap kendi `phoneNumberId`, `accessToken`, `appSecret` tutar.

Yeni sistemde:
- `WhatsappAssistantConfig` → AI assistant ayarları, FAQ'lar, handover kuralları, knowledge source'lar
- `WhatsappBroadcast` → toplu mesaj kampanyaları (QStash batch ile gönderim)
- Webhook: `/api/whatsapp/webhook/[accountId]` — gelen mesajları karşılar

---

## AI Providers

| Provider | Kullanım |
|----------|----------|
| Groq (`lib/groq.ts`) | Hızlı chat, segment önerileri |
| Anthropic (`lib/claude.ts`) | WhatsApp AI assistant, ağır analiz |
| OpenAI (`lib/openai-client.ts`) | Genel AI görevler |
| Gemini (`lib/gemini.ts`) | Alternatif provider |
| fal.ai | Görsel üretim (banner, ürün fotoğrafı) |

---

## Plan Sistemi

`lib/plan-limits.ts` — `free | starter | growth | agency` planları:
- `getLimits(plan)` — plan limitleri döner
- `isAtLimit(current, limit)` — limit kontrolü (`-1` = unlimited)
- `getEffectivePlan(plan, planStatus)` — expired/past_due → free'ye düşürür

Billing: Lemon Squeezy. Webhook: `/api/webhooks/lemonsqueezy`. User'da `lsSubscriptionId`, `planStatus`, `planRenewsAt` alanları.

---

## Email Sistemi

- **Gönderim**: Resend (`lib/resend-api.ts`). Her user kendi domain'ini doğrulayabilir (`EmailDomain` model).
- **From adresi**: `lib/mail-from.ts` — user'ın doğrulanmış domain'i veya `SYSTEM_FROM_EMAIL`.
- **Takip**: `/api/track/click` ve `/api/track/visit` — open/click izleme.
- **Webhook**: `/api/billing/webhook` — Resend event'leri (bounce, complaint vb.) işler.

---

## Entegrasyonlar

`Integration` model: `shopify | woocommerce | trendyol | hepsiburada | ikas`.

- Shopify: OAuth flow (`/api/integrations/shopify/auth` → `callback`), webhook ile otomatik sync
- WooCommerce / ikas: API key ile bağlantı
- Sync logları: `SyncLog` model

---

## Coding Rules

- TypeScript strict, no `any`
- Tüm UI string'leri Türkçe
- Tüm sayfalar `AppShell` wrapper kullanır
- Tüm chart'lar Recharts + custom tooltip
- Mobile responsive, horizontal overflow yok
- No comments explaining WHAT, only WHY

---

## Pages

| Route | Status |
|-------|--------|
| /dashboard | ✅ Live |
| /campaigns | ✅ Live |
| /automations | ✅ Live |
| /customers | ✅ Live |
| /segments | ✅ Live |
| /analytics | ✅ Live |
| /whatsapp | ✅ Live |
| /plans | ✅ Live |
| /settings | ✅ Live |
| /ai-studio | 🔲 TODO |
| /templates | 🔲 TODO |
