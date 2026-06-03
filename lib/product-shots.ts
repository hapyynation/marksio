export type ProductCategory =
  | 'footwear'    // shoes, sneakers, boots
  | 'eyewear'     // glasses, sunglasses
  | 'watch'       // watches, timepieces
  | 'fragrance'   // perfume, cologne
  | 'apparel'     // clothing, t-shirts, jackets
  | 'bag'         // bags, handbags, backpacks
  | 'cosmetics'   // skincare, makeup, beauty
  | 'tech'        // phones, laptops, earbuds
  | 'jewelry'     // rings, necklaces, bracelets
  | 'product'     // generic

export type ShotStyle = 'auto' | 'model' | 'hero' | 'lifestyle' | 'editorial'

export interface ShotStyleDef {
  id: ShotStyle
  name: string
  description: string
  emoji: string
  examples: string
}

export const SHOT_STYLES: ShotStyleDef[] = [
  {
    id: 'auto',
    name: 'Otomatik',
    description: 'AI ürün tipine göre en uygun çekim stilini seçer',
    emoji: '🤖',
    examples: 'Nike, Apple, CHANEL, Rolex',
  },
  {
    id: 'model',
    name: 'Model Çekimi',
    description: 'Profesyonel model ürünü kullanıyor veya giyiyor',
    emoji: '👤',
    examples: 'Zara, Gymshark, Ray-Ban, Adidas',
  },
  {
    id: 'hero',
    name: 'Ürün Hero',
    description: 'Sinematik stüdyo çekimi, ürün tam odakta',
    emoji: '📦',
    examples: 'Apple, Rolex, Dyson, Samsung',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Premium yaşam anında doğal kullanım',
    emoji: '🌿',
    examples: 'Lululemon, Patagonia, Airbnb, IKEA',
  },
  {
    id: 'editorial',
    name: 'Editöryal',
    description: 'Vogue, GQ, Harper\'s Bazaar moda çekimi',
    emoji: '✨',
    examples: 'Vogue, Prada, Balenciaga, Off-White',
  },
]

// ─── Category Detection ────────────────────────────────────────────────────────

export function detectCategory(name: string): ProductCategory {
  const n = name.toLowerCase()
  if (/shoe|sneaker|boot|ayakkabı|bot|spor ayak|koşu|yürüyüş|nike|adidas|jordan|puma|converse|vans/.test(n)) return 'footwear'
  if (/glass|sunglass|gözlük|güneş gözlüğü|lens|optik|frame|ray-ban|oakley/.test(n)) return 'eyewear'
  if (/watch|saat|timepiece|kol saati|omega|rolex|daniel wellington|casio/.test(n)) return 'watch'
  if (/parfüm|perfume|cologne|fragrance|koku|eau de|dior|chanel n°|versace/.test(n)) return 'fragrance'
  if (/tişört|t-shirt|gömlek|elbise|ceket|hoodie|dress|jacket|coat|kazak|triko|bluz|mont|pantolon|sweatshirt/.test(n)) return 'apparel'
  if (/çanta|bag|purse|backpack|handbag|tote|clutch|sırt/.test(n)) return 'bag'
  if (/krem|serum|makyaj|kozmetik|cream|makeup|lipstick|foundation|maskara|göz/.test(n)) return 'cosmetics'
  if (/phone|telefon|laptop|tablet|bilgisayar|kulaklık|earphone|airpod|watch|iphone|samsung|macbook|ipad/.test(n)) return 'tech'
  if (/yüzük|kolye|ring|necklace|bracelet|bilezik|küpe|earring|jewelry|mücevher/.test(n)) return 'jewelry'
  return 'product'
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  footwear:  '👟 Ayakkabı',
  eyewear:   '🕶️ Gözlük',
  watch:     '⌚ Saat',
  fragrance: '🌸 Parfüm',
  apparel:   '👕 Giyim',
  bag:       '👜 Çanta',
  cosmetics: '💄 Kozmetik',
  tech:      '📱 Teknoloji',
  jewelry:   '💍 Mücevher',
  product:   '📦 Ürün',
}

// ─── Commercial Photography Prompts ───────────────────────────────────────────

const QUALITY = 'Ultra-realistic 8K commercial advertising photography, professional studio lighting, shot on Phase One IQ4, award-winning brand advertisement, no text, no watermarks, no logos added, photorealistic'

