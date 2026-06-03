# Supabase Email OTP Kurulumu

## Özet
Uygulama artık Magic Link değil, **Email OTP** modunu kullanıyor.  
Kullanıcı e-postasına 6 haneli bir kod gönderilir, linke tıklamak gerekmez.

---

## 1. Email Template — Supabase Dashboard

**Authentication → Email Templates → "Magic Link"** bölümünü açın.

> Supabase, `signInWithOtp()` çağrısı için (emailRedirectTo olmadan) Magic Link template'ini kullanır
> ama `{{ .ConfirmationURL }}` boş gelir. Template içinde link olmadığı için sadece kod görünür.

### Subject (Konu) alanına yazın:
```
Marksio doğrulama kodunuz
```

### Body (İçerik) alanına `otp.html` dosyasının tamamını yapıştırın.

---

## 2. Resend SMTP Kurulumu (opsiyonel — marksio.com domain için)

**Authentication → Settings → SMTP Settings**

| Ayar | Değer |
|------|-------|
| SMTP Host | `smtp.resend.com` |
| SMTP Port | `465` |
| SMTP User | `resend` |
| SMTP Password | Resend API key (`re_...`) |
| Sender Name | `Marksio` |
| Sender Email | `noreply@mg.marksio.com` |

---

## 3. OTP Süresi

**Authentication → Settings → OTP Expiry**
- Değer: `600` (10 dakika)

---

## 4. Redirect URL'leri

**Authentication → URL Configuration → Redirect URLs**
```
https://app.marksio.com/**
http://localhost:3000/**
```

---

## Akış Özeti

```
Kullanıcı email girer
       ↓
signInWithOtp({ email }) — emailRedirectTo YOK
       ↓
Supabase → Magic Link template → e-posta gönderir
       ↓
Kullanıcı maildeki 6 haneli kodu görür
       ↓
Kodu uygulama OTP ekranına girer
       ↓
verifyOtp({ email, token, type: 'email' | 'signup' })
       ↓
Giriş/kayıt tamamlanır → Dashboard veya Onboarding
```
