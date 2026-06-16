import {
  Button,
  Img,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'
import BaseLayout from './base-layout'

export interface WelcomeEmailProps {
  brandName: string
  brandColor: string
  brandLogo?: string
  customerName: string
  ctaText: string
  ctaUrl: string
  bodyText: string
  unsubscribeUrl: string
}

export default function WelcomeEmail({
  brandName = 'Mağazanız',
  brandColor = '#4470ff',
  brandLogo,
  customerName = 'Değerli Müşterimiz',
  ctaText = 'Alışverişe Başla',
  ctaUrl = '#',
  bodyText = 'Bize katıldığınız için teşekkür ederiz. Sizi aramızda görmekten büyük mutluluk duyuyoruz.',
  unsubscribeUrl = '#',
}: WelcomeEmailProps) {
  return (
    <BaseLayout
      preview={`${brandName}'e hoş geldiniz!`}
      brandName={brandName}
      brandColor={brandColor}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={hero}>
        {brandLogo && (
          <Img
            src={brandLogo}
            alt={brandName}
            width={80}
            height={80}
            style={logoStyle}
          />
        )}
        <Text style={greeting}>
          Hoş Geldiniz, {customerName}!
        </Text>
        <Text style={subtitle}>
          {brandName} ailesine katıldığınız için teşekkür ederiz.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={bodyStyle}>{bodyText}</Text>
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
  padding: '40px 32px 24px',
  textAlign: 'center',
}

const logoStyle: React.CSSProperties = {
  borderRadius: 12,
  marginBottom: 20,
}

const greeting: React.CSSProperties = {
  color: '#1a1a2e',
  fontSize: 28,
  fontWeight: 800,
  margin: '0 0 8px',
  lineHeight: 1.2,
}

const subtitle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 15,
  margin: '0 0 4px',
  lineHeight: 1.5,
}

const content: React.CSSProperties = {
  padding: '0 32px 32px',
}

const bodyStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: 15,
  lineHeight: 1.8,
  margin: '0 0 28px',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
}

const ctaButton: React.CSSProperties = {
  borderRadius: 10,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 700,
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
