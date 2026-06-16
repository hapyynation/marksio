import { render } from '@react-email/render'
import React from 'react'
import WelcomeEmail, { type WelcomeEmailProps } from '@/emails/templates/welcome'
import PromotionEmail, { type PromotionEmailProps } from '@/emails/templates/promotion'
import CartAbandonmentEmail, { type CartAbandonmentEmailProps } from '@/emails/templates/cart-abandonment'
import OrderConfirmationEmail, { type OrderConfirmationEmailProps } from '@/emails/templates/order-confirmation'
import WinBackEmail, { type WinBackEmailProps } from '@/emails/templates/win-back'

export type EmailTemplate =
  | 'welcome'
  | 'promotion'
  | 'cart_abandonment'
  | 'order_confirmation'
  | 'win_back'

type TemplateProps =
  | WelcomeEmailProps
  | PromotionEmailProps
  | CartAbandonmentEmailProps
  | OrderConfirmationEmailProps
  | WinBackEmailProps

export async function renderEmail(
  template: EmailTemplate,
  props: TemplateProps,
): Promise<{ html: string; text: string }> {
  let element: React.ReactElement

  switch (template) {
    case 'welcome':
      element = <WelcomeEmail {...(props as WelcomeEmailProps)} />
      break
    case 'promotion':
      element = <PromotionEmail {...(props as PromotionEmailProps)} />
      break
    case 'cart_abandonment':
      element = <CartAbandonmentEmail {...(props as CartAbandonmentEmailProps)} />
      break
    case 'order_confirmation':
      element = <OrderConfirmationEmail {...(props as OrderConfirmationEmailProps)} />
      break
    case 'win_back':
      element = <WinBackEmail {...(props as WinBackEmailProps)} />
      break
    default:
      throw new Error(`Bilinmeyen şablon: ${template}`)
  }

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  return { html, text }
}

export function interpolateVars(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')
}
