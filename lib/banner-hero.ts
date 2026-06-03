import type { ProductCategory } from './product-shots'

export type BannerStyleId =
  | 'premium-studio'
  | 'model'
  | 'pedestal'
  | 'flat-lay'
  | 'lifestyle'
  | 'campaign'

export interface BannerStyleDef {
  id: BannerStyleId
  name: string
  description: string
  previewImage: string
  accentColor: string
  icon: string
}

export const BANNER_HERO_STYLES: BannerStyleDef[] = [
  {
    id: 'premium-studio',
    name: 'Premium Studio',
    description: 'Sinematik stüdyo, dramatik ışık ve temiz zemin',
    previewImage: '/templates/email-blackfriday.jpeg',
    accentColor: '#4470ff',
    icon: '🎬',
  },
  {
    id: 'model',
    name: 'Model Üzerinde',
    description: 'Profesyonel model ürünü kullanıyor veya giyiyor',
    previewImage: '/templates/email-indirim.jpeg',
    accentColor: '#9f7afa',
    icon: '👤',
  },
  {
    id: 'pedestal',
    name: 'Premium Pedestal',
    description: 'Mermer kaide, ambient ışık ve lüks atmosfer',
    previewImage: '/templates/email-premium.jpeg',
    accentColor: '#c9a227',
    icon: '🏛️',
  },
  {
    id: 'flat-lay',
    name: 'Flat Lay',
    description: 'Kuşbakışı düzenleme, mermer yüzey ve aksesuarlar',
    previewImage: '/templates/email-minimal.jpeg',
    accentColor: '#22c97a',
    icon: '🗺️',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Outdoor',
    description: 'Doğal ışık, gerçekçi ortam ve lifestyle anlatı',
    previewImage: '/templates/email-sepetterk.jpeg',
    accentColor: '#f0a020',
    icon: '🌿',
  },
  {
    id: 'campaign',
    name: 'Campaign Banner',
    description: 'Güçlü gradient, kampanya enerjisi ve ticari etki',
    previewImage: '/templates/email-yeniurun.jpeg',
    accentColor: '#e84545',
    icon: '⚡',
  },
]

// ─── Preservation clause (always injected first) ──────────────────────────────

const preserve = (productName: string) =>
  `This is a product image editing task. The ${productName || 'product'} in the uploaded image must remain COMPLETELY UNCHANGED: exact same colors, same design details, same logo, same materials, same proportions, same textures, same shape. Do not alter the product in any way.`

const quality =
  'Ultra-realistic 8K commercial advertising photography. Professional studio lighting. Award-winning brand advertisement quality. Photorealistic. No text, no watermarks, no added logos. Sharp product focus.'

// ─── Category × Style prompt matrix ──────────────────────────────────────────

type StyleMatrix = Record<BannerStyleId, Record<ProductCategory, string>>

