'use client'

import { useState } from 'react'
import ScreenshotSlot from '@/components/whatsapp/ScreenshotSlot'
import { Check, ChevronRight, ArrowLeft, Copy, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

interface FormValues {
  wabaId: string
  phoneNumberId: string
  accessToken: string
  appSecret: string
}

const STEPS = ['Giriş', 'Numara', 'İşletme', 'Uygulama', 'Numara Ekle', 'Bilgiler', 'Webhook', 'Yayınla', 'Tamamlandı'] as const
const WEBHOOK_URL = 'https://app.marksio.com/api/webhooks/whatsapp'

const inp: React.CSSProperties = {
  width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#111827', outline: 'none',
}
const helperStyle: React.CSSProperties = { fontSize: 11, color: '#6B7280', margin: '5px 0 0', lineHeight: 1.5 }

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
      {helper && <p style={helperStyle}>{helper}</p>}
    </div>
  )
}

function StepDot({ num, current }: { num: number; current: Step }) {
  const done = current > num
  const active = current === num
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, flexShrink: 0,
      background: done ? '#16A34A' : active ? '#2563EB' : '#F3F4F6',
      color: done || active ? '#fff' : '#9CA3AF',
      border: active ? '2px solid #2563EB' : done ? '2px solid #16A34A' : '2px solid #E5E7EB',
    }}>
      {done ? <Check size={12} /> : num}
    </div>
  )
}

