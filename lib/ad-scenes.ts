export interface SeasonalVariant {
  id: string
  name: string
  emoji: string
  bg: string
  bgPrompt: string
}

export interface AdScene {
  id: string
  name: string
  description: string
  emoji: string
  category: string
  bg: string                   // CSS gradient fallback for instant preview
  bgPrompt: string             // Fal.ai prompt for premium background generation
  sceneDesc: string            // Short phrase for bria product placement
  modelScene?: boolean         // Scene includes a model
  bestFor: string
  seasonal?: SeasonalVariant[]
}

// ─── Seasonal sub-variants ─────────────────────────────────────────────────────

export const SEASONAL_VARIANTS: SeasonalVariant[] = [
  {
    id: 'summer',
    name: 'Yaz',
    emoji: '☀️',
    bg: 'linear-gradient(135deg,#fff7ed,#fed7aa)',
    bgPrompt: 'Luxury Mediterranean beach resort at golden sunset, white sand, turquoise infinity pool, elegant cabana with white linen curtains, warm golden hour light, palm trees, luxury lifestyle brand photography, ultra-realistic 8K, no people, no products, no text',
  },
  {
    id: 'spring',
    name: 'Bahar',
    emoji: '🌸',
    bg: 'linear-gradient(135deg,#fdf4ff,#fae8ff)',
    bgPrompt: 'Elegant spring garden scene, blooming cherry blossoms overhead, soft diffused morning light, premium white bistro table and chair, delicate pink and white petals scattered, luxury brand lifestyle photography, ultra-realistic 8K, no people, no products, no text',
  },
  {
    id: 'black_friday',
    name: 'Black Friday',
    emoji: '🖤',
    bg: 'linear-gradient(135deg,#09090b,#1c0a0a)',
    bgPrompt: 'Dramatic dark luxury retail environment, deep matte black background, electric golden-amber neon light accents from below, luxury shopping atmosphere, cinematic volumetric lighting, abstract luxury brand commercial backdrop, ultra-realistic 8K, no people, no products, no text',
  },
  {
    id: 'new_year',
    name: 'Yılbaşı',
    emoji: '🎆',
    bg: 'linear-gradient(135deg,#1c1917,#a16207)',
    bgPrompt: 'Elegant New Year luxury celebration background, gold and champagne confetti bokeh, crystal champagne flutes with golden bubbles, warm amber ambient glow, luxury event atmosphere, ultra-realistic 8K commercial photography, no people, no products, no text',
  },
]

// ─── 9 Premium Ad Scenes ───────────────────────────────────────────────────────

