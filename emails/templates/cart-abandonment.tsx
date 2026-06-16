import {
  Button,
  Column,
  Img,
  Row,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'
import BaseLayout from './base-layout'

export interface CartItem {
  name: string
  price: string
  imageUrl?: string
  quantity: number
}

export interface CartAbandonmentEmailProps {
  brandName: string
  brandColor: string
  brandLogo?: string
  customerName: string
  cartItems: CartItem[]
  cartTotal: string
  ctaText: string
  ctaUrl: string
  urgencyText?: string
  unsubscribeUrl: string
}

export default function CartAbandonmentEmail({
  brandName = 'Mağazanız',
  brandColor = '#4470ff',
  brandLogo,
  customerName = 'Değerli Müşterimiz',
  cartItems = [],
  cartTotal = '0 ₺',
  ctaText = 'Sepete Dön',
  ctaUrl = '#',
  urgencyText,
  unsubscribeUrl = '#',
}: CartAbandonmentEmailProps) {
  return (
    <BaseLayout
      preview={`${customerName}, sepetinizde ürünler bekliyor!`}
      brandName={brandName}
      brandColor={brandColor}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={hero}>
        {brandLogo && (
          <Img src={brandLogo} alt={brandName} width={56} height={56} style={logoStyle} />
        )}
        <Text style={heroIcon}>🛒</Text>
        <Text style={heroTitle}>Sepetinizde ürünler bekliyor!</Text>
        <Text style={heroSub}>Merhaba {customerName}, seçtiğiniz ürünler sizi bekliyor.</Text>

        {urgencyText && (
          <Section style={urgencyBanner}>
            <Text style={urgencyText2}>⚡ {urgencyText}</Text>
          </Section>
        )}
      </Section>

      {/* Cart Items */}
      <Section style={itemsSection}>
        {cartItems.map((item, i) => (
          <Row key={i} style={itemRow}>
            <Column style={itemImageCol}>
              {item.imageUrl ? (
                <Img src={item.imageUrl} alt={item.name} width={64} height={64} style={itemImage} />
              ) : (
                <Section style={itemImagePlaceholder}>
                  <Text style={{ margin: 0, fontSize: 24 }}>📦</Text>
                </Section>
              )}
            </Column>
            <Column style={itemDetails}>
              <Text style={itemName}>{item.name}</Text>
              <Text style={itemMeta}>Adet: {item.quantity}</Text>
            </Column>
            <Column style={itemPriceCol}>
              <Text style={itemPrice}>{item.price}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      {/* Total */}
      <Section style={totalSection}>
        <Row>
          <Column><Text style={totalLabel}>Toplam Tutar</Text></Column>
          <Column style={{ textAlign: 'right' as const }}>
            <Text style={totalAmount}>{cartTotal}</Text>
          </Column>
        </Row>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Button href={ctaUrl} style={{ ...ctaButton, backgroundColor: brandColor }}>
          {ctaText}
        </Button>
        <Text style={ctaNote}>Ürünler stokta sınırlı olabilir.</Text>
      </Section>
    </BaseLayout>
  )
}

const hero: React.CSSProperties = {
  padding: '32px 32px 20px',
  textAlign: 'center',
}

const logoStyle: React.CSSProperties = { borderRadius: 10, marginBottom: 12 }

const heroIcon: React.CSSProperties = {
  fontSize: 40,
  margin: '0 0 8px',
}

const heroTitle: React.CSSProperties = {
  color: '#111827',
  fontSize: 24,
  fontWeight: 800,
  margin: '0 0 8px',
  lineHeight: 1.2,
}

const heroSub: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 14,
  margin: 0,
}

const urgencyBanner: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: '10px 20px',
  marginTop: 16,
}

const urgencyText2: React.CSSProperties = {
  color: '#dc2626',
  fontSize: 13,
  fontWeight: 700,
  margin: 0,
}

const itemsSection: React.CSSProperties = {
  padding: '0 24px',
}

const itemRow: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  paddingTop: 12,
  paddingBottom: 12,
}

const itemImageCol: React.CSSProperties = {
  width: 76,
  verticalAlign: 'middle',
}

const itemImage: React.CSSProperties = {
  borderRadius: 8,
  objectFit: 'cover' as const,
}

const itemImagePlaceholder: React.CSSProperties = {
  width: 64,
  height: 64,
  backgroundColor: '#f3f4f6',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const itemDetails: React.CSSProperties = {
  verticalAlign: 'middle',
  paddingLeft: 12,
}

const itemName: React.CSSProperties = {
  color: '#111827',
  fontSize: 14,
  fontWeight: 600,
  margin: '0 0 2px',
}

const itemMeta: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 12,
  margin: 0,
}

const itemPriceCol: React.CSSProperties = {
  width: 90,
  textAlign: 'right' as const,
  verticalAlign: 'middle',
}

const itemPrice: React.CSSProperties = {
  color: '#111827',
  fontSize: 14,
  fontWeight: 700,
  margin: 0,
}

const totalSection: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: 10,
  margin: '16px 24px',
  padding: '14px 20px',
}

const totalLabel: React.CSSProperties = {
  color: '#374151',
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
}

const totalAmount: React.CSSProperties = {
  color: '#111827',
  fontSize: 18,
  fontWeight: 800,
  margin: 0,
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 32px 32px',
}

const ctaButton: React.CSSProperties = {
  borderRadius: 10,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 700,
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 12,
}

const ctaNote: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 12,
  margin: 0,
}
