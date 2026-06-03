import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { AD_SCENES, SEASONAL_VARIANTS, getSceneById } from '@/lib/ad-scenes'
import { sceneBgCache } from '@/lib/scene-cache'

if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY })

const BG_SIZE = { width: 1200, height: 600 }

async function generateSceneBg(bgPrompt: string, cacheKey: string): Promise<string | null> {
  if (sceneBgCache.has(cacheKey)) return sceneBgCache.get(cacheKey)!
  if (!bgPrompt || !process.env.FAL_KEY) return null

  try {
    // Use flux/dev for higher quality scene backgrounds
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: bgPrompt,
        image_size: BG_SIZE,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const out = result.data ?? result
    const url = out?.images?.[0]?.url
    if (url) {
      sceneBgCache.set(cacheKey, url)
      return url
    }
  } catch (e) {
    console.error(`[scene-bg] ${cacheKey} failed:`, (e as Error).message)
    // Try schnell fallback
    try {
      const fallback = await fal.subscribe('fal-ai/flux/schnell', {
        input: { prompt: bgPrompt, image_size: BG_SIZE, num_inference_steps: 4, num_images: 1 },
      }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }
      const out = fallback.data ?? fallback
      const url = out?.images?.[0]?.url
      if (url) { sceneBgCache.set(cacheKey, url); return url }
    } catch { /* silent */ }
  }
  return null
}

// ─── GET /api/ai/scenes — Returns scene library with preview URLs ─────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pregenerate = searchParams.get('pregenerate') === 'true'
  const sceneId     = searchParams.get('sceneId')
  const seasonalId  = searchParams.get('seasonalId')

  // Single scene fetch
  if (sceneId) {
    const cacheKey = seasonalId ? `${sceneId}_${seasonalId}` : sceneId
    const cached = sceneBgCache.get(cacheKey)
    if (cached) return NextResponse.json({ url: cached, cached: true })

    if (!pregenerate) return NextResponse.json({ url: null, cached: false })

    const scene = getSceneById(sceneId)
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })

    let prompt = scene.bgPrompt
    if (scene.seasonal && seasonalId) {
      const variant = scene.seasonal.find(v => v.id === seasonalId)
      if (variant) prompt = variant.bgPrompt
    }

    const url = await generateSceneBg(prompt, cacheKey)
    return NextResponse.json({ url, cached: false })
  }

  // Full library
  const library = AD_SCENES.map(scene => {
    if (scene.seasonal) {
      return {
        ...scene,
        bgImageUrl: null,
        seasonal: scene.seasonal.map(v => ({
          ...v,
          bgImageUrl: sceneBgCache.get(`${scene.id}_${v.id}`) ?? null,
        })),
      }
    }
    return {
      ...scene,
      bgImageUrl: sceneBgCache.get(scene.id) ?? null,
    }
  })

  // Optionally trigger background pre-generation (non-blocking)
  if (pregenerate) {
    void Promise.allSettled([
      ...AD_SCENES.filter(s => !s.seasonal && !sceneBgCache.has(s.id) && s.bgPrompt)
        .map(s => generateSceneBg(s.bgPrompt, s.id)),
      ...SEASONAL_VARIANTS.filter(v => !sceneBgCache.has(`seasonal_${v.id}`))
        .map(v => generateSceneBg(v.bgPrompt, `seasonal_${v.id}`)),
    ])
  }

  return NextResponse.json({ scenes: library })
}
