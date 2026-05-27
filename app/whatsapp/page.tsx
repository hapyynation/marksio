'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { Loader2, Save, Send, Bot, MessageSquare, Zap, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2, ChevronRight } from 'lucide-react'

const TABS = ['Genel Bakış', 'Chatbot Ayarları', 'Akıllı Yanıtlar', 'Bağlantı'] as const
type Tab = typeof TABS[number]

const quickReplies = [
  { trigger: 'merhaba', response: 'Merhaba! Size nasıl yardımcı olabilirim? 👋' },
  { trigger: 'sipariş durumu', response: 'Sipariş durumunuzu kontrol etmek için sipariş numaranızı paylaşır mısınız?' },
  { trigger: 'iade', response: 'İade talepleriniz için destek ekibimiz yardımcı olacak. Lütfen bekleyiniz.' },
  { trigger: 'fiyat', response: 'Ürün fiyatları hakkında bilgi almak istediğiniz ürünün adını yazabilir misiniz?' },
]

const metrics = [
  { label: 'Toplam Konuşma', value: '1.248', change: '+14%', up: true },
  { label: 'Bot Çözüm Oranı', value: '%72', change: '+5%', up: true },
  { label: 'Ort. Yanıt Süresi', value: '1.2s', change: '-0.3s', up: true },
  { label: 'Bekleyen Ticket', value: '8', change: '+3', up: false },
]