const PRESERVATION = (product: string) =>
  `The product in this image is a ${product}. Keep EVERY SINGLE DETAIL of this product EXACTLY as shown in the reference image: identical colors, exact design, same materials, same logo placement, same proportions, same textures. The product must be pixel-perfect identical to the uploaded image.`

type PromptMatrix = Record<ShotStyle, Record<ProductCategory, string>>

const CONTEXT_MATRIX: PromptMatrix = {
  auto: {
    footwear:  'Dynamic Nike/Adidas-level sports commercial: professional athlete wearing these exact shoes in a dramatic action moment - powerful sprint, mid-jump, or explosive movement. Cinematic motion blur on background, razor-sharp focus on the shoes. Moody stadium lighting or gritty urban concrete environment.',
    eyewear:   'Ray-Ban/Prada fashion commercial: confident professional model wearing these glasses, sophisticated urban backdrop or clean minimalist studio. Editorial portrait lighting, bokeh background, premium fashion brand aesthetic.',
    watch:     'Rolex/Audemars Piguet luxury advertisement: elegant wrist shot showing the watch on a well-dressed individual, polished marble surface reflection below, single dramatic spotlight from above creating luxury atmosphere.',
    fragrance: 'CHANEL/Dior luxury fragrance commercial: the bottle on premium Italian marble surface, scattered fresh white petals, crystal perfume bottle refractions, soft diffused light from above, silk fabric draped elegantly nearby, ultra-luxury beauty aesthetic.',
    apparel:   'Gymshark/Zara fashion campaign: professional model confidently wearing this garment in appropriate premium setting - gym for activewear, urban street for casual, elegant interior for formal wear. Clean commercial fashion photography.',
    bag:       'Louis Vuitton/Celine fashion advertisement: sophisticated model carrying this bag in upscale urban setting or clean studio. Premium lifestyle commercial photography.',
    cosmetics: 'Sephora/La Mer luxury beauty commercial: product on pristine white marble with soft pink rose petals, clean minimal beauty editorial setting, soft diffused window light, premium skincare brand aesthetic.',
    tech:      'Apple/Sony product commercial: product in ultra-clean minimalist studio with perfect soft lighting, abstract geometric background, floating on glass surface with subtle reflection. Premium technology advertisement.',
    jewelry:   'Tiffany/Cartier luxury jewelry commercial: elegant close-up on smooth skin or velvet display, single dramatic spotlight creating perfect sparkle, deep black or pearl white background.',
    product:   'Premium brand commercial photography: professional hero shot with dramatic studio lighting, clean background, product as the hero. Nike/Apple brand quality.',
  },
  model: {
    footwear:  'Nike campaign: professional athlete model wearing these shoes in powerful sports action - dynamic sprint through concrete or stadium setting, shoes sharply in focus, background in cinematic motion blur.',
    eyewear:   'Fashion magazine editorial: professional model wearing these glasses, confident gaze, premium fashion studio backdrop, dramatic Vogue-quality portrait lighting.',
    watch:     'Luxury watch advertisement: elegant male model wearing the watch, sophisticated close-up of wrist and timepiece, business formal context, dramatic split lighting.',
    fragrance: 'Luxury fragrance campaign: sophisticated model holding the bottle gracefully, or bottle placed in scene as model poses nearby with perfume mist visible, CHANEL campaign aesthetic.',
    apparel:   'Fashion brand campaign: professional model wearing this exact garment, confident pose, premium fashion photography - appropriate setting for the garment style.',
    bag:       'Luxury brand campaign: professional model carrying this bag in upscale setting, fashion editorial quality, lifestyle commercial photography.',
    cosmetics: 'Beauty brand campaign: professional model using or displaying the product, clean beauty editorial lighting, magazine cover quality.',
    tech:      'Tech commercial: professional lifestyle model using the device in premium home or office setting, natural confident interaction.',
    jewelry:   'Luxury jewelry editorial: elegant close-up on model wearing the piece, dramatic spotlight, luxury fashion magazine quality.',
    product:   'Professional model commercial: confident lifestyle model showcasing the product in premium brand advertisement setting.',
  },
  hero: {
    footwear:  'Nike product hero: the shoes dramatically suspended/floating in mid-air, perfectly centered, against pure black or deep dark background, single spotlight beam from above, shoe sole visible, cinematic smoke effect, explosive energy.',
    eyewear:   'Luxury eyewear hero: glasses on pristine minimal surface, perfect 3/4 angle, single clean spotlight, subtle reflection on surface below, Apple product photography quality.',
    watch:     'Watchmaker hero shot: watch face perfectly centered, dramatic macro close-up, single spot of light hitting the dial, deep black velvet background, every detail of the craftsmanship visible.',
    fragrance: 'Luxury fragrance hero: bottle perfectly centered on marble, dramatically lit from one side, crystal-clear reflections, scattered petals, premium beauty commercial.',
    apparel:   'Fashion hero: garment perfectly laid flat or displayed on invisible mannequin, pure white or dramatic dark background, perfect even lighting showing every detail of the fabric and design.',
    bag:       'Luxury bag hero: bag perfectly positioned, dramatic studio lighting showing all materials and details, clean minimal background, premium fashion brand advertisement.',
    cosmetics: 'Beauty product hero: perfect macro/hero shot of the product, clean white marble or minimal surface, soft even beauty lighting, premium cosmetic brand commercial.',
    tech:      'Apple-style product hero: device perfectly centered, ultra-clean white or space grey background, perfect soft box lighting, product floating on clean surface, iconic product photography.',
    jewelry:   'Jewelry hero: piece on black velvet or pearl white surface, single spotlight creating perfect sparkle and refraction, macro detail visible.',
    product:   'Premium product hero: ultra-clean studio setup, product perfectly lit from all sides, pure background, Apple/Nike product photography standard.',
  },
  lifestyle: {
    footwear:  'Lifestyle sports: athlete wearing shoes during golden hour outdoor run, beautiful natural light, premium lifestyle brand photography, Lululemon/Patagonia aesthetic.',
    eyewear:   'Lifestyle fashion: person wearing glasses in sunny outdoor cafe or urban street, candid natural moment, warm lifestyle photography, premium brand feel.',
    watch:     'Luxury lifestyle: watch worn naturally during upscale activity - coffee meeting, yacht deck, business travel. Aspirational lifestyle commercial.',
    fragrance: 'Lifestyle luxury: perfume bottle on personal vanity or bathroom marble, morning light streaming in, aspirational luxury home lifestyle photography.',
    apparel:   'Lifestyle fashion: person wearing the clothing in authentic daily life premium setting - morning coffee, city walk, beach, gym - candid and natural.',
    bag:       'Lifestyle fashion: person with the bag in authentic upscale everyday moment - shopping street, cafe, travel. Aspirational lifestyle photography.',
    cosmetics: 'Lifestyle beauty: product used in beautiful morning routine, natural bathroom light, authentic luxury beauty lifestyle.',
    tech:      'Lifestyle tech: device being used naturally in beautiful home office, coffee shop, or outdoor premium setting. Candid lifestyle commercial.',
    jewelry:   'Luxury lifestyle: jewelry naturally worn in aspirational lifestyle moment, warm natural light, beautiful life aesthetic.',
    product:   'Premium lifestyle commercial: product naturally integrated into aspirational daily life, warm authentic photography, premium brand storytelling.',
  },
  editorial: {
    footwear:  'High fashion editorial: shoes as art objects in surreal or architectural setting, avant-garde styling, dramatic Vogue editorial lighting, conceptual fashion photography.',
    eyewear:   'Fashion editorial: Vogue-quality model portrait, glasses as statement piece, bold editorial makeup, striking fashion backdrop, magazine cover quality.',
    watch:     'Luxury editorial: watch in dramatic editorial context, bold lighting, artistic composition, GQ/Esquire magazine quality commercial.',
    fragrance: 'Luxury editorial: fragrance bottle in surreal artistic luxury setting, bold conceptual commercial, Vogue-level fashion photography.',
    apparel:   'Fashion editorial: garment styled for high fashion editorial, bold composition, dramatic editorial lighting, Vogue/Harper\'s Bazaar quality.',
    bag:       'Fashion editorial: bag in bold editorial styling, architectural or artistic backdrop, Vogue/Celine campaign aesthetic.',
    cosmetics: 'Beauty editorial: cosmetic product in bold artistic beauty editorial, dramatic lighting, Vogue Beauty level.',
    tech:      'Tech editorial: device in bold conceptual commercial, dramatic architectural or abstract setting, Wired magazine quality.',
    jewelry:   'Jewelry editorial: piece in bold fashion editorial context, dramatic lighting, Vogue Jewelry quality.',
    product:   'Fashion editorial: product in bold artistic editorial context, magazine cover quality, dramatic lighting, conceptual advertising.',
  },
}

