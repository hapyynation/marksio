/**
 * Tek seferlik çalıştırılan script: WhatsApp modülü için statik illüstrasyonlar üretir.
 * Çalıştırma: npx tsx scripts/generate-whatsapp-assets.ts
 *
 * Üretilen dosyalar /public/whatsapp/ klasörüne kaydedilir.
 * Sayfa her yüklendiğinde API'ye istek atılmaz — görseller statik olarak servis edilir.
 */

import { fal } from '@fal-ai/client'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

if (!process.env.FAL_KEY) {
  console.error('FAL_KEY ortam değişkeni eksik. .env.local dosyanızı kontrol edin.')
  process.exit(1)
}

fal.config({ credentials: process.env.FAL_KEY })

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'whatsapp')

const ASSETS: Array<{ name: string; prompt: string }> = [
  {
    name: 'onboarding-intro',
    prompt: 'Flat minimal illustration of a smartphone with WhatsApp green chat bubbles floating around it, connected by dotted lines to a simple server icon, on a deep navy blue background (#08080f). Marksio brand colors: electric blue (#4470ff) and emerald green (#22c97a) accent lines. Clean geometric shapes, no text, no people, no photorealism. Simple vector art style, 16:9 landscape.',
  },
  {
    name: 'onboarding-success',
    prompt: 'Flat minimal celebration illustration: a large green checkmark circle (#22c97a) with small sparkle particles and confetti dots floating around it, a smartphone showing connected status, on deep navy background (#08080f). Marksio brand colors: electric blue (#4470ff) accents. Minimal vector art, no text, no people. 16:9 landscape.',
  },
  {
    name: 'empty-broadcasts',
    prompt: 'Flat minimal illustration of a megaphone / broadcast tower sending out simple WhatsApp green message icons as radio waves, on deep navy blue background (#08080f). Electric blue (#4470ff) and emerald green (#22c97a) colors. Clean geometric shapes, no text. Simple vector art style, 1:1 square.',
  },
  {
    name: 'empty-subscribers',
    prompt: 'Flat minimal illustration of three simple abstract human silhouettes (circles for heads) connected by lines forming a small network, with a small green phone icon (#22c97a) above them, on deep navy background (#08080f). Electric blue (#4470ff) connection lines. Minimal vector art, no text, no faces. 1:1 square.',
  },
  {
    name: 'empty-inbox',
    prompt: 'Flat minimal illustration of an inbox tray with a small WhatsApp green chat bubble floating above it and a blinking cursor dot, on deep navy blue background (#08080f). Marksio brand emerald green (#22c97a) and electric blue (#4470ff). Clean geometric shapes, no text. Simple vector art style, 1:1 square.',
  },
  {
    name: 'empty-templates',
    prompt: 'Flat minimal illustration of a simple document/template icon with a small WhatsApp-green approval checkmark badge on the corner, floating slightly above a subtle shadow, on deep navy background (#08080f). Electric blue (#4470ff) and emerald green (#22c97a) colors. Minimal vector art, no text. 1:1 square.',
  },
  {
    name: 'meta-app-creation',
    prompt: 'Flat minimal illustration of a stylized app icon with a key symbol and connection arrows, representing creating a developer app. Deep navy blue background (#08080f). Electric blue (#4470ff) geometric shapes, emerald green (#22c97a) accent dots. Clean vector art, no text, no logos, symbolic only. 16:9 landscape.',
  },
  {
    name: 'waba-phone-id',
    prompt: 'Flat minimal illustration of a smartphone with a unique ID badge/tag floating beside it, connected by a dotted line. A small WhatsApp-green phone number label. Deep navy blue background (#08080f). Electric blue (#4470ff) and emerald green (#22c97a) accents. Minimal vector art, no text. 16:9 landscape.',
  },
  {
    name: 'system-user-token',
    prompt: 'Flat minimal illustration of a security shield with a lock icon and a token/key symbol, representing a permanent secure API token. Deep navy blue background (#08080f). Electric blue (#4470ff) shield outline, emerald green (#22c97a) checkmark. Clean geometric vector art, no text. 16:9 landscape.',
  },
  {
    name: 'webhook-setup',
    prompt: 'Flat minimal illustration of two connected nodes with bidirectional arrows and a small lightning bolt, representing a webhook data connection. Deep navy blue background (#08080f). Electric blue (#4470ff) connection lines, emerald green (#22c97a) signal pulses. Minimal vector art, no text. 16:9 landscape.',
  },
]

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(dest)
    client.get(url, res => {
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err) })
  })
}

async function generateImage(prompt: string, aspectRatio: '1:1' | '16:9'): Promise<string> {
  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt,
      num_images: 1,
      image_size: aspectRatio === '16:9' ? { width: 1280, height: 720 } : { width: 768, height: 768 },
      num_inference_steps: 4,
    },
  }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

  const url = (result.data ?? result)?.images?.[0]?.url
  if (!url) throw new Error('Fal.ai URL dönmedi')
  return url
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`Klasör oluşturuldu: ${OUTPUT_DIR}`)
  }

  for (const asset of ASSETS) {
    const destPath = path.join(OUTPUT_DIR, `${asset.name}.png`)

    if (fs.existsSync(destPath)) {
      console.log(`⏭  Atlanıyor (zaten var): ${asset.name}.png`)
      continue
    }

    console.log(`🎨 Üretiliyor: ${asset.name}…`)
    try {
      const aspectRatio = asset.prompt.includes('16:9') ? '16:9' : '1:1'
      const imageUrl = await generateImage(asset.prompt, aspectRatio)
      await downloadFile(imageUrl, destPath)
      console.log(`✅ Kaydedildi: public/whatsapp/${asset.name}.png`)
    } catch (err) {
      console.error(`❌ Hata (${asset.name}):`, (err as Error).message)
    }
  }

  console.log('\n✨ Tüm görseller işlendi.')
  console.log('Component kullanımı: <img src="/whatsapp/[asset-name].png" />')
}

main()
