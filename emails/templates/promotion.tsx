import {
  Button,
  Img,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'
import BaseLayout from './base-layout'

export interface PromotionEmailProps {
  brandName: string
  brandColor: string
  brandLogo?: string
  customerName: string
  subject: string
  heroText: string
  bodyText: string
  discountCode?: string
  discountAmount?: string
  ctaText: string
  ctaUrl: string
  productImageUrl?: string
  unsubscribeUrl: string
}

export default function PromotionEmail({
  brandName = 'Mağazanız',
  brandColor = '#4470ff',
  brandLogo,
  customerName = 'Değerli Müşterimiz',
  subject = 'Özel Kampanya',
  heroText = 'Kaçırmayın!',
  bodyText = 'Size özel hazırladığımız bu fırsatı kaçırmayın.',
  discountCode,
  discountAmount,
  ctaText = 'Hemen Alışveriş Yap',
  ctaUrl = '#',
  productImageUrl,
  unsubscribeUrl = '#',
}: PromotionEmailProps) {
  return (
    <BaseLayout
      preview={`${customerName}, size özel kampanya!`}
      brandName={brandName}
      brandColor={brandColor}
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Hero */}
      <Section style={hero}>
        {brandLogo && (
          <Img src={brandLogo} alt={brandName} width={60} height={60} style={logoStyle} />
        )}
        <Text style={heroTitle}>{heroText}</Text>
        {discountAmount && (
          <Text style={discountBadge}>{discountAmount} İndirim</Text>
        )}
      </Section>

      {/* Product image */}
      {productImageUrl && (
        <Img
          src={productImageUrl}
          alt="Kampanya görseli"
          width={600}
          style={{ width: '100%', display: 'block' }}
        />
      )}

      {/* Content */}
      <Section style={contentSection}>
        <Text style={salutation}>Merhaba {customerName},</Text>
        <Text style={bodyStyle}>{bodyText}</Text>

        {discountCode && (
          <Section style={couponBox}>
            <Text style={couponLabel}>İndirim Kodunuz</Text>
            <Text style={couponCode}>{discountCode}</Text>
            <Text style={couponNote}>Ödeme sayfasında uygulayın</Text>
          </Section>
        )}

        <Section style={ctaSection}>
          <Button href={ctaUrl} style={{ ...ctaButton, backgroundColor: brandColor }}>
            {ctaText}
          </Button>
        </Section>
      </Section>
    </BaseLayout>
  )
}

const hero: React.CSSProperties = {
  padding: '36px 32px 20px',
  textAlign: 'center',
  backgroundColor: '#fafafa',
  borderBottom: '1px solid #f0f0f0',
}

const logoStyle: React.CSSProperties = {
  borderRadius: 10,
  marginBottom: 16,
}

const heroTitle: React.CSSProperties = {
  color: '#111827',
  fontSize: 32,
  fontWeight: 900,
  margin: '0 0 8px',
  lineHeight: 1.15,
  letterSpacing: '-0.5px',
}

const discountBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#fee2e2',
  color: '#dc2626',
  fontSize: 16,
  fontWeight: 800,
  padding: '6px 18px',
  borderRadius: 100,
  margin: '8px 0 0',
}

const contentSection: React.CSSProperties = {
  padding: '28px 32px 32px',
}

const salutation: React.CSSProperties = {
  color: '#374151',
  fontSize: 15,
  margin: '0 0 12px',
}

const bodyStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: 15,
  lineHeight: 1.8,
  margin: '0 0 24px',
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

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
}

const ctaButton: React.CSSProperties = {
  borderRadius: 10,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 700,
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
}