// ─── Main prompt builder ───────────────────────────────────────────────────────

export function buildCommercialPrompt(
  category: ProductCategory,
  style: ShotStyle,
  productName: string,
  brandName: string,
  orientation: 'landscape' | 'portrait' | 'square' = 'landscape',
): string {
  const productLabel = [brandName, productName].filter(Boolean).join(' ') || category
  const effectiveStyle = style === 'auto' ? 'auto' : style
  const context = CONTEXT_MATRIX[effectiveStyle][category] ?? CONTEXT_MATRIX[effectiveStyle]['product']
  const orientationHint = orientation === 'portrait'
    ? 'Vertical full-frame portrait composition, product as the undisputed cinematic hero filling the frame with power and presence. Premium editorial layout.'
    : orientation === 'square'
      ? 'Perfect square composition, product boldly centered and dominant, dramatic symmetrical studio setup, Instagram-ready premium commercial shot.'
      : 'Wide cinematic full-frame landscape composition, product as the absolute hero. Dramatic foreground with atmospheric depth. No space reserved for text overlay — the product commands the entire frame.'

  return `${PRESERVATION(productLabel)} ${context} ${orientationHint} ${QUALITY}.`
}

export function getAutoStyle(category: ProductCategory): ShotStyle {
  const styleMap: Partial<Record<ProductCategory, ShotStyle>> = {
    footwear:  'model',
    eyewear:   'model',
    watch:     'hero',
    fragrance: 'hero',
    apparel:   'model',
    bag:       'lifestyle',
    cosmetics: 'hero',
    tech:      'hero',
    jewelry:   'hero',
  }
  return styleMap[category] ?? 'hero'
}

