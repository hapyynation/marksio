import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components'
import React from 'react'

export interface BaseLayoutProps {
  preview: string
  brandName: string
  brandColor: string
  children: React.ReactNode
  unsubscribeUrl: string
}

export default function BaseLayout({
  preview,
  brandName,
  brandColor,
  children,
  unsubscribeUrl,
}: BaseLayoutProps) {
  return (
    <Html lang="tr" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: brandColor }}>
            <Text style={headerBrand}>{brandName}</Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              Bu e-postayı {brandName} mağazasından aldınız.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={unsubLink}>
                Aboneliği iptal et
              </Link>
              {' · '}
              <span>© {new Date().getFullYear()} {brandName}</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#f4f4f7',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  margin: 0,
  padding: '20px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  maxWidth: 600,
  margin: '0 auto',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}

const header: React.CSSProperties = {
  padding: '20px 32px',
  textAlign: 'center',
}

const headerBrand: React.CSSProperties = {
  color: '#ffffff',
  fontSize: 22,
  fontWeight: 800,
  margin: 0,
  letterSpacing: '-0.3px',
}

const divider: React.CSSProperties = {
  borderColor: '#e8eaed',
  margin: '0 32px',
}

const footer: React.CSSProperties = {
  padding: '16px 32px 24px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  color: '#9aa0a6',
  fontSize: 12,
  lineHeight: 1.6,
  margin: '4px 0',
}

const unsubLink: React.CSSProperties = {
  color: '#9aa0a6',
  textDecoration: 'underline',
}
