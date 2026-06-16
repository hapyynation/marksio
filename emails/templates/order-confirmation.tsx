import {
  Button,
  Column,
  Img,
  Row,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import React from 'react'
import BaseLayout from './base-layout'

export interface OrderItem {
  name: string
  price: string
  quantity: number
  imageUrl?: string
}

export interface OrderConfirmationEmailProps {
  brandName: string
  brandColor: string
  brandLogo?: string
  customerName: string
  orderNumber: string
  orderDate: string
  orderItems: OrderItem[]
  subtotal: string
  shipping: string
  total: string
  shippingAddress: string
  trackingUrl?: string
  unsubscribeUrl: string
}

export default function OrderConfirmationEmail({
  brandName = 'Mağazanız',
  brandColor = '#4470ff',
  brandLogo,
  customerName = 'Değerli Müşterimiz',
  orderNumber = '#12345',
  orderDate = new Date().toLocaleDateString('tr-TR'),
  orderItems = [],
  subtotal = '0 ₺',
  shipping = '0 ₺',
  total = '0 ₺',
  shippingAddress = '',
  trackingUrl,
  unsubscribeUrl = '#',
}: OrderConfirmationEmailProps) {
  return (
    <BaseLayout
      preview={`Sipariş onaylandı! ${orderNumber}`}
      brandName={brandName}
      brandColor={brandColor}
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Hero */}
      <Section style={hero}>
        {brandLogo && (
          <Img src={brandLogo} alt={brandName} width={56} height={56} style={logoStyle} />
        )}
        <Text style={checkIcon}>✅</Text>
        <Text style={heroTitle}>Siparişiniz Onaylandı!</Text>
        <Text style={heroSub}>Merhaba {customerName}, siparişiniz alındı ve hazırlanıyor.</Text>
      </Section>

      {/* Order meta */}
      <Section style={metaSection}>
        <Row>
          <Column style={metaCol}>
            <Text style={metaLabel}>Sipariş No</Text>
            <Text style={metaValue}>{orderNumber}</Text>
          </Column>
          <Column style={metaCol}>
            <Text style={metaLabel}>Tarih</Text>
            <Text style={metaValue}>{orderDate}</Text>
          </Column>
        </Row>
      </Section>

      {/* Items */}
      <Section style={itemsSection}>
        <Text style={sectionTitle}>Sipariş Detayı</Text>
        {orderItems.map((item, i) => (
          <Row key={i} style={itemRow}>
            <Column style={itemImageCol}>
              {item.imageUrl ? (
                <Img src={item.imageUrl} alt={item.name} width={56} height={56} style={itemImage} />
              ) : (
                <Section style={imagePlaceholder}>
                  <Text style={{ margin: 0, fontSize: 20 }}>📦</Text>
                </Section>
              )}
            </Column>
            <Column style={itemDetail}>
              <Text style={itemName}>{item.name}</Text>
              <Text style={itemQty}>Adet: {item.quantity}</Text>
            </Column>
            <Column style={itemPriceCol}>
              <Text style={itemPrice}>{item.price}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      {/* Totals */}
      <Section style={totalsSection}>
        <Row style={totalRow}>
          <Column><Text style={totalLabel}>Ara Toplam</Text></Column>
          <Column style={{ textAlign: 'right' as const }}><Text style={totalVal}>{subtotal}</Text></Column>
        </Row>
        <Row style={totalRow}>
          <Column><Text style={totalLabel}>Kargo</Text></Column>
          <Column style={{ textAlign: 'right' as const }}><Text style={totalVal}>{shipping}</Text></Column>
        </Row>
        <Hr style={{ borderColor: '#e5e7eb', margin: '8px 0' }} />
        <Row>
          <Column><Text style={grandLabel}>Toplam</Text></Column>
          <Column style={{ textAlign: 'right' as const }}><Text style={grandTotal}>{total}</Text></Column>
        </Row>
      </Section>

      {/* Shipping address */}
      {shippingAddress && (
        <Section style={addressSection}>
          <Text style={sectionTitle}>Teslimat Adresi</Text>
          <Text style={addressText}>{shippingAddress}</Text>
        </Section>
      )}

      {/* Tracking */}
      {trackingUrl && (
        <Section style={ctaSection}>
          <Button href={trackingUrl} style={{ ...ctaButton, backgroundColor: brandColor }}>
            Kargonuzu Takip Edin
          </Button>
        </Section>
      )}
    </BaseLayout>
  )
}

const hero: React.CSSProperties = { padding: '32px 32px 20px', textAlign: 'center' }
const logoStyle: React.CSSProperties = { borderRadius: 10, marginBottom: 12 }
const checkIcon: React.CSSProperties = { fontSize: 36, margin: '0 0 8px' }
const heroTitle: React.CSSProperties = { color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }
const heroSub: React.CSSProperties = { color: '#6b7280', fontSize: 14, margin: 0 }

const metaSection: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: 10,
  margin: '8px 24px 16px',
  padding: '14px 20px',
}
const metaCol: React.CSSProperties = { width: '50%' }
const metaLabel: React.CSSProperties = { color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px' }
const metaValue: React.CSSProperties = { color: '#111827', fontSize: 14, fontWeight: 700, margin: 0 }

const itemsSection: React.CSSProperties = { padding: '0 24px' }
const sectionTitle: React.CSSProperties = { color: '#374151', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }
const itemRow: React.CSSProperties = { borderBottom: '1px solid #f3f4f6', paddingTop: 10, paddingBottom: 10 }
const itemImageCol: React.CSSProperties = { width: 68, verticalAlign: 'middle' }
const itemImage: React.CSSProperties = { borderRadius: 8 }
const imagePlaceholder: React.CSSProperties = { width: 56, height: 56, backgroundColor: '#f3f4f6', borderRadius: 8 }
const itemDetail: React.CSSProperties = { verticalAlign: 'middle', paddingLeft: 12 }
const itemName: React.CSSProperties = { color: '#111827', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }
const itemQty: React.CSSProperties = { color: '#9ca3af', fontSize: 12, margin: 0 }
const itemPriceCol: React.CSSProperties = { width: 90, textAlign: 'right' as const, verticalAlign: 'middle' }
const itemPrice: React.CSSProperties = { color: '#111827', fontSize: 13, fontWeight: 700, margin: 0 }

const totalsSection: React.CSSProperties = { padding: '16px 24px' }
const totalRow: React.CSSProperties = { marginBottom: 4 }
const totalLabel: React.CSSProperties = { color: '#6b7280', fontSize: 13, margin: 0 }
const totalVal: React.CSSProperties = { color: '#374151', fontSize: 13, margin: 0 }
const grandLabel: React.CSSProperties = { color: '#111827', fontSize: 15, fontWeight: 700, margin: '4px 0 0' }
const grandTotal: React.CSSProperties = { color: '#111827', fontSize: 18, fontWeight: 800, margin: '4px 0 0' }

const addressSection: React.CSSProperties = { padding: '0 24px 16px' }
const addressText: React.CSSProperties = { color: '#374151', fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' as const }

const ctaSection: React.CSSProperties = { textAlign: 'center', padding: '16px 32px 32px' }
const ctaButton: React.CSSProperties = { borderRadius: 10, color: '#ffffff', fontSize: 14, fontWeight: 700, padding: '13px 32px', textDecoration: 'none', display: 'inline-block' }