// ─── Background Scene Prompts (product-free backdrops for banner layout) ──────

const BG_QUALITY = 'ultra-high quality commercial advertisement background, professional photography studio lighting, no people, no products, no text, no watermarks, photorealistic, 8K'

const BG_STYLES: Record<string, string> = {
  minimal:   'clean minimalist white and soft ivory gradient background, subtle ambient shadows, airy premium product photography studio, pure elegance',
  modern:    'dramatic dark midnight blue to deep navy gradient, subtle geometric bokeh patterns, premium contemporary brand aesthetic, cinematic moody atmosphere',
  luxury:    'elegant Italian Carrara marble with warm gold and cream tones, soft directional luxury lighting, high-end fashion boutique atmosphere, opulent',
  dynamic:   'bold vibrant deep purple to hot magenta energy gradient, diagonal light rays, premium modern streetwear commercial energy, vivid and powerful',
  ecommerce: 'clean fresh sky blue to white gradient, soft even product photography lighting, modern online store aesthetic, bright and inviting',
}

const BG_CATEGORY_HINTS: Partial<Record<ProductCategory, string>> = {
  fragrance:  ', delicate scattered white rose petals, soft bokeh champagne bubbles, romantic luxury spa ambiance',
  cosmetics:  ', blush pink and white marble accents, clean beauty editorial aesthetic, soft diffused natural light',
  jewelry:    ', deep black velvet fabric texture in foreground, single dramatic rim spotlight, luxurious dark studio',
  watch:      ', polished brushed chrome and dark leather texture bokeh, precision engineering atmosphere',
  tech:       ', clean minimal light grey abstract geometry in bokeh, innovative technology feel, cool tones',
  footwear:   ', subtle urban concrete texture bokeh, dynamic energy lines, sport-luxury brand feeling',
}

export function buildBackgroundPrompt(
  category: ProductCategory,
  style: string,
  brandName: string,
  orientation: 'landscape' | 'portrait' = 'landscape',
): string {
  const styleCtx  = BG_STYLES[style] ?? BG_STYLES['ecommerce']
  const catHint   = BG_CATEGORY_HINTS[category] ?? ''
  const orientHint = orientation === 'portrait'
    ? 'Vertical portrait composition, rich atmospheric texture fills entire frame, vignette edges.'
    : 'Wide horizontal composition, gradient flows left (darker) to right (lighter), ideal for two-column email banner.'
  return `${BG_QUALITY}. ${styleCtx}${catHint}. ${orientHint} Premium backdrop for ${brandName || 'brand'} e-commerce email advertisement.`
}
