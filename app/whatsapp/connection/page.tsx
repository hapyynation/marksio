'use client'

import { useState } from 'react'
import ScreenshotSlot from '@/components/whatsapp/ScreenshotSlot'
import { Check, ChevronRight, ArrowLeft, Copy, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface FormValues {
  wabaId: string
  phoneNumberId: string
  accessToken: string
  appSecret: string
}

const STEPS = ['Giriş', 'Meta App', 'Hesap ID', 'Token', 'Bilgiler', 'Webhook', 'Tamamlandı'] as const
const WEBHOOK_URL = 'https://app.marksio.com/api/webhooks/whatsapp'

const inpStyle: React.CSSProperties = {
  width: '100%',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  color: '#111827',
  outline: 'none',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function StepDot({ num, current }: { num: number; current: Step }) {
  const done = current > num
  const active = current === num
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        background: done ? '#16A34A' : active ? '#2563EB' : '#F3F4F6',
        color: done || active ? '#fff' : '#9CA3AF',
        border: active ? '2px solid #2563EB' : done ? '2px solid #16A34A' : '2px solid #E5E7EB',
      }}
    >
      {done ? <Check size={13} /> : num}
    </div>
  )
}

export default function ConnectionPage() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormValues>({ wabaId: '', phoneNumberId: '', accessToken: '', appSecret: '' })
  const [showToken, setShowToken] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [webhookToken, setWebhookToken] = useState('')
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'done' | 'error'>('syncing')
  const [copied, setCopied] = useState<string | null>(null)

  const f = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  async function handleTest() {
    setTesting(true)
    setTestError(null)
    try {
      const res = await fetch('/api/whatsapp/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setTestError(d.error ?? 'Bağlantı testi başarısız. Bilgilerinizi kontrol edin.')
        return
      }
      const d = await res.json()
      setWebhookToken(d.webhookVerifyToken ?? '')
      setStep(6)
    } catch {
      setTestError('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.')
    } finally {
      setTesting(false)
    }
  }

  function goToSuccess() {
    setStep(7)
    setSyncStatus('syncing')
    fetch('/api/whatsapp/templates/sync', { method: 'POST' })
      .then(r => setSyncStatus(r.ok ? 'done' : 'error'))
      .catch(() => setSyncStatus('error'))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#DCFCE7', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#16A34A' }}>chat_bubble</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>WhatsApp Business Bağlantısı</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Meta Cloud API'yi adım adım bağlayın</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32, flexWrap: 'wrap' }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StepDot num={i + 1} current={step} />
                <span style={{ fontSize: 11, color: step === i + 1 ? '#2563EB' : step > i + 1 ? '#16A34A' : '#9CA3AF', fontWeight: step === i + 1 ? 600 : 400, display: 'none' }} className="sm:inline">
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 24, height: 1, background: step > i + 1 ? '#16A34A' : '#E5E7EB', margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#E5E7EB', borderRadius: 4, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((step - 1) / 6) * 100}%`, background: 'linear-gradient(90deg, #2563EB, #16A34A)', transition: 'width 0.4s ease', borderRadius: 4 }} />
        </div>

        {/* Content card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          {/* Step 1: Giriş */}
          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 20, overflow: 'hidden', borderRadius: 10 }}>
                <ScreenshotSlot step="onboarding-intro" alt="WhatsApp Business API bağlantı illüstrasyonu" src="/whatsapp/onboarding-intro.png" aspectRatio="16/7" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>WhatsApp Business hesabını bağla</h2>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
                Meta Cloud API ile WhatsApp Business hesabınızı bağlayarak müşterilerinize toplu mesaj gönderebilir,
                şablonlarınızı yönetebilir ve AI destekli sohbet kurabilirsiniz.
              </p>
              <button onClick={() => setStep(2)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Başla <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Step 2: Meta App */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Meta for Developers'da App Oluşturun</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Yeni bir Meta Business uygulaması oluşturup WhatsApp ürününü ekleyin.</p>
              </div>
              <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  <><a href="https://developers.facebook.com" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>developers.facebook.com</a> adresine gidin</>,
                  <><strong>My Apps → Create App</strong> seçin</>,
                  <><strong>Business</strong> tipini seçin</>,
                  <>App'e bir ad verin ve oluşturun</>,
                  <>Sol menüden <strong>WhatsApp → Getting Started</strong>'a tıklayın</>,
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</li>
                ))}
              </ol>
              <ScreenshotSlot step="meta-app-creation" alt="Meta for Developers'da App oluşturma ekranı" src="/whatsapp/meta-app-creation.png" aspectRatio="16/9" />
              <NavBtns onBack={() => setStep(1)} onNext={() => setStep(3)} />
            </div>
          )}

          {/* Step 3: WABA ID */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>WABA ID ve Phone Number ID'yi Bulun</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Bu iki ID bağlantı formunda kullanılacak.</p>
              </div>
              <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  <>Meta App'inizde <strong>WhatsApp → API Setup</strong>'a gidin</>,
                  <><strong>WhatsApp Business Account ID (WABA ID)</strong>'yi kopyalayın</>,
                  <>Telefon numaranızın altındaki <strong>Phone Number ID</strong>'yi kopyalayın</>,
                  <>Bu iki değeri bir sonraki formda kullanacaksınız</>,
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</li>
                ))}
              </ol>
              <ScreenshotSlot step="waba-phone-id" alt="WABA ID ve Phone Number ID'nin Meta panelindeki konumu" src="/whatsapp/waba-phone-id.png" aspectRatio="16/9" />
              <NavBtns onBack={() => setStep(2)} onNext={() => setStep(4)} />
            </div>
          )}

          {/* Step 4: System User Token */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Kalıcı System User Token Oluşturun</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Geçici token kullanmayın; birkaç saat içinde sona erer ve bağlantınız kopar.</p>
              </div>

              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <AlertTriangle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                  <strong>Önemli:</strong> Geçici kullanıcı token'ı değil, <strong>kalıcı System User token'ı</strong> kullanın.
                  Token süresini <strong>Never</strong> olarak ayarlayın.
                </div>
              </div>

              <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  <><a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>business.facebook.com/settings</a> → <strong>Users → System Users</strong></>,
                  <><strong>Add System User</strong> ile admin kullanıcı oluşturun</>,
                  <><strong>Generate New Token</strong> → App'inizi seçin</>,
                  <>İzinler: <strong>whatsapp_business_messaging, whatsapp_business_management</strong></>,
                  <>Token süresini <strong>Never</strong> yapın</>,
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</li>
                ))}
              </ol>
              <ScreenshotSlot step="system-user-token" alt="Meta Business Manager'da System User Token oluşturma" src="/whatsapp/system-user-token.png" aspectRatio="16/9" />
              <NavBtns onBack={() => setStep(3)} onNext={() => setStep(5)} />
            </div>
          )}

          {/* Step 5: Form */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>API Bilgilerini Girin</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Önceki adımlarda topladığınız bilgileri aşağıya girin.</p>
              </div>

              {testError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} style={{ color: '#DC2626', marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#991B1B' }}>{testError}</span>
                </div>
              )}

              <Field label="WhatsApp Business Account ID (WABA ID)">
                <input value={form.wabaId} onChange={f('wabaId')} placeholder="1234567890987654" style={inpStyle} />
              </Field>
              <Field label="Phone Number ID">
                <input value={form.phoneNumberId} onChange={f('phoneNumberId')} placeholder="9876543210123456" style={inpStyle} />
              </Field>
              <Field label="System User Access Token">
                <div style={{ position: 'relative' }}>
                  <input type={showToken ? 'text' : 'password'} value={form.accessToken} onChange={f('accessToken')} placeholder="EAABcde..." style={{ ...inpStyle, paddingRight: 40 }} />
                  <button onClick={() => setShowToken(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="App Secret">
                <div style={{ position: 'relative' }}>
                  <input type={showSecret ? 'text' : 'password'} value={form.appSecret} onChange={f('appSecret')} placeholder="Webhook imza doğrulaması için" style={{ ...inpStyle, paddingRight: 40 }} />
                  <button onClick={() => setShowSecret(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setStep(4)} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={13} /> Geri
                </button>
                <button
                  onClick={handleTest}
                  disabled={testing || !form.wabaId.trim() || !form.phoneNumberId.trim() || !form.accessToken.trim()}
                  style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: testing ? 0.7 : 1 }}
                >
                  {testing ? <Loader2 size={13} className="animate-spin" /> : null}
                  {testing ? 'Test Ediliyor…' : 'Bağlantıyı Test Et'}
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Webhook */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Webhook'u Ayarlayın</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Meta App'inizin webhook ayarlarına bu URL ve token'ı girin.</p>
              </div>

              {[{ label: 'Webhook URL', value: WEBHOOK_URL, key: 'url' }, { label: 'Verify Token', value: webhookToken || 'Yükleniyor…', key: 'token' }].map(item => (
                <Field key={item.key} label={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px' }}>
                    <span style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: '#111827', overflowX: 'auto', whiteSpace: 'nowrap' }}>{item.value}</span>
                    <button onClick={() => copy(item.value, item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF', flexShrink: 0 }} title="Kopyala">
                      {copied === item.key ? <Check size={14} style={{ color: '#16A34A' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </Field>
              ))}

              <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  <>Meta App → <strong>WhatsApp → Configuration → Webhook</strong>'e gidin</>,
                  <>Yukarıdaki <strong>Webhook URL</strong>'i ve <strong>Verify Token</strong>'ı yapıştırın</>,
                  <><strong>messages</strong> alanını subscribe edin</>,
                  <><strong>Verify and Save</strong>'e tıklayın</>,
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</li>
                ))}
              </ol>
              <ScreenshotSlot step="webhook-setup" alt="Meta panelinde Webhook URL ve Verify Token alanlarının konumu" src="/whatsapp/webhook-setup.png" aspectRatio="16/9" />
              <NavBtns onBack={() => setStep(5)} onNext={goToSuccess} nextLabel="Tamamla" />
            </div>
          )}

          {/* Step 7: Başarı */}
          {step === 7 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 20, overflow: 'hidden', borderRadius: 10 }}>
                <ScreenshotSlot step="onboarding-success" alt="WhatsApp bağlantısı başarılı" src="/whatsapp/onboarding-success.png" aspectRatio="16/7" />
              </div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle2 size={22} style={{ color: '#16A34A' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Bağlantın tamamlandı!</h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>WhatsApp Business hesabınız Marksio'ya başarıyla bağlandı.</p>

              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                {syncStatus === 'syncing' && <Loader2 size={14} className="animate-spin" style={{ color: '#2563EB', flexShrink: 0 }} />}
                {syncStatus === 'done' && <CheckCircle2 size={14} style={{ color: '#16A34A', flexShrink: 0 }} />}
                {syncStatus === 'error' && <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0 }} />}
                <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
                  {syncStatus === 'syncing' && 'Şablonlar senkronize ediliyor…'}
                  {syncStatus === 'done' && 'Şablonlar senkronize edildi'}
                  {syncStatus === 'error' && 'Şablonlar daha sonra senkronize edilecek'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href="/whatsapp/broadcasts" style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  İlk Broadcast'i Oluştur <ChevronRight size={14} />
                </a>
                <a href="/whatsapp/templates" style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  Şablonlara Git
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Step label below */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', margin: '12px 0 0' }}>
          Adım {step} / {STEPS.length} — {STEPS[step - 1]}
        </p>
      </div>
    </div>
  )
}

function NavBtns({ onBack, onNext, nextLabel = 'İleri' }: { onBack: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
      <button onClick={onBack} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={13} /> Geri
      </button>
      <button onClick={onNext} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        {nextLabel} <ChevronRight size={14} />
      </button>
    </div>
  )
}
