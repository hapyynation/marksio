'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useRouter } from 'next/navigation'
import { Sparkles, Trash2, ExternalLink, Clock, Tag } from 'lucide-react'

interface Asset {
  id: string
  html: string
  bgImageUrl: string | null
  productImage: string | null
  sceneName: string
  status: string
  createdAt: number
  config: { brandName: string; productName?: string; accentColor: string }
  content: { headline: string; ctaLabel: string }
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Taslak',              color: '#6b7280', bg: '#f3f4f6' },
  in_campaign:    { label: 'Kampanyada Kullanıldı',color: '#6c47ff', bg: '#f5f3ff' },
  in_automation:  { label: 'Otomasyonda Kullanıldı',color: '#d97706', bg: '#fffbeb' },
  archived:       { label: 'Arşiv',               color: '#9ca3af', bg: '#f9fafb' },
}

export default function AIAssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('marksio_ai_assets')
      setAssets(stored ? JSON.parse(stored) : [])
    } catch { setAssets([]) }
  }, [])

  function remove(id: string) {
    const updated = assets.filter(a => a.id !== id)
    setAssets(updated)
    localStorage.setItem('marksio_ai_assets', JSON.stringify(updated))
  }

  function updateStatus(id: string, status: string) {
    const updated = assets.map(a => a.id === id ? { ...a, status } : a)
    setAssets(updated)
    localStorage.setItem('marksio_ai_assets', JSON.stringify(updated))
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold" style={{ color: '#111827', letterSpacing: '-0.025em' }}>AI Assets</h1>
              <p className="text-[13px]" style={{ color: '#9ca3af' }}>AI Studio'da ürettiğiniz tüm banner ve kreatifleri burada yönetin.</p>
            </div>
          </div>
          <button onClick={() => router.push('/ai-studio')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff', boxShadow: '0 4px 16px rgba(108,71,255,0.38)' }}>
            <Sparkles className="w-4 h-4" /> Yeni Banner Oluştur
          </button>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f5f3ff' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#6c47ff' }} />
            </div>
            <p className="text-[16px] font-bold mb-2" style={{ color: '#374151' }}>Henüz AI banner üretilmedi</p>
            <p className="text-[14px] mb-6" style={{ color: '#9ca3af' }}>AI Studio'da banner oluşturun, şablon olarak kaydedilsin.</p>
            <button onClick={() => router.push('/ai-studio')} className="px-5 py-2.5 rounded-xl text-[13px] font-bold" style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff' }}>
              AI Studio'yu Aç
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => {
              const st = STATUS_MAP[asset.status] ?? STATUS_MAP.draft
              return (
                <div key={asset.id} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  {/* Preview */}
                  <div className="relative h-36 overflow-hidden" style={{ background: '#f3f4f6' }}>
                    {asset.bgImageUrl
                      ? <img src={asset.bgImageUrl} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#f0ecff,#ddd6fe)' }} />
                    }
                    {asset.productImage && (
                      <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-center p-3">
                        <img src={asset.productImage} className="max-h-full max-w-full object-contain" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.2) 55%,transparent)' }} />
                    <div className="absolute bottom-3 left-3 right-16">
                      <p className="text-[11px] font-black text-white truncate">{asset.content.headline}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: '#111827' }}>{asset.config.brandName || 'Banner'}</p>
                        {asset.sceneName && <p className="text-[11px]" style={{ color: '#9ca3af' }}>{asset.sceneName}</p>}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]" style={{ color: '#9ca3af' }}>
                      <Clock className="w-3 h-3" />
                      {new Date(asset.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex gap-2">
                      <select value={asset.status} onChange={e => updateStatus(asset.id, e.target.value)}
                        className="flex-1 text-[11px] rounded-lg outline-none cursor-pointer" style={{ padding: '5px 8px', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>
                        <option value="draft">Taslak</option>
                        <option value="in_campaign">Kampanyada</option>
                        <option value="in_automation">Otomasyonda</option>
                        <option value="archived">Arşiv</option>
                      </select>
                      <button onClick={() => {
                        const id = asset.id
                        localStorage.setItem(`marksio_banner_asset_${id}`, JSON.stringify(asset))
                        router.push('/ai-studio')
                      }} className="p-1.5 rounded-lg transition-colors hover:bg-purple-50" title="Kampanyada Kullan" style={{ color: '#6c47ff' }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(asset.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-50" title="Sil" style={{ color: '#9ca3af' }}>
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