const SCENE_MATRIX: StyleMatrix = {
  'premium-studio': {
    footwear:
      'Place the shoes in a ultra-clean professional photography studio. Pure white seamless backdrop. Single dramatic overhead spotlight creating a sharp pool of light. Shoes are the absolute hero, slightly elevated on a clear acrylic platform. Perfect soft shadow beneath.',
    eyewear:
      'Place the glasses on a pristine white studio surface. Clean minimalist backdrop. Single clean side spotlight. Glasses casting a perfect subtle shadow. Apple-level product photography studio.',
    watch:
      'Place the watch on a dark polished studio surface. Deep dark studio backdrop. Single precision spotlight from upper-right hitting the dial. Perfect reflection in the polished surface. Rolex commercial quality.',
    fragrance:
      'Place the perfume bottle on a clean white marble surface in minimalist studio. Soft diffused lighting. Scattered white petals and soft bokeh. CHANEL commercial studio photography.',
    apparel:
      'Display the garment perfectly on an invisible mannequin in a pure white studio. Even soft box lighting from both sides. Every fabric detail, stitching and design element clearly visible.',
    bag:
      'Place the bag on a clean light grey studio surface. Minimalist seamless backdrop. Perfect two-light studio setup. Clean commercial fashion photography.',
    cosmetics:
      'Place the cosmetic product on a white marble studio surface. Soft diffused overhead light. Pristine clean minimal background. Premium beauty brand photography.',
    tech:
      'Place the device in an ultra-clean minimalist studio on a grey gradient surface. Floating feel with a subtle glowing reflection below. Apple-style product photography.',
    jewelry:
      'Place the jewelry piece on black velvet in a dark studio. Single dramatic spotlight creating perfect sparkle. Deep dark premium backdrop.',
    product:
      'Place the product in a professional studio. Clean seamless background. Dramatic commercial lighting. Product as the hero.',
  },

  model: {
    footwear:
      'A professional athlete model is wearing these exact shoes. Dynamic mid-run or mid-jump action in an urban concrete or stadium environment. Shoes sharply in focus. Cinematic sports commercial quality.',
    eyewear:
      'A confident professional model is wearing these glasses. Editorial fashion portrait. Clean studio or modern urban backdrop. Vogue-quality portrait lighting.',
    watch:
      'An elegant model is wearing the watch. Sophisticated close-up of the wrist in a luxury setting. Lifestyle or business context. Premium watch advertisement.',
    fragrance:
      'A glamorous model is holding or posing beside the perfume bottle. CHANEL or Dior campaign quality. Soft ethereal lighting. Luxury fragrance advertisement.',
    apparel:
      'A professional fashion model is confidently wearing this exact garment. Appropriate setting for the clothing style. Premium fashion brand campaign quality.',
    bag:
      'A stylish model is carrying this bag in an upscale urban setting or clean studio. Fashion editorial quality. Aspirational lifestyle commercial.',
    cosmetics:
      'A beautiful model is using or showcasing this product. Clean beauty editorial lighting. Cosmetics brand campaign quality.',
    tech:
      'A professional lifestyle model is naturally using this device in a premium home or office setting. Tech brand commercial quality.',
    jewelry:
      'An elegant model is wearing this jewelry piece. Luxury close-up shot. Beautiful lighting on the jewelry. High fashion magazine quality.',
    product:
      'A confident lifestyle model is naturally showcasing this product. Premium brand advertisement quality.',
  },

  pedestal: {
    footwear:
      'Place the shoes on a premium white Italian marble circular pedestal. Warm ambient golden glow from below. Minimal luxury background with soft gradient. Lush tropical leaf shadow on the wall. Gallery exhibition presentation.',
    eyewear:
      'Place the glasses on a sleek marble pedestal or clean glass stand. Warm side lighting. Minimalist luxury boutique atmosphere.',
    watch:
      'Place the watch on a dark polished stone pedestal. Dramatic single spotlight from above. Deep luxury atmosphere. Rolex display case quality.',
    fragrance:
      'Place the perfume bottle on an ornate marble platform. Warm luxury lighting. Silk fabric draped nearby. Crystal refractions. Ultra-luxury perfume advertisement.',
    apparel:
      'Display the folded or rolled garment on a clean stone or marble pedestal. Premium retail display quality.',
    bag:
      'Place the bag on a marble or stone pedestal in a luxury boutique setting. Warm ambient lighting. Premium fashion house display.',
    cosmetics:
      'Place the cosmetic product on a clean rose quartz or white marble pedestal. Soft pastel lighting. Premium beauty brand retail display.',
    tech:
      'Place the device on a sleek dark stone or acrylic pedestal. Cool blue accent lighting. Premium technology product display.',
    jewelry:
      'Place the jewelry on a rich velvet-covered pedestal or display stand. Single dramatic spotlight. Luxury jeweler showcase quality.',
    product:
      'Place the product on a premium marble or stone pedestal. Luxury ambient lighting. Gallery or boutique display setting.',
  },

  'flat-lay': {
    footwear:
      'Top-down birds-eye flat lay. The shoes centered on clean white marble. Surrounded by artfully arranged complementary items: folded denim, small green plants, sunglasses, car keys. Perfect professional flat lay commercial photography.',
    eyewear:
      'Top-down flat lay. Glasses on clean white linen or marble. Surrounded by minimalist lifestyle props: small plant, coffee, watch, neutral accessories. Editorial flat lay quality.',
    watch:
      'Top-down flat lay. Watch as the centerpiece on dark leather or grey linen. Surrounded by premium lifestyle items: leather wallet, cufflinks, pen, folded pocket square. Luxury men\'s magazine editorial.',
    fragrance:
      'Top-down flat lay. Perfume bottle on white marble. Surrounding: scattered rose petals, small crystals, silk ribbon, dried flowers, pearl beads. Luxury beauty flat lay editorial.',
    apparel:
      'Top-down flat lay. Garment perfectly laid flat on clean surface. Coordinated accessories and items styled around it. Fashion editorial flat lay.',
    bag:
      'Top-down flat lay. Bag open or positioned as the centerpiece. Surrounding: sunglasses, perfume, wallet, silk scarf, flowers. Luxury lifestyle flat lay editorial.',
    cosmetics:
      'Top-down flat lay. Product as the hero on white marble. Surrounding: rose petals, small green leaves, other complementary beauty products, pearl details. Premium beauty brand flat lay.',
    tech:
      'Top-down flat lay. Device centered on clean light surface. Surrounding: earphones, stylish pen, minimal desk accessories, small succulent. Modern tech lifestyle flat lay.',
    jewelry:
      'Top-down flat lay. Jewelry piece on white velvet or marble. Surrounding: scattered small diamonds or crystals, silk ribbon, rose petals. Luxury jewelry editorial.',
    product:
      'Top-down flat lay. Product centered on clean surface. Artfully arranged complementary lifestyle props. Professional commercial flat lay photography.',
  },

  lifestyle: {
    footwear:
      'Authentic outdoor lifestyle. Person actively wearing these shoes during golden hour: running in a park, walking on urban cobblestones, or standing on a rooftop with city skyline. Natural warm light. Candid premium lifestyle photography.',
    eyewear:
      'Authentic outdoor lifestyle. Person wearing these glasses on a sunny day: outdoor cafe terrace, beach promenade, or city street. Warm natural light. Candid premium lifestyle photography.',
    watch:
      'Aspirational outdoor lifestyle. Person wearing watch during a premium outdoor moment: sailing deck, golf course, rooftop meeting, mountain trail. Warm natural lifestyle photography.',
    fragrance:
      'Luxury lifestyle. Perfume bottle in a beautiful morning bathroom with natural window light, or elegant dressing table. Aspirational daily luxury routine.',
    apparel:
      'Authentic lifestyle. Person wearing the garment in a real outdoor premium moment: morning coffee walk, weekend market, beach, hiking trail. Candid natural light lifestyle photography.',
    bag:
      'Aspirational lifestyle. Person carrying the bag in authentic upscale moment: luxury shopping street, airport departure, rooftop restaurant. Warm authentic photography.',
    cosmetics:
      'Lifestyle beauty. Product in a beautiful morning routine: sunny bathroom vanity, outdoor terrace beauty ritual. Warm natural light. Authentic luxury lifestyle.',
    tech:
      'Lifestyle tech. Device used naturally in beautiful outdoor setting: rooftop cafe, park bench, modern outdoor workspace. Natural candid technology lifestyle photography.',
    jewelry:
      'Luxury outdoor lifestyle. Jewelry naturally worn in aspirational moment: golden hour beach, garden party, elegant outdoor event. Warm beautiful natural light.',
    product:
      'Premium outdoor lifestyle. Product naturally integrated into aspirational daily life. Warm authentic lifestyle photography.',
  },

  campaign: {
    footwear:
      'Bold high-energy campaign. Shoes dramatically suspended mid-air against a vibrant gradient background (deep electric blue to purple, or red to orange). Dynamic diagonal composition. Explosive energy. Nike/Adidas campaign level impact.',
    eyewear:
      'Bold fashion campaign. Glasses against a striking gradient or solid bold color background. Graphic design quality. Strong visual impact. Fashion brand campaign energy.',
    watch:
      'Luxury campaign. Watch against a dramatic dark gradient with gold/copper accent light rays. Premium commercial impact. Rolex/Omega campaign aesthetic.',
    fragrance:
      'Luxury fragrance campaign. Bottle on a dramatic dark background with ethereal light rays, iridescent color gradients. CHANEL/Dior campaign graphic impact.',
    apparel:
      'Bold fashion campaign. Garment against a striking bold color or gradient background. Strong graphic commercial impact. Campaign poster quality.',
    bag:
      'Fashion campaign. Bag against a bold vibrant background. Strong graphic composition. Premium fashion house campaign quality.',
    cosmetics:
      'Beauty campaign. Product against a bold gradient or editorial background. Striking visual impact. Major beauty brand campaign aesthetic.',
    tech:
      'Tech campaign. Device against a dramatic dark background with colored light streaks or gradient. Apple/Samsung product campaign graphic impact.',
    jewelry:
      'Luxury campaign. Jewelry against a deep dramatic background with dramatic lighting. Bold visual impact. Luxury brand campaign poster quality.',
    product:
      'Bold commercial campaign. Product against a vibrant gradient background. Strong visual impact. Premium brand campaign quality.',
  },
}

// ─── Orientation hints ─────────────────────────────────────────────────────────

const ORIENTATION_HINTS = {
  '16:9':  'Wide cinematic landscape composition (16:9). Product dominates the center-right, atmospheric depth on the left. Perfect for email hero banner.',
  '3:4':   'Vertical portrait composition (3:4). Product fills the frame with presence. Perfect for mobile email and story format.',
  '1:1':   'Perfect square composition (1:1). Product boldly centered. Dramatic symmetrical setup. Instagram-ready premium shot.',
}

// ─── Main prompt builder ───────────────────────────────────────────────────────

export function buildBannerHeroPrompt(
  style: BannerStyleId,
  category: ProductCategory,
  productName: string,
  brandName: string,
  aspectRatio: '16:9' | '3:4' | '1:1',
): string {
  const sceneMatrix = SCENE_MATRIX[style]
  const scene = sceneMatrix[category] ?? sceneMatrix['product']
  const orientation = ORIENTATION_HINTS[aspectRatio]
  return `${preserve(productName || category)} ${scene} ${orientation} ${quality}`
}
