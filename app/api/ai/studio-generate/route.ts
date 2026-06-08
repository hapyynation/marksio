import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { detectCategory } from '@/lib/product-shots'
import { BANNER_HERO_STYLES, buildBannerHeroPrompt, type BannerStyleId } from '@/lib/banner-hero'
import { getApiSession } from '@/lib/auth'
import { getLimits, getUpgradePlan } from '@/lib/plan-limits'

export const maxDuration = 300

if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── Upload helpers ───────────────────────────────────────────────────────────

async function uploadDataUrl(dataUrl: string): Promise<string> {
  const [meta, b64] = dataUrl.split(',')
  if (!b64) return dataUrl
  const mime = meta.split(':')[1]?.split(';')[0] ?? 'image/jpeg'
  const ext  = mime.split('/')[1] ?? 'jpg'
  const buf  = Buffer.from(b64, 'base64')
  return fal.storage.upload(
    new File([new Blob([buf], { type: mime })], `product.${ext}`, { type: mime })
  )
}

async function uploadLocalFile(filePath: string): Promise<string> {
  const buf  = fs.readFileSync(filePath)
  const file = new File([new Blob([buf], { type: 'image/jpeg' })], path.basename(filePath), { type: 'image/jpeg' })
  return fal.storage.upload(file)
}

// ─── Per-style image prompt patterns ─────────────────────────────────────────

const STYLE_IMG_PROMPTS: Record<BannerStyleId, string> = {
  'premium-studio': 'professional product photography, pure white seamless studio background, soft diffused overhead lighting, subtle ground shadow beneath the product, ultra-sharp product detail, clean commercial catalog style, minimalist aesthetic',
  'model':          'lifestyle product photography, naturally worn or used by model, outdoor editorial setting, warm golden hour lighting, shallow depth of field bokeh background, fashion photography style, candid feel',
  'pedestal':       'luxury product placed on minimalist geometric marble pedestal, smooth gradient background transitioning from light to dark, dramatic single-source side lighting casting elegant shadow, high-end commercial photography, luxury brand aesthetic',
  'flat-lay':       'flat lay product photography, overhead top-down birds-eye view, clean white marble or linen surface, minimal lifestyle props arranged artfully around the product, soft even natural light, lifestyle magazine editorial style',
  'lifestyle':      'product in authentic natural outdoor lifestyle setting, lush green bokeh background, warm natural golden sunlight, candid editorial photography, lifestyle brand aesthetic, aspirational mood',
  'campaign':       'product hero shot in dramatic scene, bold high-contrast studio lighting, deep vivid solid color background complementing the product colors, advertising campaign poster photography, commercial editorial quality, high impact',
}

// ─── Fal generation — 4-attempt fallback chain (mirrors banner-hero) ─────────

async function generateFalImage(
  productUrl: string,
  styleUrl: string,
  prompt: string,
  aspectRatio: '16:9' | '3:4',
): Promise<string> {

  // 1st: kontext-max with both images
  // If this returns Not Found, the account doesn't have Pro access — skip all kontext variants.
  let proAccessible = true
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext-max', {
      input: {
        image_url:           [productUrl, styleUrl],
        prompt,
        num_images:          1,
        guidance_scale:      3.5,
        num_inference_steps: 30,
        aspect_ratio:        aspectRatio,
        output_format:       'jpeg',
        safety_tolerance:    '2',
      } as Record<string, unknown>,
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const url = (result.data ?? result)?.images?.[0]?.url
    if (url) return url
    throw new Error('no url in response')
  } catch (e) {
    const msg = (e as Error).message ?? ''
    console.warn('[studio-generate] kontext-max failed:', msg)
    if (msg === 'Not Found' || msg.includes('404') || msg.includes('not found')) proAccessible = false
  }

  if (proAccessible) {
    // 2nd: kontext with style image as scene base
    try {
      const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext', {
        input: {
          image_url:           styleUrl,
          prompt:              prompt + ' The background, lighting, environment and composition of this scene must remain exactly as shown.',
          num_images:          1,
          guidance_scale:      4.5,
          num_inference_steps: 28,
          aspect_ratio:        aspectRatio,
          output_format:       'jpeg',
          safety_tolerance:    '2',
        } as Record<string, unknown>,
      }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

      const url = (result.data ?? result)?.images?.[0]?.url
      if (url) return url
      throw new Error('no url in response')
    } catch (e) {
      console.warn('[studio-generate] kontext scene-first failed:', (e as Error).message)
    }

    // 3rd: kontext with product image — product preserved
    try {
      const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext', {
        input: {
          image_url:           productUrl,
          prompt,
          num_images:          1,
          guidance_scale:      4.5,
          num_inference_steps: 28,
          aspect_ratio:        aspectRatio,
          output_format:       'jpeg',
          safety_tolerance:    '2',
        } as Record<string, unknown>,
      }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

      const url = (result.data ?? result)?.images?.[0]?.url
      if (url) return url
      throw new Error('no url in response')
    } catch (e) {
      console.warn('[studio-generate] kontext product-first failed:', (e as Error).message)
    }
  } else {
    console.log('[studio-generate] Pro endpoints not accessible — going straight to img2img')
  }

  // Last resort: img2img — lower strength preserves the product more
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sizeParam = aspectRatio === '16:9'
    ? { image_size: { width: 1024, height: 680 } }
    : { image_size: { width: 600,  height: 800 } }
  const result = await (fal.subscribe as any)('fal-ai/flux/dev/image-to-image', {
    input: {
      image_url:           productUrl,
      prompt,
      strength:            0.55,
      num_inference_steps: 28,
      guidance_scale:      7.5,
      num_images:          1,
      ...sizeParam,
    },
  }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

  const url = (result.data ?? result)?.images?.[0]?.url
  if (!url) throw new Error('All Fal generation methods failed')
  return url
}