function NavBtns({ onBack, onNext, nextLabel = 'İleri', nextDisabled = false }: { onBack: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
      <button onClick={onBack} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={13} /> Geri
      </button>
      <button onClick={onNext} disabled={nextDisabled} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: nextDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: nextDisabled ? 0.5 : 1 }}>
        {nextLabel} <ChevronRight size={14} />
      </button>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '11px 14px', display: 'flex', gap: 10 }}>
      <Info size={14} style={{ color: '#2563EB', flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '11px 14px', display: 'flex', gap: 10 }}>
      <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function Steps({ label, items }: { label?: string; items: React.ReactNode[] }) {
  return (
    <div>
      {label && <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>{label}</p>}
      <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</li>
        ))}
      </ol>
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
  const [subscribeWarning, setSubscribeWarning] = useState<string | null>(null)
  const [webhookToken, setWebhookToken] = useState('')
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'done' | 'error'>('syncing')
  const [copied, setCopied] = useState<string | null>(null)
  const [numberStatus, setNumberStatus] = useState<'fresh' | 'existing' | null>(null)

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
    setSubscribeWarning(null)
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
      if (d.subscribed === false && d.subscribeError) {
        setSubscribeWarning(d.subscribeError)
      }
      setStep(7)
    } catch {
      setTestError('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.')
    } finally {
      setTesting(false)
    }
  }

  function goToSuccess() {
    setStep(9)
    setSyncStatus('syncing')
    fetch('/api/whatsapp/templates/sync', { method: 'POST' })
      .then(r => setSyncStatus(r.ok ? 'done' : 'error'))
      .catch(() => setSyncStatus('error'))
  }

  const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
  const totalSteps = STEPS.length

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28, flexWrap: 'wrap' }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <StepDot num={i + 1} current={step} />
                <span style={{ fontSize: 10, color: step === i + 1 ? '#2563EB' : step > i + 1 ? '#16A34A' : '#9CA3AF', fontWeight: step === i + 1 ? 600 : 400, display: 'none' }} className="sm:inline">
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 18, height: 1, background: step > i + 1 ? '#16A34A' : '#E5E7EB', margin: '0 3px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#E5E7EB', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((step - 1) / (totalSteps - 1)) * 100}%`, background: 'linear-gradient(90deg, #2563EB, #16A34A)', transition: 'width 0.4s ease', borderRadius: 4 }} />
        </div>

        {/* Content card */}
        <div style={card}>

          {/* ── Adım 1: Giriş ── */}
          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 20, overflow: 'hidden', borderRadius: 10 }}>
                <ScreenshotSlot step="onboarding-intro" alt="WhatsApp Business API bağlantı illüstrasyonu" src="/whatsapp/onboarding-intro.png" aspectRatio="16/7"  theme="light"/>
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

          {/* ── Adım 2: Numara Durumu ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Bağlayacağınız Numara Hakkında</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Devam etmeden önce bir bilgi vermemiz gerekiyor.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {([
                  { val: 'fresh' as const, label: 'Hayır, bu numara hiçbir yerde WhatsApp\'ta kayıtlı değil (yeni numara)' },
                  { val: 'existing' as const, label: 'Evet, bu numarayı telefonumda WhatsApp Business uygulamasında kullanıyorum' },
                ] as const).map(opt => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: numberStatus === opt.val ? '#EFF6FF' : '#F9FAFB', border: `2px solid ${numberStatus === opt.val ? '#2563EB' : '#E5E7EB'}`, borderRadius: 9, padding: '13px 14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="numberStatus"
                      value={opt.val}
                      checked={numberStatus === opt.val}
                      onChange={() => setNumberStatus(opt.val)}
                      style={{ marginTop: 2, flexShrink: 0, accentColor: '#2563EB' }}
                    />
                    <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{opt.label}</span>
                  </label>
                ))}
              </div>

              {numberStatus === 'existing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 9, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <AlertTriangle size={15} style={{ color: '#EA580C', flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: '#7C2D12', lineHeight: 1.6 }}>
                        <strong>Önemli uyarı:</strong> Bu numarayı Marksio'ya bağlamak için telefonunuzdaki WhatsApp Business uygulamasından bu numarayı <strong>silmeniz</strong> gerekecek. Bu işlem geri alınamaz — numaranızdaki tüm mesaj geçmişi kaybolur. Devam etmeden önce önemli sohbetlerinizi yedekleyin.<br /><br />
                        <strong>Öneri:</strong> Mevcut numaranızı WhatsApp Business uygulamasında kullanmaya devam etmek istiyorsanız, Marksio için ayrı bir telefon numarası (yeni SIM) kullanmanızı öneririz.
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 9, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Info size={15} style={{ color: '#2563EB', flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
                        <strong>Endişelenmeyin — kontrolü kaybetmiyorsunuz.</strong> Numaranızı Marksio'ya bağladıktan sonra Marksio&apos;nun Inbox ekranından, telefonunuzdaki WhatsApp uygulamasında yaptığınız gibi gelen tüm mesajları görüp istediğiniz an kendiniz yanıtlayabilirsiniz. AI&apos;dan istediğiniz zaman devralıp manuel yazabilirsiniz. Sadece kullandığınız arayüz değişiyor (telefon uygulaması yerine Marksio paneli) — kontrolünüz değişmiyor.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <NavBtns onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={numberStatus === null} />
            </div>
          )}

          {/* ── Adım 3: Meta İşletme Hesabı ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Meta İşletme Hesabı Oluşturun</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>WhatsApp Cloud API için Meta Business Manager hesabı gerekli.</p>
              </div>
              <Steps items={[
                <><a href="https://business.facebook.com/overview" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>business.facebook.com/overview</a> adresine gidin</>,
                <><strong>Hesap Oluştur</strong> deyip işletme bilgilerinizi girin</>,
                <>Zaten bir işletme hesabınız varsa bu adımı atlayın — sonraki adıma geçin</>,
              ]} />
              <InfoBox>Zaten bir Meta Business Manager hesabınız varsa (örn. Facebook reklamları için kullanıyorsanız) yeni bir hesap oluşturmanıza gerek yok.</InfoBox>
              <ScreenshotSlot step="meta-business-account" alt="Meta Business Manager hesap oluşturma" src="/whatsapp/guide/meta-business-account.png"  theme="light"/>
              <NavBtns onBack={() => setStep(2)} onNext={() => setStep(4)} />
            </div>
          )}

          {/* ── Adım 4: Meta Uygulaması ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Meta Uygulaması Oluşturun</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>WhatsApp API'ye erişmek için bir Meta uygulaması gerekli.</p>
              </div>
              <Steps items={[
                <><a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>developers.facebook.com/apps</a> → <strong>Uygulama Oluştur</strong></>,
                <><strong>İşletme</strong> türünü seçin</>,
                <>Uygulama adı girin — <strong style={{ color: '#DC2626' }}>"WhatsApp" kelimesini kullanmayın</strong>, Meta reddeder. Örn: "Mağaza Adınız İletişim"</>,
                <>Kullanım senaryosu olarak <strong>"WhatsApp üzerinden müşterilerinizle bağlantı kurun"</strong> seçin</>,
                <>Oluşturulduktan sonra sol menüden <strong>WhatsApp → API Kurulumu</strong> (API Setup) bölümüne gidin</>,
              ]} />
              <WarnBox>Uygulama adında "WhatsApp", "Facebook", "Meta", "Instagram" gibi markalı kelimeler Meta tarafından reddedilir. İşletmenizin adını kullanın.</WarnBox>
              <ScreenshotSlot step="meta-app-creation" alt="Meta Developer Console'da uygulama oluşturma" src="/whatsapp/guide/meta-app-creation.png" caption="Meta for Developers'da 'Uygulama Oluştur' adımı" theme="light" />
              <NavBtns onBack={() => setStep(3)} onNext={() => setStep(5)} />
            </div>
          )}

          {/* ── Adım 5: Numara Ekleme ── */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>WhatsApp Numaranızı Ekleyin</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Gerçek işletme numaranızı Meta uygulamanıza tanıtın.</p>
              </div>
              <Steps items={[
                <>Meta uygulamanızda <strong>WhatsApp → API Kurulumu</strong> bölümüne gidin</>,
                <><strong>"Adım 2: Üretim Kurulumu" / "Add Phone Number"</strong> seçeneğine tıklayın</>,
                <>Kendi gerçek WhatsApp numaranızı girin (ülke kodu dahil, örn. <code style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>+905XXXXXXXXX</code>)</>,
                <>Size gönderilen SMS veya sesli aramayla gelen <strong>doğrulama kodunu</strong> girin</>,
                <>Numara onaylandıktan sonra API Setup sayfasına geri dönün</>,
              ]} />
              {numberStatus === 'existing' && (
                <WarnBox>
                  <strong>Hatırlatma:</strong> Bu numarayı WhatsApp Business uygulamasında kullanıyorsanız, numarayı buraya eklemeden önce uygulamadan silmeniz gerekiyor.
                </WarnBox>
              )}
              <ScreenshotSlot step="meta-add-phone" alt="Meta panelinde telefon numarası ekleme" src="/whatsapp/guide/meta-add-phone.png" caption="Telefon numaranızı ekleme ve SMS/sesli kodla doğrulama" theme="light" />
              <NavBtns onBack={() => setStep(4)} onNext={() => setStep(6)} />
            </div>
          )}

          {/* ── Adım 6: Form (4 Bilgi) ── */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>API Bilgilerini Girin</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Bu 4 bilgiyi Meta panelinden toplayıp aşağıya girin.</p>
              </div>

              {testError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} style={{ color: '#DC2626', marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#991B1B' }}>{testError}</span>
                </div>
              )}

              <Field
                label="WhatsApp Business Account ID (WABA ID)"
                helper='Meta panelinde "WhatsApp Business Account ID" veya "WhatsApp İşletme Hesabı Kimliği" olarak görünür. Phone Number ID ile karıştırmayın — ikisi farklı sayılardır, aynı sayfada yan yana durur.'
              >
                <input value={form.wabaId} onChange={f('wabaId')} placeholder="Örn: 1198936349970112" style={inp} />
              </Field>

              <Field
                label="Phone Number ID"
                helper='Meta panelinde "Phone number ID" veya "Telefon Numarası Kimliği" olarak görünür. WABA ID ile karıştırmayın.'
              >
                <input value={form.phoneNumberId} onChange={f('phoneNumberId')} placeholder="Örn: 922241300886400" style={inp} />
              </Field>

              <Field
                label="Access Token — Sistem Kullanıcısı Jetonu"
                helper='Çok uzun bir metin (200+ karakter), "EAG..." ile başlar. API Setup sayfasındaki GEÇİCİ token değil — Business Settings → Sistem Kullanıcıları üzerinden "Süresiz/Never" süreli kalıcı token oluşturun.'
              >
                <div style={{ position: 'relative' }}>
                  <input type={showToken ? 'text' : 'password'} value={form.accessToken} onChange={f('accessToken')} placeholder="EAABcde... (200+ karakter)" style={{ ...inp, paddingRight: 40 }} />
                  <button onClick={() => setShowToken(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              <Field
                label="App Secret — Uygulama Sırrı"
                helper='Kısa bir metin (~32 karakter). Uygulama Ayarları → Temel (Basic) sayfasında "Uygulama Sırrı / App Secret" → Göster butonuyla kopyalayın. Access Token ile karıştırmayın.'
              >
                <div style={{ position: 'relative' }}>
                  <input type={showSecret ? 'text' : 'password'} value={form.appSecret} onChange={f('appSecret')} placeholder="~32 karakter" style={{ ...inp, paddingRight: 40 }} />
                  <button onClick={() => setShowSecret(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              <ScreenshotSlot step="meta-api-setup" alt="Meta API Setup sayfasında WABA ID ve Phone Number ID konumları" src="/whatsapp/guide/meta-api-setup.png" caption="API Setup sayfasında WABA ID ve Phone Number ID'yi bulma" aspectRatio="16/9" theme="light" />

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setStep(5)} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={13} /> Geri
                </button>
                <button
                  onClick={handleTest}
                  disabled={testing || !form.wabaId.trim() || !form.phoneNumberId.trim() || !form.accessToken.trim() || !form.appSecret.trim()}
                  style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: testing ? 0.7 : 1 }}
                >
                  {testing ? <Loader2 size={13} className="animate-spin" /> : null}
                  {testing ? 'Test Ediliyor…' : 'Bağlantıyı Test Et'}
                </button>
              </div>
            </div>
          )}

          {/* ── Adım 7: Webhook ── */}
          {step === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Webhook'u Ayarlayın</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Meta uygulamanızın webhook ayarlarına bu URL ve doğrulama token'ını girin.</p>
              </div>

              {subscribeWarning && (
                <WarnBox><strong>Uyarı:</strong> {subscribeWarning}</WarnBox>
              )}

              {([{ label: 'Webhook URL', value: WEBHOOK_URL, key: 'url' }, { label: 'Verify Token (Doğrulama Kodu)', value: webhookToken || 'Yükleniyor…', key: 'token' }]).map(item => (
                <Field key={item.key} label={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px' }}>
                    <span style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: '#111827', overflowX: 'auto', whiteSpace: 'nowrap' }}>{item.value}</span>
                    <button onClick={() => copy(item.value, item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF', flexShrink: 0 }} title="Kopyala">
                      {copied === item.key ? <Check size={14} style={{ color: '#16A34A' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </Field>
              ))}

              <Steps items={[
                <>Meta App → <strong>WhatsApp → Yapılandırma → Webhook</strong> bölümüne gidin</>,
                <>Yukarıdaki <strong>Webhook URL</strong>'i ve <strong>Verify Token</strong>'ı yapıştırın</>,
                <><strong>messages</strong> alanını subscribe edin (Webhooks Fields bölümünden)</>,
                <><strong>Verify and Save</strong>'e tıklayın</>,
              ]} />
              <ScreenshotSlot step="webhook-setup" alt="Meta panelinde Webhook URL ve Verify Token alanları" src="/whatsapp/guide/webhook-setup.png" caption="Webhook URL ve doğrulama token'ını Meta panelinde girme" aspectRatio="16/9" theme="light" />
              <NavBtns onBack={() => setStep(6)} onNext={() => setStep(8)} nextLabel="Webhook Kuruldu, Devam Et" />
            </div>
          )}

          {/* ── Adım 8: Yayınlama ── */}
          {step === 8 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Uygulamayı Yayınlayın</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Bu adım atlanırsa gerçek müşteri mesajları sisteme hiç ulaşmaz.</p>
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, padding: '14px 16px', display: 'flex', gap: 10 }}>
                <AlertTriangle size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 1.6 }}>
                  <strong>Kritik adım:</strong> Uygulamanız hâlâ "Geliştirme / Development" modundaysa yalnızca test numaraları mesaj alabilir. Gerçek müşterilerden gelen mesajlar sisteme <strong>ulaşmaz</strong>.
                </div>
              </div>

              <Steps items={[
                <>Meta App panosunda sol menüden <strong>"Yayın" (App Review / Go Live)</strong> sekmesine gidin</>,
                <>Gizlilik politikası URL'i girin — kendi mağazanızın gizlilik politikası sayfası. <a href="/privacy" target="_blank" style={{ color: '#2563EB' }}>Marksio gizlilik sayfamızı</a> kullanabilirsiniz ya da Shopify/mağaza panelinizden kendinizinkini alın</>,
                <><strong>"Yayınla / Submit for Review"</strong> butonuna basın</>,
                <>Yayın onayı genellikle <strong>birkaç dakika ile birkaç saat</strong> arasında alınır. Acil durumlarda Meta destek hattını arayabilirsiniz</>,
              ]} />

              <InfoBox>
                Uygulama yayına girdikten sonra "Canlı / Live" statüsüne geçer. Bunu doğrulamak için App Dashboard üstünde yeşil "Canlı" etiketini görmeli ya da Status alanının "Development" yerine "Live" yazmasını beklemelisiniz.
              </InfoBox>

              <ScreenshotSlot step="meta-publish" alt="Meta Developer Console'da uygulamayı yayınlama sayfası" src="/whatsapp/guide/meta-publish.png" caption="Uygulamayı Geliştirme modundan Yayında moduna geçirme" aspectRatio="16/9" theme="light" />
              <NavBtns onBack={() => setStep(7)} onNext={goToSuccess} nextLabel="Yayınlandı, Tamamla" />
            </div>
          )}

          {/* ── Adım 9: Başarı ── */}
          {step === 9 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 20, overflow: 'hidden', borderRadius: 10 }}>
                <ScreenshotSlot step="onboarding-success" alt="WhatsApp bağlantısı başarılı" src="/whatsapp/onboarding-success.png" aspectRatio="16/7"  theme="light"/>
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
          Adım {step} / {totalSteps} — {STEPS[step - 1]}
        </p>
      </div>
    </div>
  )
}
