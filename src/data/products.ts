export interface Product {
  slug: string
  stripePriceId: string
  vatRate: number
  inStock: boolean
  images: string[]
  name: {
    sv: string
    en: string
  }
  description: {
    sv: string
    en: string
  }
}

// Placeholder catalog entry — replace stripePriceId with a real Stripe Price
// object once the Stripe account and Price objects exist (Phase 1).
export const products: Product[] = [
  {
    slug: 'opinel-svampkniv',
    stripePriceId: 'price_REPLACE_ME',
    vatRate: 0.25,
    inStock: true,
    images: [],
    name: {
      sv: 'Opinel svampkniv',
      en: 'Opinel mushroom knife',
    },
    description: {
      sv: 'Klassisk fällkniv för svampplockning, med böjt blad och borste.',
      en: 'Classic folding knife for mushroom foraging, with a curved blade and brush.',
    },
  },
]
