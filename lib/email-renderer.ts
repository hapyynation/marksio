import React from 'react'
import { render } from '@react-email/render'
import WelcomeEmail from '@/emails/templates/welcome'
import PromotionEmail from '@/emails/templates/promotion'
import CartAbandonmentEmail from '@/emails/templates/cart-abandonment'
import OrderConfirmationEmail from '@/emails/templates/order-confirmation'
import WinBackEmail from '@/emails/templates/win-back'

export type EmailTemplate =
  | 'welcome'
  | 'promotion'
  | 'cart_abandonment'
  | 'order_confirmation'
  | 'win_back'

export interface CartItem { name: string; price: string; imageUrl?: string; quantity: number }
export interface OrderItem { name: string; price: string; quantity: number; imageUrl?: string }

export interface RenderProps {
  brandName: string
  brandColor: string
  brandLogo?: string
  customerName: string
  ctaText: string
  ctaUrl: string
  bodyText?: string
  subject?: string
  heroText?: string
  discountCode?: string
  discountAmount?: string
  productImageUrl?: string
  specialOfferText?: string
  daysSinceLastOrder?: number
  unsubscribeUrl: string
  cartItems?: CartItem[]
  cartTotal?: string
  orderNumber?: string
  orderDate?: string
  orderItems?: OrderItem[]
  subtotal?: string
  shipping?: string
  total?: string
  shippingAddress?: string
  urgencyText?: string
}

export function interpolateVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}

export async function renderEmail(
  template: EmailTemplate,
  props: RenderProps,
): Promise<{ html: string; text: string }> {
  let element: React.ReactElement

  switch (template) {
    case 'welcome':
      element = React.createElement(WelcomeEmail, {
        brandName:      props.brandName,
        brandColor:     props.brandColor,
        brandLogo:      props.brandLogo,
        customerName:   props.customerName,
        ctaText:        props.ctaText,
        ctaUrl:         props.ctaUrl,
        bodyText:       props.bodyText ?? '',
        unsubscribeUrl: props.unsubscribeUrl,
      })
      break
    case 'promotion':
      element = React.createElement(PromotionEmail, {
        brandName:       props.brandName,
        brandColor:      props.brandColor,
        brandLogo:       props.brandLogo,
        customerName:    props.customerName,
        subject:         props.subject ?? '',
        heroText:        props.heroText ?? '',
        bodyText:        props.bodyText ?? '',
        discountCode:    props.discountCode,
        discountAmount:  props.discountAmount,
        ctaText:         props.ctaText,
        ctaUrl:          props.ctaUrl,
        productImageUrl: props.productImageUrl,
        unsubscribeUrl:  props.unsubscribeUrl,
      })
      break
    case 'cart_abandonment':
      element = React.createElement(CartAbandonmentEmail, {
        brandName:      props.brandName,
        brandColor:     props.brandColor,
        brandLogo:      props.brandLogo,
        customerName:   props.customerName,
        cartItems:      props.cartItems ?? [],
        cartTotal:      props.cartTotal ?? '—',
        ctaText:        props.ctaText,
        ctaUrl:         props.ctaUrl,
        urgencyText:    props.urgencyText,
        unsubscribeUrl: props.unsubscribeUrl,
      })
      break
    case 'order_confirmation':
      element = React.createElement(OrderConfirmationEmail, {
        brandName:       props.brandName,
        brandColor:      props.brandColor,
        brandLogo:       props.brandLogo,
        customerName:    props.customerName,
        orderNumber:     props.orderNumber ?? '—',
        orderDate:       props.orderDate ?? '—',
        orderItems:      props.orderItems ?? [],
        subtotal:        props.subtotal ?? '—',
        shipping:        props.shipping ?? '—',
        total:           props.total ?? '—',
        shippingAddress: props.shippingAddress ?? '',
        trackingUrl:     props.ctaUrl || undefined,
        unsubscribeUrl:  props.unsubscribeUrl,
      })
      break
    case 'win_back':
      element = React.createElement(WinBackEmail, {
        brandName:          props.brandName,
        brandColor:         props.brandColor,
        brandLogo:          props.brandLogo,
        customerName:       props.customerName,
        daysSinceLastOrder: props.daysSinceLastOrder ?? 30,
        specialOfferText:   props.specialOfferText ?? props.bodyText ?? '',
        discountCode:       props.discountCode,
        ctaText:            props.ctaText,
        ctaUrl:             props.ctaUrl,
        unsubscribeUrl:     props.unsubscribeUrl,
      })
      break
    default:
      throw new Error(`Bilinmeyen şablon: ${template as string}`)
  }

  const html = await render(element)
  const text = await render(element, { plainText: true })
  return { html, text }
}