export const AD_SCENES: AdScene[] = [
  {
    id: 'premium_studio',
    name: 'Premium Studio',
    description: 'Apple tarzı beyaz sonsuzluk stüdyosu. Minimal, temiz, premium.',
    emoji: '🤍',
    category: 'Studio',
    bg: 'linear-gradient(135deg,#f9fafb,#e5e7eb)',
    bgPrompt: 'Immaculate professional product photography studio, pure white seamless infinity curve backdrop meeting white floor, perfectly diffused octabox and softbox lighting creating soft gradient shadows, subtle reflection on polished white floor, Apple product photography aesthetic, minimalist commercial photography environment, ultra-realistic 8K, empty scene, no products, no people, no text, no logos',
    sceneDesc: 'ultra-clean white infinity curve product photography studio with soft professional lighting, Apple-level commercial photography',
    bestFor: 'Her ürün — elektronik, kozmetik, aksesuar',
  },
  {
    id: 'dark_luxury',
    name: 'Dark Luxury',
    description: 'Rolex & Nike sinematik siyah sahne. Dramatik, premium.',
    emoji: '🖤',
    category: 'Lüks',
    bg: 'linear-gradient(135deg,#0a0a0f,#1a0830)',
    bgPrompt: 'Cinematic dark luxury commercial photography environment, deep matte black velvet background, single dramatic high key spotlight beam from directly above creating cinematic light pool, subtle light smoke atmosphere, premium polished black granite or marble pedestal surface, Rolex and Louis Vuitton advertising aesthetic, luxury brand commercial photography, ultra-realistic 8K, empty scene, no products, no people, no text',
    sceneDesc: 'dramatic dark luxury environment with cinematic spotlight, Rolex-level black premium commercial photography',
    bestFor: 'Saat, parfüm, mücevher, premium teknoloji',
  },
  {
    id: 'lifestyle_model',
    name: 'Lifestyle Model',
    description: 'Profesyonel model sahnesi. Ürün modele uygulanır.',
    emoji: '👤',
    category: 'Model',
    bg: 'linear-gradient(135deg,#f0f4ff,#e0e8ff)',
    bgPrompt: 'Professional fashion model lifestyle commercial photography setting, modern upscale boutique interior with floor-to-ceiling windows, warm natural afternoon light, clean white walls, light oak parquet floor, minimal high-end furniture, premium fashion brand atmosphere, ultra-realistic 8K, empty scene ready for product placement, no text, no logos',
    sceneDesc: 'upscale boutique interior with natural window light, premium fashion brand lifestyle commercial photography',
    modelScene: true,
    bestFor: 'Gözlük, saat, şapka, çanta, moda',
  },
  {
    id: 'fashion_editorial',
    name: 'Fashion Editorial',
    description: 'Vogue & Zara seviyesi dergi kalitesi çekim.',
    emoji: '✨',
    category: 'Editöryal',
    bg: 'linear-gradient(135deg,#1a1a2e,#16213e)',
    bgPrompt: 'High-fashion magazine editorial photography environment, dramatic mixed lighting with sharp geometric shadows on textured concrete wall, urban luxury backdrop, stark contrasts, architectural minimalism, Vogue and Zara editorial aesthetic, professional fashion commercial photography, ultra-realistic 8K, empty scene, no products, no people, no text',
    sceneDesc: 'high-fashion editorial environment with dramatic geometric lighting and urban luxury backdrop, Vogue magazine quality',
    bestFor: 'Moda, aksesuar, ayakkabı, çanta',
  },
  {
    id: 'modern_ecommerce',
    name: 'Modern E-Commerce',
    description: 'Shopify premium mağaza. Yüksek dönüşüm odaklı.',
    emoji: '🛍️',
    category: 'E-Ticaret',
    bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
    bgPrompt: 'Modern premium e-commerce product photography background, clean gradient surface transitioning from soft sky blue to white, professional even lighting from all sides, premium Shopify store aesthetic, high-conversion product listing commercial photography, ultra-clean minimal background, ultra-realistic 8K, empty scene, no products, no people, no text',
    sceneDesc: 'clean professional e-commerce white-blue gradient surface with even studio lighting, Shopify premium product photography',
    bestFor: 'Her ürün — özellikle teknoloji ve ev',
  },
  {
    id: 'luxury_interior',
    name: 'Luxury Interior',
    description: 'Premium iç mekan. Mobilya, dekor, lifestyle.',
    emoji: '🏛️',
    category: 'İç Mekan',
    bg: 'linear-gradient(135deg,#faf5eb,#d4b896)',
    bgPrompt: 'Ultra-luxurious interior design scene, polished Italian white marble floor with subtle grey veining, high ceiling with warm amber chandelier glow, sophisticated neutral-toned linen furniture with gold accents, beige and gold color palette, 5-star hotel penthouse living room, warm ambient lighting with soft shadows, ultra-realistic 8K commercial photography, empty scene, no products, no people, no text',
    sceneDesc: 'luxury penthouse interior with Italian marble, warm chandelier lighting, 5-star hotel aesthetic',
    bestFor: 'Ev dekor, mobilya, kozmetik, lifestyle',
  },
  {
    id: 'outdoor_lifestyle',
    name: 'Outdoor Lifestyle',
    description: 'Premium dış mekan. Gymshark & Patagonia hissi.',
    emoji: '🌿',
    category: 'Outdoor',
    bg: 'linear-gradient(135deg,#052e16,#166534)',
    bgPrompt: 'Premium outdoor lifestyle commercial photography, dramatic mountain vista at golden hour, warm amber and orange sky, lush green alpine meadow in foreground, crystal clear mountain stream, Gymshark and Patagonia brand-level outdoor commercial photography, cinematic wide angle, ultra-realistic 8K, empty scene, no products, no people, no text',
    sceneDesc: 'premium outdoor mountain vista at golden hour with dramatic sky, Gymshark-level active lifestyle commercial photography',
    bestFor: 'Spor giyim, ekipman, outdoor ürünler',
  },
  {
    id: 'beauty_cosmetic',
    name: 'Beauty & Cosmetic',
    description: 'Sephora & CHANEL seviyesi güzellik çekimi.',
    emoji: '💄',
    category: 'Güzellik',
    bg: 'linear-gradient(135deg,#fff1f2,#fecdd3)',
    bgPrompt: 'Ultra-premium beauty and cosmetic product photography environment, pristine white marble counter surface with subtle pink-rose quartz veining, scattered fresh white gardenia flower petals, crystal perfume bottle reflections, soft diffused natural light with warm pink undertones, Sephora and Chanel beauty editorial aesthetic, ultra-realistic 8K, empty scene, no products, no people, no text',
    sceneDesc: 'luxury beauty environment with white marble, scattered flower petals, CHANEL-Sephora level cosmetic commercial photography',
    bestFor: 'Parfüm, kozmetik, cilt bakımı, güzellik',
  },
  {
    id: 'seasonal',
    name: 'Sezonsal Kampanya',
    description: 'Yaz, bahar, Black Friday, yılbaşı varyasyonları.',
    emoji: '🗓️',
    category: 'Kampanya',
    bg: 'linear-gradient(135deg,#fff7ed,#fed7aa)',
    bgPrompt: '',
    sceneDesc: '',
    bestFor: 'Kampanya, indirim, özel günler',
    seasonal: SEASONAL_VARIANTS,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getSceneById(id: string): AdScene | undefined {
  return AD_SCENES.find(s => s.id === id)
}

export function resolveScene(sceneId: string, seasonalVariantId?: string): {
  bgPrompt: string
  sceneDesc: string
  displayName: string
  isModelScene: boolean
} {
  const scene = getSceneById(sceneId)
  if (!scene) return { bgPrompt: '', sceneDesc: '', displayName: sceneId, isModelScene: false }

  if (scene.seasonal && seasonalVariantId) {
    const variant = scene.seasonal.find(v => v.id === seasonalVariantId) ?? scene.seasonal[0]
    return {
      bgPrompt: variant.bgPrompt,
      sceneDesc: variant.name + ' campaign backdrop',
      displayName: `${scene.name} — ${variant.name}`,
      isModelScene: false,
    }
  }

  return {
    bgPrompt: scene.bgPrompt,
    sceneDesc: scene.sceneDesc,
    displayName: scene.name,
    isModelScene: scene.modelScene ?? false,
  }
}

export function getProductTypeLabel(productName: string): string {
  const n = productName.toLowerCase()
  if (/gözlük|güneş|sunglass|eyewear/.test(n)) return 'eyewear'
  if (/saat|watch|timepiece/.test(n)) return 'watch'
  if (/parfüm|perfume|cologne|koku/.test(n)) return 'perfume'
  if (/kozmetik|makyaj|serum|krem|losyon|ruj|göz/.test(n)) return 'cosmetic'
  if (/tişört|gömlek|elbise|kıyafet|ceket|pantolon|hoodie/.test(n)) return 'clothing'
  if (/şapka|bere|cap|hat/.test(n)) return 'hat'
  if (/çanta|bag|purse|handbag|sırt/.test(n)) return 'bag'
  if (/ayakkabı|bot|sneaker|shoe|boot/.test(n)) return 'shoes'
  if (/telefon|phone|laptop|tablet|bilgisayar|kulaklık|tech/.test(n)) return 'tech'
  return 'product'
}

export function buildModelPrompt(productType: string, productName: string, brandName: string): string {
  const actionMap: Record<string, string> = {
    eyewear:  `confidently wearing stylish ${brandName} ${productName} sunglasses, glasses frame clearly visible`,
    watch:    `wearing a luxurious ${brandName} ${productName} watch on left wrist, watch face clearly visible`,
    hat:      `wearing a ${brandName} ${productName} hat, hat clearly visible on head`,
    clothing: `wearing a ${brandName} ${productName}, full outfit visible`,
    bag:      `carrying a ${brandName} ${productName} handbag, bag clearly visible`,
    shoes:    `wearing ${brandName} ${productName} shoes, shoes prominently shown`,
  }
  return actionMap[productType] ?? `using ${brandName} ${productName}`
}
