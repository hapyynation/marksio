import {
  Button,
  Img,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'
import BaseLayout from './base-layout'

export interface WinBackEmailProps {
  brandName: string
  brandColor: string
  brandLogo?: string
  customerName: string
  daysSinceLastOrder: number
  specialOfferText: string
  discountCode?: string
  ctaText: string
  ctaUrl: string
  unsubscribeUrl: string
}

export default function WinBackEmail({
  brandName = 'Mağazanız',
  brandColor = '#4470ff',
  brandLogo,
  customerName = 'Değerli Müşterimiz',
  daysSinceLastOrder = 30,
  specialOfferText = 'Sizi geri kazanmak için özel bir teklifimiz var!',
  discountCode,
  ctaText = 'Alışverişe Dön',
  ctaUrl = '#',
  unsubscribeUrl = '#',
}: WinBackEmailProps) {
  return (
    <BaseLayout
      preview={`Sizi özledik, ${customerName}!`}
      brandName={brandName}
      brandColor={brandColor}
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Hero */}
      <Section style={hero}>
        {brandLogo && (
          <Img src={brandLogo} alt={brandName} width={56} height={56} style={logoStyle} />
        )}
        <Text style={heroIcon}>💔</Text>
        <Text style={heroTitle}>Sizi Özledik, {customerName}!</Text>
        <Text style={heroSub}>
          {daysSinceLastOrder} gündür görüşemiyoruz. Nasılsınız?
        </Text>
      </Section>

      {/* Content */}
      <Section style={contentSection}>
        <Text style={bodyText}>
          Bir süredir sipariş vermediğinizi fark ettik. Sizi tekrar aramızda görmek isteriz.
        </Text>
        <Text style={offerText}>{specialOfferText}</Text>

        {discountCode && (
          <Section style={couponBox}>
            <Text style={couponLabel}>Size Özel İndirim Kodunuz</Text>
            <Text style={couponCode}>{discountCode}</Text>
            <Text style={couponNote}>Ödeme sayfasında uygulayabilirsiniz</Text>
          </Section>
        )}

        <Section style={ctaSection}>
          <Button href={ctaUrl} style={{ ...ctaButton, backgroundColor: brandColor }}>
            {ctaText}
          </Button>
        </Section>

        <Text style={closingText}>
          Bizi seçtiğiniz için teşekkürler. Sizi tekrar aramızda görmekten mutluluk duyarız. 🙏
        </Text>
      </Section>
    </BaseLayout>
  )
}

const hero: React.CSSProperties = { padding: '36px 32px 20px', textAlign: 'center' }
const logoStyle: React.CSSProperties = { borderRadius: 10, marginBottom: 12 }
const heroIcon: React.CSSProperties = { fontSize: 44, margin: '0 0 8px' }
const heroTitle: React.CSSProperties = { color: '#111827', fontSize: 26, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }
const heroSub: React.CSSProperties = { color: '#6b7280', fontSize: 14, margin: 0 }

const contentSection: React.CSSProperties = { padding: '20px 32px 32px' }

const bodyText: React.CSSProperties = {
  color: '#374151',
  fontSize: 15,
  lineHeight: 1.8,
  margin: '0 0 12px',
}

const offerText: React.CSSProperties = {
  color: '#111827',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.6,
  margin: '0 0 20px',
  padding: '14px 20px',
  backgroundColor: '#f0fdf4',
  borderLeft: '3px solid #22c55e',
  borderRadius: '0 8px 8px 0',
}

const couponBox: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '2px dashed #f59e0b',
  borderRadius: 12,
  padding: '16px 24px',
  textAlign: 'center',
  margin: '0 0 24px',
}

const couponLabel: React.CSSProperties = {
  color: '#92400e',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 6px',
}

const couponCode: React.CSSProperties = {
  color: '#78350f',
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: '4px',
  margin: '0 0 4px',
  fontFamily: 'monospace',
}

const couponNote: React.CSSProperties = {
  color: '#b45309',
  fontSize: 12,
  margin: 0,
}

const ctaSection: React.CSSProperties = { textAlign: 'center', marginBottom: 24 }

const ctaButton: React.CSSProperties = {
  borderRadius: 10,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 700,
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
}

const closingText: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 13,
  lineHeight: 1.6,
  textAlign: 'center',
  margin: 0,
}
