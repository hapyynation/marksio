'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { StepIndicator } from '@/components/ai-studio/StepIndicator'
import { UploadStep } from '@/components/ai-studio/UploadStep'
import { AnalyzingStep } from '@/components/ai-studio/AnalyzingStep'
import { EditingStep } from '@/components/ai-studio/EditingStep'
import { GeneratingStep } from '@/components/ai-studio/GeneratingStep'
import { PreviewStep } from '@/components/ai-studio/PreviewStep'
import { SavedStep } from '@/components/ai-studio/SavedStep'
import { studioReducer, INITIAL_STATE, type ImageAnalysis } from '@/components/ai-studio/types'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── Asset interface expected by /ai-assets ──────────────────────────────────

interface Asset {
  id: string
  html: string | null
  bgImageUrl: string
  productImage: string | null
  sceneName: string
  status: 'draft'
  createdAt: number
  config: { brandName: string; productName: string; accentColor: string }
  content: { headline: string; ctaLabel: string }
}

// ── Helper: file → base64 ────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AIStudioPage() {
  const [state, dispatch] = useReducer(studioReducer, INITIAL_STATE)
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null)
  const abortRef      = useRef<AbortController | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  function notify(msg: string, ok = true) {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 3500)
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  // ── Step 1 → 2 → 3: file received ───────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const objectUrl = URL.createObjectURL(file)
    previewUrlRef.current = objectUrl

    dispatch({ type: 'SET_FILE', file, previewUrl: objectUrl })

    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      if (!res.ok) throw new Error('Analiz başarısız')
      const data = await res.json() as ImageAnalysis
      dispatch({ type: 'SET_ANALYSIS', analysis: data })
      if (data.suggestedFalPrompt) {
        dispatch({ type: 'SET_CUSTOM_PROMPT', prompt: data.suggestedFalPrompt })
      }
    } catch {
      dispatch({ type: 'SET_ANALYSIS', analysis: null })
      notify('Görsel analizi atlandı, manuel devam edebilirsiniz.')
    }
  }, [])

  // ── Step 3 → 4: generate banner + copy ──────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const abort = new AbortController()
    abortRef.current = abort

    dispatch({ type: 'SET_STEP', step: 'generating' })
    dispatch({ type: 'SET_ERROR', error: null })

    const activeImageUrl = state.processedImageUrl ?? state.previewUrl
    const prompt = state.customPrompt || state.analysis?.suggestedFalPrompt || ''

    try {
      const [bannerRes, copyRes] = await Promise.all([
        fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-banner',
            productImageUrl: activeImageUrl,
            prompt,
            style: state.selectedStyle,
            config: state.config,
          }),
          signal: abort.signal,
        }),
        fetch('/api/grok-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis: state.analysis,
            config: state.config,
            style: state.selectedStyle,
          }),
          signal: abort.signal,
        }),
      ])

      if (abort.signal.aborted) return

      const bannerData = await bannerRes.json() as { url?: string; error?: string }
      const copyData   = await copyRes.json()   as { headline?: string; ctaLabel?: string }

      if (!bannerRes.ok || !bannerData.url) {
        throw new Error(bannerData.error ?? 'Banner üretilemedi')
      }

      dispatch({ type: 'SET_GENERATED', html: '', imageUrl: bannerData.url })
      dispatch({
        type: 'SET_CONTENT',
        content: {
          headline: copyData.headline ?? state.content.headline,
          ctaLabel: copyData.ctaLabel ?? state.content.ctaLabel,
        },
      })
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      const msg = (e as Error).message || 'Bir hata oluştu'
      dispatch({ type: 'SET_ERROR', error: msg })
      dispatch({ type: 'SET_STEP', step: 'editing' })
      notify(msg, false)
    }
  }, [state])

  const handleBackToEditing = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    dispatch({ type: 'SET_STEP', step: 'editing' })
  }, [])

  // ── Step 5 → 6: approve & save to Supabase ──────────────────────────────

  const handleApprove = useCallback(async () => {
    const imageUrl = state.generatedImageUrl
    if (!imageUrl) return

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('[AIStudio] user:', user?.id, 'authError:', authError)

      if (!user) {
        console.error('[AIStudio] No user session')
        notify('Oturum bulunamadı. Lütfen tekrar giriş yapın.', false)
        return
      }

      const asset = {
        id: crypto.randomUUID(),
        userId: user.id,
        html: state.generatedHtml ?? '',
        bgImageUrl: imageUrl,
        productImage: state.previewUrl ?? null,
        sceneName: state.selectedStyle ?? 'default',
        status: 'draft',
        createdAt: Date.now(),
        config: {
          brandName: state.config.brandName,
          productName: state.config.productName,
          accentColor: state.config.accentColor,
        },
        content: {
          headline: state.content.headline,
          ctaLabel: state.content.ctaLabel,
        },
      }

      console.log('[AIStudio] inserting asset:', asset)

      const { data, error } = await supabase
        .from('AIAsset')
        .insert(asset)
        .select()
        .single()

      console.log('[AIStudio] insert result:', data, 'error:', error)

      if (error) {
        notify(`Kayıt hatası: ${error.message}`, false)
        return
      }

      notify('Banner başarıyla kaydedildi!')
      dispatch({ type: 'SET_STEP', step: 'saved' })

    } catch (err) {
      console.error('[AIStudio] handleApprove exception:', err)
      notify('Beklenmeyen hata oluştu.', false)
    }
  }, [state])

  const handleReset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    if (abortRef.current) abortRef.current.abort()
    dispatch({ type: 'RESET' })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#08080f' }}>

        {/* Header */}
        <div
          className="shrink-0 px-6 py-4 flex flex-col gap-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0f0f1a' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>AI Studio</p>
              <p className="text-[11px]" style={{ color: '#6b7280' }}>Görsel yükle → AI analiz etsin → Banner üretsin</p>
            </div>
          </div>

          <StepIndicator current={state.step} />
        </div>

        {/* Notification toast */}
        {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold shadow-2xl"
            style={{
              background: notification.ok ? 'rgba(34,201,122,0.15)' : 'rgba(232,69,69,0.15)',
              border: `1px solid ${notification.ok ? 'rgba(34,201,122,0.3)' : 'rgba(232,69,69,0.3)'}`,
              color: notification.ok ? '#22c97a' : '#e84545',
              backdropFilter: 'blur(12px)',
            }}>
            {notification.ok
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />}
            {notification.msg}
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {state.step === 'upload' && (
            <UploadStep onFile={handleFile} />
          )}

          {state.step === 'analyzing' && (
            <AnalyzingStep previewUrl={state.previewUrl} />
          )}

          {state.step === 'editing' && state.previewUrl && (
            <EditingStep
              previewUrl={state.previewUrl}
              processedImageUrl={state.processedImageUrl}
              analysis={state.analysis}
              cropConfig={state.cropConfig}
              customPrompt={state.customPrompt}
              selectedStyle={state.selectedStyle}
              config={state.config}
              onProcessedImageUrl={url => dispatch({ type: 'SET_PROCESSED_IMAGE', url })}
              onCropConfig={c => dispatch({ type: 'SET_CROP_CONFIG', config: c })}
              onCustomPrompt={p => dispatch({ type: 'SET_CUSTOM_PROMPT', prompt: p })}
              onSelectedStyle={s => dispatch({ type: 'SET_SELECTED_STYLE', style: s })}
              onConfig={c => dispatch({ type: 'SET_CONFIG', config: c })}
              onGenerate={handleGenerate}
            />
          )}

          {state.step === 'generating' && <GeneratingStep />}

          {state.step === 'preview' && state.generatedImageUrl && (
            <PreviewStep
              generatedImageUrl={state.generatedImageUrl}
              generatedHtml={state.generatedHtml}
              content={state.content}
              isLoading={false}
              onContent={c => dispatch({ type: 'SET_CONTENT', content: c })}
              onApprove={handleApprove}
              onRegenerate={handleGenerate}
              onEdit={handleBackToEditing}
            />
          )}

          {state.step === 'saved' && (
            <SavedStep
              generatedImageUrl={state.generatedImageUrl}
              content={state.content}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}