// ─── Template labels ──────────────────────────────────────────────────────────

const TEMPLATE_LABELS: Record<string, string> = {
  indirim:     'Yüksek İndirim Kampanyası',
  yeniurun:    'Yeni Ürün Lansmanı',
  sepetterk:   'Sepet Terk E-postası',
  premium:     'Premium / Lüks Koleksiyon',
  blackfriday: 'Black Friday Kampanyası',
  minimal:     'Minimal E-Ticaret',
}

interface GrokCopy {
  headline: string; subheadline: string; cta: string; description: string
  subject: string; previewText: string; brandColor: string; imagePrompt: string
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const effectivePlan = session.user.effectivePlan
  const limits = getLimits(effectivePlan)
  if (!limits.aiStudio) {
    return NextResponse.json({
      error: 'PLAN_LIMIT_REACHED',
      feature: 'aiStudio',
      currentPlan: effectivePlan,
      requiredPlan: getUpgradePlan(effectivePlan),
    }, { status: 403 })
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('[studio-generate] GROQ_API_KEY not set')
    return NextResponse.json({ error: 'GROQ_API_KEY eksik.' }, { status: 500 })
  }
  if (!process.env.FAL_KEY) {
    console.error('[studio-generate] FAL_KEY not set')
    return NextResponse.json({ error: 'FAL_KEY eksik.' }, { status: 500 })
  }

  const { productImageUrl, bannerStyle, productName, templateId, brandName } = await req.json() as {
    productImageUrl: string; bannerStyle: BannerStyleId
    productName?: string; templateId?: string; brandName?: string
  }

  if (!productImageUrl) return NextResponse.json({ error: 'Ürün görseli gerekli.' }, { status: 400 })

  const styleDef = BANNER_HERO_STYLES.find(s => s.id === bannerStyle)
  if (!styleDef)    return NextResponse.json({ error: 'Geçersiz banner stili.' }, { status: 400 })

  const category      = detectCategory(productName ?? '')
  const templateLabel = TEMPLATE_LABELS[templateId ?? ''] ?? 'E-Ticaret Kampanyası'
  const brand         = brandName || 'Marka'
  const product       = productName || 'Ürün'

  console.log(`[studio-generate] style:${bannerStyle} cat:${category} template:${templateId} product:${product}`)

  // ── Step 1: upload product image (blocking — must succeed before Fal) ──────
  let productUrl = productImageUrl
  if (productUrl.startsWith('data:')) {
    try {
      productUrl = await uploadDataUrl(productUrl)
      console.log('[studio-generate] product uploaded:', productUrl.slice(0, 80))
    } catch (e) {
      console.error('[studio-generate] product upload failed:', (e as Error).message)
      return NextResponse.json({ error: 'Ürün görseli yüklenemedi. Lütfen tekrar deneyin.' }, { status: 500 })
    }
  }

