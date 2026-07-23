import placeholderImage from '../assets/products/placeholder.svg'

export interface Product {
  slug: string
  stripePriceId: string
  vatRate: number
  inStock: boolean
  images: [string, ...string[]]
  name: {
    sv: string
    en: string
  }
  description: {
    sv: string
    en: string
  }
}

// Placeholder catalog — replace stripePriceId with a real Stripe Price
// object, and images with real product photos, once Phase 1 is done.
export const products: Product[] = [
  {
    slug: 'opinel-svampkniv',
    stripePriceId: 'price_REPLACE_ME_opinel_knife',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Opinel svampkniv',
      en: 'Opinel mushroom knife',
    },
    description: {
      sv: 'Klassisk fällkniv för svampplockning, med böjt blad och borste.',
      en: 'Classic folding knife for mushroom foraging, with a curved blade and brush.',
    },
  },
  {
    slug: 'flatad-svampkorg',
    stripePriceId: 'price_REPLACE_ME_basket',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Flätad svampkorg',
      en: 'Woven mushroom basket',
    },
    description: {
      sv: 'Handflätad korg i naturmaterial, perfekt för att bära hem dagens fynd.',
      en: "Hand-woven basket in natural material, perfect for carrying home the day's finds.",
    },
  },
  {
    slug: 'torkad-kantarell',
    stripePriceId: 'price_REPLACE_ME_dried_chanterelle',
    vatRate: 0.12,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Torkad kantarell',
      en: 'Dried chanterelle',
    },
    description: {
      sv: 'Solmogen kantarell, skonsamt torkad för att bevara smak och arom.',
      en: 'Sun-ripened chanterelle, gently dried to preserve flavor and aroma.',
    },
  },
  {
    slug: 'odlingskit-ostronskivling',
    stripePriceId: 'price_REPLACE_ME_growing_kit',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Odlingskit – ostronskivling',
      en: 'Growing kit – oyster mushroom',
    },
    description: {
      sv: 'Enkelt odlingskit för att skörda egna ostronskivlingar hemma på köksbänken.',
      en: 'Simple growing kit for harvesting your own oyster mushrooms at home on the kitchen counter.',
    },
  },
  {
    slug: 'svampboken-faltguide',
    stripePriceId: 'price_REPLACE_ME_book',
    vatRate: 0.06,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Svampboken – en fälthandbok',
      en: 'The Mushroom Book – a field guide',
    },
    description: {
      sv: 'Grundlig guide till Nordens matsvampar, med tips för nybörjare och erfarna plockare.',
      en: "A thorough guide to the Nordic region's edible mushrooms, with tips for beginners and experienced foragers alike.",
    },
  },
  {
    slug: 'tygkasse-med-tryck',
    stripePriceId: 'price_REPLACE_ME_tote',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Tygkasse med tryck',
      en: 'Printed canvas tote',
    },
    description: {
      sv: 'Handtryckt tygkasse i bomullscanvas, designad och tryckt för hand av Kristian och Eira.',
      en: 'Hand-printed cotton canvas tote, designed and printed by hand by Kristian and Eira.',
    },
  },
]