export default function WhatsAppPage() {
  const [tab, setTab] = useState<Tab>('Genel Bakış')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testReply, setTestReply] = useState<string | null>(null)
  const [replies, setReplies] = useState(quickReplies)
  const [newTrigger, setNewTrigger] = useState('')
  const [newResponse, setNewResponse] = useState('')

  // Bot settings
  const [botName, setBotName] = useState('Marksio Asistan')
  const [botGreeting, setBotGreeting] = useState('Merhaba! Ben Marksio AI Asistanı. Sipariş, ürün veya destek konularında yardımcı olabilirim.')
  const [fallbackMsg, setFallbackMsg] = useState('Üzgünüm, bu konuda size yardımcı olamıyorum. Ekibimiz en kısa sürede iletişime geçecek.')
  const [autoReply, setAutoReply] = useState(true)
  const [offHours, setOffHours] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(true)

  // Connection
  const [phoneNumber] = useState('+90 555 123 45 67')
  const connectionStatus = 'connected' // 'connected' | 'pending' | 'disconnected'

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleTest = async () => {
    if (!testMsg.trim()) return
    setTestSending(true)
    setTestReply(null)
    await new Promise(r => setTimeout(r, 1200))
    const match = replies.find(r => testMsg.toLowerCase().includes(r.trigger))
    setTestReply(match?.response ?? fallbackMsg)
    setTestSending(false)
  }

  const addReply = () => {
    if (!newTrigger.trim() || !newResponse.trim()) return
    setReplies(prev => [...prev, { trigger: newTrigger.trim(), response: newResponse.trim() }])
    setNewTrigger('')
    setNewResponse('')
  }

  const removeReply = (idx: number) => setReplies(prev => prev.filter((_, i) => i !== idx))

  return (
    <AppShell>
      <Header title="WhatsApp AI Chatbot" subtitle="Müşteri mesajlarını otomatik yanıtlayın" />
      <div className="page-content flex-1 space-y-6">

        {/* Connection status banner */}
        <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold',
          connectionStatus === 'connected'
            ? 'bg-emerald-500/[0.07] border border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/[0.07] border border-amber-500/20 text-amber-400'
        )}>
          {connectionStatus === 'connected'
            ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> WhatsApp Business bağlı — {phoneNumber}</>
            : <><AlertCircle className="w-4 h-4 shrink-0" /> WhatsApp bağlantısı kurulmadı</>
          }
          {connectionStatus === 'connected' && (
            <span className="ml-auto text-xs font-normal" style={{ color: '#8c90a1' }}>
              Son güncelleme: 2 dakika önce
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="ds-tabs">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('ds-tab', tab === t && 'active')}>
              {t}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─────────────────────────────────────────────────── */}
        {tab === 'Genel Bakış' && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map(m => (
                <div key={m.label} className="stat-card">
                  <p className="label">{m.label}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: '#e5e2e1' }}>{m.value}</p>
                  <p className={cn('text-[11px] font-semibold mt-1', m.up ? 'text-emerald-400' : 'text-red-400')}>
                    {m.change} bu hafta
                  </p>
                </div>
              ))}
            </div>

            {/* Recent conversations + Test panel side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent conversations */}
              <div className="bento-card">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>Son Konuşmalar</p>
                  <span className="chip chip-cyan">Canlı</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Ayşe K.', msg: 'Sipariş durumum hakkında...', time: '2 dk', status: 'bot' },
                    { name: 'Mehmet A.', msg: 'İade işlemi yapmak istiyorum', time: '8 dk', status: 'human' },
                    { name: 'Fatma Y.', msg: 'Ürün fiyatı nedir?', time: '15 dk', status: 'bot' },
                    { name: 'Can D.', msg: 'Kargo ne zaman gelir?', time: '23 dk', status: 'bot' },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'rgba(0,241,254,0.08)', border: '1px solid rgba(0,241,254,0.12)', color: '#00f1fe' }}>
                        {c.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: '#e5e2e1' }}>{c.name}</p>
                        <p className="text-[11px] truncate" style={{ color: '#8c90a1' }}>{c.msg}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px]" style={{ color: '#424656' }}>{c.time}</p>
                        <span className={cn('chip text-[9px] mt-1',
                          c.status === 'bot' ? 'chip-cyan' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20')}>
                          {c.status === 'bot' ? 'Bot' : 'İnsan'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live test panel */}
              <div className="bento-card">
                <p className="text-sm font-bold mb-4" style={{ color: '#e5e2e1' }}>Bot Simülatörü</p>
                <div className="rounded-xl p-4 mb-4 space-y-3 min-h-[180px]"
                  style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(0,241,254,0.1)', border: '1px solid rgba(0,241,254,0.2)' }}>
                      <Bot className="w-3 h-3" style={{ color: '#00f1fe' }} />
                    </div>
                    <div className="rounded-xl rounded-tl-none px-3 py-2 text-xs max-w-[80%]"
                      style={{ background: '#1c1b1b', color: '#c2c6d8' }}>
                      {botGreeting}
                    </div>
                  </div>
                  {testMsg && (
                    <div className="flex justify-end">
                      <div className="rounded-xl rounded-tr-none px-3 py-2 text-xs max-w-[80%]"
                        style={{ background: 'rgba(0,102,255,0.15)', color: '#e5e2e1', border: '1px solid rgba(0,102,255,0.2)' }}>
                        {testMsg}
                      </div>
                    </div>
                  )}
                  {testReply && (
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(0,241,254,0.1)', border: '1px solid rgba(0,241,254,0.2)' }}>
                        <Bot className="w-3 h-3" style={{ color: '#00f1fe' }} />
                      </div>
                      <div className="rounded-xl rounded-tl-none px-3 py-2 text-xs max-w-[80%]"
                        style={{ background: '#1c1b1b', color: '#c2c6d8' }}>
                        {testReply}
                      </div>
                    </div>
                  )}
                  {testSending && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(0,241,254,0.1)', border: '1px solid rgba(0,241,254,0.2)' }}>
                        <Bot className="w-3 h-3" style={{ color: '#00f1fe' }} />
                      </div>
                      <div className="flex gap-1 px-3">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#8c90a1] animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={testMsg}
                    onChange={e => setTestMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTest()}
                    placeholder="Mesaj yazın..."
                    className="input flex-1 text-xs"
                  />
                  <button onClick={handleTest} disabled={testSending || !testMsg.trim()}
                    className="btn-gradient px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold text-white disabled:opacity-50">
                    {testSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CHATBOT SETTINGS ─────────────────────────────────────────── */}
        {tab === 'Chatbot Ayarları' && (
          <div className="space-y-5 max-w-2xl">
            <div className="bento-card space-y-5">
              <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>Bot Kimliği</p>

              <div>
                <label className="label">Bot Adı</label>
                <input value={botName} onChange={e => setBotName(e.target.value)} className="input" />
              </div>

              <div>
                <label className="label">Karşılama Mesajı</label>
                <textarea value={botGreeting} onChange={e => setBotGreeting(e.target.value)}
                  rows={3} className="input resize-none" />
                <p className="text-[10px] mt-1.5" style={{ color: '#8c90a1' }}>
                  Yeni bir konuşma başladığında otomatik gönderilir.
                </p>
              </div>

              <div>
                <label className="label">Fallback Mesajı</label>
                <textarea value={fallbackMsg} onChange={e => setFallbackMsg(e.target.value)}
                  rows={3} className="input resize-none" />
                <p className="text-[10px] mt-1.5" style={{ color: '#8c90a1' }}>
                  Bot yanıt veremediğinde kullanılır.
                </p>
              </div>
            </div>

            <div className="bento-card space-y-4">
              <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>Davranış Ayarları</p>

              {[
                { label: 'Otomatik yanıt', desc: 'Gelen mesajlara bot otomatik yanıt verir', value: autoReply, set: setAutoReply },
                { label: 'Mesai saati dışı modu', desc: '18:00–09:00 arası bot devreye girer', value: offHours, set: setOffHours },
                { label: 'AI destekli yanıtlar', desc: 'GPT ile daha akıllı, bağlamsal yanıtlar', value: aiEnabled, set: setAiEnabled },
              ].map(({ label, desc, value, set }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#e5e2e1' }}>{label}</p>
                    <p className="text-[11px]" style={{ color: '#8c90a1' }}>{desc}</p>
                  </div>
                  <button onClick={() => set(!value)}
                    className={cn('w-10 h-5.5 rounded-full relative transition-colors', value ? 'bg-[#0066ff]' : 'bg-white/10')}
                    style={{ width: 40, height: 22 }}>
                    <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm',
                      value ? 'translate-x-5' : 'translate-x-0.5')}
                      style={{ width: 18, height: 18, top: 2, left: 2 }} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={handleSave} disabled={saving}
              className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
            </button>
          </div>
        )}

        {/* ─── QUICK REPLIES ────────────────────────────────────────────── */}
        {tab === 'Akıllı Yanıtlar' && (
          <div className="space-y-5 max-w-2xl">
            <div className="bento-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>Otomatik Yanıtlar</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#8c90a1' }}>
                    Anahtar kelime eşleşmesi ile otomatik yanıt gönderilir
                  </p>
                </div>
                <span className="chip chip-cyan">{replies.length} kural</span>
              </div>

              <div className="space-y-2 mb-5">
                {replies.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="chip chip-cyan text-[9px]">{r.trigger}</span>
                        <ChevronRight className="w-3 h-3" style={{ color: '#424656' }} />
                      </div>
                      <p className="text-xs" style={{ color: '#8c90a1' }}>{r.response}</p>
                    </div>
                    <button onClick={() => removeReply(i)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400 shrink-0"
                      style={{ color: '#424656' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new rule */}
              <div className="p-4 rounded-xl space-y-3"
                style={{ background: 'rgba(0,241,254,0.03)', border: '1px solid rgba(0,241,254,0.08)' }}>
                <p className="text-xs font-semibold" style={{ color: '#00f1fe' }}>Yeni Kural Ekle</p>
                <div>
                  <label className="label">Anahtar Kelime</label>
                  <input value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
                    placeholder="örn: kargo, iade, fiyat..." className="input text-xs" />
                </div>
                <div>
                  <label className="label">Otomatik Yanıt</label>
                  <textarea value={newResponse} onChange={e => setNewResponse(e.target.value)}
                    placeholder="Bu anahtar kelime için yanıt..." rows={2} className="input resize-none text-xs" />
                </div>
                <button onClick={addReply} disabled={!newTrigger.trim() || !newResponse.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{ background: '#1c1b1b', border: '1px solid rgba(255,255,255,0.07)', color: '#c2c6d8' }}>
                  <Plus className="w-3.5 h-3.5" />
                  Kural Ekle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CONNECTION ───────────────────────────────────────────────── */}
        {tab === 'Bağlantı' && (
          <div className="space-y-5 max-w-xl">
            <div className="bento-card">
              <p className="text-sm font-bold mb-5" style={{ color: '#e5e2e1' }}>WhatsApp Business API Bağlantısı</p>

              {connectionStatus === 'connected' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#34d399' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>Bağlantı Aktif</p>
                      <p className="text-xs mt-0.5" style={{ color: '#8c90a1' }}>{phoneNumber} · Meta Business onaylı</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'İşletme Adı', value: 'Demo Mağaza' },
                      { label: 'WhatsApp No', value: phoneNumber },
                      { label: 'Hesap Türü', value: 'Business API' },
                      { label: 'Mesaj Limiti', value: '1.000/gün' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-xl"
                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#424656' }}>{label}</p>
                        <p className="text-xs font-semibold" style={{ color: '#e5e2e1' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: '#1c1b1b', border: '1px solid rgba(255,255,255,0.07)', color: '#8c90a1' }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Bağlantıyı Yenile
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm" style={{ color: '#8c90a1' }}>
                    WhatsApp Business API&apos;ye bağlanmak için Meta Business Manager hesabınıza ihtiyacınız var.
                  </p>

                  <div className="space-y-3">
                    {[
                      { step: '1', label: 'Meta Business Manager Hesabı Oluşturun', done: false },
                      { step: '2', label: 'WhatsApp Business API Onayı Alın', done: false },
                      { step: '3', label: 'API Anahtarını Aşağıya Girin', done: false },
                    ].map(({ step, label, done }) => (
                      <div key={step} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
                          done ? 'bg-emerald-500/15 text-emerald-400' : '')}
                          style={!done ? { background: 'rgba(255,255,255,0.06)', color: '#8c90a1' } : {}}>
                          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : step}
                        </div>
                        <p className="text-xs font-medium" style={{ color: done ? '#34d399' : '#c2c6d8' }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="label">WhatsApp API Anahtarı</label>
                    <input type="password" placeholder="wh_..." className="input" />
                  </div>
                  <div>
                    <label className="label">Telefon Numarası ID</label>
                    <input placeholder="Meta&apos;dan alınan Phone Number ID" className="input" />
                  </div>

                  <button className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white">
                    <Zap className="w-4 h-4" />
                    Bağlantıyı Kur
                  </button>
                </div>
              )}
            </div>

            {/* Webhook info */}
            <div className="bento-card">
              <p className="text-sm font-bold mb-3" style={{ color: '#e5e2e1' }}>Webhook URL</p>
              <p className="text-xs mb-3" style={{ color: '#8c90a1' }}>
                Meta Developer Console&apos;da bu URL&apos;yi webhook endpoint olarak ekleyin.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.04)' }}>
                <MessageSquare className="w-4 h-4 shrink-0" style={{ color: '#8c90a1' }} />
                <code className="text-xs flex-1 truncate" style={{ color: '#b3c5ff' }}>
                  https://app.marksio.com/api/webhooks/whatsapp
                </code>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
