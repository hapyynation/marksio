'use client'

import { useRef, useState, useEffect, Suspense, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/hooks/use-session'
import {
  ArrowLeft, Loader2, Check, BookmarkPlus, Wand2,
  Crown, TrendingUp, Type, Zap, Star, Target,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { templatePresets } from '@/lib/email-template-presets'
import { renderBlocksToEmailHtml } from '@/lib/email-html-renderer'
import { emailTemplateHtml } from '@/lib/email-template-html'
import type { GrapeEditorHandle } from '@/components/email-editor/GrapeEditor'

const GrapeEditor = dynamic(
  () => import('@/components/email-editor/GrapeEditor'),
  { ssr: false, loading: () => <EditorSkeleton /> }
)

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#050505' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,241,254,0.08)', border: '1px solid rgba(0,241,254,0.15)' }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#00f1fe' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#8c90a1', fontFamily: 'Inter, sans-serif' }}>
          Editör yükleniyor...
        </p>
      </div>
    </div>
  )
}

const aiActions = [
  { label: 'Daha premium', icon: Crown, color: '#f59e0b', instruction: 'İçeriği daha lüks ve premium bir tona çevir.' },
  { label: 'Satış odaklı', icon: TrendingUp, color: '#34d399', instruction: 'Dönüşüm odaklı, güçlü CTA ve aciliyet hissi ver.' },
  { label: 'Başlık yenile', icon: Type, color: '#b3c5ff', instruction: 'Başlığı daha çarpıcı ve dikkat çekici yap.' },
  { label: 'Kısa & güçlü', icon: Zap, color: '#fbbf24', instruction: 'Tüm metinleri kısalt, her kelime güçlü olsun.' },
  { label: 'Luxury stil', icon: Star, color: '#fb7185', instruction: 'Yazı tonunu lüks moda markası gibi yap.' },
  { label: 'Kişiselleştir', icon: Target, color: '#fb923c', instruction: '{{isim}} kullanarak metni kişisel yap.' },
]

const styleOptions = ['Luxury', 'Tech', 'Cyber', 'Minimal']


function EditorInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const editorRef = useRef<GrapeEditorHandle>(null)

  const [editorReady, setEditorReady] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [savedTemplate, setSavedTemplate] = useState(false)
  const [rightTab, setRightTab] = useState<'stil' | 'ai' | 'gelisimis'>('ai')
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [selectedStyle, setSelectedStyle] = useState('Luxury')
  const [scanning, setScanning] = useState(false)

  const templateId = searchParams.get('template')
  const storeName = session?.user?.storeName || 'Mağazanız'

  const onEditorReady = useCallback(() => {
    setEditorReady(true)
    if (templateId) {
      const preset = templatePresets.find(p => p.id === templateId)
      if (preset) {
        let html: string
        if (emailTemplateHtml[templateId]) {
          html = emailTemplateHtml[templateId]
        } else if (preset.blocks?.length) {
          html = renderBlocksToEmailHtml(preset.blocks)
        } else {
          return
        }
        setTimeout(() => editorRef.current?.setContent(html), 400)
      }
    }
  }, [templateId, storeName])

  useEffect(() => {
    if (templateId && !campaignName) {
      const preset = templatePresets.find(p => p.id === templateId)
      setCampaignName(preset?.name || 'Yeni Kampanya')
    }
  }, [templateId, campaignName])

  async function sendAiMessage(instruction: string) {
    setAiMessages(prev => [...prev, { role: 'user', text: instruction }])
    setAiInput('')
    setAiLoading(true)
    setScanning(true)
    try {
      const html = editorRef.current?.getFullHtml() ?? ''
      const res = await fetch('/api/ai/edit-email-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, instruction, storeName }),
      })
      const data = await res.json()
      if (data.html) editorRef.current?.setContent(data.html)
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        text: data.html ? `✅ ${data.message || 'Değişiklik uygulandı!'}` : `⚠️ ${data.error || 'Değişiklik uygulanamadı.'}`,
      }])
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Bağlantı hatası.' }])
    } finally {
      setAiLoading(false)
      setTimeout(() => setScanning(false), 1500)
    }
  }

  async function handleSaveCampaign() {
    if (!editorReady) return
    setSaving(true)
    try {
      const html = editorRef.current!.getFullHtml()
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName || 'Yeni Kampanya', type: 'email', status: 'draft',
          segment: 'all', subject: campaignName, body: html,
          design: '{}', tips: [],
        }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => router.push('/campaigns'), 1400) }
    } finally { setSaving(false) }
  }

  async function handleSaveTemplate() {
    if (!editorReady) return
    setSavingTemplate(true)
    try {
      const html = editorRef.current!.getFullHtml()
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName || 'Şablonum', type: 'email',
          category: templateId || 'custom', subject: campaignName,
          body: html, design: '{}',
        }),
      })
      setSavedTemplate(true)
      setTimeout(() => setSavedTemplate(false), 2500)
    } finally { setSavingTemplate(false) }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#050505', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Global Styles ── */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        @keyframes scanEffect {
          0%   { top: -10%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .btn-gradient {
          background: linear-gradient(270deg, #001849, #003fa4, #00f1fe);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
          border: 1px solid rgba(0,241,254,0.3);
          transition: box-shadow 0.3s;
        }
        .btn-gradient:hover:not(:disabled) {
          box-shadow: 0 0 24px rgba(0,241,254,0.3);
        }
        .glass-panel {
          background: rgba(10,12,20,0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
          font-style: normal;
          font-size: inherit;
          line-height: 1;
          display: inline-block;
          white-space: nowrap;
          user-select: none;
        }
        .icon-fill { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .scan-line {
          position: absolute; left: 0; width: 100%; height: 3px;
          background: rgba(0,241,254,0.9);
          box-shadow: 0 0 20px 6px rgba(0,241,254,0.5);
          z-index: 10; pointer-events: none; opacity: 0;
        }
        .scanning .scan-line { animation: scanEffect 1.5s ease-in-out; }
        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%;
          background: #fff; cursor: pointer; margin-top: -5px;
          box-shadow: 0 0 8px rgba(0,241,254,0.6);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%; height: 4px; cursor: pointer;
          background: linear-gradient(90deg, #0066ff 0%, #00f1fe 100%); border-radius: 2px;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
        .block-drag:hover { border-color: rgba(0,241,254,0.3) !important; }
        .ai-action-btn:hover { border-color: rgba(0,241,254,0.25) !important; background: rgba(0,241,254,0.04) !important; }
      `}</style>

      {/* ── Top Bar ── */}
      <header className="shrink-0 z-50 flex items-center px-6 gap-4" style={{
        height: 60, background: '#131313',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.6)',
      }}>
        <div className="flex items-center gap-3">
          <Link href="/campaigns"
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#8c90a1' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.06)' }} />

          <input
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            placeholder="Kampanya adı..."
            className="bg-transparent outline-none border-b border-transparent focus:border-[#00f1fe]/30 transition-colors pb-0.5 text-sm font-bold"
            style={{ color: '#e5e2e1', maxWidth: 240 }}
          />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#5a5f72' }}>
            Taslak
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={cn('w-1.5 h-1.5 rounded-full transition-colors',
              editorReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse')} />
            <span className="text-[10px] hidden sm:block" style={{ color: '#8c90a1' }}>
              {editorReady ? 'Hazır' : 'Yükleniyor'}
            </span>
          </div>

          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.05)' }} />

          <button onClick={handleSaveTemplate} disabled={savingTemplate || savedTemplate || !editorReady}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={savedTemplate
              ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
              : { border: '1px solid rgba(255,255,255,0.06)', color: '#8c90a1' }}>
            {savingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : savedTemplate ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
            <span className="hidden sm:block">{savedTemplate ? 'Kaydedildi' : 'Şablon Kaydet'}</span>
          </button>

          <button onClick={handleSaveCampaign} disabled={saving || saved || !editorReady}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={saved
              ? { background: 'rgba(16,185,129,0.85)', color: 'white', boxShadow: '0 0 20px rgba(52,211,153,0.3)' }
              : { background: '#0066ff', color: 'white', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 0 20px rgba(0,102,255,0.3)' }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            {saved ? 'Kaydedildi' : 'Yayınla'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Center Canvas ── */}
        <main className={cn('flex-1 overflow-hidden flex flex-col relative', scanning && 'scanning')}
          style={{ background: '#050505' }}>
          <div className="scan-line" />
          <GrapeEditor
            ref={editorRef}
            onReady={onEditorReady}
            storeName={storeName}
          />
        </main>

        {/* ── Right Panel ── */}
        <aside className="shrink-0 flex flex-col overflow-hidden" style={{
          width: 320,
          background: '#1c1b1b',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.4)',
        }}>

          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(28,27,27,0.97)' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18, color: '#00f1fe', textShadow: '0 0 8px rgba(0,241,254,0.5)' }}>
                auto_awesome
              </span>
              <h3 className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>AI Studio</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#00f1fe', boxShadow: '0 0 8px #00f1fe' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#00f1fe' }}>Aktif</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { id: 'stil', label: 'Stil' },
              { id: 'ai', label: 'AI Studio' },
              { id: 'gelisimis', label: 'Gelişmiş' },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setRightTab(tab.id as typeof rightTab)}
                className="flex-1 py-3 text-[11px] font-semibold transition-all relative"
                style={rightTab === tab.id
                  ? { color: '#00f1fe', borderBottom: '2px solid #00f1fe', background: 'rgba(0,241,254,0.03)' }
                  : { color: '#8c90a1', borderBottom: '2px solid transparent' }}>
                {tab.label}
                {tab.id === 'ai' && (
                  <span className="absolute -top-0.5 right-3 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#00f1fe', boxShadow: '0 0 6px #00f1fe' }} />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* ── Stil Tab ── */}
            {rightTab === 'stil' && (
              <div className="p-5 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: '#00f1fe' }}>auto_awesome</span>
                    <h4 className="text-xs font-semibold" style={{ color: '#e5e2e1' }}>Stil Seçimi</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {styleOptions.map(s => (
                      <button key={s} onClick={() => setSelectedStyle(s)}
                        className="py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                        style={selectedStyle === s
                          ? { background: '#0e0e0e', border: '1px solid #00f1fe', color: '#00f1fe', boxShadow: '0 0 12px rgba(0,241,254,0.15)' }
                          : { background: '#353534', border: '1px solid rgba(255,255,255,0.05)', color: '#8c90a1' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold" style={{ color: '#e5e2e1' }}>Görünüm</h4>
                    <span className="px-2 py-0.5 rounded text-[9px]" style={{ background: '#353534', color: '#8c90a1' }}>Temel</span>
                  </div>
                  {[
                    { label: 'Arkaplan Yoğunluğu', value: '80%', min: 0, max: 100, def: 80 },
                    { label: 'Glow Etkisi', value: '40px', min: 0, max: 100, def: 40 },
                    { label: 'Köşe Yuvarlaklığı', value: '16px', min: 0, max: 32, def: 16 },
                  ].map(ctrl => (
                    <div key={ctrl.label} className="mb-5">
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px]" style={{ color: '#8c90a1' }}>{ctrl.label}</span>
                        <span className="text-[10px] font-mono" style={{ color: '#e5e2e1' }}>{ctrl.value}</span>
                      </div>
                      <input type="range" min={ctrl.min} max={ctrl.max} defaultValue={ctrl.def} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs" style={{ color: '#8c90a1' }}>Tam Ekran Hero</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                        style={{ background: '#353534' }}
                        data-checked-bg="#00f1fe"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI Studio Tab ── */}
            {rightTab === 'ai' && (
              <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 180px)' }}>

                {/* AI Command */}
                <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <label className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#424656' }}>
                    AI Komutu
                  </label>
                  <div className="relative">
                    <textarea
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && aiInput.trim() && !aiLoading) {
                          e.preventDefault()
                          sendAiMessage(aiInput)
                        }
                      }}
                      placeholder="Sinematik ışıklandırma ekle, metni daha premium yap..."
                      disabled={aiLoading || !editorReady}
                      rows={4}
                      className="w-full px-3 py-3 text-xs rounded-lg outline-none resize-none disabled:opacity-50 transition-all"
                      style={{
                        background: '#0e0e0e',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#e5e2e1',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(0,241,254,0.3)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
                    />
                    <button className="absolute bottom-2.5 right-2.5 transition-transform hover:scale-110"
                      style={{ color: '#00f1fe' }}>
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18 }}>mic</span>
                    </button>
                  </div>
                  <button
                    onClick={() => aiInput.trim() && sendAiMessage(aiInput)}
                    disabled={!aiInput.trim() || aiLoading || !editorReady}
                    className="btn-gradient w-full text-white py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 mt-3 disabled:opacity-40">
                    {aiLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Oluşturuluyor...</>
                      : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>brush</span> Uygula</>}
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#424656' }}>
                    Hızlı Aksiyonlar
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {aiActions.map(action => {
                      const Icon = action.icon
                      return (
                        <button key={action.label}
                          onClick={() => sendAiMessage(action.instruction)}
                          disabled={aiLoading || !editorReady}
                          className="ai-action-btn flex items-center gap-1.5 p-2.5 rounded-lg text-left transition-all disabled:opacity-40"
                          style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Icon className="w-3 h-3 shrink-0" style={{ color: action.color }} />
                          <span className="text-[10px] font-semibold leading-tight" style={{ color: '#8c90a1' }}>
                            {action.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Chat */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(0,241,254,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Wand2 className="w-5 h-5" style={{ color: 'rgba(0,241,254,0.4)' }} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#424656' }}>
                        Bir AI komutu girin veya<br />hızlı aksiyonları kullanın
                      </p>
                    </div>
                  ) : aiMessages.map((msg, i) => (
                    <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                      style={{ animation: 'slideUp 0.3s ease' }}>
                      <div className="max-w-[95%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line"
                        style={msg.role === 'user'
                          ? { background: '#0066ff', color: 'white', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }
                          : { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', color: '#e5e2e1' }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2.5 rounded-xl flex items-center gap-1.5"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: '#00f1fe', animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Gelişmiş Tab ── */}
            {rightTab === 'gelisimis' && (
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#424656' }}>
                    Font Ailesi
                  </p>
                  {['Inter', 'Geist', 'JetBrains Mono'].map(f => (
                    <button key={f}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs mb-1.5 transition-colors"
                      style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.05)', color: '#8c90a1', fontFamily: f }}>
                      {f}
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#424656' }}>
                    Renk Paleti
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {['#0066ff', '#00f1fe', '#131313', '#ffffff', '#1c1b1b', '#b3c5ff'].map(c => (
                      <button key={c}
                        className="w-8 h-8 rounded-lg border-2 border-transparent transition-all hover:scale-110"
                        style={{ background: c, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}
                        onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(0,241,254,0.4)')}
                        onMouseOut={e => (e.currentTarget.style.borderColor = 'transparent')}
                      />
                    ))}
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                      style={{ border: '1px dashed #424656', color: '#424656' }}>+</button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#424656' }}>
                    Boşluk (px)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Üst', 'Sağ', 'Alt', 'Sol', 'Yatay', 'Dikey'].map(lbl => (
                      <div key={lbl}>
                        <p className="text-[9px] mb-1" style={{ color: '#424656' }}>{lbl}</p>
                        <input type="number" defaultValue={16}
                          className="w-full px-2 py-1.5 text-xs rounded-lg outline-none"
                          style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', color: '#e5e2e1' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00f1fe' }} />
      </div>
    }>
      <EditorInner />
    </Suspense>
  )
}
