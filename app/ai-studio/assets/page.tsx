'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useRouter } from 'next/navigation'
import { Sparkles, Trash2, ExternalLink, Clock, Loader2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Asset {
  id: string
  html: string | null
  bgImageUrl: string | null
  productImage: string | null
  sceneName: string
  status: string
  createdAt: number
  config: { brandName: string; productName?: string; accentColor: string }
  content: { headline: string; ctaLabel: string }
}

interface DBAsset extends Asset {
  userId: string
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Taslak',                color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  in_campaign:    { label: 'Kampanyada',            color: '#6c47ff', bg: 'rgba(108,71,255,0.1)'  },
  in_automation:  { label: 'Otomasyonda',           color: '#f0a020', bg: 'rgba(240,160,32,0.1)'  },
  archived:       { label: 'Arşiv',                 color: '#3e3e54', bg: 'rgba(62,62,84,0.15)'   },
}

const supabase = createClient()

// Migrate localStorage assets to Supabase once per session
async function migrateLocalStorage() {
  try {
    const stored = localStorage.getItem('marksio_ai_assets')
    if (!stored) return
    const localAssets: Asset[] = JSON.parse(stored)
    if (!localAssets?.length) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const toInsert = localAssets.map(a => ({ ...a, userId: user.id }))
    const { error } = await supabase.from('AIAsset').upsert(toInsert, { onConflict: 'id' })
    if (!error) {
      localStorage.removeItem('marksio_ai_assets')
    }
  } catch { /* silent — migration is best-effort */ }
}

export default function AIAssetsPage() {
  const router = useRouter()
  const [assets,    setAssets]    = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const loadAssets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('AIAsset')
        .select('*')
        .order('createdAt', { ascending: false })

      if (err) throw err
      setAssets((data as DBAsset[] ?? []).map(({ userId: _u, ...rest }) => rest as Asset))
    } catch (e) {
      setError((e as Error).message || 'Veriler yüklenemedi.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    migrateLocalStorage().then(() => loadAssets())
  }, [loadAssets])

  async function remove(id: string) {
    setAssets(prev => prev.filter(a => a.id !== id))
    await supabase.from('AIAsset').delete().eq('id', id)
  }

  async function updateStatus(id: string, status: string) {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    await supabase.from('AIAsset').update({ status }).eq('id', id)
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold" style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}>
                AI Assets
              </h1>
              <p className="text-[13px]" style={{ color: '#8080a0' }}>
                AI Studio'da ürettiğiniz tüm banner ve kreatifleri burada yönetin.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAssets}
              className="p-2 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#8080a0' }}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => router.push('/ai-studio')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff', boxShadow: '0 4px 16px rgba(108,71,255,0.38)' }}>
              <Sparkles className="w-4 h-4" /> Yeni Banner Oluştur
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6c47ff' }} />
              <p className="text-[13px]" style={{ color: '#8080a0' }}>Yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="text-center py-16">
            <p className="text-[14px] mb-3" style={{ color: '#8080a0' }}>Veriler yüklenemedi.</p>
            <button onClick={loadAssets}
              className="text-[13px] font-semibold"
              style={{ color: '#6c47ff' }}>
              Tekrar dene
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && assets.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(108,71,255,0.12)', border: '1px solid rgba(108,71,255,0.2)' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#6c47ff' }} />
            </div>
            <p className="text-[16px] font-bold mb-2" style={{ color: '#eeeef4' }}>Henüz AI banner üretilmedi</p>
            <p className="text-[14px] mb-6" style={{ color: '#8080a0' }}>
              AI Studio'da banner oluşturun, şablon olarak kaydedilsin.
            </p>
            <button onClick={() => router.push('/ai-studio')}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff' }}>
              AI Studio'yu Aç
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && assets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => {
              const st = STATUS_MAP[asset.status] ?? STATUS_MAP.draft
              return (
                <div key={asset.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>

                  {/* Preview */}
                  <div className="relative h-36 overflow-hidden" style={{ background: '#1e1e2e' }}>
                    {asset.bgImageUrl
                      ? <img src={asset.bgImageUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,rgba(108,71,255,0.2),rgba(156,64,255,0.2))' }} />
                    }
                    {asset.productImage && (
                      <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-center p-3">
                        <img src={asset.productImage} className="max-h-full max-w-full object-contain"
                          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} alt="" />
                      </div>
                    )}
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(90deg,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.2) 55%,transparent)' }} />
                    <div className="absolute bottom-3 left-3 right-16">
                      <p className="text-[11px] font-black text-white truncate">{asset.content?.headline}</p>
                      {asset.content?.ctaLabel && (
                        <p className="text-[10px] mt-0.5" style={{ color: '#a78bfa' }}>{asset.content.ctaLabel}</p>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: '#eeeef4' }}>
                          {asset.config?.brandName || 'Banner'}
                        </p>
                        {asset.sceneName && (
                          <p className="text-[11px] capitalize" style={{ color: '#6b7280' }}>{asset.sceneName}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                        style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]" style={{ color: '#6b7280' }}>
                      <Clock className="w-3 h-3" />
                      {new Date(asset.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={asset.status}
                        onChange={e => updateStatus(asset.id, e.target.value)}
                        className="flex-1 text-[11px] rounded-lg outline-none cursor-pointer"
                        style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}>
                        <option value="draft">Taslak</option>
                        <option value="in_campaign">Kampanyada</option>
                        <option value="in_automation">Otomasyonda</option>
                        <option value="archived">Arşiv</option>
                      </select>

                      <button
                        onClick={() => {
                          localStorage.setItem(`marksio_banner_asset_${asset.id}`, JSON.stringify(asset))
                          router.push('/ai-studio')
                        }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: '#6c47ff' }}
                        title="Kampanyada Kullan">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => remove(asset.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: '#6b7280' }}
                        title="Sil">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