  // ── Step 2: call Grok for copy generation (parallel with style upload) ──────
  const grokPrompt = `Sen bir e-ticaret pazarlama uzmanı ve metin yazarısın. Yüksek dönüşümlü kampanya içeriği üret.

Ürün: ${product}
Kategori: ${category}
Marka: ${brand}
Kampanya Tipi: ${templateLabel}
Banner Stili: ${styleDef.name} — ${styleDef.description}

SADECE aşağıdaki JSON formatında dön, başka hiçbir şey ekleme:
{
  "headline": "güçlü ana başlık, max 45 karakter, Türkçe",
  "subheadline": "alt başlık, max 80 karakter, Türkçe",
  "cta": "CTA butonu metni, max 25 karakter, aksiyon odaklı, Türkçe",
  "description": "ürün açıklama, 2 kısa cümle, Türkçe",
  "subject": "email konu satırı, max 55 karakter, Türkçe, emoji kullanabilirsin",
  "previewText": "preview metni, max 90 karakter, merak uyandırsın, Türkçe",
  "brandColor": "kampanyaya uygun hex renk kodu, örn: #e84545",
  "imagePrompt": "Ultra-realistic 8K commercial advertising photography. The ${product} must remain COMPLETELY UNCHANGED in color, design, materials, shape and proportions. ${styleDef.description}. ${category} commercial photography. Professional studio lighting. No text, no watermarks, no logos. Sharp product focus."
}`

  const [grokResult, styleUploadResult] = await Promise.allSettled([
    groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      messages:        [{ role: 'user', content: grokPrompt }],
      temperature:     0.72,
      max_tokens:      600,
      response_format: { type: 'json_object' },
    }),
    uploadLocalFile(path.join(process.cwd(), 'public', 'templates', styleDef.imageFile)),
  ])

  let copy: GrokCopy | null = null
  if (grokResult.status === 'fulfilled') {
    try {
      copy = JSON.parse(grokResult.value.choices[0]?.message?.content ?? '{}') as GrokCopy
      console.log('[studio-generate] Grok copy generated, headline:', copy?.headline)
    } catch (e) {
      console.warn('[studio-generate] Grok JSON parse failed:', (e as Error).message)
    }
  } else {
    console.warn('[studio-generate] Grok call failed:', (grokResult as PromiseRejectedResult).reason?.message)
  }

  const styleUrl = styleUploadResult.status === 'fulfilled'
    ? styleUploadResult.value
    : (() => { console.warn('[studio-generate] style upload failed, using product as style ref'); return productUrl })()

  // ── Step 3: build image prompts ──────────────────────────────────────────────
  const preserveClause = `CRITICAL: The ${product} must be COMPLETELY UNCHANGED — exact same shape, color, logo, design, materials, proportions, textures. Do NOT alter the product in any way. Only replace the background, environment, and lighting.`
  const styleScene     = STYLE_IMG_PROMPTS[bannerStyle] ?? STYLE_IMG_PROMPTS['premium-studio']
  const qualityClause  = 'Ultra-realistic 8K commercial advertising photography. No text, no watermarks, no added logos. Sharp product focus.'

  const basePrompt = `${preserveClause} ${styleScene}. ${qualityClause}`

  const desktopPrompt = `${basePrompt} Wide landscape composition (16:9), product centered, email hero banner format.`
  const mobilePrompt  = `${basePrompt} Vertical portrait composition (3:4), product fills the frame, mobile email format.`

  // ── Step 4: generate desktop + mobile in parallel ────────────────────────────
  console.log('[studio-generate] starting Fal generation…')
  const [desktopResult, mobileResult] = await Promise.allSettled([
    generateFalImage(productUrl, styleUrl, desktopPrompt, '16:9'),
    generateFalImage(productUrl, styleUrl, mobilePrompt,  '3:4'),
  ])

  const desktop = desktopResult.status === 'fulfilled' ? desktopResult.value : null
  const mobile  = mobileResult.status  === 'fulfilled' ? mobileResult.value  : null

  if (desktopResult.status === 'rejected') {
    console.error('[studio-generate] desktop generation failed:', (desktopResult as PromiseRejectedResult).reason?.message)
  }
  if (mobileResult.status === 'rejected') {
    console.error('[studio-generate] mobile generation failed:', (mobileResult as PromiseRejectedResult).reason?.message)
  }

  if (!desktop && !mobile) {
    const reason = (desktopResult as PromiseRejectedResult).reason?.message ?? 'unknown'
    console.error('[studio-generate] all generation failed, last error:', reason)
    return NextResponse.json(
      { error: `Görsel oluşturulamadı: ${reason}` },
      { status: 500 }
    )
  }

  console.log(`[studio-generate] done — desktop:${!!desktop} mobile:${!!mobile}`)

  return NextResponse.json({
    headline:    copy?.headline    ?? '',
    subheadline: copy?.subheadline ?? '',
    cta:         copy?.cta         ?? '',
    description: copy?.description ?? '',
    subject:     copy?.subject     ?? '',
    previewText: copy?.previewText ?? '',
    brandColor:  copy?.brandColor  ?? '',
    desktop,
    mobile,
  })
}
