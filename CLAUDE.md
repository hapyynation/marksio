# Marksio — Claude Code Instructions

## Kaynak Doküman

**ANA MİMARİ KAYNAK**: `docs/MARKSIO MASTER SYSTEM ARCHITECTURE.txt`

Bu dosya:
- Ürün vizyonu ve mimarisi
- Database yapısı
- Design system kuralları
- Tüm modül gereksinimleri
- UX kararları

için tek kaynak. Tüm geliştirme bu dosyaya uygun yapılmalı.

---

## Proje Nedir?

Marksio = AI-powered Growth Operating System for e-commerce.
- Klaviyo + Canva + AI automation + WhatsApp AI hybrid
- Target: Turkish e-commerce brands
- Stack: Next.js 14 App Router, Supabase Auth, Prisma, PostgreSQL, Recharts, Tailwind, shadcn

---

## Design System

Design tokens `app/globals.css`'de CSS variables olarak tanımlı:

```
--bg: #08080f          (page background)
--surface: #0f0f1a     (card background)
--text-1: #eeeef4      (primary text)
--text-2: #8080a0      (secondary text)
--text-3: #3e3e54      (muted text)
--blue: #4470ff        (primary accent)
--green: #22c97a       (success)
--red: #e84545         (danger)
--amber: #f0a020       (warning)
--violet: #9f7afa      (AI/purple)
--border: rgba(255,255,255,0.07)
```

Reusable components: `components/ui/primitives.tsx`
- `<MCard>` — standard card
- `<MKpiCard>` — metric display
- `<MSectionHeader>` — section title + link
- `<MBadge>` — status badge
- `<MEmptyState>` — empty state
- `<MPageHeader>` — page title bar

---

## Klasör Yapısı

```
app/
  dashboard/       — AI Growth Command Center
  campaigns/       — Campaign management + builder
  automations/     — Visual automation builder
  customers/       — Customer intelligence
  segments/        — Audience management
  analytics/       — Revenue analytics
  whatsapp/        — WhatsApp AI
  ai-studio/       — AI generation center (TODO)
  templates/       — Email templates (TODO)
  plans/           — Pricing/subscription
  settings/        — Workspace settings

components/
  layout/          — AppShell, Sidebar
  ui/              — Shared UI primitives
  ChatWidget       — AI assistant

lib/
  auth.ts          — getApiSession() bridge (Supabase → Prisma)
  ds.ts            — Design system constants (TypeScript)
  hooks/
    use-session.ts — Supabase compat hook
  supabase/
    client.ts      — Browser client
    server.ts      — Server client
```

---

## Auth (Geçici Bypass)

Auth şu an bypass modunda:
- `middleware.ts` auth check yok, sadece `/` → `/dashboard` redirect
- `AppShell.tsx` auth guard yok

Auth geri açılacaksa:
- `middleware.ts` içine Supabase session check ekle
- `AppShell.tsx` içine `useSession` guard ekle

---

## API Route Pattern

```typescript
import { getApiSession } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  const userId = session.user.id
  // ... prisma queries
}
```

---

## Coding Rules

- TypeScript strict, no `any`
- No comments explaining WHAT, only WHY (non-obvious)
- No unnecessary abstractions
- Tailwind + inline style hybrid (Tailwind for layout, inline for brand colors)
- All pages use `AppShell` wrapper
- All charts: Recharts + custom tooltip
- Turkish UI strings throughout
- Mobile responsive, no horizontal overflow
- `cn()` from `@/lib/utils` for conditional classes

---

## Marksio Pages (Architecture)

| Route | Status | Description |
|-------|--------|-------------|
| /dashboard | ✅ Live | AI Growth Command Center |
| /campaigns | ✅ Live | Campaign list + builder |
| /automations | ✅ Live | Automation flows |
| /customers | ✅ Live | Customer list + import |
| /segments | ✅ Live | Audience segments |
| /analytics | ✅ Live | Revenue analytics |
| /whatsapp | ✅ Live | WhatsApp AI |
| /ai-studio | 🔲 TODO | AI generation center |
| /templates | 🔲 TODO | Email template library |
| /plans | ✅ Live | Subscription plans |
| /settings | ✅ Live | Workspace settings |
